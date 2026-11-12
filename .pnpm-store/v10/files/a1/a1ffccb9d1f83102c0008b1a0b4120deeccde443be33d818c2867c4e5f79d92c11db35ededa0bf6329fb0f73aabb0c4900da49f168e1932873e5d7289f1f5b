import { ClientBuilder, ClientDependenciesBuilder, ClientGeneratorsBuilder, ClientHeaderBuilder, GeneratorImport, GeneratorOptions, GeneratorVerbOptions } from "@orval/core";
//#region src/index.d.ts
/** Returns the list of generator dependencies required by the fetch client (e.g. zod). */
export declare const getFetchDependencies: ClientDependenciesBuilder;
/**
 * Generates the URL helper function and the fetch request function for a single
 * OpenAPI operation. Handles query-param serialization (explode, arrayFormat,
 * paramsSerializer), request body encoding, response parsing, and optional
 * runtime Zod validation.
 */
export declare const generateRequestFunction: ({ queryParams, headers, operationName, typeName, response, mutator, body, props, verb, fetchReviver, formData, formUrlEncoded, override, doc, paramsSerializer, params }: GeneratorVerbOptions, { route: _route, context, pathRoute }: GeneratorOptions) => string;
/**
 * Derives the TypeScript response type name for a fetch operation.
 * Returns the operation-scoped name when `includeHttpResponseReturnType` is
 * enabled, otherwise falls back to the success response definition name.
 */
export declare const fetchResponseTypeName: (includeHttpResponseReturnType: boolean | undefined, definitionSuccessResponse: string, typeName: string) => string;
/**
 * The response-import rewrite a Zod-validated fetch response requires, together
 * with the flag telling the caller whether the emitted expression composes
 * `zod.array(...)` and so needs the `zod` namespace in scope.
 */
export interface FetchResponseValidationImports {
  /** `response.imports` rewritten for the emitted `parse`/`schema:` reference. */
  imports: GeneratorImport[];
  /** Set when the validated response is an inline array (`zod.array(Item)`). */
  composesZodArray: boolean;
}
/**
 * Resolves how a verb's response imports have to change for what
 * {@link generateRequestFunction} emits for that verb, or `undefined` when it
 * emits no Zod reference at all and the imports stay type-only.
 *
 * Exported because the fetch request function is reused verbatim by generators
 * that assemble their own import list — `@orval/query` for every non-Angular
 * framework, and `@orval/swr`. Deriving those imports independently of what
 * this module emits is what left `User.parse()` sitting next to
 * `import type { User }`, with the `UserOutput` alias naming the declared
 * response type never imported at all (#4136, #4137).
 */
export declare const getFetchResponseValidationImports: ({ response, mutator, override }: GeneratorVerbOptions, { context }: GeneratorOptions) => FetchResponseValidationImports | undefined;
/** Builds the full fetch client output (imports + implementation) for one verb. */
export declare const generateClient: ClientBuilder;
/** Emits HTTP status-code union types at the top of the generated file when they are needed. */
export declare const generateFetchHeader: ClientHeaderBuilder;
/** Returns the fetch client builder factory used by orval's plugin system. */
export declare const builder: () => () => ClientGeneratorsBuilder;
//#endregion
export { builder as default };
//# sourceMappingURL=index.d.mts.map