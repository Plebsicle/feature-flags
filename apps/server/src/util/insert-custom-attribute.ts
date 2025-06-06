import { DataType } from "@repo/types/attribute-config";

export const insertCustomAttributes = async (tx: any, organizationId: string, customAttributes: Array<{ name: string, type: DataType }>) => {
    if (customAttributes.length === 0) return;
    
    // Use upsert to handle duplicates gracefully
    for (const attr of customAttributes) {
        await tx.organization_attributes.upsert({
            where: {
                organization_id_attribute_name: {
                    organization_id: organizationId,
                    attribute_name: attr.name
                }
            },
            update: {
                updated_at: new Date()
            },
            create: {
                organization_id: organizationId,
                attribute_name: attr.name,
                data_type: attr.type,
                is_custom: true,
                is_required: false,
                description: `Custom attribute: ${attr.name}`
            }
        });
    }
};
