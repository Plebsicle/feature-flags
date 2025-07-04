import express from 'express'
import prisma from '@repo/db';
import { 
    updateFeatureFlagBodySchema, 
    updateFlagRuleBodySchema, 
    updateFlagRolloutBodySchema,
    updateEnvironmentBodySchema,
    validateBody 
} from '../../util/zod';
import { convertToMilliseconds } from '../../util/convertToMs';
import { rollout_type, environment_type } from '@repo/db/node_modules/@prisma/client'
import { Conditions } from '@repo/types/rule-config';

import { extractCustomAttributes } from '../../util/extract-attributes';
import { updateEnvironmentRedis, updateFeatureFlagRedis, updateFlagRolloutRedis, updateFlagRulesRedis } from '../../services/redis/redis-flag';
import { Redis_Value, RedisCacheRules } from '../../services/redis/redis-flag'; // Import your Redis types
import { extractAuditInfo } from '../../util/ip-agent';
import { RolloutConfig } from '@repo/types/rollout-config';

interface UpdateFlagControllerDependencies {
    prisma: typeof prisma;
}

class UpdateFlagController {
    private prisma: typeof prisma;

    constructor(dependencies: UpdateFlagControllerDependencies) {
        this.prisma = dependencies.prisma;
    }

    private checkUserAuthorization = (req: express.Request, res: express.Response): boolean => {
        const userRole = req.session.user?.userRole;
        if (userRole === undefined || userRole === "VIEWER") {
            res.status(403).json({ success: true, message: "Not Authorised" });
            return false;
        }
        return true;
    };

    // Helper function to construct Redis flag data
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

    // 1. UPDATE FEATURE FLAG ROUTE
    updateFeatureFlag = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const parsedBody = updateFeatureFlagBodySchema.parse(req.body);
            req.body = parsedBody;
            if (!this.checkUserAuthorization(req, res)) return;

            const {
                flagId,           // FF
                flagDescription,  // FF
                isActive,         // FF
                tags,
            } = req.body;

            // Get user_id from session
            const user_id = req.session?.user?.userId;
            const { ip, userAgent } = extractAuditInfo(req);

            // Input validation
            if (!flagId) {
                console.log("NO ID");
                 res.status(400).json({
                    success: false,
                    message: "Flag ID is required"
                });
                return;
            }

            // Prepare updates object
            const featureFlagUpdates: { description?: string, is_active?: boolean,tags? : string[]} = {};
            if (flagDescription !== undefined) featureFlagUpdates['description'] = flagDescription;
            if (isActive !== undefined) featureFlagUpdates['is_active'] = isActive;
            if(tags !== undefined) featureFlagUpdates['tags'] = tags

            if (Object.keys(featureFlagUpdates).length === 0) {
                console.log("NO Update");

                res.status(400).json({
                    success: false,
                    message: "No valid fields to update"
                });
                return ;
            }

            const result = await this.prisma.$transaction(async (tx: any) => {
                // Get current values before update
                const currentFeatureFlag = await tx.feature_flags.findUnique({
                    where: { id: flagId },
                    select: { description: true, is_active: true }
                });

                if (!currentFeatureFlag) {
                    throw new Error('Feature flag not found');
                }

                // Create attributes_changed structure
                const attributesChanged: Record<string, { newValue: any, oldValue: any }> = {};
                Object.keys(featureFlagUpdates).forEach(key => {
                    attributesChanged[key] = {
                        newValue: featureFlagUpdates[key as keyof typeof featureFlagUpdates],
                        oldValue: currentFeatureFlag?.[key as keyof typeof currentFeatureFlag]
                    };
                });

                // Update feature flag
                const updatedFlag  = await tx.feature_flags.update({
                    where: { id: flagId },
                    data: featureFlagUpdates
                });

                // Create audit log
                const organisation_id = req.session.user?.userOrganisationId;
                await tx.audit_logs.create({
                    data: {
                        organisation_id: organisation_id,
                        user_id: user_id || null,
                        action: 'UPDATE',
                        resource_type: 'FEATURE_FLAG',
                        resource_id: flagId,
                        attributes_changed: attributesChanged,
                        ip_address: ip,
                        user_agent: userAgent
                    }
                });

                return { updated: true ,updatedFlag  };
            });

