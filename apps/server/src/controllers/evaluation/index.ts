import { DataType } from "@repo/types/attribute-config";
import { Condition } from "@repo/types/rule-config";
import { getFlagWithKillSwitches } from "../../services/redis/killSwitchCaching";
import { environment_type, flag_type, PrismaClient } from "@repo/db/client";
import { RolloutConfig } from "@repo/types/rollout-config";
import { Redis_Value, RedisCacheRules } from "../../services/redis/redis-flag";
import express from 'express'
import * as semver from 'semver'
import { evaluationRequestBodySchema, validateBody } from '../../util/zod';
import MurmurHash3  from "imurmurhash";

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
  console.log(`🔧 getValueStructure - flagType: ${flagType}, storedValue:`, storedValue);
  
  let result;
  switch (flagType) {
    case 'BOOLEAN':
      result = typeof storedValue === 'boolean' ? storedValue : false;
      break;
    
    case 'STRING':
      result = typeof storedValue === 'string' ? storedValue : '';
      break;
    
    case 'NUMBER':
      result = typeof storedValue === 'number' ? storedValue : 0;
      break;
    
    case 'JSON':
      result = storedValue || {};
      break;
    
    case 'AB_TEST':
      // Expected format: { control: any, treatment: any }
      result = storedValue || { control: null, treatment: null };
      break;
    
    case 'MULTIVARIATE':
      // Expected format: { variation1: any, variation2: any, ... }
      result = storedValue || {};
      break;
    
    default:
      result = storedValue;
      break;
  }
  
  console.log(`🔧 getValueStructure - result:`, result);
  return result;
}

// 5. CONDITION VALIDATION LOGIC
class ConditionValidator {
  static validate(condition: Condition, userContext: UserContext): boolean {
    const { attribute_name, attribute_type, attribute_values, operator_selected } = condition;
    
    console.log(`📋 ConditionValidator.validate - Starting validation for condition:`, {
      attribute_name,
      attribute_type,
      operator_selected,
      attribute_values
    });
    
    // Get the actual value from user context
    const userValue = userContext[attribute_name];
    console.log(`📋 ConditionValidator.validate - User value for '${attribute_name}':`, userValue);
    
    // Handle missing attribute
    if (userValue === undefined || userValue === null) {
      console.log(`📋 ConditionValidator.validate - Missing value detected for '${attribute_name}'`);
      const result = this.handleMissingValue(operator_selected);
      console.log(`📋 ConditionValidator.validate - Missing value result: ${result}`);
      return result;
    }
    
    // Validate based on attribute type and operator
    const result = this.evaluateCondition(userValue, attribute_type, operator_selected, attribute_values);
    console.log(`📋 ConditionValidator.validate - Final result: ${result}`);
    return result;
  }
  
  private static handleMissingValue(operator: string): boolean {
    console.log(`📋 ConditionValidator.handleMissingValue - operator: ${operator}`);
    // These operators should return true when value is missing
    const missingValueTrueOps = ['is_not_one_of', 'not_equals', 'not_contains', 'is_empty'];
    const result = missingValueTrueOps.includes(operator);
    console.log(`📋 ConditionValidator.handleMissingValue - result: ${result}`);
    return result;
  }
  
  private static evaluateCondition(
    userValue: any, 
    attributeType: DataType, 
    operator: string, 
    expectedValues: any
  ): boolean {
    console.log(`📋 ConditionValidator.evaluateCondition - Input:`, {
      userValue,
      attributeType,
      operator,
      expectedValues
    });
    
    let result = false;
    switch (attributeType) {
      case 'STRING':
        result = this.evaluateStringCondition(userValue, operator, expectedValues);
        break;
      case 'NUMBER':
        result = this.evaluateNumberCondition(userValue, operator, expectedValues);
        break;
      case 'BOOLEAN':
        result = this.evaluateBooleanCondition(userValue, operator);
        break;
      case 'DATE':
        result = this.evaluateDateCondition(userValue, operator, expectedValues);
        break;
      case 'SEMVER':
        result = this.evaluateSemverCondition(userValue, operator, expectedValues);
        break;
      case 'ARRAY':
        result = this.evaluateArrayCondition(userValue, operator, expectedValues);
        break;
      default:
        console.log(`📋 ConditionValidator.evaluateCondition - Unknown attribute type: ${attributeType}`);
        result = false;
    }
    
    console.log(`📋 ConditionValidator.evaluateCondition - Result: ${result}`);
    return result;
  }
  
