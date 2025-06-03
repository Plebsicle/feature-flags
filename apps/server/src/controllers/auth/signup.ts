import express from 'express'
import { hashPassword } from "../../util/hashing"
import { signupValidation } from '../../util/zod';
import prisma from '@repo/db';
import { slugMaker } from '../../util/slug';
import verifyGoogleToken from '../../util/oauth';
import tokenGenerator from '../../util/token';
import { sendVerificationEmail } from '../../util/mail';


export const emailSignup = async (req: express.Request, res: express.Response)=>{
    try{
        const {email,password,name , orgName } = req.body;
        const inputValidation = signupValidation(name,email,password,orgName);
        if(!inputValidation){
            res.status(401).json("Incorrect inputs");
            return;
        }
        const doesUserExist = await prisma.users.findUnique({
            where : {
                email
            }
        });
        if(doesUserExist){
            res.status(401).json("User with this email already exists");
            return;
        }

        const hashedPassword = await hashPassword(password);
        const emailToken = tokenGenerator();
        const expiration = new Date();
        expiration.setHours(expiration.getHours() + 1);
        const userCreation = await prisma.users.create({
            data : {
                email,
                name,
                role : "OWNER",
                password : hashedPassword,
                isVerified : false
            }
        });
        await prisma.emailVerificationToken.create({
            data : {
                user_id : userCreation.id,
                token : emailToken,
                expiration
            }
        });
        sendVerificationEmail(email , emailToken,orgName);

        res.status(200).json("Email Sent Successfully");
    }
    catch(e){
        console.error(e);
        res.status(500).json("Internal server error");
    }
    
}

export const googleSignup = async (req : express.Request, res : express.Response) => {
    try{
        const {googleId , orgName} = req.body;
        const payload = await verifyGoogleToken(googleId);
        if (!payload || !payload.email) {
            res.status(202).json({ message: "Invalid Google Token" ,googleTokenCorrect : false});
            return;
        }
        const email = payload.email;
        const name = payload.name!;
        const doesUserExist = await prisma.users.findUnique({
            where : {
                email
            }
        });
        if(doesUserExist){
            res.status(401).json("User exists");
            return;
        }
        const userCreation = await prisma.users.create({
            data : {
                email,
                name,
                role : "OWNER",
                isVerified : true
            }
        });
        const slug = slugMaker(orgName);
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
            userOrganisationId : organisationData.id
        }
        res.status(200).json("User Signup Succesfull");
    }
    catch(e){
        console.error(e);
        res.status(500).json("Internal server error");
    }
}


