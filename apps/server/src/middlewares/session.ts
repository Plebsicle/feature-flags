import {redisSession} from "../services/redis/redis-session";
import {RedisStore } from 'connect-redis'
import session, { Store } from 'express-session';

const SESSION_SECRET = process.env.REDIS_SESSION_URL!;

const redisStore = new RedisStore({
    client : redisSession,
    disableTouch : false
});



const sessionMiddleware = session({
    store: redisStore as unknown as Store,
    secret: SESSION_SECRET,
    name: "sessionId",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'PRODUCTION',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 5,
        sameSite: process.env.NODE_ENV === 'PRODUCTION' ? 'none' : 'lax',
        path: "/" 
    }
});

export {sessionMiddleware};