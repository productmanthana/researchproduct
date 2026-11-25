import { escapePath } from "tinyglobby";
import { CompareOperator } from "compare-versions";
import { allLocales } from "@faker-js/faker";
import { ComponentsObject, Document, EncodingObject, ExampleObject, InfoObject, MediaTypeObject, MultiTypeObject, OperationObject, ParameterObject, ParameterWithContentObject, ParameterWithSchemaObject, PathItemObject, PathsObject, PrimitiveSchemaType, ReferenceObject, RequestBodyObject, ResponseObject, ResponsesObject, SchemaObject, SchemaReferenceType, ServerObject } from "@scalar/openapi-types/3.1";
//#region src/writers/schema-output-plan.d.ts
export type SchemaRouteKey = 'default' | 'enum';
export interface SchemaOutputPlanOptions {
  basePath: string;
  schemas: GeneratorSchema[];
  routes: NonNullable<NormalizedSchemaOptions['routes']>;
  namingConvention: NamingConvention;
  fileExtension: string;
  indexFiles: boolean;
  importPath?: string;
  tsconfig?: Tsconfig;
  schemaTagMap?: ReadonlyMap<string, string>;
}
export interface SchemaOutputPlan {
  basePath: string;
  canonicalSchemas: GeneratorSchema[];
  canonicalNameByAlias: Map<string, string>;
  routeKeyByName: Map<string, SchemaRouteKey>;
  routePathByName: Map<string, string>;
  scopePathByName: Map<string, string>;
  filePathByName: Map<string, string>;
  importPathByName: Map<string, string>;
  routePathByKey: Record<SchemaRouteKey, string>;
  routeDirectories: string[];
  usesTagRouting: boolean;
  rootIndexPath?: string;
  /** Registers a schema path that is discovered after the initial plan. */
  registerSchema(name: string, route: SchemaRouteKey, scopePath?: string): string;
  /** Returns the canonical generated identifier for a schema alias. */
  canonicalNameFor(name: string): string;
  /** Computes a relative import from one planned schema to another. */
  importPathFor(importerName: string, targetName: string): string;
  /** Computes a client import path for a planned schema. */
  clientImportPath(name: string, relativeSchemasPath: string): string;
  /** Computes a package import path for a planned schema when applicable. */
  packageImportPath(name: string): string | undefined;
  /** Reports whether a name or alias is present in the plan. */
  hasSchema(name: string): boolean;
}
/** Builds the output plan used to route generated schemas and their imports. */
export declare function createSchemaOutputPlan({ basePath, schemas, routes, namingConvention, fileExtension, indexFiles, importPath, tsconfig, schemaTagMap }: SchemaOutputPlanOptions): SchemaOutputPlan;
/**
 * The plan for an output, or `undefined` when `schemas.routes` is not set.
 *
 * @remarks
 * Built once during API building and carried on `WriteSpecBuilder`, because
 * client extra files (Angular's `*.resource.ts`) are rendered before any mode
 * writer runs. Both sides therefore read one plan instead of deriving the
 * layout twice — a rule derived twice is a rule that can drift.
 *
 * Files are named from `schemaFileExtension`, like every other schema writer.
 */
export declare function createSchemaOutputPlanForOutput(schemas: GeneratorSchema[], output: NormalizedOutputOptions, schemaTagMap?: ReadonlyMap<string, string>): SchemaOutputPlan | undefined;
//#endregion
//#region src/types.d.ts
export declare const SupportedFormatter: {
  readonly PRETTIER: "prettier";
  readonly BIOME: "biome";
  readonly OXFMT: "oxfmt";
};
export type SupportedFormatter = (typeof SupportedFormatter)[keyof typeof SupportedFormatter];
export interface Options {
  output?: string | OutputOptions;
  input?: string | string[] | InputOptions;
  hooks?: Partial<HooksOptions>;
}
/** Structured payload delivered to an {@link OrvalReporter}. */
export interface OrvalReportEvent {
  message: string;
  packageName: string;
  projectName?: string;
}
/**
 * Receives generation diagnostics. Selection is ambient (via `withReporter` /
 * `setProjectName`), not part of `orval.config.ts`.
 */
export interface OrvalReporter {
  info(event: OrvalReportEvent): void;
  warn(event: OrvalReportEvent): void;
  error(event: OrvalReportEvent): void;
  verbose(event: OrvalReportEvent): void;
  debug(event: OrvalReportEvent): void;
}
/** Package-bound logger that emits {@link OrvalReportEvent}s. */
export interface OrvalLogger {
  info(message: string): void;
  warn(err: unknown, tag?: string): void;
  error(err: unknown, tag?: string): void;
  verbose(message: string): void;
  debug(message: string): void;
}
export type OptionsFn = () => Options | Promise<Options>;
export type OptionsExport = Options | Promise<Options> | OptionsFn;
export interface Config {
  /**
   * Log verbosity for every project in this file.
   *
   * Not a project name. CLI `--log-level`, `--verbose`, and `--quiet` override it.
   */
  logLevel?: LogLevel;
  [projectName: string]: OptionsExport | LogLevel | undefined;
}
export type ConfigFn = () => Config | Promise<Config>;
export type ConfigExternal = Config | Promise<Config> | ConfigFn;
export type NormalizedConfig = Record<string, NormalizedOptions | undefined>;
export interface NormalizedOptions {
  output: NormalizedOutputOptions;
  input: NormalizedInputOptions;
  hooks: NormalizedHookOptions;
}
export interface NormalizedOutputOptions {
  workspace?: string;
  workspaceExports?: WorkspaceExportsFn;
  target: string;
  schemas?: string | NormalizedSchemaOptions;
  operationSchemas?: string;
  namingConvention: NamingConvention;
  fileExtension: string;
  /**
   * File extension for schema artifacts (TS types or Zod schemas) under
   * `schemas:`. Defaults to `.zod.ts` when the output is Zod schemas
   * (`schemas: { type: 'zod' }` or `client: 'zod'` + `generateReusableSchemas`),
   * otherwise `.ts`. A user-set `output.fileExtension` always wins.
   */
  schemaFileExtension: string;
  mode: OutputMode;
  mock: NormalizedMocksConfig;
  override: NormalizedOverrideOutput;
  client: OutputClient | OutputClientFunc;
  httpClient: OutputHttpClient;
  clean: boolean | string[];
  docs: boolean | OutputDocsOptions;
  formatter?: SupportedFormatter;
  tsconfig?: Tsconfig;
  packageJson?: PackageJson;
  headers: boolean;
  indexFiles: boolean;
  baseUrl?: string | BaseUrlFromSpec | BaseUrlFromConstant | BaseUrlRuntime;
  allParamsOptional: boolean;
  urlEncodeParameters: boolean;
  unionAddMissingProperties: boolean;
  optionsParamRequired: boolean;
  propertySortOrder: PropertySortOrder;
  factoryMethods?: NormalizedFactoryMethodsOptions;
  tagsSplitDeduplication: boolean;
  commonTypesFileName: string;
}
export interface NormalizedParamsSerializerOptions {
  qs?: Record<string, unknown>;
}
/**
 * Controls how readonly properties are treated when a schema is reused as a request body.
 *
 * Best practice:
 * - `strip` (default): recommended for most OpenAPI specs, because `readOnly`
 *   properties are response-oriented and generally should not constrain request
 *   payload authoring.
 * - `preserve`: use when your schema intentionally models immutable request DTOs
 *   and you want generated request-body types to keep readonly modifiers.
 *
 * Note: this applies to request bodies regardless of the generated client style
 * (`httpClient`, `httpResource`, etc.). `httpResource` still issues request
 * payloads, so the same OpenAPI guidance applies.
 *
 * If we later want a stricter OpenAPI-aligned mode that omits `readOnly`
 * properties from request bodies entirely, that should be introduced as a new
 * explicit mode rather than overloading `preserve`.
 */
export type ReadonlyRequestBodiesMode = 'strip' | 'preserve';
export interface NormalizedOverrideOutput {
  title?: (title: string) => string;
  transformer?: OutputTransformer;
  mutator?: NormalizedMutator;
  operations: Record<string, NormalizedOperationOptions | undefined>;
  tags: Record<string, NormalizedOperationOptions | undefined>;
  mock?: OverrideMockOptions;
  contentType?: OverrideOutputContentType;
  header: false | ((info: OpenApiInfoObject) => string[] | string);
  formData: NormalizedFormDataType<NormalizedMutator>;
  formUrlEncoded: boolean | NormalizedMutator;
  paramsSerializer?: NormalizedMutator;
  paramsSerializerOptions?: NormalizedParamsSerializerOptions;
  paramsFilter?: NormalizedMutator;
  namingConvention: {
    enum?: NamingConvention;
    properties?: NamingConvention;
  };
  components: {
    schemas: {
      prefix: string;
      suffix: string;
      itemPrefix: string;
      itemSuffix: string;
    };
    responses: {
      prefix: string;
      suffix: string;
    };
    parameters: {
      prefix: string;
      suffix: string;
    };
    requestBodies: {
      prefix: string;
      suffix: string;
    };
  };
  hono: NormalizedHonoOptions;
  mcp: NormalizedMcpOptions;
  query: NormalizedQueryOptions;
  angular: NormalizedAngularOptions;
  swr: SwrOptions;
  zod: NormalizedZodOptions;
  effect: NormalizedEffectOptions;
  axios: NormalizedAxiosOptions;
  fetch: NormalizedFetchOptions;
  operationName?: (operation: OpenApiOperationObject, route: string, verb: Verbs) => string | [string, string];
  requestOptions: Record<string, unknown> | boolean;
  useDates?: boolean;
  useDatesTransform?: boolean;
  useTypeOverInterfaces?: boolean;
  useDeprecatedOperations?: boolean;
  useBigInt?: boolean;
  useNamedParameters?: boolean;
  enumGenerationType: EnumGeneration;
  suppressReadonlyModifier?: boolean;
  /**
   * Controls how readonly properties are handled for generated request-body types.
   *
   * Prefer `strip` for most OpenAPI specs because `readOnly` fields are
   * response-oriented. Use `preserve` only when your request DTOs are
   * intentionally immutable and should remain readonly in generated types.
   */
  preserveReadonlyRequestBodies?: ReadonlyRequestBodiesMode;
  /**
   * When enabled, operations with multiple request body content-types
   * (e.g. both `multipart/form-data` and `application/json`) will generate
   * separate functions for each content type instead of a single function
   * with a union type parameter.
   *
   * @example
   * // With splitByContentType: true
   * updateProfileWithFormData(body: FormDataType) => { ... }
   * updateProfileWithJson(body: JsonType) => { ... }
   *
   * // With splitByContentType: false (default)
   * updateProfile(body: FormDataType | JsonType) => { ... }
   *
   * @default false
   */
  splitByContentType: boolean;
  jsDoc: NormalizedJsDocOptions;
  aliasCombinedTypes: boolean;
  /**
   * When enabled, optional properties will be typed as `T | null` instead of just `T`.
   * @default false
   */
  useNullForOptional?: boolean;
  /**
   * When enabled, the zod schema of the response is passed to the custom
   * mutator as an extra `schema` option, so the mutator can validate the
   * response itself.
   *
   * Requires `schemas: { type: 'zod' }` and runtime validation enabled for the
   * client (e.g. `override.fetch.runtimeValidation`).
   *
   * @default false
   */
  includeZodSchemaInArguments: boolean;
}
export interface NormalizedMutator {
  path: string;
  resolvedPath?: string;
  name?: string;
  default: boolean;
  alias?: Record<string, string>;
  external?: string[];
  extension?: string;
  useHooks?: boolean;
  inferred?: boolean;
}
export interface NormalizedOperationOptions {
  transformer?: OutputTransformer;
  mutator?: NormalizedMutator;
  mock?: {
    data?: MockData;
    properties?: MockProperties;
  };
  contentType?: OverrideOutputContentType;
  query?: NormalizedQueryOptions;
  angular?: NormalizedAngularOptions;
  swr?: SwrOptions;
  zod?: NormalizedOperationZodOptions;
  effect?: NormalizedEffectOptions;
  operationName?: (operation: OpenApiOperationObject, route: string, verb: Verbs) => string | [string, string];
  axios?: AxiosOptions;
  fetch?: FetchOptions;
  formData?: NormalizedFormDataType<NormalizedMutator>;
  formUrlEncoded?: boolean | NormalizedMutator;
  paramsSerializer?: NormalizedMutator;
  paramsFilter?: NormalizedMutator;
  requestOptions?: object | boolean;
}
export type ExternalRefNamingStrategy = 'default' | 'always';
export interface InputParserOptions {
  headers?: {
    domains: string[];
    headers: Record<string, string>;
  }[];
  /**
   * Optional Scalar bundler callback used to create external document keys.
   */
  compress?: (value: string) => Promise<string> | string;
  externalRefs?: {
    /**
     * External `$ref` document targets to allow. Each entry should be the
     * document part of the `$ref` (without the `#/...` fragment). File paths
     * are relative to the spec file. Use `['*']` to allow all external refs.
     *
     * @default []
     */
    allow?: string[];
    /**
     * Controls how schemas imported from external documents are named.
     *
     * @default 'default'
     */
    strategy?: ExternalRefNamingStrategy;
  };
}
export interface NormalizedInputOptions {
  target: string | OpenApiDocument;
  override: OverrideInput;
  unsafeDisableValidation: boolean;
  filters?: InputFiltersOptions;
  parserOptions?: InputParserOptions;
}
export type OutputClientFunc = (clients: GeneratorClients) => ClientGeneratorsBuilder;
/**
 * A server URL variable whose value is a runtime JavaScript expression
 * (e.g. `process.env.API_TOKEN`) instead of a static string. The expression
 * is embedded as a `${...}` interpolation in the generated URL template
 * literal, so the value is resolved at request time (#3734).
 */
export interface VariableRuntimeValue {
  runtime: string;
}
export interface BaseUrlFromSpec {
  getBaseUrlFromSpecification: true;
  variables?: Record<string, string | VariableRuntimeValue>;
  index?: number;
  baseUrl?: never;
}
export interface BaseUrlFromConstant {
  getBaseUrlFromSpecification: false;
  variables?: never;
  index?: never;
  baseUrl: string;
}
/**
 * Embed a runtime JavaScript expression into generated URL template literals
 * (e.g. `process.env.API_BASE_URL`) so the same build can target different hosts at runtime.
 */
export interface BaseUrlRuntime {
  runtime: string;
  /** Named imports for symbols used in `runtime` (e.g. `{ name: 'apiBase', importPath: '../config' }`). */
  imports?: GeneratorImport[];
  getBaseUrlFromSpecification?: never;
  baseUrl?: never;
}
/**
 * Opt-in config for `override.angular.baseUrl`: composes a runtime base URL
 * for a generated Angular output via Angular DI (an `InjectionToken`) rather
 * than baking a static prefix into every route at generation time.
 *
 * Angular-client only; mutually exclusive with the top-level `output.baseUrl`
 * (which bakes a prefix into every generated route string for ALL clients).
 * `apiId` is required and explicit — never derived from the spec — so the
 * generated identifiers (`<API_ID>_BASE_URL`, `provide<Api>BaseUrl`, ...) are
 * stable across regenerations and collision-free when multiple outputs are
 * generated into the same app.
 */
export interface AngularBaseUrlOptions {
  /** Explicit, stable identifier for this API, used to derive all generated DI token/helper names. Must match `/^[A-Za-z][A-Za-z0-9_-]*$/`. */
  apiId: string;
  /** Index into the specification's `servers` array to embed as the default fallback URL. Defaults to `0`. */
  index?: number;
  /** Values for any `{variable}` placeholders in the selected server URL. */
  variables?: Record<string, string | VariableRuntimeValue>;
}
export declare const PropertySortOrder: {
  readonly ALPHABETICAL: "Alphabetical";
  readonly SPECIFICATION: "Specification";
};
export type PropertySortOrder = (typeof PropertySortOrder)[keyof typeof PropertySortOrder];
export declare const NamingConvention: {
  readonly CAMEL_CASE: "camelCase";
  readonly PASCAL_CASE: "PascalCase";
  readonly SNAKE_CASE: "snake_case";
  readonly KEBAB_CASE: "kebab-case";
};
export type NamingConvention = (typeof NamingConvention)[keyof typeof NamingConvention];
export declare const EnumGeneration: {
  readonly CONST: "const";
  readonly ENUM: "enum";
  readonly UNION: "union";
};
export type EnumGeneration = (typeof EnumGeneration)[keyof typeof EnumGeneration];
export type SchemaGenerationType = 'typescript' | 'zod';
export type GeneratedSchemaKind = 'enum' | 'schema';
export type FactoryMethodsMode = 'single' | 'split' | 'single-split';
export interface FactoryMethodsOptions {
  functionNamePrefix?: string;
  mode?: FactoryMethodsMode;
  outputDirectory?: string;
  includeOptionalProperty?: boolean;
}
export interface NormalizedFactoryMethodsOptions {
  functionNamePrefix: string;
  mode: FactoryMethodsMode;
  outputDirectory: string;
  includeOptionalProperty: boolean;
}
export interface SchemaOptions {
  /**
   * Output path for schemas. A directory in split mode; in `mode: 'single'`
   * the path may name the schema module file directly.
   */
  path: string;
  /**
   * `'single'` writes every schema (TypeScript types or Zod schemas) to one
   * module — `<path>/index<schemaFileExtension>`, or `path` itself when it
   * names a file — instead of one file per schema. Independent of
   * `output.mode`, which only arranges client files.
   *
   * @default 'split'
   */
  mode?: 'split' | 'single';
  type?: SchemaGenerationType;
  importPath?: string;
  routes?: SchemaRouteOptions;
  /**
   * When `true`, schemas are organized into per-tag subdirectories instead of
   * a single flat directory. Schemas referenced by multiple tags remain at the
   * root of the schema directory.
   *
   * @default false
   */
  splitByTags?: boolean;
}
export interface SchemaRouteOptions {
  default: string;
  enum?: string;
}
export interface NormalizedSchemaOptions {
  path: string;
  mode?: 'split' | 'single';
  type: SchemaGenerationType;
  importPath?: string;
  splitByTags: boolean;
  routes?: SchemaRouteOptions;
}
/**
 * Receives the relative module specifiers Orval would re-export from the
 * workspace `index.ts` (e.g. `'./endpoints'`, `'./model'`) and returns the
 * specifiers to write instead. Use it to drop generated exports or to append
 * exports for your own files.
 */
export type WorkspaceExportsFn = (exports: string[]) => string[];
export interface OutputOptions {
  workspace?: string;
  /** Filter or extend the exports written to the workspace `index.ts`. */
  workspaceExports?: WorkspaceExportsFn;
  target: string;
  schemas?: string | SchemaOptions | false;
  /**
   * Separate path for operation-derived types (params, bodies, responses).
   * When set, types matching operation patterns (e.g., *Params, *Body) are written here
   * while regular schema types remain in the `schemas` path.
   */
  operationSchemas?: string;
  namingConvention?: NamingConvention;
  fileExtension?: string;
  /**
   * Optional file extension applied only to schema artifacts (TS types or
   * Zod schemas), under `schemas:` or in the `<target>.schemas` file written
   * without it. Takes precedence over `fileExtension` for schema files. Defaults to `.zod.ts` when the output is Zod schemas
   * (`schemas: { type: 'zod' }` or `client: 'zod'` + `generateReusableSchemas`),
   * otherwise mirrors `fileExtension`.
   */
  schemaFileExtension?: string;
  mode?: OutputMode;
  mock?: OutputMocksOption;
  override?: OverrideOutput;
  client?: OutputClient | OutputClientFunc;
  httpClient?: OutputHttpClient;
  clean?: boolean | string[];
  docs?: boolean | OutputDocsOptions;
  formatter?: SupportedFormatter;
  tsconfig?: string | Tsconfig;
  packageJson?: string;
  headers?: boolean;
  indexFiles?: boolean;
  baseUrl?: string | BaseUrlFromSpec | BaseUrlFromConstant | BaseUrlRuntime;
  allParamsOptional?: boolean;
  urlEncodeParameters?: boolean;
  unionAddMissingProperties?: boolean;
  optionsParamRequired?: boolean;
  propertySortOrder?: PropertySortOrder;
  factoryMethods?: FactoryMethodsOptions;
  tagsSplitDeduplication?: boolean;
  commonTypesFileName?: string;
}
export interface InputFiltersOptions {
  mode?: 'include' | 'exclude';
  tags?: (string | RegExp)[];
  schemas?: (string | RegExp)[];
  /**
   * When `tags` is set, orval limits the output to only the schemas referenced
   * by the matching operations. Set this to `true` to keep every
   * `#/components/schemas` entry (including unreferenced ones) while still
   * filtering endpoints by `tags`. The other component sections (`responses`,
   * `parameters`, `requestBodies`) remain pruned to what the matching
   * operations use. Ignored when `schemas` is set.
   *
   * @default false
   */
  includeUnreferencedSchemas?: boolean;
}
export interface InputOptions {
  target: string | string[] | Record<string, unknown> | OpenApiDocument;
  override?: OverrideInput;
  /**
   * Disable OpenAPI spec validation.
   *
   * **Use at your own risk** — code generation with invalid specs is not guaranteed
   * to work and may break in minor updates. Bug reports with validation disabled are
   * not accepted.
   *
   * @default false
   */
  unsafeDisableValidation?: boolean;
  filters?: InputFiltersOptions;
  parserOptions?: InputParserOptions;
}
export declare const OutputClient: {
  readonly ANGULAR: "angular";
  readonly ANGULAR_QUERY: "angular-query";
  readonly AXIOS: "axios";
  readonly AXIOS_FUNCTIONS: "axios-functions";
  readonly REACT_QUERY: "react-query";
  readonly SOLID_START: "solid-start";
  readonly SOLID_QUERY: "solid-query";
  readonly SVELTE_QUERY: "svelte-query";
  readonly VUE_QUERY: "vue-query";
  readonly SWR: "swr";
  readonly PINIA_COLADA: "pinia-colada";
  readonly ZOD: "zod";
  readonly EFFECT: "effect";
  readonly HONO: "hono";
  readonly FETCH: "fetch";
  readonly MCP: "mcp";
};
export type OutputClient = (typeof OutputClient)[keyof typeof OutputClient];
export declare const OutputHttpClient: {
  readonly AXIOS: "axios";
  readonly FETCH: "fetch";
  readonly ANGULAR: "angular";
};
export type OutputHttpClient = (typeof OutputHttpClient)[keyof typeof OutputHttpClient];
export declare const OutputMode: {
  readonly SINGLE: "single";
  readonly SPLIT: "split";
  readonly TAGS: "tags";
  readonly TAGS_SPLIT: "tags-split";
  readonly TAGS_OPERATIONS: "tags-operations";
  readonly TAGS_OPERATIONS_SPLIT: "tags-operations-split";
};
export type OutputMode = (typeof OutputMode)[keyof typeof OutputMode];
/**
 * Options for the `docs` output. Everything but `configPath` is forwarded to
 * TypeDoc as-is, so any TypeDoc option is accepted.
 *
 * Typed structurally rather than as `Partial<TypeDocOptions>` on purpose:
 * `typedoc` is an optional peer dependency, and importing its types here would
 * leave a `typedoc` import in the published declarations, forcing every
 * consumer to install it to typecheck their config.
 *
 * @see https://typedoc.org/documents/Options.html
 */
