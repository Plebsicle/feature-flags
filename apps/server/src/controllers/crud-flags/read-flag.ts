import prisma from '@repo/db';
import express from 'express'


export const getAllFeatureFlags = async(req : express.Request,res : express.Response)=>{
    try{
        const organisationId = req.session.user?.userOrganisationId;
        const allFlags = await prisma.feature_flags.findMany({
            where : {
                organization_id : organisationId
            }
        });
        res.status(200).json({data : allFlags , success : true, message : "Flag Data Fetched Succesfully"});
    }
    catch(e){
            console.error('Error All feature flags:', e);
            res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

export  const getFeatureFlagData = async ( req : express.Request,res : express.Response) => {
    try{
        const flagId = req.params.flagId;
        const flagData = await prisma.feature_flags.findUnique({
            where : {
                id : flagId
            }
        });
        res.status(200).json({data : flagData , success : true,message : "Flag Data Fetched Succesfully"});
    }   
    catch(e){
         console.error('Error fetching feature flag:', e);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

export const getFlagEnvironmentData = async (req : express.Request,res : express.Response)=>{
    try{
        const flagId = req.params.flagId;
        const environmentData = await prisma.flag_environments.findMany({
            where : {
                flag_id : flagId
            }
        });
        res.status(200).json({data : environmentData , success : true,message : "Flag Environments fetched succesfully"});
    }
     catch(e){
         console.error('Error fetching Environment Details:', e);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

export const getRules = async (req : express.Request,res : express.Response) => {
    try{
        const environmentId = req.params.environmentId;
        const environmentRules = await prisma.flag_rules.findMany({
            where : {
                flag_environment_id : environmentId
            }
        });
        res.status(200).json({data : environmentRules, success : true , message : "Rules for environment fetched successfuly"});
    }
    catch(e){
        console.error('Error fetching rules for the environment:', e);
        res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
    }
}


export const getRollout = async (req : express.Request , res : express.Response) => {
    try{
        const environmentId = req.params.environmentId;
        const rollout = await prisma.flag_rollout.findUnique({
            where : {
                flag_environment_id : environmentId
            }
        });
        res.status(200).json({data : rollout, success : true , message : "Rollout for environment fetched successfuly"});
    }
    catch(e){
        console.error('Error fetching rollout details:', e);
        res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
    }
}

export const getAuditLogs = async (req : express.Request,res : express.Response)=>{
    try{
        const role = req.session.user?.userRole;
         if(role === "VIEWER"){
            res.status(401).json({success : false,message : "Role is not Sufficient"});
            return;
        } 
        const organisation_id = req.session.user?.userOrganisationId;
        const flagId = req.params.flagId;
        const auditLogs = await prisma.audit_logs.findMany({
            where : {
                organisation_id : organisation_id
            }
        });
        res.status(200).json({data : auditLogs, success : true , message : "Audit Logs for Flag fetched successfuly"});
    }
    catch(e){
        console.error('Error fetching Audit Logs:', e);
        res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
    }
}