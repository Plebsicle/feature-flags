import prisma from '@repo/db';
import express from 'express'
import { getFeatureFlagParamsSchema, getFlagEnvironmentParamsSchema, getRulesParamsSchema, getRolloutParamsSchema, getAuditLogsParamsSchema } from '../../util/zod';
import { Redis_Value, refreshOrSetFlagTTL } from '../../services/redis/redis-flag';
import { Condition, Conditions } from '@repo/types/rule-config';
import { updateEnvironmentRedis, updateFeatureFlagRedis, updateFlagRolloutRedis, updateFlagRulesRedis } from '../../services/redis/redis-flag';
import { environment_type,RedisCacheRules } from '../../services/redis/redis-flag';
import { RolloutConfig } from '@repo/types/rollout-config';

// Internal function to get complete flag data for caching
const getCompleteFlagData = async (flagId: string, environment?: environment_type): Promise<Redis_Value[]> => {
    const flagData = await prisma.feature_flags.findUnique({
        where: { id: flagId },
        include: {
            environments: {
                where: environment ? { environment } : {},
                include: {
                    rules: {
                        orderBy: { created_at: 'asc' }
                    },
                    rollout: true
                }
            }
        }
    });

    if (!flagData) {
        throw new Error('Flag not found');
    }
    const environments = flagData.environments;
    const finalData : Redis_Value[] = [];
    for(const environment of environments){
        const rules : RedisCacheRules[] = [];
        environment.rules.forEach((rule)=>{
            rules.push({
                rule_id : rule.id,
                conditions : rule.conditions as unknown as Conditions,
                is_enabled : rule.is_enabled
            });
        });
        const objectToPush : Redis_Value = {
            flagId : flagData.id,
            environment : environment.environment,
            is_active : flagData.is_active,
            is_environment_active : environment.is_enabled,
            value : environment.value as Record<string,any>,
            default_value : environment.default_value as Record<string,any>,
            rules,
            rollout_config : environment.rollout?.config as unknown as RolloutConfig
        }
        finalData.push(objectToPush);
    }
    return finalData;
};