export type OutputDocsOptions = {
  /** TypeDoc config file, forwarded to TypeDoc as its `options` path. */
  configPath?: string;
  /** Output directory. */
  out?: string;
  /** TypeDoc theme. Defaults to `markdown`. */
  theme?: string;
  /** TypeDoc plugins. `typedoc-plugin-markdown` is always included. */
  plugin?: string[];
  /** Any other TypeDoc option. */
  [option: string]: unknown;
};
export declare const OutputMockType: {
  readonly MSW: "msw";
  readonly FAKER: "faker";
};
export type OutputMockType = (typeof OutputMockType)[keyof typeof OutputMockType];
export type PreferredContentType = 'application/json' | 'application/xml' | 'text/plain' | 'text/html' | 'application/octet-stream' | (string & {});
export interface CommonMockOptions {
  useExamples?: boolean;
  generateEachHttpStatus?: boolean;
  locale?: keyof typeof allLocales;
  preferredContentType?: string;
  arrayItems?: boolean;
}
export interface MswMockOptions extends CommonMockOptions {
  type: typeof OutputMockType.MSW;
  operationResponses?: boolean;
  baseUrl?: string;
  delay?: false | number | (() => number);
  delayFunctionLazyExecute?: boolean;
  path?: string;
}
export interface FakerMockOptions extends CommonMockOptions {
  type: typeof OutputMockType.FAKER;
  schemas?: boolean;
  schemasImportPath?: string;
  schemasPath?: string;
  importPath?: string;
  operationResponses?: boolean;
  path?: string;
}
export type GlobalMockOptions = MswMockOptions | FakerMockOptions;
export interface OutputMocksConfig {
  indexMockFiles?: boolean;
  path?: string;
  inline?: boolean;
  generators: (GlobalMockOptions | ClientMockBuilder)[];
}
export type OutputMocksOption = boolean | OutputMocksConfig | ClientMockBuilder;
export interface NormalizedMocksConfig {
  indexMockFiles: boolean;
  path?: string;
  inline: boolean;
  generators: (GlobalMockOptions | ClientMockBuilder)[];
}
export type OverrideMockOptions = Partial<GlobalMockOptions> & {
  arrayMin?: number;
  arrayMax?: number;
  stringMin?: number;
  stringMax?: number;
  numberMin?: number;
  numberMax?: number;
  required?: boolean;
  nonNullable?: boolean;
  exactOptional?: boolean;
  properties?: MockProperties;
  schemas?: Record<string, {
    properties: MockProperties;
  }>;
  format?: Record<string, unknown>;
  fractionDigits?: number;
};
export type MockOptions = Omit<OverrideMockOptions, 'properties' | 'schemas'> & {
  properties?: Record<string, unknown>;
  operations?: Record<string, {
    properties: Record<string, unknown>;
  }>;
  tags?: Record<string, {
    properties: Record<string, unknown>;
  }>;
  schemas?: Record<string, {
    properties: Record<string, unknown>;
  }>;
};
export type MockPropertiesObject = Record<string, unknown>;
export type MockPropertiesObjectFn = (specs: OpenApiDocument) => MockPropertiesObject;
export type MockProperties = MockPropertiesObject | MockPropertiesObjectFn;
export type MockDataObject = Record<string, unknown>;
export type MockDataObjectFn = (specs: OpenApiDocument) => MockDataObject;
export type MockDataArray = unknown[];
export type MockDataArrayFn = (specs: OpenApiDocument) => MockDataArray;
export type MockData = MockDataObject | MockDataObjectFn | MockDataArray | MockDataArrayFn;
type OutputTransformerFn = (verb: GeneratorVerbOptions) => GeneratorVerbOptions;
type OutputTransformer = string | OutputTransformerFn;
export interface MutatorObject {
  path: string;
  name?: string;
  default?: boolean;
  alias?: Record<string, string>;
  external?: string[];
  extension?: string;
  useHooks?: boolean;
  inferred?: boolean;
}
export type Mutator = string | MutatorObject;
export interface ParamsSerializerOptions {
  qs?: Record<string, unknown>;
}
export declare const FormDataArrayHandling: {
  readonly SERIALIZE: "serialize";
  readonly EXPLODE: "explode";
  readonly SERIALIZE_WITH_BRACKETS: "serialize-with-brackets";
};
export type FormDataArrayHandling = (typeof FormDataArrayHandling)[keyof typeof FormDataArrayHandling];
export type NormalizedFormDataType<TMutator> = {
  disabled: true;
  mutator?: never;
  arrayHandling: FormDataArrayHandling;
} | {
  disabled: false;
  mutator?: TMutator;
  arrayHandling: FormDataArrayHandling;
};
export type FormDataType<TMutator> = {
  mutator: TMutator;
  arrayHandling?: FormDataArrayHandling;
} | {
  mutator?: TMutator;
  arrayHandling: FormDataArrayHandling;
};
export interface OverrideOutput {
  title?: (title: string) => string;
  transformer?: OutputTransformer;
  mutator?: Mutator;
  operations?: Record<string, OperationOptions>;
  tags?: Record<string, OperationOptions>;
  mock?: OverrideMockOptions;
  contentType?: OverrideOutputContentType;
  /**
   * The comment block written at the top of each generated file. This is
   * unrelated to `output.headers`, which controls HTTP request header
   * parameters.
   *
   * Pass `false` to omit the block, or a function receiving the spec's
   * {@link OpenApiInfoObject} and returning either one string, used verbatim,
   * or an array of strings, rendered as a JSDoc comment with one line each.
   * Only `title` and `version` are guaranteed to be present on `info`.
   *
   * Any other value, including `true`, falls back to the built-in header, so
   * passing `true` is indistinguishable from omitting the option.
   *
   * @example
   * header: (info) => [
   *   'Generated by orval',
   *   ...(info.description ? [info.description] : []),
   * ]
   */
  header?: boolean | ((info: OpenApiInfoObject) => string[] | string);
  formData?: boolean | Mutator | FormDataType<Mutator>;
  formUrlEncoded?: boolean | Mutator;
  paramsSerializer?: Mutator;
  paramsSerializerOptions?: ParamsSerializerOptions;
  paramsFilter?: Mutator;
  namingConvention?: {
    enum?: NamingConvention;
    /**
     * Naming convention applied to schema property names in generated
     * TypeScript types. The original spec key is still used for `required`
     * matching and runtime serialization; only the emitted property name
     * changes. See issue #2381.
     *
     * Zod schemas keep validating the original keys and rename them in a
     * `.transform()`, so `zod.output` carries the converted names (#4226).
     */
    properties?: NamingConvention;
  };
  components?: {
    schemas?: {
      prefix?: string;
      suffix?: string;
      itemPrefix?: string;
      itemSuffix?: string;
    };
    responses?: {
      prefix?: string;
      suffix?: string;
    };
    parameters?: {
      prefix?: string;
      suffix?: string;
    };
    requestBodies?: {
      prefix?: string;
      suffix?: string;
    };
  };
  hono?: HonoOptions;
  mcp?: McpOptions;
  query?: QueryOptions;
  swr?: SwrOptions;
  angular?: AngularOptions;
  zod?: ZodOptions;
  effect?: EffectOptions;
  operationName?: (operation: OpenApiOperationObject, route: string, verb: Verbs) => string | [string, string];
  axios?: AxiosOptions;
  fetch?: FetchOptions;
  requestOptions?: Record<string, unknown> | boolean;
  useDates?: boolean;
  /**
   * Emit per-operation response deserializers that convert schema-declared
   * `format: date` / `format: date-time` fields to `Date` at runtime.
   * Implies `useDates`. @default false
   */
  useDatesTransform?: boolean;
  useTypeOverInterfaces?: boolean;
  useDeprecatedOperations?: boolean;
  useBigInt?: boolean;
  useNamedParameters?: boolean;
  enumGenerationType?: EnumGeneration;
  suppressReadonlyModifier?: boolean;
  /**
   * Controls how readonly properties are handled for generated request-body types.
   *
   * Prefer `strip` for most OpenAPI specs because `readOnly` fields are
   * response-oriented. Use `preserve` only when your request DTOs are
   * intentionally immutable and should remain readonly in generated types.
   */
  preserveReadonlyRequestBodies?: ReadonlyRequestBodiesMode;
  /**
   * When enabled, operations with multiple request body content-types
   * (e.g. both `multipart/form-data` and `application/json`) will generate
   * separate functions for each content type instead of a single function
   * with a union type parameter.
   *
   * @default false
   */
  splitByContentType?: boolean;
  jsDoc?: JsDocOptions;
  aliasCombinedTypes?: boolean;
  /**
   * When enabled, optional properties will be typed as `T | null` instead of just `T`.
   * @default false
   */
  useNullForOptional?: boolean;
  /**
   * When enabled, the zod schema of the response is passed to the custom
   * mutator as an extra `schema` option, so the mutator can validate the
   * response itself.
   *
   * Requires `schemas: { type: 'zod' }` and runtime validation enabled for the
   * client (e.g. `override.fetch.runtimeValidation`).
   *
   * @default false
   */
  includeZodSchemaInArguments?: boolean;
}
export interface JsDocOptions {
  filter?: (schema: Record<string, unknown>) => {
    key: string;
    value: string;
  }[];
}
export interface NormalizedJsDocOptions {
  filter?: (schema: Record<string, unknown>) => {
    key: string;
    value: string;
  }[];
}
export interface OverrideOutputContentType {
  include?: string[];
  exclude?: string[];
}
/**
 * Strategy controlling how an existing hono handler file is treated on
 * regeneration.
 *
 * - `smart` (default): non-destructively reconcile orval-owned imports and
 *   `zValidator` arguments and append handlers for new operations, preserving
 *   all user-authored imports, middleware, bodies, and top-level code.
 * - `skip`: leave an existing handler file byte-for-byte unchanged.
 * - `full`: rebuild the preamble and validator chain from the spec, splicing
 *   back only the handler body. Drops custom imports/middleware/helpers.
 */
export type HonoHandlerStrategy = 'smart' | 'skip' | 'full';
export interface NormalizedHonoOptions {
  handlers?: string;
  handlerGenerationStrategy: HonoHandlerStrategy;
  compositeRoute: string;
  validator: boolean | 'hono';
  validatorOutputPath: string;
}
export interface ZodDateTimeOptions {
  offset?: boolean;
  local?: boolean;
  precision?: number;
}
export interface ZodTimeOptions {
  precision?: -1 | 0 | 1 | 2 | 3;
}
/**
 * Target Zod major version for generated output.
 *
 * - `4` — always emit Zod 4-style output (`z.strictObject`, `z.looseObject`,
 *   `z.iso.datetime()`, `.meta()`, …) regardless of the installed `zod` version.
 * - `3` — always emit Zod 3-compatible output (`.strict()`/`.passthrough()`,
 *   `z.string().datetime()`, …) regardless of the installed `zod` version.
 * - `'auto'` — infer the target from the `zod` version resolved in the output
 *   project's `package.json`; when no `zod` package can be detected, fall back
 *   to Zod 4 output.
 */
export type ZodVersionOption = 3 | 4 | 'auto';
export type ZodVariantOption = 'classic' | 'mini';
interface BaseZodOptions {
  strict?: {
    param?: boolean;
    query?: boolean;
    header?: boolean;
    body?: boolean;
    response?: boolean;
  };
  generate?: {
    param?: boolean;
    query?: boolean;
    header?: boolean;
    body?: boolean;
    response?: boolean;
  };
  coerce?: {
    param?: boolean | ZodCoerceType[];
    query?: boolean | ZodCoerceType[];
    header?: boolean | ZodCoerceType[];
    body?: boolean | ZodCoerceType[];
    response?: boolean | ZodCoerceType[];
  };
  preprocess?: {
    param?: Mutator;
    query?: Mutator;
    header?: Mutator;
    body?: Mutator;
    response?: Mutator;
  };
  /**
   * Mutator referencing a function called once per emitted validator at schema
   * construction time. It receives codegen-time context (operation, location,
   * schema name, field path, validator name) and returns a Zod `params` object
   * (e.g. `{ error: ... }`) that is appended as the trailing argument.
   *
   * The plural name follows Zod's own term for the validator's second argument
   * (`z.string(params)`) and is unrelated to the singular `param` key used by
   * `generate` / `coerce` / `preprocess` above, which refers to the path-parameter
   * location.
   */
  params?: Mutator;
  useBrandedTypes?: boolean;
  /**
   * When true, each generated `export const X = <zod schema>` is followed by
   * `export type X = zod.input<typeof X>;` and
   * `export type XOutput = zod.output<typeof X>;`, including the `Item`
   * schema split out for a bounded/array body or response. Default `false`.
   */
  generateCompanionTypes?: boolean;
}
export interface ZodOptions extends BaseZodOptions {
  /**
   * Select the generated Zod API style. `classic` imports from `zod`; `mini`
   * imports from `zod/mini` and emits the functional/check-based Zod Mini API.
   * Zod Mini requires a Zod 4 target.
   */
  variant?: ZodVariantOption;
  /**
   * Pin the Zod output target so generation is deterministic instead of
   * inferred from the installed `zod` version. Defaults to `'auto'`, which
   * infers from the detected package and otherwise falls back to Zod 4 output.
   * See {@link ZodVersionOption}.
   */
  version?: ZodVersionOption;
  dateTimeOptions?: ZodDateTimeOptions;
  timeOptions?: ZodTimeOptions;
  generateEachHttpStatus?: boolean;
  /**
   * When true, emits one reusable Zod schema per `#/components/schemas/*` `$ref`
   * (with `namingConvention` applied to the name) and references it everywhere
   * instead of inlining. Default `false`. See `docs/superpowers/specs/2026-05-26-reusable-zod-schemas-design.md`.
   */
  generateReusableSchemas?: boolean;
  /**
   * When true (zod v4 only), attaches registry metadata to generated
   * **component** schemas via `.meta({ id, description?, deprecated? })`: `id` is
   * the schema name, plus `description`/`deprecated` when the OpenAPI schema
   * provides them. On zod v3 (which has no `.meta()`) descriptions still emit
   * via `.describe()`. Default `false`.
   */
  generateMeta?: boolean;
  /**
   * When true, a `oneOf`/`anyOf` that carries an OpenAPI `discriminator` is
   * emitted as `zod.discriminatedUnion(key, [...])` (better per-branch errors)
   * instead of a plain `zod.union([...])`, but only when every branch can be
   * represented as an object — otherwise it safely falls back to a union.
   * Default `false` (opt-in), so existing output is unchanged.
   */
  generateDiscriminatedUnion?: boolean;
  /**
   * When true (zod v4 only), emits optional object properties with
   * `.exactOptional()` (classic) / `zod.exactOptional()` (mini) instead of
   * `.optional()`, so consumers with `exactOptionalPropertyTypes` infer
   * `{ x?: T }` rather than `{ x?: T | undefined }`. On zod v3 (which has no
   * `.exactOptional()`) this is a no-op and `.optional()` is emitted. Default
   * `false` (opt-in), so existing output is unchanged.
   */
  exactOptional?: boolean;
}
/**
 * Per-operation/tag Zod overrides only include settings that are actually
 * merged into the operation-specific generator path. Output-wide target and
 * schema-layout settings belong on `override.zod`, not `override.operations.*`
 * / `override.tags.*`.
 */
export type OperationZodOptions = BaseZodOptions;
/**
 * Runtime source of truth for the `override.zod` keys that may also be set per
 * operation or tag. `NormalizedOperationZodOptions`, the unsupported-key
 * warning, and the operation/tag normalization in `orval` are all derived from
 * this array; the `satisfies` clause plus the `Exclude` assertion below force
 * it to stay in lockstep with `OperationZodOptions`.
 */
export declare const operationZodOverrideKeys: readonly ["strict", "generate", "coerce", "preprocess", "params", "useBrandedTypes", "generateCompanionTypes"];
export type OperationZodOverrideKey = (typeof operationZodOverrideKeys)[number];
/**
 * Target Effect major version for generated output.
 *
 * - `4` — always emit Effect 4 Schema output (`S.Union([...])`, `.check(...)`,
 *   `S.optionalKey`, …) regardless of the installed `effect` version.
 * - `3` — always emit Effect 3 Schema output (`S.Union(...)`, `.pipe(...)`,
 *   `S.optionalWith`, …) regardless of the installed `effect` version.
 * - `'auto'` — infer the target from the `effect` version resolved in the
 *   output project's `package.json`; when no `effect` package can be detected,
 *   fall back to Effect 4 output.
 */
export type EffectVersionOption = 3 | 4 | 'auto';
export interface EffectOptions {
  strict?: ZodOptions['strict'];
  generate?: ZodOptions['generate'];
  generateEachHttpStatus?: boolean;
  useBrandedTypes?: boolean;
  /**
   * When true, emits optional Struct properties with
   * `S.optionalWith(schema, { exact: true })` (Effect 3) or
   * `S.optionalKey(schema)` (Effect 4) instead of `S.optional(schema)`, so
   * `exactOptionalPropertyTypes` consumers infer `{ x?: T }`. Default `false`.
   */
  exactOptional?: boolean;
  /**
   * Pin the Effect output target instead of inferring it from the installed
   * `effect` version. Defaults to `'auto'`. See {@link EffectVersionOption}.
   */
  version?: EffectVersionOption;
}
export type ZodCoerceType = 'string' | 'number' | 'boolean' | 'bigint' | 'date' | 'array';
export interface NormalizedZodOptions {
  variant: ZodVariantOption;
  version: ZodVersionOption;
  strict: {
    param: boolean;
    query: boolean;
    header: boolean;
    body: boolean;
    response: boolean;
  };
  generate: {
    param: boolean;
    query: boolean;
    header: boolean;
    body: boolean;
    response: boolean;
  };
  coerce: {
    param: boolean | ZodCoerceType[];
    query: boolean | ZodCoerceType[];
    header: boolean | ZodCoerceType[];
    body: boolean | ZodCoerceType[];
    response: boolean | ZodCoerceType[];
  };
  preprocess?: {
    param?: NormalizedMutator;
    query?: NormalizedMutator;
    header?: NormalizedMutator;
    body?: NormalizedMutator;
    response?: NormalizedMutator;
  };
  params?: NormalizedMutator;
  generateEachHttpStatus: boolean;
  useBrandedTypes: boolean;
  generateReusableSchemas: boolean;
  generateMeta: boolean;
  generateDiscriminatedUnion: boolean;
  exactOptional: boolean;
  generateCompanionTypes: boolean;
  dateTimeOptions: ZodDateTimeOptions;
  timeOptions: ZodTimeOptions;
}
export type NormalizedOperationZodOptions = Pick<NormalizedZodOptions, OperationZodOverrideKey>;
export interface NormalizedEffectOptions {
  strict: NormalizedZodOptions['strict'];
  generate: NormalizedZodOptions['generate'];
  generateEachHttpStatus: boolean;
  useBrandedTypes: boolean;
  exactOptional: boolean;
  version: EffectVersionOption;
}
/**
 * A single parameter value for `mutationInvalidates` params.
 *
 * - `string` – treated as a variable reference, e.g. `"petId"` → `variables.petId`
 * - `{ literal: string }` – emitted as a string literal, e.g. `{ literal: "@me" }` → `"@me"`
 */
export type InvalidateTargetParam = string | {
  literal: string;
};
export type InvalidateTarget = string | {
  query: string;
  params?: InvalidateTargetParam[] | Record<string, InvalidateTargetParam>;
  invalidateMode?: 'invalidate' | 'reset';
  file?: string;
};
export interface MutationInvalidatesRule {
  onMutations: string[];
  invalidates: InvalidateTarget[];
}
export type MutationInvalidatesConfig = MutationInvalidatesRule[];
export interface HonoOptions {
  handlers?: string;
  handlerGenerationStrategy?: HonoHandlerStrategy;
  compositeRoute?: string;
  validator?: boolean | 'hono';
  validatorOutputPath?: string;
}
export interface McpServerOptions {
  path: string;
  name?: string;
  default?: boolean;
}
export interface NormalizedMcpServerOptions {
  path: string;
  name?: string;
  default: boolean;
}
export interface McpHandlerOptions {
  path: string;
  name?: string;
  default?: boolean;
}
export interface NormalizedMcpHandlerOptions {
  path: string;
  name?: string;
  default: boolean;
}
export interface McpOptions {
  server?: McpServerOptions;
  handler?: McpHandlerOptions;
}
export interface NormalizedMcpOptions {
  server?: NormalizedMcpServerOptions;
  handler?: NormalizedMcpHandlerOptions;
}
/**
 * Strategy controlling how a Zod-backed client reacts to a response that fails
 * runtime validation.
 *
 * - `throw`: call `Schema.parse(data)` and let it throw (identical to the legacy
 *   boolean `true` behaviour).
 * - `both`: `safeParse` the payload, `console.error` the raw `ZodError` for
 *   production visibility, then re-throw so the failure still surfaces through
 *   the client's native error channel.
 */
export type RuntimeValidationStrategy = 'throw' | 'both';
/**
 * Per-client runtime-validation configuration surface.
 *
 * `true` is the canonical form of `{ strategy: 'throw' }`; `false`/omitted
 * disables validation. Both remain backward compatible with the original
 * boolean toggle.
 */
export type RuntimeValidation = boolean | {
  strategy: RuntimeValidationStrategy;
};
/**
 * Canonical, normalized runtime-validation configuration consumed by the client
 * generators.
 */
export interface NormalizedRuntimeValidation {
  enabled: boolean;
  strategy: RuntimeValidationStrategy;
}
/**
 * Angular's `runtimeValidation` surface. On top of the shared forms, the object
 * form can opt JSON request bodies into parsing before they are sent. The
 * object form enables response validation too, with `strategy` defaulting to
 * `throw`.
 */
