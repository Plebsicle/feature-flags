import express from 'express'
import { hashPassword } from "../../util/hashing"
import { memberSignupValidation, signupValidation } from '../../util/zod';
import prisma from '@repo/db';
import { slugMaker } from '../../util/slug';
import verifyGoogleToken from '../../util/oauth';
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET!;

export const emailSignup = async (req: express.Request, res: express.Response)=>{
    try{
        const token = req.headers.authorization?.split(' ')[1]!;
        if(!token){
            res.status(401).json("Token is Missing in the Auth Header");
            return;
        }
        await jwt.verify(token,SECRET);
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
        const userCreation = await prisma.users.create({
            data : {
                email,
                name,
                role : "OWNER",
                password : hashedPassword
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
            userRole : userCreation.role
        }
        res.status(200).json("User Signup Succesfull");
    }
    catch(e){
        console.error(e);
        res.status(500).json("Internal server error");
    }
    
}

export const googleSignup = async (req : express.Request, res : express.Response) => {
    try{
       const token = req.headers.authorization?.split(' ')[1]!;
        if(!token){
            res.status(401).json("Token is Missing in the Auth Header");
            return;
        }
        await jwt.verify(token,SECRET);
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
            userRole : userCreation.role
        }
        res.status(200).json("User Signup Succesfull");
    }
    catch(e){
        console.error(e);
        res.status(500).json("Internal server error");
    }
}


export const memberSignup = async (req : express.Request, res : express.Response) => {
    try{
        const {token,email,name,password,orgId} = req.body;
        const validationResult = await memberSignupValidation(token,email,name,password);
        if(!validationResult){
            res.status(401).json("Incorrect Inputs");
            return;
        }
        const memberDetails = await prisma.invitations.findUnique({
            where : {
                token,
                expires_at : {
                    gte : new Date()
                },
                is_used : false
            }
        });

        if(!memberDetails){
            res.status(401).json("Expired or Used Token or Wrong Token");
            return;
        }

        const userCreation = await prisma.users.create({
            data : {
                email,
                name,
                role : memberDetails.role
            }
        });

        await prisma.user_organizations.create({
            data : {
                organization_id : orgId,
                user_id : userCreation.id,
                role : memberDetails.role
            }
        });

        const orgData = await prisma.organizations.findUnique({
            where : {
                id : orgId
            }
        });

        if(!orgData){
            res.status(401).json("Incorrect OrgId");
            return;
        }

        await prisma.owner_members.create({
            data : {
                member_id : userCreation.id,
                owner_id : orgData.owner_id
            }
        });
        req.session.user = {
            userId : userCreation.id,
            userName : name,
            userEmail : email,
            userRole : userCreation.role
        }
        res.status(200).json("Member Signup Succesfull");
    }
    catch(e){
        console.error(e);
        res.status(500).json("Internal Server Error");
    }   
}