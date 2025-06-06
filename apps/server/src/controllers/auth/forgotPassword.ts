import express from 'express'
import tokenGenerator from '../../util/token';
import prisma from '@repo/db';
import { sendResetPassword } from '../../util/mail';
import { hashPassword } from '../../util/hashing';

export const sendVerificationEmailForgetPassword = async  (req : express.Request , res:express.Response)=>{
    try{
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
        await sendResetPassword(email,emailToken);
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


export const checkVerificationEmailForgetPassword = async (req : express.Request , res:express.Response) => {
    try{
        const {password,token} = req.body;
        const result = await prisma.emailVerificationToken.findUnique({
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
        if(!result){
            res.status(401).json('Invalid Token');
            return;
        }
        const hashedPassword = await hashPassword(password);
        const user = result.user;
        await prisma.users.update({
            where : {
                id : user.id
            },
            data : {
                password : hashedPassword
            }
        });
         res.status(200).json({
            success: true,
            message: "Password Updated Succesfully",
            data: result
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