export type AngularRuntimeValidation = boolean | {
  strategy?: RuntimeValidationStrategy;
  /**
   * Parse JSON request bodies with the generated Zod schema before the
   * request is sent. `strategy` applies to request bodies as well.
   *
   * @default false
   */
  requestBodies?: boolean;
};
export interface NormalizedAngularRuntimeValidation extends NormalizedRuntimeValidation {
  /** Omitted is the same as `false`. */
  requestBodies?: boolean;
}
export type InfiniteQueryParamLocation = 'query' | 'body';
export interface NormalizedQueryOptions {
  useQuery?: boolean;
  useSuspenseQuery?: boolean;
  useMutation?: boolean;
  useInfinite?: boolean;
  useSuspenseInfiniteQuery?: boolean;
  useInfiniteQueryParam?: string | string[];
  /**
   * Where the `useInfiniteQueryParam` page param lives. `'query'` pages
   * through a URL query parameter; `'body'` pages through a property of the
   * JSON request body, for `POST` endpoints that paginate with a filter body.
   *
   * @default 'query'
   */
  useInfiniteQueryParamLocation?: InfiniteQueryParamLocation;
  usePrefetch?: boolean;
  useInvalidate?: boolean;
  useSetQueryData?: boolean;
  useGetQueryData?: boolean;
  /**
   * Hold a query whose params are not resolved yet with `skipToken` instead of
   * the generated `enabled` guard, so a caller's own `enabled` cannot replace
   * the check and `refetch()` cannot bypass it. TanStack Query v5 only.
   */
  useSkipToken?: boolean;
  options?: Record<string, unknown>;
  queryKey?: NormalizedMutator;
  queryOptions?: NormalizedMutator;
  mutationOptions?: NormalizedMutator;
  shouldExportMutatorHooks?: boolean;
  shouldExportHttpClient?: boolean;
  shouldExportKeys?: boolean;
  shouldFilterQueryKey?: boolean;
  queryKeyFilter?: string;
  shouldSplitQueryKey?: boolean;
  useOperationIdAsQueryKey?: boolean;
  signal?: boolean;
  version?: 3 | 4 | 5;
  mutationInvalidates?: MutationInvalidatesConfig;
  runtimeValidation?: NormalizedRuntimeValidation;
}
export interface QueryOptions {
  useQuery?: boolean;
  useSuspenseQuery?: boolean;
  useMutation?: boolean;
  useInfinite?: boolean;
  useSuspenseInfiniteQuery?: boolean;
  useInfiniteQueryParam?: string | string[];
  /**
   * Where the `useInfiniteQueryParam` page param lives. `'query'` pages
   * through a URL query parameter; `'body'` pages through a property of the
   * JSON request body, for `POST` endpoints that paginate with a filter body.
   *
   * @default 'query'
   */
  useInfiniteQueryParamLocation?: InfiniteQueryParamLocation;
  usePrefetch?: boolean;
  useInvalidate?: boolean;
  useSetQueryData?: boolean;
  useGetQueryData?: boolean;
  /**
   * Hold a query whose params are not resolved yet with `skipToken` instead of
   * the generated `enabled` guard, so a caller's own `enabled` cannot replace
   * the check and `refetch()` cannot bypass it. TanStack Query v5 only.
   */
  useSkipToken?: boolean;
  options?: Record<string, unknown>;
  queryKey?: Mutator;
  queryOptions?: Mutator;
  mutationOptions?: Mutator;
  shouldExportMutatorHooks?: boolean;
  shouldExportHttpClient?: boolean;
  shouldExportKeys?: boolean;
  /**
   * @deprecated Renamed to `shouldExportKeys`, since it now also exports mutation keys
   */
  shouldExportQueryKey?: boolean;
  shouldFilterQueryKey?: boolean;
  queryKeyFilter?: string;
  shouldSplitQueryKey?: boolean;
  useOperationIdAsQueryKey?: boolean;
  signal?: boolean;
  version?: 3 | 4 | 5;
  mutationInvalidates?: MutationInvalidatesConfig;
  runtimeValidation?: RuntimeValidation;
}
export interface AngularOptions {
  provideIn?: 'root' | 'any' | boolean;
  /**
   * Preferred name for configuring how retrieval-style operations are emitted.
   *
   * - `httpClient`: keep retrievals as service methods
   * - `httpResource`: emit retrievals as Angular `httpResource` helpers
   * - `both`: emit retrieval helpers and keep service methods where needed
   *
   * Mutation-style operations still use generated `HttpClient` service methods
   * by default unless a per-operation override forces a different behavior.
   */
  retrievalClient?: 'httpClient' | 'httpResource' | 'both';
  /**
   * Backward-compatible alias for `retrievalClient`.
   *
   * Kept for compatibility with existing configs.
   */
  client?: 'httpClient' | 'httpResource' | 'both';
  runtimeValidation?: AngularRuntimeValidation;
  httpResource?: AngularHttpResourceOptions;
  /**
   * Opt-in: compose the runtime base URL for this output via Angular DI
   * (an `InjectionToken`) instead of baking a static prefix into every
   * route at generation time. Angular-client only; mutually exclusive with
   * the top-level `output.baseUrl`.
   */
  baseUrl?: AngularBaseUrlOptions;
  /**
   * Controls how object-typed query parameters are serialized when no
   * `paramsSerializer` is configured.
   *
   * - `spec` (default): honor the OpenAPI parameter's `style`/`explode` —
   *   `form` + `explode: true` (the OpenAPI default) spreads the object's
   *   properties as top-level query params, `form` + `explode: false` joins
   *   them into a single comma-separated value, and `deepObject` emits
   *   bracketed `name[prop]` keys.
   * - `legacy`: restore the pre-#3705 behavior of silently dropping
   *   object-typed query params from the generated request.
   *
   * Has no effect when a `paramsSerializer` or `paramsFilter` is configured
   * for the operation — those remain in full control of the raw value. See
   * issue #3705.
   */
  queryObjectSerialization?: 'spec' | 'legacy';
}
export interface NormalizedAngularOptions {
  provideIn: 'root' | 'any' | boolean;
  client: 'httpClient' | 'httpResource' | 'both';
  runtimeValidation: NormalizedAngularRuntimeValidation;
  httpResource?: AngularHttpResourceOptions;
  baseUrl?: AngularBaseUrlOptions;
  queryObjectSerialization: 'spec' | 'legacy';
}
export interface AngularHttpResourceOptions {
  /**
   * Value to expose while the resource is idle/loading.
   *
   * Serialized as a literal into generated code.
   */
  defaultValue?: unknown;
  /**
   * Debug name shown in Angular DevTools.
   */
  debugName?: string;
  /**
   * Raw code expression for HttpResourceOptions.injector.
   * Example: `inject(Injector)`.
   */
  injector?: string;
  /**
   * Raw code expression for HttpResourceOptions.equal.
   * Example: `(a, b) => a.id === b.id`.
   */
  equal?: string;
}
export interface SwrOptions {
  useInfinite?: boolean;
  useSWRMutationForGet?: boolean;
  useSuspense?: boolean;
  generateErrorTypes?: boolean;
  swrOptions?: unknown;
  swrMutationOptions?: unknown;
  swrInfiniteOptions?: unknown;
}
export interface NormalizedAxiosOptions {
  includeHttpResponseReturnType: boolean;
}
export interface AxiosOptions {
  /**
   * Include the HTTP status in the return type so it discriminates the
   * response data type.
   *
   * @default false
   */
  includeHttpResponseReturnType?: boolean;
}
export interface NormalizedFetchOptions {
  includeHttpResponseReturnType: boolean;
  forceSuccessResponse: boolean;
  includeHttpErrorResponse?: boolean;
  serializeResponseHeaders: boolean;
  jsonReviver?: Mutator;
  runtimeValidation: NormalizedRuntimeValidation;
  useRuntimeFetcher: boolean;
  /**
   * Serialization format for array query parameters that do not have an explicit
   * `explode` setting in the OpenAPI spec.
   *
   * - `repeat` — repeat the key for each value: `foo=1&foo=2`
   * - `brackets` — append `[]` to the key: `foo[]=1&foo[]=2`
   * - `comma` — join values with a comma: `foo=1,2`
   */
  arrayFormat?: 'repeat' | 'brackets' | 'comma';
}
export interface FetchOptions {
  includeHttpResponseReturnType?: boolean;
  forceSuccessResponse?: boolean;
  /**
   * Pass full error response types to a custom mutator's ErrorType and declared
   * error statuses/media types in its third argument. Requires response envelopes,
   * forceSuccessResponse, and a non-hook mutator accepting three arguments.
   * Only explicit error status codes are supported after content-type filtering.
   *
   * @default false
   */
  includeHttpErrorResponse?: boolean;
  /**
   * Return response `headers` as a plain `Record<string, string>` instead of a
   * `Headers` instance, so the response stays serializable. Keys are lowercased
   * and `set-cookie` is omitted. With a `mutator` this only changes the declared
   * type — the mutator must return headers in that shape itself.
   *
   * @default false
   */
  serializeResponseHeaders?: boolean;
  jsonReviver?: Mutator;
  runtimeValidation?: RuntimeValidation;
  useRuntimeFetcher?: boolean;
  /**
   * Serialization format for array query parameters that do not have an explicit
   * `explode` setting in the OpenAPI spec.
   *
   * - `repeat` — repeat the key for each value: `foo=1&foo=2`
   * - `brackets` — append `[]` to the key: `foo[]=1&foo[]=2`
   * - `comma` — join values with a comma: `foo=1,2`
   */
  arrayFormat?: 'repeat' | 'brackets' | 'comma';
}
export type InputTransformerFn = (spec: OpenApiDocument) => OpenApiDocument | Promise<OpenApiDocument>;
type InputTransformer = string | InputTransformerFn;
export interface OverrideInput {
  transformer?: InputTransformer;
}
export interface OperationOptions {
  transformer?: OutputTransformer;
  mutator?: Mutator;
  mock?: {
    data?: MockData;
    properties?: MockProperties;
  };
  query?: QueryOptions;
  angular?: AngularOptions;
  swr?: SwrOptions;
  zod?: OperationZodOptions;
  effect?: EffectOptions;
  operationName?: (operation: OpenApiOperationObject, route: string, verb: Verbs) => string | [string, string];
  axios?: AxiosOptions;
  fetch?: FetchOptions;
  formData?: boolean | Mutator | FormDataType<Mutator>;
  formUrlEncoded?: boolean | Mutator;
  paramsSerializer?: Mutator;
  paramsFilter?: Mutator;
  requestOptions?: object | boolean;
}
export type Hook = 'afterAllFilesWrite';
export type HookFunction<TArgs extends unknown[] = unknown[]> = (...args: TArgs) => void | Promise<void>;
export interface HookOption {
  command: string | HookFunction;
  injectGeneratedDirsAndFiles?: boolean;
}
export type HookCommand = string | HookFunction | HookOption | (string | HookFunction | HookOption)[];
export type NormalizedHookCommand = HookCommand[];
export type HooksOptions<T = HookCommand | NormalizedHookCommand> = Partial<Record<Hook, T>>;
export type NormalizedHookOptions = HooksOptions<NormalizedHookCommand>;
export type Verbs = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'query';
export declare const Verbs: {
  GET: Verbs;
  PUT: Verbs;
  POST: Verbs;
  DELETE: Verbs;
  OPTIONS: Verbs;
  HEAD: Verbs;
  PATCH: Verbs;
  QUERY: Verbs;
};
/**
 * Canonical tag name used for the generated bucket that collects untagged operations.
 */
export declare const DefaultTag: "default";
export interface ImportOpenApi {
  spec: OpenApiDocument;
  input: NormalizedInputOptions;
  output: NormalizedOutputOptions;
  target: string;
  workspace: string;
  projectName?: string;
}
export interface ContextSpec {
  projectName?: string;
  target: string;
  workspace: string;
  spec: OpenApiDocument;
  parents?: string[];
  output: NormalizedOutputOptions;
  /**
   * Per-schema dynamic scope mapping `$dynamicAnchor` names to concrete schema
   * entries or generic parameter placeholders. Populated by `buildDynamicScope`.
   */
  dynamicScope?: Partial<Record<string, DynamicScopeEntry>>;
  /**
   * Lazily-built index of every `$dynamicAnchor` declared in
   * `components.schemas`, used by the `resolveDynamicRef` fallback when an
   * anchor is absent from {@link dynamicScope}. Memoized on first miss so the
   * O(numSchemas) scan runs once per spec instead of once per `$dynamicRef`.
   * Populated by `getDynamicAnchorIndex` in `resolvers/ref.ts`.
   */
  dynamicAnchorIndex?: Map<string, DynamicAnchorIndexEntry>;
  /**
   * Lazily-built set of normalized component schema names, used while naming
   * inline object-property schemas so component name collision checks do not
   * rescan `components.schemas` for every property.
   */
  normalizedComponentSchemaNames?: Set<string>;
  /**
   * Tracks array-item mock factory names already emitted per output file scope.
   * Populated by `@orval/mock` when `arrayItems: true` so shared `$ref` item
   * factories are not re-declared within the same file (single/split) or tag
   * bucket (tags/tags-split). Scope keys include the active mock generator
   * type so separate `.msw.ts` / `.faker.ts` files each get their own copy.
   */
  arrayItemMockFactories?: Map<string, Set<string>>;
  /**
   * Set by `@orval/mock` while generating per-operation mock output so
   * file-scoped helpers (e.g. array-item factory dedup) can distinguish
   * separate mock generator files.
   */
  activeMockOutputType?: OutputMockType;
}
/**
 * Maps a `$dynamicAnchor` name to its resolution target.
 *
 * Concrete entry (bound via `$ref`):
 *   - `name` — the generated TypeScript type name (e.g. `User`)
 *   - `schemaName` — the original key in `components.schemas` (e.g. `User`)
 *
 * Parameter entry (unbound `$defs` placeholder):
 *   - `isParameter` — `true`, signals this is a generic type parameter
 *   - `name` — the `$dynamicAnchor` name used as the type parameter (e.g. `itemType`)
 *   - `schemaName` — same as `name` for parameters
 *
 * Inline entry (anonymous subschema overriding an anchor without a `$ref`):
 *   - `inlineSchema` — the concrete schema object to resolve `$dynamicRef` against.
 *     Takes precedence over the component lookup in `resolveDynamicRef`, so an
 *     inline `$dynamicAnchor` (e.g. inside `allOf` / `items`) correctly shadows
 *     the outer/global anchor. `schemaName` is the anchor name itself.
 */
export interface DynamicScopeEntry {
  name: string;
  schemaName: string;
  isParameter?: boolean;
  inlineSchema?: OpenApiSchemaObject;
}
/**
 * Compact per-anchor result of the single `$dynamicAnchor` index scan.
 *
 * Reproduces the precedence in `resolveDynamicRef`'s fallback without storing
 * full match arrays:
 *   - {@link exactName} — a schema whose key equals the anchor name. Always
 *     wins when present (matches `matches.find(m => m === anchorName)`).
 *   - {@link firstName} / {@link count} — non-exact matches. Only the first is
 *     kept; `count` is capped at 2 because the resolution only distinguishes
 *     "exactly one" from "ambiguous". Recording stops once `count >= 2`, which
 *     is the safe form of "bail early when ambiguous" — a literal early-return
 *     at `count === 2` would regress the exact-name rule when the exact schema
 *     appears later in iteration order.
 */
export interface DynamicAnchorIndexEntry {
  exactName?: string;
  firstName?: string;
  count: number;
}
export declare const LOG_LEVELS: readonly ["error", "warn", "info", "verbose", "debug"];
export type LogLevel = (typeof LOG_LEVELS)[number];
export interface GlobalOptions {
  watch?: boolean | string | string[];
  logLevel?: LogLevel;
  clean?: boolean | string[];
  formatter?: SupportedFormatter;
  mock?: OutputMocksOption;
  client?: OutputClient;
  httpClient?: OutputHttpClient;
  mode?: OutputMode;
  tsconfig?: string | Tsconfig;
  packageJson?: string;
  input?: string | string[];
  output?: string;
  failOnWarnings?: boolean;
  throwOnError?: boolean;
}
export interface Tsconfig {
  baseUrl?: string;
  compilerOptions?: {
    esModuleInterop?: boolean;
    allowSyntheticDefaultImports?: boolean;
    exactOptionalPropertyTypes?: boolean;
    paths?: Record<string, string[]>;
    target?: TsConfigTarget;
    module?: TsConfigModule;
    moduleResolution?: TsConfigModuleResolution;
    allowImportingTsExtensions?: boolean;
  };
}
export type TsConfigTarget = 'es3' | 'es5' | 'es6' | 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'es2021' | 'es2022' | 'es2023' | 'es2024' | 'es2025' | 'esnext';
/** Accepts both the canonical casing and the all-lowercase variant of a string literal. */
type CaseInsensitive<T extends string> = T | Lowercase<T>;
/**
 * Valid values for the TypeScript `compilerOptions.module` setting.
 *
 * Both title-case (e.g. `"NodeNext"`) and lower-case (e.g. `"nodenext"`) are
 * accepted, matching TypeScript's own case-insensitive parsing.
 *
 * @see {@link https://www.typescriptlang.org/tsconfig#module}
 */
export type TsConfigModule = CaseInsensitive<'None' | 'CommonJS' | 'AMD' | 'UMD' | 'System' | 'ES6' | 'ES2015' | 'ES2020' | 'ES2022' | 'ESNext' | 'Node16' | 'Node18' | 'Node20' | 'NodeNext' | 'Preserve'>;
/**
 * Valid values for the TypeScript `compilerOptions.moduleResolution` setting.
 *
 * Both title-case (e.g. `"NodeNext"`) and lower-case (e.g. `"nodenext"`) are
 * accepted, matching TypeScript's own case-insensitive parsing.
 *
 * @see https://www.typescriptlang.org/tsconfig#moduleResolution
 */
export type TsConfigModuleResolution = CaseInsensitive<'Classic' | 'Node' | 'Node10' | 'Node16' | 'NodeNext' | 'Bundler'>;
export interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  catalog?: Record<string, string>;
  catalogs?: Record<string, Record<string, string>>;
  resolvedVersions?: Record<string, string>;
}
export interface GeneratorSchema {
  name: string;
  model: string;
  imports: GeneratorImport[];
  dependencies?: string[];
  schema?: OpenApiSchemaObject;
  kind?: GeneratedSchemaKind;
  factory?: string;
  factoryImports?: GeneratorImport[];
  factoryMode?: FactoryMethodsMode;
}
export interface GeneratorImport {
  readonly name: string;
  readonly schemaName?: string;
  readonly isZodSchema?: boolean;
  readonly isConstant?: boolean;
  readonly alias?: string;
  readonly default?: boolean;
  readonly values?: boolean;
  readonly syntheticDefaultImport?: boolean;
  readonly namespaceImport?: boolean;
  readonly importPath?: string;
  readonly schemaFactory?: boolean;
  readonly zodBaseName?: string;
}
export interface GeneratorDependency {
  readonly exports: readonly GeneratorImport[];
  readonly dependency: string;
}
export interface GeneratorApiResponse {
  operations: GeneratorOperations;
  schemas: GeneratorSchema[];
}
export type GeneratorOperations = Record<string, GeneratorOperation>;
export type StrictMockSchemaKind = 'object' | 'alias' | 'binary';
export interface GeneratorMockOutput {
  type: OutputMockType;
  implementation: string;
  imports: GeneratorImport[];
  strictMockSchemaTypeNames?: string[];
  strictMockSchemaKinds?: Record<string, StrictMockSchemaKind>;
}
export interface GeneratorMockOutputFull {
  type: OutputMockType;
  implementation: {
    function: string;
    handler: string;
    handlerName: string;
  };
  imports: GeneratorImport[];
  strictMockSchemaTypeNames?: string[];
  strictMockSchemaKinds?: Record<string, StrictMockSchemaKind>;
}
export interface GeneratorTarget {
  imports: GeneratorImport[];
  implementation: string;
  mockOutputs: GeneratorMockOutput[];
  mutators?: GeneratorMutator[];
  clientMutators?: GeneratorMutator[];
  formData?: GeneratorMutator[];
  formUrlEncoded?: GeneratorMutator[];
  paramsSerializer?: GeneratorMutator[];
  paramsFilter?: GeneratorMutator[];
  fetchReviver?: GeneratorMutator[];
  sharedTypes?: SharedTypeDeclaration[];
}
export interface GeneratorTargetFull {
  imports: GeneratorImport[];
  implementation: string;
  mockOutputs: GeneratorMockOutputFull[];
  mutators?: GeneratorMutator[];
  clientMutators?: GeneratorMutator[];
  formData?: GeneratorMutator[];
  formUrlEncoded?: GeneratorMutator[];
  paramsSerializer?: GeneratorMutator[];
  paramsFilter?: GeneratorMutator[];
  fetchReviver?: GeneratorMutator[];
  sharedTypes?: SharedTypeDeclaration[];
}
export interface GeneratorOperation {
  imports: GeneratorImport[];
  implementation: string;
  mockOutputs: GeneratorMockOutputFull[];
  tags: string[];
  mutator?: GeneratorMutator;
  clientMutators?: GeneratorMutator[];
  formData?: GeneratorMutator;
  formUrlEncoded?: GeneratorMutator;
  paramsSerializer?: GeneratorMutator;
  paramsFilter?: GeneratorMutator;
  fetchReviver?: GeneratorMutator;
  operationName: string;
  /** Resolved Axios URL-helper name when the output client emits one. */
  urlHelperName?: string;
  types?: {
    result: (title?: string) => string;
  };
}
/**
 * One operation's slice of a tag bucket, produced by
 * `generateTargetForTagsOperations` for the `tags-operations` /
 * `tags-operations-split` modes. Unlike `GeneratorTargetFull`, the
 * implementation here is never merged with sibling operations — each
 * operation keeps its own header/footer-wrapped implementation so it can be
 * written to its own file.
 */
export interface GeneratorOperationTarget {
  operationName: string;
  imports: GeneratorImport[];
  implementation: string;
  mockOutputs: GeneratorMockOutput[];
  mockOutputsFull: GeneratorMockOutputFull[];
  mutators?: GeneratorMutator[];
  clientMutators?: GeneratorMutator[];
  formData?: GeneratorMutator[];
  formUrlEncoded?: GeneratorMutator[];
  paramsSerializer?: GeneratorMutator[];
  paramsFilter?: GeneratorMutator[];
  fetchReviver?: GeneratorMutator[];
}
/**
 * Shared per-tag helper block (e.g. `AwaitedInput`/`Awaited`,
 * `SecondParameter`, query-key helpers, deduplicated shared types) computed
 * once per tag so every operation file in that tag can import it instead of
 * redeclaring it.
 */
export interface GeneratorTagHelpers {
  implementation: string;
  sharedTypes?: SharedTypeDeclaration[];
  /**
   * Top-level `type` identifiers declared in `implementation`. Writers
   * import these with `import type { ... }` — a side-effect import
   * (`import './<tag>.helpers'`) never brings type names into scope.
   */
  typeNames: string[];
  /**
   * Top-level `const`/`function` identifiers declared in `implementation`
   * (e.g. a query-key helper called at runtime). These must survive as a
   * real value import, not `import type`.
   */
  valueNames: string[];
}
export interface GeneratorTagOperationsTarget {
  helpers: GeneratorTagHelpers;
  operations: GeneratorOperationTarget[];
}
export interface GeneratorVerbOptions {
  verb: Verbs;
  route: string;
  pathRoute: string;
  summary?: string;
  doc: string;
  tags: string[];
  operationId: string;
  operationName: string;
  /** Resolved Axios URL-helper name when the output client emits one. */
  urlHelperName?: string;
  typeName: string;
  response: GetterResponse;
  body: GetterBody;
  headers?: GetterQueryParam;
  queryParams?: GetterQueryParam;
  params: GetterParams;
  props: GetterProps;
  mutator?: GeneratorMutator;
  formData?: GeneratorMutator;
  formUrlEncoded?: GeneratorMutator;
  paramsSerializer?: GeneratorMutator;
  paramsFilter?: GeneratorMutator;
  fetchReviver?: GeneratorMutator;
  override: NormalizedOverrideOutput;
  deprecated?: boolean;
  originalOperation: OpenApiOperationObject;
}
export type GeneratorVerbsOptions = GeneratorVerbOptions[];
export interface GeneratorOptions {
  route: string;
  pathRoute: string;
  override: NormalizedOverrideOutput;
  context: ContextSpec;
  mock?: GlobalMockOptions | ClientMockBuilder;
  output: string;
}
export interface GeneratorClient {
  implementation: string;
  imports: GeneratorImport[];
  mutators?: GeneratorMutator[];
  /** When set, overrides the default verbOption.doc prepended to the implementation */
  docComment?: string;
  returnType?: (title?: string) => string;
}
export interface GeneratorMutatorParsingInfo {
  numberOfParams: number;
  returnNumberOfParams?: number;
}
export interface GeneratorMutator {
  name: string;
  path: string;
  default: boolean;
  hasErrorType: boolean;
  errorTypeName: string;
  hasSecondArg: boolean;
  hasThirdArg: boolean;
  isHook: boolean;
  bodyTypeName?: string;
  useHooks?: boolean;
  inferred?: boolean;
}
export type ClientBuilder = (verbOptions: GeneratorVerbOptions, options: GeneratorOptions, outputClient: OutputClient | OutputClientFunc, output?: NormalizedOutputOptions) => GeneratorClient | Promise<GeneratorClient>;
/**
 * Names that a generated file declares and that its sibling files of the same
 * kind declare identically. The barrel writer uses them to prevent TS2308.
 * See `buildBarrelReExports` for the rule.
 */
