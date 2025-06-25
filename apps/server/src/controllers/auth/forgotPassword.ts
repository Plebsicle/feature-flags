import express from 'express'
import { PrismaClient } from '@repo/db/client';
import { sendVerificationEmailForgetPasswordBodySchema, checkVerificationEmailForgetPasswordBodySchema } from '../../util/zod';
import tokenGenerator from '../../util/token';
import { sendResetPassword } from '../../util/mail';
import { hashPassword } from '../../util/hashing';

class ForgotPasswordController {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    private async findUserByEmail(email: string) {
        return await this.prisma.users.findFirst({
            where: {
                email
            }
        });
    }

    private async createEmailVerificationToken(userId: string) {
        const emailToken = tokenGenerator();
        const expiration = new Date();
        expiration.setHours(expiration.getHours() + 1);

        await this.prisma.emailVerificationToken.create({
            data: {
                expiration,
                token: emailToken,
                user_id: userId
            }
        });

        return emailToken;
    }

    private async findValidVerificationToken(token: string) {
        return await this.prisma.emailVerificationToken.findUnique({
            where: {
                token,
                expiration: {
                    gte: new Date()
                }
            },
            include: {
                user: true
            }
        });
    }

    private async updateUserPassword(userId: string, hashedPassword: string) {
        return await this.prisma.users.update({
            where: {
                id: userId
            },
            data: {
                password: hashedPassword
            }
        });
    }

    sendVerificationEmailForgetPassword = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const parsedBody = sendVerificationEmailForgetPasswordBodySchema.parse(req.body);
            req.body = parsedBody;

            const { email } = req.body;
            const user = await this.findUserByEmail(email);
            if (!user) {
                res.status(401).json("User Does not Exist");
                return;
            }

            const emailToken = await this.createEmailVerificationToken(user.id);
            await sendResetPassword(email, emailToken);

            res.status(200).json({
                success: true,
                message: "Email Sent Succesfully"
            });
        }
        catch (e) {
            console.error(e);
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }

    checkVerificationEmailForgetPassword = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const parsedBody = checkVerificationEmailForgetPasswordBodySchema.parse(req.body);
            req.body = parsedBody;

            const { password, token } = req.body;
            const result = await this.findValidVerificationToken(token);
            if (!result) {
                res.status(401).json('Invalid Token');
                return;
            }

            const hashedPassword = await hashPassword(password);
            const user = result.user;
            await this.updateUserPassword(user.id, hashedPassword);

            res.status(200).json({
                success: true,
                message: "Password Updated Succesfully",
                data: result
            });
        }
        catch (e) {
            console.error(e);
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }
}

// Import the actual prisma instance
import prisma from '@repo/db';

// Export the instantiated controller
export default new ForgotPasswordController(prisma);