  private static evaluateStringCondition(value: string, operator: string, expected: string): boolean {
    const str = String(value).toLowerCase();
    const expectedStr = expected ? String(expected).toLowerCase() : '';
    
    console.log(`📋 ConditionValidator.evaluateStringCondition - str: "${str}", operator: ${operator}, expectedStr: "${expectedStr}"`);
    
    let result = false;
    switch (operator) {
      case 'equals': result = str === expectedStr; break;
      case 'not_equals': result = str !== expectedStr; break;
      case 'contains': result = str.includes(expectedStr); break;
      case 'not_contains': result = !str.includes(expectedStr); break;
      case 'starts_with': result = str.startsWith(expectedStr); break;
      case 'ends_with': result = str.endsWith(expectedStr); break;
      case 'matches_regex': 
        try {
          result = new RegExp(expectedStr).test(str);
          console.log(`📋 ConditionValidator.evaluateStringCondition - regex test: /${expectedStr}/.test("${str}") = ${result}`);
        } catch (error) {
          console.log(`📋 ConditionValidator.evaluateStringCondition - regex error:`, error);
          result = false;
        }
        break;
      default: 
        console.log(`📋 ConditionValidator.evaluateStringCondition - Unknown operator: ${operator}`);
        result = false;
    }
    
    console.log(`📋 ConditionValidator.evaluateStringCondition - Final result: ${result}`);
    return result;
  }
  
  private static evaluateNumberCondition(value: any, operator: string, expected: number): boolean {
    const num = Number(value);
    const expectedNum = Number(expected);
    
    console.log(`📋 ConditionValidator.evaluateNumberCondition - num: ${num}, operator: ${operator}, expectedNum: ${expectedNum}`);
    
    if (isNaN(num) || isNaN(expectedNum)) {
      console.log(`📋 ConditionValidator.evaluateNumberCondition - NaN detected: num isNaN: ${isNaN(num)}, expectedNum isNaN: ${isNaN(expectedNum)}`);
      return false;
    }
    
    let result = false;
    switch (operator) {
      case 'equals': result = num === expectedNum; break;
      case 'not_equals': result = num !== expectedNum; break;
      case 'greater_than': result = num > expectedNum; break;
      case 'greater_than_equal': result = num >= expectedNum; break;
      case 'less_than': result = num < expectedNum; break;
      case 'less_than_equal': result = num <= expectedNum; break;
      default: 
        console.log(`📋 ConditionValidator.evaluateNumberCondition - Unknown operator: ${operator}`);
        result = false;
    }
    
    console.log(`📋 ConditionValidator.evaluateNumberCondition - Final result: ${result}`);
    return result;
  }
  
  private static evaluateBooleanCondition(value: boolean, operator: string): boolean {
    const bool = Boolean(value);
    console.log(`📋 ConditionValidator.evaluateBooleanCondition - bool: ${bool}, operator: ${operator}`);
    
    let result = false;
    switch (operator) {
      case 'is_true': result = bool === true; break;
      case 'is_false': result = bool === false; break;
      default: 
        console.log(`📋 ConditionValidator.evaluateBooleanCondition - Unknown operator: ${operator}`);
        result = false;
    }
    
    console.log(`📋 ConditionValidator.evaluateBooleanCondition - Final result: ${result}`);
    return result;
  }
  
