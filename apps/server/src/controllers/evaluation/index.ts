import express from 'express'
import {getFlagWithKillSwitches} from '../../services/redis/killSwitchCaching'
import { environment_type } from '@repo/db/client';
import { RolloutConfig } from '@repo/types/rollout-config';

import { Redis_Value } from '../../services/redis/redis-flag';
import { killSwitchValue } from '../../services/redis/killSwitchCaching';

interface flagEvaluationBody {
    flagKey : string,
    orgSlug : string,
    environment : environment_type,
}

export const flagEvaluation = async (req : express.Request,res : express.Response) => {
    try{
        // Get the Flag Key , OrgSlug and Environment 
        const {flagKey , orgSlug , environment} = req.body as flagEvaluationBody;
        const flagAndKillSwitchDataFromCache = await  getFlagWithKillSwitches(orgSlug,flagKey,environment);
        if(!flagAndKillSwitchDataFromCache.flagData){
            res.status(400).json({success : false,message : "Flag Does not Exist"});
            return;
        }
        let serveDefaultValue : boolean = false;
        if(flagAndKillSwitchDataFromCache.killSwitches){
            serveDefaultValue = true;
        }
        const flagDataFromCache = flagAndKillSwitchDataFromCache.flagData;
        // const killSwitchDataFromCache = flagAndKillSwitchDataFromCache.killSwitches;
        const environmentDataFromCache = {
            environment,
            is_environment_active : flagDataFromCache.is_environment_active,
            value : flagDataFromCache.value,
            default_value : flagDataFromCache.default_value
        }
        const rulesFromCache = flagDataFromCache.rules;
        const rolloutFromCache = flagDataFromCache.rollout_config;

        if(!flagDataFromCache.is_active || !environmentDataFromCache.is_environment_active){
            serveDefaultValue = true
        }
        // If Default Value is to be served Does not Matter What Flag Type it is
        if(serveDefaultValue){
            res.status(200).json({success : true , 
                data : {
                    default_value : flagDataFromCache.default_value
                }
            })
            return;
        }
        // If Default Value is not be served , we need to perform Eval based on Rollout and FlagType
        // OR Between Different Rules and AND for Conditions under a Rule
        
        

    }
    catch(e)
    {
        console.error(e);
        res.status(500).json({success : false, message : "Internal Server Error"});
    }
}
