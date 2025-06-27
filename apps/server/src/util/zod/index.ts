import { ZodError, ZodSchema } from 'zod';
import express from 'express';

// Re-export all schemas
export * from './authSchemas';
export * from './flagSchemas';
export * from './killSwitchSchemas';
export * from './metricSchemas';
export * from './organisationSchemas';
export * from './slackSchemas';
export * from './evaluationSchemas';

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

function logZodError(context: string, data: unknown, error: ZodError) {
  console.error(`❌ Validation failed for ${context}:`);
  console.error(`📥 Received ${context}:`, JSON.stringify(data, null, 2));
  error.errors.forEach(err => {
    console.error(`🛑 Field: ${err.path.join('.')}, Issue: ${err.message}`);
  });
}

function logGenericError(context: string, data: unknown, error: unknown) {
  console.error(`❌ Unknown error validating ${context}:`);
  console.error(`📥 Received ${context}:`, JSON.stringify(data, null, 2));
  console.error("🧨 Error object:", error);
}

/**
 * Validates request body using the provided Zod schema
 */
export function validateBody<T>(
  schema: ZodSchema<T>,
  req: express.Request,
  res: express.Response
): T | false {
  try {
    const result = schema.parse(req.body);
    req.body = result;
    return result;
  } catch (error) {
    if (error instanceof ZodError) {
      logZodError("body", req.body, error);
      res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    } else {
      logGenericError("body", req.body, error);
      res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: [{ field: 'unknown', message: 'Validation failed' }]
      });
    }
    return false;
  }
}

/**
 * Validates request params using the provided Zod schema
 */
export function validateParams<T>(
  schema: ZodSchema<T>,
  req: express.Request,
  res: express.Response
): T | false {
  try {
    const result = schema.parse(req.params);
    req.params = result as any;
    return result;
  } catch (error) {
    if (error instanceof ZodError) {
      logZodError("params", req.params, error);
      res.status(400).json({
        success: false,
        message: "Invalid parameters",
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    } else {
      logGenericError("params", req.params, error);
      res.status(400).json({
        success: false,
        message: "Invalid parameters",
        errors: [{ field: 'unknown', message: 'Validation failed' }]
      });
    }
    return false;
  }
}

/**
 * Validates request query using the provided Zod schema
 */
export function validateQuery<T>(
  schema: ZodSchema<T>,
  req: express.Request,
  res: express.Response
): T | false {
  try {
    const result = schema.parse(req.query);
    req.query = result as any;
    return result;
  } catch (error) {
    if (error instanceof ZodError) {
      logZodError("query", req.query, error);
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    } else {
      logGenericError("query", req.query, error);
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: [{ field: 'unknown', message: 'Validation failed' }]
      });
    }
    return false;
  }
}
