import { updateKillSwitchFlagMappings, updateKillSwitchStatus } from '../../services/redis/killSwitchCaching';
import { killSwitchFlagConfig } from '@repo/types/kill-switch-flag-config';
import express from 'express'
import { extractAuditInfo } from '../../util/ip-agent';
import prisma from '@repo/db';
import { updateKillSwitchBodySchema, validateBody } from '../../util/zod';
import { setKillSwitch,invalidateFlagCacheForKillSwitch } from '../../services/redis/killSwitchCaching';

interface UpdateBodyType {
    killSwitchId : string,
    name : string,
    description : string,
    is_active : boolean,
    flags : killSwitchFlagConfig[]
}

interface UpdateKillSwitchControllerDependencies {
    prisma: typeof prisma;
}

class UpdateKillSwitchController {
    private prisma: typeof prisma;

    constructor(dependencies: UpdateKillSwitchControllerDependencies) {
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

    updateKillSwitch = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const validatedBody = validateBody(updateKillSwitchBodySchema, req, res);
            if (!validatedBody) return;

            if (!this.checkUserAuthorization(req, res)) return;
            const killSwitchId = req.params.killSwitchId;
            const {name, description, is_active, flags } = req.body as UpdateBodyType;
            console.log(req.body);
            
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
                // Get existing kill switch for comparison
                const existingKillSwitch = await tx.kill_switches.findUnique({
                    where: { 
                        id: killSwitchId,
                        organization_id: organisation_id 
                    },
                    include: {
                        flag_mappings: true
                    }
                });

                if (!existingKillSwitch) {
                    throw new Error("Kill switch not found or access denied");
                }

                // Prepare update data
                const updateData: any = {};
                const attributesChanged: Record<string, { newValue: any, oldValue: any }> = {};

                if (name !== undefined && name !== existingKillSwitch.name) {
                    updateData.name = name;
                    attributesChanged.name = { newValue: name, oldValue: existingKillSwitch.name };
                }

                if (description !== undefined && description !== existingKillSwitch.description) {
                    updateData.description = description;
                    attributesChanged.description = { newValue: description, oldValue: existingKillSwitch.description };
                }

                if (is_active !== undefined && is_active !== existingKillSwitch.is_active) {
                    updateData.is_active = is_active;
                    updateData.updated_at = new Date();
                    
                    if (is_active) {
                        updateData.activated_at = new Date();
                        updateData.activated_by = user_id;
                    }
                    
                    attributesChanged.is_active = { newValue: is_active, oldValue: existingKillSwitch.is_active };
                    if (is_active) {
                        attributesChanged.activated_at = { newValue: updateData.activated_at, oldValue: existingKillSwitch.activated_at };
                        attributesChanged.activated_by = { newValue: user_id, oldValue: existingKillSwitch.activated_by };
                    }
                }

                // Update kill switch if there are changes
                let updatedKillSwitch = existingKillSwitch;
                if (Object.keys(updateData).length > 0) {
                    updatedKillSwitch = await tx.kill_switches.update({
                        where: { id: killSwitchId },
                        data: updateData,
                        include : {
                            flag_mappings : true
                        }
                    });

                    // Create audit log for kill switch update
                    await tx.audit_logs.create({
                        data: {
                            organisation_id,
                            user_id,
                            ip_address: ip,
                            user_agent: userAgent,
                            resource_type: "KILL_SWITCHES",
                            resource_id: killSwitchId,
                            action: is_active !== undefined ? (is_active ? "ENABLE" : "DISABLE") : "UPDATE",
                            attributes_changed: attributesChanged
                        }
                    });
                }

                // Handle flag updates if provided
                if (flags && Array.isArray(flags)) {
                    interface ExistingFlagMapping {
                        flag_id: string;
                    }

                    const existingFlagIds: string[] = existingKillSwitch.flag_mappings.map((f: ExistingFlagMapping) => f.flag_id);
                    const newFlagKeys = flags.map(f => f.flagKey);

                    // Get new flag IDs
                    const newFlagIds: string[] = [];
                    for (const flag of flags) {
                        const flagData = await this.prisma.feature_flags.findUnique({
                            where : {
                                organization_id_key : {
                                    organization_id : organisation_id,
                                    key : flag.flagKey
                                }
                            }
                        });

                        if(!flagData?.id){
                            res.status(400).json({success : false , message : "Incorrect Key"});
                            return;
                        }
                        newFlagIds.push(flagData.id);
                    }

                    // Remove flags that are no longer in the list
                    interface ExistingFlagMappingWithId extends ExistingFlagMapping {
                        id: string;
                        environments: any;
                    }

                    const flagsToRemove: ExistingFlagMappingWithId[] = existingKillSwitch.flag_mappings.filter(
                        (existing: ExistingFlagMappingWithId) => !newFlagIds.includes(existing.flag_id)
                    );

                    for (const flagToRemove of flagsToRemove) {
                        await tx.kill_switch_flags.delete({
                            where: { id: flagToRemove.id }
                        });

                        // Audit log for flag removal
                        const flagRemoveAttributes: Record<string, { newValue: any, oldValue: any }> = {
                            kill_switch_id: { newValue: null, oldValue: killSwitchId },
                            flag_id: { newValue: null, oldValue: flagToRemove.flag_id },
                            environments: { newValue: null, oldValue: flagToRemove.environments }
                        };

                        await tx.audit_logs.create({
                            data: {
                                organisation_id,
                                user_id,
                                ip_address: ip,
                                user_agent: userAgent,
                                resource_type: "KILL_SWITCH_FLAG",
                                resource_id: flagToRemove.id,
                                action: "DELETE",
                                attributes_changed: flagRemoveAttributes
                            }
                        });
                    }

                    // Add or update flags
                    for (const flag of flags) {
                        const flagData = await this.prisma.feature_flags.findUnique({
                            where : {
                                organization_id_key : {
                                    organization_id : organisation_id,
                                    key : flag.flagKey
                                }
                            }
                        });

                        const flagId = flagData?.id
                        if(!flagId){
                            res.status(400).json({success : false , message : "Incorrect Key"});
                            return;
                        }
                        
                        interface ExistingFlagMappingWithFlagId {
                            id: string;
                            flag_id: string;
                            environments: any;
                        }

                        const existingFlag: ExistingFlagMappingWithFlagId | undefined = existingKillSwitch.flag_mappings.find(
                            (f: ExistingFlagMappingWithFlagId) => f.flag_id === flagId
                        );

                        if (!existingFlag) {
                            // Create new flag mapping
                            const newFlagMapping = await tx.kill_switch_flags.create({
                                data: {
                                    kill_switch_id: killSwitchId,
                                    flag_id: flagId,
                                    environments: flag.environments
                                }
                            });

                            // Audit log for new flag
                            const flagCreateAttributes: Record<string, { newValue: any, oldValue: any }> = {
                                kill_switch_id: { newValue: killSwitchId, oldValue: null },
                                flag_id: { newValue: flagId, oldValue: null },
                                environments: { newValue: flag.environments, oldValue: null }
                            };

                            await tx.audit_logs.create({
                                data: {
                                    organisation_id,
                                    user_id,
                                    ip_address: ip,
                                    user_agent: userAgent,
                                    resource_type: "KILL_SWITCH_FLAG",
                                    resource_id: newFlagMapping.id,
                                    action: "CREATE",
                                    attributes_changed: flagCreateAttributes
                                }
                            });
                        } else {
                            // Update existing flag if environments changed
                            const environmentsChanged = JSON.stringify(existingFlag.environments.sort()) !== 
                                                     JSON.stringify(flag.environments.sort());
                            
                            if (environmentsChanged) {
                                await tx.kill_switch_flags.update({
                                    where: { id: existingFlag.id },
                                    data: { environments: flag.environments }
                                });

                                // Audit log for flag update
                                const flagUpdateAttributes: Record<string, { newValue: any, oldValue: any }> = {
                                    environments: { newValue: flag.environments, oldValue: existingFlag.environments }
                                };

                                await tx.audit_logs.create({
                                    data: {
                                        organisation_id,
                                        user_id,
                                        ip_address: ip,
                                        user_agent: userAgent,
                                        resource_type: "KILL_SWITCH_FLAG",
                                        resource_id: existingFlag.id,
                                        action: "UPDATE",
                                        attributes_changed: flagUpdateAttributes
                                    }
                                });
                            }
                        }
                    }
                }

                return updatedKillSwitch;
            });
            
            if(!result){
                return;
            }

            // Update cache using the new functions
            const killSwitchData = {
                id : killSwitchId,
                killSwitchKey: result.killSwitchKey,
                is_active: is_active !== undefined ? is_active : result.is_active,
                flag : flags || []
            };

            // Update kill switch cache
            await setKillSwitch(result.killSwitchKey, orgSlug, killSwitchData);
            
            // If status changed, use the specific status update function
            if (is_active !== undefined) {
                await updateKillSwitchStatus(result.killSwitchKey, orgSlug, is_active);
            }
            
            // If flags changed, update flag mappings
            if (flags && Array.isArray(flags)) {
                await updateKillSwitchFlagMappings(result.killSwitchKey, orgSlug, flags);
            }
            
            // Invalidate flag cache for affected flags
            await invalidateFlagCacheForKillSwitch(orgSlug, killSwitchData);
            
            res.status(200).json({
                success: true,
                message: "Kill switch updated successfully",
                data: result
            });

        } catch (error) {
            console.error('Error updating kill switch:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Internal Server Error"
            });
        }
    };
}

// Instantiate and export the controller
import dbInstance from '@repo/db';

const updateKillSwitchController = new UpdateKillSwitchController({
    prisma: dbInstance
});

export const updateKillSwitch = updateKillSwitchController.updateKillSwitch;