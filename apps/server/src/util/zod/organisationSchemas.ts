import { z } from 'zod';

// ============================================================================
// ORGANISATION CONTROLLER SCHEMAS
// ============================================================================

// Enums for organisation
export const userRoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']);
export const frequencyUnitSchema = z.enum(['MINUTE', 'HOUR', 'DAY']);

// Alert preferences schemas
export const alertPreferencesBodySchema = z.object({
  email_enabled: z.boolean(),
  slack_enabled: z.boolean(),
  email_roles_notification: z.array(userRoleSchema)
});

// Update role schemas
export const updateRoleBodySchema = z.object({
  role: userRoleSchema,
  memberId: z.string().uuid("Invalid user ID format")
});

// Invite member schema
export const inviteMemberBodySchema = z.object({
  email: z.string().email("Valid email is required"),
  role: userRoleSchema
}); 