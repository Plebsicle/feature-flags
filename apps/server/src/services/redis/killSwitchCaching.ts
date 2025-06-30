import { killSwitchFlagConfig } from "@repo/types/kill-switch-flag-config";
import { environment_type } from "@repo/db/client";
import { redisFlag,getFlag,Redis_Value,generateFlagKey } from "./redis-flag";
import prisma from "@repo/db";


// Generate reverse index key for flag to kill switches mapping
const generateFlagToKillSwitchKey = (orgSlug: string, flagKey: string): string => {
  return `flag_killswitches:${orgSlug}:${flagKey}`;
};

// Generate kill switch key (keeping your existing function)
const killSwitchKeyGenerator = (orgSlug: string, killSwitchKey: string): string => {
  return `killswitch:${orgSlug}:${killSwitchKey}`;
};

export type killSwitchValue = {
  id: string,
  killSwitchKey: string,
  flag: killSwitchFlagConfig[],
  is_active: boolean
};


export const setKillSwitch = async (
  killSwitchKey: string,
  orgSlug: string,
  killSwitchData: killSwitchValue
): Promise<boolean> => {
  try {
    const key = killSwitchKeyGenerator(orgSlug, killSwitchKey);
    
    // Set the main kill switch data
    const result = await redisFlag.set(key, JSON.stringify(killSwitchData));
    
    if (result === "OK") {
      // Update reverse index for each flag this kill switch affects
      await updateReverseIndexForKillSwitch(orgSlug, killSwitchKey, killSwitchData.flag, 'ADD');
      return true;
    }
    
    return false;
  } catch (e) {
    console.error('Error setting kill switch:', e);
    return false;
  }
};

// Enhanced function to remove kill switch with reverse index cleanup
export const removeKillSwitch = async (
  killSwitchKey: string,
  orgSlug: string
): Promise<boolean> => {
  try {
    const key = killSwitchKeyGenerator(orgSlug, killSwitchKey);
    
    // Get the kill switch data first to clean up reverse index
    const existingData = await redisFlag.get(key);
    if (existingData) {
      const killSwitchData: killSwitchValue = JSON.parse(existingData);
      // Remove from reverse index
      await updateReverseIndexForKillSwitch(orgSlug, killSwitchKey, killSwitchData.flag, 'REMOVE');
    }
    
    // Remove the main kill switch data
    const result = await redisFlag.del(key);
    return result > 0;
  } catch (e) {
    console.error('Error removing kill switch:', e);
    return false;
  }
};

// Get kill switch data
export const getKillSwitch = async (
  killSwitchKey: string,
  orgSlug: string
): Promise<killSwitchValue | null> => {
  try {
    const key = killSwitchKeyGenerator(orgSlug, killSwitchKey);
    const cachedValue = await redisFlag.get(key);
    
    if (!cachedValue) {
      // Fallback to DB if not in cache
      const killSwitchFromDB = await prisma.kill_switches.findUnique({
        where: {
          organization_id_killSwitchKey: {
            organization_id: await getOrgIdFromSlug(orgSlug),
            killSwitchKey: killSwitchKey
          }
        },
        include: {
          flag_mappings: {
            include: {
              flag: true
            }
          }
        }
      });
      
      if (!killSwitchFromDB) return null;
      
      const flagConfigs: killSwitchFlagConfig[] = killSwitchFromDB.flag_mappings.map(mapping => ({
        flagKey: mapping.flag.key,
        environments: mapping.environments
      }));
      
      const killSwitchData: killSwitchValue = {
        id: killSwitchFromDB.id,
        killSwitchKey: killSwitchFromDB.killSwitchKey,
        
        flag: flagConfigs,
        is_active: killSwitchFromDB.is_active
      };
      
      // Cache the data for future use
      await setKillSwitch(killSwitchKey, orgSlug, killSwitchData);
      
      return killSwitchData;
    }
    
    return JSON.parse(cachedValue);
  } catch (e) {
    console.error('Error getting kill switch:', e);
    return null;
  }
};

// Get all kill switches that affect a specific flag
export const getKillSwitchesForFlag = async (
  orgSlug: string,
  flagKey: string
): Promise<string[]> => {
  try {
    const reverseIndexKey = generateFlagToKillSwitchKey(orgSlug, flagKey);
    const killSwitchKeys = await redisFlag.smembers(reverseIndexKey);
    return killSwitchKeys;
  } catch (e) {
    console.error('Error getting kill switches for flag:', e);
    return [];
  }
};

