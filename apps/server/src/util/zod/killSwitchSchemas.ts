import { z } from 'zod';

// ============================================================================
// KILL SWITCH CONTROLLER SCHEMAS
// ============================================================================

// Create kill switch schemas
export const createKillSwitchBodySchema = z.object({
  name: z.string().min(1, "Kill switch name is required"),
  killSwitchKey: z.string().min(1, "Kill switch key is required")
    .regex(/^[a-zA-Z0-9_-]+$/, "Key can only contain letters, numbers, hyphens and underscores"),
  description: z.string().optional(),
  flags: z.array(z.object({
    flagKey: z.string().min(1, "Flag key is required"),
    environments: z.array(z.string().min(1, "Environment name cannot be empty"))
      .min(1, "At least one environment is required")
  })).min(1, "At least one flag is required")
});

// Read kill switch schemas
export const killSwitchIdParamsSchema = z.object({
  killSwitchId: z.string().uuid("Invalid kill switch ID format")
});

export const killSwitchParamsSchema = z.object({
  killSwitch: z.string().uuid("Invalid kill switch ID format")
});

// Update kill switch schemas
export const updateKillSwitchBodySchema = z.object({
  killSwitchId: z.string().uuid("Invalid kill switch ID format"),
  name: z.string().min(1, "Kill switch name is required").optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  flags: z.array(z.object({
    flagKey: z.string().min(1, "Flag key is required"),
    environments: z.array(z.string().min(1, "Environment name cannot be empty"))
      .min(1, "At least one environment is required")
  })).optional()
});

// Delete kill switch schemas
export const deleteKillSwitchParamsSchema = z.object({
  killSwitchId: z.string().uuid("Invalid kill switch ID format")
}); 