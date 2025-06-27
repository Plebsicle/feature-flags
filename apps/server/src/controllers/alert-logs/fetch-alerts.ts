import { alert_status, PrismaClient } from '@repo/db/client';
import express from 'express'
import prisma from '@repo/db';

class FetchAlerts {
    constructor(private prisma : PrismaClient){
        this.prisma = prisma
    }
    updateAlertStatus = async (req: express.Request, res: express.Response) => {
        try{
        // zod validation
        const userRole = req.session.user?.userRole;
        if (userRole === undefined || userRole === "MEMBER" || userRole === "VIEWER") {
            res.status(403).json({ success: false, message: "Unauthorised" });
            return;
        }

        const alertId = req.params.alertId;
        const alertStatus = req.body.alertStatus;

        const updatedAlert = await this.prisma.triggered_alerts.update({
            where: { id: alertId },
            data: { alert_status: alertStatus }
        });

        res.status(200).json({success : true,message : "Alert status updated successfully",data : updatedAlert});
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
    
    }
    fetchAlerts = async (req: express.Request, res: express.Response) => {
    try {
        // zod validation
        const status = (req.query.status as string) || "TRIGGERED";

        const userRole = req.session.user?.userRole;
        if (userRole === undefined || userRole === "MEMBER" || userRole === "VIEWER") {
             res.status(403).json({ success: false, message: "Unauthorised" });
             return;
        }

        const organisation_id = req.session.user?.userOrganisationId;

        const result = await this.prisma.metrics.findMany({
            where: {
                organization_id: organisation_id,
                triggered_alerts: {
                    some: {
                        alert_status: status as alert_status
                    }
                }
            },
            include: {
                triggered_alerts: {
                    where: {
                        alert_status: status as alert_status
                    },
                    orderBy: {
                        created_at: 'desc'
                    }
                }
            }
        });

        res.status(200).json({ success: true, data: result });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

}

const fetchAlertsObject = new FetchAlerts(prisma);
export default fetchAlertsObject;