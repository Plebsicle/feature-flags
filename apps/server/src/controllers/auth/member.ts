import express from 'express'
import { memberSignupValidation } from '../../util/zod';
import { memberSignupVerificationBodySchema, memberSignupSendInvitationBodySchema } from '../../util/zod';
import prisma from '@repo/db';
import { hashPassword } from '../../util/hashing';
import tokenGenerator from '../../util/token';
import { sendMemberSignupMails } from '../../util/mail';
import { user_role } from '@repo/db/client';

export const memberSignupVerification = async (req:express.Request , res : express.Response)=>{
    try{
        // Zod validation
        const parsedBody = memberSignupVerificationBodySchema.parse(req.body);
        req.body = parsedBody;

        const {name,password,token} = req.body;
        const validation = await memberSignupValidation(name,password,token);
        if(!validation){
            res.status(401).json("Invalid Inputs");
            return;
        }
        const findToken = await prisma.invitations.findUnique({
            where : {
                token,
                expires_at : {
                    gte : new Date()
                },
                is_used : false
            }
        });
        if(!findToken){
            res.status(401).json("Invalid Token");
            return;
        }
        await prisma.invitations.update({
            where : {
                token,
                expires_at : {
                    gte : new Date()
                },
                is_used : false
            },
            data : {
                is_used : true
            }
        });

        const hashedPassword = await hashPassword(password);
        const member = await prisma.users.create({
            data : {
                email : findToken.email,
                name,
                isVerified : true,
                role : findToken.role,
                password : hashedPassword
            },
            select : {
                name : true, role: true , email :true , id : true
            }
        });
        
        await prisma.user_organizations.create({
            data : {
                user_id : member.id,
                organization_id : findToken.organization_id,
                role : member.role
            }
        });
        await prisma.owner_members.create({
            data : {
                owner_id : findToken.invited_by,
                member_id : member.id,
            }
        });
        const orgData = await prisma.organizations.findUnique({
            where : {
                id : findToken.organization_id
            },
            select : {
                name : true
            }
        });
        if(!orgData){
            res.status(400).json({success : false,message : "No Org"});
            return;
        }
        req.session.user = {
            userEmail : member.email,
            userId : member.id,
            userName : member.name,
            userRole : member.role,
            userOrganisationId : findToken.organization_id
        }
        const returnUser : {name : string , email : string ,id : string ,  role : user_role, organisationName : string } = {
            name : member.name 
             , email : member.email , id :member.id , role : member.role,organisationName : orgData.name };
         res.status(200).json({
            success: true,
            message: "Member Signup Succesfull",
            data : returnUser
        });
    }
    catch(e){
        console.error(e);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

export const memberSignupSendInvitation = async (req: express.Request, res: express.Response) => {
    try {
        // Zod validation
        // const parsedBody = memberSignupSendInvitationBodySchema.parse(req.body);
        // req.body = parsedBody;
        
        const role = req.session.user?.userRole;
        if(role !== "OWNER"){
            res.status(401).json("Only Owner Can Invite memebers");
            return;
        }
        const { emails,memberRole } = req.body;

        if (!Array.isArray(emails)) {
             res.status(401).json("Invalid Inputs");
             return;
        }

        const userId = req.session.user?.userId;
        if (!userId) {
            res.status(401).json("Unauthorized");
            return;
        }
        console.log(userId);
        // console.log(emails," ",role);
        
        const org = await prisma.user_organizations.findUnique({
            where: {
                user_id: userId
            }
        });
        console.log(org);
        
        if (!org?.organization_id) {
            res.status(400).json("Organization not found");
            return ;
        }

        // Check which emails already exist in the users table
        const existingUsers = await prisma.users.findMany({
            where: {
                email: {
                    in: emails
                }
            },
            select: {
                email: true
            }
        });

        const ineligibleEmails = existingUsers.map(user => user.email);
        const eligibleEmails = emails.filter(email => !ineligibleEmails.includes(email));

        // Send invitations to eligible emails
        for (const email of eligibleEmails) {
            const token = tokenGenerator();
            const expiration = new Date();
            expiration.setHours(expiration.getHours() + 1);

            await prisma.invitations.create({
                data: {
                    email,
                    expires_at: expiration,
                    token,
                    invited_by: userId,
                    organization_id: org.organization_id,
                    role : memberRole
                }
            });

            await sendMemberSignupMails(email, token);
        }

         res.status(200).json({
            success: true,
            message: "Sent Invitation Succesfully",
            data: ineligibleEmails
        });
    } catch(e){
        console.error(e);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};