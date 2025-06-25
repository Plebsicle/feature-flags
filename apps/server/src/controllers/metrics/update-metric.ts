import prisma from '@repo/db';
import { metric_aggregation_method, metric_type } from '@repo/db/client';
import express from 'express'
import { extractAuditInfo } from '../../util/ip-agent';

interface UpdateMetricBody {
    metric_id: string;
    metric_name: string;
    metric_type: metric_type;
    is_active: boolean;
    unit_measurement: string;
    aggregation_method: metric_aggregation_method;
    description: string;
    tags: string[];
}

interface UpdateMetricControllerDependencies {
    prisma: typeof prisma;
}

class UpdateMetricController {
    private prisma: typeof prisma;

    constructor(dependencies: UpdateMetricControllerDependencies) {
        this.prisma = dependencies.prisma;
    }

    private checkUserAuthorization = (req: express.Request, res: express.Response): boolean => {
        const userRole = req.session.user?.userRole;
        if (userRole === undefined || ((userRole === "VIEWER") || (userRole === "MEMBER"))) {
            res.status(403).json({ success: true, message: "Not Authorised" });
            return false;
        }
        return true;
    };

    private prepareAttributesChanged = (currentMetric: any, newValues: Omit<UpdateMetricBody, 'metric_id'>) => {
        const { metric_name, metric_type, is_active, unit_measurement, aggregation_method, description, tags } = newValues;

        // Prepare attributes changed object showing old vs new values
        const attributesChanged: any = {
            old_values: currentMetric,
            new_values: {
                metric_name,
                metric_type,
                is_active,
                unit_measurement,
                aggregation_method,
                description,
                tags
            }
        };

        // Only include fields that actually changed
        const changedFields: any = {};
        if (currentMetric.metric_name !== metric_name) changedFields.metric_name = { old: currentMetric.metric_name, new: metric_name };
        if (currentMetric.metric_type !== metric_type) changedFields.metric_type = { old: currentMetric.metric_type, new: metric_type };
        if (currentMetric.is_active !== is_active) changedFields.is_active = { old: currentMetric.is_active, new: is_active };
        if (currentMetric.unit_measurement !== unit_measurement) changedFields.unit_measurement = { old: currentMetric.unit_measurement, new: unit_measurement };
        if (currentMetric.aggregation_method !== aggregation_method) changedFields.aggregation_method = { old: currentMetric.aggregation_method, new: aggregation_method };
        if (currentMetric.description !== description) changedFields.description = { old: currentMetric.description, new: description };
        if (JSON.stringify(currentMetric.tags) !== JSON.stringify(tags)) changedFields.tags = { old: currentMetric.tags, new: tags };

        attributesChanged.changed_fields = changedFields;
        return attributesChanged;
    };

    updateMetric = async (req: express.Request, res: express.Response) => {
        try {
            if (!this.checkUserAuthorization(req, res)) return;

            const {
                metric_id,
                metric_name,
                metric_type,
                is_active,
                unit_measurement,
                aggregation_method,
                description,
                tags
            } = req.body as UpdateMetricBody;

            // Zod validation could be added here
            const organisationId = req.session.user?.userOrganisationId!;
            const userId = req.session.user?.userId;
            
            // Get current metric state for audit comparison
            const currentMetric = await this.prisma.metrics.findUnique({
                where: { id: metric_id },
                select: {
                    metric_name: true,
                    metric_type: true,
                    is_active: true,
                    unit_measurement: true,
                    aggregation_method: true,
                    description: true,
                    tags: true
                }
            });

            if (!currentMetric) {
                res.status(404).json({ success: false, message: "Metric not found" });
                return;
            }

            const updateMetric = await this.prisma.metrics.update({
                where: {
                    id: metric_id
                },
                data: {
                    aggregation_method,
                    metric_name,
                    metric_type,
                    description,
                    tags,
                    is_active,
                    unit_measurement
                }
            });

            // Extract audit information
            const { ip, userAgent } = extractAuditInfo(req);

            // Prepare attributes changed
            const attributesChanged = this.prepareAttributesChanged(currentMetric, {
                metric_name,
                metric_type,
                is_active,
                unit_measurement,
                aggregation_method,
                description,
                tags
            });

            // Create audit log entry
            await this.prisma.audit_logs.create({
                data: {
                    organisation_id: organisationId,
                    user_id: userId,
                    action: 'UPDATE',
                    resource_type: 'METRIC',
                    resource_id: metric_id,
                    attributes_changed: attributesChanged,
                    ip_address: ip,
                    user_agent: userAgent
                }
            });

            res.status(200).json({ success: true, message: "Metric Updated Successfully" });
        }
        catch (e) {
            console.error(e);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }
}

// Instantiate and export the controller
import dbInstance from '@repo/db';

const updateMetricController = new UpdateMetricController({
    prisma: dbInstance
});

export const updateMetric = updateMetricController.updateMetric;