import express from 'express'

export const verificationMiddleware = (req:express.Request , res : express.Response , next : express.NextFunction) => {
    try{
        if(!req.session.user){
            res.status(401).json("Unauthorised , Signin first");
            return;
        }
        next();
    }
    catch(e){
        console.error(e);
        res.status(500).json("Internal Server Error");
    }
}