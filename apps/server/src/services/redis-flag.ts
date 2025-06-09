import Redis from 'ioredis'
import { Conditions } from '@repo/types/rule-config';
import {RolloutConfig} from "@repo/types/rollout-config"
import {flag_type,environment_type} from '@repo/db/client'

const REDIS_FLAG_URL = process.env.REDIS_FLAG_URL!;

const redisFlag = new Redis(REDIS_FLAG_URL,{
  retryStrategy(times) {
    const delay = Math.min(times * 100, 2000); 
    console.log(`Reconnecting to Redis... attempt #${times}, retrying in ${delay}ms`);
    return delay;
  },
});

export interface RedisCacheRules {
  rule_id : string,
  conditions : Conditions,
  value : {"value" : any},
  is_enabled : boolean
}

export interface Redis_Value {
  flagId : string,
  is_active : boolean,
  rules : RedisCacheRules[],
  rollout_config : any
}


// Environment types enum
interface FlagData {
  value: any;
  type: flag_type;
  timestamp: number;
  key: string;
  orgSlug: string;
  environment: environment_type;
}

// TTL configuration (in seconds)
const FLAG_TTL: Record<flag_type, number> = {
  [flag_type.KILL_SWITCH]: 60,        // 1 minute
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
async function getFlag(orgSlug: string, environment: environment_type, flagKey: string): Promise<FlagData | null> {
  try {
    const key = generateFlagKey(orgSlug, environment, flagKey);
    const cachedValue = await redisFlag.get(key);
    
    if (!cachedValue) {
      return null;
    }
    
    const flagData = JSON.parse(cachedValue as string);
    return {
      value: flagData.value,
      type: flagData.type,
      timestamp: flagData.timestamp,
      key: flagKey,
      orgSlug,
      environment: flagData.environment || environment
    };
  } catch (error) {
    console.error('Error getting flag from cache:', error);
    return null;
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
 * Get multiple flags for an organization in a specific environment
 */
async function getMultipleFlags(orgSlug: string, environment: environment_type, flagKeys: string[]): Promise<Record<string, FlagData | null>> {
  try {
    const keys = flagKeys.map(flagKey => generateFlagKey(orgSlug, environment, flagKey));
    const values = await redisFlag.mget(keys);
    
    const result: Record<string, FlagData | null> = {};
    flagKeys.forEach((flagKey, index) => {
      if (values[index]) {
        try {
          const flagData = JSON.parse(values[index] as string);
          result[flagKey] = {
            value: flagData.value,
            type: flagData.type,
            timestamp: flagData.timestamp,
            key: flagKey,
            orgSlug,
            environment: flagData.environment || environment
          };
        } catch (parseError) {
          console.error(`Error parsing flag ${flagKey}:`, parseError);
          result[flagKey] = null;
        }
      } else {
        result[flagKey] = null;
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error getting multiple flags from cache:', error);
    return {};
  }
}

/**
 * Remove all flags for an organization in a specific environment (use with caution)
 */
async function removeAllOrgFlags(orgSlug: string, environment: environment_type): Promise<number> {
  try {
    const pattern = `flags:${orgSlug}:${environment}:*`;
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
 * Update flag TTL without changing the value
 */
async function refreshFlagTTL(orgSlug: string, flagKey: string, flagType: flag_type, environment? : environment_type): Promise<boolean> {
  try {
    const ttl = FLAG_TTL[flagType] || FLAG_TTL[flag_type.BOOLEAN];
    if(environment){
      const key = generateFlagKey(orgSlug, environment, flagKey);
      
      const result = await redisFlag.expire(key, ttl);
      return result === 1; // Returns true if expiration was set
    }
    else{
      const pattern = `flags:${orgSlug}:*${flagKey}`;
      const keys = await redisFlag.keys(pattern);
       if (keys.length === 0) return false;
      for(const key in keys){
        await redisFlag.expire(key,ttl);
      }
      return true;
    }
  } catch (error) {
    console.error('Error refreshing flag TTL:', error);
    return false;
  }
}

/**
 * Remove all flags for an organization across ALL environments (use with extreme caution)
 */
async function removeAllOrgFlagsAllEnvironments(orgSlug: string): Promise<number> {
  try {
    const pattern = `flags:${orgSlug}:*`;
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

export const updateFlagRolloutRedis = async ( orgSlug: string,
  flagKey: string,
  environment: environment_type,
  rollout_config : RolloutConfig
) => {
  try{
        const key = generateFlagKey(orgSlug, environment, flagKey);
        const redisData = await redisFlag.get(key);

        if (!redisData) return 0;
        const currentValue: Redis_Value = await JSON.parse(redisData);
        await redisFlag.set(key,JSON.stringify({
          ...currentValue,
          rollout_config
        }));

        return 1;
  }
  catch(e){
    console.error('Rollout update failed:', e);
    return 0;
  }
}

export const updateFeatureFlagRedis = async (
  orgSlug: string,
  flagKey: string,
  isActive?: boolean  // Made optional
): Promise<number> => {
  try {
    const pattern = `flags:${orgSlug}:*:${flagKey}`;
    const keys = await redisFlag.keys(pattern);

    if (keys.length === 0) return 0;

    const pipeline = redisFlag.pipeline();
    
    for (const key of keys) {
      const currentValue = await redisFlag.get(key) as unknown as Redis_Value;
      
      // Conditional update for is_active
      const updatedValue: Redis_Value = {
        ...currentValue,
        ...(isActive !== undefined && { is_active: isActive })
      };

      pipeline.set(key, JSON.stringify(updatedValue));
    }

    await pipeline.exec();
    return keys.length;
  } catch (error) {
    console.error('Feature flag update failed:', error);
    return 0;
  }
};

export const updateFlagRulesRedis = async (
  orgSlug: string,
  flagKey: string,
  environment: environment_type,
  rule_id: string,
  conditions?: Conditions,          // Made optional
  value?: { value: any },           // Made optional
  is_enabled?: boolean              // Made optional
): Promise<number> => {
  try {
    const key = generateFlagKey(orgSlug, environment, flagKey);
    const redisData = await redisFlag.get(key);

    if (!redisData) return 0;

    const currentValue: Redis_Value = JSON.parse(redisData);
    const ruleIndex = currentValue.rules.findIndex(r => r.rule_id === rule_id);

    if (ruleIndex === -1) return 0;

    // Partial updates with conditionals
    const updatedRules = currentValue.rules.map(rule => 
      rule.rule_id === rule_id ? {
        ...rule,
        ...(conditions !== undefined && { conditions }),
        ...(value !== undefined && { value }),
        ...(is_enabled !== undefined && { is_enabled })
      } : rule
    );

    await redisFlag.set(key, JSON.stringify({
      ...currentValue,
      rules: updatedRules
    }));

    return 1;
  } catch (error) {
    console.error('Rule update failed:', error);
    return 0;
  }
};

export const deleteFeatureFlagRedis =async  (orgSlug : string , flagKey : string) => {
  try{
    const pattern = `flags:${orgSlug}:*:${flagKey}`
    const keys = await redisFlag.keys(pattern);
    for(const key in keys){
      await redisFlag.del(key);
    }
    return 1;
  }
  catch(e){
    console.error('Rule update failed:', e);
    return 0;
  }
}

export const deleteRuleRedis = async (orgSlug : string , flagKey : string , environment : environment_type,rule_id : string) => {
  try{
    const key = generateFlagKey(orgSlug, environment, flagKey);
    const redisData = await redisFlag.get(key);

    if (!redisData) return 0;

    const currentValue: Redis_Value = JSON.parse(redisData);

    const ruleIndex = currentValue.rules.findIndex(r => r.rule_id === rule_id);
    if (ruleIndex === -1) return 0;

    currentValue.rules.splice(ruleIndex,1);

    await redisFlag.set(key,JSON.stringify({currentValue}));
    return 1;
  }
  catch(e){
    console.error('Rule update failed:', e);
    return 0;
  }
}


export {
  flag_type,
  environment_type,
  FLAG_TTL,
  FlagData,
  setFlag,
  getFlag,
  removeFlag,
  getMultipleFlags,
  removeAllOrgFlags,
  removeAllOrgFlagsAllEnvironments,
  refreshFlagTTL,
  generateFlagKey
};


export {redisFlag};
