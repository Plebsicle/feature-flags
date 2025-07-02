interface UserContext {
  email?: string;
  country?: string;
  region?: string;
  ip?: string;
  userId?: string;
  timestamp?: string;
  [key: string]: any;
}

interface EvaluationRequest {
  flagKey: string;
  environment: 'DEV' | 'STAGING' | 'PROD' | 'TEST';
  userContext: UserContext;
  orgSlug: string;
}

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

type MetricEventType = 'COUNT_INCREMENT' | 'NUMERIC_VALUE' | 'CONVERSION_ENCOUNTER' | 'CONVERSION_SUCCESS';
type ConversionStepType = 'ENCOUNTER' | 'SUCCESS';

interface MetricCollectionRequest {
  metric_key: string;
  orgSlug: string;
  part_rollout: boolean;
  variation_served?: string;
  event_type: MetricEventType;
  numeric_value?: number;
  conversion_step?: ConversionStepType;
}

interface MetricCollectionResponse {
  success: boolean;
  message: string;
}

export class BitSwitchSDK {
  private backendUrl: string;

  constructor() {
    this.backendUrl = 'https://api.bitswitch.tech';
  }

  /**
   * Evaluate a feature flag for a given user context
   */
  async evaluate(request: EvaluationRequest): Promise<EvaluationResponse> {
    const url = `${this.backendUrl}/evaluation`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: EvaluationResponse = await response.json();
      return result;
    } catch (error) {
      throw new Error(`Failed to evaluate feature flag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Collect metrics for feature flag usage
   */
  async collectMetric(request: MetricCollectionRequest): Promise<MetricCollectionResponse> {
    const url = `${this.backendUrl}/metrics/collect`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: MetricCollectionResponse = await response.json();
      return result;
    } catch (error) {
      throw new Error(`Failed to collect metric: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}


export type {
  UserContext,
  EvaluationRequest,
  EvaluationResponse,
  MetricEventType,
  ConversionStepType,
  MetricCollectionRequest,
  MetricCollectionResponse
};