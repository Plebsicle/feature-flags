import prisma from '@repo/db';
import express from 'express';
import { Redis_Value, RedisCacheRules,setFlag } from '../../services/redis/redis-flag';
import { RolloutConfig } from '@repo/types/rollout-config';

export const createFlag = async (req: express.Request, res: express.Response) => {
    try {
        // Zod validation
        // const parsedBody = createFlagBodySchema.parse(req.body);
        // req.body = parsedBody;
        const userRole = req.session.user?.userRole;
        if(userRole === undefined  || (userRole === "VIEWER")){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        const role = req.session.user?.userRole;
        if(role === "VIEWER"){
            res.status(401).json({success : false,message : "Role is not Sufficient"});
            return;
        }

        const organisationId = req.session.user?.userOrganisationId!;
        const userId = req.session.user?.userId!;
        
        // IP extraction
        const rawIp = req.headers['x-forwarded-for'];
        const ip = Array.isArray(rawIp) ? rawIp[0].split(',')[0] : (rawIp || req.socket.remoteAddress || '').split(',')[0];
        
        // User Agent extraction
        const rawUserAgent = req.headers['x-user-agent'] || req.headers['user-agent'];
        const userAgent = Array.isArray(rawUserAgent) ? rawUserAgent[0] : rawUserAgent || null;

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
        const rollout_config = config;
        console.log(req.body);

        // Input validation/sanitization here (add as needed)

        const result = await prisma.$transaction(async (tx) => {
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
                    is_active : true
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
                        is_enabled : true
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
            rule_id : result.flagRulesCreation.id,
            conditions : rules.conditions,
            is_enabled : result.flagRulesCreation.is_enabled
        }];

        const valueObject : Redis_Value = {
           flagId : result.flagCreationResponse.id,
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


export const createEnvironment = async (req : express.Request , res : express.Response)=>{
    try {
        // Zod validation
        // const parsedBody = createEnvironmentBodySchema.parse(req.body);
        // req.body = parsedBody;
        const userRole = req.session.user?.userRole;
        if(userRole === undefined  || (userRole === "VIEWER")){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        const userId = req.session.user?.userId!;
        const organisationId = req.session.user?.userOrganisationId!;
        
        // IP extraction
        const rawIp = req.headers['x-forwarded-for'];
        const ip = Array.isArray(rawIp) ? rawIp[0].split(',')[0] : (rawIp || req.socket.remoteAddress || '').split(',')[0];
        
        // User Agent extraction
        const rawUserAgent = req.headers['x-user-agent'] || req.headers['user-agent'];
        const userAgent = Array.isArray(rawUserAgent) ? rawUserAgent[0] : rawUserAgent || null;

        const {
            flag_id,
            environment,
            ruleName,
            ruleDescription,
            value,default_value,
            conditions,
            rollout_type,
            rollout_config
        } = req.body;
        console.log(req.body);
        // Input validation/sanitization here (add as needed)

        const flagData = await prisma.feature_flags.findUnique({
            where : {
                id : flag_id
            }
        });

        if(!flagData){
            res.status(401).json({success : false,message : "incorrect flag id" });
            return;
        }

        const result = await prisma.$transaction(async (tx) => {
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
                        is_enabled : true
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
        const rules : RedisCacheRules[] = [{
            rule_id : result.flagRulesCreation.id,
            conditions,
            is_enabled : result.flagRulesCreation.is_enabled
        }];

        const valueObject : Redis_Value = {
           flagId : flagData.id,
           environment,
           is_active : flagData.is_active,
           is_environment_active : result.environmentFlagResponse.is_enabled,
           value,
           default_value,
           rules,
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


export const addRules = async (req : express.Request,res : express.Response) => {
    try{
        const rawIp = req.headers['x-forwarded-for'];
        const ip = Array.isArray(rawIp) ? rawIp[0].split(',')[0] : (rawIp || req.socket.remoteAddress || '').split(',')[0];
        
        // User Agent extraction
        const rawUserAgent = req.headers['x-user-agent'] || req.headers['user-agent'];
        const userAgent = Array.isArray(rawUserAgent) ? rawUserAgent[0] : rawUserAgent || null;

        const {environment_id , ruleDescription , conditions , ruleName , isEnabled} = req.body;
        if(!environment_id){
            res.json(400).json({success : false,message : "No Env Id"});
            return;
        }
        const ruleCreation = await prisma.flag_rules.create({
            data : {
                flag_environment_id : environment_id,
                name : ruleName,
                conditions,
                description : ruleDescription,
                is_enabled : isEnabled
            },
            select : {
                flag_environment : true,
                id:true
            }
        });
        const organisation_id = req.session.user?.userOrganisationId!;
        const audit = await prisma.audit_logs.create({
            data : {
                action : "CREATE",
                resource_type : "FLAG_RULE",
                environment : ruleCreation.flag_environment.environment,
                ip_address : ip,
                organisation_id : organisation_id,
                user_agent : userAgent,
                user_id : req.session.user?.userId,
                resource_id : ruleCreation.id,
            }
        })
        // caching
    }
    catch(e){
        console.error(e);
    }
}