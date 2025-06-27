import express from 'express';
import { PrismaClient, user_role } from '@repo/db/client';
import { signinValidation } from '../../util/zod/zod';
import { emailSigninBodySchema, googleSigninBodySchema } from '../../util/zod/zod';
import { comparePassword } from '../../util/hashing';
import verifyGoogleToken from '../../util/oauth';

class SigninController {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    private async validateUserCredentials(email: string, password: string) {
        const doesUserExist = await this.prisma.users.findUnique({
            where: {
                email,
                is_active : true
            },
            select: {
                id: true,
                isVerified: true,
                password: true,
                name: true,
                role: true,
                email: true
            }
        });

        if (!doesUserExist) {
            return { error: "User does not Exist", status: 401 };
        }

        if (!doesUserExist.isVerified) {
            return { error: "You are not Verified", status: 401 };
        }

        if (!doesUserExist.password) {
            return { error: "You have not signed up with with Email and Password", status: 401 };
        }

        const passwordCheck = await comparePassword(password, doesUserExist.password);
        if (!passwordCheck) {
            return { error: "Incorrect Password", status: 401 };
        }

        return { user: doesUserExist };
    }

    private async getUserOrganizationData(userId: string) {
        const orgDetails = await this.prisma.user_organizations.findUnique({
            where: {
                user_id: userId
            },
            select: {
                organization_id: true
            }
        });

        if (!orgDetails) {
            return { error: "Org Details Not Found", status: 401 };
        }

        const orgData = await this.prisma.organizations.findUnique({
            where: {
                id: orgDetails.organization_id
            },
            select: {
                slug: true,
                name: true
            }
        });

        if (!orgData) {
            return { error: "Shouldnt Happen", status: 401 };
        }

        return { orgDetails, orgData };
    }

    private setUserSession(req: express.Request, user: any, orgDetails: any, orgData: any) {
        req.session.user = {
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            userRole: user.role,
            userOrganisationId: orgDetails.organization_id,
            userOrganisationSlug: orgData.slug
        };
    }

    private createReturnUser(user: any, orgData: any): { name: string, email: string, id: string, role: user_role, organisationName: string } {
        return {
            name: user.name,
            email: user.email,
            id: user.id,
            role: user.role,
            organisationName: orgData.name
        };
    }

    emailSignin = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const parsedBody = emailSigninBodySchema.parse(req.body);
            req.body = parsedBody;

            const { email, password } = req.body;
            
            const userValidation = await this.validateUserCredentials(email, password);
            if (userValidation.error) {
                res.status(userValidation.status!).json(userValidation.error);
                return;
            }

            const orgResult = await this.getUserOrganizationData(userValidation.user!.id);
            if (orgResult.error) {
                res.status(orgResult.status!).json(orgResult.error);
                return;
            }

            this.setUserSession(req, userValidation.user, orgResult.orgDetails, orgResult.orgData);
            const returnUser = this.createReturnUser(userValidation.user, orgResult.orgData);

            res.status(200).json({
                success: true,
                message: "Signin with Email Succesfull",
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

    private async validateGoogleUser(email: string) {
        const doesUserExist = await this.prisma.users.findUnique({
            where: {
                email
            },
            select: {
                id: true,
                password: true,
                name: true,
                role: true,
                email: true
            }
        });

        if (!doesUserExist) {
            return { error: "User does not Exist", status: 401 };
        }

        return { user: doesUserExist };
    }

    googleSignin = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const parsedBody = googleSigninBodySchema.parse(req.body);
            req.body = parsedBody;

            const { googleId } = req.body;
            if (!googleId) {
                res.status(401).json("Missing Google Id");
                return;
            }

            const payload = await verifyGoogleToken(googleId);
            if (!payload || !payload.email) {
                res.status(202).json({ message: "Invalid Google Token", googleTokenCorrect: false });
                return;
            }

            const email = payload.email;
            const userValidation = await this.validateGoogleUser(email);
            if (userValidation.error) {
                res.status(userValidation.status!).json(userValidation.error);
                return;
            }

            const orgResult = await this.getUserOrganizationData(userValidation.user!.id);
            if (orgResult.error) {
                res.status(orgResult.status!).json(orgResult.error);
                return;
            }

            this.setUserSession(req, userValidation.user, orgResult.orgDetails, orgResult.orgData);
            const returnUser = this.createReturnUser(userValidation.user, orgResult.orgData);

            res.status(200).json({
                success: true,
                message: "Signin With Google Succesfull",
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
export default new SigninController(prisma);