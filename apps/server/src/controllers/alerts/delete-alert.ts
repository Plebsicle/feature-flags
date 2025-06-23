import prisma from '@repo/db';
import express from 'express'

export const deleteAlert = async (req : express.Request,res : express.Response) => {
    try{    
       const userRole = req.session.user?.userRole;
        if(userRole === undefined  || ((userRole === "VIEWER") || (userRole === "MEMBER"))){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        const metricId = req.params.metricId;
        if(!metricId){
            res.status(400).json({success : false,message : "Metric Id Needed"});
            return;
        }
        await prisma.alert_metric.delete({
            where : {
                metric_id : metricId
            }
        });
        res.status(200).json({success : true,message : "Alert removed succesfully"});
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}