import express from 'express'
import { PrismaClient, user_role } from '@repo/db/client';
import { hashPassword } from "../../util/hashing"
import { signupValidation } from '../../util/zod';
import { emailSignupBodySchema, googleSignupBodySchema } from '../../util/zod';
import { slugMaker } from '../../util/slug';
import verifyGoogleToken from '../../util/oauth';
import tokenGenerator from '../../util/token';
import { sendVerificationEmail } from '../../util/mail';

class SignupController {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    private async checkUserExists(email: string) {
        const doesUserExist = await this.prisma.users.findUnique({
            where: {
                email
            }
        });
        return doesUserExist;
    }

    private async createEmailVerificationToken(userId: string) {
        const emailToken = tokenGenerator();
        const expiration = new Date();
        expiration.setHours(expiration.getHours() + 1);
        
        await this.prisma.emailVerificationToken.create({
            data: {
                user_id: userId,
                token: emailToken,
                expiration
            }
        });
        
        return emailToken;
    }

    private async createUserAndOrganization(userData: any, orgName: string) {
        const userCreation = await this.prisma.users.create({
            data: userData
        });

        const slug = slugMaker(orgName);
        const organisationData = await this.prisma.organizations.create({
            data: {
                name: orgName,
                owner_id: userCreation.id,
                slug
            }
        });

        await this.prisma.user_organizations.create({
            data: {
                organization_id: organisationData.id,
                user_id: userCreation.id,
                role: "OWNER"
            }
        });

        return { userCreation, organisationData };
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

    emailSignup = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const parsedBody = emailSignupBodySchema.parse(req.body);
            req.body = parsedBody;

            const { email, password, name, orgName } = req.body;
            const inputValidation = signupValidation(name, email, password, orgName);
            if (!inputValidation) {
                res.status(401).json("Incorrect inputs");
                return;
            }

            const doesUserExist = await this.checkUserExists(email);
            if (doesUserExist) {
                res.status(401).json("User with this email already exists");
                return;
            }

            const hashedPassword = await hashPassword(password);
            const userCreation = await this.prisma.users.create({
                data: {
                    email,
                    name,
                    role: "OWNER",
                    password: hashedPassword,
                    isVerified: false
                }
            });

            const emailToken = await this.createEmailVerificationToken(userCreation.id);
            sendVerificationEmail(email, emailToken, orgName);

            res.status(200).json({
                success: true,
                message: "Email Sent successfully"
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

    googleSignup = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const parsedBody = googleSignupBodySchema.parse(req.body);
            req.body = parsedBody;

            const { googleId, orgName } = req.body;
            const payload = await verifyGoogleToken(googleId);
            if (!payload || !payload.email) {
                res.status(202).json({ message: "Invalid Google Token", googleTokenCorrect: false });
                return;
            }

            const email = payload.email;
            const name = payload.name!;
            const doesUserExist = await this.checkUserExists(email);
            if (doesUserExist) {
                res.status(401).json("User exists");
                return;
            }

            const userData = {
                email,
                name,
                role: "OWNER" as user_role,
                isVerified: true
            };

            const { userCreation, organisationData } = await this.createUserAndOrganization(userData, orgName);
            this.setUserSession(req, userCreation, organisationData);
            const returnUser = this.createReturnUser(userCreation, orgName);

            res.status(200).json({
                success: true,
                message: "Signup with Google Succesfull",
                data: returnUser
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
export default new SignupController(prisma);


