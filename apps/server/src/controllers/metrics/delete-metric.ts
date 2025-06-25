import prisma from "@repo/db";
import express from 'express'
import { extractAuditInfo } from '../../util/ip-agent';

export const deleteMetric = async (req:express.Request,res:express.Response) => {
    try{    
         const userRole = req.session.user?.userRole;
        if(userRole === undefined  || ((userRole === "VIEWER") || (userRole === "MEMBER"))){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        
        const organisationId = req.session.user?.userOrganisationId!;
        const userId = req.session.user?.userId;
        const metricId = req.params.metricId;
        
        // Get metric details before deletion for audit logging
        const metricToDelete = await prisma.metrics.findUnique({
            where: { id: metricId },
            select: {
                id: true,
                metric_name: true,
                metric_key: true,
                metric_type: true,
                is_active: true,
                unit_measurement: true,
                aggregation_method: true,
                description: true,
                tags: true,
                flag_environment_id: true,
                organization_id: true
            }
        });

        if (!metricToDelete) {
            res.status(404).json({success: false, message: "Metric not found"});
            return;
        }

        // Verify the metric belongs to the user's organization
        if (metricToDelete.organization_id !== organisationId) {
            res.status(403).json({success: false, message: "Not authorized to delete this metric"});
            return;
        }
        
        const deleteMetric = await prisma.metrics.delete({
            where : {
                id : metricId
            }
        });

        // Extract audit information
        const { ip, userAgent } = extractAuditInfo(req);

        // Create audit log entry
        await prisma.audit_logs.create({
            data: {
                organisation_id: organisationId,
                user_id: userId,
                action: 'DELETE',
                resource_type: 'METRIC',
                resource_id: metricId,
                attributes_changed: {
                    deleted_metric: {
                        metric_name: metricToDelete.metric_name,
                        metric_key: metricToDelete.metric_key,
                        metric_type: metricToDelete.metric_type,
                        is_active: metricToDelete.is_active,
                        unit_measurement: metricToDelete.unit_measurement,
                        aggregation_method: metricToDelete.aggregation_method,
                        description: metricToDelete.description,
                        tags: metricToDelete.tags,
                        flag_environment_id: metricToDelete.flag_environment_id
                    },
                    user_role: userRole
                },
                ip_address: ip,
                user_agent: userAgent
            }
        });

        res.status(200).json({success: true, message: "Metric deleted successfully"});
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}