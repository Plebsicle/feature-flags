import prisma from "../db/index";

const OPERATORS_BY_TYPE = {
  STRING: [
    'equals', 'not_equals', 'contains', 'not_contains', 
    'starts_with', 'ends_with', 'is_one_of', 'is_not_one_of',
    'matches_regex'
  ],
  NUMBER: [
    'equals', 'not_equals', 'greater_than', 'greater_than_equal',
    'less_than', 'less_than_equal', 'is_one_of', 'is_not_one_of'
  ],
  BOOLEAN: [
    'is_true', 'is_false'
  ],
  DATE: [
    'equals', 'not_equals', 'before', 'after', 
    'before_or_equal', 'after_or_equal', 'between'
  ],
  SEMVER: [
    'equals', 'not_equals', 'greater_than', 'greater_than_equal',
    'less_than', 'less_than_equal', 'is_one_of', 'is_not_one_of'
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

// Custom attribute from database
export interface CustomAttribute {
  attribute_name: string;
  data_type: DataType;
  description: string | null;
  validation_rules?: any;
  is_required: boolean;
  organization_id: string;
}

// Attribute response structure
export interface AttributeInfo {
  type: DataType;
  operators: readonly Operator[];
  description: string;
  isCustom: boolean;
  validation?: any;
  required?: boolean;
}

// API response structure
export interface AttributesResponse {
  base: Record<string, AttributeInfo>;
  custom: Record<string, AttributeInfo>;
}

// Helper function
function getOperatorsByType(dataType: DataType): readonly Operator[] {
  return OPERATORS_BY_TYPE[dataType] || [];
}

// API implementation
export async function getOrgAttributes(orgId: string): Promise<AttributesResponse> {
  // Get custom attributes from DB
  const customAttributes: CustomAttribute[] = await prisma.organization_attributes.findMany({
    where: { organization_id: orgId }
  });

  // Build response
  const response: AttributesResponse = {
    base: {},
    custom: {}
  };

  // Add base attributes with their operators
  Object.entries(BASE_ATTRIBUTES).forEach(([name, config]) => {
    response.base[name] = {
      type: config.type,
      operators: getOperatorsByType(config.type),
      description: config.description,
      isCustom: false
    };
  });

  // Add custom attributes with their operators
  customAttributes.forEach(attr => {
    response.custom[attr.attribute_name] = {
      type: attr.data_type,
      operators: getOperatorsByType(attr.data_type),
      description: attr.description || '',
      validation: attr.validation_rules,
      required: attr.is_required,
      isCustom: true
    };
  });

  return response;
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