export interface SharedExports {
  /**
   * Type-only declarations. Re-exported via `export type { ... }` — kept
   * separate from {@link SharedExports.values} because a type re-exported
   * without the `type` modifier is an error under `verbatimModuleSyntax`,
   * which Angular projects enable by default.
   */
  readonly types: readonly string[];
  /** Value declarations, re-exported via `export { ... }`. */
  readonly values: readonly string[];
}
export interface ClientFileBuilder {
  path: string;
  content: string;
  /**
   * Set this to re-export the file from the `tags-split` barrel. Omit it when
   * the file is not part of the public client surface, or when the file runs
   * code at module level and an import must not start that code.
   */
  barrelExport?: boolean;
  /**
   * Declared by generators whose extra files repeat shared boilerplate. Omit
   * when a file declares nothing its siblings also declare.
   */
  sharedExports?: SharedExports;
}
export type ClientExtraFilesBuilder = (verbOptions: Record<string, GeneratorVerbOptions>, output: NormalizedOutputOptions, context: ContextSpec, schemaTagMap?: Map<string, string>, schemaOutputPlan?: SchemaOutputPlan) => Promise<ClientFileBuilder[]>;
export interface SharedTypeDeclaration {
  name: string;
  exported: boolean;
  code: string;
}
export type HeaderResult = {
  implementation: string;
  sharedTypes?: SharedTypeDeclaration[];
};
export type ClientHeaderBuilder = (params: {
  title: string;
  isRequestOptions: boolean;
  isMutator: boolean;
  noFunction?: boolean;
  isGlobalMutator: boolean;
  provideIn: boolean | 'root' | 'any';
  hasAwaitedType: boolean;
  output: NormalizedOutputOptions;
  verbOptions: Record<string, GeneratorVerbOptions>;
  tag?: string;
  isDefaultTagBucket?: boolean;
  clientImplementation: string;
}) => string | HeaderResult;
export type ClientFooterBuilder = (params: {
  noFunction?: boolean | undefined;
  operationNames: string[];
  operations?: GeneratorOperation[];
  title?: string;
  hasAwaitedType: boolean;
  hasMutator: boolean;
}) => string;
export type ClientTitleBuilder = (title: string) => string;
export type ClientDependenciesBuilder = (hasGlobalMutator: boolean, hasParamsSerializerOptions: boolean, packageJson?: PackageJson, httpClient?: OutputHttpClient, hasTagsMutator?: boolean, override?: NormalizedOverrideOutput,
/**
 * The client implementation these imports are for, so a builder can settle a
 * question the config cannot: whether *this file* uses an export as a value.
 * Empty for callers that have no implementation to offer.
 */
implementation?: string) => GeneratorDependency[];
export interface ClientMockGeneratorImplementation {
  function: string;
  handlerName: string;
  handler: string;
}
export interface ClientMockGeneratorBuilder {
  imports: GeneratorImport[];
  implementation: ClientMockGeneratorImplementation;
  strictMockSchemaTypeNames?: string[];
  strictMockSchemaKinds?: Record<string, StrictMockSchemaKind>;
}
export type ClientMockBuilder = (verbOptions: GeneratorVerbOptions, generatorOptions: GeneratorOptions) => ClientMockGeneratorBuilder;
export interface ClientGeneratorsBuilder {
  client: ClientBuilder;
  header?: ClientHeaderBuilder;
  dependencies?: ClientDependenciesBuilder;
  footer?: ClientFooterBuilder;
  title?: ClientTitleBuilder;
  extraFiles?: ClientExtraFilesBuilder;
}
export type GeneratorClients = Record<OutputClient, ClientGeneratorsBuilder>;
export interface GetterResponse {
  imports: GeneratorImport[];
  definition: {
    success: string;
    errors: string;
  };
  isBlob: boolean;
  types: {
    success: ResReqTypesValue[];
    errors: ResReqTypesValue[];
  };
  contentTypes: string[];
  schemas: GeneratorSchema[];
  originalSchema?: OpenApiResponsesObject;
}
export interface GetterBody {
  originalSchema: OpenApiReferenceObject | OpenApiRequestBodyObject;
  imports: GeneratorImport[];
  definition: string;
  implementation: string;
  schemas: GeneratorSchema[];
  formData?: string;
  formUrlEncoded?: string;
  contentType: string;
  isOptional: boolean;
  isBlob: boolean;
}
export interface GetterParameters {
  query: {
    parameter: OpenApiParameterObject;
    imports: GeneratorImport[];
  }[];
  path: {
    parameter: OpenApiParameterObject;
    imports: GeneratorImport[];
  }[];
  header: {
    parameter: OpenApiParameterObject;
    imports: GeneratorImport[];
  }[];
}
export interface GetterParam {
  name: string;
  definition: string;
  implementation: string;
  default: unknown;
  required: boolean;
  /**
   * True when the spec marks the path parameter `allowReserved: true`.
   * Generators use this to skip URL-encoding the param at request time
   * (e.g. wildcard/multi-segment `{path=**}` routes under
   * `urlEncodeParameters`) (#3910).
   */
  allowReserved?: boolean;
  imports: GeneratorImport[];
}
export type GetterParams = GetterParam[];
export interface GetterQueryParam {
  schema: GeneratorSchema;
  deps: GeneratorSchema[];
  isOptional: boolean;
  paramNames?: string[];
  originalSchema?: OpenApiSchemaObject;
  requiredNullableKeys?: string[];
  /**
   * Names of query parameters whose declared schema is non-primitive
   * (object, array of objects, or untyped). Used by Angular generators to
   * preserve these values through the default `filterParams` helper instead
   * of silently dropping them — the user's `paramsSerializer`, `mutator`, or
   * `paramsFilter` is then responsible for handling them. See issue #3326.
   */
  nonPrimitiveKeys?: string[];
  /**
   * Per-parameter serialization strategy for query params whose declared
   * schema is a plain object, derived from the OpenAPI parameter's
   * `style`/`explode` (defaulting to `form` + `explode: true` per spec).
   * Used by Angular generators' default `filterParams` helper to serialize
   * these values instead of silently dropping them, when no
   * `paramsSerializer`/`paramsFilter` is configured. See issue #3705.
   *
   * - `flatten`: `form` + `explode: true` — spread properties as top-level
   *   query params.
   * - `comma`: `form` + `explode: false` — join `prop,value` pairs with commas
   *   into a single value.
   * - `deepObject`: `deepObject` style — emit bracketed `name[prop]` keys.
   */
  objectQueryParams?: {
    key: string;
    strategy: 'flatten' | 'comma' | 'deepObject';
  }[];
}
export type GetterPropType = 'param' | 'body' | 'queryParam' | 'header' | 'namedPathParams';
export declare const GetterPropType: {
  readonly PARAM: "param";
  readonly NAMED_PATH_PARAMS: "namedPathParams";
  readonly BODY: "body";
  readonly QUERY_PARAM: "queryParam";
  readonly HEADER: "header";
};
interface GetterPropBase {
  name: string;
  definition: string;
  implementation: string;
  default: unknown;
  required: boolean;
}
export type GetterProp = GetterPropBase & ({
  type: 'namedPathParams';
  destructured: string;
  schema: GeneratorSchema;
} | {
  type: Exclude<GetterPropType, 'namedPathParams'>;
});
export type GetterProps = GetterProp[];
export type SchemaType = 'integer' | 'number' | 'string' | 'boolean' | 'object' | 'null' | 'array' | 'enum' | 'unknown';
export declare const SchemaType: {
  integer: string;
  number: string;
  string: string;
  boolean: string;
  object: string;
  null: string;
  array: string;
  enum: string;
  unknown: string;
};
export interface ScalarValue {
  value: string;
  useTypeAlias?: boolean;
  isEnum: boolean;
  hasReadonlyProps: boolean;
  type: SchemaType;
  imports: GeneratorImport[];
  schemas: GeneratorSchema[];
  isRef: boolean;
  dependencies: string[];
  example?: unknown;
  examples?: Record<string, unknown> | unknown[];
}
export type ResolverValue = ScalarValue & {
  originalSchema: OpenApiSchemaObject;
};
export type ResReqTypesValue = ScalarValue & {
  formData?: string;
  formUrlEncoded?: string;
  isRef?: boolean;
  hasReadonlyProps?: boolean;
  key: string;
  contentType: string;
  originalSchema?: OpenApiSchemaObject;
};
export interface FinalizeMockImplementationOptions {
  mockOptions?: Pick<MockOptions, 'required' | 'nonNullable'>;
  strictSchemaTypeNames?: readonly string[];
  strictMockSchemaKinds?: Readonly<Record<string, StrictMockSchemaKind>>;
}
export interface WriteSpecBuilder {
  operations: GeneratorOperations;
  verbOptions: Record<string, GeneratorVerbOptions>;
  schemas: GeneratorSchema[];
  title: GeneratorClientTitle;
  header: GeneratorClientHeader;
  footer: GeneratorClientFooter;
  imports: GeneratorClientImports;
  importsMock: GenerateMockImports;
  /** Hoists shared strict-mock type aliases once per aggregated mock file. */
  finalizeMockImplementation?: (implementation: string, options: FinalizeMockImplementationOptions) => string;
  extraFiles: ClientFileBuilder[];
  info: OpenApiInfoObject;
  target: string;
  spec: OpenApiDocument;
  /** Schema→tag map built during API building, when `splitByTags` is on. */
  schemaTagMap?: Map<string, string>;
  /** Routed schema paths built during API building, when `routes` is set. */
  schemaOutputPlan?: SchemaOutputPlan;
}
export interface WriteModeProps {
  builder: WriteSpecBuilder;
  output: NormalizedOutputOptions;
  workspace: string;
  projectName?: string;
  header: string;
  needSchema: boolean;
  generateSchemasInline?: () => string;
  schemaTagMap?: Map<string, string>;
  /** Route-aware schema paths prepared by the top-level writer. */
  schemaOutputPlan?: SchemaOutputPlan;
}
export interface GeneratorApiOperations {
  verbOptions: Record<string, GeneratorVerbOptions>;
  operations: GeneratorOperations;
  schemas: GeneratorSchema[];
}
export interface GeneratorClientExtra {
  implementation: string;
  implementationMock: string;
  sharedTypes?: SharedTypeDeclaration[];
}
export type GeneratorClientTitle = (data: {
  outputClient?: OutputClient | OutputClientFunc;
  title: string;
  customTitleFunc?: (title: string) => string;
  output: NormalizedOutputOptions;
}) => Promise<GeneratorClientExtra>;
export type GeneratorClientHeader = (data: {
  outputClient?: OutputClient | OutputClientFunc;
  isRequestOptions: boolean;
  isMutator: boolean;
  isGlobalMutator: boolean;
  provideIn: boolean | 'root' | 'any';
  hasAwaitedType: boolean;
  titles: GeneratorClientExtra;
  output: NormalizedOutputOptions;
  verbOptions: Record<string, GeneratorVerbOptions>;
  tag?: string;
  isDefaultTagBucket?: boolean;
  clientImplementation: string;
}) => Promise<GeneratorClientExtra>;
export type GeneratorClientFooter = (data: {
  outputClient: OutputClient | OutputClientFunc;
  operationNames: string[];
  operations?: GeneratorOperation[];
  hasMutator: boolean;
  hasAwaitedType: boolean;
  titles: GeneratorClientExtra;
  output: NormalizedOutputOptions;
}) => Promise<GeneratorClientExtra>;
export type GeneratorClientImports = (data: {
  client: OutputClient | OutputClientFunc;
  implementation: string;
  imports: readonly GeneratorDependency[];
  projectName?: string;
  hasSchemaDir: boolean;
  isAllowSyntheticDefaultImports: boolean;
  hasGlobalMutator: boolean;
  hasTagsMutator: boolean;
  hasParamsSerializerOptions: boolean;
  packageJson?: PackageJson;
  output: NormalizedOutputOptions;
}) => Promise<string>;
export type GenerateMockImports = (data: {
  implementation: string;
  imports: readonly GeneratorDependency[];
  projectName?: string;
  hasSchemaDir: boolean;
  isAllowSyntheticDefaultImports: boolean;
  options?: GlobalMockOptions;
}) => string;
export type GeneratorApiBuilder = GeneratorApiOperations & {
  title: GeneratorClientTitle;
  header: GeneratorClientHeader;
  footer: GeneratorClientFooter;
  imports: GeneratorClientImports;
  importsMock: GenerateMockImports;
  /** Hoists shared strict-mock type aliases once per aggregated mock file. */
  finalizeMockImplementation?: (implementation: string, options: FinalizeMockImplementationOptions) => string;
  extraFiles: ClientFileBuilder[];
  /** See {@link WriteSpecBuilder.schemaTagMap}. */
  schemaTagMap?: Map<string, string>;
  /** See {@link WriteSpecBuilder.schemaOutputPlan}. */
  schemaOutputPlan?: SchemaOutputPlan;
};
export declare class ErrorWithTag extends Error {
  tag: string;
  constructor(message: string, tag: string, options?: ErrorOptions);
}
export type OpenApiDocument = Document;
export type OpenApiSchemaObject = SchemaObject;
/**
 * Schema Object excluding JSON Schema boolean schemas (`true` / `false`).
 * - `true` - meaning any value allowed
 * - `false` - meaning no value allowed
 */
export type OpenApiNonBooleanSchemaObject = Exclude<OpenApiSchemaObject, boolean>;
export type OpenApiSchemasObject = Record<string, OpenApiSchemaObject>;
export type OpenApiReferenceObject = ReferenceObject;
export type OpenApiComponentsObject = ComponentsObject;
export type OpenApiPathsObject = PathsObject;
export type OpenApiPathItemObject = PathItemObject;
export type OpenApiResponsesObject = ResponsesObject;
export type OpenApiResponseObject = ResponseObject;
export type OpenApiParameterObject = ParameterObject;
export type OpenApiRequestBodyObject = RequestBodyObject;
export type OpenApiInfoObject = InfoObject;
export type OpenApiExampleObject = ExampleObject;
export type OpenApiOperationObject = OperationObject;
export type OpenApiMediaTypeObject = MediaTypeObject;
export type OpenApiEncodingObject = EncodingObject;
export type OpenApiServerObject = ServerObject;
export type OpenApiPrimitiveSchemaType = PrimitiveSchemaType;
export type OpenApiParameterWithSchemaObject = ParameterWithSchemaObject;
export type OpenApiParameterWithContentObject = ParameterWithContentObject;
export type OpenApiMultiTypeObject = MultiTypeObject;
export type OpenApiSchemaReference<TValue> = SchemaReferenceType<TValue>;
//#endregion
//#region src/constants.d.ts
export declare const generalJSTypes: string[];
export declare const generalJSTypesWithArray: string[];
export declare const VERBS_WITH_BODY: Verbs[];
/**
 * Matches a `${thing}` tag in template-literal source.
 *
 * @deprecated Unsound on generated routes: it cannot tell an interpolation
 * from escaped static text, so it rewrites the `\${x}` produced for a spec
 * path like `/foo${x}` and stops at the first `}` inside an expression.
 * Use {@link parseTemplateLiteral} / {@link mapTemplateExpressions} instead
 * (#3703). Kept for backwards compatibility with custom client builders.
 */
export declare const TEMPLATE_TAG_REGEX: RegExp;
//#endregion
//#region src/generators/component-definition.d.ts
export declare function generateComponentDefinition(responses: OpenApiComponentsObject['responses'] | OpenApiComponentsObject['requestBodies'], context: ContextSpec, suffix: string, prefix?: string): GeneratorSchema[];
//#endregion
//#region src/generators/date-transform.d.ts
type SchemaOrRef = OpenApiSchemaObject | OpenApiReferenceObject;
export interface BuildDateTransformParams {
  schema: SchemaOrRef;
  /** Expression the statements mutate in place, e.g. `data.log` */
  accessor: string;
  context: ContextSpec;
  visitedRefs?: Set<string>;
  /** Nesting level, used for unique loop index names (i0, i1, …) */
  depth?: number;
}
export declare const buildDateTransformStatements: ({ schema, accessor, context, visitedRefs, depth }: BuildDateTransformParams) => string[];
export interface BuildRequestDateSerializeParams {
  schema: SchemaOrRef;
  /** Expression the statements mutate; must already be a copy the caller owns. */
  accessor: string;
  context: ContextSpec;
  visitedRefs?: Set<string>;
  depth?: number;
}
export declare const buildRequestDateSerializeStatements: ({ schema, accessor, context, visitedRefs, depth }: BuildRequestDateSerializeParams) => string[];
export interface GeneratedDateSerializer {
  name: string;
  implementation: string;
}
/**
 * Builds a `serialize{Op}Request` function rendering schema-declared
 * `format: date` fields of a JSON request body as `YYYY-MM-DD`. `format:
 * date-time` is left alone — `Date.prototype.toJSON()` already produces the
 * right thing for an instant. Returns undefined when there is nothing to
 * serialize, so callers emit no code.
 *
 * The returned value is still typed as the model type (`Date` fields and
 * all), but at runtime those `format: date` fields hold `YYYY-MM-DD`
 * strings, not `Date` instances — a wire-level lie that is harmless when the
 * result is passed straight to `data:`, but a caller that reads the result
 * back (rather than only forwarding it) must know the type does not match
 * the value.
 */
export declare const generateRequestDateSerializer: ({ operationName, body, context }: {
  operationName: string;
  body: GetterBody;
  context: ContextSpec;
}) => GeneratedDateSerializer | undefined;
export interface GeneratedDateDeserializer {
  name: string;
  implementation: string;
}
/**
 * Builds a `deserialize{Op}Response` function converting schema-declared
 * date fields of the (single) JSON success response in place. Returns
 * undefined when there is nothing to transform, so callers emit no code.
 */
export declare const generateResponseDateDeserializer: ({ operationName, response, context }: {
  operationName: string;
  response: GetterResponse;
  context: ContextSpec;
}) => GeneratedDateDeserializer | undefined;
//#endregion
//#region src/generators/factory.d.ts
export declare function generateFactory(schema: OpenApiSchemaObject, name: string, context: ContextSpec): {
  model: string;
  imports: GeneratorImport[];
} | undefined;
//#endregion
//#region src/generators/imports.d.ts
interface GenerateImportsOptions {
  imports: readonly GeneratorImport[];
  namingConvention?: NamingConvention;
  importExtension?: string;
}
export declare function generateImports({ imports, namingConvention, importExtension }: GenerateImportsOptions): string;
interface GenerateMutatorImportsOptions {
  mutators: GeneratorMutator[];
  implementation?: string;
  oneMore?: boolean;
}
export declare function generateMutatorImports({ mutators, implementation, oneMore }: GenerateMutatorImportsOptions): string;
interface AddDependencyOptions {
  implementation: string;
  exports: readonly GeneratorImport[];
  dependency: string;
  projectName?: string;
  hasSchemaDir: boolean;
  isAllowSyntheticDefaultImports: boolean;
}
export declare function addDependency({ implementation, ...options }: AddDependencyOptions): string | undefined;
export declare function generateDependencyImports(implementation: string, imports: {
  exports: readonly GeneratorImport[];
  dependency: string;
}[], projectName: string | undefined, hasSchemaDir: boolean, isAllowSyntheticDefaultImports: boolean): string;
export declare function generateVerbImports({ response, body, queryParams, props, headers, params }: GeneratorVerbOptions): GeneratorImport[];
//#endregion
//#region src/generators/input-filters.d.ts
declare const COMPONENT_TYPES: readonly ["schemas", "responses", "parameters", "requestBodies"];
type ComponentType = (typeof COMPONENT_TYPES)[number];
export declare function filteredVerbs(verbs: OpenApiPathItemObject, filters: NormalizedInputOptions['filters']): [string, OpenApiOperationObject][];
export declare const collectReferencedComponents: (spec: OpenApiDocument, tags: (string | RegExp)[], mode: InputFiltersOptions["mode"]) => Record<ComponentType, string[]>;
/**
 * Prune operations that do not reference any of the kept schemas, so only
 * artifacts related to the requested schemas are generated (#3689).
 *
 * An operation is kept when at least one of its (transitively resolved)
 * component references points at a schema matching the include/exclude
 * filters. Operations without any schema references cannot be attributed to
 * the filter and are kept as-is.
 */
export declare function filterPathsBySchemas(spec: OpenApiDocument, schemas: NonNullable<InputFiltersOptions['schemas']>, mode?: InputFiltersOptions['mode']): OpenApiDocument;
//#endregion
//#region src/generators/models-inline.d.ts
export declare function generateModelInline(acc: string, model: string): string;
export declare function generateModelsInline(obj: Record<string, GeneratorSchema[]> | GeneratorSchema[]): string;
//#endregion
//#region src/generators/mutator.d.ts
export declare const BODY_TYPE_NAME = "BodyType";
interface GenerateMutatorOptions {
  output?: string;
  mutator?: NormalizedMutator;
  name: string;
  workspace: string;
  tsconfig?: Tsconfig;
}
export declare function generateMutator({ output, mutator, name, workspace, tsconfig }: GenerateMutatorOptions): Promise<GeneratorMutator | undefined>;
//#endregion
//#region src/generators/options.d.ts
/**
 * Per-parameter Angular query-object serialization strategy, mirroring
 * {@link GetterQueryParam.objectQueryParams}. See issue #3705.
 */
export type AngularObjectParamStrategy = 'flatten' | 'comma' | 'deepObject';
/**
 * Filters query params for Angular's HttpClient.
 *
 * Why: Angular's HttpParams / HttpClient `params` type does not accept `null` or
 * `undefined` values, and arrays must only contain string/number/boolean.
 * Orval models often include nullable query params, so we remove nullish values
 * (including nulls inside arrays) before passing params to HttpClient or a
 * paramsSerializer to avoid runtime and type issues.
 *
 * Required-nullable params (spec `required: true` + `nullable: true`) are the
 * exception: dropping them silently would violate the OpenAPI contract. When a
 * `paramsSerializer` is configured (preserveRequiredNullables), a `null` value
 * is preserved for the serializer to encode. Without a serializer, `null` is
 * instead emitted as an empty string (`''`, wire form `?key=`) so the key
 * still reaches the request. See #3712.
 *
 * Returns an inline IIFE expression. For paths that benefit from a shared helper
 * (e.g. observe-mode branches), prefer getAngularFilteredParamsCallExpression +
 * getAngularFilteredParamsHelperBody instead.
 */
export declare const getAngularFilteredParamsExpression: (paramsExpression: string, requiredNullableParamKeys?: string[], preserveRequiredNullables?: boolean, nonPrimitiveKeys?: string[], objectParamStrategies?: Readonly<Record<string, AngularObjectParamStrategy>>) => string;
/**
 * Returns the body of a standalone `filterParams` helper function
 * to be emitted once in the generated file header, replacing the
 * inline IIFE that was previously duplicated in every method.
 *
 * Pass `{ hasObjectParams: true }` only when at least one operation in the
 * file actually needs the object-serialization overload (issue #3705) —
 * with the flag omitted/false this returns the exact same string as before
 * that feature existed, so files without object query params see zero
 * helper churn.
 *
 * Required-nullable handling: a query param that the spec marks both
 * `required` and `nullable` must still reach the wire when its runtime
 * value is `null`, or the request violates the OpenAPI contract. When a
 * `paramsSerializer` is configured (preserveRequiredNullables), the literal
 * `null` is preserved for the serializer to encode. Without a serializer,
 * `null` is instead emitted as an empty string (`''`, wire form `?key=`) so
 * the key is not silently dropped. See #3712.
 */
export declare const getAngularFilteredParamsHelperBody: ({ hasObjectParams }?: {
  hasObjectParams?: boolean;
}) => string;
/**
 * Returns a call expression to the `filterParams` helper function.
 */
export declare const getAngularFilteredParamsCallExpression: (paramsExpression: string, requiredNullableParamKeys?: string[], preserveRequiredNullables?: boolean, nonPrimitiveKeys?: string[], objectParamStrategies?: Readonly<Record<string, AngularObjectParamStrategy>>) => string;
/**
 * Returns the filter call/IIFE used to massage query params before passing
 * them to Angular's HttpParams. When the user supplied a `paramsFilter`
 * mutator, the built-in `filterParams` is bypassed entirely and the user's
 * function is called with the raw params — they own nullish-stripping and
 * any object/array handling. Otherwise the built-in filter is used (either
 * the shared helper or an inline IIFE), and callers should only pass
 * `nonPrimitiveKeys` when a downstream serializer or custom consumer can
 * legally handle raw object/array values.
 */
export declare const buildAngularParamsFilterExpression: ({ paramsExpression, requiredNullableParamKeys, preserveRequiredNullables, nonPrimitiveKeys, objectParamStrategies, paramsFilter, useSharedHelper }: {
  paramsExpression: string;
  requiredNullableParamKeys?: string[];
  preserveRequiredNullables?: boolean;
  nonPrimitiveKeys?: string[];
  objectParamStrategies?: Readonly<Record<string, AngularObjectParamStrategy>>;
  paramsFilter?: GeneratorMutator;
  useSharedHelper: boolean;
}) => string;
/**
 * Computes the gated object-serialization strategy map for a single
 * operation's query params (issue #3705).
 *
 * Strategies are suppressed — returning `{}`, restoring the pre-#3705
 * dropping behavior — whenever:
 * - a `paramsFilter` mutator is configured (it bypasses the built-in filter
 *   entirely and owns raw object/array handling itself), or
 * - a `paramsSerializer` mutator is configured (it receives the raw object
 *   via the existing `nonPrimitiveKeys` passthrough instead), or
 * - `override.angular.queryObjectSerialization` is `'legacy'`.
 */
