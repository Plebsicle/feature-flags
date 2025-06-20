import prisma from '@repo/db';
import express from 'express'

export const getAlerts = async (req : express.Request,res : express.Response) => {
    try{
        const metricId = req.params.metricId;
        const metricData = await prisma.alert_metric.findUnique({
            where : {
                metric_id : metricId
            }
        });

        res.status(200).json({success : true,message : "data fetched succesfully",data : metricData});
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}