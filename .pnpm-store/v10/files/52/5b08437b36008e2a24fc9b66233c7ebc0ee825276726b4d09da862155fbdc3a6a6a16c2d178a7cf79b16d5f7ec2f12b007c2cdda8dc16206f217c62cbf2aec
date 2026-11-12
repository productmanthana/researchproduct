import { isObject } from '@scalar/helpers/object/is-object';
import { parse as parseYaml } from 'yaml';
import { createValidator } from './validate.js';
/**
 * Builds a `validate` function for a single specification on top of the shared
 * JSON Schema engine.
 *
 * The returned function parses string input, rejects non-documents, detects the
 * version, validates against the matching schema (compiled once per version and
 * reused), and runs any specification-specific `postValidate` checks.
 */
export function createSpecificationValidator(config) {
    // Core validators, compiled once per version and reused across calls.
    const validatorsByVersion = new Map();
    const getValidator = (version) => {
        let validator = validatorsByVersion.get(version);
        if (!validator) {
            validator = createValidator(config.schemas[version], { formats: config.formats?.(version) });
            validatorsByVersion.set(version, validator);
        }
        return validator;
    };
    return (document, options) => {
        let specification;
        if (typeof document === 'string') {
            // A malformed JSON/YAML string is a validation failure like any other, so
            // it respects `throwOnError` rather than escaping as a parser exception.
            try {
                specification = parseYaml(document);
            }
            catch (error) {
                if (options?.throwOnError) {
                    throw error;
                }
                return { valid: false, errors: [{ message: error instanceof Error ? error.message : String(error) }] };
            }
        }
        else {
            specification = document;
        }
        try {
            // The document is empty or invalid. A YAML/JSON string can parse to a
            // primitive or an array, neither of which is a document, so guard against
            // anything that is not a plain object rather than only null/undefined.
            if (!isObject(specification)) {
                if (options?.throwOnError) {
                    throw new Error(config.errors.emptyOrInvalid);
                }
                return { valid: false, errors: [{ message: config.errors.emptyOrInvalid }] };
            }
            const version = config.detectVersion(specification);
            if (!version) {
                if (options?.throwOnError) {
                    throw new Error(config.errors.versionNotSupported);
                }
                return { valid: false, errors: [{ message: config.errors.versionNotSupported }] };
            }
            const documentToValidate = config.prepareDocument?.(specification, version) ?? specification;
            const result = getValidator(version)(documentToValidate);
            if (!result.valid) {
                const errors = config.transformErrors?.(result.errors, documentToValidate) ?? result.errors;
                if (options?.throwOnError) {
                    throw new Error(errors[0]?.message ?? 'Validation failed');
                }
                return { valid: false, version, errors };
            }
            const semanticErrors = config.postValidate?.(specification, version, options) ?? [];
            if (semanticErrors.length > 0) {
                if (options?.throwOnError) {
                    throw new Error(semanticErrors[0]?.message ?? 'Validation failed');
                }
                return { valid: false, version, errors: semanticErrors, schema: specification };
            }
            return { valid: true, version, errors: [], schema: specification };
        }
        catch (error) {
            if (options?.throwOnError) {
                throw error;
            }
            return { valid: false, errors: [{ message: error instanceof Error ? error.message : String(error) }] };
        }
    };
}
