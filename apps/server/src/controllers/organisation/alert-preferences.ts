import prisma from '@repo/db';
import { FrequencyUnit, user_role } from '@repo/db/client';
import express from 'express'
import { alertPreferencesBodySchema, validateBody } from '../../util/zod';

interface AlertPreferencesBody {
    email_enabled: boolean;
    slack_enabled: boolean;
    email_roles_notification: user_role[];
}

interface AlertPreferencesControllerDependencies {
    prisma: typeof prisma;
}

class AlertPreferencesController {
    private prisma: typeof prisma;

    constructor(dependencies: AlertPreferencesControllerDependencies) {
        this.prisma = dependencies.prisma;
    }

    private checkOwnerAuthorization = (req: express.Request, res: express.Response): boolean => {
        const userRole = req.session.user?.userRole;
        if (userRole === undefined || (userRole !== "OWNER")) {
            res.status(403).json({ success: true, message: "Not Authorised" });
            return false;
        }
        return true;
    };

    orgAlertPreferences = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            console.log(req.body);
            const validatedBody = validateBody(alertPreferencesBodySchema, req, res);
            if (!validatedBody) return;

            if (!this.checkOwnerAuthorization(req, res)) return;

            const organisationId = req.session.user?.userOrganisationId!;
            const {
                email_enabled,
                slack_enabled,
                email_roles_notification
            } = req.body as AlertPreferencesBody;

            await this.prisma.alert_preferences.create({
                data: {
                    organisation_id: organisationId,
                    email_enabled,
                    slack_enabled,
                    email_roles_notification
                }
            });

            res.status(200).json({ success: true, message: "Alert Preferences Added" });
        }
        catch (e) {
            console.error(e);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }

    getAlertPreferences = async (req: express.Request, res: express.Response) => {
        try {
            const organisationId = req.session.user?.userOrganisationId!;
            const prefData = await this.prisma.alert_preferences.findUnique({
                where: {
                    organisation_id: organisationId
                }
            });

            res.status(200).json({ success: true, message: "Preferences fetched successfully", data: prefData });
        }
        catch (e) {
            console.error(e);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }

    updatePreferences = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const validatedBody = validateBody(alertPreferencesBodySchema, req, res);
            if (!validatedBody) return;

            const {
                email_enabled,
                slack_enabled,
                email_roles_notification
            } = req.body as AlertPreferencesBody;
            const organisation_id = req.session.user?.userOrganisationId!;

            await this.prisma.alert_preferences.update({
                where: {
                    organisation_id
                },
                data: {
                    slack_enabled,
                    email_enabled,
                    email_roles_notification
                }
            });

            res.status(200).json({ success: true, message: "Preference updated successfully" });
        }
        catch (e) {
            console.error(e);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }
}

// Instantiate and export the controller
import dbInstance from '@repo/db';

const alertPreferencesController = new AlertPreferencesController({
    prisma: dbInstance
});

export const orgAlertPreferences = alertPreferencesController.orgAlertPreferences;
export const getAlertPreferences = alertPreferencesController.getAlertPreferences;
export const updatePreferences = alertPreferencesController.updatePreferences;