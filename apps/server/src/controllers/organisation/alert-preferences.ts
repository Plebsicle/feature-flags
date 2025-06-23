import prisma from '@repo/db';
import { user_role } from '@repo/db/client';
import express from 'express'


interface myBody {
    alert_notification_frequency :  Date | string, 
    email_enabled : boolean,
    slack_enabled : boolean,
    email_roles_notification : user_role[],
}

export const orgAlertPreferences = async (req : express.Request,res : express.Response) => {
    try{
         const userRole = req.session.user?.userRole;
        if(userRole === undefined ||  (userRole !== "OWNER")){
            res.status(403).json({success : true,message : "Not Authorised"})
            return;
        }
        const organisationId = req.session.user?.userOrganisationId!;
        const {alert_notification_frequency,email_enabled,slack_enabled,email_roles_notification} = req.body as myBody;
        await prisma.alert_preferences.create({
            data : {
                organisation_id : organisationId,
                alert_notification_frequency,
                email_enabled,
                slack_enabled,
                email_roles_notification
            }   
        });
        res.status(200).json({success : true,message : "Alert Preferences Added"});
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}

export const getAlertPreferences = async (req : express.Request , res : express.Response) => {
    try{
        const organisationId = req.session.user?.userOrganisationId!;
        const prefData = await prisma.alert_preferences.findUnique({
            where : {
                organisation_id : organisationId
            }
        })
        res.status(200).json({success : true , message : "Preferences fetched successfully",data : prefData});
    }   
    catch(e){
        console.error(e);
        res.status(500).json({success : false, message : "Internal Server Error"});
    }
}

export const updatePreferences = async (req : express.Request , res : express.Response) => {
    try{
        const {alert_notification_frequency,email_enabled,slack_enabled,email_roles_notification} = req.body as myBody;
        const organisation_id = req.session.user?.userOrganisationId!;
        await prisma.alert_preferences.update({
            where : {
                organisation_id
            },
            data : {
                alert_notification_frequency,slack_enabled,email_enabled,email_roles_notification
            }
        });
        res.status(200).json({success : true , message : "Preference updated succesfully"});
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false, message : "Internal Server Error"});
    }
}