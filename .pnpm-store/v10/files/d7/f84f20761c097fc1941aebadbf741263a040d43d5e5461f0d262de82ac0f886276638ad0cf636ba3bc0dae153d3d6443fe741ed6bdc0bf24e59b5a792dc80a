/**
 * Turns raw Ajv validation errors into a short list of human-friendly messages.
 *
 * Ajv reports every failing branch of a schema, which for OpenAPI documents
 * (full of `oneOf`/`anyOf`) means a lot of noise. We group the errors into a
 * tree by JSON Pointer, prune the redundant ones so the most actionable message
 * wins, and then word each remaining error per keyword.
 */
/**
 * A single raw Ajv validation error.
 *
 * This is a forgiving, partial shape: Ajv attaches different fields depending on
 * the keyword, and we only read a handful of them.
 */
export type AjvError = {
    keyword: string;
    instancePath?: string;
    /** Ajv < 8 used `dataPath` instead of `instancePath`. */
    dataPath?: string;
    schemaPath?: string;
    message?: string;
    propertyName?: string;
    params?: Record<string, any>;
};
/** A prettified, human-friendly validation error. */
export type PrettyError = {
    message: string;
    path?: string;
};
/**
 * Prettifies a list of raw Ajv validation errors against the validated document.
 */
export declare function prettifyAjvErrors(document: unknown, errors: AjvError[]): PrettyError[];
//# sourceMappingURL=prettify-ajv-errors.d.ts.map