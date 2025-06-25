import { z } from 'zod';

// ============================================================================
// EVALUATION CONTROLLER SCHEMAS
// ============================================================================

// User context schema for evaluation
export const userContextSchema = z.object({
  email: z.string().email().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  ip: z.string().optional(),
  userId: z.string().optional(),
  timestamp: z.string().datetime().optional()
}).catchall(z.any()); // Allow additional custom attributes

// Environment schema
export const environmentSchema = z.enum(['DEV', 'STAGING', 'PROD', 'TEST']);

// Evaluation request schema
export const evaluationRequestBodySchema = z.object({
  flagKey: z.string().min(1, "Flag key is required"),
  environment: environmentSchema,
  userContext: userContextSchema,
  orgSlug: z.string().min(1, "Organization slug is required")
}); 