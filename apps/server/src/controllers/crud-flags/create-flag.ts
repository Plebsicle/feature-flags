import prisma from '@repo/db';
import express from 'express';
import { Redis_Value, RedisCacheRules, setFlag } from '../../services/redis/redis-flag';
import { RolloutConfig } from '@repo/types/rollout-config';
import { Prisma } from '@repo/db/client';
import { convertToMilliseconds } from '../../util/convertToMs';
import { updateFlagRulesRedis } from '../../services/redis/redis-flag';
import { environment_type } from '@repo/db/client';
import { Conditions } from '@repo/types';
import { 
    createFlagBodySchema, 
    createEnvironmentBodySchema, 
    addRulesBodySchema,
    validateBody 
} from '../../util/zod';

interface CreateFlagControllerDependencies {
    prisma: typeof prisma;
}




class CreateFlagController {
    private prisma: typeof prisma;

    constructor(dependencies: CreateFlagControllerDependencies) {
        this.prisma = dependencies.prisma;
    }

    private extractIpAndUserAgent = (req: express.Request) => {
        const rawIp = req.headers['x-forwarded-for'];
        const ip = Array.isArray(rawIp) ? rawIp[0].split(',')[0] : (rawIp || req.socket.remoteAddress || '').split(',')[0];
        
        const rawUserAgent = req.headers['x-user-agent'] || req.headers['user-agent'];
        const userAgent = Array.isArray(rawUserAgent) ? rawUserAgent[0] : rawUserAgent || null;
        
        return { ip, userAgent };
    };

       private constructRedisFlagData = async (flagId: string, environment?: environment_type): Promise<Redis_Value[]> => {
        const flagData = await this.prisma.feature_flags.findUnique({
            where: { id: flagId },
            include: {
                environments: {
                    where: environment ? { environment } : {},
                    include: {
                        rules: {
                            orderBy: { created_at: 'asc' }
                        },
                        rollout: true,
                    }
                }
            }
        });

        if (!flagData) {
            throw new Error('Flag not found');
        }
        const environments = flagData.environments;
        const finalData : Redis_Value[] = [];
        for(const environment of environments){
            const rules : RedisCacheRules[] = [];
            environment.rules.forEach((rule: { name: string; id: string; conditions: any; is_enabled: boolean; })=>{
                rules.push({
                    name : rule.name,
                    rule_id : rule.id,
                    conditions : rule.conditions as unknown as Conditions,
                    is_enabled : rule.is_enabled
                });
            });
            const objectToPush : Redis_Value = {
                flagId : flagData.id,
                flag_type : flagData.flag_type,
                environment : environment.environment,
                is_active : flagData.is_active,
                is_environment_active : environment.is_enabled,
                value : environment.value as Record<string,any>,
                default_value : environment.default_value as Record<string,any>,
                rules,
                rollout_config : environment.rollout?.config as unknown as RolloutConfig
            }
            finalData.push(objectToPush);
        }
        return finalData;
    };

    private checkUserAuthorization = (req: express.Request, res: express.Response, requiresNonViewer: boolean = false): boolean => {
        const userRole = req.session.user?.userRole;
        if (userRole === undefined || userRole === "VIEWER") {
            res.status(403).json({ success: true, message: "Not Authorised" });
            return false;
        }
        
        if (requiresNonViewer && userRole === "VIEWER") {
            res.status(401).json({ success: false, message: "Role is not Sufficient" });
            return false;
        }
        
        return true;
    };

    createFlag = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const validatedBody = validateBody(createFlagBodySchema, req, res);
            if (!validatedBody) return;

            if (!this.checkUserAuthorization(req, res, true)) return;

            const organisationId = req.session.user?.userOrganisationId!;
            const userId = req.session.user?.userId!;
            
            const { ip, userAgent } = this.extractIpAndUserAgent(req);

