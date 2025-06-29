import express from 'express';
import { 
    slackConnectBodySchema, 
    slackConfigBodySchema, 
    slackChannelParamsSchema,
    validateBody,
    validateParams 
} from '../../util/zod';
import { slackService } from '../../services/slack-integration/slack';
import { decryptState, encryptState } from '../../util/encrypt-url';
import { user_role } from '@repo/db/client';

interface SlackControllerDependencies {
    slackService: typeof slackService;
}

class SlackController {
    private slackService: typeof slackService;

    constructor(dependencies: SlackControllerDependencies) {
        this.slackService = dependencies.slackService;
    }

    private checkOwnerAuthorization =  (req: express.Request, res: express.Response): boolean => {
        const userRole = req.session.user?.userRole;
        if (userRole === undefined || (userRole !== "OWNER")) {
            res.status(403).json({ success: true, message: "Not Authorised" });
            return false;
        }
        return true;
    };

    private generateSlackAuthUrl = (organizationId: string,userRole : user_role): string => {
        const scopes = [
            'chat:write',
            'chat:write.public',
            'channels:read',
            'groups:read'
        ].join(',');

        const redirectUri = process.env.SLACK_REDIRECT_URI || 'http://localhost:8000/api/slack/oauth/callback';
        const encryptedState =  encryptState({organizationId,userRole});
        
        return `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(encryptedState)}`;
    };

    // Generate Slack OAuth URL
    slackOauthUrl = async (req: express.Request, res: express.Response) => {
        try {
            if (!this.checkOwnerAuthorization(req, res)) return;

            const organisationId = req.session.user?.userOrganisationId;
            const userRole = req.session.user?.userRole! as user_role;
            
            if (!organisationId) {
                res.status(400).json({ error: 'Organisation ID is required' });
                return;
            }

            const slackAuthUrl = this.generateSlackAuthUrl(organisationId,userRole);

            res.status(200).json({ success: true, authUrl: slackAuthUrl });
        } catch (error) {
            console.error('Error generating Slack auth URL:', error);
            res.status(500).json({ success: false, error: 'Failed to generate auth URL' });
        }
    };

    // Handle OAuth callback
    slackOauthCallback = async (req: express.Request, res: express.Response) => {
        try {
            const { code, error,state } = req.query;

            if(!state){
                res.status(403).json({success : false , message : "Unauthorised , Tampered URL"});
                return;
            }

            if (typeof state !== 'string') {
                res.status(403).json({success : false,message : "Unauthorised , Tampered URL"});
                return
            }

            const decryptedState = decryptState(state);
            const organisationId = decryptedState.organizationId;
            const userRole = decryptedState.userRole;
            console.log(userRole,organisationId);
            if(userRole === undefined || (userRole !== "OWNER")){
                res.status(403).json({success : false,message : "Unauthorised"});
                return;
            }

            if (error) {
                res.redirect(`${process.env.FRONTEND_URL}/slack?error=${error}`);
                return;
            }

            if (!code || !organisationId) {
                res.redirect(`${process.env.FRONTEND_URL}/slack?error=missing_params`);
                return;
            }

            // Exchange code for token
            const oauthData = await this.slackService.exchangeCodeForToken(code as string);
            
            // Save integration
            await this.slackService.saveIntegration(oauthData, organisationId as string);

            // Redirect to success page
            res.redirect(`${process.env.FRONTEND_URL}/slack?success=slack_connected`);
        } catch (error) {
            console.error('Slack OAuth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/slack?error=auth_failed`);
        }
    };

    // Get integration status
    getIntegration = async (req: express.Request, res: express.Response) => {
        try {
            const organisationId = req.session.user?.userOrganisationId!;
            
            const integration = await this.slackService.getIntegration(organisationId);
            
            if (!integration) {
                res.json({ connected: false });
                return;
            }

            res.status(200).json({
                success: true,
                connected: true,
                teamName: integration.team_name,
                teamId: integration.team_id,
                channels: integration.channels,
                installedAt: integration.installed_at,
            });

        } catch (error) {
            console.error('Error fetching integration:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch integration' });
        }
    };

    // Get available channels
    getChannels = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const validatedParams = validateParams(slackChannelParamsSchema, req, res);
            if (!validatedParams) return;

            const { teamId } = req.params;
            
            const channels = await this.slackService.getChannels(teamId);
            
            res.status(200).json({ success: true, channels });
        } catch (error) {
            console.error('Error fetching channels:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch channels' });
        }
    };

    // Save selected channels
    saveChannels = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const validatedBody = validateBody(slackConfigBodySchema, req, res);
            if (!validatedBody) return;

            const integrationId = req.params.integrationId;
            const { channels } = req.body;
            
            console.log(integrationId);
            console.log(channels);
            
            if (!channels || !Array.isArray(channels)) {
                res.status(400).json({ error: 'Channels array is required' });
                return;
            }

            const result = await this.slackService.saveChannels(integrationId, channels);
            if (result === false) {
                res.status(400).json({ success: false, message: "Workspace for the Channel Does not Exist" });
                return;
            }
            
            res.json({ success: true, message: 'Channels saved successfully' });
        } catch (error) {
            console.error('Error saving channels:', error);
            res.status(500).json({ success: false, error: 'Failed to save channels' });
        }
    };

    // Remove integration
    deleteIntegration = async (req: express.Request, res: express.Response) => {
        try {
            const organisationId = req.session.user?.userOrganisationId!;
            await this.slackService.removeIntegration(organisationId);
            
            res.json({ success: true, message: 'Slack integration removed' });
        } catch (error) {
            console.error('Error removing integration:', error);
            res.status(500).json({ error: 'Failed to remove integration' });
        }
    };
}

// Instantiate and export the controller
const slackController = new SlackController({
    slackService: slackService
});

export const slackOauthUrl = slackController.slackOauthUrl;
export const slackOauthCallback = slackController.slackOauthCallback;
export const getIntegration = slackController.getIntegration;
export const getChannels = slackController.getChannels;
export const saveChannels = slackController.saveChannels;
export const deleteIntegration = slackController.deleteIntegration;
