import { createSpecificationValidator } from '@scalar/json-schema-validator';
import { detectVersion } from './detect-version.js';
import { ERRORS } from './errors.js';
import { explainComponentReferences } from './explain-component-references.js';
import { OpenApiSpecifications } from './specifications.js';
import { validateCookieParameters } from './validate-cookie-parameters.js';
import { validatePathParameters } from './validate-path-parameters.js';
const validateDocument = createSpecificationValidator({
    schemas: OpenApiSpecifications,
    detectVersion,
    // OpenAPI 3.1 and 3.2 use the media-range format.
    formats: (version) => (version === '3.1' || version === '3.2' ? { 'media-range': true } : undefined),
    errors: { emptyOrInvalid: ERRORS.EMPTY_OR_INVALID, versionNotSupported: ERRORS.OPENAPI_VERSION_NOT_SUPPORTED },
    transformErrors: explainComponentReferences,
    // Cookie declarations can be checked without resolving references. Path-template
    // checks require a resolved document to avoid reporting referenced parameters as missing.
    postValidate: (specification, _version, options) => [
        ...(options?.checkPathParameters ? validatePathParameters(specification) : []),
        ...(options?.checkCookieParameters === false ? [] : validateCookieParameters(specification)),
    ],
});
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
export function validate(document, options) {
    return validateDocument(document, options);
}
