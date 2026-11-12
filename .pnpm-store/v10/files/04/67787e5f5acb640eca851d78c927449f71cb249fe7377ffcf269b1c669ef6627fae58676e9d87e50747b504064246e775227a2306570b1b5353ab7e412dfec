import { ClientBuilder, ClientDependenciesBuilder, ClientHeaderBuilder, NormalizedOutputOptions, QueryOptions } from "@orval/core";
//#region src/dependencies.d.ts
export declare const getSvelteQueryDependencies: ClientDependenciesBuilder;
export declare const getReactQueryDependencies: ClientDependenciesBuilder;
export declare const getVueQueryDependencies: ClientDependenciesBuilder;
export declare const getSolidQueryDependencies: ClientDependenciesBuilder;
export declare const getAngularQueryDependencies: ClientDependenciesBuilder;
//#endregion
//#region src/index.d.ts
export declare const generateQueryHeader: ClientHeaderBuilder;
export declare const generateQuery: ClientBuilder;
export declare const builder: ({ type, options: queryOptions, output }?: {
  type?: "react-query" | "vue-query" | "svelte-query" | "angular-query" | "solid-query";
  options?: QueryOptions;
  output?: NormalizedOutputOptions;
}) => () => {
  client: ClientBuilder;
  header: ClientHeaderBuilder;
  dependencies: ClientDependenciesBuilder;
};
//#endregion
export { builder as default };
//# sourceMappingURL=index.d.mts.map