import express from 'express'
import prisma from '@repo/db';
import { killSwitchValue, setKillSwitch } from '../../services/redis/redis-flag';
import { killSwitchFlagConfig } from '@repo/types/kill-switch-flag-config';

export const getAllKillSwitches = async (req: express.Request, res: express.Response) => {
    try {
        const organisation_id = req.session.user?.userOrganisationId!;
        const killSwitches = await prisma.kill_switches.findMany({
                where: {
                    organization_id : organisation_id
                },
                include : {
                    flag_mappings : true
                }
        });
        const data : killSwitchValue[] = []
        const orgSlug = req.session.user?.userOrganisationSlug!;
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
            
            const killSwitchData : killSwitchValue = {
                id : killSwitch.id,
                is_active : killSwitch.is_active,
                flag
            }
            
            await setKillSwitch(killSwitch.id,orgSlug,killSwitchData);
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
        const killSwitchData : killSwitchValue = {
            id : killSwitchId,
            is_active : killSwitch.is_active,
            flag
        }
        await setKillSwitch(killSwitchId,orgSlug,killSwitchData);
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