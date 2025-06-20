import prisma from '@repo/db';
import express from 'express'

export const getAlerts = async (req : express.Request,res : express.Response) => {
    try{
        const {metric_id}  = req.body;
        const metricData = await prisma.alert_metric.findUnique({
            where : {
                metric_id
            }
        });

        res.status(200).json({sucess : true,message : "data fetched succesfully",data : metricData});
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}