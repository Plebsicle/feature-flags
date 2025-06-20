import prisma from '@repo/db';
import { metric_aggregation_method, metric_type } from '@repo/db/client';
import express from 'express'

interface myBody {
    metric_id : string,
    metric_name : string,
    metric_type : metric_type,
    is_active : boolean,
    unit_measurement : string,
    aggregation_method : metric_aggregation_method,
    description : string,
    tags : string[]
}

export const updateMetric = async (req : express.Request , res : express.Response) => {
    try{
        const {
            metric_id,
            metric_name,metric_type,is_active,unit_measurement,aggregation_method,description,tags
        } = req.body as myBody

        // Zod
        const organisationId = req.session.user?.userOrganisationId!;
        const updateMetric = await prisma.metrics.update({
            where : {
                id : metric_id
            },
            data : {
                aggregation_method,
                metric_name,
                metric_type,
                description,
                tags,
                is_active,
                unit_measurement
            }
        })

        res.status(200).json({success : true , message : "Metric Updated Succesfully"});
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}