  private static evaluateDateCondition(value: any, operator: string, expected: string): boolean {
  try {
    const date = new Date(value);
    const expectedDate = new Date(expected);

    console.log(`📋 ConditionValidator.evaluateDateCondition - date: ${date.toISOString()}, operator: ${operator}, expectedDate: ${expectedDate.toISOString()}`);

    if (isNaN(date.getTime()) || isNaN(expectedDate.getTime())) {
      console.warn(`⚠️ Invalid date detected - value: ${value}, expected: ${expected}`);
      return false;
    }

    let result = false;

    switch (operator) {
      case 'equals':
        result = date.getTime() === expectedDate.getTime();
        break;
      case 'not_equals':
        result = date.getTime() !== expectedDate.getTime();
        break;
      case 'before':
        result = date.getTime() < expectedDate.getTime();
        break;
      case 'after':
        result = date.getTime() > expectedDate.getTime();
        break;
      case 'before_or_equal':
        result = date.getTime() <= expectedDate.getTime();
        break;
      case 'after_or_equal':
        result = date.getTime() >= expectedDate.getTime();
        break;
      default:
        console.warn(`⚠️ Unknown operator: '${operator}'`);
        return false;
    }

    console.log(`✅ ConditionValidator.evaluateDateCondition - Final result: ${result}`);
    return result;
  } catch (err) {
    console.error(`❌ ConditionValidator.evaluateDateCondition - Error occurred:`, err);
    return false;
  }
}

  
  private static evaluateSemverCondition(value: string, operator: string, expected: string): boolean {
  console.log(`📋 evaluateSemverCondition - value: ${value}, operator: ${operator}, expected: ${expected}`);
  
  try {
    if (!semver.valid(value) || !semver.valid(expected)) {
      console.warn(`⚠️ Invalid semver value(s): value='${value}', expected='${expected}'`);
      return false;
    }

    let result = false;

    switch (operator) {
      case 'equals':
        result = semver.eq(value, expected);
        break;
      case 'not_equals':
        result = semver.neq(value, expected);
        break;
      case 'greater_than':
        result = semver.gt(value, expected);
        break;
      case 'greater_than_equal':
        result = semver.gte(value, expected);
        break;
      case 'less_than':
        result = semver.lt(value, expected);
        break;
      case 'less_than_equal':
        result = semver.lte(value, expected);
        break;
      default:
        console.warn(`⚠️ Unknown operator: '${operator}'`);
        return false;
    }

    console.log(`✅ evaluateSemverCondition - comparison result: ${result}`);
    return result;
  } catch (err) {
    console.error(`❌ evaluateSemverCondition - error occurred:`, err);
    return false;
  }
}
  
  private static evaluateArrayCondition(value: any, operator: string, expected: any[]): boolean {
    console.log(`📋 ConditionValidator.evaluateArrayCondition - value:`, value, `operator: ${operator}, expected:`, expected);
    
    if (!Array.isArray(value)) {
      console.log(`📋 ConditionValidator.evaluateArrayCondition - Value is not an array`);
      return false;
    }
    
    let result = false;
    switch (operator) {
      case 'contains_any': 
        result = expected.some(exp => value.includes(exp));
        console.log(`📋 ConditionValidator.evaluateArrayCondition - contains_any check: ${result}`);
        break;
      case 'contains_all': 
        result = expected.every(exp => value.includes(exp));
        console.log(`📋 ConditionValidator.evaluateArrayCondition - contains_all check: ${result}`);
        break;
      case 'has_length': 
        result = value.length === Number(expected[0]);
        console.log(`📋 ConditionValidator.evaluateArrayCondition - has_length check: ${value.length} === ${Number(expected[0])} = ${result}`);
        break;
      case 'is_empty': 
        result = value.length === 0;
        console.log(`📋 ConditionValidator.evaluateArrayCondition - is_empty check: length ${value.length} === 0 = ${result}`);
        break;
      case 'is_not_empty': 
        result = value.length > 0;
        console.log(`📋 ConditionValidator.evaluateArrayCondition - is_not_empty check: length ${value.length} > 0 = ${result}`);
        break;
      default: 
        console.log(`📋 ConditionValidator.evaluateArrayCondition - Unknown operator: ${operator}`);
        result = false;
    }
    
    console.log(`📋 ConditionValidator.evaluateArrayCondition - Final result: ${result}`);
    return result;
  }
}

