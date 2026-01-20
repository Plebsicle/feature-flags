import { getKillSwitch } from '../../services/redis/killSwitchCaching';
import express from 'express'
import { killSwitchIdParamsSchema, validateParams } from '../../util/zod';
import prisma from '@repo/db';
import { killSwitchFlagConfig } from '@repo/types/kill-switch-flag-config';
import { setKillSwitch } from '../../services/redis/killSwitchCaching';
import { ensureString } from '../../util/request-helpers';

interface ReadKillSwitchControllerDependencies {
    prisma: typeof prisma;
}

class ReadKillSwitchController {
    private prisma: typeof prisma;

    constructor(dependencies: ReadKillSwitchControllerDependencies) {
        this.prisma = dependencies.prisma;
    }

    private checkUserAuthorization = (req: express.Request, res: express.Response): boolean => {
        const userRole = req.session.user?.userRole;
        if (userRole === undefined || ((userRole === "VIEWER") || (userRole === "MEMBER"))) {
            res.status(403).json({ success: true, message: "Not Authorised" });
            return false;
        }
        return true;
    };

    private buildKillSwitchFlags = async (flagMappings: any[]): Promise<killSwitchFlagConfig[]> => {
        return Promise.all(flagMappings.map(async (fm) => {
            const flagData = await this.prisma.feature_flags.findUnique({
                where: {
                    id: fm.flag_id
                }
            });

            return {
                flagKey: flagData?.key || "",
                environments: fm.environments
            }
        }));
    };

    getAllKillSwitches = async (req: express.Request, res: express.Response) => {
        try {
            if (!this.checkUserAuthorization(req, res)) return;

            const organisation_id = req.session.user?.userOrganisationId!;
            const killSwitches = await this.prisma.kill_switches.findMany({
                where: {
                    organization_id: organisation_id
                },
                include: {
                    flag_mappings: true
                }
            });

            const orgSlug = req.session.user?.userOrganisationSlug!;
            
            // Ensure all kill switches are cached
            for (const killSwitch of killSwitches) {
                const flag = await this.buildKillSwitchFlags(killSwitch.flag_mappings);
                
                const killSwitchData = {
                    id: killSwitch.id,
                    killSwitchKey: killSwitch.killSwitchKey,
                    is_active: killSwitch.is_active,
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
    getKillSwitchById = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const validatedParams = validateParams(killSwitchIdParamsSchema, req, res);
            if (!validatedParams) return;

            const killSwitchId = ensureString(req.params.killSwitchId, 'killSwitchId');
            
            if (!killSwitchId) {
                res.status(400).json({
                    success: false,
                    message: "Kill switch ID is required"
                });
                return;
            }

            const organisation_id = req.session.user?.userOrganisationId!;

            const killSwitch = await this.prisma.kill_switches.findUnique({
                where: {
                    id: killSwitchId,
                    organization_id: organisation_id
                },
                include: {
                    flag_mappings: true
                }
            });

            if (!killSwitch) {
                res.status(404).json({
                    success: false,
                    message: "Kill switch not found or access denied"
                });
                return;
            }
            

                if (killSwitch?.flag_mappings?.length) {
                await Promise.all(
                    killSwitch.flag_mappings.map(async (mapping: { flag_id: string }) => {
                    const flag = await this.prisma.feature_flags.findUnique({
                        where: {
                            id: mapping.flag_id
                        },
                        select: {
                            key: true,
                        },
                    });
                        (mapping as any).flagKey = flag?.key || null;
                    })
                );
}

            
            
            const flag = await this.buildKillSwitchFlags(killSwitch.flag_mappings);

            const orgSlug = req.session.user?.userOrganisationSlug!;
            const killSwitchData = {
                id: killSwitchId,
                killSwitchKey: killSwitch.killSwitchKey,
                is_active: killSwitch.is_active,
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
}

// Instantiate and export the controller
import dbInstance from '@repo/db';

const readKillSwitchController = new ReadKillSwitchController({
    prisma: dbInstance
});

export const getAllKillSwitches = readKillSwitchController.getAllKillSwitches;
export const getKillSwitchById = readKillSwitchController.getKillSwitchById;