import prisma from '@repo/db';
import { metric_aggregation_method, metric_type } from '@repo/db/client';
import express from 'express'
import { extractAuditInfo } from '../../util/ip-agent';

interface myBody {
    flag_environment_id : string,
    metric_name : string,
    metric_key : string,
    metric_type : metric_type,
    is_active : boolean,
    unit_measurement : string,
    aggregation_method : metric_aggregation_method,
    description : string,
    tags? : string[]
}

export const createMetric = async (req : express.Request , res : express.Response) => {
    try{
         const userRole = req.session.user?.userRole;
        if(userRole === undefined  || ((userRole === "VIEWER") || (userRole === "MEMBER"))){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        const {
            flag_environment_id,metric_name,metric_key,metric_type,is_active,unit_measurement,aggregation_method,description,tags
        } = req.body as myBody

        // Zod
        const organisationId = req.session.user?.userOrganisationId!;
        const userId = req.session.user?.userId;
        
        const createMetric = await prisma.metrics.create({
            data : {
                organization_id : organisationId,
                flag_environment_id,metric_key,metric_name,metric_type,is_active,unit_measurement,aggregation_method,description,tags
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
                resource_type: 'METRIC',
                resource_id: createMetric.id,
                attributes_changed: {
                    metric_name,
                    metric_key,
                    metric_type,
                    is_active,
                    unit_measurement,
                    aggregation_method,
                    description,
                    tags: tags || [],
                    flag_environment_id
                },
                ip_address: ip,
                user_agent: userAgent
            }
        });

        res.status(200).json({success : true , message : "Metric Created Succesfully"});
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}