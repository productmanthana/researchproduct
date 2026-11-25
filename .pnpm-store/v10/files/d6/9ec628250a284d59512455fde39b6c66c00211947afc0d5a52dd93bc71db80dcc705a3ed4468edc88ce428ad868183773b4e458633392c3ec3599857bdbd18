import { ClientBuilder, ClientExtraFilesBuilder, ClientFooterBuilder, ClientGeneratorsBuilder, ClientHeaderBuilder, GeneratorDependency, GeneratorVerbOptions, HonoHandlerStrategy, NormalizedOutputOptions, Tsconfig } from "@orval/core";
//#region src/index.d.ts
export declare const getHonoDependencies: () => GeneratorDependency[];
export declare const getHonoHeader: ClientHeaderBuilder;
export declare const getHonoFooter: ClientFooterBuilder;
export declare const generateHono: ClientBuilder;
/**
 * Generates or updates a handler file according to `strategy`:
 *
 * - a non-existent file is always freshly generated;
 * - `skip` leaves an existing file byte-for-byte unchanged;
 * - `full` rebuilds the preamble + validator chain and splices back user bodies
 *   (drops custom imports/middleware/helpers — the thin-handler model);
 * - `smart` non-destructively reconciles orval-owned imports + validators and
 *   appends handlers for new operations, preserving all user-authored code.
 */
export declare const generateHandlerFile: ({ verbs, path, header, validatorModule, zodModule, contextModule, strategy, tsconfig }: {
  verbs: GeneratorVerbOptions[];
  path: string;
  header: string;
  validatorModule?: string;
  zodModule: string;
  contextModule: string;
  strategy: HonoHandlerStrategy;
  tsconfig?: Tsconfig;
}) => Promise<string>;
export declare const getContext: (verbOption: GeneratorVerbOptions) => string;
/**
 * Module (or directory, when `output.schemas` names one) that the generated
 * `.context` and `.zod` files import shared schema types from.
 */
export declare const resolveDefaultSchemaModule: (output: NormalizedOutputOptions) => string;
export declare const generateExtraFiles: ClientExtraFilesBuilder;
export declare const builder: () => () => ClientGeneratorsBuilder;
//#endregion
export { builder as default };
//# sourceMappingURL=index.d.mts.map