// 6. ROLLOUT EVALUATION LOGIC
class RolloutEvaluator {
  static evaluate(rolloutConfig: RolloutConfig, rolloutType: string, userContext: UserContext,flag_type : flag_type,value : Record<string,any>): boolean {
    console.log(`🎯 RolloutEvaluator.evaluate - Starting rollout evaluation:`, {
      rolloutType,
      rolloutConfig,
      userContext: { userId: userContext.userId, email: userContext.email }
    });
    
    if (!rolloutConfig) {
      console.log(`🎯 RolloutEvaluator.evaluate - No rollout config, returning true (100% enabled)`);
      return true; // No rollout = 100% enabled
    }
    
    let result = false;
    switch (rolloutType) {
      case 'PERCENTAGE':
        result = this.evaluatePercentage(rolloutConfig, userContext,flag_type,value);
        break;
      case 'PROGRESSIVE_ROLLOUT':
        result = this.evaluateProgressive(rolloutConfig, userContext,flag_type,value);
        break;
      case 'CUSTOM_PROGRESSIVE_ROLLOUT':
        result = this.evaluateCustomProgressive(rolloutConfig, userContext,flag_type,value);
        break;
      default:
        console.log(`🎯 RolloutEvaluator.evaluate - Unknown rollout type: ${rolloutType}, defaulting to true`);
        result = true;
    }
    
    console.log(`🎯 RolloutEvaluator.evaluate - Final rollout result: ${result}`);
    return result;
  }
  
  private static evaluatePercentage(config: any, userContext: UserContext,flag_type : flag_type,value : Record<string,any>): boolean | any {
    console.log(`🎯 RolloutEvaluator.evaluatePercentage - Config:`, config);
    
    const { percentage, startDate, endDate } = config;
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    console.log(`🎯 RolloutEvaluator.evaluatePercentage - Date check: ${start} <= ${now} <= ${end}`);
    
    // Check if we're within the date range
    if (now < start || now > end) {
      console.log(`🎯 RolloutEvaluator.evaluatePercentage - Outside date range, returning false`);
      return false;
    }
    
    // Use consistent hashing based on userId
    const identifier = userContext.userId || userContext.email || 'anonymous';
    const hash = this.getUserHash(identifier);
    const result = hash < percentage;
    console.log(value.value);
    if (result && (flag_type === "AB_TEST" || flag_type === "MULTIVARIATE")) {
      console.log("ME is HITTTT");
      const entries = Object.entries(value.value);
      console.log(entries);
      const variantHashInput = identifier + JSON.stringify(value.value); 
      const hashedNumber = this.getUserHash(variantHashInput);
      const index = hashedNumber % entries.length;
      console.log(index);
      console.log(entries[index][1]);
      return entries[index];
    } 
    console.log(`🎯 RolloutEvaluator.evaluatePercentage - Hash calculation: identifier="${identifier}", hash=${hash}, percentage=${percentage}, result=${result}`);
    return result;
  }
  
  private static evaluateProgressive(config: any, userContext: UserContext,flag_type : flag_type,value : Record<string,any>): boolean | any {
    console.log(`🎯 RolloutEvaluator.evaluateProgressive - Config:`, config);
    
    const { currentStage } = config;
    const identifier = userContext.userId || userContext.email || 'anonymous';
    const hash = this.getUserHash(identifier);
    const result = hash < currentStage.percentage;
    if (result && (flag_type === "AB_TEST" || flag_type === "MULTIVARIATE")) {
      console.log("ME is HITTTT");
      const entries = Object.entries(value.value);
      console.log(entries);
      const variantHashInput = identifier + JSON.stringify(value.value); 
      const hashedNumber = this.getUserHash(variantHashInput);
      const index = hashedNumber % entries.length;
      console.log(index);
      console.log(entries[index][1]);
      return entries[index];
    } 
    console.log(`🎯 RolloutEvaluator.evaluateProgressive - Hash calculation: identifier="${identifier}", hash=${hash}, currentStage.percentage=${currentStage.percentage}, result=${result}`);
    return result;
  }
  
