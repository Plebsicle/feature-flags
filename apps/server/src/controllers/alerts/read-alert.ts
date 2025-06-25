import { PrismaClient } from '@repo/db/client';
import express from 'express'
import { extractAuditInfo } from '../../util/ip-agent';

class AlertReadController {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    private validateUserPermissions(userRole: string | undefined): boolean {
        return !(userRole === undefined || userRole === "VIEWER" || userRole === "MEMBER");
    }

    private async getAlertWithMetric(metricId: string) {
        return await this.prisma.alert_metric.findUnique({
            where: {
                metric_id: metricId
            },
            include: {
                metric_setup: {
                    select: {
                        metric_name: true,
                        metric_key: true,
                        organization_id: true
                    }
                }
            }
        });
    }

    private validateOrganizationAccess(metricData: any, organisationId: string): boolean {
        return metricData.metric_setup.organization_id === organisationId;
    }

    private async createReadAuditLog(
        organisationId: string,
        userId: string | undefined,
        metricData: any,
        metricId: string,
        userRole: string,
        ip: string,
        userAgent: string
    ) {
        await this.prisma.audit_logs.create({
            data: {
                organisation_id: organisationId,
                user_id: userId,
                action: 'EVALUATE', // Using EVALUATE for read operations
                resource_type: 'ALERT',
                resource_id: metricData.id,
                attributes_changed: {
                    operation: 'read',
                    metric_id: metricId,
                    metric_name: metricData.metric_setup.metric_name,
                    metric_key: metricData.metric_setup.metric_key,
                    alert_threshold: metricData.threshold,
                    alert_operator: metricData.operator,
                    user_role: userRole
                },
                ip_address: ip,
                user_agent: userAgent
            }
        });
    }

    getAlerts = async (req: express.Request, res: express.Response) => {
        try {
            const userRole = req.session.user?.userRole;
            if (!this.validateUserPermissions(userRole)) {
                res.status(403).json({ success: false, message: "Not Authorised" });
                return;
            }

            const organisationId = req.session.user?.userOrganisationId;
            const userId = req.session.user?.userId;
            const metricId = req.params.metricId;

            const metricData = await this.getAlertWithMetric(metricId);

            if (!metricData) {
                res.status(404).json({ success: false, message: "Alert not found" });
                return;
            }

            // Verify the alert belongs to the user's organization
            if (!this.validateOrganizationAccess(metricData, organisationId!)) {
                res.status(403).json({ success: false, message: "Not authorized to access this alert" });
                return;
            }

            // Extract audit information
            const { ip, userAgent } = extractAuditInfo(req);

            // Create audit log entry for alert access
            await this.createReadAuditLog(
                organisationId!,
                userId,
                metricData,
                metricId,
                userRole!,
                ip,
                userAgent!
            );

            res.status(200).json({ success: true, message: "data fetched succesfully", data: metricData });
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
export default new AlertReadController(prisma);