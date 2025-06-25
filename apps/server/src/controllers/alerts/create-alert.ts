import prisma from '@repo/db';
import { alert_operator } from '@repo/db/client';
import express from 'express'
import { extractAuditInfo } from '../../util/ip-agent';

interface myBody {
    metric_id : string,
    operator : alert_operator,
    threshold : number, 
    is_enabled : boolean
}   

export const createAlert = async (req : express.Request , res : express.Response) => {
    try{    
        const userRole = req.session.user?.userRole;
        if(userRole === undefined  || ((userRole === "VIEWER") || (userRole === "MEMBER"))){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        
        const { metric_id, operator, threshold, is_enabled } = req.body as myBody;
        const organisationId = req.session.user?.userOrganisationId!;
        const userId = req.session.user?.userId;
        
        const alertCreation = await prisma.alert_metric.create({
            data : {
                metric_id,operator,threshold,is_enabled
            }
        });

        // Extract audit information
        const { ip, userAgent } = extractAuditInfo(req);

        // Create audit log entry
        await prisma.audit_logs.create({
            data: {
                organisation_id: organisationId,
                user_id: userId,
                action: 'CREATE',
                resource_type: 'ALERT',
                resource_id: alertCreation.id,
                attributes_changed: {
                    metric_id,
                    operator,
                    threshold,
                    is_enabled,
                    user_role: userRole
                },
                ip_address: ip,
                user_agent: userAgent
            }
        });

        res.status(200).json({success : true , message : "Alert for Metric Created Successfully"});
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}