import { z } from 'zod';

// ============================================================================
// ORGANISATION CONTROLLER SCHEMAS
// ============================================================================

// Enums for organisation
export const userRoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']);
export const frequencyUnitSchema = z.enum(['MINUTE', 'HOUR', 'DAY', 'WEEK', 'MONTH']);

// Alert preferences schemas
export const alertPreferencesBodySchema = z.object({
  frequency_unit: frequencyUnitSchema,
  frequency_value: z.number().min(1, "Frequency value must be at least 1"),
  number_of_times: z.number().min(1, "Number of times must be at least 1"),
  email_enabled: z.boolean(),
  slack_enabled: z.boolean(),
  email_roles_notification: z.array(userRoleSchema)
});

// Update role schemas
export const updateRoleBodySchema = z.object({
  role: userRoleSchema,
  userId: z.string().uuid("Invalid user ID format")
});

// Invite member schema
export const inviteMemberBodySchema = z.object({
  email: z.string().email("Valid email is required"),
  role: userRoleSchema
}); 