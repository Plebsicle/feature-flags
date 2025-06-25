import { z } from 'zod';

// ============================================================================
// AUTH CONTROLLER SCHEMAS
// ============================================================================

// Common password schema
const passwordSchema = z.string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" });

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
  password: passwordSchema,
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
  password: passwordSchema,
  token: z.string().min(1, "Token is required")
});

export const memberSignupSendInvitationBodySchema = z.object({
  emails: z.array(z.string().email("Invalid email format")).min(1, "At least one email is required")
});

// Forgot password schemas
export const sendVerificationEmailForgetPasswordBodySchema = z.object({
  email: z.string().email("Invalid email format")
});

export const checkVerificationEmailForgetPasswordBodySchema = z.object({
  password: passwordSchema,
  token: z.string().min(1, "Token is required")
});

// Legacy validation functions (keeping for backward compatibility)
export async function signinValidation(email: string, password: string): Promise<boolean> {
  const validationResult = emailSigninBodySchema.safeParse({ email, password });
  if (validationResult.success) return true;
  console.log("Validation Failed", validationResult.error.errors);
  return false;
}

export async function signupValidation(name: string, email: string, password: string, orgName: string): Promise<boolean> {
  const validationResult = emailSignupBodySchema.safeParse({ name, email, password, orgName });
  if (validationResult.success) return true;
  console.log("Validation Failed", validationResult.error.errors);
  return false;
}

export async function memberSignupValidation(name: string, password: string, token: string): Promise<boolean> {
  const validationResult = memberSignupVerificationBodySchema.safeParse({ name, password, token });
  if (validationResult.success) return true;
  console.log("Validation Failed", validationResult.error.errors);
  return false;
}

export async function verifyEmailValidation(token: string, orgName: string) {
  const validationResult = verifyEmailSignupBodySchema.safeParse({ token, orgName });
  if (validationResult.success) return true;
  console.log("Validation Failed", validationResult.error.errors);
  return false;
} 