import { z } from 'zod';

// ============================================================================
// SLACK CONTROLLER SCHEMAS
// ============================================================================

// OAuth callback query schema
export const slackOauthCallbackQuerySchema = z.object({
  code: z.string().optional(),
  error: z.string().optional(),
  state: z.string().optional()
});

// Get channels params schema
export const getChannelsParamsSchema = z.object({
  teamId: z.string().min(1, "Team ID is required")
});

// Save channels schemas
export const saveChannelsParamsSchema = z.object({
  integrationId: z.string().uuid("Invalid integration ID format")
});

export const saveChannelsBodySchema = z.object({
  channels: z.array(z.object({
    id: z.string().min(1, "Channel ID is required"),
    name: z.string().min(1, "Channel name is required")
  })).min(1, "At least one channel is required")
});

// Slack connect body schema
export const slackConnectBodySchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
  state: z.string().optional()
});

// Slack config body schema (alias for saveChannelsBodySchema)
export const slackConfigBodySchema = saveChannelsBodySchema;

// Slack channel params schema (alias for existing getChannelsParamsSchema)
export const slackChannelParamsSchema = getChannelsParamsSchema; 