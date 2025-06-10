import prisma from '@repo/db';
import express from 'express';
import { Conditions } from '@repo/types/rule-config';
import { createFlagBodySchema, createEnvironmentBodySchema } from '../../util/zod';
import { extractCustomAttributes } from '../../util/extract-attributes';
import { insertCustomAttributes } from '../../util/insert-custom-attribute';
import { Redis_Value, RedisCacheRules,setFlag } from '../../services/redis-flag';

export const createFlag = async (req: express.Request, res: express.Response) => {
    try {
        // Zod validation
        const parsedBody = createFlagBodySchema.parse(req.body);
        req.body = parsedBody;

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
            flagName,
            key,
            flagDescription,
            flag_type,
            environment,
            ruleName,
            ruleDescription,
            conditions,
            value,
            default_value, // new attribute
            rollout_type,
            rollout_config,
            tags
        } = req.body;

        // Extract custom attributes from conditions
        const customAttributes = extractCustomAttributes(conditions as Conditions);

        // Input validation/sanitization here (add as needed)

        const result = await prisma.$transaction(async (tx) => {
            // Insert custom attributes first
            await insertCustomAttributes(tx, organisationId, customAttributes);

            // Create feature flag
            const flagCreationResponse = await tx.feature_flags.create({
                data: {
                    flag_type,
                    description: flagDescription,
                    key,
                    name: flagName,
                    value,
                    default_value,
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
                        flag_id: flagCreationResponse.id
                    },
                    select : {
                        id : true
                    }
            });

            // Create flag rule and rollout in parallel (they both depend on environmentFlagResponse)
            const[flagRulesCreation , flagRolloutCreation] = await Promise.all([
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
        const rules : RedisCacheRules[] = [{
            rule_id : result.flagRulesCreation.id,
            conditions,
            is_enabled : result.flagRulesCreation.is_enabled
        }];

        const valueObject : Redis_Value = {
           flagId : result.flagCreationResponse.id,
           is_active : result.flagCreationResponse.is_active,
           value,
           default_value,
           rules,
           rollout_config : result.flagRolloutCreation.config
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
        const parsedBody = createEnvironmentBodySchema.parse(req.body);
        req.body = parsedBody;
        
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
            conditions,
            rollout_type,
            rollout_config
        } = req.body;

        // Extract custom attributes from conditions
        const customAttributes = extractCustomAttributes(conditions as Conditions);

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
            // Insert custom attributes first
            await insertCustomAttributes(tx, organisationId, customAttributes);

            // Parallel execution of independent operations
            const environmentFlagResponse = await tx.flag_environments.create({
                    data: {
                        environment,
                        flag_id: flag_id
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
           is_active : flagData.is_active,
           value : flagData.value as {"value" : any},
           default_value : flagData.default_value as {"value" : any},
           rules,
           rollout_config : result.flagRolloutCreation.config
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