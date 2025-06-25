import { PrismaClient, alert_operator } from '@repo/db/client';
import express from 'express'
import { extractAuditInfo } from '../../util/ip-agent';

interface UpdateAlertBody {
    threshold: number,
    metric_id: string,
    operator: alert_operator,
    is_enabled: boolean
}

class AlertUpdateController {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    private validateUserPermissions(userRole: string | undefined): boolean {
        return !(userRole === undefined || userRole === "VIEWER" || userRole === "MEMBER");
    }

    private async getCurrentAlert(metricId: string) {
        return await this.prisma.alert_metric.findUnique({
            where: { metric_id: metricId },
            select: {
                threshold: true,
                operator: true,
                is_enabled: true,
                metric_id: true
            }
        });
    }

    private async updateAlertRecord(metricId: string, updateData: Omit<UpdateAlertBody, 'metric_id'>) {
        return await this.prisma.alert_metric.update({
            where: {
                metric_id: metricId
            },
            data: {
                threshold: updateData.threshold,
                operator: updateData.operator,
                is_enabled: updateData.is_enabled
            }
        });
    }

    private calculateChangedFields(currentAlert: any, newData: UpdateAlertBody) {
        const changedFields: any = {};
        if (currentAlert.threshold !== newData.threshold) {
            changedFields.threshold = { old: currentAlert.threshold, new: newData.threshold };
        }
        if (currentAlert.operator !== newData.operator) {
            changedFields.operator = { old: currentAlert.operator, new: newData.operator };
        }
        if (currentAlert.is_enabled !== newData.is_enabled) {
            changedFields.is_enabled = { old: currentAlert.is_enabled, new: newData.is_enabled };
        }
        return changedFields;
    }

    private async createUpdateAuditLog(
        organisationId: string,
        userId: string | undefined,
        alertId: string,
        currentAlert: any,
        newData: UpdateAlertBody,
        userRole: string,
        ip: string,
        userAgent: string | null
    ) {
        const changedFields = this.calculateChangedFields(currentAlert, newData);

        const attributesChanged: any = {
            old_values: currentAlert,
            new_values: {
                threshold: newData.threshold,
                operator: newData.operator,
                is_enabled: newData.is_enabled,
                metric_id: newData.metric_id
            },
            changed_fields: changedFields,
            user_role: userRole
        };

        await this.prisma.audit_logs.create({
            data: {
                organisation_id: organisationId,
                user_id: userId,
                action: 'UPDATE',
                resource_type: 'ALERT',
                resource_id: alertId,
                attributes_changed: attributesChanged,
                ip_address: ip,
                user_agent: userAgent
            }
        });
    }

    updateAlert = async (req: express.Request, res: express.Response) => {
        try {
            const userRole = req.session.user?.userRole;
            if (!this.validateUserPermissions(userRole)) {
                res.status(403).json({ success: false, message: "Not Authorised" });
                return;
            }

            const { threshold, metric_id, operator, is_enabled } = req.body as UpdateAlertBody;
            const organisationId = req.session.user?.userOrganisationId!;
            const userId = req.session.user?.userId;

            // Get current alert state for audit comparison
            const currentAlert = await this.getCurrentAlert(metric_id);

            if (!currentAlert) {
                res.status(404).json({ success: false, message: "Alert not found" });
                return;
            }

            const updatedAlert = await this.updateAlertRecord(metric_id, {
                threshold,
                operator,
                is_enabled
            });

            // Extract audit information
            const { ip, userAgent } = extractAuditInfo(req);

            // Create audit log entry
            await this.createUpdateAuditLog(
                organisationId,
                userId,
                updatedAlert.id,
                currentAlert,
                { threshold, metric_id, operator, is_enabled },
                userRole!,
                ip,
                userAgent!
            );

            res.status(200).json({ success: true, message: "Alert updated successfully" });
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
export default new AlertUpdateController(prisma);