export const getAllFeatureFlags = async(req : express.Request,res : express.Response)=>{
    try{
        const userRole = req.session.user?.userRole;
        if(userRole === undefined  || (userRole === "VIEWER")){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        const organisationId = req.session.user?.userOrganisationId;
        if(!organisationId){
            res.json(400).json({success:false,message:"Unauthorised User"});
            return;
        }
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

export const getFeatureFlagData = async ( req : express.Request,res : express.Response) => {
    try{
        // Zod validation
        const userRole = req.session.user?.userRole;
        if(userRole === undefined  || (userRole === "VIEWER")){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        const parsedParams = getFeatureFlagParamsSchema.parse(req.params);
        req.params = parsedParams;
        
        const flagId = req.params.flagId;
        
        // Get complete flag data with all environments
        const completeFlag = await getCompleteFlagData(flagId);
        const flag = await prisma.feature_flags.findUnique({
            where : {
                id : flagId
            }
        });
        if(!flag){
            res.status(400).json({success : false,message : "Flag Id Missing" });
            return;
        }
        if (!completeFlag) {
            res.status(404).json({
                success: false,
                message: "Flag not found"
            });
            return;
        }
        const orgSlug = req.session.user?.userOrganisationSlug!;
        for (const env of completeFlag) {
            await updateFeatureFlagRedis(orgSlug,flag.key,env.environment,env,flag.flag_type);
        }
        
        // Return only flag data (not environment-specific info)
        const flagResponse = {
            id: flag.id,
            organization_id: flag.organization_id,
            name: flag.name,
            key: flag.key,
            description: flag.description,
            flag_type: flag.flag_type,
            is_active: flag.is_active,
            created_by: flag.created_by,
            created_at: flag.created_at,
            updated_at: flag.updated_at,
            tags: flag.tags
        };
        res.status(200).json({data : flagResponse , success : true,message : "Flag Data Fetched Succesfully"});
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
        
        const userRole = req.session.user?.userRole;
        if(userRole === undefined  || (userRole === "VIEWER")){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        const flagId = req.params.flagId;
        console.log(flagId);
        // Get complete flag data with all environments
        const completeFlag = await getCompleteFlagData(flagId);
        const flag = await prisma.feature_flags.findUnique({
            where : {
                id : flagId
            },include : {
                environments : true
            }
        });

        if(!flag){
            res.status(400).json({success : false,message : "Flag Id Missing" });
            return;
        }
        if (!completeFlag) {
            res.status(404).json({
                success: false,
                message: "Flag not found"
            });
            return;
        }
        // Cache complete data for each environment
        const orgSlug = req.session.user?.userOrganisationSlug!;
        for (const env of completeFlag) {
            await updateFeatureFlagRedis(orgSlug,flag.key,env.environment,env,flag.flag_type);
        }
        
        // Return only environment data
        const flag_type = flag.flag_type;
        const environmentData = flag.environments.map(env => ({
            id: env.id,
            environment: env.environment,
            value: env.value,
            default_value : env.default_value,
            is_enabled: env.is_enabled,
            created_at: env.created_at,
            updated_at: env.updated_at
        }));
        
        res.status(200).json({data : {
            environmentData , 
            flag_id: flagId,
            flag_type
        } , success : true,message : "Flag Environments fetched succesfully"});
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
        
        const userRole = req.session.user?.userRole;
        if(userRole === undefined  || (userRole === "VIEWER")){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        const environmentId = req.params.environmentId;
        
        // Get flag environment with flag details
        const environmentData = await prisma.flag_environments.findUnique({
            where: { id: environmentId },
            include: {
                flag: true,
                rules: true,
                rollout: true
            }
        });
        
        if (!environmentData) {
            res.status(404).json({message : "Environment not found",success : false});
            return;
        }
        
        // Build complete cache data
        const completeData : Redis_Value = {
            flagId: environmentData.flag.id,
            is_active: environmentData.flag.is_active,
            environment : environmentData.environment,
            is_environment_active: environmentData.is_enabled,
            value: environmentData.value as Record<string,any>,
            default_value: environmentData.default_value as Record<string,any>,
            rules: environmentData.rules.map(rule => ({
                rule_id: rule.id,
                conditions: rule.conditions as unknown as Conditions,
                is_enabled: rule.is_enabled
            })),
            rollout_config: environmentData.rollout?.config as unknown as RolloutConfig
        };
        
        // Cache the complete data
        const orgSlug = req.session.user?.userOrganisationSlug!;
        await refreshOrSetFlagTTL(
            orgSlug,
            environmentData.flag.key,
            environmentData.flag.flag_type,
            completeData,
            environmentData.environment
        );
        
        // Return only rules data in the expected format
        const rulesResponse = environmentData.rules.map(rule => ({
            ...rule
        }));
        
        res.status(200).json({data : rulesResponse, success : true , message : "Rules for environment fetched successfuly"});
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
        
        const userRole = req.session.user?.userRole;
        if(userRole === undefined  || (userRole === "VIEWER")){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        const parsedParams = getRolloutParamsSchema.parse(req.params);
        req.params = parsedParams;
        
        const environmentId = req.params.environmentId;
        
        // Get flag environment with flag details and rollout
        const environmentData = await prisma.flag_environments.findUnique({
            where: { id: environmentId },
            include: {
                flag: true,
                rules: true,
                rollout: true
            }
        });
        
        if (!environmentData || !environmentData.rollout) {
            res.status(404).json({message : "Rollout not Found",success : false});
            return;
        }
        
        // Build complete cache data
        const completeData : Redis_Value = {
            flagId: environmentData.flag.id,
            is_active: environmentData.flag.is_active,
            environment : environmentData.environment,
            is_environment_active: environmentData.is_enabled,
            value: environmentData.value as Record<string,any>,
            default_value: environmentData.default_value as Record<string,any>,
            rules: environmentData.rules.map(rule => ({
                rule_id: rule.id,
                conditions: rule.conditions as unknown as Conditions,
                is_enabled: rule.is_enabled
            })),
            rollout_config: environmentData.rollout?.config as unknown as RolloutConfig
        };
        
        // Cache the complete data
        const orgSlug = req.session.user?.userOrganisationSlug!;
        await refreshOrSetFlagTTL(
            orgSlug,
            environmentData.flag.key,
            environmentData.flag.flag_type,
            completeData,
            environmentData.environment
        );
        
        // Return rollout data in the expected format
        const rolloutResponse = {
            ...environmentData.rollout
        };
        
        res.status(200).json({data : rolloutResponse, success : true , message : "Rollout for environment fetched successfuly"});
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
        // Zod validation
        const userRole = req.session.user?.userRole;
        if(userRole === undefined  || (userRole === "VIEWER")){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        const parsedParams = getAuditLogsParamsSchema.parse(req.params);
        req.params = parsedParams;
        
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