import prisma from '@repo/db';
import express from 'express';
import { DataType } from '@repo/types/attribute-config';
import { Conditions } from '@repo/types/rule-config';

const BASE_ATTRIBUTES = {
  email: { type: 'STRING', description: 'User email address' },
  country: { type: 'STRING', description: 'User country code' },
  region: { type: 'STRING', description: 'User region' },
  ip: { type: 'STRING', description: 'User IP address' },
  userId: { type: 'STRING', description: 'Unique user identifier' },
  timestamp: { type: 'DATE', description: 'Request timestamp' }
} as const;

// Helper function to extract custom attributes from conditions
const extractCustomAttributes = (conditions: Conditions): Array<{ name: string, type: DataType }> => {
    if (!conditions || !Array.isArray(conditions)) {
        return [];
    }
    
    const customAttributes: Array<{ name: string, type: DataType }> = [];
    const baseAttributeNames = Object.keys(BASE_ATTRIBUTES);
    
    conditions.forEach(condition => {
        if (condition.attribute_name && !baseAttributeNames.includes(condition.attribute_name)) {
            customAttributes.push({
                name: condition.attribute_name,
                type: condition.attribute_type
            });
        }
    });
    
    // Remove duplicates
    const uniqueAttributes = customAttributes.filter((attr, index, self) => 
        index === self.findIndex(a => a.name === attr.name)
    );
    
    return uniqueAttributes;
};

// Helper function to insert custom attributes
const insertCustomAttributes = async (tx: any, organizationId: string, customAttributes: Array<{ name: string, type: DataType }>) => {
    if (customAttributes.length === 0) return;
    
    // Use upsert to handle duplicates gracefully
    for (const attr of customAttributes) {
        await tx.organization_attributes.upsert({
            where: {
                organization_id_attribute_name: {
                    organization_id: organizationId,
                    attribute_name: attr.name
                }
            },
            update: {
                updated_at: new Date()
            },
            create: {
                organization_id: organizationId,
                attribute_name: attr.name,
                data_type: attr.type,
                is_custom: true,
                is_required: false,
                description: `Custom attribute: ${attr.name}`
            }
        });
    }
};

export const createFlag = async (req: express.Request, res: express.Response) => {
    try {
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
                    organization_id: organisationId,
                    created_by: userId,
                    tags: tags && Array.isArray(tags) ? tags : []
                },
                select: {
                    id: true
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
                        value,
                        conditions,
                        description: ruleDescription,
                        flag_environment_id: environmentFlagResponse.id
                    },
                    select: {
                        id: true
                    }
                }),
                tx.flag_rollout.create({
                    data: {
                        flag_environment_id: environmentFlagResponse.id,
                        config: rollout_config,
                        type: rollout_type
                    },
                    select: {
                        id: true
                    }
                })
            ]);

            // Batch insert audit logs - single operation instead of 4 separate ones
            await tx.audit_logs.createMany({
                data: [
                    {
                        flag_id: flagCreationResponse.id,
                        user_id: userId,
                        action: "CREATE",
                        resource_type: "FEATURE_FLAG",
                        resource_id: flagCreationResponse.id,
                        environment,
                        ip_address: ip,
                        user_agent: userAgent
                    },
                    {
                        flag_id: flagCreationResponse.id,
                        user_id: userId,
                        environment,
                        ip_address: ip,
                        user_agent: userAgent,
                        action: "CREATE",
                        resource_type: "FLAG_ENVIRONMENT"
                    },
                    {
                        flag_id: flagCreationResponse.id,
                        user_id: userId,
                        environment,
                        ip_address: ip,
                        user_agent: userAgent,
                        action: "CREATE",
                        resource_type: "FLAG_RULE"
                    },
                    {
                        flag_id: flagCreationResponse.id,
                        user_id: userId,
                        environment,
                        ip_address: ip,
                        user_agent: userAgent,
                        action: "CREATE",
                        resource_type: "FLAG_ROLLOUT"
                    }
                ]
            });
            const response = {flagCreationResponse,environmentFlagResponse,flagRulesCreation,flagRolloutCreation};
            return response;
        });

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


export const addEnvironment = async (req : express.Request , res : express.Response)=>{
    try {
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
            value,
            rollout_type,
            rollout_config
        } = req.body;

        // Extract custom attributes from conditions
        const customAttributes = extractCustomAttributes(conditions as Conditions);

        // Input validation/sanitization here (add as needed)

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
            await Promise.all([
                tx.flag_rules.create({
                    data: {
                        name: ruleName,
                        value,
                        conditions,
                        description: ruleDescription,
                        flag_environment_id: environmentFlagResponse.id
                    },
                    select: {
                        id: true
                    }
                }),
                tx.flag_rollout.create({
                    data: {
                        flag_environment_id: environmentFlagResponse.id,
                        config: rollout_config,
                        type: rollout_type
                    },
                    select: {
                        id: true
                    }
                })
            ]);

            // Batch insert audit logs - single operation instead of separate ones
            await tx.audit_logs.createMany({
                data: [
                    {
                        flag_id: flag_id,
                        user_id: userId,
                        environment,
                        ip_address: ip,
                        user_agent: userAgent,
                        action: "CREATE",
                        resource_type: "FLAG_ENVIRONMENT"
                    },
                    {
                        flag_id: flag_id,
                        user_id: userId,
                        environment,
                        ip_address: ip,
                        user_agent: userAgent,
                        action: "CREATE",
                        resource_type: "FLAG_RULE"
                    },
                    {
                        flag_id: flag_id,
                        user_id: userId,
                        environment,
                        ip_address: ip,
                        user_agent: userAgent,
                        action: "CREATE",
                        resource_type: "FLAG_ROLLOUT"
                    }
                ]
            });

            return environmentFlagResponse;
        });

        // Send success response
        res.status(201).json({
            success: true,
            message: "Flag Environment created successfully",
            environmentId: result.id
        });

    } catch (e) {
        console.error('Error creating feature flag:', e);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};  