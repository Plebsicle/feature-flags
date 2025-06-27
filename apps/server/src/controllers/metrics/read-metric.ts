import prisma from '@repo/db';
import express from 'express'
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
            
            const metrics = await this.prisma.metrics.findMany({
                where: {
                    organization_id: organisationId
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