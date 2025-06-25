import { alert_operator } from '@repo/db/client';
import express from 'express'
import prisma from '@repo/db';
import { extractAuditInfo } from '../../util/ip-agent';

interface myBody {
    threshold : number,
    metric_id : string,
    operator : alert_operator,
    is_enabled : boolean
}

export const updateAlert = async (req : express.Request,res : express.Response) => {
    try{
        const userRole = req.session.user?.userRole;
        if(userRole === undefined  || ((userRole === "VIEWER") || (userRole === "MEMBER"))){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        
        const { threshold, metric_id, operator, is_enabled } = req.body as myBody;
        const organisationId = req.session.user?.userOrganisationId!;
        const userId = req.session.user?.userId;
        
        // Get current alert state for audit comparison
        const currentAlert = await prisma.alert_metric.findUnique({
            where: { metric_id },
            select: {
                threshold: true,
                operator: true,
                is_enabled: true,
                metric_id: true
            }
        });

        if (!currentAlert) {
            res.status(404).json({success: false, message: "Alert not found"});
            return;
        }

        const updatedAlert = await prisma.alert_metric.update({
            where : {
                metric_id
            },
            data : {
                threshold,operator,is_enabled
            }
        });

        // Extract audit information
        const { ip, userAgent } = extractAuditInfo(req);

        // Prepare attributes changed object showing old vs new values
        const attributesChanged: any = {
            old_values: currentAlert,
            new_values: {
                threshold,
                operator,
                is_enabled,
                metric_id
            }
        };

        // Only include fields that actually changed
        const changedFields: any = {};
        if (currentAlert.threshold !== threshold) changedFields.threshold = { old: currentAlert.threshold, new: threshold };
        if (currentAlert.operator !== operator) changedFields.operator = { old: currentAlert.operator, new: operator };
        if (currentAlert.is_enabled !== is_enabled) changedFields.is_enabled = { old: currentAlert.is_enabled, new: is_enabled };

        attributesChanged.changed_fields = changedFields;
        attributesChanged.user_role = userRole;

        // Create audit log entry
        await prisma.audit_logs.create({
            data: {
                organisation_id: organisationId,
                user_id: userId,
                action: 'UPDATE',
                resource_type: 'ALERT',
                resource_id: updatedAlert.id,
                attributes_changed: attributesChanged,
                ip_address: ip,
                user_agent: userAgent
            }
        });

        res.status(200).json({success: true, message: "Alert updated successfully"});
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}