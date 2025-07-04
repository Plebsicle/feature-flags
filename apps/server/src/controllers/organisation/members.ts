import express from 'express'
import prisma from "@repo/db"

interface OrganisationMembersControllerDependencies {
    prisma: typeof prisma;
}

class OrganisationMembersController {
    private prisma: typeof prisma;

    constructor(dependencies: OrganisationMembersControllerDependencies) {
        this.prisma = dependencies.prisma;
    }

    private checkOwnerAuthorization = (req: express.Request, res: express.Response): boolean => {
        const userRole = req.session.user?.userRole;
        if (userRole === undefined || (userRole !== "OWNER")) {
            res.status(403).json({ success: true, message: "Not Authorised" });
            return false;
        }
        return true;
    };

    private fetchMemberDetails = async (memberIds: string[]) => {
        return await this.prisma.users.findMany({
            where: {
                id: {
                    in: memberIds
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });
    };

    getMembers = async (req: express.Request, res: express.Response) => {
        try {
            if (!this.checkOwnerAuthorization(req, res)) return;

            const memberOrgData = await this.prisma.user_organizations.findMany({
                where: {
                    organization_id: req.session.user?.userOrganisationId
                }
            });
            const orgSlug = await this.prisma.organizations.findUnique({
                where: {
                    id: req.session.user?.userOrganisationId
                },
                select: {
                    slug: true
                }
            });

            const memberIds = memberOrgData.map((data: { user_id: string }) => data.user_id);
            const memberDetails = await this.fetchMemberDetails(memberIds);

            res.status(200).json({ success: true, data: memberDetails, orgSlug: orgSlug });
        }
        catch (e) {
            console.error(e);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }
}

// Instantiate and export the controller
import dbInstance from '@repo/db';

const organisationMembersController = new OrganisationMembersController({
    prisma: dbInstance
});

export const getMembers = organisationMembersController.getMembers;