            const {
                name,
                key,
                description,
                flag_type,
                environments,
                rules,rollout,
                tags
            } = req.body;
            const {environment,value,default_value} = environments;
            const {type  ,config} = rollout;
            const rollout_type = type;
            let rollout_config = config;
            console.log(req.body);
           if (rollout_config.currentStage) {
            if (!rollout_config.stages) {
                const frequencyMs = convertToMilliseconds(rollout_config.frequency);
                rollout_config.currentStage.nextProgressAt = new Date(
                    new Date(rollout_config.startDate).getTime() + frequencyMs * (rollout_config.currentStage.stage + 1)
                );
                console.log(rollout_config.currentStage.nextProgressAt);
            } else {
                                                                
                    const nextStage = rollout_config.stages.find(
                        //@ts-ignore
                        s => s.stage === rollout_config.currentStage.stage + 1
                    );
                    if (nextStage) {
                        rollout_config.currentStage.nextProgressAt = new Date(nextStage.stageDate);
                    } else {
                        rollout_config.currentStage.nextProgressAt = undefined; // No further stages
                    }
                }
            }

            const result = await this.prisma.$transaction(async (tx : Prisma.TransactionClient) => {
                // Insert custom attributes first

                // Create feature flag
                const flagCreationResponse = await tx.feature_flags.create({
                    data: {
                        flag_type,
                        description: description,
                        key,
                        name: name,
                        organization_id: organisationId,
                        created_by: userId,
                        tags: tags && Array.isArray(tags) ? tags : []
                    },
                    select: {
                        id: true,
                        is_active : true,
                        flag_type :true
                    }
                });

                // Parallel execution of independent operations
                const environmentFlagResponse = await tx.flag_environments.create({
                        data: {
                            environment,
                            flag_id: flagCreationResponse.id,
                            value,
                            default_value
                        },
                        select : {
                            id : true,
                            is_enabled : true
                        }
                });

                // Create flag rule and rollout in parallel (they both depend on environmentFlagResponse)
                const[flagRulesCreation , flagRolloutCreation] = await Promise.all([
                    tx.flag_rules.create({
                        data: {
                            name: rules.name,
                            conditions : rules.conditions,
                            description: rules.description,
                            flag_environment_id: environmentFlagResponse.id
                        },
                        select: {
                            id: true,
                            is_enabled : true,
                            name : true
                        }
                    }),
                    tx.flag_rollout.create({
                        data: {
                            flag_environment_id: environmentFlagResponse.id,
                            config: rollout_config,
                            type: rollout_type
                        },
                        select: {
                            id: true,
                            config : true
                        }
                    })
                ]);
                const organisation_id = req.session.user?.userOrganisationId;
                // Batch insert audit logs - single operation instead of 4 separate ones
                await tx.audit_logs.createMany({
                    data: [
                        {
                            organisation_id: organisation_id,
                            user_id: userId,
                            action: "CREATE",
                            resource_type: "FEATURE_FLAG",
                            resource_id: flagCreationResponse.id,
                            environment,
                            ip_address: ip,
                            user_agent: userAgent
                        },
                        {
                            organisation_id: organisation_id,
                            user_id: userId,
                            environment,
                            ip_address: ip,
                            user_agent: userAgent,
                            action: "CREATE",
                            resource_type: "FLAG_ENVIRONMENT",
                            resource_id : environmentFlagResponse.id
                        },
                        {
                            organisation_id: organisation_id,
                            user_id: userId,
                            environment,
                            ip_address: ip,
                            user_agent: userAgent,
                            action: "CREATE",
                            resource_type: "FLAG_RULE",
                            resource_id : flagRulesCreation.id
                        },
                        {
                            organisation_id: organisation_id,
                            user_id: userId,
                            environment,
                            ip_address: ip,
                            user_agent: userAgent,
                            action: "CREATE",
                            resource_type: "FLAG_ROLLOUT",
                            resource_id : flagRolloutCreation.id
                        }
                    ]
                });
                const response = {flagCreationResponse,environmentFlagResponse,flagRulesCreation,flagRolloutCreation};
                return response;
            });


            const orgSlug = req.session.user?.userOrganisationSlug!;
            const redisRules : RedisCacheRules[] = [{
                name : result.flagRulesCreation.name,
                rule_id : result.flagRulesCreation.id,
                conditions : rules.conditions,
                is_enabled : result.flagRulesCreation.is_enabled
            }];

