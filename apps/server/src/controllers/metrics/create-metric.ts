import express from 'express'

export const createMetric = async (req : express.Request , res : express.Response) => {
    try{
        
    }
    catch(e){
        console.error(e);
        res.status(500).json({success : false,message : "Internal Server Error"});
    }
}