import prisma from '@repo/db';
import express from 'express';

export const deleteFeatureFlag = async (req: express.Request, res: express.Response) => {
    try {
        const role = req.session.user?.userRole;
        if (role === "VIEWER" || role === "MEMBER") {
            res.status(401).json({ success: false, message: "Role is not Sufficient" });
            return;
        }

        const flagId = req.params.flagId;
        const userId = req.session.user?.userId;

        // Get the flag data before deletion for audit logging
        const flagToDelete = await prisma.feature_flags.findUnique({
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
        const deleteFlag = await prisma.feature_flags.delete({
            where: { id: flagId }
        });

        // Create audit log entry
        await prisma.audit_logs.create({
            data: {
                flag_id: flagId,
                user_id: userId,
                action: 'DELETE',
                resource_type: 'FEATURE_FLAG',
                resource_id: flagId,
                ip_address: req.ip || null,
                user_agent: req.get('User-Agent') || null
            }
        });

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

export const deleteEnvironment = async (req: express.Request, res: express.Response) => {
    try {
        const role = req.session.user?.userRole;
        if (role === "VIEWER" || role === "MEMBER") {
            res.status(401).json({ success: false, message: "Role is not Sufficient" });
            return;
        }

        const environmentId = req.params.environmentId;
        const userId = req.session.user?.userId;

        // Get the environment data before deletion for audit logging
        const environmentToDelete = await prisma.flag_environments.findUnique({
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
        const deleteEnvironment = await prisma.flag_environments.delete({
            where: { id: environmentId }
        });

        // Create audit log entry
        await prisma.audit_logs.create({
            data: {
                flag_id: environmentToDelete.flag_id,
                user_id: userId,
                action: 'DELETE',
                resource_type: 'FLAG_ENVIRONMENT',
                resource_id: environmentId,
                environment: environmentToDelete.environment,
                ip_address: req.ip || null,
                user_agent: req.get('User-Agent') || null
            }
        });

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

export const deleteRule = async (req: express.Request, res: express.Response) => {
    try {
        const role = req.session.user?.userRole;
        if (role === "VIEWER" || role === "MEMBER") {
            res.status(401).json({ success: false, message: "Role is not Sufficient" });
            return;
        }

        const ruleId = req.params.ruleId;
        const userId = req.session.user?.userId;

        // Get the rule data before deletion for audit logging
        const ruleToDelete = await prisma.flag_rules.findUnique({
            where: { id: ruleId },
            include: {
                flag_environment: {
                    include: {
                        flag: true
                    }
                }
            }
        });

        if (!ruleToDelete) {
            res.status(404).json({ success: false, message: "Rule not found" });
            return;
        }

        // Delete the rule
        const deleteRule = await prisma.flag_rules.delete({
            where: { id: ruleId }
        });

        // Create audit log entry
        await prisma.audit_logs.create({
            data: {
                flag_id: ruleToDelete.flag_environment.flag.id,
                user_id: userId,
                action: 'DELETE',
                resource_type: 'FLAG_RULE',
                resource_id: ruleId,
                environment: ruleToDelete.flag_environment.environment,
                ip_address: req.ip || null,
                user_agent: req.get('User-Agent') || null
            }
        });

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