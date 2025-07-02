# BitSwitch SDK

A TypeScript SDK for integrating with the BitSwitch feature flag platform.

## Installation

```bash
npm install bitswitch-sdk
```

## Quick Start

```typescript
import { BitSwitchSDK } from 'bitswitch-sdk';

const sdk = new BitSwitchSDK();
```

## API Reference

### `evaluate(request: EvaluationRequest): Promise<EvaluationResponse>`

Evaluates a feature flag for a given user context.

#### EvaluationRequest

```typescript
interface EvaluationRequest {
  flagKey: string;
  environment: 'DEV' | 'STAGING' | 'PROD' | 'TEST';
  userContext: UserContext;
  orgSlug: string;
}
```

**Parameters:**
- `flagKey` (string): The unique key of the feature flag to evaluate
- `environment` (string): Target environment - must be one of: `'DEV'`, `'STAGING'`, `'PROD'`, `'TEST'`
- `userContext` (UserContext): Dynamic object containing user attributes
- `orgSlug` (string): Your organization slug

#### UserContext

```typescript
interface UserContext {
  email?: string;
  country?: string;
  region?: string;
  ip?: string;
  userId?: string;
  timestamp?: string;
  [key: string]: any;
}
```

⚠️ **Important**: The keys inside `userContext` **must exactly match** the condition names defined in the BitSwitch platform for all rules currently active in the selected environment. Any mismatch will prevent proper rule evaluation.

#### EvaluationResponse

```typescript
interface EvaluationResponse {
  flagKey: string;
  environment: string;
  value: any;
  defaultValue: any;
  enabled: boolean;
  ruleMatched?: string;
  reason: string;
  variationId?: string;
}
```

**Response Fields:**
- `flagKey`: The evaluated flag key
- `environment`: The environment that was evaluated
- `value`: The actual flag value returned
- `defaultValue`: The fallback value
- `enabled`: Whether the flag is enabled
- `ruleMatched`: Name of the rule that matched (if any)
- `reason`: Explanation of why this value was returned
- `variationId`: Variation identifier for A/B tests (if applicable)

#### Example

```typescript
const result = await sdk.evaluate({
  flagKey: 'new-checkout-flow',
  environment: 'PROD',
  userContext: {
    userId: 'user_123',
    email: 'user@example.com',
    country: 'US',
    plan: 'premium'
  },
  orgSlug: 'my-company'
});

console.log(result.value); // true/false or any configured value
console.log(result.reason); // "Rule matched: Premium Users"
```

### `collectMetric(request: MetricCollectionRequest): Promise<MetricCollectionResponse>`

Collects metrics for feature flag usage analytics.

#### MetricCollectionRequest

```typescript
interface MetricCollectionRequest {
  metric_key: string;
  orgSlug: string;
  part_rollout: boolean;
  variation_served?: string;
  event_type: MetricEventType;
  numeric_value?: number;
  conversion_step?: ConversionStepType;
}
```

**Parameters:**
- `metric_key` (string): The unique key of the metric to collect
- `orgSlug` (string): Your organization slug
- `part_rollout` (boolean): Whether this event is part of a rollout
- `variation_served` (string, optional): The variation that was served to the user
- `event_type` (MetricEventType): Type of metric event
- `numeric_value` (number, optional): Numeric value for the metric (required for `NUMERIC_VALUE` events)
- `conversion_step` (ConversionStepType, optional): Conversion step type (required for conversion events)

#### MetricEventType

```typescript
type MetricEventType = 'COUNT_INCREMENT' | 'NUMERIC_VALUE' | 'CONVERSION_ENCOUNTER' | 'CONVERSION_SUCCESS';
```

#### ConversionStepType

```typescript
type ConversionStepType = 'ENCOUNTER' | 'SUCCESS';
```

#### MetricCollectionResponse

```typescript
interface MetricCollectionResponse {
  success: boolean;
  message: string;
}
```

#### Examples

**Count Increment:**
```typescript
await sdk.collectMetric({
  metric_key: 'feature-usage',
  orgSlug: 'my-company',
  part_rollout: true,
  variation_served: 'treatment',
  event_type: 'COUNT_INCREMENT'
});
```

**Numeric Value:**
```typescript
await sdk.collectMetric({
  metric_key: 'page-load-time',
  orgSlug: 'my-company',
  part_rollout: false,
  event_type: 'NUMERIC_VALUE',
  numeric_value: 1250 // milliseconds
});
```

**Conversion Tracking:**
```typescript
// Track conversion encounter
await sdk.collectMetric({
  metric_key: 'checkout-conversion',
  orgSlug: 'my-company',
  part_rollout: true,
  variation_served: 'new-flow',
  event_type: 'CONVERSION_ENCOUNTER',
  conversion_step: 'ENCOUNTER'
});

// Track conversion success
await sdk.collectMetric({
  metric_key: 'checkout-conversion',
  orgSlug: 'my-company',
  part_rollout: true,
  variation_served: 'new-flow',
  event_type: 'CONVERSION_SUCCESS',
  conversion_step: 'SUCCESS'
});
```

## TypeScript Support

All interfaces and types are exported for use in your TypeScript projects:

```typescript
import { 
  BitSwitchSDK,
  EvaluationRequest,
  EvaluationResponse,
  MetricCollectionRequest,
  MetricCollectionResponse,
  UserContext,
  MetricEventType,
  ConversionStepType
} from 'bitswitch-sdk';
```

## Error Handling

Both methods throw errors for network issues or API errors. Wrap calls in try-catch blocks:

```typescript
try {
  const result = await sdk.evaluate(request);
  // Use result...
} catch (error) {
  console.error('Flag evaluation failed:', error.message);
  // Handle error appropriately
}
``` 