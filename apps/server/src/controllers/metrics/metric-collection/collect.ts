import { conversion_step_type, metric_event_type, PrismaClient } from '@repo/db/client';
import express from 'express'
import prisma from '@repo/db';

interface MetricCollectionBody {
    metric_key : string,
    orgSlug : string,
    part_rollout : boolean,
    variation_served? : string,
    event_type : metric_event_type,
    numeric_value? : number,
    conversion_step? : conversion_step_type
}


class CollectMetrics {
    constructor(private prisma : PrismaClient){

    }
    private  async fetchOrganisationIdFromSlug(orgSlug : string) : Promise<string | null> {
        try{
            const result = await this.prisma.organizations.findUnique({
            where : {
                slug : orgSlug
            },
            select : {
                id : true
            }
            });
        
            if(result) return result.id;
            return null;
        }
        catch(e){
            console.error(e);
            return null;
        }
    }
    private async fetchMetricId(organisationId  : string,metric_key : string): Promise<string | null> {
        try{
            const result = await this.prisma.metrics.findUnique({
            where : {
                organization_id_metric_key : {
                    organization_id : organisationId,
                    metric_key
                }
            },
            select : {
                id : true
            }
            });
            if(result) return result.id
            return null; 
        }   
        catch(e){
            console.error(e);
            return null;
        }
    }
    private async markMetricCollected(metricId : string , requestData : Omit<MetricCollectionBody,'orgSlug'>) {
        try{
            const result = await this.prisma.metric_events.create({
                data : {
                    metric_key : requestData.metric_key,
                    event_type : requestData.event_type,
                    conversion_step : requestData.conversion_step,
                    numeric_value : requestData.numeric_value,
                    variation_served : requestData.variation_served,
                    metric_id : metricId,
                    part_rollout : requestData.part_rollout
                },select : {
                    id : true
                }
            });
            if(result) return true;
            return false;
        }
        catch(e){
            console.error(e);
            return false;
        }
    }
    collectOrganisationMetric = async (req : express.Request , res : express.Response) => {
        try{
            const {orgSlug,metric_key,part_rollout,variation_served,event_type,numeric_value,conversion_step} = req.body as MetricCollectionBody;
            const organisationId = await this.fetchOrganisationIdFromSlug(orgSlug);
            if(!organisationId){
                res.status(400).json({success : false , message : "Incorrect Org Slug"});
                return;
            }
            const metricId = await this.fetchMetricId(organisationId,metric_key);
            if(!metricId){
                res.status(400).json({success : false , message : "Incorrect Metric Key"});
                return;
            }
            const metricCollection = await this.markMetricCollected(metricId,{metric_key,part_rollout,variation_served,event_type,numeric_value,conversion_step});
            if(!metricCollection){
                res.status(500).json({success : false, message : "Internal Server Error"});
                return;
            }
            res.status(200).json({success : true , message : "Metrics Collected"});
        }
        catch(e){
            console.error(e);
            res.status(500).json({success : false , message : "internal Server Error"});
        }
    }
}

export const collectMetric = new CollectMetrics(prisma);