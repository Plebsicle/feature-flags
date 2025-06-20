import prisma from '@repo/db';
import express from 'express'

export const getMetrics = async (req : express.Request , res : express.Response) => {
    try{
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
        // const organisationId = req.session.user?.userOrganisationId;
        const {metric_id} = req.body;
        const metrics = await prisma.metrics.findUnique({
            where : {
                id: metric_id
            }
        });

        res.status(200).json({success : true,message : "Metric Fetched Succesfully", data : metrics});
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}