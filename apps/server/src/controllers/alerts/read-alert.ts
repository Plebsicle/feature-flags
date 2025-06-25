import prisma from '@repo/db';
import express from 'express'
import { extractAuditInfo } from '../../util/ip-agent';

export const getAlerts = async (req : express.Request,res : express.Response) => {
    try{
        const userRole = req.session.user?.userRole;
        if(userRole === undefined  || ((userRole === "VIEWER") || (userRole === "MEMBER"))){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        
        const organisationId = req.session.user?.userOrganisationId;
        const userId = req.session.user?.userId;
        const metricId = req.params.metricId;
        
        const metricData = await prisma.alert_metric.findUnique({
            where : {
                metric_id : metricId
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

        if (!metricData) {
            res.status(404).json({success: false, message: "Alert not found"});
            return;
        }

        // Verify the alert belongs to the user's organization
        if (metricData.metric_setup.organization_id !== organisationId) {
            res.status(403).json({success: false, message: "Not authorized to access this alert"});
            return;
        }

        // Extract audit information
        const { ip, userAgent } = extractAuditInfo(req);

        // Create audit log entry for alert access
        await prisma.audit_logs.create({
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

        res.status(200).json({success : true,message : "data fetched succesfully",data : metricData});
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}