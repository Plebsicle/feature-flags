import prisma from '@repo/db';
import { alert_operator } from '@repo/db/client';
import express from 'express'

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
        const {metric_id , operator,threshold,is_enabled} = req.body as myBody;
        const alertCreation = await prisma.alert_metric.create({
            data : {
                metric_id,operator,threshold,is_enabled
            }
        });
        res.status(200).json({success : true , message : "Alert for Metric Created Successfully"});
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}