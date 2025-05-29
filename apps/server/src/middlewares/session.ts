import {redisSession} from "../services/redis-session";
import {RedisStore } from 'connect-redis'
import session, { Store } from 'express-session';

const SESSION_SECRET = process.env.SESSION_SECRET!;

const redisStore = new RedisStore({
    client : redisSession,
    disableTouch : false
});



const sessionMiddleware = session({
    store : redisStore as unknown as Store,
    secret : SESSION_SECRET,
    name : "sessionId",
    resave : false,
    saveUninitialized : false,
    cookie : {
        secure : false,
        httpOnly : true,
        maxAge : 1000*30*60
    }
});

export {sessionMiddleware};