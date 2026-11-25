import { migrateThreeOneToThreeTwo } from './3.1-to-3.2/upgrade-from-three-one-to-three-two.js';
import { upgradeFromTwoToThree } from './2.0-to-3.0/index.js';
import { upgradeFromThreeToThreeOne } from './3.0-to-3.1/index.js';
import { cloneDocument } from './helpers/clone-document.js';
import { UpgradeIncompatibilityError } from './upgrade-incompatibility-error.js';
export function upgrade(value, targetVersion, options) {
    if (targetVersion === '3.2') {
        // Every step in the 3.2 pipeline owns the same clone, including earlier converters.
        const input = cloneDocument(value);
        const openapi30 = upgradeFromTwoToThree(input);
        const openapi31 = upgradeFromThreeToThreeOne(openapi30);
        try {
            const document = migrateThreeOneToThreeTwo(openapi31, options?.onIncompatible === 'ignore' ? 'ignore' : 'throw');
            return options?.onIncompatible === 'collect' ? { document, diagnostics: [] } : document;
        }
        catch (error) {
            if (options?.onIncompatible !== 'collect' || !(error instanceof UpgradeIncompatibilityError)) {
                throw error;
            }
            // The failed migration may have changed its private copy. Rebuild from the
            // original input so the fallback contains no partial 3.2 transformations.
            return {
                document: upgrade(cloneDocument(value), '3.1'),
                diagnostics: error.errors,
            };
        }
    }
    // Preserve the earlier targets without entering the 3.2 migration.
    const openapi30 = upgradeFromTwoToThree(value);
    return targetVersion === '3.0' ? openapi30 : upgradeFromThreeToThreeOne(openapi30);
}