export declare const getAngularObjectParamStrategies: ({ queryParams, paramsSerializer, paramsFilter, queryObjectSerialization }: {
  queryParams?: GetterQueryParam;
  paramsSerializer?: GeneratorMutator;
  paramsFilter?: GeneratorMutator;
  queryObjectSerialization: "spec" | "legacy";
}) => Readonly<Record<string, AngularObjectParamStrategy>>;
interface GenerateFormDataAndUrlEncodedFunctionOptions {
  body: GetterBody;
  formData?: GeneratorMutator;
  formUrlEncoded?: GeneratorMutator;
  isFormData: boolean;
  isFormUrlEncoded: boolean;
}
export declare function generateBodyOptions(body: GetterBody, isFormData: boolean, isFormUrlEncoded: boolean): string | undefined;
interface GenerateAxiosOptions {
  response: GetterResponse;
  isExactOptionalPropertyTypes: boolean;
  angularObserve?: 'body' | 'events' | 'response';
  angularParamsRef?: string;
  requiredNullableQueryParamKeys?: string[];
  nonPrimitiveQueryParamKeys?: string[];
  objectQueryParamStrategies?: Readonly<Record<string, AngularObjectParamStrategy>>;
  queryParams?: GeneratorSchema;
  headers?: GeneratorSchema;
  requestOptions?: object | boolean;
  hasSignal: boolean;
  hasSignalParam?: boolean;
  isAngular: boolean;
  paramsSerializer?: GeneratorMutator;
  paramsSerializerOptions?: ParamsSerializerOptions;
  paramsFilter?: GeneratorMutator;
}
interface GenerateAxiosUrlOptions {
  functionName: string;
  propsImplementation: string;
  route: string;
  axiosRef: string;
  hasQueryParams: boolean;
  beforeReturn?: string;
  paramsSerializer?: string;
  paramsSerializerOptions?: ParamsSerializerOptions;
}
/**
 * Generates an Axios URL helper without applying runtime request options.
 *
 * Axios owns query-string serialization, so getUri is used to keep the helper
 * aligned with the request's paramsSerializer and Axios defaults. A derived
 * instance clears default params while retaining the configured serializer;
 * an empty baseURL keeps the helper's result at the generated OpenAPI route
 * instead of turning it into the final transport URL for a configured Axios
 * instance.
 */
export declare function generateAxiosUrl({ functionName, propsImplementation, route, axiosRef, hasQueryParams, beforeReturn, paramsSerializer, paramsSerializerOptions }: GenerateAxiosUrlOptions): string;
export declare function generateAxiosOptions({ response, isExactOptionalPropertyTypes, angularObserve, angularParamsRef, requiredNullableQueryParamKeys, nonPrimitiveQueryParamKeys, objectQueryParamStrategies, queryParams, headers, requestOptions, hasSignal, hasSignalParam, isAngular, paramsSerializer, paramsSerializerOptions, paramsFilter }: GenerateAxiosOptions): string;
interface GenerateOptionsOptions {
  route: string;
  body: GetterBody;
  angularObserve?: 'body' | 'events' | 'response';
  angularParamsRef?: string;
  headers?: GetterQueryParam;
  queryParams?: GetterQueryParam;
  /**
   * Per-parameter object-serialization strategies (issue #3705), already
   * gated by the caller for `override.angular.queryObjectSerialization` and
   * any configured `paramsFilter`/`paramsSerializer`.
   */
  objectQueryParamStrategies?: Readonly<Record<string, AngularObjectParamStrategy>>;
  response: GetterResponse;
  verb: Verbs;
  requestOptions?: object | boolean;
  isFormData: boolean;
  isFormUrlEncoded: boolean;
  isAngular?: boolean;
  isExactOptionalPropertyTypes: boolean;
  hasSignal: boolean;
  hasSignalParam?: boolean;
  paramsSerializer?: GeneratorMutator;
  paramsSerializerOptions?: ParamsSerializerOptions;
  paramsFilter?: GeneratorMutator;
}
export declare function generateOptions({ route, body, angularObserve, angularParamsRef, headers, queryParams, objectQueryParamStrategies, response, verb, requestOptions, isFormData, isFormUrlEncoded, isAngular, isExactOptionalPropertyTypes, hasSignal, hasSignalParam, paramsSerializer, paramsSerializerOptions, paramsFilter }: GenerateOptionsOptions): string;
export declare function generateBodyMutatorConfig(body: GetterBody, isFormData: boolean, isFormUrlEncoded: boolean): string;
export declare function generateQueryParamsAxiosConfig(response: GetterResponse, isAngular: boolean, requiredNullableQueryParamKeys?: string[], queryParams?: GetterQueryParam, paramsFilter?: GeneratorMutator): string;
interface GenerateMutatorConfigOptions {
  route: string;
  body: GetterBody;
  headers?: GetterQueryParam;
  queryParams?: GetterQueryParam;
  response: GetterResponse;
  verb: Verbs;
  isFormData: boolean;
  isFormUrlEncoded: boolean;
  hasSignal: boolean;
  hasSignalParam?: boolean;
  isExactOptionalPropertyTypes: boolean;
  isAngular?: boolean;
  paramsFilter?: GeneratorMutator;
}
export declare function generateMutatorConfig({ route, body, headers, queryParams, response, verb, isFormData, isFormUrlEncoded, hasSignal, hasSignalParam, isExactOptionalPropertyTypes, isAngular, paramsFilter }: GenerateMutatorConfigOptions): string;
export declare function generateMutatorRequestOptions(requestOptions: boolean | object | undefined, hasSecondArgument: boolean): string;
export declare function generateFormDataAndUrlEncodedFunction({ body, formData, formUrlEncoded, isFormData, isFormUrlEncoded }: GenerateFormDataAndUrlEncodedFunctionOptions): string;
//#endregion
//#region src/generators/parameter-definition.d.ts
export declare function generateParameterDefinition(parameters: OpenApiComponentsObject['parameters'], context: ContextSpec, suffix: string, prefix?: string): GeneratorSchema[];
//#endregion
//#region src/generators/runtime-validation.d.ts
/**
 * The syntactic shape a validation snippet has to take at the call site it is
 * spliced into. Each generator emits validation at one of these four shapes:
 *
 * - `rxjs-map`: a trailing `.pipe(map(...))` operator chained onto an observable
 *   (Angular `HttpClient`, `angular-query`). The mapped value is named `data`.
 * - `clone-expression`: a value expression injected into a larger expression
 *   such as `response.clone({ body: <here> })`. Multi-statement `both` bodies
 *   are IIFE-wrapped so they stay expressions.
 * - `fetch-assign`: a value expression assigned to `const data = <here>` inside
 *   the generated `fetch` function. Also IIFE-wrapped for `both`.
 * - `parse-fn`: the value of Angular `httpResource`'s native `parse:` option —
 *   `throw` emits a bare `Schema.parse` reference, `both` an arrow function.
 */
export type RuntimeValidationEmitContext = 'rxjs-map' | 'clone-expression' | 'fetch-assign' | 'parse-fn';
export interface EmitResponseValidationOptions {
  /** Reference to the Zod schema value, e.g. `PetsSchema`. */
  schemaRef: string;
  /** Operation name, surfaced in the `both` strategy's `console.error` message. */
  operationName: string;
  strategy: RuntimeValidationStrategy;
  context: RuntimeValidationEmitContext;
  /**
   * Source expression to validate. Required for `clone-expression` and
   * `fetch-assign`; ignored for `rxjs-map` (always `data`) and `parse-fn`
   * (always the arrow's `raw` parameter).
   */
  inputExpression?: string;
}
/**
 * Emits the response-validation snippet for a single call site.
 *
 * The `throw` strategy is byte-identical to the historical inline
 * `Schema.parse(...)` emission, which keeps existing snapshots unchanged.
 */
export declare const emitResponseValidation: ({ schemaRef, operationName, strategy, context, inputExpression }: EmitResponseValidationOptions) => string;
export interface EmitRequestBodyValidationOptions {
  /** Reference to the Zod schema value, e.g. `CreatePetsBody`. */
  schemaRef: string;
  /** Operation name, surfaced in the `both` strategy's `console.error` message. */
  operationName: string;
  strategy: RuntimeValidationStrategy;
  /** The body argument to parse, e.g. `createPetsBody`. */
  inputExpression: string;
  /** An omitted optional body is passed through instead of parsed. */
  isOptional?: boolean;
}
/**
 * Emits an expression that parses a request body before it is sent. `throw`
 * is a bare `Schema.parse(...)`; `both` logs the raw `ZodError` and re-throws,
 * like its response counterpart.
 */
export declare const emitRequestBodyValidation: ({ schemaRef, operationName, strategy, inputExpression, isOptional }: EmitRequestBodyValidationOptions) => string;
/**
 * Normalizes the user-facing `runtimeValidation` config surface
 * (`boolean | { strategy }`) into the canonical `{ enabled, strategy }` object
 * consumed by the generators.
 *
 * Idempotent: an already-normalized value is returned unchanged, so it is safe
 * to call on an inherited (already-normalized) value — e.g. when a per-operation
 * `query` override inherits the normalized global default.
 */
export declare const normalizeRuntimeValidation: (value: RuntimeValidation | NormalizedRuntimeValidation | undefined) => NormalizedRuntimeValidation;
/**
 * Angular variant of {@link normalizeRuntimeValidation}: also resolves the
 * `requestBodies` opt-in, which only the object form can switch on.
 * Idempotent, like the shared normalizer.
 */
export declare const normalizeAngularRuntimeValidation: (value: AngularRuntimeValidation | NormalizedAngularRuntimeValidation | undefined) => NormalizedAngularRuntimeValidation;
/**
 * Indicates whether a response definition names a primitive (non-schema) type,
 * which runtime validation skips.
 */
export declare const isPrimitiveResponseType: (t: string | undefined) => boolean;
/**
 * Whether an inline response describes scalar JSON data. Inspect the source
 * schema rather than its TypeScript definition: `integer` and `number` both
 * become `number`, while nullable scalars and enums need their full schema.
 * Missing/unconstrained schemas and arrays are deliberately left alone.
 */
export declare const isPrimitiveResponseSchema: (schema: OpenApiSchemaObject) => boolean;
/**
 * Indicates whether the response imports carry a schema for the given type
 * name — the precondition for emitting a `Schema.parse`/`safeParse` call.
 */
export declare const hasSchemaImport: (imports: readonly {
  name: string;
}[], typeName: string | undefined) => boolean;
/**
 * Maps a response type name to the identifier its Zod schema value is bound to
 * at the call site. `Error` collides with the global constructor, so validated
 * call sites reference that schema as `ErrorSchema`.
 */
export declare const getSchemaValueRef: (typeName: string) => string;
/**
 * Maps a schema type name to its Zod output-type alias (`${typeName}Output`),
 * emitted next to every schema in zod-schemas mode. A validated response
 * returns `zod.output` at runtime, so its declared type must reference this
 * alias — the bare schema name aliases `zod.input`, which diverges under
 * `coerce`, `useDates`, defaults and transforms.
 */
export declare const getSchemaOutputTypeRef: (typeName: string) => string;
/**
 * Rewrites a verb's response imports for a runtime-validated response: the
 * schema import becomes a value import (the generated code calls
 * `parse`/`safeParse` on it), and the schema's `Output` type alias is imported
 * for the declared response type. `zodBaseName` routes the alias import to the
 * base schema's `.zod` file in per-file (`indexFiles: false`) layouts.
 *
 * `includeOutputType: false` keeps the value-import flip but skips the alias —
 * for call sites where validation is delegated (e.g. a custom mutator handed
 * the schema via `includeZodSchemaInArguments`) and the declared type is
 * intentionally left as the schema (input) name.
 */
export declare const rewriteImportsForResponseValidation: (imports: readonly GeneratorImport[], responseType: string, { includeOutputType }?: {
  includeOutputType?: boolean;
}) => GeneratorImport[];
/**
 * How a validated array response is composed from its element schema.
 *
 * An inline `type: array` response resolves to the definition `Item[]`, and
 * every gate into Zod runtime validation compares that definition to the
 * response import names verbatim. `Item[]` never equals `Item`, so the whole
 * validation branch is skipped while a `$ref` to a *named* array component
 * validates normally (#3718, #4106). The element carries the generated schema;
 * the array wrapper is composed at the use site.
 */
export interface ArrayResponseSchema {
  /** Element schema name, e.g. `Item` — the import to promote to a value. */
  elementName: string;
  /** Expression to call `.parse` on, e.g. `zod.array(Item)`. */
  schemaRef: string;
  /** Declared type of the parsed value, e.g. `ItemOutput[]`. */
  outputTypeRef: string;
}
/**
 * Resolves the array-response shape described by {@link ArrayResponseSchema},
 * or `undefined` when the definition is not a validatable array.
 *
 * Deliberately narrow. A primitive element (`string[]`) has no generated schema
 * to compose from, and a nested array (`Item[][]`) is left alone rather than
 * guessed at — both keep their current unvalidated output.
 *
 * @param toValueRef Maps the element name to the identifier its schema value is
 *   bound to at the call site (`Error` is emitted as `ErrorSchema`).
 */
export declare const getArrayResponseSchema: (imports: readonly {
  name: string;
}[], definition: string | undefined, toValueRef?: (typeName: string) => string) => ArrayResponseSchema | undefined;
/**
 * Module specifier for the `zod` namespace import that composed array
 * expressions reference. Mini ships its constructors from a separate entry
 * point, and only the functional `zod.array(...)` form exists there — which is
 * why the composed expression is built that way rather than as `Item.array()`.
 */
export declare const getZodNamespaceImportSource: (override?: NormalizedOverrideOutput) => string;
/** The namespace import a composed `zod.array(...)` expression requires. */
export declare const getZodNamespaceImport: (override?: NormalizedOverrideOutput) => {
  name: string;
  values: boolean;
  namespaceImport: boolean;
  importPath: string;
};
//#endregion
//#region src/generators/schema-definition.d.ts
/**
 * Extract all types from #/components/schemas
 */
export declare function generateSchemasDefinition(schemas: OpenApiSchemasObject | undefined, context: ContextSpec, suffix: string, filters?: InputFiltersOptions, prefix?: string): GeneratorSchema[];
//#endregion
//#region src/generators/verbs-options.d.ts
export interface GenerateVerbOptionsParams {
  verb: Verbs;
  output: NormalizedOutputOptions;
  operation: OpenApiOperationObject;
  route: string;
  pathRoute: string;
  verbParameters?: OpenApiPathItemObject['parameters'];
  components?: OpenApiComponentsObject;
  context: ContextSpec;
  reservedOperationNames?: Set<string>;
  reservedTypeNames?: Set<string>;
}
export declare function generateVerbOptions({ verb, output, operation, route, pathRoute, verbParameters, context, reservedOperationNames, reservedTypeNames }: GenerateVerbOptionsParams): Promise<GeneratorVerbOptions[]>;
export interface GenerateVerbsOptionsParams {
  verbs: OpenApiPathItemObject;
  input: NormalizedInputOptions;
  output: NormalizedOutputOptions;
  route: string;
  pathRoute: string;
  context: ContextSpec;
  /** See {@link GenerateVerbOptionsParams.reservedOperationNames}. */
  reservedOperationNames?: Set<string>;
  /** See {@link GenerateVerbOptionsParams.reservedTypeNames}. */
  reservedTypeNames?: Set<string>;
}
export declare function generateVerbsOptions({ verbs, input, output, route, pathRoute, context, reservedOperationNames, reservedTypeNames }: GenerateVerbsOptionsParams): Promise<GeneratorVerbsOptions>;
//#endregion
//#region src/getters/object.d.ts
/**
 * True when `propertyNames` narrows the key type to a finite set of literals
 * — an inline `enum`/`const`, or a `$ref` to a string enum/const — the only
 * cases `getObject` types as `Partial<Record<K, V>>` rather than a plain
 * index signature. Anything else under `propertyNames` (`format`, `pattern`,
 * `minLength`, or its absence) types as `[key: string]: V`, which an
 * `Object.keys` loop can index without a compile error. Callers outside this
 * module (the date transform's map-traversal gate) should use this instead
 * of re-deriving the predicate, so both stay in lockstep with `getObject`.
 */
export declare function hasNarrowedPropertyNames(item: OpenApiSchemaObject, context: ContextSpec): boolean;
/**
 * Context for form request body (multipart/form-data and
 * application/x-www-form-urlencoded) type generation.
 * Discriminated union with two states:
 *
 * 1. `{ atPart: false, encoding }` - At form root, before property iteration
 *    - May traverse through allOf/anyOf/oneOf to reach properties
 *    - Carries encoding map so getObject can look up `encoding[key]`
 *
 * 2. `{ atPart: true, partContentType }` - At a multipart part (top-level property)
 *    - `partContentType` = Encoding Object's `contentType` for this part
 *    - Used by getScalar for file type detection (precedence over contentMediaType)
 *    - Arrays pass this through to items; combiners inside arrays also get context
 *
 * `urlEncoded` marks an application/x-www-form-urlencoded body. Such bodies are
 * built with URLSearchParams, whose values are always strings, so getScalar
 * keeps file/binary fields as `string` instead of `Blob` (#1624).
 *
 * `undefined` means not in form context (or nested inside plain object field = JSON)
 */
export type FormDataContext = {
  atPart: false;
  encoding: Record<string, {
    contentType?: string;
  }>;
  urlEncoded?: boolean;
} | {
  atPart: true;
  partContentType?: string;
  urlEncoded?: boolean;
};
interface GetObjectOptions {
  item: OpenApiSchemaObject;
  name?: string;
  context: ContextSpec;
  nullable: string;
  /**
   * Multipart/form-data context for file type handling.
   * @see FormDataContext
   */
  formDataContext?: FormDataContext;
}
/**
 * Return the output type from an object
 *
 * @param item item with type === "object"
 */
export declare function getObject({ item, name, context, nullable, formDataContext }: GetObjectOptions): ScalarValue;
//#endregion
//#region src/getters/array.d.ts
interface GetArrayOptions {
  schema: OpenApiSchemaObject;
  name?: string;
  context: ContextSpec;
  formDataContext?: FormDataContext;
}
/**
 * Return the output type from an array
 *
 * @param item item with type === "array"
 */
export declare function getArray({ schema, name, context, formDataContext }: GetArrayOptions): ScalarValue;
//#endregion
//#region src/getters/body.d.ts
interface GetBodyOptions {
  requestBody: OpenApiReferenceObject | OpenApiRequestBodyObject;
  operationName: string;
  context: ContextSpec;
  contentType?: OverrideOutputContentType;
}
export declare function getBody({ requestBody, operationName, context, contentType }: GetBodyOptions): GetterBody;
/**
 * Returns per-content-type bodies when `splitByContentType` is enabled.
 * Each entry includes a `contentTypeSuffix` for generating distinct function names.
 */
export declare function getBodiesByContentType({ requestBody, operationName, context, contentType }: GetBodyOptions): (GetterBody & {
  contentTypeSuffix: string;
})[];
//#endregion
//#region src/getters/combine.d.ts
type Separator = 'allOf' | 'anyOf' | 'oneOf';
export declare function combineSchemas({ name, schema: schemaInput, separator, context, nullable, formDataContext }: {
  name?: string;
  schema: OpenApiSchemaObject;
  separator: Separator;
  context: ContextSpec;
  nullable: string;
  formDataContext?: FormDataContext;
}): ScalarValue;
//#endregion
//#region src/getters/discriminators.d.ts
export declare function resolveDiscriminators(schemas: OpenApiSchemasObject, context: ContextSpec): OpenApiSchemasObject;
//#endregion
//#region src/getters/enum.d.ts
/** Bridge type for enum values from AnyOtherAttribute-infected schema extensions */
type SchemaEnumValue = string | number | boolean | null;
/**
 * Normalized representation of an enum member, independent of how it was
 * authored in the OpenAPI schema (vendor extensions or `oneOf` + `const`).
 *
 * Used as the shared model for TypeScript and Zod code generation.
 */
export type EnumMember = {
  value: SchemaEnumValue;
  name?: string;
  description?: string;
  deprecated?: boolean;
};
/**
 * Metadata describing the type and logical structure of an enum.
 */
export interface EnumValueInfo {
  isHomogeneous: boolean;
  isBoolean: boolean;
}
interface CombinedEnumInput {
  value: string;
  isRef: boolean;
  schema: OpenApiSchemaObject | undefined;
  enumMembers?: EnumMember[];
}
interface CombinedEnumValue {
  value: string;
  valueImports: string[];
  hasNull: boolean;
}
export declare function getEnumMembers(schemaObject: OpenApiSchemaObject | undefined, metadataObject?: OpenApiSchemaObject | undefined): EnumMember[];
/**
 * Generates the implementation of an enum from normalized enum members.
 */
export declare function getEnumImplementation(members: EnumMember[], options: {
  enumGenerationType: EnumGeneration;
  enumNamingConvention?: NamingConvention | undefined;
}): string;
export declare function getEnum(enumMembers: EnumMember[], enumName: string, nullable: boolean, enumGenerationType: EnumGeneration, enumNamingConvention?: NamingConvention): string;
/**
 * Whether a reference to the enum generated by `getEnum` has to add `| null`
 * itself. The const type alias already carries it, and a union carries it when
 * `null` is one of its members, but a native `enum` cannot hold `null` (#4203).
 */
export declare function isEnumReferenceMissingNull(enumMembers: EnumMember[], nullable: boolean, enumGenerationType: EnumGeneration): boolean;
/**
 * Checks whether any enum member has a name, description, or deprecation metadata.
 */
export declare function hasEnumMetadata(members: EnumMember[]): boolean;
export declare function getEnumValueInfo(members: EnumMember[]): EnumValueInfo;
export declare function getEnumUnion(enumMembers: EnumMember[]): string;
/**
 * Builds the runtime value for a combined enum.
 *
 * Each input represents an individually resolved enum branch. Inline branches
 * are normalized into enum members so their names, descriptions, and
 * deprecation metadata can be preserved in the generated enum object.
 *
 * Referenced enum branches keep the existing spread and import behavior.
 */
export declare function getCombinedEnumValue(inputs: CombinedEnumInput[]): CombinedEnumValue;
//#endregion
//#region src/getters/form-data-components.d.ts
/**
 * The {@link FormDataContext} each shared `components.schemas` entry should be
 * generated with, keyed by component name. A schema missing from the map is
 * never used as a `multipart/form-data` request body.
 *
 * Inline multipart bodies get their context from `getResReqContentTypes`,
 * which is what types their binary parts as `Blob | File` and applies the
 * media type `encoding`. A body aliased behind
 * `$ref: '#/components/schemas/upload'` is instead emitted once by
 * `generateSchemasDefinition`, far away from the operation that gives it its
 * media type — so it used to fall back to the context-free `Blob`. This index
 * carries the missing media-type information over to the shared model (#4177).
 *
 * Only multipart is indexed. `application/x-www-form-urlencoded` deliberately
 * stays out: its context narrows binary fields to `string`, and the shared
 * model may well be referenced by a multipart endpoint too, where `Blob` is
 * the correct type (#2410).
 *
 * Built once per `generateSchemasDefinition` run and passed down, rather than
 * memoized per spec: the document is free to change between runs, and a cache
 * keyed on its identity would hand back an index describing the old paths.
 */
