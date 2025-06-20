import express from 'express';
import { signinValidation } from '../../util/zod';
import { emailSigninBodySchema, googleSigninBodySchema } from '../../util/zod';
import prisma from '@repo/db'
import { comparePassword } from '../../util/hashing';
import verifyGoogleToken from '../../util/oauth';
import { user_role } from '@repo/db/client';

export const emailSignin = async (req: express.Request, res: express.Response) => {
    try{
        // Zod validation
        const parsedBody = emailSigninBodySchema.parse(req.body);
        req.body = parsedBody;
        
        const {email , password} = req.body;
        const validation = await signinValidation(email,password);
        if(!validation){
            res.status(400).json("Entered details do not match criteria");
            return;
        }
        const doesUserExist = await prisma.users.findUnique({
            where : {
                email
            },
            select : {
                id : true,
                isVerified : true,
                password : true,
                name : true,
                role : true,
                email : true
            }
        });
        if(!doesUserExist){
            res.status(401).json("User does not Exist");
            return;
        }
        if(!doesUserExist.isVerified){
            res.status(401).json("You are not Verified");
            return;
        }
        if(!doesUserExist.password){
            res.status(401).json("You have not signed up with with Email and Password");
            return;
        }
        const passwordCheck = await comparePassword(password,doesUserExist.password);
        if(!passwordCheck){
            res.status(401).json("Incorrect Password");
            return;
        }
        const orgDetails = await prisma.user_organizations.findUnique({
            where : {
                user_id : doesUserExist.id
            },
            select : {
                organization_id : true
            }
        });
        if(!orgDetails){
            res.status(401).json("Org Details Not Found");
            return;
        }
        const orgData = await prisma.organizations.findUnique({
            where : {
                id : orgDetails.organization_id
            },
            select : {
                slug : true,
                name : true
            }
        });
        if(!orgData){
            res.status(401).json("Shouldnt Happen");
            return;
        }
        req.session.user = {
            userId : doesUserExist.id ,
            userName : doesUserExist.name , 
            userEmail : email , 
            userRole : doesUserExist.role,
            userOrganisationId : orgDetails.organization_id,
            userOrganisationSlug : orgData.slug
        };
        const returnUser : {name : string , email : string ,id : string ,  role : user_role,organisationName : string } = {
            name : doesUserExist.name 
             , email : doesUserExist.email , id :doesUserExist.id , role : doesUserExist.role , organisationName : orgData.name };
        res.status(200).json({
            success: true,
            message: "Signin with Email Succesfull",
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

export const googleSignin = async (req: express.Request, res: express.Response) => {
    try{
        // Zod validation
        const parsedBody = googleSigninBodySchema.parse(req.body);
        req.body = parsedBody;
        
        const {googleId} = req.body;
        if(!googleId){
            res.status(401).json("Missing Google Id");
            return;
        }
        const payload = await verifyGoogleToken(googleId);
        if (!payload || !payload.email) {
            res.status(202).json({ message: "Invalid Google Token" ,googleTokenCorrect : false});
            return;
        }
        const email = payload.email;
        const doesUserExist = await prisma.users.findUnique({
            where : {
                email
            }, 
            select : {
                id : true,
                password : true,
                name : true,
                role : true,
                email : true
            }
        });
        if(!doesUserExist){
            res.status(401).json("User does not Exist");
            return;
        }
         const orgDetails = await prisma.user_organizations.findUnique({
            where : {
                user_id : doesUserExist.id
            },
            select : {
                organization_id : true
            }
        });
        if(!orgDetails){
            res.status(401).json("Org Details Not Found");
            return;
        }
        const orgData = await prisma.organizations.findUnique({
            where : {
                id : orgDetails.organization_id
            },
            select : {
                slug : true,
                name : true
            }
        });
        if(!orgData){
            res.status(401).json("Shouldnt Happen");
            return;
        }
        req.session.user = {
            userId : doesUserExist.id , 
            userEmail : email , 
            userRole : doesUserExist.role ,
            userName : doesUserExist.name ,
            userOrganisationId : orgDetails.organization_id,
            userOrganisationSlug : orgData.slug
        }
        const returnUser : {name : string , email : string ,id : string ,  role : user_role,organisationName : string } = {
            name : doesUserExist.name 
             , email : doesUserExist.email , id :doesUserExist.id , role : doesUserExist.role , organisationName : orgData.name};

        res.status(200).json({
            success: true,
            message: "Signin With Google Succesfull",
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