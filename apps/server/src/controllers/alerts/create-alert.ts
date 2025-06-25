import { PrismaClient, alert_operator } from '@repo/db/client';
import express from 'express'
import { extractAuditInfo } from '../../util/ip-agent';

interface CreateAlertBody {
    metric_id: string,
    operator: alert_operator,
    threshold: number,
    is_enabled: boolean
}

class AlertCreateController {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    private validateUserPermissions(userRole: string | undefined): boolean {
        return !(userRole === undefined || userRole === "VIEWER" || userRole === "MEMBER");
    }

    private async createAlertRecord(alertData: CreateAlertBody) {
        return await this.prisma.alert_metric.create({
            data: {
                metric_id: alertData.metric_id,
                operator: alertData.operator,
                threshold: alertData.threshold,
                is_enabled: alertData.is_enabled
            }
        });
    }

    private async createAuditLog(
        organisationId: string,
        userId: string | undefined,
        alertId: string,
        alertData: CreateAlertBody,
        userRole: string,
        ip: string,
        userAgent: string
    ) {
        await this.prisma.audit_logs.create({
            data: {
                organisation_id: organisationId,
                user_id: userId,
                action: 'CREATE',
                resource_type: 'ALERT',
                resource_id: alertId,
                attributes_changed: {
                    metric_id: alertData.metric_id,
                    operator: alertData.operator,
                    threshold: alertData.threshold,
                    is_enabled: alertData.is_enabled,
                    user_role: userRole
                },
                ip_address: ip,
                user_agent: userAgent
            }
        });
    }

    createAlert = async (req: express.Request, res: express.Response) => {
        try {
            const userRole = req.session.user?.userRole;
            if (!this.validateUserPermissions(userRole)) {
                res.status(403).json({ success: false, message: "Not Authorised" });
                return;
            }

            const { metric_id, operator, threshold, is_enabled } = req.body as CreateAlertBody;
            const organisationId = req.session.user?.userOrganisationId!;
            const userId = req.session.user?.userId;

            const alertCreation = await this.createAlertRecord({
                metric_id,
                operator,
                threshold,
                is_enabled
            });

            // Extract audit information
            const { ip, userAgent } = extractAuditInfo(req);

            // Create audit log entry
            await this.createAuditLog(
                organisationId,
                userId,
                alertCreation.id,
                { metric_id, operator, threshold, is_enabled },
                userRole!,
                ip,
                userAgent!
            );

            res.status(200).json({ success: true, message: "Alert for Metric Created Successfully" });
        }
        catch (e) {
            console.error(e);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }
}

// Import the actual prisma instance
import prisma from '@repo/db';

// Export the instantiated controller
export default new AlertCreateController(prisma);