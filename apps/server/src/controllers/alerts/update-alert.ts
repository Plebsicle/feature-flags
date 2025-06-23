import { alert_operator } from '@repo/db/client';
import express from 'express'
import prisma from '@repo/db';

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
        const {threshold,metric_id,operator,is_enabled} = req.body as myBody;
        await prisma.alert_metric.update({
            where : {
                metric_id
            },
            data : {
                threshold,operator,is_enabled
            }
        });
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}