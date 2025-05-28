import Redis from 'ioredis'

const REDIS_FLAG_URL = process.env.REDIS_FLAG_URL!;

const redisFlag = new Redis(REDIS_FLAG_URL,{
  retryStrategy(times) {
    const delay = Math.min(times * 100, 2000); 
    console.log(`Reconnecting to Redis... attempt #${times}, retrying in ${delay}ms`);
    return delay;
  },
});


export {redisFlag};
