import nodemailer from 'nodemailer';
import { google } from 'googleapis';

const CLIENT_ID = process.env.MAILER_CLIENT_ID as string;
const CLIENT_SECRET = process.env.CLIENT_SECRET as string;
const REDIRECT_URL = process.env.REDIRECT_URL as string;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN as string;

const FRONTEND_URL = process.env.FRONTEND_URL || `http://localhost:3000`

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

/**
 * Get a configured nodemailer transporter
 * @returns Nodemailer transporter instance
 */

async function getTransporter() {
  const accessToken = await oauth2Client.getAccessToken();
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_USER as string,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: REFRESH_TOKEN,
      accessToken: accessToken.token as string,
    },
    logger: true,
    debug: true,
  });
}

/**
 * Send a generic email
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param htmlContent - HTML content of the email
 * @param textContent - Plain text content (optional)
 * @returns Result from nodemailer
 */

export async function sendEmail(to: string, subject: string, htmlContent: string, textContent?: string) {
  try {
    const transporter = await getTransporter();
    
    const mailOptions = {
      from: `"Medication-Management" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML if no text version provided
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

export async function sendEmailAlert(email: string, alertMessage: string, orgName: string) {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Alert Notification</title>
        <style>
          body {
            font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.5;
            color: #111827;
            max-width: 600px;
            margin: 0 auto;
            padding: 1.5rem;
            background-color: #F9FAFB;
          }
          .email-container {
            background-color: #FFFFFF;
            border-radius: 0.75rem;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
            border: 1px solid #E5E7EB;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
            color: #FFFFFF;
            padding: 2.5rem 2rem;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
            letter-spacing: -0.025em;
          }
          .content {
            padding: 2.5rem;
            text-align: left;
          }
          .org-name {
            color: #6366F1;
            font-weight: 600;
            font-size: 1rem;
            margin-bottom: 1.5rem;
          }
          .alert-message {
            font-size: 1rem;
            color: #374151;
            background-color: #FEE2E2;
            border-left: 4px solid #EF4444;
            padding: 1rem;
            border-radius: 0.5rem;
            line-height: 1.5;
          }
          .footer {
            background-color: #F9FAFB;
            padding: 1.5rem 2rem;
            text-align: center;
            border-top: 1px solid #E5E7EB;
          }
          .footer p {
            margin: 0;
            font-size: 0.875rem;
            color: #6B7280;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>⚠️ Alert Notification</h1>
          </div>
          <div class="content">
            <div class="org-name">${orgName}</div>
            <div class="alert-message">
              ${alertMessage}
            </div>
          </div>
          <div class="footer">
            <p>This alert was generated automatically. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Alert for ${orgName}

      ${alertMessage}

      This alert was generated automatically. Please do not reply to this email.
    `;

    return await sendEmail(
      email,
      `🚨 Alert Notification - ${orgName}`,
      htmlContent,
      textContent
    );
  } catch (e) {
    console.error('Failed to send email alert:', e);
    return false;
  }
}


export async function sendVerificationEmail(email: string, token: string, orgName: string) {
  try {
    const verificationUrl = `${FRONTEND_URL}/auth/check-email-verify-final?token=${token}&org=${encodeURIComponent(orgName)}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body {
            font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.5;
            color: #111827;
            max-width: 600px;
            margin: 0 auto;
            padding: 1.5rem;
            background-color: #F9FAFB;
          }
          .email-container {
            background-color: #FFFFFF;
            border-radius: 1rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid #E5E7EB;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
            color: #FFFFFF;
            padding: 2.5rem 2rem;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
            letter-spacing: -0.025em;
          }
          .content {
            padding: 2.5rem;
            text-align: center;
          }
          .org-name {
            color: #6366F1;
            font-weight: 600;
            font-size: 1.125rem;
            margin-bottom: 1.5rem;
          }
          .message {
            font-size: 1rem;
            color: #4B5563;
            margin-bottom: 2rem;
            line-height: 1.5;
          }
          .verify-button {
            display: inline-block;
            background: #6366F1;
            color: #FFFFFF;
            text-decoration: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 500;
            font-size: 1rem;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .verify-button:hover {
            background: #4F46E5;
            transform: translateY(-1px);
          }
          .footer {
            background-color: #F9FAFB;
            padding: 1.5rem 2rem;
            text-align: center;
            border-top: 1px solid #E5E7EB;
          }
          .footer p {
            margin: 0;
            font-size: 0.875rem;
            color: #6B7280;
          }
          .divider {
            margin: 2rem 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, #E5E7EB, transparent);
          }
          .security-note {
            background-color: #F3F4F6;
            border-left: 4px solid #6366F1;
            padding: 1rem;
            margin: 1.5rem 0;
            border-radius: 0 0.5rem 0.5rem 0;
            font-size: 0.875rem;
            color: #4B5563;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>✉️ Email Verification</h1>
          </div>
          
          <div class="content">
            <div class="org-name">${orgName}</div>
            
            <div class="message">
              <p>Welcome! We're excited to have you on board.</p>
              <p>To complete your registration and secure your account, please verify your email address by clicking the button below.</p>
            </div>
            
            <a href="${verificationUrl}" class="verify-button">
              Verify Email Address
            </a>
            
            <div class="divider"></div>
            
            <div class="security-note">
              <strong>🔒 Security Note:</strong> This verification link will expire in 1 hour for your security. If you didn't create an account with us, you can safely ignore this email.
            </div>
          </div>
          
          <div class="footer">
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6366F1; margin-top: 0.75rem;">${verificationUrl}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const textContent = `
      Welcome to ${orgName}!
      
      Please verify your email address by clicking this link: ${verificationUrl}
      
      This verification link will expire in 1 hour for your security.
      
      If you didn't create an account with us, you can safely ignore this email.
    `;
    
    return await sendEmail(
      email,
      `Verify Your Email - ${orgName}`,
      htmlContent,
      textContent
    );
  } catch (error) {
    console.error('Error sending verification email:', error);
    // throw error; // Re-throw to allow proper error handling upstream
  }
}



export async function sendResetPassword(email: string, token: string) {
  try {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body {
            font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.5;
            color: #111827;
            max-width: 600px;
            margin: 0 auto;
            padding: 1.5rem;
            background-color: #F9FAFB;
          }
          .email-container {
            background-color: #FFFFFF;
            border-radius: 1rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid #E5E7EB;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
            color: #FFFFFF;
            padding: 2.5rem 2rem;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
            letter-spacing: -0.025em;
          }
          .content {
            padding: 2.5rem;
            text-align: center;
          }
          .message {
            font-size: 1rem;
            color: #4B5563;
            margin-bottom: 2rem;
            line-height: 1.5;
          }
          .reset-button {
            display: inline-block;
            background: #EF4444;
            color: #FFFFFF;
            text-decoration: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 500;
            font-size: 1rem;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .reset-button:hover {
            background: #DC2626;
            transform: translateY(-1px);
          }
          .footer {
            background-color: #F9FAFB;
            padding: 1.5rem 2rem;
            text-align: center;
            border-top: 1px solid #E5E7EB;
          }
          .footer p {
            margin: 0;
            font-size: 0.875rem;
            color: #6B7280;
          }
          .divider {
            margin: 2rem 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, #E5E7EB, transparent);
          }
          .security-note {
            background-color: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 1rem;
            margin: 1.5rem 0;
            border-radius: 0 0.5rem 0.5rem 0;
            font-size: 0.875rem;
            color: #92400E;
            text-align: left;
          }
          .warning-box {
            background-color: #FEE2E2;
            border: 1px solid #FECACA;
            border-radius: 0.5rem;
            padding: 1rem;
            margin: 1.5rem 0;
            font-size: 0.875rem;
            color: #B91C1C;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🔒 Password Reset</h1>
          </div>
          
          <div class="content">
            <div class="message">
              <p>We received a request to reset your password.</p>
              <p>Click the button below to create a new password for your account.</p>
            </div>
            
            <a href="${resetUrl}" class="reset-button">
              Reset Password
            </a>
            
            <div class="divider"></div>
            
            <div class="security-note">
              <strong>⏰ Important:</strong> This password reset link will expire in 1 hour for your security.
            </div>
            
            <div class="warning-box">
              <strong>⚠️ Didn't request this?</strong><br>
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </div>
          </div>
          
          <div class="footer">
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #EF4444; margin-top: 0.75rem;">${resetUrl}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const textContent = `
      Password Reset Request
      
      We received a request to reset your password.
      
      Please reset your password by clicking this link: ${resetUrl}
      
      This password reset link will expire in 1 hour for your security.
      
      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    `;
    
    return await sendEmail(
      email,
      'Reset Your Password',
      htmlContent,
      textContent
    );
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error; // Re-throw to allow proper error handling upstream
  }
}

export async function sendVerificationEmailManualMailer(email: string, token: string) {
  try {
    const verificationUrl = `${FRONTEND_URL}/check-email-verify-final?token=${token}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body {
            font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.5;
            color: #111827;
            max-width: 600px;
            margin: 0 auto;
            padding: 1.5rem;
            background-color: #F9FAFB;
          }
          .email-container {
            background-color: #FFFFFF;
            border-radius: 1rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid #E5E7EB;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
            color: #FFFFFF;
            padding: 2.5rem 2rem;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
            letter-spacing: -0.025em;
          }
          .content {
            padding: 2.5rem;
            text-align: center;
          }
          .message {
            font-size: 1rem;
            color: #4B5563;
            margin-bottom: 2rem;
            line-height: 1.5;
          }
          .verify-button {
            display: inline-block;
            background: #6366F1;
            color: #FFFFFF;
            text-decoration: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 500;
            font-size: 1rem;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .verify-button:hover {
            background: #4F46E5;
            transform: translateY(-1px);
          }
          .footer {
            background-color: #F9FAFB;
            padding: 1.5rem 2rem;
            text-align: center;
            border-top: 1px solid #E5E7EB;
          }
          .footer p {
            margin: 0;
            font-size: 0.875rem;
            color: #6B7280;
          }
          .divider {
            margin: 2rem 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, #E5E7EB, transparent);
          }
          .security-note {
            background-color: #F3F4F6;
            border-left: 4px solid #6366F1;
            padding: 1rem;
            margin: 1.5rem 0;
            border-radius: 0 0.5rem 0.5rem 0;
            font-size: 0.875rem;
            color: #4B5563;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>✉️ Email Verification</h1>
          </div>
          
          <div class="content">
            <div class="message">
              <p>Welcome! We're excited to have you on board.</p>
              <p>To complete your registration and secure your account, please verify your email address by clicking the button below.</p>
            </div>
            
            <a href="${verificationUrl}" class="verify-button">
              Verify Email Address
            </a>
            
            <div class="divider"></div>
            
            <div class="security-note">
              <strong>🔒 Security Note:</strong> This verification link will expire in 1 hour for your security. If you didn't create an account with us, you can safely ignore this email.
            </div>
          </div>
          
          <div class="footer">
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6366F1; margin-top: 0.75rem;">${verificationUrl}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const textContent = `
      Welcome!
      
      Please verify your email address by clicking this link: ${verificationUrl}
      
      This verification link will expire in 1 hour for your security.
      
      If you didn't create an account with us, you can safely ignore this email.
    `;
    
    return await sendEmail(
      email,
      'Verify Your Email',
      htmlContent,
      textContent
    );
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error; // Re-throw to allow proper error handling upstream
  }
}

export async function sendMemberSignupMails(email: string, token: string) {
  try {
    const signupUrl = `${FRONTEND_URL}/auth/info?token=${token}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complete Your Signup</title>
        <style>
          body {
            font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.5;
            color: #111827;
            max-width: 600px;
            margin: 0 auto;
            padding: 1.5rem;
            background-color: #F9FAFB;
          }
          .email-container {
            background-color: #FFFFFF;
            border-radius: 1rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid #E5E7EB;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            color: #FFFFFF;
            padding: 2.5rem 2rem;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
            letter-spacing: -0.025em;
          }
          .content {
            padding: 2.5rem;
            text-align: center;
          }
          .message {
            font-size: 1rem;
            color: #4B5563;
            margin-bottom: 2rem;
            line-height: 1.5;
          }
          .signup-button {
            display: inline-block;
            background: #10B981;
            color: #FFFFFF;
            text-decoration: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 500;
            font-size: 1rem;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .signup-button:hover {
            background: #059669;
            transform: translateY(-1px);
          }
          .footer {
            background-color: #F9FAFB;
            padding: 1.5rem 2rem;
            text-align: center;
            border-top: 1px solid #E5E7EB;
          }
          .footer p {
            margin: 0;
            font-size: 0.875rem;
            color: #6B7280;
          }
          .divider {
            margin: 2rem 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, #E5E7EB, transparent);
          }
          .info-note {
            background-color: #DBEAFE;
            border-left: 4px solid #3B82F6;
            padding: 1rem;
            margin: 1.5rem 0;
            border-radius: 0 0.5rem 0.5rem 0;
            font-size: 0.875rem;
            color: #1E3A8A;
            text-align: left;
          }
          .steps {
            text-align: left;
            background-color: #F3F4F6;
            padding: 1.5rem;
            border-radius: 0.75rem;
            margin: 1.5rem 0;
          }
          .steps h3 {
            margin-top: 0;
            color: #10B981;
            text-align: center;
            font-size: 1.125rem;
            font-weight: 600;
          }
          .steps ol {
            margin: 0;
            padding-left: 1.25rem;
          }
          .steps li {
            margin-bottom: 0.5rem;
            color: #4B5563;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🎉 Welcome to Our Community!</h1>
          </div>
          
          <div class="content">
            <div class="message">
              <p>Congratulations! You've been invited to join as a member.</p>
              <p>Click the button below to complete your signup and provide your information.</p>
            </div>
            
            <a href="${signupUrl}" class="signup-button">
              Complete Signup
            </a>
            
            <div class="divider"></div>
            
            <div class="steps">
              <h3>What's Next?</h3>
              <ol>
                <li>Click the "Complete Signup" button above</li>
                <li>Fill out your profile information</li>
                <li>Set up your account preferences</li>
                <li>Start exploring your new member benefits!</li>
              </ol>
            </div>
            
            <div class="info-note">
              <strong>ℹ️ Important:</strong> This signup link will expire in 7 days. Please complete your registration soon to ensure access to your account.
            </div>
          </div>
          
          <div class="footer">
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #10B981; margin-top: 0.75rem;">${signupUrl}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const textContent = `
      Welcome to Our Community!
      
      Congratulations! You've been invited to join as a member.
      
      Please complete your signup by clicking this link: ${signupUrl}
      
      What's Next?
      1. Click the signup link above
      2. Fill out your profile information
      3. Set up your account preferences
      4. Start exploring your new member benefits!
      
      This signup link will expire in 7 days. Please complete your registration soon to ensure access to your account.
    `;
    
    return await sendEmail(
      email,
      'Complete Your Member Signup',
      htmlContent,
      textContent
    );
  } catch (error) {
    console.error('Error sending member signup email:', error);
    throw error; // Re-throw to allow proper error handling upstream
  }
}