import express from 'express'
import {PrismaClient} from '@repo/db/client'
import prisma from '@repo/db';


class AuditLogs{
    private prisma : PrismaClient
    constructor(prisma : PrismaClient){
        this.prisma = prisma
    }
    fetchAuditLogs = async (req: express.Request, res: express.Response) => {
    try {
        // Zod validation
        const organisationId = req.session.user?.userOrganisationId;
        const userRole = req.session.user?.userRole;

        if (userRole === undefined || userRole === "MEMBER" || userRole === "VIEWER") {
            res.status(403).json({ success: false, message: "Unauthorised" });
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const pageSize = 10;
        const skip = (page - 1) * pageSize;

        const [auditLogs, total] = await Promise.all([
    this.prisma.audit_logs.findMany({
        where: {
            organisation_id: organisationId
        },
        skip,
        take: pageSize,
        orderBy: {
            created_at: 'desc'
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    is_active : true,
                    isVerified : true,
                    role : true
                }
            }
        }
    }),
    this.prisma.audit_logs.count({
        where: {
            organisation_id: organisationId
        }
    })
]);

    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
}

const fetchAuditLogsObject = new AuditLogs(prisma);
export default fetchAuditLogsObject;