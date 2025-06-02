// 1. PERCENTAGE Rollout
interface PercentageRolloutConfig {
  percentage: number; // 0-100
}

// 2. PROGRESSIVE_ROLLOUT  
interface ProgressiveRolloutConfig {
  startPercentage: number;     // Starting percentage (e.g., 5)
  incrementPercentage: number; // Fixed increase per stage (e.g., 10)
  maxPercentage: number;       // Maximum percentage to reach (e.g., 100)
  frequency: {
    value: number;             // Frequency value (e.g., 4)
    unit: 'minutes'  | 'hours' | 'days';    // Time unit
  };
  currentStage: {
    stage: number;             // Current stage number (0-based)
    percentage: number;        // Current percentage
    nextProgressAt?: string;   // ISO timestamp for next progression
  };
}


// 3. CUSTOM_PROGRESSIVE_ROLLOUT
interface CustomProgressiveRolloutConfig {
  stages: Array<{
    stage: number;             // Stage number
    percentage: number;        // Target percentage for this stage  
    duration: {
      value: number;           // Time to wait before next stage
      unit: 'minutes'| 'hours' | 'days';
    };
  }>;
  currentStage: {
    stage: number;             // Current stage number
    percentage: number;        // Current percentage
    nextProgressAt?: string;   // ISO timestamp for next progression
  };
}

// Type union for all config types
type RolloutConfig = PercentageRolloutConfig | ProgressiveRolloutConfig | CustomProgressiveRolloutConfig;