const OPERATORS_BY_TYPE = {
  STRING: [
    'equals', 'not_equals', 'contains', 'not_contains', 
    'starts_with', 'ends_with',
    'matches_regex'
  ],
  NUMBER: [
    'equals', 'not_equals', 'greater_than', 'greater_than_equal',
    'less_than', 'less_than_equal', 
  ],
  BOOLEAN: [
    'is_true', 'is_false'
  ],
  DATE: [
    'equals', 'not_equals', 'before', 'after', 
    'before_or_equal', 'after_or_equal'
  ],
  SEMVER: [
    'equals', 'not_equals', 'greater_than', 'greater_than_equal',
    'less_than', 'less_than_equal', 
  ],
  ARRAY: [
    'contains', 'not_contains', 'contains_any', 'contains_all',
    'has_length', 'is_empty', 'is_not_empty'
  ]
} as const;

const  BASE_ATTRIBUTES = {
  email: { type: 'STRING', description: 'User email address' },
  country: { type: 'STRING', description: 'User country code' },
  region: { type: 'STRING', description: 'User region' },
  ip: { type: 'STRING', description: 'User IP address' },
  userId: { type: 'STRING', description: 'Unique user identifier' },
  timestamp: { type: 'DATE', description: 'Request timestamp' }
} as const;

// Derived types
export type DataType = keyof typeof OPERATORS_BY_TYPE;
export type Operator = (typeof OPERATORS_BY_TYPE)[DataType][number];

// Helper function
function getOperatorsByType(dataType: DataType): readonly Operator[] {
  return OPERATORS_BY_TYPE[dataType] || [];
}

// Validation function
function validateOperator(dataType: DataType, operator: string): boolean {
  const validOperators = getOperatorsByType(dataType);
  return validOperators.includes(operator as Operator);
}

export {
  BASE_ATTRIBUTES,
  OPERATORS_BY_TYPE,
  getOperatorsByType,
  validateOperator
};