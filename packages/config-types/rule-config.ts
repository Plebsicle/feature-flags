// Simple condition structure for feature flag rules
import { DataType } from "./attribute-config";

interface Condition {
  attribute_name: string;           // Name of the attribute (from BASE_ATTRIBUTES or custom)
  attribute_type : DataType,
  attribute_values: any[];          // Array of values to compare against
  operator_selected: string;        // Operator from OPERATORS_BY_TYPE based on data type
}



// Conditions is always an array of condition objects
type Conditions = Condition[];

export type { Condition, Conditions };