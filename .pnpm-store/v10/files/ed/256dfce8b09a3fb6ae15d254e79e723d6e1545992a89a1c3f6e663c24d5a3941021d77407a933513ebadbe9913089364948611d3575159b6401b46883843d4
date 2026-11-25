import type { UnknownObject } from '@scalar/types/utils';
import type { Filesystem, ThrowOnErrorOption, ValidateResult } from '../types/index.js';
export type ValidateOptions = ThrowOnErrorOption;
/**
 * Validates an OpenAPI document.
 *
 * Schema and semantic validation are delegated to `@scalar/openapi-validator`.
 * Reference resolution stays in the parser: references are resolved here and any
 * resolution errors are merged into the result, so the behaviour matches the
 * previous, self-contained validator.
 */
export declare function validate(value: string | UnknownObject | Filesystem, options?: ValidateOptions): Promise<ValidateResult>;
//# sourceMappingURL=validate.d.ts.map