  private static evaluateCustomProgressive(config: any, userContext: UserContext,flag_type : flag_type,value : Record<string,any>): boolean | any {
    console.log(`🎯 RolloutEvaluator.evaluateCustomProgressive - Config:`, config);
    
    const { currentStage } = config;
    const identifier = userContext.userId || userContext.email || 'anonymous';
    const hash = this.getUserHash(identifier);
    const result = hash < currentStage.percentage;
     if (result && (flag_type === "AB_TEST" || flag_type === "MULTIVARIATE")) {
      console.log("ME is HITTTT");
      const entries = Object.entries(value.value);
      console.log(entries);
      const variantHashInput = identifier + JSON.stringify(value.value); 
      const hashedNumber = this.getUserHash(variantHashInput);
      const index = hashedNumber % entries.length;
      console.log(index);
      console.log(entries[index][1]);
      return entries[index];
    } 
    console.log(`🎯 RolloutEvaluator.evaluateCustomProgressive - Hash calculation: identifier="${identifier}", hash=${hash}, currentStage.percentage=${currentStage.percentage}, result=${result}`);
    return result;
  }
  
  private static getUserHash(identifier: string): number {
    console.log(`🎯 RolloutEvaluator.getUserHash - Input identifier: "${identifier}"`);

    const hashInstance = MurmurHash3(identifier);
    const hashValue = hashInstance.result();
    const result = hashValue % 100;

    console.log(`🎯 RolloutEvaluator.getUserHash - MurmurHash result: ${result}`);
    return result;
  }
} 

