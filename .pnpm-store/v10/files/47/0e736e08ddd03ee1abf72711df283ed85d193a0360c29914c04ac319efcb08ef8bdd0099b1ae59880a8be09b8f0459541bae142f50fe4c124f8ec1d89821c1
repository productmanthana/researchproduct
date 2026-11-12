import type { CreateValidatorOptions, ValidateOptions, ValidationResult } from './types.js';
type SchemaObject = Record<string, any>;
/**
 * Compiles a JSON Schema once and returns a reusable validator function.
 *
 * Prefer this when validating many documents against the same schema.
 *
 * Compiling happens up front, so a schema Ajv cannot compile throws from this
 * call rather than from the returned function. Use `validate` instead when a
 * schema is untrusted and an uncompilable one should come back as a result.
 */
export declare function createValidator(schema: SchemaObject, options?: CreateValidatorOptions): (document: unknown, callOptions?: ValidateOptions) => ValidationResult;
/**
 * Validates a document against a JSON Schema.
 *
 * The document can be an object, or a JSON or YAML string. Compiled schemas are
 * cached by identity, so passing the same schema object again is cheap. Because
 * of that cache, `formats` only take effect the first time a given schema object
 * is validated; reuse `createValidator` when you need per-schema formats.
 */
export declare function validate(document: unknown, schema: SchemaObject, options?: ValidateOptions & CreateValidatorOptions): ValidationResult;
export {};
//# sourceMappingURL=validate.d.ts.map