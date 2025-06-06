import { Conditions } from "@repo/types/rule-config";
import { BASE_ATTRIBUTES } from "@repo/types/attribute-config";
import { DataType } from "@repo/types/attribute-config";

export const extractCustomAttributes = (conditions: Conditions): Array<{ name: string, type: DataType }> => {
    if (!conditions || !Array.isArray(conditions)) {
        return [];
    }
    
    const customAttributes: Array<{ name: string, type: DataType }> = [];
    const baseAttributeNames = Object.keys(BASE_ATTRIBUTES);
    
    conditions.forEach(condition => {
        if (condition.attribute_name && !baseAttributeNames.includes(condition.attribute_name)) {
            customAttributes.push({
                name: condition.attribute_name,
                type: condition.attribute_type
            });
        }
    });
    
    // Remove duplicates
    const uniqueAttributes = customAttributes.filter((attr, index, self) => 
        index === self.findIndex(a => a.name === attr.name)
    );
    
    return uniqueAttributes;
};