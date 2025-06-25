import { removeKillSwitch } from '../../services/redis/killSwitchCaching';
import express from 'express'
import { extractAuditInfo } from '../../util/ip-agent';
import prisma from '@repo/db';
import { invalidateFlagCacheForKillSwitch } from '../../services/redis/killSwitchCaching';

interface FlagData {
    flagKey: string;
    environments: string[];
}

interface KillSwitchData {
    id: string;
    killSwitchKey: string;
    is_active: boolean;
    flag: FlagData[];
}

interface FlagMappingWithFlag {
    id: string;
    kill_switch_id: string;
    flag_id: string;
    environments: string[];
    flag: {
        key: string;
    };
}

interface ExistingKillSwitch {
    id: string;
    killSwitchKey: string;
    is_active: boolean;
    organization_id: string;
    name: string;
    description: string | null;
    created_by: string;
    activated_by: string | null;
    activated_at: Date | null;
    flag_mappings: FlagMappingWithFlag[];
}

interface DeleteKillSwitchControllerDependencies {
    prisma: typeof prisma;
}

class DeleteKillSwitchController {
    private prisma: typeof prisma;

    constructor(dependencies: DeleteKillSwitchControllerDependencies) {
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

    deleteKillSwitch = async (req: express.Request, res: express.Response) => {
        try {
            if (!this.checkUserAuthorization(req, res)) return;

            const killSwitchId = req.params.killSwitchId;
            
            if (!killSwitchId) {
                res.status(400).json({
                    success: false,
                    message: "Kill switch ID is required"
                });
                return ;
            }

            const { ip, userAgent } = extractAuditInfo(req);
            const organisation_id = req.session.user?.userOrganisationId!;
            const user_id = req.session.user?.userId!;
            const orgSlug = req.session.user?.userOrganisationSlug!;

            const result = await this.prisma.$transaction(async (tx: any) => {
                // Get existing kill switch with all related data for audit logging
                const existingKillSwitch = await tx.kill_switches.findUnique({
                    where: { 
                        id: killSwitchId,
                        organization_id: organisation_id 
                    },
                    include: {
                        flag_mappings: {
                            include: {
                                flag: true
                            }
                        }
                    }
                });

                if (!existingKillSwitch) {
                    throw new Error("Kill switch not found or access denied");
                }

                // Prepare kill switch data for cache invalidation
                

                const killSwitchData: KillSwitchData = {
                    id: killSwitchId,
                    killSwitchKey: (existingKillSwitch as ExistingKillSwitch).killSwitchKey,
                    is_active: (existingKillSwitch as ExistingKillSwitch).is_active,
                    flag: (existingKillSwitch as ExistingKillSwitch).flag_mappings.map((fm: FlagMappingWithFlag): FlagData => ({
                        flagKey: fm.flag.key,
                        environments: fm.environments as string[]
                    }))
                };

                // Create audit logs for each flag mapping deletion
                for (const flagMapping of existingKillSwitch.flag_mappings) {
                    const flagDeleteAttributes: Record<string, { newValue: any, oldValue: any }> = {
                        kill_switch_id: { newValue: null, oldValue: flagMapping.kill_switch_id },
                        flag_id: { newValue: null, oldValue: flagMapping.flag_id },
                        environments: { newValue: null, oldValue: flagMapping.environments }
                    };

                    await tx.audit_logs.create({
                        data: {
                            organisation_id,
                            user_id,
                            ip_address: ip,
                            user_agent: userAgent,
                            resource_type: "KILL_SWITCH_FLAG",
                            resource_id: flagMapping.id,
                            action: "DELETE",
                            attributes_changed: flagDeleteAttributes
                        }
                    });
                }

                // Delete the kill switch (flag mappings will be deleted automatically due to CASCADE)
                const deletedKillSwitch = await tx.kill_switches.delete({
                    where: { id: killSwitchId }
                });

                // Create audit log for kill switch deletion
                const killSwitchDeleteAttributes: Record<string, { newValue: any, oldValue: any }> = {
                    organization_id: { newValue: null, oldValue: existingKillSwitch.organization_id },
                    name: { newValue: null, oldValue: existingKillSwitch.name },
                    description: { newValue: null, oldValue: existingKillSwitch.description },
                    is_active: { newValue: null, oldValue: existingKillSwitch.is_active },
                    created_by: { newValue: null, oldValue: existingKillSwitch.created_by },
                    activated_by: { newValue: null, oldValue: existingKillSwitch.activated_by },
                    activated_at: { newValue: null, oldValue: existingKillSwitch.activated_at }
                };

                await tx.audit_logs.create({
                    data: {
                        organisation_id,
                        user_id,
                        ip_address: ip,
                        user_agent: userAgent,
                        resource_type: "KILL_SWITCHES",
                        resource_id: killSwitchId,
                        action: "DELETE",
                        attributes_changed: killSwitchDeleteAttributes
                    }
                });

                return { deletedKillSwitch, killSwitchData };
            });

            // Remove from cache using the new function
            await removeKillSwitch(result.killSwitchData.killSwitchKey, orgSlug);
            
            // Invalidate flag cache for affected flags
            await invalidateFlagCacheForKillSwitch(orgSlug, result.killSwitchData as any);

            res.status(200).json({
                success: true,
                message: "Kill switch deleted successfully",
                data: {
                    id: killSwitchId,
                    name: result.deletedKillSwitch.name
                }
            });

        } catch (error) {
            console.error('Error deleting kill switch:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Internal Server Error"
            });
        }
    };
}

// Instantiate and export the controller
import dbInstance from '@repo/db';

const deleteKillSwitchController = new DeleteKillSwitchController({
    prisma: dbInstance
});

export const deleteKillSwitch = deleteKillSwitchController.deleteKillSwitch;