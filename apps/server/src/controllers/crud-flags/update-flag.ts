import express from 'express'
import prisma from '@repo/db';
import {rollout_type} from '@repo/db/node_modules/@prisma/client'

export const updateRules = async (req : express.Request , res : express.Response) => {
    try{
        const{
            flagId  ,         // FF
            flagDescription , // FF
            isActive ,         // FF
            flagRuleId,         // FR
            ruleDescription , // FR
            conditions ,       //FR
            ruleName,         // FR
            isEnabled ,       // FR
            value,              // FR
            rollout_id,
            rollout_type, // FRout
            rollout_config , // FRout
            } = req.body;

            // Input Sanitisation
            // FF Table inputs
            const featureFlagUpdates: {description? : string , is_active? : boolean} = {};
            if(flagDescription)
                featureFlagUpdates['description'] = flagDescription
            if(isActive)
                featureFlagUpdates['is_active'] = isActive
            // FR table inputs
            const flagRuleUpdates : {
                                    description? : string,
                                    conditions? : Record<string, any> , 
                                    name? : string,
                                    is_enabled? : boolean ,
                                    value? : Record<string, any> 
                                    }   = {};
            if(ruleDescription) flagRuleUpdates['description'] = ruleDescription
            if(conditions) flagRuleUpdates['conditions'] = conditions
            if(ruleName) flagRuleUpdates['name'] = ruleName
            if(isEnabled) flagRuleUpdates['is_enabled'] = isEnabled
            if(value) flagRuleUpdates['value'] = value;

            // FRout table inputs
            const flagRolloutUpdates : {type? : rollout_type , config? : Record<string, any> } = {} 
            if(rollout_config) flagRolloutUpdates['config'] = rollout_config;
            if(rollout_type) flagRolloutUpdates['type'] = rollout_type;
            
            const results = await prisma.$transaction(async (tx)=>{
                    await prisma.feature_flags.update({
                        where : {   
                            id : flagId
                        },
                        data : featureFlagUpdates
                    });

                    await prisma.flag_rules.update({
                        where : {
                            id : flagRuleId
                        },
                        data :  flagRuleUpdates
                    })
                    await prisma.flag_rollout.update({
                        where : {
                            id : rollout_id
                        },
                        data : flagRolloutUpdates
                    });
                });
                
                
    }
    catch(e){
        console.error(e);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

