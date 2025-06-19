import { user_role } from '@repo/db/client';
import express from 'express'
import prisma from '@repo/db';


interface myBody {
    role : user_role
    userId : string
}

export const updateRole = async (req : express.Request,res : express.Response) => {
    try{
        const userRole = req.session.user?.userRole;
        
        if(userRole !== "OWNER"){
            res.status(401).json({success : false,message : "Unauthorised Access"});
            return;
        }
        const {role , userId } = req.body as myBody;
        // Zod
        await prisma.user_organizations.update({
            where : {
                organization_id : req.session.user?.userOrganisationId,
                user_id : userId
            },
            data : {
                role
            }
        });
        await prisma.users.update({
            where : {
                id : userId
            },
            data : {
                role
            }
        });
        res.status(200).json({success : true, message : "Role Updated Succesfully"});
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}