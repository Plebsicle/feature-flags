import { DataType } from "@repo/types/attribute-config";
import { Condition } from "@repo/types/rule-config";
import { getFlagWithKillSwitches } from "../../services/redis/killSwitchCaching";
import { environment_type, PrismaClient } from "@repo/db/client";
import { RolloutConfig } from "@repo/types/rollout-config";
import { RedisCacheRules } from "../../services/redis/redis-flag";
import express from 'express'

interface UserContext {
  // Base attributes (always expected)
  email?: string;
  country?: string;
  region?: string;
  ip?: string;
  userId?: string;
  timestamp?: string; // ISO string
  
  // Custom attributes (dynamic based on your rules)
  [key: string]: any;
}

// 2. EVALUATION REQUEST STRUCTURE
interface EvaluationRequest {
  flagKey: string;
  environment: 'DEV' | 'STAGING' | 'PROD' | 'TEST';
  userContext: UserContext;
  orgSlug: string;
}

// 3. EVALUATION RESPONSE STRUCTURE
interface EvaluationResponse {
  flagKey: string;
  environment: string;
  value: any; // The actual flag value
  defaultValue: any; // Fallback value
  enabled: boolean;
  ruleMatched?: string; // Name of the rule that matched
  reason: string; // Why this value was returned
  variationId?: string; // For A/B tests
}

// 4. VALUE STRUCTURE BASED ON FLAG TYPE
function getValueStructure(flagType: string, storedValue: any): any {
  switch (flagType) {
    case 'BOOLEAN':
      return typeof storedValue === 'boolean' ? storedValue : false;
    
    case 'STRING':
      return typeof storedValue === 'string' ? storedValue : '';
    
    case 'NUMBER':
      return typeof storedValue === 'number' ? storedValue : 0;
    
    case 'JSON':
      return storedValue || {};
    
    case 'AB_TEST':
      // Expected format: { control: any, treatment: any }
      return storedValue || { control: null, treatment: null };
    
    case 'MULTIVARIATE':
      // Expected format: { variation1: any, variation2: any, ... }
      return storedValue || {};
    
    default:
      return storedValue;
  }
}

// 5. CONDITION VALIDATION LOGIC
class ConditionValidator {
  static validate(condition: Condition, userContext: UserContext): boolean {
    const { attribute_name, attribute_type, attribute_values, operator_selected } = condition;
    
    // Get the actual value from user context
    const userValue = userContext[attribute_name];
    
    // Handle missing attribute
    if (userValue === undefined || userValue === null) {
      return this.handleMissingValue(operator_selected);
    }
    
    // Validate based on attribute type and operator
    return this.evaluateCondition(userValue, attribute_type, operator_selected, attribute_values);
  }
  
  private static handleMissingValue(operator: string): boolean {
    // These operators should return true when value is missing
    const missingValueTrueOps = ['is_not_one_of', 'not_equals', 'not_contains', 'is_empty'];
    return missingValueTrueOps.includes(operator);
  }
  
  private static evaluateCondition(
    userValue: any, 
    attributeType: DataType, 
    operator: string, 
    expectedValues: any[]
  ): boolean {
    switch (attributeType) {
      case 'STRING':
        return this.evaluateStringCondition(userValue, operator, expectedValues);
      case 'NUMBER':
        return this.evaluateNumberCondition(userValue, operator, expectedValues);
      case 'BOOLEAN':
        return this.evaluateBooleanCondition(userValue, operator);
      case 'DATE':
        return this.evaluateDateCondition(userValue, operator, expectedValues);
      case 'SEMVER':
        return this.evaluateSemverCondition(userValue, operator, expectedValues);
      case 'ARRAY':
        return this.evaluateArrayCondition(userValue, operator, expectedValues);
      default:
        return false;
    }
  }
  
  private static evaluateStringCondition(value: string, operator: string, expected: any[]): boolean {
    const str = String(value).toLowerCase();
    const expectedStr = expected[0] ? String(expected[0]).toLowerCase() : '';
    
    switch (operator) {
      case 'equals': return str === expectedStr;
      case 'not_equals': return str !== expectedStr;
      case 'contains': return str.includes(expectedStr);
      case 'not_contains': return !str.includes(expectedStr);
      case 'starts_with': return str.startsWith(expectedStr);
      case 'ends_with': return str.endsWith(expectedStr);
      case 'is_one_of': return expected.map(v => String(v).toLowerCase()).includes(str);
      case 'is_not_one_of': return !expected.map(v => String(v).toLowerCase()).includes(str);
      case 'matches_regex': 
        try {
          return new RegExp(expectedStr).test(str);
        } catch {
          return false;
        }
      default: return false;
    }
  }
  
