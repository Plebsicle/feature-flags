import express from 'express';
import { slackService } from '../../services/slack-integration/slack';


// Generate Slack OAuth URL
export const slackOauthUrl =  async (req : express.Request, res : express.Response) => {
  try {

    const  organisationId  = req.session.user?.userOrganisationId;
    
    if (!organisationId) {
      res.status(400).json({ error: 'Organisation ID is required' });
      return;
    }

    const scopes = [
      'chat:write',
      'chat:write.public',
      'channels:read',
      'groups:read'
    ].join(',');

    const redirectUri = process.env.SLACK_REDIRECT_URI || 'http://localhost:8000/api/slack/oauth/callback';
    
    const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${organisationId}`;

    res.status(200).json({success : true ,  authUrl: slackAuthUrl });
  } catch (error) {
    console.error('Error generating Slack auth URL:', error);
    res.status(500).json({ success : false, error: 'Failed to generate auth URL' });
  }
};

// Handle OAuth callback
export const slackOauthCallback =  async (req : express.Request, res : express.Response) => {
  try {
    const { code, error } = req.query;
    const organisationId = req.session.user?.userOrganisationId!;

    if (error) {
      res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?error=${error}`);
      return;
    }

    if (!code || !organisationId) {
      res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?error=missing_params`);
      return;
    }

    // Exchange code for token
    const oauthData = await slackService.exchangeCodeForToken(code as string);
    
    // Save integration
    await slackService.saveIntegration(oauthData, organisationId as string);

    // Redirect to success page
    res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?success=slack_connected`);
  } catch (error) {
    console.error('Slack OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?error=auth_failed`);
  }
};

// Get integration status
export const getIntegration =  async (req : express.Request, res : express.Response) => {
  try {

    const organisationId = req.session.user?.userOrganisationId!;
    
    const integration = await slackService.getIntegration(organisationId);
    
    if (!integration) {
      res.json({ connected: false });
      return;
    }

    res.status(200).json({
      success : true,
      connected: true,
      teamName: integration.team_name,
      teamId: integration.team_id,
      channels: integration.channels,
      installedAt: integration.installed_at,
    });

  } catch (error) {
    console.error('Error fetching integration:', error);
    res.status(500).json({ success : false, error: 'Failed to fetch integration' });
  }
};

// Get available channels
export const getChannels =  async (req : express.Request, res:express.Response) => {
  try {
    const { teamId } = req.params;
    
    const channels = await slackService.getChannels(teamId);
    
    res.status(200).json({success : true, channels });
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ success : false, error: 'Failed to fetch channels' });
  }
};

// Save selected channels
export const saveChannels =  async (req : express.Request, res :express.Response) => {
  try {
    const  integrationId  = req.params.integrationId;
    const { channels } = req.body;
    console.log(integrationId);
    console.log(channels);
    if (!channels || !Array.isArray(channels)) {
      res.status(400).json({ error: 'Channels array is required' });
      return;
    }

    const result = await slackService.saveChannels(integrationId, channels);
    if(result === false){
      res.status(400).json({success : false,message : "Workspace for the Channel Does not Exist"});
      return;
    }
    res.json({ success: true, message: 'Channels saved successfully' });
  } catch (error) {
    console.error('Error saving channels:', error);
    res.status(500).json({success : false, error: 'Failed to save channels' });
  }
};

// Remove integration
export const deleteIntegration = async (req : express.Request, res:express.Response) => {
  try {
    const organisationId = req.session.user?.userOrganisationId!;    
    await slackService.removeIntegration(organisationId);
    
    res.json({ success: true, message: 'Slack integration removed' });
  } catch (error) {
    console.error('Error removing integration:', error);
    res.status(500).json({ error: 'Failed to remove integration' });
  }
};
