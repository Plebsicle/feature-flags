import { PrismaClient } from '@repo/db/client';
import express from 'express'
import { extractAuditInfo } from '../../util/ip-agent';

class AlertDeleteController {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    private validateUserPermissions(userRole: string | undefined): boolean {
        return !(userRole === undefined || userRole === "VIEWER" || userRole === "MEMBER");
    }

    private async getAlertWithMetric(metricId: string) {
        return await this.prisma.alert_metric.findUnique({
            where: { metric_id: metricId },
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

    private validateOrganizationAccess(alertData: any, organisationId: string): boolean {
        return alertData.metric_setup.organization_id === organisationId;
    }

    private async deleteAlertRecord(metricId: string) {
        return await this.prisma.alert_metric.delete({
            where: {
                metric_id: metricId
            }
        });
    }

    private async createDeleteAuditLog(
        organisationId: string,
        userId: string | undefined,
        alertData: any,
        userRole: string,
        ip: string,
        userAgent: string | null
    ) {
        await this.prisma.audit_logs.create({
            data: {
                organisation_id: organisationId,
                user_id: userId,
                action: 'DELETE',
                resource_type: 'ALERT',
                resource_id: alertData.id,
                attributes_changed: {
                    deleted_alert: {
                        metric_id: alertData.metric_id,
                        operator: alertData.operator,
                        threshold: alertData.threshold,
                        is_enabled: alertData.is_enabled,
                        metric_name: alertData.metric_setup.metric_name,
                        metric_key: alertData.metric_setup.metric_key
                    },
                    user_role: userRole
                },
                ip_address: ip,
                user_agent: userAgent
            }
        });
    }

    deleteAlert = async (req: express.Request, res: express.Response) => {
        try {
            const userRole = req.session.user?.userRole;
            if (!this.validateUserPermissions(userRole)) {
                res.status(403).json({ success: false, message: "Not Authorised" });
                return;
            }

            const organisationId = req.session.user?.userOrganisationId!;
            const userId = req.session.user?.userId;
            const metricId = req.params.metricId;

            if (!metricId) {
                res.status(400).json({ success: false, message: "Metric Id Needed" });
                return;
            }

            // Get alert details before deletion for audit logging
            const alertToDelete = await this.getAlertWithMetric(metricId);

            if (!alertToDelete) {
                res.status(404).json({ success: false, message: "Alert not found" });
                return;
            }

            // Verify the alert belongs to the user's organization
            if (!this.validateOrganizationAccess(alertToDelete, organisationId)) {
                res.status(403).json({ success: false, message: "Not authorized to delete this alert" });
                return;
            }

            await this.deleteAlertRecord(metricId);

            // Extract audit information
            const { ip, userAgent } = extractAuditInfo(req);

            // Create audit log entry
            await this.createDeleteAuditLog(
                organisationId,
                userId,
                alertToDelete,
                userRole!,
                ip,
                userAgent
            );

            res.status(200).json({ success: true, message: "Alert removed succesfully" });
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
export default new AlertDeleteController(prisma);