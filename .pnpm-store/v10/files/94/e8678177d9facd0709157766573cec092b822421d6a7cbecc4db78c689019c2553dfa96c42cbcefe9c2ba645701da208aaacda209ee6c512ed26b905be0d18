import type { OpenAPIV3, OpenAPIV3_1, OpenAPIV3_2 } from '@scalar/openapi-types';
import type { UnknownObject } from '@scalar/types/utils';
/** Control how compatibility issues in the OpenAPI 3.2 migration are reported. */
export type UpgradeOptions = {
    /** Defaults to throwing. Collect retains 3.1; ignore applies best-effort migrations despite incompatibilities. */
    onIncompatible: 'throw' | 'collect' | 'ignore';
};
/** A complete document and the compatibility issues that prevented upgrading it to OpenAPI 3.2. */
export type UpgradeResult = {
    /** OpenAPI 3.2 on success, or the complete OpenAPI 3.1 fallback when diagnostics are present. */
    document: OpenAPIV3_1.Document | OpenAPIV3_2.Document;
    /** All detected compatibility errors, including their JSON pointers; empty on success. */
    diagnostics: Error[];
};
/**
 * Upgrade a Swagger 2.0 or OpenAPI description to the specified target version.
 * Targeting 3.2 is strict by default. Collect mode returns compatibility diagnostics
 * with a complete 3.1 fallback instead of throwing for migration incompatibilities.
 * Ignore mode returns a best-effort 3.2 document that may change meaning or be invalid.
 */
export declare function upgrade(value: UnknownObject, targetVersion: '3.0'): OpenAPIV3.Document;
export declare function upgrade(value: UnknownObject, targetVersion: '3.1'): OpenAPIV3_1.Document;
export declare function upgrade(value: UnknownObject, targetVersion: '3.2', options?: {
    onIncompatible: 'throw' | 'ignore';
}): OpenAPIV3_2.Document;
export declare function upgrade(value: UnknownObject, targetVersion: '3.2', options: {
    onIncompatible: 'collect';
}): UpgradeResult;
export declare function upgrade(value: UnknownObject, targetVersion: '3.2', options: UpgradeOptions): OpenAPIV3_2.Document | UpgradeResult;
//# sourceMappingURL=upgrade.d.ts.map