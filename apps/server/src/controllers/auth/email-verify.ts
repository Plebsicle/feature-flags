import express from 'express'
import { verifyEmailValidation } from '../../util/zod';
import { verifyEmailSignupBodySchema, verifyEmailManualBodySchema, sendVerificationEmailManualBodySchema } from '../../util/zod';
import { slugMaker } from '../../util/slug';
import prisma from '@repo/db';
import tokenGenerator from '../../util/token';
import { sendVerificationEmailManualMailer } from '../../util/mail';


export const verifyEmailSignup = async (req:express.Request , res : express.Response) => {
    try{
        // Zod validation
        const parsedBody = verifyEmailSignupBodySchema.parse(req.body);
        req.body = parsedBody;
        
        const {orgName , token } = req.body;
        const result = await verifyEmailValidation(token,orgName);
        if(!result){
            res.status(401).json("Invalid Body Inputs");
            return;
        }
        const response = await prisma.emailVerificationToken.findUnique({
            where : {
                token,
                expiration : {
                    gte : new Date()
                }
            },
            include : {
                user : true
            }
        });

        if(!response){
            res.status(401).json("Invalid Token");
            return;
        }

        const userCreation = response.user;
        const slug = slugMaker(orgName);

        await prisma.users.update({
            where : {
                id : userCreation.id
            },
            data : {
                isVerified : true
            }
        });


        const organisationData = await prisma.organizations.create({
            data : {
                name : orgName,
                owner_id : userCreation.id,
                slug
            }
        });

        await prisma.user_organizations.create({
            data : {
                organization_id : organisationData.id,
                user_id : userCreation.id,
                role : "OWNER"
            }
        });

         req.session.user = {
            userEmail : userCreation.email,
            userId : userCreation.id,
            userName : userCreation.name,
            userRole : userCreation.role,
            userOrganisationId : organisationData.id,
            userOrganisationSlug : organisationData.slug
        }
         res.status(200).json({
            success: true,
            message: "User Verification Succesfull"
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

export const verifyEmailManual = async (req : express.Request , res:express.Response) => {
    try{
        // Zod validation
        const parsedBody = verifyEmailManualBodySchema.parse(req.body);
        req.body = parsedBody;
        
        const {token} = req.body;
        const result = await prisma.emailVerificationToken.findUnique({
            where : {
                token
            },
            include : {
                user : true
            }
        });
        if(!result){
            res.status(401).json("Invalid Token");
            return;
        }
        const userCreation = result.user;
         await prisma.users.update({
            where : {
                id : userCreation.id
            },
            data : {
                isVerified : true
            }
        });
         res.status(200).json({
            success: true,
            message: "User Verified Succesfully"
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


export const sendVerificationEmailManual = async (req : express.Request , res : express.Response) => {
    try{
        // Zod validation
        const parsedBody = sendVerificationEmailManualBodySchema.parse(req.body);
        req.body = parsedBody;
        
        const {email} = req.body;
        const emailToken = tokenGenerator();
        const expiration = new Date();
        expiration.setHours(expiration.getHours() + 1);
        const user = await prisma.users.findFirst({
            where : {
                email
            }
        });
        if(!user){
            res.status(401).json("User Does not Exist");
            return;
        }

        await prisma.emailVerificationToken.create({
            data : {
                expiration,
                token : emailToken,
                user_id : user.id 
            }
        });
        await sendVerificationEmailManualMailer(email,emailToken);
         res.status(200).json({
            success: true,
            message: "Email Sent Succesfully"
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