            // Get complete flag data for Redis update
            const redisFlagData = await this.constructRedisFlagData(flagId);
            const orgSlug = req.session.user?.userOrganisationSlug!;
            
            // Update Redis for all environments of this f
            for (const envData of redisFlagData) {
                // Determine environment from your data structure
                await updateFeatureFlagRedis(orgSlug, result.updatedFlag.key,envData.environment, envData,result.updatedFlag.flag_type);
            }
        
            res.status(200).json({
                success: true,
                message: "Feature flag updated successfully",
                data: result
            });

        } catch (error) {
            console.error('Error updating feature flag:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Internal Server Error"
            });
        }
    };

    // 2. UPDATE FLAG RULE ROUTE
    updateFlagRule = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            console.log(req.body);
            const parsedBody = validateBody(updateFlagRuleBodySchema,req,res);
            req.body = parsedBody;
            console.log(req.body);
            if (!this.checkUserAuthorization(req, res)) return;

            const {
                ruleId,       // FR
                description,  // FR
                conditions,       // FR
                name,         // FR
                is_enabled,        // FR
                flag_environment_id,      // For audit logging
            } = req.body;
            console.log(req.body);

            const ruleName = name;
            const flagRuleId = ruleId;
            const ruleDescription = description;
            const environment_id  = flag_environment_id;
            const isEnabled = is_enabled;
            const user_id = req.session?.user?.userId;
            
            const { ip, userAgent } = extractAuditInfo(req);

            const env = await this.prisma.flag_environments.findUnique({
                where : {
                    id : environment_id
                },
                include : {
                    flag : true
                }
            });

            if(!env){
                res.status(400).json({success : true, message : "Incorrect Env ID"});
                return;
            }

            const flag_id = env?.flag.id
            const flagData = await this.prisma.feature_flags.findUnique({
                where : {
                    id : flag_id
                }
            });

            if(!flagData){
                res.status(401).json({success : false, message : "No Flag Found" });
                return;
            }

            console.log(conditions);
            // Extract custom attributes from conditions if present
            const customAttributes = conditions ? extractCustomAttributes(conditions as Conditions) : [];
            console.log(customAttributes);
            // Prepare updates object
            const flagRuleUpdates: {
                description?: string,
                conditions?: Record<string, any>,
                name?: string,
                is_enabled?: boolean
            } = {};

            if (ruleDescription !== undefined) flagRuleUpdates['description'] = ruleDescription;
            if (conditions !== undefined) flagRuleUpdates['conditions'] = conditions;
            if (ruleName !== undefined) flagRuleUpdates['name'] = ruleName;
            if (isEnabled !== undefined) flagRuleUpdates['is_enabled'] = isEnabled;

            if (Object.keys(flagRuleUpdates).length === 0) {
                res.status(400).json({
                    success: false,
                    message: "No valid fields to update"
                });
                return ;
            }

            const result = await this.prisma.$transaction(async (tx: any) => {
                // Get current values before update
                const currentFlagRule = await tx.flag_rules.findUnique({
                    where: { id: flagRuleId },
                    select: {
                        description: true,
                        conditions: true,
                        name: true,
                        is_enabled: true,
                        flag_environment: {
                            include : {
                                flag : true
                            }
                        }
                    }
                });

                if (!currentFlagRule) {
                    throw new Error('Flag rule not found');
                }

                // Use flagId from the rule relation

                // Create attributes_changed structure
                const attributesChanged: Record<string, { newValue: any, oldValue: any }> = {};
                Object.keys(flagRuleUpdates).forEach(key => {
                    attributesChanged[key] = {
                        newValue: flagRuleUpdates[key as keyof typeof flagRuleUpdates],
                        oldValue: currentFlagRule?.[key as keyof typeof currentFlagRule]
                    };
                });

                // Update flag rule
                await tx.flag_rules.update({
                    where: { id: flagRuleId },
                    data: flagRuleUpdates
                });

                // Create audit log
                const organisation_id = req.session.user?.userOrganisationId;
                await tx.audit_logs.create({
                    data: {
                        organisation_id: organisation_id,
                        user_id: user_id || null,
                        action: 'UPDATE',
                        resource_type: 'FLAG_RULE',
                        resource_id: flagRuleId,
                        attributes_changed: attributesChanged,
                        environment: env.environment || null,
                        ip_address: ip,
                        user_agent: userAgent
                    }
                });

                return { updated: true,currentFlagRule };
            });

            // Get complete flag data for the specific environment
            const redisFlagData = await this.constructRedisFlagData(flag_id, env.environment);
            const orgSlug = req.session.user?.userOrganisationSlug!;
            
            if (redisFlagData.length > 0) {
                await updateFlagRulesRedis(orgSlug, flagData.key, env.environment, redisFlagData[0],result.currentFlagRule.flag_environment.flag.flag_type);
            }

            res.status(200).json({
                success: true,
                message: "Flag rule updated successfully",
                data: result
            });

        } catch (error) {
            console.error('Error updating flag rule:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Internal Server Error"
            });
        }
    };

    // 3. UPDATE FLAG ROLLOUT ROUTE
    updateFlagRollout = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const parsedBody = validateBody(updateFlagRolloutBodySchema,req,res);
            req.body = parsedBody;
            
            if (!this.checkUserAuthorization(req, res)) return;

            let {
                rollout_type,     // FRout
                rollout_config,   // FRout
                environment_id
            } = req.body;
            console.log(req.body);
            // Get user_id from session
            const user_id = req.session?.user?.userId;
            const { ip, userAgent } = extractAuditInfo(req);

            const flagData = await this.prisma.flag_environments.findUnique({
                where : {
                    id : environment_id
                },
                include : {
                    flag : true,
                    rollout : true
                }
            })

            if(!flagData){
                res.status(401).json({success : false, message : "No Flag Found" });
                return;
            }

            // Prepare updates object
            const flagRolloutUpdates: { type?: rollout_type, config?: Record<string, any>,updated_at? : Date } = {};
            if (rollout_config !== undefined) flagRolloutUpdates['config'] = rollout_config;
            if (rollout_type !== undefined) flagRolloutUpdates['type'] = rollout_type;

            if (Object.keys(flagRolloutUpdates).length === 0) {
                res.status(400).json({
                    success: false,
                    message: "No valid fields to update"
                });
                return;
            }

            if(flagRolloutUpdates.config){
                if (rollout_config.currentStage) {
                    if (!rollout_config.stages) {
                        const frequencyMs = convertToMilliseconds(rollout_config.frequency);
                        rollout_config.currentStage.nextProgressAt = new Date(
                            new Date(rollout_config.startDate).getTime() + frequencyMs * (rollout_config.currentStage.stage + 1)
                        );
                    } else {
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
                flagRolloutUpdates['config'] = rollout_config;
            }
            flagRolloutUpdates['updated_at'] = new Date();
            const result = await this.prisma.$transaction(async (tx: any) => {
                // Get current values before update
                const currentFlagRollout = await tx.flag_rollout.findUnique({
                    where: { id: flagData.rollout?.id },
                    select: {
                        type: true,
                        config: true,
                        flag_rollout_environment: {
                            select: {
                                flag_id: true,
                                flag : true
                            }
                        }
                    }
                });

                if (!currentFlagRollout) {
                    throw new Error('Flag rollout not found');
                }

                // Create attributes_changed structure
                const attributesChanged: Record<string, { newValue: any, oldValue: any }> = {};
                Object.keys(flagRolloutUpdates).forEach(key => {
                    attributesChanged[key] = {
                        newValue: flagRolloutUpdates[key as keyof typeof flagRolloutUpdates],
                        oldValue: currentFlagRollout?.[key as keyof typeof currentFlagRollout]
                    };
                });

                // Update flag rollout
                await tx.flag_rollout.update({
                    where: { id: flagData.rollout?.id },
                    data: flagRolloutUpdates
                });

                // Create audit log
                const organisation_id = req.session.user?.userOrganisationId;
                await tx.audit_logs.create({
                    data: {
                        organisation_id: organisation_id,
                        user_id: user_id || null,
                        action: 'UPDATE',
                        resource_type: 'FLAG_ROLLOUT',
                        resource_id: flagData.rollout?.id,
                        attributes_changed: attributesChanged,
                        environment: flagData.environment || null,
                        ip_address: ip,
                        user_agent: userAgent
                    }
                });

                return { updated: true , currentFlagRollout};
            });

            // Get complete flag data for the specific environment after update
            const redisFlagData = await this.constructRedisFlagData(flagData.flag.id, flagData.environment);
            const orgSlug = req.session.user?.userOrganisationSlug!;
            
            if (redisFlagData.length > 0) {
                await updateFlagRolloutRedis(orgSlug, flagData.flag.key, flagData.environment, redisFlagData[0],result.currentFlagRollout.flag_rollout_environment.flag.flag_type);
            }

            res.status(200).json({
                success: true,
                message: "Flag rollout updated successfully",
                data: result
            });
            return;
        } catch (error) {
            console.error('Error updating flag rollout:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Internal Server Error"
            });
        }
    };

    updateEnvironment = async (req: express.Request, res: express.Response) => {
        try{
            // Zod validation
            const parsedBody = updateEnvironmentBodySchema.parse(req.body);
            req.body = parsedBody;
            
            if (!this.checkUserAuthorization(req, res)) return;

            const {is_enabled,environment_id,value,default_value} = req.body;
            console.log(req.body);
            // Get environment details before update
            const updateBody : {is_enabled? : boolean ,value? : Record<string,any> , default_value? : Record<string,any> } = {};
            if(is_enabled){
                updateBody["is_enabled" as keyof typeof updateBody] = is_enabled;
            }
            if(value){
                updateBody["value" as keyof typeof updateBody] = value;
            }
            if(default_value){
                updateBody["default_value"as keyof typeof updateBody] = default_value;
            }

            const currentEnv = await this.prisma.flag_environments.findUnique({
                where: { id: environment_id },
                select: {
                    is_enabled: true,
                    environment: true,
                    flag_id: true,
                    flag: {
                        select: {
                            key: true
                        }
                    }
                }
            });

            if (!currentEnv) {
                res.status(404).json({
                    success: false,
                    message: "Environment not found"
                });
                return;
            }

            // validate input
            const updatedEnv = await this.prisma.flag_environments.update({
                where : {
                    id : environment_id
                },
                data : updateBody
                ,select : {
                    id : true,
                    environment : true,
                    flag : true
                }
            });
            
            const { ip, userAgent } = extractAuditInfo(req);
            // Audit Logs
            const organisation_id = req.session.user?.userOrganisationId!;
            const user_id = req.session.user?.userId!;

            const attributesChanged: Record<string, { newValue: any, oldValue: any }> = {};
            attributesChanged["is_enabled"] = {
                newValue : is_enabled,
                oldValue : currentEnv.is_enabled
            }

            await this.prisma.audit_logs.create({
                data : {
                    organisation_id,
                    user_id,
                    action : "UPDATE",
                    resource_type : "FLAG_ENVIRONMENT",
                    resource_id : environment_id,
                    attributes_changed : attributesChanged,
                    environment : updatedEnv.environment,
                    ip_address : ip,
                    user_agent : userAgent
                }
            });

            const redisFlagData = await this.constructRedisFlagData(currentEnv.flag_id, updatedEnv.environment);
            const orgSlug = req.session.user?.userOrganisationSlug!;
            
            if (redisFlagData.length > 0) {
                await updateEnvironmentRedis(orgSlug, updatedEnv.flag.key, updatedEnv.environment, redisFlagData[0],updatedEnv.flag.flag_type);
            }

            res.status(200).json({
                success: true,
                message: "Flag environment updated successfully"
            });

        }
        catch(error){
            console.error('Error updating flag environment:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Internal Server Error"
            });
        }
    }
}

// Instantiate and export the controller
import dbInstance from '@repo/db';

const updateFlagController = new UpdateFlagController({
    prisma: dbInstance
});

export const updateFeatureFlag = updateFlagController.updateFeatureFlag;
export const updateFlagRule = updateFlagController.updateFlagRule;
export const updateFlagRollout = updateFlagController.updateFlagRollout;
export const updateEnvironment = updateFlagController.updateEnvironment;