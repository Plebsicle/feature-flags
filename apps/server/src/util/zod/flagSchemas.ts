import { z } from 'zod';

// ============================================================================
// FLAG CONTROLLER SCHEMAS
// ============================================================================

// Common schemas
export const flagTypeSchema = z.enum(['BOOLEAN', 'STRING', 'NUMBER', 'JSON']);
export const rolloutTypeSchema = z.enum(['PERCENTAGE', 'USER_ATTRIBUTE', 'RANDOM']);

// Create flag schemas
export const createFlagBodySchema = z.object({
  name: z.string().min(1, "Flag name is required"),
  key: z.string().min(1, "Flag key is required").regex(/^[a-zA-Z0-9_-]+$/, "Key can only contain letters, numbers, hyphens and underscores"),
  description: z.string().optional(),
  flag_type: flagTypeSchema,
  environments: z.object({
    environment: z.string().min(1, "Environment is required"),
    value: z.any(),
    default_value: z.any()
  }),
  rules: z.object({
    name: z.string().min(1, "Rule name is required"),
    description: z.string().optional(),
    conditions: z.record(z.any()).optional()
  }),
  rollout: z.object({
    type: rolloutTypeSchema,
    config: z.record(z.any()).optional()
  }),
  tags: z.array(z.string()).optional()
});

export const createEnvironmentBodySchema = z.object({
  flag_id: z.string().uuid("Invalid flag ID format"),
  environment: z.string().min(1, "Environment is required"),
  ruleName: z.string().min(1, "Rule name is required"),
  ruleDescription: z.string().optional(),
  value: z.any(),
  default_value: z.any(),
  conditions: z.record(z.any()).optional(),
  rollout_type: rolloutTypeSchema,
  rollout_config: z.record(z.any()).optional()
});

export const addRulesBodySchema = z.object({
  environment_id: z.string().uuid("Invalid environment ID format"),
  ruleDescription: z.string().optional(),
  conditions: z.record(z.any()).optional(),
  ruleName: z.string().min(1, "Rule name is required"),
  isEnabled: z.boolean().optional().default(true)
});

// Read flag schemas
export const flagIdParamsSchema = z.object({
  flagId: z.string().uuid("Invalid flag ID format")
});

export const environmentIdParamsSchema = z.object({
  environmentId: z.string().uuid("Invalid environment ID format")
});

// Update flag schemas
export const updateFeatureFlagBodySchema = z.object({
  flagId: z.string().uuid("Invalid flag ID format"),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

export const updateFlagRuleBodySchema = z.object({
  flag_id: z.string().uuid("Invalid flag ID format"),
  flagRuleId: z.string().uuid("Invalid rule ID format"),
  ruleDescription: z.string().optional(),
  conditions: z.record(z.any()).optional(),
  ruleName: z.string().optional(),
  isEnabled: z.boolean().optional(),
  value: z.any().optional(),
  environment: z.string().optional()
});

export const updateFlagRolloutBodySchema = z.object({
  flag_id: z.string().uuid("Invalid flag ID format"),
  rollout_id: z.string().uuid("Invalid rollout ID format"),
  rollout_type: rolloutTypeSchema.optional(),
  rollout_config: z.record(z.any()).optional(),
  environment: z.string().optional()
});

export const updateEnvironmentBodySchema = z.object({
  environment_id: z.string().uuid("Invalid environment ID format"),
  environment: z.string().optional(),
  value: z.any().optional(),
  default_value: z.any().optional(),
  is_enabled: z.boolean().optional()
});

// Delete flag schemas
export const deleteFeatureFlagParamsSchema = z.object({
  flagId: z.string().uuid("Invalid flag ID format")
});

export const deleteEnvironmentParamsSchema = z.object({
  environmentId: z.string().uuid("Invalid environment ID format")
});

export const deleteRuleParamsSchema = z.object({
  ruleId: z.string().uuid("Invalid rule ID format")
}); 