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

export async function sendVerificationEmail(email: string, token: string, orgName: string) {
  try {
    const verificationUrl = `${FRONTEND_URL}/check-email-verify-final?token=${token}&org=${encodeURIComponent(orgName)}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .email-container {
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          .org-name {
            color: #667eea;
            font-weight: 600;
            font-size: 18px;
            margin-bottom: 20px;
          }
          .message {
            font-size: 16px;
            color: #555;
            margin-bottom: 30px;
            line-height: 1.8;
          }
          .verify-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 15px 35px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: transform 0.2s ease;
          }
          .verify-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          .footer p {
            margin: 0;
            font-size: 14px;
            color: #6c757d;
          }
          .divider {
            margin: 30px 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, #e9ecef, transparent);
          }
          .security-note {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
            font-size: 14px;
            color: #555;
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
            <p style="word-break: break-all; color: #667eea; margin-top: 10px;">${verificationUrl}</p>
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
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .email-container {
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          .message {
            font-size: 16px;
            color: #555;
            margin-bottom: 30px;
            line-height: 1.8;
          }
          .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            text-decoration: none;
            padding: 15px 35px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
            transition: transform 0.2s ease;
          }
          .reset-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6);
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          .footer p {
            margin: 0;
            font-size: 14px;
            color: #6c757d;
          }
          .divider {
            margin: 30px 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, #e9ecef, transparent);
          }
          .security-note {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
            font-size: 14px;
            color: #856404;
          }
          .warning-box {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #721c24;
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
            <p style="word-break: break-all; color: #ff6b6b; margin-top: 10px;">${resetUrl}</p>
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
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .email-container {
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          .message {
            font-size: 16px;
            color: #555;
            margin-bottom: 30px;
            line-height: 1.8;
          }
          .verify-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 15px 35px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: transform 0.2s ease;
          }
          .verify-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          .footer p {
            margin: 0;
            font-size: 14px;
            color: #6c757d;
          }
          .divider {
            margin: 30px 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, #e9ecef, transparent);
          }
          .security-note {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
            font-size: 14px;
            color: #555;
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
              <strong>🔒 Security Note:</strong> This verification link will expire in 24 hours for your security. If you didn't create an account with us, you can safely ignore this email.
            </div>
          </div>
          
          <div class="footer">
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea; margin-top: 10px;">${verificationUrl}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const textContent = `
      Welcome!
      
      Please verify your email address by clicking this link: ${verificationUrl}
      
      This verification link will expire in 24 hours for your security.
      
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