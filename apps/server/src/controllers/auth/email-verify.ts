import express from 'express'
import { PrismaClient, user_role } from '@repo/db/client';
import { verifyEmailValidation } from '../../util/zod';
import { verifyEmailSignupBodySchema, verifyEmailManualBodySchema, sendVerificationEmailManualBodySchema } from '../../util/zod';
import { slugMaker } from '../../util/slug';
import tokenGenerator from '../../util/token';
import { sendVerificationEmailManualMailer } from '../../util/mail';

class EmailVerificationController {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    private async findVerificationToken(token: string, includeUser: boolean = false) {
        return await this.prisma.emailVerificationToken.findUnique({
            where: {
                token,
                expiration: {
                    gte: new Date()
                }
            },
            include: {
                user: includeUser
            }
        });
    }

    private async createOrganizationAndUserRelation(user: any, orgName: string) {
        await this.prisma.users.update({
            where: {
                id: user.id
            },
            data: {
                isVerified: true
            }
        });

        const slug = slugMaker(orgName);
        const organisationData = await this.prisma.organizations.create({
            data: {
                name: orgName,
                owner_id: user.id,
                slug
            }
        });

        await this.prisma.user_organizations.create({
            data: {
                organization_id: organisationData.id,
                user_id: user.id,
                role: "OWNER"
            }
        });

        return organisationData;
    }

    private setUserSession(req: express.Request, user: any, orgData: any) {
        req.session.user = {
            userEmail: user.email,
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            userOrganisationId: orgData.id,
            userOrganisationSlug: orgData.slug
        };
    }

    private createReturnUser(user: any, orgName: string): { name: string, email: string, id: string, role: user_role, organisationName: string } {
        return {
            name: user.name,
            email: user.email,
            id: user.id,
            role: user.role,
            organisationName: orgName
        };
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

    verifyEmailSignup = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const parsedBody = verifyEmailSignupBodySchema.parse(req.body);
            req.body = parsedBody;

            const { orgName, token } = req.body;
            const result = await verifyEmailValidation(token, orgName);
            if (!result) {
                res.status(401).json("Invalid Body Inputs");
                return;
            }

            const response = await this.findVerificationToken(token, true);
            if (!response) {
                res.status(401).json("Invalid Token");
                return;
            }

            const userCreation = response.user;
            const organisationData = await this.createOrganizationAndUserRelation(userCreation, orgName);
            this.setUserSession(req, userCreation, organisationData);

            res.status(200).json({
                success: true,
                message: "User Verification Succesfull"
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

    verifyEmailManual = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const parsedBody = verifyEmailManualBodySchema.parse(req.body);
            req.body = parsedBody;

            const { token } = req.body;
            const result = await this.prisma.emailVerificationToken.findUnique({
                where: {
                    token
                },
                include: {
                    user: true
                }
            });

            if (!result) {
                res.status(401).json("Invalid Token");
                return;
            }

            const userCreation = result.user;
            await this.prisma.users.update({
                where: {
                    id: userCreation.id
                },
                data: {
                    isVerified: true
                }
            });

            res.status(200).json({
                success: true,
                message: "User Verified Succesfully"
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

    sendVerificationEmailManual = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const parsedBody = sendVerificationEmailManualBodySchema.parse(req.body);
            req.body = parsedBody;

            const { email } = req.body;
            const user = await this.prisma.users.findFirst({
                where: {
                    email
                }
            });

            if (!user) {
                res.status(401).json("User Does not Exist");
                return;
            }

            const emailToken = await this.createEmailVerificationToken(user.id);
            await sendVerificationEmailManualMailer(email, emailToken);

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
}

// Import the actual prisma instance
import prisma from '@repo/db';

// Export the instantiated controller
export default new EmailVerificationController(prisma);

