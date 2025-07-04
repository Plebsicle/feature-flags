import { z } from 'zod';

// ============================================================================
// AUTH CONTROLLER SCHEMAS
// ============================================================================

// Signin schemas
export const emailSigninBodySchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

export const googleSigninBodySchema = z.object({
  googleId: z.string().min(1, "Google ID is required")
});

// Signup schemas
export const emailSignupBodySchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  orgName: z.string().min(1, "Organization name is required")
});

export const googleSignupBodySchema = z.object({
  googleId: z.string().min(1, "Google ID is required"),
  orgName: z.string().min(1, "Organization name is required")
});

// Email verification schemas
export const verifyEmailSignupBodySchema = z.object({
  orgName: z.string().min(1, "Organization name is required"),
  token: z.string().min(1, "Token is required")
});

export const verifyEmailManualBodySchema = z.object({
  token: z.string().min(1, "Token is required")
});

export const sendVerificationEmailManualBodySchema = z.object({
  email: z.string().email("Invalid email format")
});

// Member schemas
export const memberSignupVerificationBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  token: z.string().min(1, "Token is required")
});

export const memberSignupSendInvitationBodySchema = z.object({
  emails: z.array(z.string().email("Invalid email format")).min(1, "At least one email is required"),
  memberRole: z.enum(["ADMIN", "MEMBER", "VIEWER", "OWNER"])
});

// Forgot password schemas
export const sendVerificationEmailForgetPasswordBodySchema = z.object({
  email: z.string().email("Invalid email format")
});

export const checkVerificationEmailForgetPasswordBodySchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  token: z.string().min(1, "Token is required")
});

// ============================================================================
// CRUD FLAGS CONTROLLER SCHEMAS
// ============================================================================

// Create flag schemas
export const createFlagBodySchema = z.object({
  flagName: z.string().min(1, "Flag name is required"),
  key: z.string().min(1, "Flag key is required"),
  flagDescription: z.string().optional(),
  flag_type: z.string().min(1, "Flag type is required"),
  environment: z.string().min(1, "Environment is required"),
  ruleName: z.string().min(1, "Rule name is required"),
  ruleDescription: z.string().optional(),
  conditions: z.record(z.any()).optional(),
  value: z.record(z.any()).optional(),
  rollout_type: z.string().min(1, "Rollout type is required"),
  rollout_config: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional()
});

export const createEnvironmentBodySchema = z.object({
  flag_id: z.string().min(1, "Flag ID is required"),
  environment: z.string().min(1, "Environment is required"),
  ruleName: z.string().min(1, "Rule name is required"),
  ruleDescription: z.string().optional(),
  conditions: z.record(z.any()).optional(),
  value: z.record(z.any()).optional(),
  rollout_type: z.string().min(1, "Rollout type is required"),
  rollout_config: z.record(z.any()).optional()
});

// Read flag schemas
export const getFeatureFlagParamsSchema = z.object({
  flagId: z.string().min(1, "Flag ID is required")
});

export const getFlagEnvironmentParamsSchema = z.object({
  flagId: z.string().min(1, "Flag ID is required")
});

export const getRulesParamsSchema = z.object({
  environmentId: z.string().min(1, "Environment ID is required")
});

export const getRolloutParamsSchema = z.object({
  environmentId: z.string().min(1, "Environment ID is required")
});

export const getAuditLogsParamsSchema = z.object({
  flagId: z.string().min(1, "Flag ID is required")
});

// Update flag schemas
export const updateFeatureFlagBodySchema = z.object({
  flagId: z.string().min(1, "Flag ID is required"),
  flagDescription: z.string().optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

export const updateFlagRuleBodySchema = z.object({
  flag_id: z.string().min(1, "Flag ID is required"),
  flagRuleId: z.string().min(1, "Flag rule ID is required"),
  ruleDescription: z.string().optional(),
  conditions: z.record(z.any()).optional(),
  ruleName: z.string().optional(),
  isEnabled: z.boolean().optional(),
  value: z.record(z.any()).optional(),
  environment: z.string().optional()
});

export const updateFlagRolloutBodySchema = z.object({
  flag_id: z.string().min(1, "Flag ID is required"),
  rollout_id: z.string().min(1, "Rollout ID is required"),
  rollout_type: z.string().optional(),
  rollout_config: z.record(z.any()).optional(),
  environment: z.string().optional()
});

// Delete flag schemas
export const deleteFeatureFlagParamsSchema = z.object({
  flagId: z.string().min(1, "Flag ID is required")
});

export const deleteEnvironmentParamsSchema = z.object({
  environmentId: z.string().min(1, "Environment ID is required")
});

export const deleteRuleParamsSchema = z.object({
  ruleId: z.string().min(1, "Rule ID is required")
});


const userSignupSchema = z.object({
  name: z.string(),
  email: z.string().min(1, { message: "This Field has to be filled" }).email("This is not a Valid Email"),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  orgName: z.string()
});

const userSigninSchema = z.object({
  email: z.string().min(1, { message: "This Field has to be filled" }).email("This is not a Valid Email"),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
});

const verifyEmailSchema = z.object({
  orgName: z.string(),
  token: z.string()
});

const memberSignupValidationSchema = z.object({
  name: z.string(),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  token: z.string()
});

// Legacy validation functions
export async function signinValidation(email: string, password: string): Promise<boolean> {
  const validationResult = userSigninSchema.safeParse({ email, password });
  if (validationResult.success) return true;
  console.log("Validation Failed", validationResult.error.errors);
  return false;
}

export async function signupValidation(name: string, email: string, password: string, orgName: string): Promise<boolean> {
  const validationResult = userSignupSchema.safeParse({ name, email, password, orgName });
  if (validationResult.success) return true;
  console.log("Validation Failed", validationResult.error.errors);
  return false;
}

export async function memberSignupValidation(name: string, password: string, token: string): Promise<boolean> {
  const validationResult = memberSignupValidationSchema.safeParse({ name, password, token });
  if (validationResult.success) return true;
  console.log("Validation Failed", validationResult.error.errors);
  return false;
}

export async function verifyEmailValidation(token: string, orgName: string) {
  const validationResult = verifyEmailSchema.safeParse({ token, orgName });
  if (validationResult.success) return true;
  console.log("Validation Failed", validationResult.error.errors);
  return false;
} 