export declare function getFormDataComponentContexts(context: ContextSpec): Map<string, FormDataContext>;
//#endregion
//#region src/getters/keys.d.ts
export declare function getKey(key: string): string;
/**
 * Emits a schema-derived name as a TypeScript *string literal type*
 * (`'petId'`), for the key positions of `Pick`, `Omit` and `Extract`.
 *
 * The sibling {@link getKey} covers the property-key position, where a valid
 * identifier may be emitted bare. A string literal type has no bare form —
 * `Extract<keyof T, petId>` is a type *reference*, not the literal `'petId'` —
 * so the name is always quoted, and therefore always has to be escaped. Left
 * unescaped, a `'` in a schema name closes the literal and the rest of the
 * name is emitted as sibling top-level source in `export type X = …;`, which
 * survives type erasure and runs when the generated module is imported
 * (GHSA-6h9g-hcv4-66p6).
 */
export declare function getStringLiteralType(name: string): string;
/**
 * Joins schema-derived names into a union of string literal types
 * (`'a' | 'b'`). See {@link getStringLiteralType}.
 */
export declare function getStringLiteralTypeUnion(names: readonly string[]): string;
/**
 * Whether a schema-derived name can be emitted as a local binding
 * (`const name`, a destructuring target): a valid identifier that is not a
 * reserved word in strict mode.
 */
export declare function isBindingIdentifier(name: string): boolean;
/**
 * Emits a property access for a possibly non-identifier name: dot access for
 * valid identifier names (`.petId`), quoted bracket access otherwise
 * (`['scope.id']`).
 */
export declare function getPropertyAccessor(name: string): string;
/**
 * Returns a Set of property keys that, after applying `conventionName`,
 * would collide with another key (e.g. `first_name` and `firstName` both
 * convert to `firstName` under camelCase). The generator falls back to the
 * original (unique) schema key for these so the emitted type stays
 * collision-free. Returns an empty Set when no convention is configured.
 */
export declare function getPropertyNameCollisionKeys(keys: string[], convention?: (name: string) => string): Set<string>;
//#endregion
//#region src/getters/operation.d.ts
export declare function getOperationId(operation: OpenApiOperationObject, route: string, verb: Verbs): string;
//#endregion
//#region src/getters/parameters.d.ts
interface GetParametersOptions {
  parameters: (OpenApiReferenceObject | OpenApiParameterObject)[];
  context: ContextSpec;
}
export declare function getParameters({ parameters, context }: GetParametersOptions): GetterParameters;
//#endregion
//#region src/getters/params.d.ts
/**
 * Return the name of every `{param}` in an OpenAPI path, in spec spelling.
 *
 * Uses the same tokenizer as the route generators ({@link parseRoutePath}), so
 * a placeholder is reported here if and only if it becomes an interpolation in
 * the generated route. Text that only looks like a placeholder — `{a+b}`,
 * `{}`, or a `${...}` block written in the spec — is static text and is not
 * reported (#3703).
 *
 * @example
 * ```
 * getParamsInPath("/pet/{category}/{name}/");
 * // => ["category", "name"]
 * ```
 * @param path an OpenAPI path, not a generated route
 */
export declare function getParamsInPath(path: string): string[];
interface GetParamsOptions {
  /** The OpenAPI path (`/pets/{petId}`), not the generated route. */
  pathRoute: string;
  pathParams?: GetterParameters['query'];
  operationId: string;
  context: ContextSpec;
  output: NormalizedOutputOptions;
}
export declare function getParams({ pathRoute, pathParams, operationId, context, output }: GetParamsOptions): GetterParams;
//#endregion
//#region src/getters/props.d.ts
interface GetPropsOptions {
  body: GetterBody;
  queryParams?: GetterQueryParam;
  params: GetterParams;
  operationName: string;
  headers?: GetterQueryParam;
  context: ContextSpec;
}
export declare function getProps({ body, queryParams, params, operationName, headers, context }: GetPropsOptions): GetterProps;
//#endregion
//#region src/getters/query-params.d.ts
interface GetQueryParamsOptions {
  queryParams: GetterParameters['query'];
  operationName: string;
  context: ContextSpec;
  suffix?: string;
}
export declare function getQueryParams({ queryParams, operationName, context, suffix }: GetQueryParamsOptions): GetterQueryParam | undefined;
//#endregion
//#region src/getters/ref.d.ts
/**
 * `$ref`s targeting these sections under `#/components/...` are emitted as
 * named TypeScript imports (e.g. `import type { Pet } from './model'`).
 * Refs to any other location — for example `#/paths/.../schema` produced by
 * JSON-Schema-Ref-Parser `bundle()` — have no corresponding `export type`
 * and must be inlined by the resolver. See issue #398.
 */
export declare const NAMED_COMPONENT_SECTIONS: readonly ["schemas", "responses", "parameters", "requestBodies"];
type RefComponent = (typeof NAMED_COMPONENT_SECTIONS)[number];
export declare const RefComponentSuffix: Record<RefComponent, string>;
/**
 * True iff `ref` targets a named slot eligible for emission as a TypeScript
 * import. Used by `resolveValue` to decide between named import vs inlining
 * the resolved schema.
 */
export declare function isComponentRef(ref: string): boolean;
export interface RefInfo {
  name: string;
  originalName: string;
  refPaths?: string[];
}
/**
 * Return the output type from the $ref
 *
 * @param $ref
 */
export declare function getRefInfo($ref: string, context: ContextSpec): RefInfo;
/**
 * Extracts the anchor name from a fragment-only `$dynamicRef` (e.g. `#category` → `category`).
 *
 * Returns `undefined` for external-document `$dynamicRef` values (e.g. `other.json#anchor`)
 * which are not supported.
 */
export declare function getDynamicAnchorName(dynamicRef: string): string | undefined;
//#endregion
//#region src/getters/res-req-types.d.ts
export declare function getResReqTypes(responsesOrRequests: [string, OpenApiReferenceObject | OpenApiResponseObject | OpenApiRequestBodyObject][], name: string, context: ContextSpec, defaultType?: string, uniqueKey?: (item: ResReqTypesValue, index: number, data: ResReqTypesValue[]) => unknown, generatePrimitiveSchemas?: boolean): ResReqTypesValue[];
/**
 * Determine the responseType option based on success content types only.
 * This avoids error-response content types influencing the responseType.
 */
export declare function getSuccessResponseType(response: GetterResponse): 'blob' | 'text' | undefined;
/**
 * Get the default content type from a list of content types.
 * Priority: application/json > any JSON-like type > first in list
 *
 * @param contentTypes - Array of content types from OpenAPI spec
 * @returns The default content type to use
 */
export declare function getDefaultContentType(contentTypes: string[]): string;
/**
 * Determines whether a schema is object-shaped once `allOf` composition is
 * resolved, without assuming "has allOf" implies "is an object" (allOf is a
 * generic AND-combinator in JSON Schema and can just as validly compose a
 * constrained string or number). Classifies as object-like only when a
 * resolved branch positively establishes an object shape (own `type:
 * object`, `properties`, `additionalProperties`, or a nested allOf member
 * that itself resolves to an object) — an inconclusive/scalar result never
 * defaults to "object".
 */
export declare function isEffectivelyObjectSchema(schema: OpenApiSchemaObject, context: ContextSpec, seen?: Set<OpenApiSchemaObject>): boolean;
/**
 * Collects a schema's own `properties`, merged with any `properties`
 * reachable through `allOf` composition (recursively, following `$ref`s).
 * A pure wrapper schema (`{ allOf: [{ $ref: ... }] }`) has no `properties`
 * of its own — its fields only exist behind the allOf member — so a plain
 * `schema.properties` read misses them entirely.
 */
export declare function collectPropertiesThroughAllOf(schema: OpenApiSchemaObject, context: ContextSpec, seen?: Set<OpenApiSchemaObject>): Record<string, OpenApiSchemaObject | OpenApiReferenceObject>;
/**
 * Same reasoning as {@link collectPropertiesThroughAllOf}, but for
 * `required`: a pure `allOf` wrapper schema has no `required` array of its
 * own, so a plain `schema.required` read loses required-ness for every
 * field that only exists behind the allOf composition.
 */
export declare function collectRequiredThroughAllOf(schema: OpenApiSchemaObject, context: ContextSpec, seen?: Set<OpenApiSchemaObject>): string[];
//#endregion
//#region src/getters/response.d.ts
interface GetResponseOptions {
  responses: OpenApiResponsesObject;
  operationName: string;
  context: ContextSpec;
  contentType?: OverrideOutputContentType;
  generatePrimitiveSchemas?: boolean;
}
export declare function getResponse({ responses, operationName, context, contentType, generatePrimitiveSchemas }: GetResponseOptions): GetterResponse;
//#endregion
//#region src/getters/route.d.ts
/**
 * One piece of an OpenAPI path, in the spec's own vocabulary: either static
 * text (raw and unescaped) or a `{name}` path parameter. Every route emitted
 * by orval is built from these tokens, so the decision "is this a parameter?"
 * is made exactly once, against the spec path, and never re-derived from the
 * generated source afterwards (#3703).
 */
export type RouteToken = {
  kind: 'literal';
  value: string;
} | {
  kind: 'param';
  name: string;
};
/**
 * Tokenizes an OpenAPI path into static text and `{name}` parameters.
 *
 * Two lexing rules keep spec content from turning into generated syntax:
 *
 * - A `$` immediately followed by `{` consumes both characters as static text,
 *   so a `${...}` block written in a spec path is never read as a parameter.
 *   This is shared policy for every consumer (template-literal, Hono and MSW
 *   routes) and the reason `/v1/some${petId}/path` cannot smuggle an
 *   interpolation into the generated client.
 * - A `{` that is not followed by a non-empty `[\w.*-]+}` name is static text,
 *   so a malformed `{}` stays literal instead of emitting an invalid `${}`.
 */
export declare const parseRoutePath: (path: string) => RouteToken[];
/**
 * Sanitizes an OpenAPI path-parameter name while preserving the spec's
 * spelling: keeps word characters, underscores, dashes and dots, strips
 * everything else, and prefixes ES5 keywords with an underscore. Use this
 * when the emitted name must match the spec (e.g. Hono routes).
 */
export declare const sanitizePathParamName: (name: string) => string;
/**
 * Derives the generated JS identifier for an OpenAPI path-parameter name
 * (`scope.id` → `scopeId`, `_id` → `id`, `class` → `_class`). This is the
 * single source of truth for param variable names: the emitted route
 * interpolations, the generated function arguments and the spec-parameter
 * matching must all agree on it.
 */
export declare const camelPathParamName: (name: string) => string;
/**
 * Converts every `{param}` in an OpenAPI path to `:param` (Hono/MSW style
 * routes). `formatParamName` maps the raw OpenAPI parameter name to the
 * emitted one (`sanitizePathParamName` or `camelPathParamName`).
 */
export declare const toColonRoutePath: (path: string, formatParamName: (rawName: string) => string) => string;
/**
 * Re-escape a route fragment that {@link getRoute} already escaped for a
 * backtick template literal so it is safe inside a *single-quoted* literal.
 *
 * `jsesc(..., { quotes: 'backtick' })` neutralizes backslashes, line
 * terminators, backticks and `${`, but deliberately leaves `'` alone — it is
 * not special in a backtick context. Any consumer that drops that output into
 * a single-quoted literal has to escape the quote itself, or a `'` in the spec
 * path closes the literal and the remainder of the path is emitted as
 * executable code (GHSA-5g7p-r63h-5vfw).
 *
 * Only `'` is escaped here: the backslashes jsesc already emitted must not be
 * doubled a second time, which is why `jsStringLiteralEscape` is the wrong
 * tool for an already-escaped route — use that one when the input is raw spec
 * text.
 */
export declare const escapeRouteForSingleQuotes: (route: string) => string;
/**
 * Converts an OpenAPI path (`{param}`) to a template-literal route (`${param}`),
 * escaping static text with jsesc for safe embedding in backtick strings.
 * The `route` arg must be a raw OpenAPI path; a non-empty route always emits
 * with a leading `/`.
 */
export declare function getRoute(route: string): string;
export declare function resolveServerUrl(servers: OpenApiServerObject[] | undefined, options: {
  index?: number;
  variables?: Record<string, string | VariableRuntimeValue>;
}): string;
/**
 * Prepends a base URL to an already-processed route.
 *
 * `route` must be the output of {@link getRoute} (already escaped for template
 * literals). This function does NOT re-escape it — jsesc is not idempotent, so
 * escaping twice would double the backslashes. Only the server URL from
 * `getBaseUrlFromSpecification` is escaped here, after variable substitution.
 */
export declare function getFullRoute(route: string, servers: OpenApiServerObject[] | undefined, baseUrl: string | BaseUrlFromConstant | BaseUrlFromSpec | BaseUrlRuntime | undefined): string;
/**
 * Returns `GeneratorImport` entries for {@link BaseUrlRuntime.imports} when `baseUrl` is a runtime config.
 *
 * Defaults `values` to true so symbols in `runtime` emit as value imports in the
 * generated client. Set `values: false` explicitly only for unusual cases (e.g.
 * type-only symbols referenced from the expression).
 */
export declare function getBaseUrlRuntimeImports(baseUrl?: NormalizedOutputOptions['baseUrl']): GeneratorImport[];
export declare const wrapRouteParameters: (route: string, prepend: string, append: string, skip?: Set<string>, only?: Set<string>) => string;
export declare const makeRouteSafe: (route: string, skip?: Set<string>, only?: Set<string>) => string;
/**
 * Turns a template-literal route into the comma-separated query-key segments
 * used by the Vue/split-query-key generators: `/pets/${petId}/tags` becomes
 * `'pets',petId,'tags'`.
 *
 * The route is tokenized first and split on `/` only inside static text, so a
 * `/` appearing inside an interpolation (a runtime `baseUrl` expression such as
 * `${process.env.API ?? 'http://localhost'}`) does not tear the expression
 * apart, and an escaped `\${...}` stays a literal segment.
 */
export declare function getRouteAsArray(route: string): string;
//#endregion
//#region src/getters/scalar.d.ts
/**
 * Returns true when a schema describes a raw binary string scalar — i.e. one
 * that getScalar's `case 'string':` branch would coerce to `Blob` outside a
 * url-encoded context (see the formDataContext.urlEncoded gate below). Shared
 * with resolveValue so the component-`$ref` urlEncoded short-circuit and the
 * inline scalar path stay in lockstep when new binary shapes are added
 * (#1624 / #3395 / #2410).
 *
 * Accepts OAS 3.1 nullable unions (`type: ['string', 'null']`) since getScalar
 * normalizes those into `case 'string':` before invoking this predicate.
 */
export declare function isBinaryScalarSchema(schema: OpenApiSchemaObject): boolean;
interface GetScalarOptions {
  item: OpenApiSchemaObject;
  name?: string;
  context: ContextSpec;
  formDataContext?: FormDataContext;
}
export declare function getScalar({ item, name, context, formDataContext }: GetScalarOptions): ScalarValue;
//#endregion
//#region src/resolvers/object.d.ts
interface ResolveOptions {
  schema: OpenApiSchemaObject | OpenApiReferenceObject;
  propName?: string;
  combined?: boolean;
  context: ContextSpec;
  formDataContext?: FormDataContext;
}
interface CreateTypeAliasOptions {
  resolvedValue: ResolverValue;
  propName: string | undefined;
  context: ContextSpec;
}
/**
 * Wraps inline object type in a type alias.
 * E.g. `{ foo: string }` → value becomes `FooBody`, schema gets `export type FooBody = { foo: string };`
 */
export declare function createTypeAliasIfNeeded({ resolvedValue, propName, context }: CreateTypeAliasOptions): ScalarValue | undefined;
export declare function resolveObject({ schema, propName, combined, context, formDataContext }: ResolveOptions): ResolverValue;
//#endregion
//#region src/resolvers/ref.d.ts
/** Convert a `$dynamicAnchor` name to a valid TypeScript generic parameter identifier. */
export declare function dynamicAnchorToParamName(anchor: string): string;
export declare function dynamicAnchorsToUniqueParamNames(anchors: string[]): Map<string, string>;
type Example = OpenApiExampleObject | OpenApiReferenceObject;
type ResolvedExample = unknown;
type Examples = Example[] | Record<string, Example> | ResolvedExample[] | Record<string, ResolvedExample> | undefined;
/**
 * Recursively resolves a `$ref` in an OpenAPI document, following
 * nested schema refs and collecting imports along the way.
 *
 * Handles type-array hints on direct refs.
 *
 * @see https://spec.openapis.org/oas/v3.1.0#reference-object
 */
export declare function resolveRef<TSchema extends object | boolean = OpenApiComponentsObject>(schema: OpenApiComponentsObject | OpenApiReferenceObject, context: ContextSpec, imports?: GeneratorImport[]): {
  schema: TSchema;
  imports: GeneratorImport[];
};
/**
 * Describes a resolved generic alias binding — the concrete type arguments
 * that fill the template's `$dynamicAnchor` slots for a given `$ref` with
 * `$defs` overrides.
 *
 * Produced by {@link extractBoundAliasInfo} and consumed by `resolveValue`
 * to emit instantiated generic type expressions (e.g. `Paginated<User>`).
 */
export interface BoundAliasInfo {
  genericName: string;
  genericParams: string[];
  typeArgs: string[];
  imports: {
    name: string;
    schemaName: string;
  }[];
  extraSchemas?: (OpenApiSchemaObject | OpenApiReferenceObject)[];
}
/**
 * Extract bound-alias information from a schema that references a generic template
 * and binds `$dynamicAnchor` entries to concrete types via `$defs`.
 */
export declare function extractBoundAliasInfo(schema: OpenApiSchemaObject | OpenApiReferenceObject, context: ContextSpec): BoundAliasInfo | undefined;
/**
 * Build the dynamic scope for a schema: maps `$dynamicAnchor` names to concrete
 * type entries for self-referential resolution, `$defs` bindings, and sibling anchors.
 */
export declare function buildDynamicScope(schemaName: string, schema: OpenApiSchemaObject, context: ContextSpec): Record<string, DynamicScopeEntry>;
/**
 * Build dynamic scope entries for an **anonymous inline** subschema that declares
 * `$dynamicAnchor` without a `$ref` (e.g. inside `allOf`, `items`, nested props).
 *
 * Unlike {@link buildDynamicScope}, entries carry the concrete `inlineSchema` so
 * that a descendant `$dynamicRef` resolves to the inline override rather than the
 * outer/global component. Used when `dereference` enters a subschema without a
 * named component `$ref`.
 *
 * Scope of handling (deliberate, see #3492):
 *   - Direct `$dynamicAnchor` on the subschema → inline entry.
 *   - `$defs` `$dynamicAnchor` *without* a `$ref` → inline entry. Note this
 *     differs from `buildDynamicScope`, which treats unbound `$defs` anchors as
 *     generic parameters (`isParameter`); inline subschemas are concrete
 *     instances, so the anchor resolves to the inline schema object itself.
 *   - `$defs` `$dynamicAnchor` *with* a `$ref` → intentionally NOT collected
 *     here. Such anchors rely on `resolveDynamicRef`'s global fallback (which
 *     finds them when the `$ref` target declares the same anchor). Fully
 *     resolving them would duplicate `buildDynamicScope`'s `$defs` logic.
 */
export declare function buildInlineDynamicScope(schema: OpenApiSchemaObject): Record<string, DynamicScopeEntry>;
/**
 * Lazily build and memoize the `$dynamicAnchor` index on the context.
 *
 * Scans `components.schemas` once per spec and stores, per anchor name, the
 * compact match info required by the {@link resolveDynamicRef} fallback (see
 * {@link DynamicAnchorIndexEntry}). Subsequent fallback lookups are O(1)
 * instead of re-scanning every schema per `$dynamicRef`.
 *
 * Recording of non-exact matches stops once `count >= 2` — the fallback only
 * distinguishes "exactly one non-exact" from "ambiguous", so further non-exact
 * names are irrelevant. Iteration continues regardless because a later schema
 * whose key equals the anchor name is still the definitive (`exactName`)
 * winner. This is the safe form of "bail early when ambiguous": a literal
 * early-return at `count === 2` would regress the exact-name rule when the
 * exact schema appears later in iteration order.
 */
export declare function getDynamicAnchorIndex(context: ContextSpec): Map<string, DynamicAnchorIndexEntry>;
/**
 * Resolve a `$dynamicRef` anchor to its concrete type using the current dynamic scope.
 * Returns `{ schema: {}, resolvedTypeName: 'unknown' }` when no scope override exists.
 */
export declare function resolveDynamicRef(anchorName: string, context: ContextSpec, imports?: GeneratorImport[]): {
  schema: OpenApiSchemaObject;
  imports: GeneratorImport[];
  resolvedTypeName: string;
  schemaName: string | undefined;
};
/** Recursively resolves `$ref` entries in an examples array or record. */
export declare function resolveExampleRefs(examples: Examples, context: ContextSpec): ResolvedExample[] | Record<string, ResolvedExample> | undefined;
//#endregion
//#region src/resolvers/value.d.ts
interface ResolveValueOptions {
  schema: OpenApiSchemaObject | OpenApiReferenceObject;
  name?: string;
  context: ContextSpec;
  formDataContext?: FormDataContext;
}
/**
 * Resolves an OpenAPI schema or reference object to a {@link ResolverValue}
 * that carries the TypeScript type string, required imports, and metadata.
 *
 * Handles all schema forms in priority order:
 * 1. **Bound generic alias** — a `$ref` with `$defs` overrides; emits an
 *    instantiated generic expression such as `Paginated<User>`.
 * 2. **Component `$ref`** — a named `$ref` pointing to `#/components/…`;
 *    emits the schema name as a reference import.
 * 3. **Non-component `$ref`** — an anonymous or path-level ref; inlines the
 *    resolved schema via {@link getScalar} (cycle-safe).
 * 4. **`$dynamicRef`** — resolved via the active dynamic scope; falls back to
 *    `unknown` when the anchor is absent or the ref is a bare `#`.
 * 5. **Plain schema** — delegates to {@link getScalar} for all other cases
 *    (primitives, objects, arrays, enums, …).
 */
export declare function resolveValue({ schema, name, context, formDataContext }: ResolveValueOptions): ResolverValue;
//#endregion
//#region src/utils/assertion.d.ts
/**
 * Represents an OpenAPI 3.1 schema object that contains a `$dynamicRef`
 * keyword, used for recursive or polymorphic schema references.
 *
 * @see https://json-schema.org/draft/2020-12/json-schema-core#section-8.2.4
 */
export interface OpenApiDynamicReferenceObject {
  $dynamicRef: string;
  [key: string]: unknown;
}
/**
 * Discriminator helper for {@link OpenApiDynamicReferenceObject}.
 *
 * Returns `true` when `obj` has a `$dynamicRef` string property,
 * indicating it is an OpenAPI 3.1 dynamic reference rather than a
 * static `$ref`.
 *
 * @param obj - Value to test.
 *
 * @see https://json-schema.org/draft/2020-12/json-schema-core#section-8.2.4
 */
export declare function isDynamicReference(obj: object): obj is OpenApiDynamicReferenceObject;
/**
 * Returns `true` when `pathValue` has no file extension and is treated as a
 * directory path.
 *
 * @param pathValue - Path string to inspect.
 */
export declare function isDirectory(pathValue: string): boolean;
/**
 * Type guard for plain objects created with `{}` or `new Object()`.
 *
 * Excludes `null`, arrays, dates, and other non-plain object values.
 *
 * @param x - Value to test.
 */
export declare function isObject(x: unknown): x is Record<string, unknown>;
/**
 * Type guard for ES module namespace objects.
 *
 * @param x - Value to test.
 */
export declare function isModule(x: unknown): x is Record<string, unknown>;
/**
 * Type guard for integer numbers and numeric strings.
 *
 * Accepts finite integers (`42`) and strings that match `/^-?\d+$/`
 * (`"-1"`, `"0"`). Rejects floats, empty strings, and non-numeric values.
 *
 * @param x - Value to test.
 */
