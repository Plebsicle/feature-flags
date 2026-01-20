import prisma from '@repo/db';
import express from 'express';
import { 
    deleteFeatureFlagParamsSchema, 
    deleteEnvironmentParamsSchema, 
    deleteRuleParamsSchema,
    validateParams 
} from '../../util/zod';
import { removeAllOrgFlags, deleteRuleRedis, removeFlag } from '../../services/redis/redis-flag';
import { requireString } from '../../util/request-helpers';

interface DeleteFlagControllerDependencies {
    prisma: typeof prisma;
}

class DeleteFlagController {
    private prisma: typeof prisma;

    constructor(dependencies: DeleteFlagControllerDependencies) {
        this.prisma = dependencies.prisma;
    }

    private checkUserAuthorization = (req: express.Request, res: express.Response, requiresHigherRole: boolean = false): boolean => {
        const userRole = req.session.user?.userRole;
        if (userRole === undefined || userRole === "VIEWER") {
            res.status(403).json({ success: true, message: "Not Authorised" });
            return false;
        }

        if (requiresHigherRole && (userRole === "VIEWER" || userRole === "MEMBER")) {
            res.status(401).json({ success: false, message: "Role is not Sufficient" });
            return false;
        }

        return true;
    };

    deleteFeatureFlag = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const validatedParams = validateParams(deleteFeatureFlagParamsSchema, req, res);
            if (!validatedParams) return;

            if (!this.checkUserAuthorization(req, res)) return;
            
            if (!this.checkUserAuthorization(req, res, true)) return;

            const flagId = req.params.flagId;
            const userId = req.session.user?.userId;

            // Get the flag data before deletion for audit logging
            const flagToDelete = await this.prisma.feature_flags.findUnique({
                where: { id: flagId },
                include: {
                    environments: {
                        include: {
                            rules: true,
                            rollout: true
                        }
                    }
                }
            });

            if (!flagToDelete) {
                res.status(404).json({ success: false, message: "Feature flag not found" });
                return;
            }

            // Delete the flag (cascade will handle related records)
            const deleteFlag = await this.prisma.feature_flags.delete({
                where: { id: flagId }
            });
            const organisationId = req.session.user?.userOrganisationId;
            // Create audit log entry
            await this.prisma.audit_logs.create({
                data: {
                    organisation_id: organisationId,
                    user_id: userId,
                    action: 'DELETE',
                    resource_type: 'FEATURE_FLAG',
                    resource_id: flagId,
                    ip_address: req.ip || null,
                    user_agent: req.get('User-Agent') || null
                }
            });

            const orgSlug = req.session.user?.userOrganisationSlug!;
            await removeAllOrgFlags(orgSlug,flagToDelete.key);

            res.status(200).json({ 
                success: true, 
                message: "Flag Deleted Successfully", 
                data: deleteFlag 
            });
        }
        catch (e) {
            console.error('Error Deleting flag:', e);
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }

    deleteEnvironment = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            if (!this.checkUserAuthorization(req, res)) return;

            const parsedParams = deleteEnvironmentParamsSchema.parse(req.params);
            req.params = parsedParams;
            
            if (!this.checkUserAuthorization(req, res, true)) return;

            const environmentId = req.params.environmentId;
            const userId = req.session.user?.userId;

            // Get the environment data before deletion for audit logging
            const environmentToDelete = await this.prisma.flag_environments.findUnique({
                where: { id: environmentId },
                include: {
                    flag: true,
                    rules: true,
                    rollout: true
                }
            });

            if (!environmentToDelete) {
                res.status(404).json({ success: false, message: "Environment not found" });
                return;
            }

            // Delete the environment
            const deleteEnvironment = await this.prisma.flag_environments.delete({
                where: { id: environmentId }
            });
            const organisationId = req.session.user?.userOrganisationId;
            // Create audit log entry
            await this.prisma.audit_logs.create({
                data: {
                    organisation_id: organisationId,
                    user_id: userId,
                    action: 'DELETE',
                    resource_type: 'FLAG_ENVIRONMENT',
                    resource_id: environmentId,
                    environment: environmentToDelete.environment,
                    ip_address: req.ip || null,
                    user_agent: req.get('User-Agent') || null
                }
            });
            const orgSlug = req.session.user?.userOrganisationSlug!;
            await removeFlag(orgSlug,deleteEnvironment.environment,environmentToDelete.flag.key);

            res.status(200).json({ 
                success: true, 
                message: "Environment deleted successfully", 
                data: deleteEnvironment 
            });
        }
        catch (e) {
            console.error('Error deleting the environment:', e);
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }

    deleteRule = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            if (!this.checkUserAuthorization(req, res)) return;

            const parsedParams = deleteRuleParamsSchema.parse(req.params);
            req.params = parsedParams;
            
            if (!this.checkUserAuthorization(req, res, true)) return;

            const ruleId = requireString(req.params.ruleId, 'ruleId');
            const userId = req.session.user?.userId;

            // Get the rule data before deletion for audit logging
            const ruleToDelete = await this.prisma.flag_rules.findUnique({
                where: { id: ruleId },
                include: {
                    flag_environment: {
                        include: {
                            flag: true
                        }
                    }
                }
            });

            if(!ruleToDelete){
                res.status(401).json({message : "Rule not Found",success : false});
                return;
            }

            // Delete the rule
            const deleteRule = await this.prisma.flag_rules.delete({
                where: { id: ruleId }
            });
            const organisation_id = req.session.user?.userOrganisationId;
            // Create audit log entry
            await this.prisma.audit_logs.create({
                data: {
                    organisation_id: organisation_id,
                    user_id: userId,
                    action: 'DELETE',
                    resource_type: 'FLAG_RULE',
                    resource_id: ruleId,
                    environment: ruleToDelete.flag_environment.environment,
                    ip_address: req.ip || null,
                    user_agent: req.get('User-Agent') || null
                }
            });
            const orgSlug = req.session.user?.userOrganisationSlug!;
            const flagType = ruleToDelete.flag_environment.flag.flag_type
            await deleteRuleRedis(orgSlug,ruleToDelete.flag_environment.flag.key,ruleToDelete?.flag_environment.environment,ruleId,flagType);
            res.status(200).json({ 
                message: "Rule deleted successfully", 
                success: true, 
                data: deleteRule 
            });
        }
        catch (e) {
            console.error('Error deleting the Rule:', e);
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }
}

// Instantiate and export the controller
import dbInstance from '@repo/db';

const deleteFlagController = new DeleteFlagController({
    prisma: dbInstance
});

export const deleteFeatureFlag = deleteFlagController.deleteFeatureFlag;
export const deleteEnvironment = deleteFlagController.deleteEnvironment;
export const deleteRule = deleteFlagController.deleteRule;