import { ClientBuilder, ClientGeneratorsBuilder, ContextSpec, GeneratorDependency, NormalizedOverrideOutput, OpenApiNonBooleanSchemaObject, OpenApiParameterObject, OpenApiReferenceObject, OpenApiSchemaObject, OutputHttpClient, PackageJson } from "@orval/core";
//#region src/index.d.ts
export declare const getEffectDependencies: (_hasGlobalMutator?: boolean, _hasParamsSerializerOptions?: boolean, _packageJson?: PackageJson, _httpClient?: OutputHttpClient, _hasTagsMutator?: boolean, _override?: NormalizedOverrideOutput, implementation?: string) => GeneratorDependency[];
export interface EffectValidationSchemaDefinition {
  functions: [string, unknown][];
  consts: string[];
}
export declare const generateEffectValidationSchemaDefinition: (schemaInput: OpenApiSchemaObject | undefined, context: ContextSpec, name: string, strict: boolean, rules?: {
  required?: boolean;
  propertyOverrides?: Record<string, EffectValidationSchemaDefinition>;
  constNameRegistry?: Record<string, number>;
}) => EffectValidationSchemaDefinition;
export interface ParseEffectOptions {
  /**
   * When emitting inside a Struct property, wrap optionals/defaults with
   * `S.optional` / `S.optionalWith` so they describe an optional field
   * rather than `T | undefined`.
   */
  asStructProperty?: boolean;
  brandName?: string;
}
/**
 * Parse the intermediate definition into Effect Schema source code.
 */
export declare const parseEffectValidationSchemaDefinition: (input: EffectValidationSchemaDefinition, context: ContextSpec, strict: boolean, brandName?: string, exactOptional?: boolean, isEffectV4?: boolean) => {
  effect: string;
  consts: string;
};
export declare const dereference: (schema: OpenApiSchemaObject | OpenApiReferenceObject, context: ContextSpec) => OpenApiNonBooleanSchemaObject;
export declare const generateFormDataEffectSchema: (schema: OpenApiSchemaObject, context: ContextSpec, name: string, strict: boolean, encoding?: Record<string, {
  contentType?: string;
}>) => EffectValidationSchemaDefinition;
export declare const parseParameters: ({ data, context, operationName, strict, generate }: {
  data: (OpenApiParameterObject | OpenApiReferenceObject)[] | undefined;
  context: ContextSpec;
  operationName: string;
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
}) => {
  headers: EffectValidationSchemaDefinition;
  queryParams: EffectValidationSchemaDefinition;
  params: EffectValidationSchemaDefinition;
};
export declare const generateEffect: ClientBuilder;
export declare const builder: () => () => ClientGeneratorsBuilder;
//#endregion
export { builder as default };
//# sourceMappingURL=index.d.mts.map