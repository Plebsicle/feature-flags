import prisma from '@repo/db';
import express from 'express'
import { extractAuditInfo } from '../../util/ip-agent';

export const getMetrics = async (req : express.Request , res : express.Response) => {
    try{
         const userRole = req.session.user?.userRole;
        if(userRole === undefined  || ((userRole === "ADMIN") || (userRole === "OWNER"))){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        const organisationId = req.session.user?.userOrganisationId;
        const userId = req.session.user?.userId;
        
        const metrics = await prisma.metrics.findMany({
            where : {
                organization_id : organisationId
            }
        });

        // Extract audit information
        const { ip, userAgent } = extractAuditInfo(req);

        // Create audit log entry for bulk metrics access
        await prisma.audit_logs.create({
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

        res.status(200).json({success : true,message : "Metrics Fetched Succesfully",data : metrics});
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}

export const getMetricbyId = async(req : express.Request , res : express.Response) => {
    try{
        const userRole = req.session.user?.userRole;
        if(userRole === undefined  || ((userRole === "VIEWER") || (userRole === "MEMBER"))){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        
        const organisationId = req.session.user?.userOrganisationId;
        const userId = req.session.user?.userId;
        const metricId = req.params.metricId;
        
        const metrics = await prisma.metrics.findUnique({
            where : {
                id: metricId
            }
        });

        if (!metrics) {
            res.status(404).json({success: false, message: "Metric not found"});
            return;
        }

        // Extract audit information
        const { ip, userAgent } = extractAuditInfo(req);

        // Create audit log entry for specific metric access
        await prisma.audit_logs.create({
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

        res.status(200).json({success : true,message : "Metric Fetched Succesfully", data : metrics});
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}