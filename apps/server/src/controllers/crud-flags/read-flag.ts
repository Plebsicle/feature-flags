import prisma from '@repo/db';
import express from 'express'
import { 
    flagIdParamsSchema, 
    environmentIdParamsSchema,
    validateParams 
} from '../../util/zod';
import { Redis_Value, refreshOrSetFlagTTL, updateFeatureFlagRedis, environment_type, RedisCacheRules } from '../../services/redis/redis-flag';
import { Condition, Conditions } from '@repo/types/rule-config';
import { RolloutConfig } from '@repo/types/rollout-config';
import { requireString } from '../../util/request-helpers';

interface ReadFlagControllerDependencies {
    prisma: typeof prisma;
}

class ReadFlagController {
    private prisma: typeof prisma;

    constructor(dependencies: ReadFlagControllerDependencies) {
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

    // Internal function to get complete flag data for caching
    private getCompleteFlagData = async (flagId: string, environment?: environment_type): Promise<Redis_Value[]> => {
        const flagData = await this.prisma.feature_flags.findUnique({
            where: { id: flagId },
            include: {
                environments: {
                    where: environment ? { environment } : {},
                    include: {
                        rules: {
                            orderBy: { created_at: 'asc' }
                        },
                        rollout: true
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

    getAllFeatureFlags = async (req: express.Request, res: express.Response) => {
        try {
            if (!this.checkUserAuthorization(req, res)) return;

            const organisationId = req.session.user?.userOrganisationId;
            if (!organisationId) {
                res.json(400).json({ success: false, message: "Unauthorised User" });
                return;
            }
            const allFlags = await this.prisma.feature_flags.findMany({
                where: {
                    organization_id: organisationId
                }
            });
            res.status(200).json({ data: allFlags, success: true, message: "Flag Data Fetched Succesfully" });
        }
        catch (e) {
            console.error('Error All feature flags:', e);
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }

    getFeatureFlagData = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const validatedParams = validateParams(flagIdParamsSchema, req, res);
            if (!validatedParams) return;

            if (!this.checkUserAuthorization(req, res)) return;

            const flagId = requireString(req.params.flagId, 'flagId');

            // Get complete flag data with all environments
            const completeFlag = await this.getCompleteFlagData(flagId);
            const flag = await this.prisma.feature_flags.findUnique({
                where: {
                    id: flagId
                }
            });
            if (!flag) {
                res.status(400).json({ success: false, message: "Flag Id Missing" });
                return;
            }
            if (!completeFlag) {
                res.status(404).json({
                    success: false,
                    message: "Flag not found"
                });
                return;
            }
            const orgSlug = req.session.user?.userOrganisationSlug!;
            for (const env of completeFlag) {
                await updateFeatureFlagRedis(orgSlug, flag.key, env.environment, env, flag.flag_type);
            }

            // Return only flag data (not environment-specific info)
            const flagResponse = {
                id: flag.id,
                organization_id: flag.organization_id,
                name: flag.name,
                key: flag.key,
                description: flag.description,
                flag_type: flag.flag_type,
                is_active: flag.is_active,
                created_by: flag.created_by,
                created_at: flag.created_at,
                updated_at: flag.updated_at,
                tags: flag.tags
            };
            res.status(200).json({ data: flagResponse, success: true, message: "Flag Data Fetched Succesfully" });
        }
        catch (e) {
            console.error('Error fetching feature flag:', e);
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }

    getFlagEnvironmentData = async (req: express.Request, res: express.Response) => {
        try {
            if (!this.checkUserAuthorization(req, res)) return;

            const flagId = requireString(req.params.flagId, 'flagId');
            console.log(flagId);
            // Get complete flag data with all environments
            const completeFlag = await this.getCompleteFlagData(flagId);
            const flag = await this.prisma.feature_flags.findUnique({
                where: {
                    id: flagId
                }, include: {
                    environments: true
                }
            });

            if (!flag) {
                res.status(400).json({ success: false, message: "Flag Id Missing" });
                return;
            }
            if (!completeFlag) {
                res.status(404).json({
                    success: false,
                    message: "Flag not found"
                });
                return;
            }
            // Cache complete data for each environment
            const orgSlug = req.session.user?.userOrganisationSlug!;
            for (const env of completeFlag) {
                await updateFeatureFlagRedis(orgSlug, flag.key, env.environment, env, flag.flag_type);
            }

            // Return only environment data
            const flag_type = flag.flag_type;
            const environmentData = flag.environments.map((env: { id: string; environment: environment_type; value: any; default_value: any; is_enabled: boolean; created_at: Date; updated_at: Date; }) => ({
                id: env.id,
                environment: env.environment,
                value: env.value,
                default_value: env.default_value,
                is_enabled: env.is_enabled,
                created_at: env.created_at,
                updated_at: env.updated_at
            }));

            res.status(200).json({
                data: {
                    environmentData,
                    flag_id: flagId,
                    flag_type
                }, success: true, message: "Flag Environments fetched succesfully"
            });
        }
        catch (e) {
            console.error('Error fetching Environment Details:', e);
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }

    getRules = async (req: express.Request, res: express.Response) => {
        try {
            const validatedParams = validateParams(environmentIdParamsSchema, req, res);
            if (!validatedParams) return;

            if (!this.checkUserAuthorization(req, res)) return;

            const environmentId = req.params.environmentId;

            // Get flag environment with flag details
            const environmentData = await this.prisma.flag_environments.findUnique({
                where: { id: environmentId },
                include: {
                    flag: true,
                    rules: true,
                    rollout: true
                }
            });

            if (!environmentData) {
                res.status(404).json({ message: "Environment not found", success: false });
                return;
            }

            // Build complete cache data
            const completeData: Redis_Value = {
                flagId: environmentData.flag.id,
                flag_type: environmentData.flag.flag_type,
                is_active: environmentData.flag.is_active,
                environment: environmentData.environment,
                is_environment_active: environmentData.is_enabled,
                value: environmentData.value as Record<string, any>,
                default_value: environmentData.default_value as Record<string, any>,
                rules: environmentData.rules.map((rule: { id: string; name: string; conditions: any; is_enabled: boolean; description: string | null; }) => ({
                    name: rule.name,
                    rule_id: rule.id,
                    conditions: rule.conditions as unknown as Conditions,
                    is_enabled: rule.is_enabled
                })),
                rollout_config: environmentData.rollout?.config as unknown as RolloutConfig
            };

            // Cache the complete data
            const orgSlug = req.session.user?.userOrganisationSlug!;
            await refreshOrSetFlagTTL(
                orgSlug,
                environmentData.flag.key,
                environmentData.flag.flag_type,
                completeData,
                environmentData.environment
            );

            // Return only rules data in the expected format
            const rulesResponse = environmentData.rules.map((rule: { id: string; name: string; conditions: any; is_enabled: boolean; description: string | null; }) => ({
                ...rule
            }));

            res.status(200).json({ data: rulesResponse, success: true, message: "Rules for environment fetched successfuly" });
        }
        catch (e) {
            console.error('Error fetching rules for the environment:', e);
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }

    getRollout = async (req: express.Request, res: express.Response) => {
        try {
            const validatedParams = validateParams(environmentIdParamsSchema, req, res);
            if (!validatedParams) return;

            if (!this.checkUserAuthorization(req, res)) return;

            const environmentId = req.params.environmentId;

            // Get flag environment with flag details and rollout
            const environmentData = await this.prisma.flag_environments.findUnique({
                where: { id: environmentId },
                include: {
                    flag: true,
                    rules: true,
                    rollout: true
                }
            });

            if (!environmentData || !environmentData.rollout) {
                res.status(404).json({ message: "Rollout not Found", success: false });
                return;
            }

            // Build complete cache data
            const completeData: Redis_Value = {
                flagId: environmentData.flag.id,
                flag_type: environmentData.flag.flag_type,
                is_active: environmentData.flag.is_active,
                environment: environmentData.environment,
                is_environment_active: environmentData.is_enabled,
                value: environmentData.value as Record<string, any>,
                default_value: environmentData.default_value as Record<string, any>,
                rules: environmentData.rules.map((rule: { id: string; name: string; conditions: any; is_enabled: boolean; description: string | null; }) => ({
                    name: rule.name,
                    rule_id: rule.id,
                    conditions: rule.conditions as unknown as Conditions,
                    is_enabled: rule.is_enabled
                })),
                rollout_config: environmentData.rollout?.config as unknown as RolloutConfig
            };

            // Cache the complete data
            const orgSlug = req.session.user?.userOrganisationSlug!;
            await refreshOrSetFlagTTL(
                orgSlug,
                environmentData.flag.key,
                environmentData.flag.flag_type,
                completeData,
                environmentData.environment
            );

            // Return rollout data in the expected format
            const rolloutResponse = {
                ...environmentData.rollout
            };

            res.status(200).json({ data: rolloutResponse, success: true, message: "Rollout for environment fetched successfuly" });
        }
        catch (e) {
            console.error('Error fetching rollout details:', e);
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }

    getAuditLogs = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const validatedParams = validateParams(flagIdParamsSchema, req, res);
            if (!validatedParams) return;

            if (!this.checkUserAuthorization(req, res)) return;

            const role = req.session.user?.userRole;
            if (role === "VIEWER") {
                res.status(401).json({ success: false, message: "Role is not Sufficient" });
                return;
            }
            const organisation_id = req.session.user?.userOrganisationId;
            const flagId = req.params.flagId;
            const auditLogs = await this.prisma.audit_logs.findMany({
                where: {
                    organisation_id: organisation_id
                }
            });
            res.status(200).json({ data: auditLogs, success: true, message: "Audit Logs for Flag fetched successfuly" });
        }
        catch (e) {
            console.error('Error fetching Audit Logs:', e);
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }
}

// Instantiate and export the controller
import dbInstance from '@repo/db';

const readFlagController = new ReadFlagController({
    prisma: dbInstance
});

export const getAllFeatureFlags = readFlagController.getAllFeatureFlags;
export const getFeatureFlagData = readFlagController.getFeatureFlagData;
export const getFlagEnvironmentData = readFlagController.getFlagEnvironmentData;
export const getRules = readFlagController.getRules;
export const getRollout = readFlagController.getRollout;
export const getAuditLogs = readFlagController.getAuditLogs;