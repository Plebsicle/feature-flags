import express from 'express'
import prisma from '@repo/db';
import { rollout_type } from '@repo/db/node_modules/@prisma/client'
import { Conditions } from '@repo/types/rule-config';
import { updateFeatureFlagBodySchema, updateFlagRuleBodySchema, updateFlagRolloutBodySchema } from '../../util/zod';
import { extractCustomAttributes } from '../../util/extract-attributes';
import { insertCustomAttributes } from '../../util/insert-custom-attribute';
import { refreshFlagTTL, setFlag, updateEnvironmentRedis, updateFeatureFlagRedis, updateFlagRolloutRedis, updateFlagRulesRedis } from '../../services/redis-flag';

// Helper function to extract IP and User Agent
const extractAuditInfo = (req: express.Request) => {
    const rawIp = req.headers['x-forwarded-for'];
    const ip = Array.isArray(rawIp) ? rawIp[0].split(',')[0] : (rawIp || req.socket.remoteAddress || '').split(',')[0];
    
    const rawUserAgent = req.headers['x-user-agent'] || req.headers['user-agent'];
    const userAgent = Array.isArray(rawUserAgent) ? rawUserAgent[0] : rawUserAgent || null;
    
    return { ip, userAgent };
};


// 1. UPDATE FEATURE FLAG ROUTE
export const updateFeatureFlag = async (req: express.Request, res: express.Response) => {
    try {
        // Zod validation
        const parsedBody = updateFeatureFlagBodySchema.parse(req.body);
        req.body = parsedBody;

        const role = req.session.user?.userRole;
         if(role === "VIEWER"){
            res.status(401).json({success : false,message : "Role is not Sufficient"});
            return;
        }

        const {
            flagId,           // FF
            flagDescription,  // FF
            isActive,         // FF
            tags,
            value, // new
            default_value // new
        } = req.body;

        // Get user_id from session
        const user_id = req.session?.user?.userId;
        const { ip, userAgent } = extractAuditInfo(req);

        // Input validation
        if (!flagId) {
             res.status(400).json({
                success: false,
                message: "Flag ID is required"
            });
            return;
        }

        // Prepare updates object
        const featureFlagUpdates: { description?: string, is_active?: boolean,tags? : string[],value? : Record<string,any> , default_value? : Record<string,any>} = {};
        if (flagDescription !== undefined) featureFlagUpdates['description'] = flagDescription;
        if (isActive !== undefined) featureFlagUpdates['is_active'] = isActive;
        if(tags !== undefined) featureFlagUpdates['tags'] = tags
        if(value !== undefined) featureFlagUpdates['value'] = value
        if(default_value !== undefined) featureFlagUpdates['default_value'] = default_value

        if (Object.keys(featureFlagUpdates).length === 0) {
            res.status(400).json({
                success: false,
                message: "No valid fields to update"
            });
            return ;
        }

        const result = await prisma.$transaction(async (tx) => {
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

        const orgSlug = req.session.user?.userOrganisationSlug!;

        await updateFeatureFlagRedis(orgSlug , result.updatedFlag.key ,isActive,value,default_value);
    
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
export const updateFlagRule = async (req: express.Request, res: express.Response) => {
    try {
        // Zod validation
        const parsedBody = updateFlagRuleBodySchema.parse(req.body);
        req.body = parsedBody;
        
        const role = req.session.user?.userRole;
         if(role === "VIEWER"){
            res.status(401).json({success : false,message : "Role is not Sufficient"});
            return;
        }

        const {
            flag_id ,
            flagRuleId,       // FR
            ruleDescription,  // FR
            conditions,       // FR
            ruleName,         // FR
            isEnabled,        // FR
            environment,      // For audit logging
        } = req.body;

        // Get user_id and organisation_id from session
        const user_id = req.session?.user?.userId;
        const organisationId = req.session?.user?.userOrganisationId!;
        const { ip, userAgent } = extractAuditInfo(req);

        // Input validation
        if (!flagRuleId || !flag_id) {
            res.status(400).json({
                success: false,
                message: "ID is required"
            });
            return ;
        }

        const flagData = await prisma.feature_flags.findUnique({
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

        const result = await prisma.$transaction(async (tx) => {
            // Insert custom attributes first if conditions are being updated
            if (customAttributes.length > 0) {
                await insertCustomAttributes(tx, organisationId, customAttributes);
            }

            // Get current values before update
            const currentFlagRule = await tx.flag_rules.findUnique({
                where: { id: flagRuleId },
                select: {
                    description: true,
                    conditions: true,
                    name: true,
                    is_enabled: true,
                    flag_environment: {
                        select: {
                            flag_id: true
                        }
                    }
                }
            });

            if (!currentFlagRule) {
                throw new Error('Flag rule not found');
            }

            // Use flagId from the rule relation
            const actualFlagId = currentFlagRule.flag_environment.flag_id;

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
                    environment: environment || null,
                    ip_address: ip,
                    user_agent: userAgent
                }
            });

            return { updated: true };
        });

        const orgSlug = req.session.user?.userOrganisationSlug!;
        await updateFlagRulesRedis(orgSlug,flagData.key,environment,flagRuleId,conditions,isEnabled);

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
export const updateFlagRollout = async (req: express.Request, res: express.Response) => {
    try {
        // Zod validation
        const parsedBody = updateFlagRolloutBodySchema.parse(req.body);
        req.body = parsedBody;
        
        const role = req.session.user?.userRole;
         if(role === "VIEWER"){
            res.status(401).json({success : false,message : "Role is not Sufficient"});
            return;
        }

        const {
            flag_id,
            rollout_id,       // FRout
            rollout_type,     // FRout
            rollout_config,   // FRout
            environment,      // For audit logging
        } = req.body;

        // Get user_id from session
        const user_id = req.session?.user?.userId;
        const { ip, userAgent } = extractAuditInfo(req);

        // Input validation
        if (!rollout_id || !flag_id) {
            res.status(400).json({
                success: false,
                message: "ID is required"
            });
            return;
        }

        const flagData = await prisma.feature_flags.findUnique({
            where : {
                id : flag_id
            }
        });

        if(!flagData){
            res.status(401).json({success : false, message : "No Flag Found" });
            return;
        }

        // Prepare updates object
        const flagRolloutUpdates: { type?: rollout_type, config?: Record<string, any> } = {};
        if (rollout_config !== undefined) flagRolloutUpdates['config'] = rollout_config;
        if (rollout_type !== undefined) flagRolloutUpdates['type'] = rollout_type;

        if (Object.keys(flagRolloutUpdates).length === 0) {
            res.status(400).json({
                success: false,
                message: "No valid fields to update"
            });
            return;
        }

        const result = await prisma.$transaction(async (tx) => {
            // Get current values before update
            const currentFlagRollout = await tx.flag_rollout.findUnique({
                where: { id: rollout_id },
                select: {
                    type: true,
                    config: true,
                    flag_rollout_environment: {
                        select: {
                            flag_id: true
                        }
                    }
                }
            });

            if (!currentFlagRollout) {
                throw new Error('Flag rollout not found');
            }

            // Use flagId from the rollout relation
            const actualFlagId = currentFlagRollout.flag_rollout_environment.flag_id;

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
                where: { id: rollout_id },
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
                    resource_id: rollout_id,
                    attributes_changed: attributesChanged,
                    environment: environment || null,
                    ip_address: ip,
                    user_agent: userAgent
                }
            });

            return { updated: true };
        });
        const orgSlug = req.session.user?.userOrganisationSlug!;
        await updateFlagRolloutRedis(orgSlug,flagData.key,environment,rollout_config);

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

export const updateEnvironment = async (req: express.Request, res: express.Response) => {
    try{
        const {is_enabled,environment_id} = req.body;
        // validate input
        const updatedEnv = await prisma.flag_environments.update({
            where : {
                id : environment_id
            },
            data : {
                is_enabled
            },select : {
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
            oldValue : !is_enabled
        }


        await prisma.audit_logs.create({
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
        const orgSlug = req.session.user?.userOrganisationSlug!;
        
        // Update Redis Cache
        await updateEnvironmentRedis(orgSlug,updatedEnv.flag.key,updatedEnv.environment,is_enabled);

        res.status(200).json({
            success: true,
            message: "Flag environment updated successfully"
        });

    }
    catch(error){
        console.error('Error updating flag rollout:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal Server Error"
        });
    }
}