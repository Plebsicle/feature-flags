import Redis from 'ioredis'

const REDIS_SESSION_URL = process.env.REDIS_SESSION_URL!;
// console.log(REDIS_SESSION_URL);

const redisSession = new Redis(REDIS_SESSION_URL,{
  retryStrategy(times) {
    const delay = Math.min(times * 100, 2000); 
    console.log(`Reconnecting to Redis... attempt #${times}, retrying in ${delay}ms`);
    return delay;
  },
});


export  {redisSession};
