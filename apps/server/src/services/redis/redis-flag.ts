import Redis from 'ioredis'
import { Conditions } from '@repo/types/rule-config';
import {RolloutConfig} from "@repo/types/rollout-config"
import {flag_type,environment_type, rollout_type} from '@repo/db/client'
import prisma from '@repo/db';

const REDIS_FLAG_URL = process.env.REDIS_FLAG_URL!;

const redisFlag = new Redis(REDIS_FLAG_URL,{
  retryStrategy(times) {
    const delay = Math.min(times * 100, 2000); 
    console.log(`Reconnecting to Redis... attempt #${times}, retrying in ${delay}ms`);
    return delay;
  },
});

export interface RedisCacheRules {
  name : string,
  rule_id : string,
  conditions : Conditions,
  is_enabled : boolean
}

export interface Redis_Value {
  flagId : string,
  flag_type : flag_type
  is_active : boolean,
  environment : environment_type
  is_environment_active : boolean,
  value : Record<string,any>,
  default_value : Record<string,any>,
  rules : RedisCacheRules[],
  rollout_config : RolloutConfig
}


// Environment types enum


// TTL configuration (in seconds)
const FLAG_TTL: Record<flag_type, number> = {
  [flag_type.AB_TEST]: 900,           // 15 minutes
  [flag_type.BOOLEAN]: 1800,          // 30 minutes
  [flag_type.STRING]: 1800,           // 30 minutes
  [flag_type.NUMBER]: 1800,           // 30 minutes
  [flag_type.JSON]: 3600,             // 1 hour
  [flag_type.MULTIVARIATE]: 3600      // 1 hour
};

/**
 * Generate Redis key for flag
 */
function generateFlagKey(orgSlug: string, environment: environment_type, flagKey: string): string {
  return `flags:${orgSlug}:${environment}:${flagKey}`;
}

/**
 * Set flag value in Redis cache
 */
async function setFlag(orgSlug: string, environment: environment_type, flagKey: string, value: Redis_Value, flagType: flag_type): Promise<boolean> {
  try {
    const key = generateFlagKey(orgSlug, environment, flagKey);
    const ttl = FLAG_TTL[flagType] || FLAG_TTL[flag_type.BOOLEAN]; // Default TTL
    
    // Serialize value for storage
    const serializedValue = JSON.stringify({
      value,
      type: flagType,
      timestamp: Date.now(),
      environment
    });
    
    await redisFlag.setex(key, ttl, serializedValue);
    return true;
  } catch (error) {
    console.error('Error setting flag in cache:', error);
    return false;
  }
}

/**
 * Get flag value from Redis cache
 */
async function getFlag(orgSlug: string, environment: environment_type, flagKey: string): Promise<Redis_Value | null> {
  try {
    const key = generateFlagKey(orgSlug, environment, flagKey);
    const cachedValue = await redisFlag.get(key);
    let flagData;
    if (!cachedValue) {
      // Fall Back to DB
      const orgData = await prisma.organizations.findUnique({
        where : {
          slug : orgSlug
        },
        select : {
          id : true
        }
      });

      if(!orgData){
        return null;
      }

      const flagFromDB = await prisma.feature_flags.findUnique({
        where : {
          organization_id_key : {
            organization_id : orgData?.id,
            key : flagKey
          }
        },
        include : {
          environments : true
        }
      });
      if(!flagFromDB){
        return null;
      }

      const environments = await prisma.flag_environments.findUnique({
        where : {
          flag_id_environment : {
            flag_id : flagFromDB.id,
            environment
          }
        },
        include : {
          rules : true,
          rollout : true
        }
      });
      if(!environments){
        return null;
      }

      const rules : RedisCacheRules[] = [];
        environments.rules.forEach((rule)=>{
            rules.push({
                name : rule.name,
                rule_id : rule.id,
                conditions : rule.conditions as unknown as Conditions,
                is_enabled : rule.is_enabled
            });
        });
        if(!environments.rollout){
          return null;
        }
        const objectToPush : Redis_Value = {
            flagId : flagFromDB.id,
            flag_type : flagFromDB.flag_type,
            environment,
            is_active : flagFromDB.is_active,
            is_environment_active : environments.is_enabled,
            value : environments.value as Record<string,any>,
            default_value : environments.default_value as Record<string,any>,
            rules,
            rollout_config : environments.rollout.config as unknown as RolloutConfig
        }
        flagData = objectToPush;
        await setFlag(orgSlug,environment,flagKey,objectToPush,flagFromDB.flag_type);
    }
    else{
      console.log("Cached Value Fetched From Get Flag Function");
      let redisFetchedValue = JSON.parse(cachedValue as string);
      console.log(redisFetchedValue);
      console.log(redisFetchedValue.value);
      flagData = redisFetchedValue.value;
      console.log(flagData);
    }
    
  
    return flagData;
  } catch (error) {
    console.error('Error getting flag from cache:', error);
    return null;
  }
}

export async function removeAllOrgFlags(orgSlug: string, flagKey : string): Promise<number> {
  try {
    const pattern = `flags:${orgSlug}:*:${flagKey}`;
    const keys = await redisFlag.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    const result = await redisFlag.del(keys);
    return result;
  } catch (error) {
    console.error('Error removing all org flags from cache:', error);
    return 0;
  }
}


/**
 * Remove flag from Redis cache
 */
async function removeFlag(orgSlug: string, environment: environment_type, flagKey: string): Promise<boolean> {
  try {
    const key = generateFlagKey(orgSlug, environment, flagKey);
    const result = await redisFlag.del(key);
    return result > 0; // Returns true if key was deleted
  } catch (error) {
    console.error('Error removing flag from cache:', error);
    return false;
  }
}



/**
 * Update flag TTL without changing the value
 */
