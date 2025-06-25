import prisma from '@repo/db';
import express from 'express'
import { extractAuditInfo } from '../../util/ip-agent';
import { metricIdParamsSchema, validateParams } from '../../util/zod';

interface ReadMetricControllerDependencies {
    prisma: typeof prisma;
}

class ReadMetricController {
    private prisma: typeof prisma;

    constructor(dependencies: ReadMetricControllerDependencies) {
        this.prisma = dependencies.prisma;
    }

    private checkUserAuthorizationForAll = (req: express.Request, res: express.Response): boolean => {
        const userRole = req.session.user?.userRole;
        if (userRole === undefined || ((userRole === "VIEWER") || (userRole === "MEMBER"))) {
            res.status(403).json({ success: false, message: "Not Authorised" });
            return false;
        }
        return true;
    };

    private checkUserAuthorizationForSingle = (req: express.Request, res: express.Response): boolean => {
        const userRole = req.session.user?.userRole;
        if (userRole === undefined || ((userRole === "VIEWER") || (userRole === "MEMBER"))) {
            res.status(403).json({ success: true, message: "Not Authorised" });
            return false;
        }
        return true;
    };

    getMetrics = async (req: express.Request, res: express.Response) => {
        try {
            if (!this.checkUserAuthorizationForAll(req, res)) return;

            const organisationId = req.session.user?.userOrganisationId;
            const userId = req.session.user?.userId;
            const userRole = req.session.user?.userRole;
            
            const metrics = await this.prisma.metrics.findMany({
                where: {
                    organization_id: organisationId
                }
            });

            // Extract audit information
            const { ip, userAgent } = extractAuditInfo(req);

            // Create audit log entry for bulk metrics access
            await this.prisma.audit_logs.create({
                data: {
                    organisation_id: organisationId,
                    user_id: userId,
                    action: 'EVALUATE', // Using EVALUATE for read operations
                    resource_type: 'METRIC',
                    resource_id: null, // null for bulk operations
                    attributes_changed: {
                        operation: 'bulk_read',
                        metrics_count: metrics.length,
                        user_role: userRole
                    },
                    ip_address: ip,
                    user_agent: userAgent
                }
            });

            res.status(200).json({ success: true, message: "Metrics Fetched Successfully", data: metrics });
        }
        catch (e) {
            console.error(e);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }

    getMetricbyId = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const validatedParams = validateParams(metricIdParamsSchema, req, res);
            if (!validatedParams) return;

            if (!this.checkUserAuthorizationForSingle(req, res)) return;
            
            const organisationId = req.session.user?.userOrganisationId;
            const userId = req.session.user?.userId;
            const userRole = req.session.user?.userRole;
            const metricId = req.params.metricId;
            
            const metrics = await this.prisma.metrics.findUnique({
                where: {
                    id: metricId
                }
            });

            if (!metrics) {
                res.status(404).json({ success: false, message: "Metric not found" });
                return;
            }

            // Extract audit information
            const { ip, userAgent } = extractAuditInfo(req);

            // Create audit log entry for specific metric access
            await this.prisma.audit_logs.create({
                data: {
                    organisation_id: organisationId,
                    user_id: userId,
                    action: 'EVALUATE', // Using EVALUATE for read operations
                    resource_type: 'METRIC',
                    resource_id: metricId,
                    attributes_changed: {
                        operation: 'single_read',
                        metric_name: metrics.metric_name,
                        metric_key: metrics.metric_key,
                        user_role: userRole
                    },
                    ip_address: ip,
                    user_agent: userAgent
                }
            });

            res.status(200).json({ success: true, message: "Metric Fetched Successfully", data: metrics });
        }
        catch (e) {
            console.error(e);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }
}

// Instantiate and export the controller
import dbInstance from '@repo/db';

const readMetricController = new ReadMetricController({
    prisma: dbInstance
});

export const getMetrics = readMetricController.getMetrics;
export const getMetricbyId = readMetricController.getMetricbyId;