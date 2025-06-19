import prisma from '@repo/db';
import express from 'express'

export const getUserData = async (req : express.Request , res : express.Response) => {
    try{
        const orgData = await prisma.organizations.findUnique({
            where : {
                id : req.session.user?.userOrganisationId
            },
            select : {
                owner : true,
                name : true
            }
        });
        if(!orgData){
            res.status(401).json({success : false,message : "Unauthorised Access"});
            return;
        }
        res.status(200).json({success : true, data : {
            name : req.session.user?.userName,
            email : req.session.user?.userEmail,
            role : req.session.user?.userRole,
            organisationName :  orgData.name,
            ownerName :  orgData?.owner.name, 
        }});
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}
