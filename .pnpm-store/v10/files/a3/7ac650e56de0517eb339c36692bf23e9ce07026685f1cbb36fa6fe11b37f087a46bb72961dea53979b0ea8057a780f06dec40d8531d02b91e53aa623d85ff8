import type { UnknownObject } from '@scalar/types/utils';
/** Apply the final migration to a document already owned by the upgrade pipeline. */
export declare const migrateThreeOneToThreeTwo: (document: UnknownObject, onIncompatible?: "throw" | "ignore") => UnknownObject;
/**
 * Upgrade OpenAPI 3.1.x to 3.2 without changing the input.
 *
 * Collects incompatibilities requiring an author's decision in an AggregateError
 * with a JSON pointer for each issue. External references and custom schema dialects are not validated.
 * Malformed 3.1 versions, object cycles, and excessive alias expansion throw ordinary Errors.
 */
export declare const upgradeFromThreeOneToThreeTwo: (originalDocument: UnknownObject) => UnknownObject;
//# sourceMappingURL=upgrade-from-three-one-to-three-two.d.ts.map