            const valueObject : Redis_Value = {
               flagId : result.flagCreationResponse.id,
               flag_type : result.flagCreationResponse.flag_type,
               environment,
               is_active : result.flagCreationResponse.is_active,
               is_environment_active : result.environmentFlagResponse.is_enabled ,
               value,
               default_value,
               rules : redisRules,
               rollout_config : result.flagRolloutCreation.config as unknown as RolloutConfig
            }

            await setFlag(orgSlug,  environment, key, valueObject ,flag_type);

            // Send success response
            res.status(201).json({
                success: true,
                message: "Feature flag created successfully",
                flagId: result.flagCreationResponse.id,
                environmentId : result.environmentFlagResponse.id,
                ruleId : result.flagRulesCreation.id,
                rolloutId : result.flagRolloutCreation.id
            });

        } catch (e) {
            console.error('Error creating feature flag:', e);
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    };

    createEnvironment = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const validatedBody = validateBody(createEnvironmentBodySchema, req, res);
            if (!validatedBody) return;

            if (!this.checkUserAuthorization(req, res)) return;

            const userId = req.session.user?.userId!;
            
            const { ip, userAgent } = this.extractIpAndUserAgent(req);

            const {
                flag_id,
                environments,
                description,
                rollout,
                rules
            } = req.body;
            console.log(req.body);

            const environment = environments.environment;
            const value = environments.value;
            const default_value = environments.default_value;
            const ruleName = rules.name;
            const conditions = rules.conditions;
            const ruleDescription = description;
            let rollout_config = rollout.config;
            const rollout_type = rollout.type;

             if (rollout_config.currentStage) {
            if (!rollout_config.stages) {
                const frequencyMs = convertToMilliseconds(rollout_config.frequency);
                rollout_config.currentStage.nextProgressAt = new Date(
                    new Date(rollout_config.startDate).getTime() + frequencyMs * (rollout_config.currentStage.stage + 1)
                );
            }else{                                          
                    const nextStage = rollout_config.stages.find(
                        //@ts-ignore
                        s => s.stage === rollout_config.currentStage.stage + 1
                    );
                    if (nextStage) {
                        rollout_config.currentStage.nextProgressAt = new Date(nextStage.stageDate);
                    } else {
                        rollout_config.currentStage.nextProgressAt = undefined;
                    }
                }
            }

            const flagData = await this.prisma.feature_flags.findUnique({
                where : {
                    id : flag_id
                }
            });

            if(!flagData){
                res.status(401).json({success : false,message : "incorrect flag id" });
                return;
            }

            const result = await this.prisma.$transaction(async (tx : Prisma.TransactionClient) => {
                // Parallel execution of independent operations
                const environmentFlagResponse = await tx.flag_environments.create({
                        data: {
                            environment,
                            flag_id: flag_id,
                            value,
                            default_value
                        }
                });

                // Create flag rule and rollout in parallel (they both depend on environmentFlagResponse)
                const [flagRulesCreation , flagRolloutCreation ] = await Promise.all([
                    tx.flag_rules.create({
                        data: {
                            name: ruleName,
                            conditions,
                            description: ruleDescription,
                            flag_environment_id: environmentFlagResponse.id
                        },
                        select: {
                            id: true,
                            is_enabled : true,
                            name : true
                        }
                    }),
                    tx.flag_rollout.create({
                        data: {
                            flag_environment_id: environmentFlagResponse.id,
                            config: rollout_config,
                            type: rollout_type
                        },
                        select: {
                            id: true,
                            config : true
                        }
                    })
                ]);
                const organisation_id = req.session.user?.userOrganisationId;
                // Batch insert audit logs - single operation instead of separate ones
                await tx.audit_logs.createMany({
                    data: [
                        {
                            organisation_id: organisation_id,
                            user_id: userId,
                            environment,
                            ip_address: ip,
                            user_agent: userAgent,
                            action: "CREATE",
                            resource_type: "FLAG_ENVIRONMENT"
                        },
                        {
                            organisation_id: organisation_id,
                            user_id: userId,
                            environment,
                            ip_address: ip,
                            user_agent: userAgent,
                            action: "CREATE",
                            resource_type: "FLAG_RULE"
                        },
                        {
                            organisation_id: organisation_id,
                            user_id: userId,
                            environment,
                            ip_address: ip,
                            user_agent: userAgent,
                            action: "CREATE",
                            resource_type: "FLAG_ROLLOUT"
                        }
                    ]
                });

                return {environmentFlagResponse,flagRolloutCreation,flagRulesCreation}
            });

            const orgSlug = req.session.user?.userOrganisationSlug!;
            const cacheRules : RedisCacheRules[] = [{
                name : result.flagRulesCreation.name,
                rule_id : result.flagRulesCreation.id,
                conditions,
                is_enabled : result.flagRulesCreation.is_enabled
            }];

            const valueObject : Redis_Value = {
               flagId : flagData.id,
               flag_type : flagData.flag_type,
               environment,
               is_active : flagData.is_active,
               is_environment_active : result.environmentFlagResponse.is_enabled,
               value,
               default_value,
               rules : cacheRules,
               rollout_config : result.flagRolloutCreation.config as unknown as RolloutConfig
            }

            await setFlag(orgSlug, environment , flagData.key , valueObject , flagData.flag_type ); 
            // Send success response
            res.status(201).json({
                success: true,
                message: "Flag Environment created successfully",
                environmentId: result.environmentFlagResponse.id,
                ruleId : result.flagRulesCreation.id,
                rolloutId : result.flagRolloutCreation.id
            });

        } catch (e) {
            console.error('Error Adding New EnvironMent:', e);
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    };  

    addRules = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const validatedBody = validateBody(addRulesBodySchema, req, res);
            if (!validatedBody) return;

            const { ip, userAgent } = this.extractIpAndUserAgent(req);
            const {flag_environment_id , description , conditions , name , is_enabled} = req.body;
            console.log(conditions);
            const environment_id = flag_environment_id;
            const ruleName = name;
            const isEnabled = is_enabled;
            const ruleDescription = description;

            if(!environment_id){
                res.json(400).json({success : false,message : "No Env Id"});
                return;
            }
            const flagDataFromEnv = await this.prisma.flag_environments.findUnique({
                where : {
                    id : environment_id
                },
                select : {
                    flag_id : true,
                    environment : true,
                    flag : {
                        select : {
                            key : true,
                            flag_type : true
                        }
                    }
                }
            });

            if(!flagDataFromEnv){
                res.status(400).json({success : false , message : "Invalid ENV ID"});
                return;
            }


            const ruleCreation = await this.prisma.flag_rules.create({
                data : {
                    flag_environment_id : environment_id,
                    name : ruleName,
                    conditions,
                    description : ruleDescription,
                    is_enabled : isEnabled
                },
                select : {
                    id:true
                }
            });
            const organisation_id = req.session.user?.userOrganisationId!;
            const audit = await this.prisma.audit_logs.create({
                data : {
                    action : "CREATE",
                    resource_type : "FLAG_RULE",
                    environment : flagDataFromEnv.environment,
                    ip_address : ip,
                    organisation_id : organisation_id,
                    user_agent : userAgent,
                    user_id : req.session.user?.userId,
                    resource_id : ruleCreation.id,
                }
            })
            const orgSlug = req.session.user?.userOrganisationSlug!;
            const redisFlagData = await this.constructRedisFlagData(flagDataFromEnv.flag_id,flagDataFromEnv.environment);
            await updateFlagRulesRedis(orgSlug, flagDataFromEnv.flag.key, flagDataFromEnv.environment,  redisFlagData[0],flagDataFromEnv.flag.flag_type);
            res.status(200).json({success : true , message : "Rule Added Succesfully"});
        }
        catch(e){
            console.error(e);
        }
    }
}

// Instantiate and export the controller
import dbInstance from '@repo/db';

const createFlagController = new CreateFlagController({
    prisma: dbInstance
});

export const createFlag = createFlagController.createFlag;
export const createEnvironment = createFlagController.createEnvironment;
export const addRules = createFlagController.addRules;