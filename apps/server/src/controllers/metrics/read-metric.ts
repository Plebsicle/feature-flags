import prisma from '@repo/db';
import express from 'express'

export const getMetrics = async (req : express.Request , res : express.Response) => {
    try{
         const userRole = req.session.user?.userRole;
        if(userRole === undefined  || ((userRole === "ADMIN") || (userRole === "OWNER"))){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        const organisationId = req.session.user?.userOrganisationId;
        const metrics = await prisma.metrics.findMany({
            where : {
                organization_id : organisationId
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
        // const organisationId = req.session.user?.userOrganisationId;
        const metricId = req.params.metricId;
        const metrics = await prisma.metrics.findUnique({
            where : {
                id: metricId
            }
        });

        res.status(200).json({success : true,message : "Metric Fetched Succesfully", data : metrics});
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}