export declare function isNumeric(x: unknown): x is number;
/**
 * Type guard for an inline OpenAPI {@link OpenApiSchemaObject}.
 *
 * Returns `true` when `x` looks like a schema definition: it has a known
 * `type`, composition keywords (`allOf`, `anyOf`, `oneOf`), or `properties`.
 * Does not match reference objects (`$ref`). {@link isInlineSchema} is true
 * for inline schemas, including JSON Schema booleans, and false for references.
 *
 * @param x - Value to test.
 */
export declare function isSchema(x: unknown): x is OpenApiSchemaObject;
/**
 * Whether a schema is dispatched as a string by {@link getScalar}.
 *
 * True for a bare `type: 'string'` and for the OAS 3.1 nullable union
 * `['string', 'null']`, which is what `resolveSpec` produces from a 3.0
 * `{ type: 'string', nullable: true }`. A union that also admits some other
 * type is not string-like: `getScalar` renders it as a union rather than
 * through `case 'string'`, so the string-only treatments (file parts, binary
 * coercion) must not claim it.
 *
 * @param schema - Schema to test.
 */
export declare function isStringLikeSchema(schema: OpenApiSchemaObject): boolean;
/**
 * Whether a schema accepts `null`.
 *
 * Nullability can sit on the schema itself (`type: 'null'` or
 * `type: ['string', 'null']`), on a `null` member of
 * an `enum`, or in a separate `{ type: 'null' }` branch of a `oneOf`/`anyOf`,
 * which is the spelling pydantic and other 3.1 generators emit for an optional
 * field.
 *
 * References are not resolved here, so a `$ref` branch never counts as
 * nullable on its own.
 *
 * @param schema - Schema to test.
 */
export declare function isSchemaNullable(schema: OpenApiSchemaObject): boolean;
/**
 * Whether the schema's `enum` admits only `null` — the OAS 3.0 spelling of a
 * null branch (`anyOf: [{ $ref }, { enum: [null] }]`), whatever its `type`.
 */
export declare function isNullOnlyEnum(schema: unknown): boolean;
/**
 * Type guard for HTTP methods defined in {@link Verbs}.
 *
 * @param verb - Method name to test (for example, `"get"`, `"post"`).
 */
export declare function isVerb(verb: string): verb is Verbs;
/**
 * Returns `true` when `str` is a valid absolute URL with an `http:` or
 * `https:` protocol.
 *
 * Empty or whitespace-only strings are rejected.
 *
 * @param str - URL string to validate.
 */
export declare function isUrl(str: string): boolean;
/**
 * Type guard for the MSW mock generator. Use to narrow a
 * `GlobalMockOptions | ClientMockBuilder` value to `MswMockOptions`.
 *
 * @param mock - Mock configuration or builder to test.
 */
export declare function isMswMock(mock: GlobalMockOptions | ClientMockBuilder): mock is MswMockOptions;
export declare function isString(x: unknown): x is string;
/** A number other than `NaN`. */
export declare function isNumber(x: unknown): x is number;
export declare function isBoolean(x: unknown): x is boolean;
type AnyFunction = (...args: never) => unknown;
/**
 * Narrows `x` to the function members of its own type (all of it when nothing
 * more precise is known), the way remeda's guard did.
 */
export declare function isFunction<T>(x: T | AnyFunction): x is 0 extends 1 & T ? AnyFunction : Extract<T, AnyFunction> extends never ? AnyFunction : Extract<T, AnyFunction>;
export declare function isNullish(x: unknown): x is null | undefined;
/**
 * Asserts that a spec-supplied numeric constraint really is a finite number.
 *
 * Constraints (`minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`,
 * `multipleOf`, `minLength`/`maxLength`, `minItems`/`maxItems`) are emitted
 * into generated source as bare, unquoted expressions — `.min(${min})`,
 * `S.minItems(${min})`, `faker.number.int({min: ${min}})`. There is no
 * surrounding quote, so no escaping can make an arbitrary value safe there.
 *
 * OpenAPI 3.1 documents pass validation with these fields set to arbitrary
 * strings, so the value has to be checked here rather than trusted.
 *
 * @param value Constraint value taken from the document
 * @param label Field name, used in the error message
 * @throws If `value` is not a finite number
 */
export declare function assertSafeNumericConstraint(value: unknown, label: string): number;
/**
 * {@link assertSafeNumericConstraint} for an optional constraint.
 *
 * Passes `undefined` straight through so callers keep "absent" distinct from
 * "present but not a number", which must still be rejected.
 *
 * @param value Constraint value taken from the document, possibly absent
 * @param label Field name, used in the error message
 */
export declare function safeNumericConstraint(value: unknown, label: string): number | undefined;
//#endregion
//#region src/utils/async-reduce.d.ts
export declare function asyncReduce<IterationItem, AccValue>(array: IterationItem[], reducer: (accumulate: AccValue, current: IterationItem) => AccValue | Promise<AccValue>, initValue: AccValue): Promise<AccValue>;
//#endregion
//#region src/utils/barrel-re-exports.d.ts
export interface BarrelReExportFile {
  /** Path of the emitted file. */
  path: string;
  /** Declared by generators whose files repeat shared boilerplate. */
  sharedExports?: SharedExports;
}
export interface BarrelReExportOptions {
  /** Directory that holds the barrel. Files outside it are ignored. */
  dirname: string;
  /** Extension of the emitted files, for example `.ts` or `.generated.ts`. */
  extension: string;
  /** Extension to write in the module specifier. Usually empty. */
  importExtension: string;
}
/**
 * Barrel lines that re-export a set of sibling files.
 *
 * @remarks
 * Wildcard-exporting two files that declare the same name makes it ambiguous
 * (TS2308). An explicit re-export shadows `export *`, so one file is picked to
 * own each repeated name.
 *
 * A name gets exactly one line. `export type { X } from './a'` beside
 * `export { X } from './b'` is TS2300, not a fix, because the `type` modifier
 * does not open a second slot — it only says how the owning file declares X.
 * `export { X }` carries the type meaning too, so a file declaring a name in
 * both categories owns it as a value.
 *
 * That leaves one case unowned: a name that is a type in one file and a value
 * in another, where either line would drop the other meaning. It stays
 * ambiguous, since a generator declaring one name as two things is a defect
 * worth failing on. So is a collision between two tags, which is why only
 * names a generator {@link SharedExports | declares} are considered.
 *
 * @param files - Sibling files, in barrel order.
 * @param alreadyExported - Names the barrel already has a line for, split by
 * category. Listed in either one, the name is taken.
 * @returns Barrel lines, named re-exports first. No trailing newlines.
 */
export declare function buildBarrelReExports(files: readonly BarrelReExportFile[], { dirname, extension, importExtension }: BarrelReExportOptions, alreadyExported?: {
  readonly types?: readonly string[];
  readonly values?: readonly string[];
}): string[];
//#endregion
//#region src/utils/case.d.ts
export declare function pascal(s?: string): string;
export declare function camel(s?: string): string;
export declare function snake(s?: string): string;
export declare function kebab(s?: string): string;
export declare function conventionName(name: string, convention: NamingConvention): string;
//#endregion
//#region src/utils/collection.d.ts
/** Keeps the first occurrence of every value. */
export declare const unique: <T>(values: readonly T[]) => T[];
/** Keeps the first item for every distinct `key(item)`. */
export declare function uniqueBy<T>(items: T[], key: (item: T, index: number, items: T[]) => unknown): T[];
/** Keeps the first of every run of items that `isEqual` treats as the same. */
export declare const uniqueWith: <T>(items: readonly T[], isEqual: (a: T, b: T) => boolean) => T[];
/**
 * Buckets `items` by `key(item)` in first-seen order. Only keys that occur get
 * a bucket, so `get` on any other key is `undefined`.
 */
export declare const groupBy: <T>(items: readonly T[], key: (item: T) => string) => Map<string, T[]>;
/** The subset of `obj` at `keys`; keys absent from `obj` are left out. */
export declare const pick: <T extends object, K extends keyof T>(obj: T, keys: Iterable<K>) => Pick<T, K>;
/** `obj` without the entries `drop` returns true for. */
export declare const omitBy: <T extends object>(obj: T, drop: (value: T[keyof T], key: string) => boolean) => Partial<T>;
/** Walks `path` into `value`; `undefined` as soon as a step is missing. */
export declare const getAtPath: (value: unknown, path: readonly PropertyKey[]) => unknown;
//#endregion
//#region src/utils/compare-version.d.ts
export declare function compareVersions(firstVersion: string, secondVersions: string, operator?: CompareOperator): boolean;
//#endregion
//#region src/utils/content-type.d.ts
/**
 * Determine if a content type is binary.
 * Only known binary types return true. Unknown types default to false (non-binary)
 * so that schema type information is preserved rather than being overridden with Blob.
 */
export declare function isBinaryContentType(contentType: string): boolean;
/**
 * Determine if a form-data field should be treated as a file (binary or text).
 *
 * Precedence (per OAS 3.1): encoding.contentType > schema.contentMediaType
 *
 * Returns:
 * - 'binary': binary file (Blob)
 * - 'text': text file (Blob | string)
 * - undefined: not a file, use standard string resolution
 */
export declare function getFormDataFieldFileType(resolvedSchema: OpenApiSchemaObject, partContentType: string | undefined): 'binary' | 'text' | undefined;
/**
 * Filter configuration for content types
 */
export interface ContentTypeFilter {
  include?: string[];
  exclude?: string[];
}
/**
 * Filters items by content type based on include/exclude rules
 *
 * @param items - Array of items with contentType property
 * @param filter - Optional filter configuration
 * @returns Filtered array
 *
 * @example
 * ```ts
 * const types = [
 *   { contentType: 'application/json', value: '...' },
 *   { contentType: 'text/xml', value: '...' }
 * ];
 *
 * // Include only JSON
 * filterByContentType(types, { include: ['application/json'] });
 *
 * // Exclude XML
 * filterByContentType(types, { exclude: ['text/xml'] });
 * ```
 */
export declare function filterByContentType<T extends {
  contentType: string;
}>(items: T[], filter?: ContentTypeFilter): T[];
//#endregion
//#region src/utils/deep-non-nullable.d.ts
export type DeepNonNullable<T> = T extends ((...args: never[]) => unknown) ? T : T extends readonly (infer U)[] ? DeepNonNullable<NonNullable<U>>[] : T extends object ? { [K in keyof T]: DeepNonNullable<NonNullable<T[K]>>; } : NonNullable<T>;
//#endregion
//#region src/utils/doc.d.ts
export declare function jsDoc(schema: object | boolean, tryOneLine?: boolean, context?: ContextSpec): string;
export declare function keyValuePairsToJsDoc(keyValues: {
  key: string;
  value: string;
}[]): string;
//#endregion
//#region src/utils/dynamic-import.d.ts
export declare function dynamicImport<T>(toImport: T | string, from?: string, takeDefault?: boolean): Promise<T>;
//#endregion
//#region src/utils/extension.d.ts
export declare function getExtension(path: string): "yaml" | "json";
//#endregion
//#region src/utils/file.d.ts
/**
 * Removes the last extension from a path. A dot in a directory name stays,
 * which is why `\` counts as a separator too: without it, `.\v1.0\pets` would
 * lose everything after the version dot.
 */
export declare function pathWithoutExtension(filePath: string): string;
/**
 * Removes a configured file extension, which may have several parts. Stripping
 * only the last segment would leave `pets.generated.ts` as `pets.generated`,
 * and re-adding the extension then gives `pets.generated.generated`. Falls
 * back to the last segment for a path that does not carry the full extension.
 */
export declare function stripFileExtension(filePath: string, fileExtension: string): string;
export declare function getFileInfo(target?: string, { backupFilename, extension }?: {
  backupFilename?: string;
  extension?: string;
}): {
  path: string;
  pathWithoutExtension: string;
  extension: string;
  isDirectory: boolean;
  dirname: string;
  filename: string;
};
export declare function removeFilesAndEmptyFolders(patterns: string[], dir: string,
/**
 * Set `followSymbolicLinks` to `false` in a directory that Orval shares with
 * the user. A symlinked subdirectory would otherwise let the glob reach
 * files outside `dir` and delete them.
 */
{ followSymbolicLinks }?: {
  followSymbolicLinks?: boolean;
}): Promise<void>;
//#endregion
//#region src/utils/file-extensions.d.ts
/**
 * Returns the filename suffix for a given mock entry's output file. For
 * example a `{ type: OutputMockType.MSW }` entry produces `<file>.msw.ts` and
 * a `{ type: OutputMockType.FAKER }` entry produces `<file>.faker.ts`.
 *
 * Custom `ClientMockBuilder` functions default to the `msw` suffix to preserve
 * the historical behavior.
 */
export declare function getMockFileExtensionByTypeName(mock: GlobalMockOptions | ClientMockBuilder): OutputMockType;
//#endregion
//#region src/utils/get-property-safe.d.ts
/**
 * Type safe way to get arbitrary property from an object.
 *
 * @param obj - The object from which to retrieve the property.
 * @param propertyName - The name of the property to retrieve.
 * @returns Object with `hasProperty: true` and `value` of the property if it exists; otherwise `hasProperty: false` and undefined.
 *
 * @remarks Until TypeScript adds type-narrowing for Object.hasOwn we have to use this workaround
 */
export declare function getPropertySafe<T extends object, K extends keyof T>(obj: T, propertyName: K | string): {
  hasProperty: true;
  value: T[K];
} | {
  hasProperty: false;
  value: undefined;
};
//#endregion
//#region src/utils/http-status.d.ts
/**
 * Refuses an OpenAPI response key that is not a status code.
 *
 * A response key reaches generated source in unquoted positions — a TypeScript
 * type (`status: <key>`) in the fetch and axios clients, and a runtime
 * expression (`response.status === <key>`) in the axios empty-response
 * normalization. There is no quote to escape in either, so a key like
 * `2 || <expression>` or `number }; <statement>; type _ = { _z: number` is
 * spliced in as live code rather than data. Parse it, and refuse the document
 * rather than emitting whatever it says.
 *
 * The spec validator rejects such keys, but `input.unsafeDisableValidation`
 * turns it off, so the check has to sit at the emission point to be worth
 * anything. This mirrors `assertSafeStatusCode` in the mock generator, which
 * guards the structurally identical sink unconditionally for the same reason.
 *
 * `default` is deliberately refused: it is a valid spec key but not a valid
 * status expression, and every caller resolves it to its own construct
 * (`Exclude<HTTPStatusCodes, …>`) before reaching an emission sink.
 *
 * @see GHSA-rw75-cc5p-q7c9 (fetch/axios type position)
 * @see GHSA-4j53-7m38-656f (axios runtime condition)
 */
export declare const assertSafeResponseStatusKey: (key: string) => string;
export declare const getStatusCodeType: (key: string, responseKeys?: string[]) => string;
export declare const HTTP_STATUS_CODE_SHARED_TYPES: SharedTypeDeclaration[];
export declare const needsHttpStatusCodeTypes: (implementation: string) => boolean;
/**
 * Builds a boolean expression that is true when `accessor` holds a status
 * matching the OpenAPI response `key`, given every key the operation declares.
 *
 * A wildcard (`2XX`) excludes exact statuses declared in the same class, since
 * those have their own responses; `default` is the negation of every other
 * declared key.
 *
 * The result is emitted as live code, so no key reaches it unvalidated, but
 * the two branches get there differently: an exact key is passed through
 * `assertSafeResponseStatusKey`, while a wildcard key is matched by
 * `WILDCARD_STATUS_CODE_REGEX` and never emitted itself — only its leading
 * digit is read, to build a numeric range. The statuses a wildcard excludes
 * are the `EXACT_STATUS_CODE_REGEX` matches among `declaredKeys` that fall in
 * the wildcard's own class (same leading digit).
 */
export declare const getResponseStatusCondition: ({ key, declaredKeys, accessor }: {
  key: string;
  declaredKeys: readonly string[];
  accessor: string;
}) => string;
//#endregion
//#region src/utils/is-body-verb.d.ts
export declare function getIsBodyVerb(verb: Verbs): boolean;
//#endregion
//#region src/utils/logger.d.ts
export type ReportScope = {
  reporter?: OrvalReporter;
  projectName?: string;
  /** Keep an already-active reporter (used by `generate()`). */
  ifUnset?: boolean;
};
export declare const noopReporter: OrvalReporter;
export declare const consoleReporter: OrvalReporter;
/**
 * Run `callback` with a reporter. Unspecified fields inherit from the current
 * scope. Prefer {@link setProjectName} to set the project name.
 */
export declare function withReporter<T>(reporterOrScope: OrvalReporter | ReportScope, callback: () => T): T;
/**
 * Set the ambient project name for subsequent log events. Creates a new
 * report store so earlier `bindReporter()` captures stay isolated.
 */
export declare function setProjectName(projectName?: string): void;
/** Re-enter the current report scope from later callbacks (watchers). */
export declare function bindReporter(): <T>(callback: () => T) => T;
export declare function setLogLevel(level: LogLevel): void;
/** Map CLI flags to a {@link LogLevel}. `--quiet` keeps warnings visible. */
export declare function resolveLogLevel(options: {
  verbose?: boolean;
  quiet?: boolean;
  logLevel?: LogLevel;
}): LogLevel;
export declare function isLogLevelEnabled(level: LogLevel): boolean;
export declare function createLogger(packageName: string): OrvalLogger;
export declare const logger: OrvalLogger;
export declare const getWarningCount: () => number;
export declare const resetWarnings: () => void;
export declare function startMessage({ name, version, description }: {
  name: string;
  version: string;
  description: string;
}): string;
export declare function createSuccessMessage(projectTitle?: string): string;
//#endregion
//#region src/utils/merge-deep.d.ts
export declare function mergeDeep<T extends object, U extends object>(source: T, target: U): T & U;
//#endregion
//#region src/utils/mutation-invalidates.d.ts
/**
 * `mutationInvalidates` names operations as plain strings, and a name that
 * matches nothing is not an error anywhere downstream — the rule is simply
 * never applied, so the configured invalidation silently never runs. These
 * warnings close that gap. See #4166.
 *
 * The two fields do not resolve names the same way, and this mirrors each one
 * rather than inventing a third rule:
 *
 * - `onMutations` is compared with `===` against the generated operation name,
 *   so the raw `operationId` casing of the document (`PostNotes`) never
 *   matches `postNotes` and the whole rule is dead.
 * - `invalidates` is folded through `camel()` to build the query key function
 *   name, which makes `GetNotes` and `getNotes` the same reference. The
 *   infinite variant's key function (`getNotesInfinite`) resolves as well.
 *
 * Only existence is checked. A target that exists but was generated as a
 * mutation rather than a query emits a call to a `getXxxQueryKey` that was
 * never declared, which fails the consumer's build loudly; telling that apart
 * here would mean re-deriving the query package's notion of a query.
 */
export declare const getUnknownMutationInvalidatesWarnings: ({ mutationInvalidates, operationNames }: {
  mutationInvalidates: MutationInvalidatesConfig | undefined;
  /** Generated operation names for this output, after any filtering. */
  operationNames: readonly string[];
}) => string[];
//#endregion
//#region src/utils/name.d.ts
/**
 * Returns `name` or the first deterministic numeric suffix not in
 * `reservedNames`.
 */
export declare function getUniqueName(name: string, reservedNames: ReadonlySet<string>): string;
/**
 * Resolves URL helper names while reserving every generated operation name.
 * The returned names correspond to `helperOperationNames` in order.
 */
export declare function getOperationUrlHelperNames(operationNames: readonly string[], helperOperationNames: readonly string[]): string[];
/**
 * Resolves the PascalCase base name of every key in a `components` section
 * (e.g. `components.schemas`), so distinct keys that only differ in casing or
 * separators (`Address` and `address`) never share a generated TypeScript
 * name. Within each colliding group the key already spelled in PascalCase (or
 * else the first declared) keeps the plain name; the others get the first
 * numeric suffix whose sanitized identifier is still free (`Address2`).
 * Memoized per section object.
 */
export declare function getComponentBaseNames(section: object | undefined): ReadonlyMap<string, string>;
/**
 * Returns the collision-free PascalCase base name of component `key` within
 * `section`. See {@link getComponentBaseNames}.
 */
export declare function getComponentBaseName(section: object | undefined, key: string): string;
//#endregion
//#region src/utils/object-schema.d.ts
/**
 * True for an inline value, including JSON Schema booleans (`true` / `false`).
 *
 * `isDereferenced` is false for booleans because they are not objects, so
 * `!isDereferenced(true)` looks like a `$ref`. A boolean schema is inline:
 * `true` admits every instance and `false` admits none.
 */
export declare function isInlineSchema<T>(value: T): value is [Exclude<T, {
  $ref: string;
}>] extends [never] ? T & {
  $ref?: undefined;
} : Exclude<T, {
  $ref: string;
}>;
/**
 * JSON Schema boolean schemas as objects: `true` ≡ `{}`, `false` ≡ `{ not: {} }`.
 */
export declare function toObjectSchema(schema: OpenApiSchemaObject): OpenApiNonBooleanSchemaObject;
declare namespace path_d_exports {
  export { getRelativeImportPath, getSchemaFileName, isAbsolute, join, joinSafe, normalizeSafe, relativeSafe, resolve, separator$1 as separator, toUnix };
}
declare function isAbsolute(value: string): boolean;
declare function resolve(...args: string[]): string;
declare function toUnix(value: string): string;
declare function join(...args: string[]): string;
/**
 * Behaves exactly like `path.relative(from, to)`, but keeps the first meaningful "./"
 */
declare function relativeSafe(from: string, to: string): string;
declare function getSchemaFileName(path: string): string;
declare const separator$1 = "/";
declare function normalizeSafe(value: string): string;
declare function joinSafe(...values: string[]): string;
/**
 * Given two absolute file paths, generates a valid ESM relative import path
 * from the 'importer' file to the 'exporter' file.
 *
 * @example
 * ```ts
 * getRelativeImportPath('/path/to/importer.ts', '/path/to/exporter.ts')
 * // => './exporter'
 * getRelativeImportPath('/path/to/importer.ts', '/path/to/sub/exporter.ts')
 * // => './sub/exporter'
 * getRelativeImportPath('/path/to/importer.ts', '/path/sibling/exporter.ts')
 * // => '../sibling/exporter'
 * ```
 *
 * This function handles path normalization, cross-platform separators, and
 * ensures the path is a valid ESM relative specifier (e.g., starts with './').
 *
 * @param importerFilePath - The absolute path of the file that will contain the import statement.
 * @param exporterFilePath - The absolute path of the file being imported.
 * @param [includeFileExtension=false] - Whether the import path should include the file extension, defaults to false.
 * @returns The relative import path string.
 */
declare function getRelativeImportPath(importerFilePath: string, exporterFilePath: string, includeFileExtension?: boolean): string;
//#endregion
//#region src/utils/required.d.ts
/**
 * Read a schema object's `required` keyword.
 *
 * Some generators emit `required: true` on a schema that carries a `$ref`,
 * borrowing the boolean that belongs on the request body object. Spreading that
 * boolean fails with `required ?? [] is not iterable`, which says nothing about
 * the document. Report the offending schema and the expected shape instead. The
 * document is not rewritten: a boolean carries no property names, so there is
 * nothing to recover from it. (#3719)
 *
 * @param schema - Schema whose `required` keyword to read.
 * @param name - Label for the offending schema, used in the error message.
 */
export declare function getRequiredKeys(schema: OpenApiSchemaObject, name: string): any[];
//#endregion
//#region src/utils/resolve-version.d.ts
export declare function resolveInstalledVersion(packageName: string, fromDir: string): string | undefined;
export declare function resolveInstalledVersions(packageJson: PackageJson, fromDir: string): Record<string, string>;
//#endregion
//#region src/utils/schema-import-path.d.ts
/** Known source file extensions used to detect named single-schema files. */
export declare const SOURCE_FILE_EXTENSIONS: ReadonlySet<string>;
/**
 * Tag directory for a schema that more than one tag uses. Such schemas stay at
 * the schemas root rather than being duplicated into each tag directory.
 */
