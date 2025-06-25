import prisma from '@repo/db';
import express from 'express'
import { extractAuditInfo } from '../../util/ip-agent';

export const deleteAlert = async (req : express.Request,res : express.Response) => {
    try{    
       const userRole = req.session.user?.userRole;
        if(userRole === undefined  || ((userRole === "VIEWER") || (userRole === "MEMBER"))){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        
        const organisationId = req.session.user?.userOrganisationId!;
        const userId = req.session.user?.userId;
        const metricId = req.params.metricId;
        
        if(!metricId){
            res.status(400).json({success : false,message : "Metric Id Needed"});
            return;
        }

        // Get alert details before deletion for audit logging
        const alertToDelete = await prisma.alert_metric.findUnique({
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

        if (!alertToDelete) {
            res.status(404).json({success: false, message: "Alert not found"});
            return;
        }

        // Verify the alert belongs to the user's organization
        if (alertToDelete.metric_setup.organization_id !== organisationId) {
            res.status(403).json({success: false, message: "Not authorized to delete this alert"});
            return;
        }

        await prisma.alert_metric.delete({
            where : {
                metric_id : metricId
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
                resource_type: 'ALERT',
                resource_id: alertToDelete.id,
                attributes_changed: {
                    deleted_alert: {
                        metric_id: alertToDelete.metric_id,
                        operator: alertToDelete.operator,
                        threshold: alertToDelete.threshold,
                        is_enabled: alertToDelete.is_enabled,
                        metric_name: alertToDelete.metric_setup.metric_name,
                        metric_key: alertToDelete.metric_setup.metric_key
                    },
                    user_role: userRole
                },
                ip_address: ip,
                user_agent: userAgent
            }
        });

        res.status(200).json({success : true,message : "Alert removed succesfully"});
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}