// Get all active kill switches data for a specific flag
export const getActiveKillSwitchesForFlag = async (
  orgSlug: string,
  flagKey: string,
  environment: environment_type
): Promise<killSwitchValue[]> => {
  try {
    const killSwitchKeys = await getKillSwitchesForFlag(orgSlug, flagKey);
    const killSwitchData: killSwitchValue[] = [];
    
    for (const killSwitchKey of killSwitchKeys) {
      const data = await getKillSwitch(killSwitchKey, orgSlug);
      if (data && data.is_active) {
        // Check if this kill switch affects the specific environment
        const affectsEnvironment = data.flag.some(flagConfig => 
          flagConfig.flagKey === flagKey && 
          (flagConfig.environments.length === 0 || flagConfig.environments.includes(environment))
        );
        
        if (affectsEnvironment) {
          killSwitchData.push(data);
        }
      }
    }
    
    return killSwitchData;
  } catch (e) {
    console.error('Error getting active kill switches for flag:', e);
    return [];
  }
};

// Helper function to update reverse index
const updateReverseIndexForKillSwitch = async (
  orgSlug: string,
  killSwitchKey: string,
  flagConfigs: killSwitchFlagConfig[],
  operation: 'ADD' | 'REMOVE'
): Promise<void> => {
  try {
    for (const flagConfig of flagConfigs) {
      const reverseIndexKey = generateFlagToKillSwitchKey(orgSlug, flagConfig.flagKey);
      
      if (operation === 'ADD') {
        await redisFlag.sadd(reverseIndexKey, killSwitchKey);
      } else {
        await redisFlag.srem(reverseIndexKey, killSwitchKey);
      }
    }
  } catch (e) {
    console.error('Error updating reverse index:', e);
  }
};

// Function to update kill switch flag mappings
export const updateKillSwitchFlagMappings = async (
  killSwitchKey: string,
  orgSlug: string,
  newFlagConfigs: killSwitchFlagConfig[]
): Promise<boolean> => {
  try {
    // Get existing kill switch data
    const existingData = await getKillSwitch(killSwitchKey, orgSlug);
    if (!existingData) return false;
    
    // Remove old reverse index entries
    await updateReverseIndexForKillSwitch(orgSlug, killSwitchKey, existingData.flag, 'REMOVE');
    
    // Update kill switch data
    const updatedData: killSwitchValue = {
      ...existingData,
      flag: newFlagConfigs
    };
    
    // Set updated data and create new reverse index entries
    return await setKillSwitch(killSwitchKey, orgSlug, updatedData);
  } catch (e) {
    console.error('Error updating kill switch flag mappings:', e);
    return false;
  }
};

// Function to activate/deactivate kill switch
export const updateKillSwitchStatus = async (
  killSwitchKey: string,
  orgSlug: string,
  isActive: boolean
): Promise<boolean> => {
  try {
    const existingData = await getKillSwitch(killSwitchKey, orgSlug);
    if (!existingData) return false;
    
    const updatedData: killSwitchValue = {
      ...existingData,
      is_active: isActive
    };
    
    const key = killSwitchKeyGenerator(orgSlug, killSwitchKey);
    const result = await redisFlag.set(key, JSON.stringify(updatedData));
    
    return result === "OK";
  } catch (e) {
    console.error('Error updating kill switch status:', e);
    return false;
  }
};

// Helper function to get organization ID from slug
const getOrgIdFromSlug = async (orgSlug: string): Promise<string> => {
  const orgData = await prisma.organizations.findUnique({
    where: { slug: orgSlug },
    select: { id: true }
  });
  
  if (!orgData) {
    throw new Error(`Organization not found for slug: ${orgSlug}`);
  }
  
  return orgData.id;
};

// Function to invalidate flag cache based on kill switch changes
export const invalidateFlagCacheForKillSwitch = async (
  orgSlug: string,
  killSwitchData: killSwitchValue
): Promise<void> => {
  try {
    for (const flagConfig of killSwitchData.flag) {
      const environments = flagConfig.environments.length > 0 
        ? flagConfig.environments 
        : [environment_type.DEV, environment_type.STAGING, environment_type.PROD, environment_type.TEST];
      
      for (const env of environments) {
        const flagKey = generateFlagKey(orgSlug, env, flagConfig.flagKey);
        await redisFlag.del(flagKey);
      }
    }
  } catch (e) {
    console.error('Error invalidating flag cache:', e);
  }
};

// Main evaluation function to get flag data with kill switch consideration
export const getFlagWithKillSwitches = async (
  orgSlug: string,
  flagKey: string,
  environment: environment_type
): Promise<{ flagData: Redis_Value | null; killSwitches: killSwitchValue[] }> => {
  try {
    // Get flag data (your existing getFlag function)
    const flagData = await getFlag(orgSlug, environment, flagKey);
    console.log("Loggin flag data from getFlagWithKillSwitches");
    console.log(flagData);
    // Get active kill switches for this flag
    const killSwitches = await getActiveKillSwitchesForFlag(orgSlug, flagKey, environment);
    
    return { flagData, killSwitches };
  } catch (e) {
    console.error('Error getting flag with kill switches:', e);
    return { flagData: null, killSwitches: [] };
  }
};