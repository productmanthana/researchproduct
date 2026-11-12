import type { AnyObject, UnknownObject } from '@scalar/types/utils';
import type { ErrorObject, Filesystem, FilesystemEntry, ThrowOnErrorOption } from '../types/index.js';
type ResolveReferencesResult = {
    valid: boolean;
    errors: ErrorObject[];
    schema: UnknownObject;
};
export type ResolveReferencesOptions = ThrowOnErrorOption & {
    /**
     * Fired when dereferenced a schema.
     *
     * Note that for object schemas, its properties may not be dereferenced when the hook is called.
     */
    onDereference?: (data: {
        schema: AnyObject;
        ref: string;
        resolved: AnyObject;
    }) => void;
};
/**
 * Takes a specification and resolves all references.
 */
export declare function resolveReferences(input: AnyObject | Filesystem, options?: ResolveReferencesOptions, file?: FilesystemEntry, errors?: ErrorObject[]): ResolveReferencesResult;
export {};
//# sourceMappingURL=resolve-references.d.ts.map