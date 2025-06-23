import prisma from '@repo/db';
import express from 'express'

export const getAlerts = async (req : express.Request,res : express.Response) => {
    try{
        const userRole = req.session.user?.userRole;
        if(userRole === undefined  || ((userRole === "VIEWER") || (userRole === "MEMBER"))){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
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