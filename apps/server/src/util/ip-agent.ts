import express from 'express'

export const extractAuditInfo = (req: express.Request) => {
    const rawIp = req.headers['x-forwarded-for'];
    const ip = Array.isArray(rawIp) ? rawIp[0].split(',')[0] : (rawIp || req.socket.remoteAddress || '').split(',')[0];
    
    const rawUserAgent = req.headers['x-user-agent'] || req.headers['user-agent'];
    const userAgent = Array.isArray(rawUserAgent) ? rawUserAgent[0] : rawUserAgent || null;
    
    return { ip, userAgent };
};