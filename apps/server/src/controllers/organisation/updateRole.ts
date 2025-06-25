import { user_role } from '@repo/db/client';
import express from 'express'
import prisma from '@repo/db';

interface UpdateRoleBody {
    role: user_role;
    userId: string;
}

interface UpdateRoleControllerDependencies {
    prisma: typeof prisma;
}

class UpdateRoleController {
    private prisma: typeof prisma;

    constructor(dependencies: UpdateRoleControllerDependencies) {
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

    private updateUserOrganizationRole = async (organizationId: string, userId: string, role: user_role) => {
        return await this.prisma.user_organizations.update({
            where: {
                organization_id: organizationId,
                user_id: userId
            },
            data: {
                role
            }
        });
    };

    private updateUserRole = async (userId: string, role: user_role) => {
        return await this.prisma.users.update({
            where: {
                id: userId
            },
            data: {
                role
            }
        });
    };

    updateRole = async (req: express.Request, res: express.Response) => {
        try {
            if (!this.checkOwnerAuthorization(req, res)) return;

            const { role, userId } = req.body as UpdateRoleBody;
            const organizationId = req.session.user?.userOrganisationId!;

            // Zod validation could be added here
            await Promise.all([
                this.updateUserOrganizationRole(organizationId, userId, role),
                this.updateUserRole(userId, role)
            ]);

            res.status(200).json({ success: true, message: "Role Updated Successfully" });
        }
        catch (e) {
            console.error(e);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }
}

// Instantiate and export the controller
import dbInstance from '@repo/db';

const updateRoleController = new UpdateRoleController({
    prisma: dbInstance
});

export const updateRole = updateRoleController.updateRole;