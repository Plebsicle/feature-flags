import { z } from 'zod';

// ============================================================================
// METRIC CONTROLLER SCHEMAS
// ============================================================================

// Enums for metrics
export const metricTypeSchema = z.enum(['COUNT', 'SUM', 'AVERAGE', 'CONVERSION']);
export const metricAggregationMethodSchema = z.enum(['SUM', 'COUNT', 'AVERAGE', 'MIN', 'MAX']);
export const metricEventTypeSchema = z.enum(['CLICK', 'VIEW', 'CONVERSION', 'CUSTOM']);
export const conversionStepTypeSchema = z.enum(['STARTED', 'COMPLETED', 'ABANDONED']);

// Create metric schemas
export const createMetricBodySchema = z.object({
  flag_environment_id: z.string().uuid("Invalid flag environment ID format"),
  metric_name: z.string().min(1, "Metric name is required"),
  metric_key: z.string().min(1, "Metric key is required")
    .regex(/^[a-zA-Z0-9_-]+$/, "Key can only contain letters, numbers, hyphens and underscores"),
  metric_type: metricTypeSchema,
  is_active: z.boolean().default(true),
  unit_measurement: z.string().min(1, "Unit of measurement is required"),
  aggregation_method: metricAggregationMethodSchema.optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// Read metric schemas
export const metricIdParamsSchema = z.object({
  metricId: z.string().uuid("Invalid metric ID format")
});

export const metricEnvironmentIdParamsSchema = z.object({
  environmentId: z.string().uuid("Invalid environment ID format")
});

// Update metric schemas
export const updateMetricBodySchema = z.object({
  metric_id: z.string().uuid("Invalid metric ID format"),
  metric_name: z.string().min(1, "Metric name is required"),
  metric_type: metricTypeSchema,
  is_active: z.boolean(),
  unit_measurement: z.string().min(1, "Unit of measurement is required"),
  aggregation_method: metricAggregationMethodSchema,
  description: z.string().optional(),
  tags: z.array(z.string())
});

// Delete metric schemas
export const deleteMetricParamsSchema = z.object({
  metricId: z.string().uuid("Invalid metric ID format")
});

// ============================================================================
// METRIC COLLECTION SCHEMAS
// ============================================================================

export const metricCollectionBodySchema = z.object({
  metric_key: z.string().min(1, "Metric key is required"),
  orgSlug: z.string().min(1, "Organization slug is required"),
  part_rollout: z.boolean(),
  variation_served: z.string().optional(),
  event_type: metricEventTypeSchema,
  numeric_value: z.number().optional(),
  conversion_step: conversionStepTypeSchema.optional()
}); 