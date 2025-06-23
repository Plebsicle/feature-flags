import { WebClient } from '@slack/web-api';
import  prisma  from '@repo/db';

interface SlackOAuthResponse {
  ok: boolean;
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id: string;
  app_id: string;
  team: {
    id: string;
    name: string;
  };
  enterprise?: {
    id: string;
    name: string;
  };
  authed_user: {
    id: string;
    scope: string;
    access_token: string;
    token_type: string;
  };
}

export const slackService = {
  // Exchange code for access token
  async exchangeCodeForToken(code: string): Promise<SlackOAuthResponse> {
    const client = new WebClient();
    
    const result = await client.oauth.v2.access({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code: code,
    });

    if (!result.ok) {
      throw new Error('Failed to exchange code for token');
    }

    return result as unknown as SlackOAuthResponse;
  },

  // Save Slack integration to database
  async saveIntegration(oauthData: SlackOAuthResponse, organisationId: string) {
    try {
      // Check if integration already exists
      const existingIntegration = await prisma.slackIntegration.findFirst({
        where: {
          team_id: oauthData.team.id,
          organisation_id: organisationId,
        },
      });

      if (existingIntegration) {
        // Update existing integration
        return await prisma.slackIntegration.update({
          where: { id: existingIntegration.id },
          data: {
            bot_token: oauthData.access_token,
            scope: oauthData.scope,
            user_id: oauthData.authed_user.id,
            updated_at: new Date(),
            is_active: true,
          },
        });
      } else {
        // Create new integration
        return await prisma.slackIntegration.create({
          data: {
            organisation_id: organisationId,
            team_id: oauthData.team.id,
            team_name: oauthData.team.name,
            bot_token: oauthData.access_token,
            user_id: oauthData.authed_user.id,
            scope: oauthData.scope,
          },
        });
      }
    } catch (error) {
      console.error('Error saving Slack integration:', error);
      throw error;
    }
  },

  // Get channels from Slack workspace
  async getChannels(teamId: string) {
    try {
      const integration = await prisma.slackIntegration.findFirst({
        where: { team_id: teamId, is_active: true },
      });

      if (!integration) {
        throw new Error('Slack integration not found');
      }

      const client = new WebClient(integration.bot_token);
      
      // Get public channels
      const publicChannels = await client.conversations.list({
        exclude_archived: true,
        types: 'public_channel',
      });

      // Get private channels
      const privateChannels = await client.conversations.list({
        exclude_archived: true,
        types: 'private_channel',
      });

      const allChannels = [
        ...(publicChannels.channels || []),
        ...(privateChannels.channels || []),
      ];

      return allChannels.map(channel => ({
        id: channel.id,
        name: channel.name,
        is_private: channel.is_private || false,
      }));
    } catch (error) {
      console.error('Error fetching channels:', error);
      throw error;
    }
  },

  // Save selected channels
  async saveChannels(integrationId: string, channels: Array<{id: string, name: string, is_private: boolean}>) {
    try {
      // Remove existing channels
      console.log(integrationId);
      console.log(channels);
      const workspaceData = await prisma.slackIntegration.findUnique({
        where : {
          team_id : integrationId
        }
      });
      if(!workspaceData){
        return false;
      }
      await prisma.slackChannel.deleteMany({
        where: { slack_integration_id: workspaceData.id },
      });

      // Add new channels
      const channelData = channels.map(channel => ({
        slack_integration_id: workspaceData.id,
        channel_id: channel.id,
        channel_name: `#${channel.name}`,
        is_private: channel.is_private,
      }));

      return await prisma.slackChannel.createMany({
        data: channelData,
      });
    } catch (error) {
      console.error('Error saving channels:', error);
      throw error;
    }
  },

  // Get organization's Slack integration
  async getIntegration(organisationId: string) {
    return await prisma.slackIntegration.findFirst({
      where: {
        organisation_id: organisationId,
        is_active: true,
      },
      include: {
        channels: true,
      },
    });
  },

  // Remove integration
  async removeIntegration(organisationId: string) {
    const integration = await prisma.slackIntegration.findFirst({
      where: { organisation_id: organisationId },
    });

    if (integration) {
      await prisma.slackIntegration.update({
        where: { id: integration.id },
        data: { is_active: false },
      });
    }
  },
};