  private static evaluateNumberCondition(value: any, operator: string, expected: any[]): boolean {
    const num = Number(value);
    const expectedNum = Number(expected[0]);
    
    if (isNaN(num) || isNaN(expectedNum)) return false;
    
    switch (operator) {
      case 'equals': return num === expectedNum;
      case 'not_equals': return num !== expectedNum;
      case 'greater_than': return num > expectedNum;
      case 'greater_than_equal': return num >= expectedNum;
      case 'less_than': return num < expectedNum;
      case 'less_than_equal': return num <= expectedNum;
      case 'is_one_of': return expected.map(Number).includes(num);
      case 'is_not_one_of': return !expected.map(Number).includes(num);
      default: return false;
    }
  }
  
  private static evaluateBooleanCondition(value: any, operator: string): boolean {
    const bool = Boolean(value);
    switch (operator) {
      case 'is_true': return bool === true;
      case 'is_false': return bool === false;
      default: return false;
    }
  }
  
  private static evaluateDateCondition(value: any, operator: string, expected: any[]): boolean {
    const date = new Date(value);
    const expectedDate = new Date(expected[0]);
    
    if (isNaN(date.getTime()) || isNaN(expectedDate.getTime())) return false;
    
    switch (operator) {
      case 'equals': return date.getTime() === expectedDate.getTime();
      case 'not_equals': return date.getTime() !== expectedDate.getTime();
      case 'before': return date < expectedDate;
      case 'after': return date > expectedDate;
      case 'before_or_equal': return date <= expectedDate;
      case 'after_or_equal': return date >= expectedDate;
      case 'between':
        if (expected.length < 2) return false;
        const startDate = new Date(expected[0]);
        const endDate = new Date(expected[1]);
        return date >= startDate && date <= endDate;
      default: return false;
    }
  }
  
  private static evaluateSemverCondition(value: string, operator: string, expected: any[]): boolean {
    // Basic semver comparison (you might want to use a proper semver library)
    const parseVersion = (v: string) => v.split('.').map(Number);
    const compareVersions = (a: number[], b: number[]): number => {
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const aVal = a[i] || 0;
        const bVal = b[i] || 0;
        if (aVal !== bVal) return aVal - bVal;
      }
      return 0;
    };
    
    try {
      const userVersion = parseVersion(value);
      const expectedVersion = parseVersion(expected[0]);
      const comparison = compareVersions(userVersion, expectedVersion);
      
      switch (operator) {
        case 'equals': return comparison === 0;
        case 'not_equals': return comparison !== 0;
        case 'greater_than': return comparison > 0;
        case 'greater_than_equal': return comparison >= 0;
        case 'less_than': return comparison < 0;
        case 'less_than_equal': return comparison <= 0;
        case 'is_one_of': return expected.some(exp => compareVersions(userVersion, parseVersion(exp)) === 0);
        case 'is_not_one_of': return !expected.some(exp => compareVersions(userVersion, parseVersion(exp)) === 0);
        default: return false;
      }
    } catch {
      return false;
    }
  }
  
  private static evaluateArrayCondition(value: any, operator: string, expected: any[]): boolean {
    if (!Array.isArray(value)) return false;
    
    switch (operator) {
      case 'contains': return value.includes(expected[0]);
      case 'not_contains': return !value.includes(expected[0]);
      case 'contains_any': return expected.some(exp => value.includes(exp));
      case 'contains_all': return expected.every(exp => value.includes(exp));
      case 'has_length': return value.length === Number(expected[0]);
      case 'is_empty': return value.length === 0;
      case 'is_not_empty': return value.length > 0;
      default: return false;
    }
  }
}

// 6. ROLLOUT EVALUATION LOGIC
class RolloutEvaluator {
  static evaluate(rolloutConfig: RolloutConfig, rolloutType: string, userContext: UserContext): boolean {
    if (!rolloutConfig) return true; // No rollout = 100% enabled
    
    switch (rolloutType) {
      case 'PERCENTAGE':
        return this.evaluatePercentage(rolloutConfig, userContext);
      case 'PROGRESSIVE_ROLLOUT':
        return this.evaluateProgressive(rolloutConfig, userContext);
      case 'CUSTOM_PROGRESSIVE_ROLLOUT':
        return this.evaluateCustomProgressive(rolloutConfig, userContext);
      default:
        return true;
    }
  }
  
