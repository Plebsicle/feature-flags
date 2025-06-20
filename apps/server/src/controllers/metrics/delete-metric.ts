import prisma from "@repo/db";
import express from 'express'

export const deleteMetric = async (req:express.Request,res:express.Response) => {
    try{    
        const metricId = req.params.metricId;
        
        const deleteMetric = await prisma.metrics.delete({
            where : {
                id : metricId
            }
        });
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}