// 7. MAIN EVALUATION LOGIC
class FeatureFlagEvaluator {
  static async evaluate(request: EvaluationRequest): Promise<EvaluationResponse> {
    console.log(`🚀 FeatureFlagEvaluator.evaluate - Starting evaluation for request:`, {
      flagKey: request.flagKey,
      environment: request.environment,
      orgSlug: request.orgSlug,
      userContext: request.userContext
    });
    
    try {
      // Step 1: Get flag and environment data from database
      console.log(`🚀 Step 1: Getting flag data from database...`);
      const flagData = await this.getFlagData(request.flagKey, request.environment, request.orgSlug);
      
      console.log(`🚀 Step 1: Flag data retrieved:`, {
        flagExists: !!flagData,
        is_active: flagData?.is_active,
        is_environment_active: flagData?.is_environment_active,
        flag_type: flagData?.flag_type,
        default_value: flagData?.default_value,
        value: flagData?.value,
        rulesCount: flagData?.rules?.length || 0
      });
      
      if (!flagData || !flagData.is_active || !flagData.is_environment_active) {
        console.log(`🚀 Step 1: Flag disabled or not found, returning default`);
        return this.createResponse(request, flagData?.default_value, 'Flag disabled or not found');
      }
      
      // Step 2: Check rules (OR between rules, AND between conditions)
      console.log(`🚀 Step 2: Evaluating rules...`);
      const matchedRule = await this.evaluateRules(flagData.rules, request.userContext);
      
      if (!matchedRule) {
        console.log(`🚀 Step 2: No rules matched, returning default`);
        return this.createResponse(request, flagData.default_value, 'No rules matched');
      }
      
      console.log(`🚀 Step 2: Rule matched:`, {
        ruleName: matchedRule.name,
        ruleId: matchedRule.rule_id,
        isEnabled: matchedRule.is_enabled
      });
      
      // Step 3: Check rollout
      console.log(`🚀 Step 3: Determining rollout type...`);
      let rollout_type;
      if("percentage" in flagData.rollout_config){
        rollout_type = 'PERCENTAGE'
      }
      else if('stages' in flagData.rollout_config){
        rollout_type = 'CUSTOM_PROGRESSIVE_ROLLOUT'
      }
      else rollout_type = 'PROGRESSIVE_ROLLOUT'
      
      console.log(`🚀 Step 3: Rollout type determined: ${rollout_type}`);
      console.log(`🚀 Step 3: Rollout config:`, flagData.rollout_config);

      const rolloutPassed = RolloutEvaluator.evaluate(
        flagData.rollout_config,
        rollout_type!,
        request.userContext,
        flagData.flag_type,
        flagData.value
      );
      
      if (!rolloutPassed) {
        console.log(`🚀 Step 3: Rollout percentage not met, returning default`);
        return this.createResponse(request, flagData.default_value, 'Rollout percentage not met');
      }
      
      console.log(`🚀 Step 3: Rollout passed`);
      
      console.log(rolloutPassed);
      // Step 4: Return the flag value
      console.log(`🚀 Step 4: Processing flag value...`);
      const value = getValueStructure(flagData.flag_type, flagData.value);
      let response = null;
      if((flagData.flag_type !== "AB_TEST") &&( flagData.flag_type!== "MULTIVARIATE")){
        response = this.createResponse(request, value, 'Rules and rollout matched', matchedRule.name);
      }
      else {
        console.log(rolloutPassed);
        response = this.createResponse(request,rolloutPassed,"Rules and Rollout matched",matchedRule.name);
      }
      console.log(`🚀 Step 4: Final response:`, response);
      return response;
      
    } catch (error) {
      console.error('🚨 Flag evaluation error:', error);
      console.error('🚨 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return this.createResponse(request, null, 'Evaluation error');
    }
  }
  
  private static async evaluateRules(rules: RedisCacheRules[], userContext: UserContext): Promise<RedisCacheRules | null> {
    console.log(`🔍 FeatureFlagEvaluator.evaluateRules - Starting rule evaluation with ${rules.length} rules`);
    
    // OR between rules - if any rule matches, return it
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      console.log(`🔍 FeatureFlagEvaluator.evaluateRules - Evaluating rule ${i + 1}/${rules.length}:`, {
        ruleName: rule.name,
        ruleId: rule.rule_id,
        is_enabled: rule.is_enabled,
        conditionsCount: rule.conditions?.length || 0
      });
      
      if (!rule.is_enabled) {
        console.log(`🔍 FeatureFlagEvaluator.evaluateRules - Rule ${i + 1} is disabled, skipping`);
        continue;
      }
      
      const conditions = rule.conditions as Condition[];
      if (!conditions || conditions.length === 0) {
        console.log(`🔍 FeatureFlagEvaluator.evaluateRules - Rule ${i + 1} has no conditions, skipping`);
        continue;
      }
      
      console.log(`🔍 FeatureFlagEvaluator.evaluateRules - Rule ${i + 1} has ${conditions.length} conditions, evaluating...`);
      
      // AND between conditions within a rule
      const conditionResults = [];
      for (let j = 0; j < conditions.length; j++) {
        const condition = conditions[j];
        console.log(`🔍 FeatureFlagEvaluator.evaluateRules - Evaluating condition ${j + 1}/${conditions.length} for rule ${i + 1}`);
        
        const conditionResult = ConditionValidator.validate(condition, userContext);
        conditionResults.push(conditionResult);
        
        console.log(`🔍 FeatureFlagEvaluator.evaluateRules - Condition ${j + 1} result: ${conditionResult}`);
        
        if (!conditionResult) {
          console.log(`🔍 FeatureFlagEvaluator.evaluateRules - Condition ${j + 1} failed, rule ${i + 1} will not match`);
          break; // Early exit if any condition fails
        }
      }
      
      const allConditionsMet = conditionResults.every(result => result === true);
      console.log(`🔍 FeatureFlagEvaluator.evaluateRules - Rule ${i + 1} all conditions met: ${allConditionsMet}`, conditionResults);
      
      if (allConditionsMet) {
        console.log(`🔍 FeatureFlagEvaluator.evaluateRules - Rule ${i + 1} matched! Returning rule`);
        return rule; // First matching rule wins
      }
    }
    
    console.log(`🔍 FeatureFlagEvaluator.evaluateRules - No rules matched`);
    return null; // No rules matched
  }
  
