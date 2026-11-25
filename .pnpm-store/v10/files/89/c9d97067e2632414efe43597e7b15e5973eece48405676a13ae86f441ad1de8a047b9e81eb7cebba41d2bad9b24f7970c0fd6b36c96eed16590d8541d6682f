import type { AnyObject } from '@scalar/types/utils';
import type { ErrorObject, ValidationOutcome } from './types.js';
type SchemaObject = Record<string, unknown>;
/** Options every specification validator accepts. */
export type SpecificationValidatorOptions = {
    /**
     * If `true`, throw on the first error instead of returning it.
     *
     * @default false
     */
    throwOnError?: boolean;
};
/**
 * Everything a single specification (OpenAPI, AsyncAPI, …) contributes on top of
 * the shared JSON Schema engine.
 */
export type SpecificationValidatorConfig<TVersion extends string, TOptions extends SpecificationValidatorOptions> = {
    /** The JSON Schema for each supported version. */
    schemas: Record<TVersion, SchemaObject>;
    /** Detects the specification version from a parsed document. */
    detectVersion: (document: AnyObject) => TVersion | undefined;
    /** Extra Ajv formats to register for a version, compiled into its validator. */
    formats?: (version: TVersion) => Record<string, unknown> | undefined;
    /** Messages for the two failures that happen before schema validation. */
    errors: {
        /** The input is missing or is not a document. */
        emptyOrInvalid: string;
        /** The document's version is not supported. */
        versionNotSupported: string;
    };
    /** Adds specification-specific guidance to schema errors before returning or throwing them. */
    transformErrors?: (errors: ErrorObject[], specification: AnyObject) => ErrorObject[];
    /**
     * Adjusts the document before schema validation without touching the caller's
     * copy (AsyncAPI, for example, pins `asyncapi` to an exact version). The
     * original document is still what is returned as `schema` and handed to
     * `postValidate`. Defaults to validating the document as-is.
     */
    prepareDocument?: (specification: AnyObject, version: TVersion) => AnyObject;
    /**
     * Extra semantic checks run after a successful schema validation (for example
     * OpenAPI path-template rules the JSON Schema cannot express). Any returned
     * errors mark the document invalid.
     */
    postValidate?: (specification: AnyObject, version: TVersion, options: TOptions | undefined) => ErrorObject[];
};
/**
 * Builds a `validate` function for a single specification on top of the shared
 * JSON Schema engine.
 *
 * The returned function parses string input, rejects non-documents, detects the
 * version, validates against the matching schema (compiled once per version and
 * reused), and runs any specification-specific `postValidate` checks.
 */
export declare function createSpecificationValidator<TVersion extends string, TOptions extends SpecificationValidatorOptions = SpecificationValidatorOptions>(config: SpecificationValidatorConfig<TVersion, TOptions>): (document: string | AnyObject, options?: TOptions) => ValidationOutcome<TVersion>;
export {};
//# sourceMappingURL=create-specification-validator.d.ts.map