import { PrismaClient } from '@repo/db/client';
import express from 'express'

class UserController {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    getUserData = async (req: express.Request, res: express.Response) => {
        try {
            const organisationId = req.session.user?.userOrganisationId;
            console.log(organisationId);
            
            const orgData = await this.prisma.organizations.findUnique({
                where: {
                    id: organisationId
                },
                select: {
                    owner: true,
                    name: true
                }
            });
            
            if (!orgData) {
                res.status(401).json({ success: false, message: "Unauthorised Access" });
                return;
            }
            
            res.status(200).json({
                success: true,
                data: {
                    name: req.session.user?.userName,
                    email: req.session.user?.userEmail,
                    role: req.session.user?.userRole,
                    organisationName: orgData.name,
                    ownerName: orgData?.owner.name,
                }
            });
        }
        catch (e) {
            console.error(e);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }
}

// Import the actual prisma instance
import prisma from '@repo/db';

// Export the instantiated controller
export default new UserController(prisma);
