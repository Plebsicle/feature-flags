/**
 * Converts request parameter from string | string[] | undefined to string | undefined
 * Handles the array case by taking the first element.
 * Does NOT throw - allows existing validation checks to handle undefined.
 * 
 * @param value - The parameter value from request (query, params, or body)
 * @param paramName - The name of the parameter (for potential future use)
 * @returns The string value or undefined
 */
export function ensureString(
    value: string | string[] | undefined,
    paramName: string
): string | undefined {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}

/**
 * Converts request parameter to a definite string.
 * Use this ONLY when you're certain the parameter exists (e.g., after Zod validation).
 * Throws if the value is undefined.
 * 
 * @param value - The parameter value from request (query, params, or body)
 * @param paramName - The name of the parameter for error messages
 * @returns The string value (never undefined)
 * @throws Error if value is undefined
 */
export function requireString(
    value: string | string[] | undefined,
    paramName: string
): string {
    if (Array.isArray(value)) {
        return value[0];
    }
    if (!value) {
        throw new Error(`${paramName} is required but was not provided`);
    }
    return value;
}

/**
 * Same as ensureString but explicitly typed for optional parameters
 */
export function ensureStringOrUndefined(
    value: string | string[] | undefined,
    paramName: string
): string | undefined {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}