  private static createResponse(
    request: EvaluationRequest, 
    value: any, 
    reason: string, 
    ruleName?: string
  ): EvaluationResponse {
    console.log(`📝 FeatureFlagEvaluator.createResponse - Creating response:`, {
      flagKey: request.flagKey,
      environment: request.environment,
      value,
      reason,
      ruleName,
      enabled: value !== null
    });
    
    const response = {
      flagKey: request.flagKey,
      environment: request.environment,
      value: value,
      defaultValue: value,
      enabled: value !== null,
      ruleMatched: ruleName,
      reason: reason
    };
    
    console.log(`📝 FeatureFlagEvaluator.createResponse - Final response:`, response);
    return response;
  }
  
  private static async getFlagData(flagKey: string, environment: environment_type, orgSlug: string) : Promise<Redis_Value | null> {
    console.log(`🗄️ FeatureFlagEvaluator.getFlagData - Fetching flag data:`, {
      flagKey,
      environment,
      orgSlug
    });
    
    try {
      const flagandKillSwitchData = await getFlagWithKillSwitches(orgSlug, flagKey, environment);
      console.log(`🗄️ FeatureFlagEvaluator.getFlagData - Raw data retrieved:`, {
        hasData: !!flagandKillSwitchData,
        hasFlagData: !!flagandKillSwitchData?.flagData,
        flagData: flagandKillSwitchData?.flagData
      });
      
      return flagandKillSwitchData.flagData;
    } catch (error) {
      console.error(`🗄️ FeatureFlagEvaluator.getFlagData - Error fetching flag data:`, error);
      throw error;
    }
  }
}


class FeatureFlagController{
  evaluateFeatureFlag = async (req : express.Request,res : express.Response)=>{
    console.log(`🎮 FeatureFlagController.evaluateFeatureFlag - Request received:`, {
      method: req.method,
      url: req.url,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']
      },
      body: req.body
    });
    
    try{
      // Zod validation
      console.log(`🎮 FeatureFlagController.evaluateFeatureFlag - Starting validation...`);
      const validatedBody = validateBody(evaluationRequestBodySchema, req, res);
      if (!validatedBody) {
        console.log(`🎮 FeatureFlagController.evaluateFeatureFlag - Validation failed, response already sent`);
        return;
      }
      
      console.log(`🎮 FeatureFlagController.evaluateFeatureFlag - Validation passed`);

      // Some sort of authentication to verify it is the actual ORG
      const {flagKey,environment,userContext,orgSlug} = req.body as EvaluationRequest;
      
      console.log(`🎮 FeatureFlagController.evaluateFeatureFlag - Extracted request data:`, {
        flagKey,
        environment,
        orgSlug,
        userContext
      });
      
      const evaluationRequest = {
        flagKey,environment,userContext,orgSlug
      }
      
      console.log(`🎮 FeatureFlagController.evaluateFeatureFlag - Starting flag evaluation...`);
      const result = await FeatureFlagEvaluator.evaluate(evaluationRequest);
      
      console.log(`🎮 FeatureFlagController.evaluateFeatureFlag - Evaluation completed successfully:`, result);
      
      const response = {success : true , result};
      console.log(`🎮 FeatureFlagController.evaluateFeatureFlag - Sending response:`, response);
      
      res.status(200).json(response);
    }
    catch(e){
      console.error(`🎮 FeatureFlagController.evaluateFeatureFlag - Error occurred:`, e);
      console.error(`🎮 FeatureFlagController.evaluateFeatureFlag - Error stack:`, e instanceof Error ? e.stack : 'No stack trace');
      
      const errorResponse = {success : false,message : "Internal Server Error"};
      console.log(`🎮 FeatureFlagController.evaluateFeatureFlag - Sending error response:`, errorResponse);
      
      res.status(500).json(errorResponse);
    }
  }
}

export const featureFlagController = new FeatureFlagController();