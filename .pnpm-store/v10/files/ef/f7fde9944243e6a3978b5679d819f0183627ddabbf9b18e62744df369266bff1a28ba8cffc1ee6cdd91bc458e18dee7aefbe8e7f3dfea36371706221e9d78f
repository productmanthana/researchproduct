import { upgrade as originalUpgrade } from '@scalar/openapi-upgrader';
import { details } from './details.js';
import { getEntrypoint } from './get-entrypoint.js';
import { isFilesystem } from './is-filesystem.js';
import { normalize } from './normalize.js';
/**
 * Upgrade older documents to OpenAPI 3.1 and preserve documents that are already newer.
 */
export function upgrade(value) {
    if (!value) {
        return {
            specification: null,
            version: undefined,
        };
    }
    // TODO: Run upgrade over the whole filesystem
    const document = originalUpgrade(isFilesystem(value) ? getEntrypoint(value).specification : normalize(value), '3.1');
    const { version } = details(document);
    return {
        specification: document,
        version: version === '3.1' || version === '3.2' ? version : undefined,
    };
}
