import express from 'express';
import { signinValidation } from '../../util/zod';
import prisma from '@repo/db'
import { comparePassword } from '../../util/hashing';
import verifyGoogleToken from '../../util/oauth';

export const emailSignin = async (req: express.Request, res: express.Response) => {
    try{
        const {email , password} = req.body;
        const validation = await signinValidation(email,password);
        if(!validation){
            res.status(400).json("Entered details do not match criteria");
            return;
        }
        const doesUserExist = await prisma.users.findUnique({
            where : {
                email
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
        req.session.user = {userId : doesUserExist.id , userName : doesUserExist.name , userEmail : email , userRole : doesUserExist.role};
        res.status(200).json("User Signin Succesfull");
    }
    catch(e){
        console.error(e);
        res.status(500).json("Internal server error");

    }
}

export const googleSignin = async (req: express.Request, res: express.Response) => {
    try{
        
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
            }
        });
        if(!doesUserExist){
            res.status(401).json("User does not Exist");
            return;
        }
        req.session.user = {userId : doesUserExist.id , userEmail : doesUserExist.email , 
            userRole : doesUserExist.role , userName : doesUserExist.name
        }
        res.status(200).json("User Signin Succesfull");
    }
    catch(e){
        console.error(e);
        res.status(500).json("Internal server error");
    }
}