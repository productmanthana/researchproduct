import { isObject } from '@scalar/helpers/object/is-object';
import { OpenApiVersions } from '../configuration/index.js';
/**
 * Get versions of the OpenAPI document.
 */
export function details(specification) {
    if (specification === null) {
        return {
            version: undefined,
            specificationType: undefined,
            specificationVersion: undefined,
        };
    }
    if (isObject(specification)) {
        for (const version of new Set(OpenApiVersions)) {
            const specificationType = version === '2.0' ? 'swagger' : 'openapi';
            const value = specification[specificationType];
            if (typeof value !== 'string') {
                continue;
            }
            // Match on major.minor exactly, mirroring `@scalar/openapi-validator`'s
            // version detection. A `startsWith` check would mistake a future "3.10.0"
            // for "3.1", so the parser and the validator would disagree on the version.
            const [major, minor] = value.split('.');
            if (`${major}.${minor}` === version) {
                return {
                    version: version,
                    specificationType,
                    specificationVersion: value,
                };
            }
        }
    }
    return {
        version: undefined,
        specificationType: undefined,
        specificationVersion: undefined,
    };
}