  private static evaluatePercentage(config: any, userContext: UserContext): boolean {
    const { percentage, startDate, endDate } = config;
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if we're within the date range
    if (now < start || now > end) return false;
    
    // Use consistent hashing based on userId
    const hash = this.getUserHash(userContext.userId || userContext.email || 'anonymous');
    return hash < percentage;
  }
  
  private static evaluateProgressive(config: any, userContext: UserContext): boolean {
    const { currentStage } = config;
    const hash = this.getUserHash(userContext.userId || userContext.email || 'anonymous');
    return hash < currentStage.percentage;
  }
  
  private static evaluateCustomProgressive(config: any, userContext: UserContext): boolean {
    const { currentStage } = config;
    const hash = this.getUserHash(userContext.userId || userContext.email || 'anonymous');
    return hash < currentStage.percentage;
  }
  
  private static getUserHash(identifier: string): number {
    // Simple hash function that returns 0-100
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }
}

// 7. MAIN EVALUATION LOGIC
class FeatureFlagEvaluator {
  static async evaluate(request: EvaluationRequest): Promise<EvaluationResponse> {
    try {
      // Step 1: Get flag and environment data from database
      const flagData = await this.getFlagData(request.flagKey, request.environment, request.orgSlug);
      
      if (!flagData || !flagData.is_active || !flagData.is_environment_active) {
        return this.createResponse(request, flagData?.default_value, 'Flag disabled or not found');
      }
      
      // Step 2: Check rules (OR between rules, AND between conditions)
      const matchedRule = await this.evaluateRules(flagData.rules, request.userContext);
      
      if (!matchedRule) {
        return this.createResponse(request, flagData.default_value, 'No rules matched');
      }
      
      // Step 3: Check rollout
      let rollout_type;
      if("percentage" in flagData.rollout_config){
        rollout_type = 'PERCENTAGE'
      }
      else if('stages' in flagData.rollout_config){
        rollout_type = 'CUSTOM_PROGRESSIVE_ROLLOUT'
      }
      else rollout_type = 'PROGRESSIVE_ROLLOUT'
      

      const rolloutPassed = RolloutEvaluator.evaluate(
        flagData.rollout_config,
        rollout_type!,
        request.userContext
      );
      
      if (!rolloutPassed) {
        return this.createResponse(request, flagData.default_value, 'Rollout percentage not met');
      }
      
      // Step 4: Return the flag value
      const value = getValueStructure(flagData.flag_type, flagData.value);
      return this.createResponse(request, value, 'Rules and rollout matched', matchedRule.name);
      
    } catch (error) {
      console.error('Flag evaluation error:', error);
      return this.createResponse(request, null, 'Evaluation error');
    }
  }
  
  private static async evaluateRules(rules: RedisCacheRules[], userContext: UserContext): Promise<RedisCacheRules | null> {
    // OR between rules - if any rule matches, return it
    for (const rule of rules) {
      if (!rule.is_enabled) continue;
      
      const conditions = rule.conditions as Condition[];
      if (!conditions || conditions.length === 0) continue;
      
      // AND between conditions within a rule
      const allConditionsMet = conditions.every(condition => 
        ConditionValidator.validate(condition, userContext)
      );
      
      if (allConditionsMet) {
        return rule; // First matching rule wins
      }
    }
    
    return null; // No rules matched
  }
  
  private static createResponse(
    request: EvaluationRequest, 
    value: any, 
    reason: string, 
    ruleName?: string
  ): EvaluationResponse {
    return {
      flagKey: request.flagKey,
      environment: request.environment,
      value: value,
      defaultValue: value,
      enabled: value !== null,
      ruleMatched: ruleName,
      reason: reason
    };
  }
  
  private static async getFlagData(flagKey: string, environment: environment_type, orgSlug: string) {
    const flagandKillSwitchData = await getFlagWithKillSwitches( orgSlug ,flagKey,environment)
    return flagandKillSwitchData.flagData;
  }
}


class FeatureFlagController{
  evaluateFeatureFlag = async (req : express.Request,res : express.Response)=>{
    try{
      // Some sort of authentication to verify it is the actual ORG
      const {flagKey,environment,userContext,orgSlug} = req.body as EvaluationRequest;
      const evaluationRequest = {
        flagKey,environment,userContext,orgSlug
      }
      const result = await FeatureFlagEvaluator.evaluate(evaluationRequest);
      res.status(200).json({success : true , result});
    }
    catch(e){
      console.error(e);
      res.status(500).json({success : false,message : "Internal Server Error"});
    }
  }
}

export const featureFlagController = new FeatureFlagController();