export declare const SHARED_DIR = ".";
export interface ResolveSchemaImportDependenciesOptions {
  /**
   * Schema→tag map, set when `schemas.splitByTags` is enabled. The sentinel
   * `'.'` marks a shared schema, which stays at the schemas root.
   */
  schemaTagMap?: Map<string, string>;
  /**
   * Plan built from `schemas.routes`. When present it owns the file layout,
   * so it supersedes both the flat layout and `schemaTagMap` routing (#3942).
   */
  schemaOutputPlan?: SchemaOutputPlan;
}
/**
 * Resolves schema imports to the modules that export them.
 *
 * Shared by `generateImportsForBuilder` and by client generators that emit
 * sibling files, so both refer to the emitted schemas in the same way.
 * Callers shape their own exports (aliasing, `values`, default imports).
 *
 * @param output - Normalized output options.
 * @param imports - Schema imports to resolve. The caller must first remove
 *   imports that carry their own `importPath`.
 * @param relativeSchemasPath - Module that the schemas resolve from: a package
 *   specifier when `schemas.importPath` is set, or a relative path.
 * @returns One dependency per module, each with its imports.
 */
export declare function resolveSchemaImportDependencies(output: NormalizedOutputOptions, imports: readonly GeneratorImport[], relativeSchemasPath: string, { schemaTagMap, schemaOutputPlan }: ResolveSchemaImportDependenciesOptions): GeneratorDependency[];
/**
 * Collapses imports that name the same binding. The key holds every field that
 * changes the binding, so one schema under two aliases stays twice.
 *
 * `values` is merged, not keyed on: `generateImports` groups by it, so keeping
 * a type-only entry beside its value twin emits `import type { Pet }` and
 * `import { Pet }` from one module — TS2300. A value import serves the type
 * position too, so it wins for the whole binding.
 */
export declare function dedupeSchemaImports(imports: readonly GeneratorImport[]): GeneratorImport[];
//#endregion
//#region src/utils/schemas-options.d.ts
export interface SchemaOptionLike {
  importPath?: string;
}
/**
 * Extracts the custom package import specifier from a normalized `schemas`
 * config. Returns `undefined` when `schemas` is a plain string, `false`,
 * `undefined`, or when `importPath` is not set.
 */
export declare function getSchemasImportPath(schemas?: string | NormalizedSchemaOptions | SchemaOptionLike | false | null): string | undefined;
//#endregion
//#region src/utils/sort.d.ts
export declare const sortByPriority: <T>(arr: (T & {
  default?: unknown;
  required?: boolean;
})[]) => (T & {
  default?: unknown;
  required?: boolean;
})[];
export declare function compareNatural(a: string, b: string): number;
//#endregion
//#region src/utils/string.d.ts
/**
 * Renders a document-supplied `const` or enum member as an inert literal.
 *
 * A schema's declared `type` and the value its `const` carries both come from
 * the document and nothing makes them agree, so the branch has to be on the
 * value's own JavaScript type. Deciding from the declared type instead lets an
 * `object`-typed schema carry a string payload that is spliced in raw and then
 * evaluated as an expression when the generated module loads.
 *
 * @param value - The value to render. Any JSON-representable value.
 * @returns A literal that stays inert in both value and type position.
 * @example
 * toJsLiteral("it's") // returns "'it\\'s'"
 * toJsLiteral(42) // returns "42"
 * toJsLiteral({ a: 1 }) // returns '{"a":1}'
 */
export declare function toJsLiteral(value: unknown): string;
/**
 * Converts data to a string representation suitable for code generation.
 * Handles strings, numbers, booleans, functions, arrays, and objects.
 *
 * @param data - The data to stringify. Can be a string, array, object, number, boolean, function, null, or undefined.
 * @returns A string representation of the data, `null` for null, or undefined if data is undefined.
 * @example
 * stringify('hello') // returns "'hello'"
 * stringify(42) // returns "42"
 * stringify([1, 2, 3]) // returns "[1, 2, 3]"
 * stringify({ a: 1, b: 'test' }) // returns "{ a: 1, b: 'test', }"
 */
export declare function stringify(data?: unknown): string | undefined;
/**
 * Sanitizes a string value by removing or replacing special characters and ensuring
 * it conforms to JavaScript identifier naming rules if needed.
 *
 * @param value - The string value to sanitize.
 * @param options - Configuration options for sanitization:
 *   - `whitespace` - Replacement string for whitespace characters, or `true` to keep them.
 *   - `underscore` - Replacement string for underscores, or `true` to keep them.
 *   - `dot` - Replacement string for dots, or `true` to keep them.
 *   - `dash` - Replacement string for dashes, or `true` to keep them.
 *   - `es5keyword` - If true, prefixes the value with underscore if it's an ES5 keyword.
 *   - `es5IdentifierName` - If true, ensures the value is a valid ES5 identifier name.
 *   - `special` - If true, preserves special characters that would otherwise be removed.
 * @returns The sanitized string value.
 * @example
 * sanitize('hello-world', { dash: '_' }) // returns "hello_world"
 * sanitize('class', { es5keyword: true }) // returns "_class"
 * sanitize('123abc', { es5IdentifierName: true }) // returns "N123abc"
 */
export declare function sanitize(value: string, options?: {
  whitespace?: string | true;
  underscore?: string | true;
  dot?: string | true;
  dash?: string | true;
  es5keyword?: boolean;
  es5IdentifierName?: boolean;
  special?: boolean;
}): string;
/**
 * Converts an array of objects to a comma-separated string representation.
 * Optionally extracts a nested property from each object using a dot-notation path.
 *
 * @param props - Array of objects to convert to string.
 * @param path - Optional dot-notation path to extract a property from each object (e.g., "user.name").
 * @returns A comma-separated string of values, with each value on a new line indented.
 * @example
 * toObjectString([{ name: 'John' }, { name: 'Jane' }], 'name')
 * // returns "John,\n    Jane,"
 * toObjectString(['a', 'b', 'c'])
 * // returns "a,\n    b,\n    c,"
 */
export declare function toObjectString<T>(props: T[], path?: keyof T): string;
/**
 * Converts a number to its word representation by translating each digit to its word form.
 *
 * @param num - The number to convert to words.
 * @returns A string containing the word representation of each digit concatenated together.
 * @example
 * getNumberWord(123) // returns "onetwothree"
 * getNumberWord(42) // returns "fourtwo"
 */
export declare function getNumberWord(num: number): string;
/**
 * Escapes a specific character in a string by prefixing all of its occurrences with a backslash.
 *
 * @param str - The string to escape, or null.
 * @param char - The character to escape. Defaults to single quote (').
 * @returns The escaped string, or null if the input is null.
 * @example
 * escape("don't") // returns "don\'t"
 * escape("it's John's") // returns "it\'s John\'s"
 * escape('say "hello"', '"') // returns 'say \\"hello\\"'
 * escape("a'''b", "'") // returns "a\'\'\'b"
 */
export declare function escape(str: string | null, char?: string): string | undefined;
/**
 * Escapes regular expression metacharacters in a string so it can be safely
 * embedded inside a RegExp pattern.
 *
 * @param value - The raw string value to escape for regex usage.
 * @returns The escaped string.
 * @example
 * escapeRegExp('foo$bar') // returns 'foo\\$bar'
 */
export declare function escapeRegExp(value: string): string;
/**
 * Escape all characters not included in SingleStringCharacters and
 * DoubleStringCharacters on
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
 *
 * Based on https://github.com/joliss/js-string-escape/blob/master/index.js
 *
 * @param input String to escape
 */
export declare function jsStringEscape(input: string): string;
/**
 * Escape a string for embedding inside a single-quoted JS string literal.
 *
 * Unlike {@link jsStringEscape}, this escapes only what a string literal
 * actually needs: backslashes, single quotes, and line terminators. It
 * deliberately does NOT escape `/` or `*`, which are meaningless inside a
 * string literal, so escaping them produces "useless escapes" that round-trip
 * to the same value but trip ESLint's `no-useless-escape` in generated code
 * (e.g. RegExp pattern literals, see #3337).
 *
 * Use {@link jsStringEscape} instead when the value is embedded in a JS comment,
 * where the comment delimiters must be neutralized.
 *
 * @param input String to escape
 */
export declare function jsStringLiteralEscape(input: string): string;
/**
 * Deduplicates a TypeScript union type string.
 * Handles types like "A | B | B" → "A | B" and "null | null" → "null".
 * Only splits on top-level | (not inside {} () [] <> or string literals).
 */
export declare function dedupeUnionType(unionType: string): string;
//#endregion
//#region src/utils/tags.d.ts
/**
 * Canonical bucket key for a single OpenAPI tag.
 *
 * In `tags` / `tags-split` mode operations are routed into files by their first
 * tag. This function is the **single source of truth** for turning a tag (or a
 * missing tag) into the key that identifies that file bucket. Every place that
 * groups operations by tag, derives a per-tag file/directory name, or checks
 * whether an operation belongs to a tag MUST go through here so that the
 * "build the key" side and the "look the key up" side can never disagree.
 *
 * The result is `kebab`-cased. `kebab` is idempotent
 * (`kebab(kebab(x)) === kebab(x)`), so it is always safe to call this on a value
 * that is already a canonical key. Other case functions (`camel`, `pascal`) are
 * NOT safe here: they do not round-trip through the bucket key for tags
 * containing acronyms or spaces (e.g. `"AB Widget"`), which is exactly the class
 * of bug this module exists to prevent.
 *
 * Missing or empty tags map to the implicit {@link DefaultTag} bucket.
 */
export declare function getTagKey(tag?: string): string;
/**
 * Canonical bucket key for an operation, derived from its primary (first) tag.
 *
 * Untagged operations resolve to the {@link DefaultTag} bucket.
 */
export declare function getOperationTagKey(operation: {
  tags: string[];
}): string;
/**
 * Whether an operation belongs to the given tag bucket.
 *
 * Both sides are normalised through {@link getTagKey}, so the comparison is
 * correct regardless of how `tagKey` was spelled or cased by the caller. An
 * absent (`undefined`) `tagKey` matches every operation (the "no tag filter"
 * case); an empty/whitespace `tagKey` is normalised to the {@link DefaultTag}
 * bucket like any other tag.
 *
 * Prefer this over hand-rolling `operation.tags[0] === tagKey`: a raw tag
 * compared against a canonical key silently fails for multi-word/acronym tags.
 */
export declare function isOperationInTagBucket(operation: {
  tags: string[];
}, tagKey?: string): boolean;
//#endregion
//#region src/utils/template-literal.d.ts
/**
 * A lexer for the *source text* of a generated JavaScript template literal
 * (everything that goes between the backticks).
 *
 * Orval emits routes and URLs as template-literal source, mixing escaped
 * static text from the OpenAPI specification with `${...}` interpolations it
 * generates itself. Later passes need to rewrite only the interpolations
 * (URL-encoding a path parameter, rewriting it to an Angular signal call,
 * splitting a route into query-key segments) while leaving static text alone.
 *
 * Doing that with a regular expression is unsound: `\${foo}` is escaped static
 * text, `${foo}` is an interpolation, and `\\${foo}` is an escaped backslash
 * followed by a real interpolation. Character-adjacency lookbehinds such as
 * `(?<!\\)` get all three wrong for at least one input, and each new escaping
 * rule adds another way to get them wrong (#3703).
 *
 * This module replaces those heuristics with an actual scanner: it walks the
 * source once, consuming backslash escapes as indivisible pairs and matching
 * `${` to its closing `}` by brace depth (skipping over string literals inside
 * the expression). The result is an exact token list, so callers never have to
 * infer intent from neighbouring characters.
 */
export type TemplateLiteralPart =
/** Static text, still in its escaped template-literal source form. */
{
  kind: 'literal';
  source: string;
} |
/** The expression inside a `${...}` block, without the delimiters. */
{
  kind: 'expression';
  source: string;
};
/**
 * Splits template-literal source into static and interpolated parts.
 *
 * Escapes are preserved verbatim in `literal` parts (the output is meant to be
 * spliced straight back into generated source), and an unterminated or
 * backslash-escaped `${` stays literal rather than being guessed at.
 */
export declare function parseTemplateLiteral(source: string): TemplateLiteralPart[];
/** Re-assembles parts produced by {@link parseTemplateLiteral} losslessly. */
export declare function stringifyTemplateLiteral(parts: readonly TemplateLiteralPart[]): string;
/**
 * Rewrites every `${...}` expression in template-literal source, leaving
 * static text (including escaped `\${...}` sequences) untouched.
 *
 * Returning the expression unchanged is a no-op, so this is the safe
 * replacement for `route.replaceAll(TEMPLATE_TAG_REGEX, ...)`.
 */
export declare function mapTemplateExpressions(source: string, mapper: (expression: string) => string): string;
//#endregion
//#region src/utils/tsconfig.d.ts
export declare function isSyntheticDefaultImportsAllow(config?: Tsconfig): boolean;
export declare function getImportExtension(fileExtension: string, tsconfig?: Tsconfig): string;
//#endregion
//#region src/writers/barrel-collisions.d.ts
/**
 * Names that more than one module of a barrel exports. TypeScript cannot
 * resolve an ambiguous `export *` (TS2308), so each such name is unusable
 * through the barrel. Nested barrels (directory re-exports) are skipped.
 */
export declare const getAmbiguousBarrelExports: (indexPath: string) => Promise<Map<string, string[]>>;
/**
 * Two outputs whose `schemas` point at one directory share its `index.ts`,
 * and each merges the other's exports into it. When both generate a schema
 * of the same name (a TypeScript model and a reusable Zod schema, say), the
 * barrel re-exports it twice and consumers can import neither. Which one is
 * meant cannot be decided here, so this only reports it. See #4217.
 */
export declare const warnAmbiguousBarrelExports: (indexPath: string) => Promise<void>;
//#endregion
//#region src/writers/file.d.ts
export type GeneratedFileTransform = (filePath: string, content: string) => Promise<string>;
export declare function withGeneratedFileTransform<T>(transform: GeneratedFileTransform, callback: () => Promise<T>): Promise<T>;
/**
 * Write generated code to a file, stripping trailing whitespace from each line.
 *
 * Template literals in code generators can produce lines with only whitespace
 * when conditional expressions evaluate to empty strings. This function
 * ensures the output is always clean regardless of generator implementation.
 */
export declare function writeGeneratedFile(filePath: string, content: string): Promise<void>;
//#endregion
//#region src/writers/mock-utils.d.ts
export declare function getMockDir(entry: GlobalMockOptions | ClientMockBuilder, mockConfig: WriteModeProps['output']['mock']): string | undefined;
/** The faker generator entry, when one is configured. */
export declare function getFakerEntry(mockConfig: WriteModeProps['output']['mock']): FakerMockOptions | undefined;
/**
 * Lists the directories that mock files are written to.
 *
 * The paths come from {@link getMockDir}, the helper the mode writers use to
 * decide where to write. `mockConfig.path` is listed even when no generator
 * resolves to it, so a configuration that lost its last generator still knows
 * where earlier runs wrote.
 *
 * The faker generator's `schemasPath` is listed as well, since the schema
 * factories file is a mock file.
 *
 * @returns The configured mock output directories. Empty when no mock path is
 * configured, in which case mock files land beside the implementation files.
 */
export declare function getConfiguredMockDirectories(mockConfig: WriteModeProps['output']['mock']): string[];
export declare function resolveMockSchemasPath(mockFilePath: string, schemasTarget: string): string;
//#endregion
//#region src/writers/schema-tag-mapper.d.ts
export declare function buildSchemaTagMap(operations: ReadonlyArray<Pick<GeneratorOperation, 'imports' | 'tags'>>, schemas: GeneratorSchema[]): Map<string, string>;
//#endregion
//#region src/writers/schemas.d.ts
/**
 * Split schemas into regular and operation types.
 */
export declare function splitSchemasByType(schemas: GeneratorSchema[]): {
  regularSchemas: GeneratorSchema[];
  operationSchemas: GeneratorSchema[];
};
/**
 * Fix imports in operation schemas that reference regular schemas.
 */
export declare function fixCrossDirectoryImports(operationSchemas: GeneratorSchema[], regularSchemaNames: Set<string>, schemaPath: string, operationSchemaPath: string, namingConvention: NamingConvention, fileExtension: string, tsconfig?: Tsconfig): void;
/**
 * Fix imports in regular schemas that reference operation schemas.
 */
export declare function fixRegularSchemaImports(regularSchemas: GeneratorSchema[], operationSchemaNames: Set<string>, schemaPath: string, operationSchemaPath: string, namingConvention: NamingConvention, fileExtension: string, tsconfig?: Tsconfig): void;
interface WriteSchemaOptions {
  path: string;
  schema: GeneratorSchema;
  target: string;
  namingConvention: NamingConvention;
  fileExtension: string;
  header: string;
  tsconfig?: Tsconfig;
}
export declare function writeSchema({ path, schema, target, namingConvention, fileExtension, header, tsconfig }: WriteSchemaOptions): Promise<void>;
interface WriteSchemasOptions {
  schemaPath: string;
  schemas: GeneratorSchema[];
  target: string;
  namingConvention: NamingConvention;
  fileExtension: string;
  header: string;
  indexFiles: boolean;
  tsconfig?: Tsconfig;
  factoryOutputDirectory?: string;
}
export declare function writeSchemas({ schemaPath, schemas, target, namingConvention, fileExtension, header, indexFiles, tsconfig, factoryOutputDirectory }: WriteSchemasOptions): Promise<void>;
interface WriteRoutedSchemasOptions {
  plan: SchemaOutputPlan;
  target: string;
  namingConvention: NamingConvention;
  fileExtension: string;
  header: string;
  indexFiles: boolean;
  tsconfig?: Tsconfig;
}
/** Writes planned schemas and the route barrels that expose them. */
export declare function writeRoutedSchemas({ plan, target, namingConvention, fileExtension, header, indexFiles, tsconfig }: WriteRoutedSchemasOptions): Promise<void>;
//#endregion
//#region src/writers/schemas-tags-split.d.ts
interface WriteSchemasTagsSplitOptions {
  schemaPath: string;
  schemas: GeneratorSchema[];
  target: string;
  namingConvention: NamingConvention;
  fileExtension: string;
  header: string;
  indexFiles: boolean;
  tsconfig?: Tsconfig;
  factoryOutputDirectory?: string;
  /**
   * Schema→tag map from `buildSchemaTagMap`. It sets the directory of each
   * written file, so the caller supplies the same map that resolves imports.
   */
  schemaTagMap: Map<string, string>;
}
export declare function writeSchemasTagsSplit({ schemaPath, schemas, target, namingConvention, fileExtension, header, indexFiles, tsconfig, factoryOutputDirectory, schemaTagMap }: WriteSchemasTagsSplitOptions): Promise<void>;
//#endregion
//#region src/writers/single-mode.d.ts
export declare function writeSingleMode({ builder, output, projectName, header, needSchema, generateSchemasInline, schemaTagMap, schemaOutputPlan }: WriteModeProps): Promise<string[]>;
//#endregion
//#region src/writers/split-mode.d.ts
export declare function writeSplitMode({ builder, output, projectName, header, needSchema, generateSchemasInline, schemaTagMap, schemaOutputPlan }: WriteModeProps): Promise<string[]>;
//#endregion
//#region src/writers/split-tags-mode.d.ts
export declare function writeSplitTagsMode({ builder, output, projectName, header, needSchema, generateSchemasInline, schemaTagMap, schemaOutputPlan }: WriteModeProps): Promise<string[]>;
//#endregion
//#region src/writers/tags-mode.d.ts
export declare function writeTagsMode({ builder, output, projectName, header, needSchema, generateSchemasInline, schemaTagMap, schemaOutputPlan }: WriteModeProps): Promise<string[]>;
//#endregion
//#region src/writers/tags-operations-mode.d.ts
export declare function assertClientSupportsTagsOperations(client: OutputClient | OutputClientFunc, mode: string): void;
/**
 * `tags-operations` mode: one file per operation, nested under a per-tag
 * directory (`<dir>/<tag>/<operation><ext>`), each containing both the
 * operation's types and its runtime implementation. A per-tag barrel
 * (`<dir>/<tag>/index<ext>`) re-exports every operation file so existing
 * `import from '<build>/<tag>'`-style imports keep working.
 */
export declare function writeTagsOperationsMode({ builder, output, projectName, header, needSchema, generateSchemasInline, schemaTagMap, schemaOutputPlan }: WriteModeProps): Promise<string[]>;
//#endregion
//#region src/writers/tags-operations-split-mode.d.ts
/**
 * `tags-operations-split` mode: two files per operation, nested under a
 * per-tag directory (`<dir>/<tag>/<operation><ext>` for the runtime
 * implementation, `<dir>/<tag>/<operation>.schemas<ext>` for the component
 * schemas that operation's implementation references), plus a per-tag
 * barrel (`<dir>/<tag>/index<ext>`) re-exporting both files for every
 * operation so existing `import from '<build>/<tag>'`-style imports keep
 * working.
 */
export declare function writeTagsOperationsSplitMode({ builder, output, projectName, header, needSchema, generateSchemasInline, schemaTagMap, schemaOutputPlan }: WriteModeProps): Promise<string[]>;
//#endregion
//#region src/writers/target.d.ts
/**
 * `mockOutputsFull` keeps `function` and `handler` separate so the split
 * writers can strip factories from the MSW output before flattening.
 */
export interface GeneratorTargetWithFull extends GeneratorTarget {
  mockOutputsFull: GeneratorMockOutputFull[];
}
export declare function generateTarget(builder: WriteSpecBuilder, options: NormalizedOutputOptions): Promise<GeneratorTargetWithFull>;
//#endregion
//#region src/writers/target-tags.d.ts
export declare function generateTargetForTags(builder: WriteSpecBuilder, options: NormalizedOutputOptions): Promise<Record<string, GeneratorTargetWithFull>>;
//#endregion
//#region src/writers/target-tags-operations.d.ts
/**
 * Resolves the transitive closure of component schemas an operation's
 * implementation references, so `tags-operations-split`'s per-operation
 * `.schemas` file includes not just the schemas named directly in the
 * operation's imports but everything those schemas reference too (e.g. a
 * `Pet` schema composed from `Dog` / `Cat` via `oneOf`). Mirrors the
 * traversal in `schema-tag-mapper.ts`'s `propagateTransitiveTags`.
 */
export declare function resolveTransitiveSchemas(directNames: Iterable<string>, schemas: readonly GeneratorSchema[]): GeneratorSchema[];
/**
 * Builds the import statement(s) an operation file uses to pull in its
 * tag's shared helper block, or `''` when the helper has nothing to export.
 * A plain `import './tag.helpers'` would compile but never bring the
 * helper's `type`/`const` names into scope — callers must import them by
 * name, and type names must use `import type` while runtime values
 * (e.g. `withQueryKey`) need a real import so they survive to the emitted JS.
 */
export declare function buildTagHelpersImport(helpers: GeneratorTagHelpers, helperImportPath: string, usedIn?: string): string;
/**
 * Builds one {@link GeneratorTagOperationsTarget} per tag for the
 * `tags-operations` / `tags-operations-split` modes. Unlike
 * `generateTargetForTags`, operations within a tag are NOT merged into a
 * single implementation string — each operation keeps its own
 * implementation so the caller can write it to its own file.
 *
 * The tag's header/footer are still computed once (from the merged
 * implementation of every operation in the tag, exactly as
 * `generateTargetForTags` does) so client builders that key their output on
 * tag-wide signals (e.g. "does any operation in this tag use a mutator")
 * produce the same boilerplate they would in `tags` mode. That boilerplate
 * becomes the tag's shared `helpers` block, written once per tag and
 * imported by every operation file in that tag instead of being duplicated.
 */
export declare function generateTargetForTagsOperations(builder: WriteSpecBuilder, options: NormalizedOutputOptions): Promise<Record<string, GeneratorTagOperationsTarget>>;
//#endregion
//#region src/writers/types.d.ts
export declare function getOrvalGeneratedTypes(): string;
export declare function getTypedResponse(): string;
//#endregion
export { escapePath, path_d_exports as upath };
//# sourceMappingURL=index.d.mts.map