import type { AnyObject } from '@scalar/types/utils';
import type { ThrowOnErrorOption, ValidationOutcome } from './types.js';
export type ValidateOptions = ThrowOnErrorOption & {
    /**
     * Run the path-parameter semantic checks (declared parameters match the
     * `{template}` segments in the path, and vice versa).
     *
     * Off by default: these checks need a fully resolved document, because a path
     * parameter can be declared through a `$ref`, and this validator does not
     * resolve references — running them on an unresolved document would report
     * false positives. Callers that resolve references first (bundle or
     * dereference) can opt in; `@scalar/openapi-parser` leaves them off here and
     * runs `validatePathParameters` on the resolved document itself.
     *
     * @default false
     */
    checkPathParameters?: boolean;
    /**
     * Check OpenAPI 3.2 cookie serialization declarations.
     * Resolve references first for complete coverage.
     * @default true
     */
    checkCookieParameters?: boolean;
};
/**
 * Validates a single OpenAPI document against the OpenAPI Specification.
 *
 * Schema validation is delegated to `@scalar/json-schema-validator`; version
 * detection and parameter semantic checks are OpenAPI-specific.
 *
 * This validator is strict about the specification: every required field,
 * including `info.version`, must be present. Callers that want to be lenient
 * (as `@scalar/openapi-parser` is) should fill in defaults before validating.
 *
 * The input must be a self-contained document. This validator does not resolve
 * external `$ref`s, so bundle or dereference documents that span multiple files
 * before validating them.
 *
 * @param document - A JSON string, a YAML string, or an object.
 */
export declare function validate(document: string | AnyObject, options?: ValidateOptions): ValidationOutcome;
//# sourceMappingURL=validate.d.ts.map