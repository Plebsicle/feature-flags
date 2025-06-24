import prisma from '@repo/db';
import express from 'express'
import { extractAuditInfo } from '../../util/ip-agent';
import {killSwitchFlagConfig} from '@repo/types/kill-switch-flag-config'
import { setKillSwitch, invalidateFlagCacheForKillSwitch } from '../../services/redis/killSwitchCaching';
interface MyRequestBody {
  name: string;
  description?: string;
  flags: killSwitchFlagConfig[]
  killSwitchKey : string
}

export const createKillSwitch = async(req : express.Request, res : express.Response) => {
    try{
         const userRole = req.session.user?.userRole;
        if(userRole === undefined  || ((userRole === "VIEWER") || (userRole === "MEMBER"))){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        let {name, description, flags,killSwitchKey} = req.body as MyRequestBody;
        // input sanitation

        flags = flags;
        const { ip, userAgent } = extractAuditInfo(req);
        const organisation_id = req.session.user?.userOrganisationId!;
        const user_id = req.session.user?.userId!;

        // Use transaction to ensure all operations succeed or fail together
        const result = await prisma.$transaction(async (tx) => {
            // Create the kill switch
            const killSwitch = await tx.kill_switches.create({
                data : {
                    organization_id : organisation_id,
                    name,
                    description,
                    created_by : user_id,
                    killSwitchKey
                }
            });

            const kill_switch_id = killSwitch.id;

            // Create kill switch flags and their audit logs
            for(const flag of flags){
                const flagKey = flag.flagKey;
                const environments = flag.environments;
                const flagData = await prisma.feature_flags.findUnique({
                    where : {
                        organization_id_key : {
                            organization_id : organisation_id,
                            key : flagKey
                        }
                    },select : {
                        id  : true
                    }
                });
                if(!flagData){
                    res.status(400).json({success : false,message : "Invalid FlagKey"});
                    return;
                }
                const flagId = flagData.id;
                // Create kill switch flag
                const killSwitchFlag = await tx.kill_switch_flags.create({
                    data : {
                        kill_switch_id,
                        flag_id : flagId,
                        environments
                    }
                });

                // Create audit log for kill switch flag creation
                const flagAttributesChanged: Record<string, { newValue: any, oldValue: any }> = {
                    kill_switch_id: { newValue: kill_switch_id, oldValue: null },
                    flag_id: { newValue: flagId, oldValue: null },
                    environments: { newValue: environments, oldValue: null }
                };

                await tx.audit_logs.create({
                    data : {
                        organisation_id,
                        user_id,
                        ip_address : ip,
                        user_agent : userAgent,
                        resource_type : "KILL_SWITCH_FLAG",
                        resource_id : killSwitchFlag.id,
                        action : "CREATE",
                        attributes_changed: flagAttributesChanged
                    }
                });
            }

            // Create audit log for kill switch creation
            const killSwitchAttributesChanged: Record<string, { newValue: any, oldValue: any }> = {
                organization_id: { newValue: organisation_id, oldValue: null },
                name: { newValue: name, oldValue: null },
                description: { newValue: description, oldValue: null },
                created_by: { newValue: user_id, oldValue: null }
            };

            await tx.audit_logs.create({
                data : {
                    organisation_id,
                    user_id,
                    ip_address : ip,
                    user_agent : userAgent,
                    resource_type : "KILL_SWITCHES",
                    resource_id : kill_switch_id,
                    action : "CREATE",
                    attributes_changed: killSwitchAttributesChanged
                }
            });

            return {killSwitch};
        });
        
        if(!result){
            res.status(400).json({success : false,message : "Invalid Inputs"});
            return;
        }
        
        const orgSlug = req.session.user?.userOrganisationSlug!;
        const killSwitchData = {
            id : result.killSwitch.id,
            killSwitchKey: result.killSwitch.killSwitchKey,
            is_active : result.killSwitch.is_active,
            flag : flags
        };

        // Use the new caching function
        await setKillSwitch(killSwitchKey, orgSlug, killSwitchData);
        
        // Invalidate flag cache for affected flags
        await invalidateFlagCacheForKillSwitch(orgSlug, killSwitchData);
        
        // Return success response
        res.status(201).json({
            success: true,
            message: "Kill switch created successfully",
            data: result
        });
    }
    catch(error){
        console.error('Error creating kill switch:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal Server Error"
        });
    }
}