async function refreshOrSetFlagTTL(
  orgSlug: string, 
  flagKey: string, 
  flagType: flag_type, 
  flagValue: Redis_Value, 
  environment?: environment_type
): Promise<boolean> {
  try {
    const ttl = FLAG_TTL[flagType] || FLAG_TTL[flag_type.BOOLEAN];
    
    if (environment) {
      const key = generateFlagKey(orgSlug, environment, flagKey);
      // Always set/update the flag with TTL using setex
      const result = await redisFlag.setex(key, ttl, JSON.stringify(flagValue));
      return result === 'OK';
    } else {
      // Handle pattern matching for multiple environments
      const pattern = `flags:${orgSlug}:*:${flagKey}`;
      const keys = await redisFlag.keys(pattern);
      
      if (keys.length === 0) {
        // No keys found, set for all environments with the provided data
        const environments = ['DEV', 'STAGING', 'PROD', 'TEST'] as environment_type[];
        const promises = environments.map(env => {
          const envKey = generateFlagKey(orgSlug, env, flagKey);
          return redisFlag.setex(envKey, ttl, JSON.stringify(flagValue));
        });
        await Promise.all(promises);
        return true;
      }
      
      // Update all existing keys with new data
      for (const key of keys) {
        await redisFlag.setex(key, ttl, JSON.stringify(flagValue));
      }
      return true;
    }
  } catch (error) {
    console.error('Error refreshing/setting flag TTL:', error);
    return false;
  }
}




export const updateFlagRolloutRedis = async (
  orgSlug: string,
  flagKey: string,
  environment: environment_type,
  flagData: Redis_Value,
  flagType : flag_type
): Promise<number> => {
  try {
    const key = generateFlagKey(orgSlug, environment, flagKey);
    const ttl = FLAG_TTL[flagType] || FLAG_TTL[flag_type.BOOLEAN];
    // Directly set the flag data with TTL using setex
    await redisFlag.setex(key, ttl, JSON.stringify(flagData));
    return 1;
  } catch (error) {
    console.error('Rollout update failed:', error);
    return 0;
  }
};

export const updateFeatureFlagRedis = async (
  orgSlug: string,
  flagKey: string,
  environment: environment_type, 
  flagData: Redis_Value,
  flagType : flag_type
): Promise<number> => {
  try {
    const key = generateFlagKey(orgSlug,environment,flagKey);
    const ttl = FLAG_TTL[flagType] || FLAG_TTL[flag_type.BOOLEAN];
    redisFlag.setex(key,ttl,JSON.stringify(flagData));
    return 1;
  } catch (error) {
    console.error('Feature flag update failed:', error);
    return 0;
  }
};

export const updateFlagRulesRedis = async (
  orgSlug: string,
  flagKey: string,
  environment: environment_type,
  flagData: Redis_Value,
  flagType : flag_type
): Promise<number> => {
  try {
    const key = generateFlagKey(orgSlug, environment, flagKey);
    const ttl = FLAG_TTL[flagType] || FLAG_TTL[flag_type.BOOLEAN];
    // Directly set the flag data with updated rules using setex
    await redisFlag.setex(key, ttl, JSON.stringify(flagData));
    
    return 1;
  } catch (error) {
    console.error('Rule update failed:', error);
    return 0;
  }
};

export const updateEnvironmentRedis = async (
  orgSlug: string,
  flagKey: string,
  environment: environment_type,
  flagData: Redis_Value,
  flagType : flag_type
): Promise<number> => {
  try {
    const key = generateFlagKey(orgSlug, environment, flagKey);
    const ttl = FLAG_TTL[flagType] || FLAG_TTL[flag_type.BOOLEAN];
    // Directly set the flag data with updated environment status using setex
    await redisFlag.setex(key, ttl, JSON.stringify(flagData));
    
    return 1;
  } catch (error) {
    console.error('Environment update failed:', error);
    return 0;
  }
};

// Alternative: Single unified function for all updates
export const setFlagDataRedis = async (
  orgSlug: string,
  flagKey: string,
  environment: environment_type,
  flagData: Redis_Value,
  ttl: number = 3600 // Default TTL of 1 hour
): Promise<number> => {
  try {
    const key = generateFlagKey(orgSlug, environment, flagKey);
    
    // Directly set the complete flag data using setex
    await redisFlag.setex(key, ttl, JSON.stringify(flagData));
    
    return 1;
  } catch (error) {
    console.error('Flag data update failed:', error);
    return 0;
  }
};

export const deleteRuleRedis = async (orgSlug : string , flagKey : string , environment : environment_type,rule_id : string,flagType : flag_type) => {
  try{
    const key = generateFlagKey(orgSlug, environment, flagKey);
    const redisData = await redisFlag.get(key);

    if (!redisData) return 0;

    const currentValue: Redis_Value = JSON.parse(redisData);

    const ruleIndex = currentValue.rules.findIndex(r => r.rule_id === rule_id);
    if (ruleIndex === -1) return 0;

    currentValue.rules.splice(ruleIndex,1);
    const ttl = FLAG_TTL[flagType] || FLAG_TTL[flag_type.BOOLEAN]
    await redisFlag.setex(key, ttl,JSON.stringify({currentValue}));
    return 1;
  }
  catch(e){
    console.error('Rule update failed:', e);
    return 0;
  }
}

// Caching Redis Kill Switches
const killSwitchKeyGenerator =(orgSlug:string,killSwitchId : string) => {
  try{  
    return `${orgSlug}:${killSwitchId}`;
  }
  catch(e){
    console.error(e);
  }
}


export {
  flag_type,
  environment_type,
  FLAG_TTL,
  setFlag,
  getFlag,
  removeFlag,
  refreshOrSetFlagTTL,
  generateFlagKey
};


export {redisFlag};
