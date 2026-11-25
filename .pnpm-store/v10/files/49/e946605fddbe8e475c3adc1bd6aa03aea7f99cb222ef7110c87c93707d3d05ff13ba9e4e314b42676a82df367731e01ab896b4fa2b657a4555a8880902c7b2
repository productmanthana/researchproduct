import { ClientMockGeneratorBuilder, ContextSpec, FakerMockOptions, FinalizeMockImplementationOptions, GenerateMockImports, GeneratorImport, GeneratorOptions, GeneratorSchema, GeneratorVerbOptions, GlobalMockOptions, MswMockOptions, StrictMockSchemaKind, StrictMockSchemaKind as StrictMockSchemaKind$1 } from "@orval/core";
//#region src/faker/index.d.ts
/**
 * Emits the import header for a faker-only mock file. Faker output never
 * imports from `msw`, so this only emits `import { faker } from '@faker-js/faker'`
 * (or the locale-scoped variant) plus any operation-specific imports.
 */
export declare const generateFakerImports: GenerateMockImports;
/**
 * Generates the faker-only mock output for a single operation. This reuses
 * the response-factory portion of {@link generateMSW} and strips out the
 * handler and aggregator entries so callers can write a standalone
 * `<file>.faker.ts` with no `msw` dependency.
 */
export declare function generateFaker(generatorVerbOptions: GeneratorVerbOptions, generatorOptions: GeneratorOptions): ClientMockGeneratorBuilder;
interface GenerateFakerForSchemasResult {
  implementation: string;
  imports: GeneratorImport[];
  strictMockSchemaTypeNames?: string[];
  strictMockSchemaKinds?: Record<string, StrictMockSchemaKind>;
}
/**
 * Builds the contents of a consolidated faker mock file for every entry under
 * `components/schemas`. Each schema produces a `get<SchemaName>Mock(overrides)`
 * factory in the spirit of the existing per-operation `get<Op>ResponseMock`
 * helpers. Opt in via `mock.generators: [{ type: 'faker', schemas: true }]`.
 *
 * Returns the function bodies plus any `GeneratorImport` references the
 * factories need so the writer can hoist them into the file header.
 */
export declare function generateFakerForSchemas(schemas: GeneratorSchema[], context: ContextSpec, options: GlobalMockOptions): GenerateFakerForSchemasResult;
//#endregion
//#region src/mock-types.d.ts
export declare function buildStrictMockTypeFileHeader(schemaTypeNames: Iterable<string>, kinds?: Readonly<Record<string, StrictMockSchemaKind$1>>): string;
/**
 * Prepends shared strict-mock helper types and each `{Schema}Mock` alias once at
 * the top of a mock file. Generators pass `strictSchemaTypeNames`; no scraping.
 *
 * Not idempotent — callers must invoke this exactly once per aggregated mock
 * file (writers and `writeFakerSchemaMocks`), not from import hooks.
 */
export declare function dedupeStrictMockTypeDeclarations(implementation: string, options?: FinalizeMockImplementationOptions): string;
//#endregion
//#region src/msw/index.d.ts
export declare const generateMSWImports: GenerateMockImports;
export declare function generateMSW(generatorVerbOptions: GeneratorVerbOptions, generatorOptions: GeneratorOptions): ClientMockGeneratorBuilder;
//#endregion
//#region src/index.d.ts
export declare const DEFAULT_MSW_OPTIONS: MswMockOptions;
export declare const DEFAULT_FAKER_OPTIONS: FakerMockOptions;
/**
 * Returns the default GlobalMockOptions for a given mock type. Used when
 * normalizing user-provided entries in `output.mock.generators` so callers
 * can omit the per-type defaults.
 */
export declare const getDefaultMockOptionsForType: (type: GlobalMockOptions["type"]) => GlobalMockOptions;
/**
 * Dispatches mock-file imports generation to the appropriate generator based
 * on the `OutputMockType` discriminator on the mock options.
 */
export declare const generateMockImports: GenerateMockImports;
/**
 * Dispatches per-operation mock generation to the appropriate generator
 * based on the `OutputMockType` discriminator. Each entry in
 * `output.mock.generators` is dispatched here individually.
 */
export declare function generateMock(generatorVerbOptions: GeneratorVerbOptions, generatorOptions: Omit<GeneratorOptions, 'mock'> & {
  mock: GlobalMockOptions;
}): import("@orval/core").ClientMockGeneratorBuilder;
//#endregion
export type { GenerateFakerForSchemasResult };
//# sourceMappingURL=index.d.mts.map