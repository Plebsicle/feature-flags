import express from 'express'
import prisma from "@repo/db"


export const getMembers = async (req : express.Request , res : express.Response) => {
    try{
        const userRole = req.session.user?.userRole;
        if(userRole !== "OWNER"){
            res.status(401).json({success : false,message : "Unauthorised Access"});
            return;
        }
        const memberOrgData = await prisma.user_organizations.findMany({
            where : {
                organization_id : req.session.user?.userOrganisationId
            }
        });
        const memberIds = memberOrgData.map(data => data.user_id);
        const memberDetails = await prisma.users.findMany({
            where : {
                id : {
                    in : memberIds
                }
            },
            select : {
                id : true,
                name : true,
                email : true,
                role : true
            }
        });
        res.status(200).json({success : true ,data : memberDetails});
    }
    catch(e){
        console.error(e);
        res.status(500).json({sucess : false, message : "Internal Server Error"});
    }
}