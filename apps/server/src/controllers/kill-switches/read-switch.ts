import { getKillSwitch } from '../../services/redis/killSwitchCaching';
import express from 'express'
import prisma from '@repo/db';
import { killSwitchFlagConfig } from '@repo/types/kill-switch-flag-config';
import { setKillSwitch } from '../../services/redis/killSwitchCaching';

export const getAllKillSwitches = async (req: express.Request, res: express.Response) => {
    try {
         const userRole = req.session.user?.userRole;
        if(userRole === undefined  || ((userRole === "VIEWER") || (userRole === "MEMBER"))){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        const organisation_id = req.session.user?.userOrganisationId!;
        const killSwitches = await prisma.kill_switches.findMany({
                where: {
                    organization_id : organisation_id
                },
                include : {
                    flag_mappings : true
                }
        });

        const orgSlug = req.session.user?.userOrganisationSlug!;
        
        // Ensure all kill switches are cached
        for(const killSwitch of killSwitches){
            const flag : killSwitchFlagConfig[] = await Promise.all( killSwitch.flag_mappings.map(async (fm) => {
                const flagData = await prisma.feature_flags.findUnique({
                    where : {
                        id : fm.flag_id
                    }
                });

                return {
                    flagKey : flagData?.key || "",
                    environments : fm.environments
                }
            }));
            
            const killSwitchData = {
                id : killSwitch.id,
                killSwitchKey: killSwitch.killSwitchKey,
                is_active : killSwitch.is_active,
                flag
            };
            
            // Use the new caching function to ensure Redis is up to date
            await setKillSwitch(killSwitch.killSwitchKey, orgSlug, killSwitchData);
        }

        res.status(200).json({
            success: true,
            data: {
                killSwitches
            }
        });

    } catch (error) {
        console.error('Error fetching kill switches:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal Server Error"
        });
    }
};

// Get Specific Kill Switch by ID
export const getKillSwitchById = async (req: express.Request, res: express.Response) => {
    try {
        const killSwitchId = req.params.killSwitchId;
        
        if (!killSwitchId) {
            res.status(400).json({
                success: false,
                message: "Kill switch ID is required"
            });
            return;
        }

        const organisation_id = req.session.user?.userOrganisationId!;

        const killSwitch = await prisma.kill_switches.findUnique({
            where: {
                id: killSwitchId,
                organization_id: organisation_id
            },
            include : {
                flag_mappings : true
            }
        });
        
        if (!killSwitch) {
             res.status(404).json({
                success: false,
                message: "Kill switch not found or access denied"
            });
            return;
        }
        
        const flag : killSwitchFlagConfig[] = await Promise.all(killSwitch.flag_mappings.map(async (fm) => {
            const flagData = await prisma.feature_flags.findUnique({
                where : {
                    id : fm.flag_id
                }
            });

                return {
                    flagKey : flagData?.key || '',
                    environments : fm.environments
                }
        }));

        const orgSlug = req.session.user?.userOrganisationSlug!;
        const killSwitchData = {
            id : killSwitchId,
            killSwitchKey: killSwitch.killSwitchKey,
            is_active : killSwitch.is_active,
            flag
        };
        
        // Use the new caching function to ensure Redis is up to date
        await setKillSwitch(killSwitch.killSwitchKey, orgSlug, killSwitchData);
        
        res.status(200).json({
            success: true,
            data: killSwitch
        });

    } catch (error) {
        console.error('Error fetching kill switch:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal Server Error"
        });
    }
};