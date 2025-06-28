import { PrismaClient } from '@repo/db/client';
import express from 'express'

class AlertReadController {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    private validateUserPermissions(userRole: string | undefined): boolean {
        return !(userRole === undefined || userRole === "VIEWER" || userRole === "MEMBER");
    }

    private async getAlertWithMetric(metricId: string) {
        const result =  await this.prisma.alert_metric.findUnique({
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
        return result;
    }

    private validateOrganizationAccess(metricData: any, organisationId: string): boolean {
        return metricData.metric_setup.organization_id === organisationId;
    }

    getAlerts = async (req: express.Request, res: express.Response) => {
        try {
            const userRole = req.session.user?.userRole;
            if (!this.validateUserPermissions(userRole)) {
                res.status(403).json({ success: false, message: "Not Authorised" });
                return;
            }

            const organisationId = req.session.user?.userOrganisationId;
            const metricId = req.params.metricId;

            const alertData = await this.getAlertWithMetric(metricId);

            if (!alertData) {
                res.status(404).json({ success: false, message: "Alert not found" });
                return;
            }

            // Verify the alert belongs to the user's organization
            if (!this.validateOrganizationAccess(alertData, organisationId!)) {
                res.status(403).json({ success: false, message: "Not authorized to access this alert" });
                return;
            }
            res.status(200).json({success : true , data : alertData })
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