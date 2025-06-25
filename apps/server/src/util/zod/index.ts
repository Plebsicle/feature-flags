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

/**
 * Validates request body using the provided Zod schema
 * @param schema - Zod schema to validate against
 * @param req - Express request object
 * @param res - Express response object
 * @returns Parsed data if validation succeeds, false if validation fails
 */
export function validateBody<T>(
  schema: ZodSchema<T>,
  req: express.Request,
  res: express.Response
): T | false {
  try {
    const result = schema.parse(req.body);
    req.body = result; // Overwrite with validated data
    return result;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    } else {
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
 * @param schema - Zod schema to validate against
 * @param req - Express request object
 * @param res - Express response object
 * @returns Parsed data if validation succeeds, false if validation fails
 */
export function validateParams<T>(
  schema: ZodSchema<T>,
  req: express.Request,
  res: express.Response
): T | false {
  try {
    const result = schema.parse(req.params);
    req.params = result as any; // Overwrite with validated data
    return result;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: "Invalid parameters",
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    } else {
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
 * @param schema - Zod schema to validate against
 * @param req - Express request object
 * @param res - Express response object
 * @returns Parsed data if validation succeeds, false if validation fails
 */
export function validateQuery<T>(
  schema: ZodSchema<T>,
  req: express.Request,
  res: express.Response
): T | false {
  try {
    const result = schema.parse(req.query);
    req.query = result as any; // Overwrite with validated data
    return result;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: [{ field: 'unknown', message: 'Validation failed' }]
      });
    }
    return false;
  }
} 