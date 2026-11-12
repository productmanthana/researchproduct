import { i as namesAFile, o as logger, r as getHeadersForUrl } from "./options-B6dinSa6.mjs";
import { n as reconcileWorkspaceBarrel, t as readReExportSpecifiers } from "./barrel-DQrRgq4v.mjs";
import path from "node:path";
import { GetterPropType, OutputClient, OutputMockType, OutputMode, SupportedFormatter, asyncReduce, bindReporter, buildSchemaTagMap, collectReferencedComponents, conventionName, createSchemaOutputPlanForOutput, createSuccessMessage, dynamicImport, escapePath, filterPathsBySchemas, fixCrossDirectoryImports, fixRegularSchemaImports, generateComponentDefinition, generateDependencyImports, generateModelsInline, generateMutator, generateParameterDefinition, generateSchemasDefinition, generateVerbsOptions, getBaseUrlRuntimeImports, getConfiguredMockDirectories, getFakerEntry, getFileInfo, getFullRoute, getImportExtension, getMockFileExtensionByTypeName, getOperationUrlHelperNames, getRoute, getSchemasImportPath, getUnknownMutationInvalidatesWarnings, isBoolean, isFunction, isInlineSchema, isNullOnlyEnum, isNullish, isObject, isString, isUrl, jsDoc, pascal, pick, removeFilesAndEmptyFolders, resolveRef, splitSchemasByType, stripFileExtension, upath, warnAmbiguousBarrelExports, withGeneratedFileTransform, writeGeneratedFile, writeRoutedSchemas, writeSchemas, writeSchemasTagsSplit, writeSingleMode, writeSplitMode, writeSplitTagsMode, writeTagsMode, writeTagsOperationsMode, writeTagsOperationsSplitMode } from "@orval/core";
import fs, { readFile } from "node:fs/promises";
import { bundle } from "@scalar/json-magic/bundle";
import { fetchUrls, parseJson, parseYaml, readFiles } from "@scalar/json-magic/bundle/plugins/node";
import { upgrade, validate } from "@scalar/openapi-parser";
import yaml from "js-yaml";
import fs$1 from "node:fs";
import { styleText } from "node:util";
import { ExecaError, execa } from "execa";
import { parseArgsStringToArgv } from "string-argv";
import { createJiti } from "jiti";
//#region src/client.ts
const DEFAULT_CLIENT = OutputClient.AXIOS;
const GENERATOR_LOADERS = {
	axios: () => import("@orval/axios"),
	angular: () => import("@orval/angular"),
	query: () => import("@orval/query"),
	"solid-start": () => import("@orval/solid-start"),
	swr: () => import("@orval/swr"),
	"pinia-colada": () => import("@orval/pinia-colada"),
	zod: () => import("@orval/zod"),
	effect: () => import("@orval/effect"),
	hono: () => import("@orval/hono"),
	fetch: () => import("@orval/fetch"),
	mcp: () => import("@orval/mcp")
};
const moduleCache = /* @__PURE__ */ new Map();
let fullTableCache;
let mockModuleCache$1;
const builderCache = /* @__PURE__ */ new WeakMap();
const fullTableBuilderCache = /* @__PURE__ */ new WeakMap();
const getCachedBuilder = (output, key) => builderCache.get(output)?.get(key);
const setCachedBuilder = (output, key, builder) => {
	let perProject = builderCache.get(output);
	if (!perProject) {
		perProject = /* @__PURE__ */ new Map();
		builderCache.set(output, perProject);
	}
	perProject.set(key, builder);
};
const getGeneratorBuilder = (module) => {
	if (typeof module.default !== "function") throw new Error("Generator module does not have a default builder export");
	return module.default;
};
const invokeGeneratorBuilder = (builder, ...args) => {
	const result = builder(...args);
	if (typeof result !== "function") throw new Error("Generator module default export did not return a builder");
	return result;
};
const getClientGeneratorsBuilder = (value) => {
	if (!value || typeof value !== "object" || !("client" in value) || typeof value.client !== "function") throw new Error("Generator builder did not return a client builder");
	return value;
};
const loadGeneratorModule = async (key) => {
	const cachedModule = moduleCache.get(key);
	if (cachedModule) return cachedModule;
	const loader = GENERATOR_LOADERS[key];
	if (!loader) throw new Error(`Unknown generator module: ${key}`);
	const module = await loader();
	moduleCache.set(key, module);
	return module;
};
const loadFullGeneratorTable = () => {
	fullTableCache ??= Promise.all(Object.keys(GENERATOR_LOADERS).map(async (key) => [key, await loadGeneratorModule(key)])).then((entries) => Object.fromEntries(entries));
	return fullTableCache;
};
const createGeneratorClient = (outputClient, output, module) => {
	const builder = getGeneratorBuilder(module);
	switch (outputClient) {
		case OutputClient.AXIOS:
		case OutputClient.AXIOS_FUNCTIONS: return getClientGeneratorsBuilder(invokeGeneratorBuilder(builder, { type: outputClient })());
		case OutputClient.ANGULAR: return getClientGeneratorsBuilder(invokeGeneratorBuilder(builder)(output.override.angular));
		case OutputClient.ANGULAR_QUERY:
		case OutputClient.REACT_QUERY:
		case OutputClient.SOLID_QUERY:
		case OutputClient.SVELTE_QUERY:
		case OutputClient.VUE_QUERY: return getClientGeneratorsBuilder(invokeGeneratorBuilder(builder, {
			output,
			type: outputClient
		})());
		case OutputClient.SOLID_START:
		case OutputClient.SWR:
		case OutputClient.ZOD:
		case OutputClient.EFFECT:
		case OutputClient.HONO:
		case OutputClient.FETCH:
		case OutputClient.MCP: return getClientGeneratorsBuilder(invokeGeneratorBuilder(builder)());
		case OutputClient.PINIA_COLADA: return getClientGeneratorsBuilder(invokeGeneratorBuilder(builder, { output })());
	}
};
const getGeneratorModuleKey = (outputClient) => {
	if (outputClient === OutputClient.ANGULAR_QUERY || outputClient === OutputClient.REACT_QUERY || outputClient === OutputClient.SOLID_QUERY || outputClient === OutputClient.SVELTE_QUERY || outputClient === OutputClient.VUE_QUERY) return "query";
	if (outputClient === OutputClient.AXIOS || outputClient === OutputClient.AXIOS_FUNCTIONS) return "axios";
	return outputClient;
};
const getGeneratorClient = async (outputClient, output) => {
	if (!isFunction(outputClient)) {
		const cachedBuilder = getCachedBuilder(output, outputClient);
		if (cachedBuilder) return cachedBuilder;
		const builder = createGeneratorClient(outputClient, output, await loadGeneratorModule(getGeneratorModuleKey(outputClient)));
		setCachedBuilder(output, outputClient, builder);
		return builder;
	}
	let generators = fullTableBuilderCache.get(output);
	if (!generators) {
		const modules = await loadFullGeneratorTable();
		generators = {
			axios: createGeneratorClient(OutputClient.AXIOS, output, modules.axios),
			"axios-functions": createGeneratorClient(OutputClient.AXIOS_FUNCTIONS, output, modules.axios),
			angular: createGeneratorClient(OutputClient.ANGULAR, output, modules.angular),
			"angular-query": createGeneratorClient(OutputClient.ANGULAR_QUERY, output, modules.query),
			"react-query": createGeneratorClient(OutputClient.REACT_QUERY, output, modules.query),
			"solid-start": createGeneratorClient(OutputClient.SOLID_START, output, modules["solid-start"]),
			"solid-query": createGeneratorClient(OutputClient.SOLID_QUERY, output, modules.query),
			"svelte-query": createGeneratorClient(OutputClient.SVELTE_QUERY, output, modules.query),
			"vue-query": createGeneratorClient(OutputClient.VUE_QUERY, output, modules.query),
			swr: createGeneratorClient(OutputClient.SWR, output, modules.swr),
			"pinia-colada": createGeneratorClient(OutputClient.PINIA_COLADA, output, modules["pinia-colada"]),
			zod: createGeneratorClient(OutputClient.ZOD, output, modules.zod),
			effect: createGeneratorClient(OutputClient.EFFECT, output, modules.effect),
			hono: createGeneratorClient(OutputClient.HONO, output, modules.hono),
			fetch: createGeneratorClient(OutputClient.FETCH, output, modules.fetch),
			mcp: createGeneratorClient(OutputClient.MCP, output, modules.mcp)
		};
		fullTableBuilderCache.set(output, generators);
	}
	const generator = outputClient(generators);
	if (!generator) throw new Error(`Unknown output client provided to getGeneratorClient: ${String(outputClient)}`);
	return generator;
};
const generateClientImports = async ({ client, implementation, imports, projectName, hasSchemaDir, isAllowSyntheticDefaultImports, hasGlobalMutator, hasTagsMutator, hasParamsSerializerOptions, packageJson, output }) => {
	const { dependencies } = await getGeneratorClient(client, output);
	return generateDependencyImports(implementation, dependencies ? [...dependencies(hasGlobalMutator, hasParamsSerializerOptions, packageJson, output.httpClient, hasTagsMutator, output.override, implementation), ...imports] : imports, projectName, hasSchemaDir, isAllowSyntheticDefaultImports);
};
const generateClientHeader = async ({ outputClient = DEFAULT_CLIENT, isRequestOptions, isGlobalMutator, isMutator, provideIn, hasAwaitedType, titles, output, verbOptions, tag, isDefaultTagBucket, clientImplementation }) => {
	const { header } = await getGeneratorClient(outputClient, output);
	const rawHeader = header ? header({
		title: titles.implementation,
		isRequestOptions,
		isGlobalMutator,
		isMutator,
		provideIn,
		hasAwaitedType,
		output,
		verbOptions,
		tag,
		isDefaultTagBucket,
		clientImplementation
	}) : "";
	const normalizedHeader = typeof rawHeader === "string" ? { implementation: rawHeader } : rawHeader;
	return {
		implementation: normalizedHeader.implementation,
		implementationMock: `export const ${titles.implementationMock} = () => [\n`,
		sharedTypes: normalizedHeader.sharedTypes
	};
};
const generateClientFooter = async ({ outputClient, operationNames, operations, hasMutator, hasAwaitedType, titles, output }) => {
	const { footer } = await getGeneratorClient(outputClient, output);
	if (!footer) return {
		implementation: "",
		implementationMock: `\n]\n`
	};
	let implementation;
	try {
		if (isFunction(outputClient)) {
			implementation = footer(operationNames);
			logger.warn("Passing an array of strings for operations names to the footer function is deprecated and will be removed in a future major release. Please pass them in an object instead: { operationNames: string[] }.");
		} else implementation = footer({
			operationNames,
			operations,
			title: titles.implementation,
			hasMutator,
			hasAwaitedType
		});
	} catch {
		implementation = footer({
			operationNames,
			operations,
			title: titles.implementation,
			hasMutator,
			hasAwaitedType
		});
	}
	return {
		implementation,
		implementationMock: `]\n`
	};
};
const generateClientTitle = async ({ outputClient = DEFAULT_CLIENT, title, customTitleFunc, output }) => {
	const { title: generatorTitle } = await getGeneratorClient(outputClient, output);
	if (!generatorTitle) return {
		implementation: "",
		implementationMock: `get${pascal(title)}Mock`
	};
	if (customTitleFunc) {
		const customTitle = customTitleFunc(title);
		return {
			implementation: generatorTitle(customTitle),
			implementationMock: `get${pascal(customTitle)}Mock`
		};
	}
	return {
		implementation: generatorTitle(title),
		implementationMock: `get${pascal(title)}Mock`
	};
};
/**
* Invokes the underlying mock generator (msw, faker, or a user-provided
* ClientMockBuilder) for a single generator entry. Returns the standard
* `ClientMockGeneratorBuilder` shape (function/handler/handlerName +
* imports) regardless of which generator handled it.
*/
const invokeMockGenerator = async (verbOption, options, entry) => {
	if (isFunction(entry)) return entry(verbOption, {
		...options,
		mock: entry
	});
	mockModuleCache$1 ??= import("@orval/mock");
	return (await mockModuleCache$1).generateMock(verbOption, {
		...options,
		mock: entry
	});
};
const generateOperations = (outputClient = DEFAULT_CLIENT, verbsOptions, options, output) => {
	const baseUrlImports = getBaseUrlRuntimeImports(output.baseUrl);
	return asyncReduce(verbsOptions, async (acc, verbOption) => {
		const { client: generatorClient } = await getGeneratorClient(outputClient, output);
		const client = await generatorClient(verbOption, options, outputClient, output);
		if (!client.implementation) return acc;
		const mockOutputs = await Promise.all(output.mock.generators.filter((entry) => {
			if (!isFunction(entry) && entry.type === OutputMockType.FAKER && entry.operationResponses === false) return false;
			return true;
		}).map(async (entry) => {
			const generated = await invokeMockGenerator(verbOption, options, entry);
			return {
				type: isFunction(entry) ? OutputMockType.MSW : entry.type,
				implementation: generated.implementation,
				imports: generated.imports,
				strictMockSchemaTypeNames: generated.strictMockSchemaTypeNames,
				strictMockSchemaKinds: generated.strictMockSchemaKinds
			};
		}));
		const hasImplementation = client.implementation.trim().length > 0;
		const preferredOperationKey = verbOption.operationName;
		const baseOperationKey = verbOption.operationId ? `${verbOption.operationId}::${verbOption.operationName}` : verbOption.operationName;
		let operationKey = Object.hasOwn(acc, preferredOperationKey) ? baseOperationKey : preferredOperationKey;
		let collisionIndex = 1;
		while (Object.hasOwn(acc, operationKey)) {
			collisionIndex += 1;
			operationKey = `${baseOperationKey}::${collisionIndex}`;
		}
		acc[operationKey] = {
			implementation: hasImplementation ? (client.docComment ?? verbOption.doc) + client.implementation : client.implementation,
			imports: [...baseUrlImports, ...client.imports],
			mockOutputs,
			tags: verbOption.tags,
			mutator: verbOption.mutator,
			clientMutators: client.mutators,
			formData: verbOption.formData,
			formUrlEncoded: verbOption.formUrlEncoded,
			paramsSerializer: verbOption.paramsSerializer,
			paramsFilter: verbOption.paramsFilter,
			operationName: verbOption.operationName,
			urlHelperName: verbOption.urlHelperName,
			fetchReviver: verbOption.fetchReviver,
			...client.returnType ? { types: { result: client.returnType } } : void 0
		};
		return acc;
	}, {});
};
const generateExtraFiles = async (outputClient = DEFAULT_CLIENT, verbsOptions, output, context, schemaTagMap, schemaOutputPlan) => {
	const { extraFiles: generateExtraFiles } = await getGeneratorClient(outputClient, output);
	if (!generateExtraFiles) return [];
	return generateExtraFiles(verbsOptions, output, context, schemaTagMap, schemaOutputPlan);
};
//#endregion
//#region src/api.ts
let mockModuleCache;
const loadMockModule = () => mockModuleCache ??= import("@orval/mock");
/**
* Every `mutationInvalidates` list that reaches this output: the top-level one
* plus whatever a tag or operation override merged in. `mergeDeep` replaces the
* array rather than concatenating, so a per-operation rule set is invisible in
* `output.override` and has to be read off the verb options.
*/
const collectMutationInvalidates = (output, pathEntries) => [output.override.query.mutationInvalidates, ...pathEntries.flatMap(({ verbsOptions }) => verbsOptions.map(({ override }) => override.query.mutationInvalidates))].flatMap((rules) => rules ?? []);
async function getApiBuilder({ input, output, context, componentSchemas }) {
	const mock = output.mock.generators.length > 0 ? await loadMockModule() : void 0;
	const pathEntries = [];
	const reservedOperationNames = /* @__PURE__ */ new Set();
	const reservedTypeNames = /* @__PURE__ */ new Set();
	for (const [pathRoute, verbs] of Object.entries(context.spec.paths ?? {})) {
		if (!verbs) continue;
		const route = getRoute(pathRoute);
		let resolvedVerbs = verbs;
		if (!isInlineSchema(verbs)) {
			const { schema } = resolveRef(verbs, context);
			resolvedVerbs = schema;
		}
		let verbsOptions = await generateVerbsOptions({
			verbs: resolvedVerbs,
			input,
			output,
			route,
			pathRoute,
			context,
			reservedOperationNames,
			reservedTypeNames
		});
		if (output.override.useDeprecatedOperations === false) verbsOptions = verbsOptions.filter((verb) => !verb.deprecated);
		pathEntries.push({
			pathRoute,
			route,
			resolvedVerbs,
			verbsOptions
		});
	}
	const allOperationNames = pathEntries.flatMap(({ verbsOptions }) => verbsOptions.map(({ operationName }) => operationName));
	for (const warning of getUnknownMutationInvalidatesWarnings({
		mutationInvalidates: collectMutationInvalidates(output, pathEntries),
		operationNames: allOperationNames
	})) logger.warn(warning);
	const helperOptions = pathEntries.flatMap(({ verbsOptions }) => verbsOptions.filter(({ mutator }) => !mutator));
	const helperNames = getOperationUrlHelperNames(allOperationNames, helperOptions.map(({ operationName }) => operationName));
	const helperNamesByOption = new Map(helperOptions.map((verbOption, index) => [verbOption, helperNames[index]]));
	const api = await asyncReduce(pathEntries, async (acc, { pathRoute, route, resolvedVerbs, verbsOptions }) => {
		const resolvedVerbOptions = verbsOptions.map((verbOption) => {
			const urlHelperName = helperNamesByOption.get(verbOption);
			return urlHelperName ? {
				...verbOption,
				urlHelperName
			} : verbOption;
		});
		const schemas = [];
		for (const { queryParams, headers, body, response, props } of resolvedVerbOptions) {
			schemas.push(...props.flatMap((param) => param.type === GetterPropType.NAMED_PATH_PARAMS ? param.schema : []));
			if (queryParams) schemas.push(queryParams.schema, ...queryParams.deps);
			if (headers) schemas.push(headers.schema, ...headers.deps);
			schemas.push(...body.schemas, ...response.schemas);
		}
		const fullRoute = getFullRoute(route, resolvedVerbs.servers ?? context.spec.servers, output.baseUrl);
		if (!output.target) throw new Error("Output does not have a target");
		const pathOperations = await generateOperations(output.client, resolvedVerbOptions, {
			route: fullRoute,
			pathRoute,
			override: output.override,
			context,
			output: output.target
		}, output);
		for (const verbOption of resolvedVerbOptions) acc.verbOptions[verbOption.operationId] = verbOption;
		acc.schemas.push(...schemas);
		for (const [key, value] of Object.entries(pathOperations)) {
			let operationKey = key;
			let counter = 1;
			while (Object.hasOwn(acc.operations, operationKey)) operationKey = `${key}::${++counter}`;
			acc.operations[operationKey] = value;
		}
		return acc;
	}, {
		operations: {},
		verbOptions: {},
		schemas: []
	});
	const schemaTagMap = isObject(output.schemas) && output.schemas.splitByTags ? buildSchemaTagMap(Object.values(api.operations).map((operation) => ({
		imports: operation.imports,
		tags: operation.tags
	})), [...componentSchemas, ...api.schemas]) : void 0;
	const schemaOutputPlan = createSchemaOutputPlanForOutput([...componentSchemas, ...api.schemas], output, schemaTagMap);
	const extraFiles = await generateExtraFiles(output.client, api.verbOptions, output, context, schemaTagMap, schemaOutputPlan);
	return {
		operations: api.operations,
		schemas: api.schemas,
		schemaTagMap,
		schemaOutputPlan,
		verbOptions: api.verbOptions,
		title: generateClientTitle,
		header: generateClientHeader,
		footer: generateClientFooter,
		imports: generateClientImports,
		importsMock: mock?.generateMockImports ?? (() => ""),
		finalizeMockImplementation: mock?.dedupeStrictMockTypeDeclarations,
		extraFiles
	};
}
//#endregion
//#region src/import-open-api.ts
function filterSpecComponents(spec, input) {
	const filters = input.filters;
	if (filters?.schemas) return filterPathsBySchemas(spec, filters.schemas, filters.mode);
	if (!filters?.tags) return spec;
	const referenced = collectReferencedComponents(spec, filters.tags, filters.mode);
	const allSchemas = spec.components?.schemas ?? {};
	return {
		...spec,
		components: {
			...spec.components,
			schemas: filters.includeUnreferencedSchemas ? allSchemas : pick(allSchemas, referenced.schemas),
			responses: pick(spec.components?.responses ?? {}, referenced.responses),
			parameters: pick(spec.components?.parameters ?? {}, referenced.parameters),
			requestBodies: pick(spec.components?.requestBodies ?? {}, referenced.requestBodies)
		}
	};
}
async function importOpenApi({ spec, input, output, target, workspace, projectName }) {
	const filteredSpec = filterSpecComponents(spec, input);
	const schemas = getApiSchemas({
		input,
		output,
		target,
		workspace,
		spec: filteredSpec
	});
	const api = await getApiBuilder({
		input,
		output,
		componentSchemas: schemas,
		context: {
			projectName,
			target,
			workspace,
			spec: filteredSpec,
			output
		}
	});
	return {
		...api,
		schemas: [...schemas, ...api.schemas],
		target,
		info: filteredSpec.info,
		spec: filteredSpec
	};
}
function getApiSchemas({ input, output, target, workspace, spec }) {
	const context = {
		target,
		workspace,
		spec,
		output
	};
	const schemaDefinition = generateSchemasDefinition(spec.components?.schemas, context, output.override.components.schemas.suffix, input.filters, output.override.components.schemas.prefix);
	const responseDefinition = generateComponentDefinition(spec.components?.responses, context, output.override.components.responses.suffix, output.override.components.responses.prefix);
	const swaggerResponseDefinition = generateComponentDefinition("responses" in spec ? spec.responses : void 0, context, "");
	const bodyDefinition = generateComponentDefinition(spec.components?.requestBodies, context, output.override.components.requestBodies.suffix, output.override.components.requestBodies.prefix);
	const parameters = generateParameterDefinition(spec.components?.parameters, context, output.override.components.parameters.suffix, output.override.components.parameters.prefix);
	return [
		...schemaDefinition,
		...responseDefinition,
		...swaggerResponseDefinition,
		...bodyDefinition,
		...parameters
	];
}
//#endregion
//#region src/import-specs.ts
async function resolveSpec(input, { parserOptions, transformer, workspace, unsafeDisableValidation = false }) {
	const allowedRefs = parserOptions?.externalRefs?.allow ?? [];
	const isWildcard = allowedRefs.includes("*");
	const { data: specData, origin } = await loadSpec(input, parserOptions?.headers);
	const refScan = scanRefs(specData);
	if (!isWildcard) {
		const disallowed = refScan.external.filter((ref) => !isAllowedRef(ref, allowedRefs, origin));
		if (disallowed.length > 0) throw new Error(formatDisallowedRefsError(disallowed, allowedRefs));
	} else {
		const docs = [...new Set(refScan.external.map(getRefDocument))];
		if (docs.length > 0) logger.warn(`External $ref documents being resolved:\n` + docs.map((d) => `  - ${d}`).join("\n"));
	}
	const dereferencedData = refScan.needsBundling ? await bundleAndDereferenceExternalRefs(specData, parserOptions, origin, isWildcard, allowedRefs) : specData;
	let transformedData = dereferencedData;
	if (transformer) {
		const applied = await applyInputTransformer(dereferencedData, transformer, workspace);
		transformedData = scanRefs(applied).needsBundling ? await bundleAndDereferenceExternalRefs(applied, parserOptions, origin, isWildcard, allowedRefs) : applied;
	}
	if (unsafeDisableValidation) logger.warn("OpenAPI spec validation is disabled.\n  Code generation with invalid specs is not guaranteed to work and may break in minor updates.\n  Bug reports with validation disabled will not be accepted.");
	else {
		validateComponentKeys(transformedData);
		const { valid, errors } = await validate(transformedData);
		if (!valid) throw new Error(`OpenAPI spec validation failed:\n${JSON.stringify(errors, void 0, 2)}`);
	}
	const formDataItems = isSwagger2(transformedData) ? collectSwagger2FormDataItems(transformedData) : void 0;
	transformedData = normalizeNullableRefs(transformedData);
	transformedData = preserveBinarySchemas(transformedData);
	const upgraded = upgrade(transformedData);
	if (!upgraded.specification) throw new Error("OpenAPI spec upgrade produced no document.");
	let specification = upgraded.specification;
	if (formDataItems && formDataItems.size > 0) specification = restoreSwagger2FormDataItems(specification, formDataItems);
	specification = normalizeToOpenApi31(specification);
	return specification;
}
/**
* Per the OpenAPI Reference Object rules, sibling properties on a `$ref` are
* ignored — so `{ $ref, nullable: true }` does NOT mean `Pet | null`. Many
* 3.0 specs still emit it that way. Rewrite such nodes into the valid 3.1 form
* `{ anyOf: [$ref, { type: 'null' }] }` and warn with the JSON Pointer path so
* users learn their spec was non-conformant.
*
* Honoring the author's evident intent that way is a choice, not a reading of
* the spec, and it is made everywhere the intent can survive into the emitted
* type. The one place it cannot is a direct member of an `allOf` whose null
* branch the rest of the intersection already absorbs — `null & { marker?: string }`
* is `never`, so the branch is inert whether it is emitted or not. There the
* sibling is dropped instead. Note that this depends on there *being* something
* to absorb it: `allOf: [{ $ref, nullable: true }]` on its own is still
* `Base | null`, and is rewritten like any other position. See
* `absorbsNullBranch` and the two branches below.
*
* Runs before `upgrade()`, which since @scalar/openapi-upgrader@0.2.13 applies
* the same rewrite without reporting it, and after bundling, so the warning
* fires once per occurrence rather than once per dereference site.
*/
function normalizeNullableRefs(spec, path = [], nullAbsorbed = false) {
	if (Array.isArray(spec)) return spec.map((item, i) => normalizeNullableRefs(item, [...path, String(i)], false));
	if (!isObject(spec)) return spec;
	const obj = spec;
	if (nullAbsorbed && isNullableRef(obj)) delete obj.nullable;
	if (!nullAbsorbed && isNullableRef(obj)) {
		const ref = obj.$ref;
		delete obj.nullable;
		delete obj.$ref;
		const jsonPointer = "#/" + path.join("/");
		logger.warn(`Invalid nullable reference found at ${jsonPointer}.\n  A \`$ref\` with a sibling \`nullable: true\` is out of spec (siblings on a reference are ignored).\n  Treating it as \`${ref} | null\` by rewriting to \`anyOf: [\`$ref\`, { type: "null" }]\`.\n  Fix the source spec with \`nullable: true\` + \`allOf: [$ref]\` (OpenAPI 3.0) or\n  \`anyOf: [$ref, { type: "null" }]\` (OpenAPI 3.1).`);
		return {
			anyOf: [{ $ref: ref }, { type: "null" }],
			...obj
		};
	}
	for (const [key, value] of Object.entries(obj)) {
		if (key === "allOf" && Array.isArray(value)) {
			const absorbed = absorbsNullBranch(obj, value);
			obj[key] = value.map((member, i) => normalizeNullableRefs(member, [
				...path,
				key,
				String(i)
			], absorbed));
			continue;
		}
		obj[key] = normalizeNullableRefs(value, [...path, key], false);
	}
	return obj;
}
/** A ReferenceObject carrying the out-of-spec `nullable: true` sibling. */
function isNullableRef(value) {
	if (!isObject(value)) return false;
	const obj = value;
	return "$ref" in obj && isString(obj.$ref) && obj.nullable === true;
}
/**
* Whether the null branch of a nullable `$ref` member is absorbed by the rest of
* the intersection, which is the only thing that makes dropping it lossless.
*
* `allOf` is an intersection, so the branch dies only when something else in it
* cannot be null — `null & { marker?: string }` is `never`. That something can
* come from either side: another member of the array, or the enclosing schema's
* own constraints, since `{ type: 'object', properties: {...}, allOf: [...] }` is
* itself an intersection of the two (`NullableParentWrapper` in
* regressions.yaml). With neither — a lone `allOf: [{ $ref, nullable: true }]`,
* or members that are all themselves nullable — the null survives and has to be
* kept.
*
* The check is deliberately syntactic: a bare `$ref` is not followed, so
* `allOf: [{ $ref: A, nullable: true }, { $ref: B }]` keeps the union even though
* `B` is usually a non-nullable object. That errs toward emitting a union that
* was not strictly needed, which is at worst noisier. Erring the other way would
* silently delete a `| null` the API can really return.
*/
function absorbsNullBranch(enclosing, members) {
	return isNonNullableObjectSchema(enclosing) || members.some((member) => isNonNullableObjectSchema(member));
}
function isNonNullableObjectSchema(value) {
	if (!isObject(value)) return false;
	const obj = value;
	if (obj.nullable === true) return false;
	return "properties" in obj || obj.type === "object";
}
/**
* Keywords whose value is data rather than document structure, so
* {@link preserveBinarySchemas} does not descend into them. `default` is
* deliberately absent: under `responses` it names the default response.
*/
const BINARY_WALK_DATA_KEYWORDS = /* @__PURE__ */ new Set([
	"example",
	"examples",
	"enum",
	"const"
]);
/**
* Rewrite `{ type: 'string', format: 'binary' }` — and, at a Swagger 2.0 body,
* `{ type: 'file' }` — into the 3.1 form
* `{ type: 'string', contentMediaType: 'application/octet-stream' }` before
* `upgrade()` runs (#4199).
*
* Since @scalar/openapi-upgrader@0.2.17 the upgrader drops `type` from every
* binary schema, and a whole-body one — directly under a Media Type Object —
* loses its `format` with no replacement too, on the grounds that the media
* type already describes the body. That leaves `{}`, and orval then has nothing
* to go on: a media type outside `isBinaryContentType` (`text/csv`, xlsx, ...)
* resolves to `unknown`, and the client reads the response with `res.text()`
* and `JSON.stringify`s the request body. Elsewhere the dropped `type` takes a
* `nullable: true` with it, since the upgrader has already folded the null into
* the `type` union it then deletes, so a nullable binary loses its `| null`.
*
* The rewrite produces what earlier upgraders produced. The upgrader leaves a
* schema with no `format` alone apart from turning `nullable` into a type
* union, so the result reaches `importOpenApi` in the shape orval reads as a
* `Blob`.
*
* A 3.0 document is rewritten wherever the pair appears, as the upgrader
* itself would. A 2.0 document only at a response or body parameter schema,
* the positions the upgrader turns into Media Type Objects: a `formData`
* `type: file` parameter becomes a multipart property, which the upgrader
* still gives a `contentMediaType` and `inferStringForContentKeywords` gives
* back its `type` (#4157).
*/
function preserveBinarySchemas(spec) {
	if (!isObject(spec)) return spec;
	const document = spec;
	const swagger2 = isSwagger2(document);
	if (!swagger2 && !(isString(document.openapi) && document.openapi.startsWith("3.0"))) return spec;
	walkForBinarySchemas(document, [], swagger2);
	return spec;
}
/**
* Rewrite every binary schema below `node` in place.
*
* @param inNameMap - Whether `node` is a map of names (`properties`,
*   `components/schemas`, `responses`, ...). Its keys are member names, not
*   keywords, so a property called `x-file` or a response called `examples` is
*   walked like any other member.
*/
function walkForBinarySchemas(node, path, swagger2, inNameMap = false) {
	if (Array.isArray(node)) {
		for (const [i, item] of node.entries()) walkForBinarySchemas(item, [...path, String(i)], swagger2);
		return;
	}
	if (!isObject(node)) return;
	const obj = node;
	if (swagger2 ? isSwagger2BinaryBody(obj, path) : isBinaryString(obj)) {
		obj.type = "string";
		delete obj.format;
		obj.contentMediaType = "application/octet-stream";
		return;
	}
	for (const [key, value] of Object.entries(obj)) {
		if (!inNameMap && (BINARY_WALK_DATA_KEYWORDS.has(key) || isExtension(key))) continue;
		walkForBinarySchemas(value, [...path, key], swagger2, !inNameMap && isNameMapKeyword(key));
	}
}
/** Whether the value under keyword `key` is a map keyed by member names. */
function isNameMapKeyword(key) {
	return key === "schemas" || SCHEMA_MAP_KEYWORDS.has(key) || OAS_MAP_KEYWORDS.has(key);
}
/** A 3.0 `{ type: 'string', format: 'binary' }` schema. */
function isBinaryString(obj) {
	return obj.type === "string" && obj.format === "binary";
}
/**
* A binary `schema` on a Swagger 2.0 Response or body Parameter, whether it is
* inline under an operation or reusable under the top-level maps.
*/
function isSwagger2BinaryBody(obj, path) {
	const grandparent = path.at(-3);
	return path.at(-1) === "schema" && (grandparent === "responses" || grandparent === "parameters") && (obj.type === "file" || isBinaryString(obj));
}
/** Schema keywords holding a map of named subschemas. */
const SCHEMA_MAP_KEYWORDS = /* @__PURE__ */ new Set([
	"$defs",
	"definitions",
	"dependentSchemas",
	"patternProperties",
	"properties"
]);
/** Schema keywords holding a subschema, or an array of them. */
const SUBSCHEMA_KEYWORDS = /* @__PURE__ */ new Set([
	"additionalItems",
	"additionalProperties",
	"allOf",
	"anyOf",
	"contains",
	"else",
	"if",
	"items",
	"not",
	"oneOf",
	"prefixItems",
	"propertyNames",
	"then",
	"unevaluatedItems",
	"unevaluatedProperties"
]);
/**
* OpenAPI fields holding a map keyed by an arbitrary name — a status code, a
* media type, a header name, a path. Their keys are never keywords, so a
* `default` response or a header called `example` must still be traversed.
*/
const OAS_MAP_KEYWORDS = /* @__PURE__ */ new Set([
	"callbacks",
	"content",
	"encoding",
	"headers",
	"links",
	"mapping",
	"parameters",
	"pathItems",
	"paths",
	"requestBodies",
	"responses",
	"scopes",
	"securitySchemes",
	"variables",
	"webhooks"
]);
/**
* Schema keywords whose value is arbitrary user data. Nothing below them may be
* rewritten: an `example` payload that happens to carry a `nullable` key is
* data the API really returns, not 3.0 syntax.
*/
const SCHEMA_DATA_KEYWORDS = /* @__PURE__ */ new Set([
	"const",
	"default",
	"enum",
	"example",
	"examples"
]);
/**
* The same, for the non-schema objects that also carry data: a Parameter,
* Header or Media Type Object has `example`/`examples`, and
* `components/examples` is a map of Example Objects that holds no schemas.
*/
const OAS_DATA_KEYWORDS = /* @__PURE__ */ new Set(["example", "examples"]);
/**
* The same, for a Link Object. The spec types both of these as
* `Any | {expression}` — the literal value or runtime expression to send when
* following the link, not an OpenAPI object. `parameters` in particular is a map
* of names to values, unlike `parameters` everywhere else in the document.
*
* @see https://spec.openapis.org/oas/v3.1.2.html#link-object
*/
const LINK_DATA_KEYWORDS = /* @__PURE__ */ new Set(["parameters", "requestBody"]);
/** The `format` values 3.1 replaced with `contentMediaType`/`contentEncoding`. */
const CONTENT_FORMATS = /* @__PURE__ */ new Set([
	"base64",
	"binary",
	"byte"
]);
/**
* Assertions that can only be satisfied by something other than a string, so
* {@link inferStringForContentKeywords} leaves the schema alone rather than
* narrowing away instances it admits.
*
* Deliberately a list of assertions and not of every keyword: annotations
* (`description`, `title`, `example`, `deprecated`, ...) and the string
* assertions (`pattern`, `minLength`, `maxLength`, `format`) say nothing
* against a string, and a part documented with a `description` is the common
* case the inference exists for.
*/
const NON_STRING_ASSERTIONS = /* @__PURE__ */ new Set([
	"$ref",
	"$dynamicRef",
	"allOf",
	"anyOf",
	"oneOf",
	"not",
	"if",
	"then",
	"else",
	"enum",
	"const",
	"properties",
	"patternProperties",
	"additionalProperties",
	"unevaluatedProperties",
	"propertyNames",
	"required",
	"dependentRequired",
	"dependentSchemas",
	"minProperties",
	"maxProperties",
	"items",
	"prefixItems",
	"unevaluatedItems",
	"contains",
	"minContains",
	"maxContains",
	"minItems",
	"maxItems",
	"uniqueItems",
	"minimum",
	"maximum",
	"exclusiveMinimum",
	"exclusiveMaximum",
	"multipleOf"
]);
/**
* Close the OpenAPI 3.0 syntax `upgrade()` leaves behind, so the document handed
* to `importOpenApi` is fully 3.1-shaped (#4115).
*
* `@scalar/openapi-upgrader` bails out of its `nullable` rewrite whenever there
* is no sibling `type`, `$ref` or `allOf` to attach the null to — its own source
* says so: *"Otherwise there is nothing for `nullable` to attach to, so leave the
* schema untouched."* That leaves `nullable` sitting next to `enum`, `anyOf` and
* `oneOf`. Two further gaps are consequences of the order its own rules run in,
* and one is the upgrader early-returning on a document that already declares
* 3.1 while still carrying 3.0 syntax:
*
* - it widens `type` to `[T, 'null']` without widening a sibling `enum`, and the
*   two combine with AND — so `{ type: 'string', enum: ['a'], nullable: true }`
*   comes back admitting only `'a'`, with the author's `null` gone and the
*   `'null'` in `type` unreachable;
* - having widened `type` into an array, its `format: binary | base64 | byte`
*   handling no longer matches (it tests `type === 'string'`), so those formats
*   survive on nullable string unions;
* - a document declaring `3.1` is skipped wholesale, so every 3.0 keyword in one
*   reaches us untouched.
* - from 0.2.16 it writes `contentMediaType`/`contentEncoding` in place of a
*   `format` but drops the `type: 'string'` that carried it, leaving a part
*   that describes a string with no type at all (#4157).
*
* Every rule below therefore stands on its own rather than assuming the upgrader
* already handled anything with a `type`.
*
* Runs *after* `upgrade()`, unlike {@link normalizeNullableRefs}, which has to go
* first to keep its diagnostic. Nothing here warns: these specs were valid 3.0,
* and the loss is the upgrader's, not the author's.
*
* @param spec - Node to normalize, mutated in place where possible.
* @param kind - What `spec` is. Defaults to a whole OpenAPI document; pass
*   `'schema'` to normalize a bare Schema Object.
*/
function normalizeToOpenApi31(spec, kind = "oas") {
	return normalizeNode(spec, { kind });
}
function normalizeNode(node, context) {
	if (Array.isArray(node)) {
		const memberContext = arrayMemberContext(context);
		return node.map((item) => normalizeNode(item, memberContext));
	}
	if (!isObject(node)) return node;
	const obj = context.kind === "schema" ? normalizeSchemaNode(node, context.mediaType) : node;
	for (const [key, value] of Object.entries(obj)) {
		if (holdsData(context.kind, key)) continue;
		obj[key] = normalizeNode(value, childContext(context, key));
	}
	return obj;
}
/**
* Whether `key` names arbitrary user data rather than a schema. Only true where
* the key is really a keyword — inside a map the same word is a name, which is
* what keeps a `default` response and a header called `example` reachable.
*/
function holdsData(kind, key) {
	if (kind === "schemaMap" || kind === "oasMap") return false;
	if (isExtension(key)) return true;
	switch (kind) {
		case "schema": return SCHEMA_DATA_KEYWORDS.has(key);
		case "link": return LINK_DATA_KEYWORDS.has(key);
		default: return OAS_DATA_KEYWORDS.has(key);
	}
}
/**
* Whether `key` is a Specification Extension.
*
* An extension's value is explicitly unrestricted, so it is the user's data and
* not ours to rewrite — even when it happens to be schema-shaped. Nothing orval
* reads out of an extension is a schema: `x-enumNames`, `x-enum-varnames` and
* `x-enumDescriptions` hold arrays of strings, `x-codegen-request-body-name`
* holds a string, `x-orval-property-overrides` is written by the Zod generator
* well after this pass, and `x-ext` is consumed and removed by
* `dereferenceExternalRef` before the upgrade runs.
*/
function isExtension(key) {
	return key.startsWith("x-");
}
/** What the members of an array at this position are. */
function arrayMemberContext(context) {
	switch (context.kind) {
		case "schema":
		case "schemaMap": return {
			...context,
			kind: "schema"
		};
		default: return {
			...context,
			kind: "oas"
		};
	}
}
/** What the value held under `key` is, given what the current node is. */
function childContext(context, key) {
	switch (context.kind) {
		case "schemaMap": return {
			...context,
			kind: "schema"
		};
		case "oasMap": switch (context.mapKeyword) {
			case "content": return {
				kind: "oas",
				mediaType: key
			};
			case "links": return {
				...context,
				kind: "link",
				mapKeyword: void 0
			};
			default: return {
				...context,
				kind: "oas",
				mapKeyword: void 0
			};
		}
		case "schema":
			if (SCHEMA_MAP_KEYWORDS.has(key)) return {
				...context,
				kind: "schemaMap",
				mapKeyword: void 0
			};
			if (SUBSCHEMA_KEYWORDS.has(key)) return {
				...context,
				kind: "schema",
				mapKeyword: void 0
			};
			return {
				...context,
				kind: "oas",
				mapKeyword: void 0
			};
		default:
			if (key === "schema") return {
				...context,
				kind: "schema",
				mapKeyword: void 0
			};
			if (key === "schemas") return {
				...context,
				kind: "schemaMap",
				mapKeyword: void 0
			};
			if (OAS_MAP_KEYWORDS.has(key)) return {
				...context,
				kind: "oasMap",
				mapKeyword: key
			};
			return {
				...context,
				kind: "oas",
				mapKeyword: void 0
			};
	}
}
/** Apply every 3.0-residue rule to one schema. May return a replacement node. */
function normalizeSchemaNode(obj, mediaType) {
	inferStringForContentKeywords(obj);
	const withoutNullable = resolveNullable(obj);
	widenEnumForNullableType(withoutNullable);
	convertContentFormat(withoutNullable, mediaType);
	normalizeExclusiveBounds(withoutNullable);
	return withoutNullable;
}
/**
* Attach a `nullable: true` to whatever sits beside it, in the 3.1 form for that
* shape, and remove the keyword either way — 3.1 has no `nullable`, so leaving it
* is never right.
*
* `allOf` is the one shape that cannot simply gain a `{ type: 'null' }` member:
* `allOf` is an intersection, so null intersected with the rest is `never` and
* the schema would admit nothing. It has to be wrapped in a union instead.
*/
function resolveNullable(obj) {
	if (!("nullable" in obj)) return obj;
	const nullable = obj.nullable === true;
	delete obj.nullable;
	if (!nullable) return obj;
	if (obj.type !== void 0) {
		const members = Array.isArray(obj.type) ? obj.type : [obj.type];
		obj.type = members.includes("null") ? members : [...members, "null"];
		return obj;
	}
	const refKey = isString(obj.$ref) ? "$ref" : isString(obj.$dynamicRef) ? "$dynamicRef" : void 0;
	if (refKey) {
		const ref = obj[refKey];
		delete obj[refKey];
		return {
			...obj,
			anyOf: [{ [refKey]: ref }, { type: "null" }]
		};
	}
	for (const key of ["anyOf", "oneOf"]) {
		const branches = obj[key];
		if (Array.isArray(branches)) {
			if (!branches.some(isNullBranch)) branches.push({ type: "null" });
			return obj;
		}
	}
	if (Array.isArray(obj.allOf)) {
		const { allOf, ...rest } = obj;
		const base = allOf.length === 1 ? allOf[0] : { allOf };
		return {
			...rest,
			anyOf: [base, { type: "null" }]
		};
	}
	if (Array.isArray(obj.enum)) {
		if (!obj.enum.includes(null)) obj.enum.push(null);
		return obj;
	}
	return obj;
}
/**
* Repair the widening `upgrade()` does by halves. `type` and `enum` combine with
* AND, so a type union admitting null next to an enum that does not list it
* makes the null unreachable — which is never what the author of the 3.0 spec
* wrote, since `nullable: true` is the only way that pairing arises.
*/
function widenEnumForNullableType(obj) {
	if (Array.isArray(obj.type) && obj.type.includes("null") && Array.isArray(obj.enum) && !obj.enum.includes(null)) obj.enum.push(null);
}
/**
* Apply the 3.1 replacements for the string `format`s that became content
* keywords. The upgrader does this too, but only for a bare `type: 'string'`,
* and its own `nullable` rule has already turned that into `['string', 'null']`
* by the time the check runs.
*/
function convertContentFormat(obj, mediaType) {
	if (!isString(obj.format) || !CONTENT_FORMATS.has(obj.format)) return;
	if (!(Array.isArray(obj.type) ? obj.type : [obj.type]).includes("string")) return;
	const format = obj.format;
	delete obj.format;
	if (format === "binary") {
		obj.contentMediaType = "application/octet-stream";
		return;
	}
	obj.contentEncoding = "base64";
	if (format === "byte" && mediaType !== void 0) obj.contentMediaType = mediaType;
}
/**
* Give a schema that carries only `contentMediaType`/`contentEncoding` the
* `type: 'string'` those keywords describe (#4157).
*
* Both are string-only annotations — JSON Schema says they are ignored for any
* other instance type — so a schema asserting one and no `type` describes a
* string, and reading it as "any type" is what made the field come out
* `unknown`. `@scalar/openapi-upgrader` produces exactly that shape from
* `>= 0.2.16`: converting a Swagger 2.0 `type: file` parameter, or any
* `{ type: 'string', format: 'binary' }`, it writes the content keyword and
* drops the `type` that carried it. orval's binary detection is gated on a
* string-like `type`, so the part lost its `Blob | File` in the model, its
* `instanceof Blob` in the zod and effect validators, and its file value in
* the mocks.
*
* Only a schema that asserts nothing a string cannot satisfy is narrowed. A
* `$ref` or a composition carrying a content keyword describes whatever the
* reference or the branches describe, and an object, array or numeric assertion
* says outright that some admitted instance is not a string; annotating `type`
* there would drop those instances, so {@link NON_STRING_ASSERTIONS} leaves the
* schema as authored. Annotations do not block it, so a documented part still
* gets its type.
*/
function inferStringForContentKeywords(obj) {
	if (obj.type !== void 0) return;
	if (!isString(obj.contentMediaType) && !isString(obj.contentEncoding)) return;
	for (const keyword of NON_STRING_ASSERTIONS) if (keyword in obj) return;
	obj.type = "string";
}
/**
* 3.0's boolean `exclusiveMinimum`/`exclusiveMaximum` modified a sibling
* `minimum`/`maximum`; 3.1's holds the bound itself. The upgrader converts them,
* but assigns `schema.minimum` unconditionally — so a spec with the flag and no
* bound ends up with the key present and holding `undefined`, which is still not
* a valid 3.1 schema.
*/
function normalizeExclusiveBounds(obj) {
	for (const [flag, bound] of [["exclusiveMinimum", "minimum"], ["exclusiveMaximum", "maximum"]]) {
		if (!(flag in obj)) continue;
		const value = obj[flag];
		if (value === true) {
			if (typeof obj[bound] === "number") obj[flag] = obj[bound];
			else delete obj[flag];
			delete obj[bound];
			continue;
		}
		if (value === false || value === void 0) delete obj[flag];
	}
}
function isNullBranch(value) {
	return isObject(value) && (value.type === "null" || isNullOnlyEnum(value));
}
/**
* A stable identity for a parameter: `in` + `name`. Only string values
* participate — a non-string `in`/`name` cannot dedupe against anything.
*/
function paramKey(param, resolveParameter) {
	const resolved = resolveParameter(param);
	if (!resolved) return void 0;
	if (!isString(resolved.in) || !isString(resolved.name)) return;
	return `${resolved.in}:${resolved.name}`;
}
function isSwagger2(document) {
	return document.swagger === "2.0";
}
function collectSwagger2FormDataItems(document) {
	const reusableParameters = isObject(document.parameters) ? document.parameters : {};
	const resolveParameter = (param) => {
		if (!isObject(param)) return;
		if ("$ref" in param && isString(param.$ref)) {
			const ref = param.$ref;
			if (!ref.startsWith("#/parameters/")) return;
			const target = reusableParameters[ref.slice(13)];
			return isObject(target) ? target : void 0;
		}
		return param;
	};
	const formDataItems = /* @__PURE__ */ new Map();
	const paths = isObject(document.paths) ? document.paths : {};
	for (const [path, pathItem] of Object.entries(paths)) {
		if (!isObject(pathItem)) continue;
		const pathLevelParams = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];
		for (const [method, operation] of Object.entries(pathItem)) {
			if (!isObject(operation)) continue;
			const operationParams = Array.isArray(operation.parameters) ? operation.parameters : void 0;
			if (!operationParams && pathLevelParams.length === 0) continue;
			const merged = mergePathAndOperationParameters(pathLevelParams, operationParams, resolveParameter);
			const byName = /* @__PURE__ */ new Map();
			for (const rawParam of merged) {
				const param = resolveParameter(rawParam);
				if (!param || param.in !== "formData" || !isObject(param.items)) continue;
				byName.set(String(param.name), param.items);
			}
			const opKeys = new Set((operationParams ?? []).map((p) => paramKey(p, resolveParameter)).filter((k) => k !== void 0));
			const overriddenNames = /* @__PURE__ */ new Set();
			for (const rawParam of pathLevelParams) {
				const param = resolveParameter(rawParam);
				if (!param || param.in !== "formData" || !isString(param.name)) continue;
				const key = paramKey(rawParam, resolveParameter);
				if (key !== void 0 && opKeys.has(key)) overriddenNames.add(param.name);
			}
			if (byName.size > 0) {
				let methods = formDataItems.get(path);
				if (!methods) {
					methods = /* @__PURE__ */ new Map();
					formDataItems.set(path, methods);
				}
				methods.set(method, {
					byName,
					overriddenNames
				});
			}
		}
	}
	return formDataItems;
}
/**
* Merge path-item parameters into an operation's own parameters per Swagger 2.0
* semantics: operation-level parameters override path-level ones with the same
* (name, in) pair. `$ref`s are resolved (when possible) so a ref and its inline
* equivalent dedupe against each other.
*/
function mergePathAndOperationParameters(pathLevel, operationLevel, resolveParameter) {
	const opKeys = new Set((operationLevel ?? []).map((p) => paramKey(p, resolveParameter)).filter((k) => k !== void 0));
	return [...pathLevel.filter((p) => {
		const key = paramKey(p, resolveParameter);
		return key === void 0 || !opKeys.has(key);
	}), ...operationLevel ?? []];
}
/**
* Re-apply captured Swagger 2.0 formData item schemas onto the upgraded
* document. Only patches array-typed schema properties that the upgrader
* left without an `items` key, so it never overrides anything the upgrader
* already preserved.
*/
function restoreSwagger2FormDataItems(document, captured) {
	const paths = isObject(document.paths) ? document.paths : {};
	const components = isObject(document.components) ? document.components : {};
	const requestBodies = isObject(components.requestBodies) ? components.requestBodies : {};
	const resolveRequestBody = (requestBody) => {
		if (!isObject(requestBody)) return;
		if ("$ref" in requestBody && isString(requestBody.$ref)) {
			const ref = requestBody.$ref;
			if (!ref.startsWith("#/components/requestBodies/")) return;
			const target = requestBodies[ref.slice(27)];
			return isObject(target) ? target : void 0;
		}
		return requestBody;
	};
	const patchProperties = (requestBody, byName) => {
		const content = requestBody.content;
		if (!isObject(content)) return;
		for (const mediaType of Object.values(content)) {
			if (!isObject(mediaType)) continue;
			const schema = mediaType.schema;
			if (!isObject(schema)) continue;
			const properties = schema.properties;
			if (!isObject(properties)) continue;
			for (const [paramName, items] of byName) {
				const property = properties[paramName];
				if (!isObject(property)) continue;
				const propType = property.type;
				if (!(propType === "array" || Array.isArray(propType) && propType.includes("array")) || property.items !== void 0) continue;
				property.items = items;
			}
		}
	};
	for (const [path, methods] of captured) {
		const pathItem = paths[path];
		if (!isObject(pathItem)) continue;
		for (const [method, capture] of methods) {
			const operation = pathItem[method];
			if (!isObject(operation)) continue;
			const { byName, overriddenNames } = capture;
			const effectiveBodies = /* @__PURE__ */ new Set();
			const directBody = resolveRequestBody(operation.requestBody);
			if (directBody) effectiveBodies.add(directBody);
			for (const rawParam of Array.isArray(operation.parameters) ? operation.parameters : []) {
				const body = resolveRequestBody(rawParam);
				if (body) effectiveBodies.add(body);
			}
			for (const body of effectiveBodies) patchProperties(body, byName);
			const sharedByNames = new Map([...byName].filter(([name]) => !overriddenNames.has(name)));
			for (const rawParam of Array.isArray(pathItem.parameters) ? pathItem.parameters : []) {
				const body = resolveRequestBody(rawParam);
				if (body) patchProperties(body, sharedByNames);
			}
		}
	}
	return document;
}
async function applyInputTransformer(data, transformer, workspace) {
	const transformerFn = await dynamicImport(transformer, workspace);
	const result = await transformerFn(data);
	if (!isObject(result)) {
		const source = isString(transformer) ? transformer : transformerFn.name || "<inline function>";
		throw new Error(`input.override.transformer must return an OpenAPI document object; got ${result === void 0 ? "undefined" : typeof result} from ${source}. Ensure your transformer returns the (possibly modified) spec.`);
	}
	return result;
}
/**
* Bundle external references into the document and then resolve the `x-ext`
* entries that `@scalar/json-magic` produces. Shared by the initial pass and
* the post-transformer pass (#3327); `origin` lets the second pass resolve refs
* relative to the original spec file when the input is an in-memory object.
*/
async function bundleAndDereferenceExternalRefs(input, parserOptions, origin, isWildcard = false, allowedExternalRefs = []) {
	return dereferenceExternalRef(await bundle(input, {
		plugins: [
			createSafeFileLoader(origin, isWildcard, allowedExternalRefs),
			createSafeUrlLoader(origin, isWildcard, allowedExternalRefs, parserOptions?.headers),
			parseJson(),
			parseYaml()
		],
		treeShake: false,
		...parserOptions?.compress ? { compress: parserOptions.compress } : {},
		...origin ? { origin } : {}
	}), parserOptions?.externalRefs?.strategy);
}
/**
* JSON_SCHEMA keeps YAML scalars as plain JSON values — without it js-yaml
* coerces date-like strings such as `2026-01-27` into `Date` objects (#3947).
* It also drops the `merge` type, so the `<<` merge key would survive into the
* document as a literal property and the validator would reject it with
* "Property << is not expected to be here" (#4102). Add `merge` back on top of
* JSON_SCHEMA to keep both behaviours.
*
* js-yaml ships this exact type as `types.merge` but does not declare it in
* `@types/js-yaml`, so it is redefined here; the loader keys the merge off the
* tag name, not the type instance.
*/
const MERGE_KEY_TYPE = new yaml.Type("tag:yaml.org,2002:merge", {
	kind: "scalar",
	resolve: (data) => data === "<<" || data === null
});
const SPEC_YAML_SCHEMA = yaml.JSON_SCHEMA.extend({ implicit: [MERGE_KEY_TYPE] });
/**
* Load the top-level spec into an inline object so we can scan it for external
* `$ref`s before `bundle()` resolves them. The top-level target is trusted
* (user-configured `input.target`); only `$ref` values inside the spec are
* untrusted.
*/
function parseSpec(text) {
	const result = parseSpecText(text);
	if (!isObject(result)) throw new Error("OpenAPI spec must be a valid JSON/YAML object.");
	return result;
}
/**
* JSON is a strict subset of YAML, so a JSON document parses the same either
* way — but `JSON.parse` is an order of magnitude faster than js-yaml on the
* large documents orval is usually pointed at. Use the native parser whenever
* the text looks like a JSON object, and fall back to YAML when it turns out
* not to be one so that everything js-yaml accepts today keeps working (flow
* mappings with unquoted keys, a comment after the opening `{`, ...).
*
* `trimStart()` also strips a leading BOM, which `JSON.parse` rejects.
*/
function parseSpecText(text) {
	const trimmed = text.trimStart();
	if (trimmed.startsWith("{")) try {
		return JSON.parse(trimmed);
	} catch {}
	return yaml.load(text, { schema: SPEC_YAML_SCHEMA });
}
async function loadSpec(input, headers) {
	if (!isString(input)) return { data: structuredClone(input) };
	if (isUrl(input)) {
		const response = await fetch(input, { headers: getHeadersForUrl(input, headers) });
		if (!response.ok) throw new Error(`Failed to fetch OpenAPI spec from ${input}: ${response.status} ${response.statusText}`);
		return {
			data: parseSpec(await response.text()),
			origin: input
		};
	}
	return {
		data: parseSpec(await readFile(input, "utf-8")),
		origin: input
	};
}
/**
* Strip the JSON pointer fragment (`#/...`) from a `$ref` value, leaving only
* the document target (file path or URL).
*/
function getRefDocument(ref) {
	const hashIndex = ref.indexOf("#");
	return hashIndex === -1 ? ref : ref.slice(0, hashIndex);
}
/**
* Walk a spec object once and classify every `$ref` it contains.
*/
function scanRefs(obj) {
	const external = /* @__PURE__ */ new Set();
	let needsBundling = false;
	function walk(val) {
		if (Array.isArray(val)) {
			val.forEach(walk);
			return;
		}
		if (isObject(val)) {
			if ("$ref" in val && isString(val.$ref)) {
				if (!val.$ref.startsWith("#")) external.add(val.$ref);
				needsBundling ||= !val.$ref.startsWith("#/");
			}
			Object.values(val).forEach(walk);
		}
	}
	walk(obj);
	return {
		external: [...external],
		needsBundling
	};
}
/**
* Resolve a ref document target (the part before `#`) to a canonical path or
* URL, so it can be compared against allow-list entries that were resolved the
* same way.
*/
function resolveRefTarget(ref, origin) {
	const doc = getRefDocument(ref);
	if (isUrl(doc)) return new URL(doc).href;
	if (origin && isUrl(origin)) return new URL(doc, origin).href;
	if (origin) return path.resolve(path.dirname(origin), doc);
	return path.resolve(doc);
}
/**
* Check whether a `$ref` is allowed by the user's allow-list. Both the ref and
* the allow-list entries are resolved against the spec origin so that
* `./schemas/pet.yaml` in the spec matches `./schemas/pet.yaml` in the config.
*/
function isAllowedRef(ref, allowedExternalRefs, origin) {
	const resolved = resolveRefTarget(ref, origin);
	return allowedExternalRefs.some((entry) => resolveRefTarget(entry, origin) === resolved);
}
function formatDisallowedRefsError(disallowed, currentAllowed) {
	const docs = [...new Set(disallowed.map(getRefDocument))];
	const all = [.../* @__PURE__ */ new Set([...currentAllowed, ...docs])];
	const configSnippet = JSON.stringify({ input: { parserOptions: { externalRefs: { allow: all } } } }, null, 2);
	return `External \$ref targets are not allowed by default.
Add them to your config, or use externalRefs.allow: ['*'] to allow all.

Disallowed refs:\n${disallowed.map((r) => `  - ${r}`).join("\n")}\n\nSuggested config:\n${configSnippet}`;
}
/**
* Wrap `readFiles()` so every file read is checked against the allow-list.
* The top-level spec file (matching `origin`) is always allowed; subsequent
* reads must match an explicit entry or the wildcard.
*/
function createSafeFileLoader(origin, isWildcard, allowedExternalRefs) {
	const base = readFiles();
	return {
		type: "loader",
		validate: base.validate,
		async exec(value) {
			if (isWildcard) return base.exec(value);
			if (origin && path.resolve(value) === path.resolve(origin)) return base.exec(value);
			if (!isAllowedRef(value, allowedExternalRefs, origin)) throw new Error(`Refused to read external file: ${value}\nAdd it to externalRefs.allow or use ['*'] to allow all.`);
			return base.exec(value);
		}
	};
}
/** Redirect hops to follow before giving up, matching common HTTP clients. */
const MAX_EXTERNAL_REF_REDIRECTS = 5;
/**
* Whether a URL may be fetched: the top-level spec URL is always allowed, and
* anything else has to match an explicit allow-list entry. Mirrors the check in
* `createSafeUrlLoader.exec` so a redirect cannot reach somewhere the initial
* `$ref` could not.
*/
function isFetchableUrl(url, origin, allowedExternalRefs) {
	if (origin && resolveRefTarget(url, origin) === resolveRefTarget(origin)) return true;
	return isAllowedRef(url, allowedExternalRefs, origin);
}
/**
* The configured headers that apply to a URL's host.
*
* Mirrors the domain matching `fetchUrls` performs, so a hop is sent only the
* headers the user configured for the host actually being contacted.
*/
function headersForUrl(url, headers) {
	if (!headers) return;
	let host;
	try {
		host = new URL(url).host;
	} catch {
		return;
	}
	return headers.find((entry) => entry.domains.includes(host))?.headers;
}
/**
* A `fetch` that follows redirects itself so every hop is allow-list checked.
*
* The global `fetch` follows redirects transparently, so an allowed URL could
* answer `302` and send the request to a host the user never allowed — the
* allow-list only ever saw the first URL (GHSA-jmpc-3jgr-j7jv). Resolving each
* `Location` and re-checking it closes that.
*
* Headers are recomputed per hop rather than carried over. `fetchUrls` picks
* them by domain for the *first* URL only, so reusing them would hand headers
* configured for one host to whatever the redirect points at — and the global
* `fetch` this replaces drops `Authorization` across origins by itself.
*/
function createAllowListCheckedFetch(origin, allowedExternalRefs, headers) {
	return async (input, init) => {
		let url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
		for (let hop = 0;; hop++) {
			const response = await fetch(url, {
				...init,
				headers: headersForUrl(url, headers),
				redirect: "manual"
			});
			const location = response.headers.get("location");
			if (!(response.status >= 300 && response.status < 400 && location)) return response;
			if (hop >= MAX_EXTERNAL_REF_REDIRECTS) throw new Error(`Refused to follow more than ${MAX_EXTERNAL_REF_REDIRECTS} redirects while fetching an external $ref (stopped at ${url}).`);
			const next = new URL(location, url).href;
			if (!isFetchableUrl(next, origin, allowedExternalRefs)) {
				logger.warn(`Refused to follow a redirect to a URL that is not allowed: ${next}\nReached by redirect from ${url}.\nAdd it to externalRefs.allow or use ['*'] to allow all.`);
				throw new Error(`Refused to follow a redirect to a URL that is not allowed: ${next}`);
			}
			url = next;
		}
	};
}
/**
* Wrap `fetchUrls()` so every URL fetch is checked against the allow-list.
* The top-level spec URL (matching `origin`) is always allowed; subsequent
* fetches must match an explicit entry or the wildcard.
*/
function createSafeUrlLoader(origin, isWildcard, allowedExternalRefs, headers) {
	const base = fetchUrls({
		headers,
		...isWildcard ? {} : { fetch: createAllowListCheckedFetch(origin, allowedExternalRefs, headers) }
	});
	return {
		type: "loader",
		validate: base.validate,
		async exec(value) {
			if (isWildcard) return base.exec(value);
			const resolved = resolveRefTarget(value, origin);
			if (origin && resolved === resolveRefTarget(origin)) return base.exec(value);
			if (!isAllowedRef(value, allowedExternalRefs, origin)) throw new Error(`Refused to fetch external URL: ${value}\nAdd it to externalRefs.allow or use ['*'] to allow all.`);
			return base.exec(value);
		}
	};
}
async function importSpecs(workspace, options, projectName) {
	const { input, output } = options;
	return importOpenApi({
		spec: await resolveSpec(input.target, {
			parserOptions: input.parserOptions,
			transformer: input.override.transformer,
			workspace,
			unsafeDisableValidation: input.unsafeDisableValidation
		}),
		input,
		output,
		target: isString(input.target) ? input.target : workspace,
		workspace,
		projectName
	});
}
const COMPONENT_KEY_PATTERN = /^[a-zA-Z0-9.\-_]+$/;
const COMPONENT_SECTIONS = [
	"schemas",
	"responses",
	"parameters",
	"examples",
	"requestBodies",
	"headers",
	"securitySchemes",
	"links",
	"callbacks",
	"pathItems"
];
/**
* Validate that all component keys conform to the OAS regex: ^[a-zA-Z0-9.\-_]+$
* @see https://spec.openapis.org/oas/v3.0.3.html#fixed-fields-5
* @see https://spec.openapis.org/oas/v3.1.0#fixed-fields-5
*/
function validateComponentKeys(data) {
	const components = data.components;
	if (!isObject(components)) return;
	const invalidKeys = [];
	for (const section of COMPONENT_SECTIONS) {
		const sectionObj = components[section];
		if (!isObject(sectionObj)) continue;
		for (const key of Object.keys(sectionObj)) if (!COMPONENT_KEY_PATTERN.test(key)) invalidKeys.push(`components.${section}.${key}`);
	}
	if (invalidKeys.length > 0) throw new Error(`Invalid component key${invalidKeys.length > 1 ? "s" : ""} found. OpenAPI component keys must match the pattern ${COMPONENT_KEY_PATTERN} (non-ASCII characters are not allowed per the spec).\n  See: https://spec.openapis.org/oas/v3.0.3.html#components-object\n  Invalid keys:\n` + invalidKeys.map((k) => `    - ${k}`).join("\n"));
}
/**
* Where a document keeps its reusable schemas. Swagger 2.0 has no
* `components` — carrying one makes the document invalid ("Property components
* is not expected to be here"), so merged schemas have to land in
* `definitions` and be referenced as `#/definitions/...` instead (#2993).
*/
const schemaRefPrefix = (data) => isSwagger2(data) ? "#/definitions/" : "#/components/schemas/";
/**
* The plugins from `@scalar/json-magic` does not dereference $ref.
* Instead it fetches them and puts them under x-ext, and changes the $ref to point to #x-ext/<name>.
* This function:
* 1. Merges external schemas into the main spec's schema container (with collision handling)
* 2. Replaces x-ext refs with standard schema refs or inlined content
*/
function dereferenceExternalRef(data, strategy = "default") {
	const extensions = data["x-ext"] ?? {};
	const refPrefix = schemaRefPrefix(data);
	const schemaNameMappings = mergeExternalSchemas(data, extensions, strategy);
	const result = {};
	for (const [key, value] of Object.entries(data)) if (key !== "x-ext") result[key] = replaceXExtRefs(value, extensions, schemaNameMappings, refPrefix);
	return result;
}
/**
* Merge external document schemas into main spec's components.schemas
* Returns mapping of original schema names to final names (with suffixes for collisions)
*/
function mergeExternalSchemas(data, extensions, strategy) {
	const schemaNameMappings = {};
	if (Object.keys(extensions).length === 0) return schemaNameMappings;
	const swagger2 = isSwagger2(data);
	let mainSchemas;
	const getMainSchemas = () => {
		if (mainSchemas) return mainSchemas;
		if (swagger2) {
			data.definitions ??= {};
			mainSchemas = data.definitions;
			return mainSchemas;
		}
		data.components ??= {};
		const mainComponents = data.components;
		mainComponents.schemas ??= {};
		mainSchemas = mainComponents.schemas;
		return mainSchemas;
	};
	for (const [extKey, extDoc] of Object.entries(extensions)) {
		schemaNameMappings[extKey] = {};
		if (isObject(extDoc) && "components" in extDoc) {
			const extComponents = extDoc.components;
			if (isObject(extComponents) && "schemas" in extComponents) {
				const extSchemas = extComponents.schemas;
				for (const [schemaName, schema] of Object.entries(extSchemas)) {
					const targetSchemas = getMainSchemas();
					const existingSchema = targetSchemas[schemaName];
					const isMatchingXExtRef = (isObject(existingSchema) && "$ref" in existingSchema && isString(existingSchema.$ref) && existingSchema.$ref) === `#/x-ext/${extKey}/components/schemas/${schemaName}`;
					let finalSchemaName = schemaName;
					const suffix = extKey.replaceAll(/[^a-zA-Z0-9]/g, "_");
					if (strategy === "always" && suffix.length === 0) throw new Error(`External schema "${schemaName}" from "${extKey}" cannot be named with the always strategy because its external document identity is empty after sanitization.`);
					if (strategy === "always") finalSchemaName = `${schemaName}_${suffix}`;
					else if (schemaName in targetSchemas && !isMatchingXExtRef) finalSchemaName = `${schemaName}_${suffix}`;
					const isExistingPlaceholder = finalSchemaName === schemaName && isMatchingXExtRef;
					if (Object.hasOwn(targetSchemas, finalSchemaName) && !isExistingPlaceholder) throw new Error(`External schema "${schemaName}" from "${extKey}" cannot be merged as "${finalSchemaName}" because that component name is already occupied.`);
					schemaNameMappings[extKey][schemaName] = finalSchemaName;
					targetSchemas[finalSchemaName] = scrubUnwantedKeys(schema);
				}
			}
		}
	}
	if (!mainSchemas) return schemaNameMappings;
	const refPrefix = schemaRefPrefix(data);
	for (const [extKey, mapping] of Object.entries(schemaNameMappings)) for (const [, finalName] of Object.entries(mapping)) {
		const schema = mainSchemas[finalName];
		if (schema) mainSchemas[finalName] = updateInternalRefs(schema, extKey, schemaNameMappings, refPrefix);
	}
	return schemaNameMappings;
}
/**
* Remove unwanted keys like $schema and $id from objects
*/
function scrubUnwantedKeys(obj) {
	const UNWANTED_KEYS = /* @__PURE__ */ new Set(["$schema", "$id"]);
	if (obj === null || obj === void 0) return obj;
	if (Array.isArray(obj)) return obj.map((x) => scrubUnwantedKeys(x));
	if (isObject(obj)) {
		const rec = obj;
		const out = {};
		for (const [k, v] of Object.entries(rec)) {
			if (UNWANTED_KEYS.has(k)) continue;
			out[k] = scrubUnwantedKeys(v);
		}
		return out;
	}
	return obj;
}
/**
* Update internal refs within an external schema to use suffixed names.
*
* External documents are OpenAPI 3 shaped, so their own refs read
* `#/components/schemas/...`. `refPrefix` is where those schemas landed in the
* *main* document, which is `#/definitions/` when that document is Swagger 2.0
* (#2993).
*/
function updateInternalRefs(obj, extKey, schemaNameMappings, refPrefix) {
	if (obj === null || obj === void 0) return obj;
	if (Array.isArray(obj)) return obj.map((element) => updateInternalRefs(element, extKey, schemaNameMappings, refPrefix));
	if (isObject(obj)) {
		const record = obj;
		if ("$ref" in record && isString(record.$ref)) {
			const refValue = record.$ref;
			if (refValue.startsWith("#/components/schemas/")) {
				const schemaName = refValue.replace("#/components/schemas/", "");
				const mappedName = schemaNameMappings[extKey][schemaName];
				if (mappedName) return { $ref: `${refPrefix}${mappedName}` };
			}
		}
		const result = {};
		for (const [key, value] of Object.entries(record)) result[key] = updateInternalRefs(value, extKey, schemaNameMappings, refPrefix);
		return result;
	}
	return obj;
}
/**
* Decode a single JSON Pointer reference token taken from an x-ext `$ref`.
*
* The token carries two layers of encoding: it sits in a URI fragment, so it
* may be percent-encoded (e.g. `%7B` for `{` in templated paths), and it is a
* JSON Pointer token, so `~1`/`~0` stand for `/`/`~` (RFC 6901). Percent-
* encoding is the outer layer and is removed first; a malformed sequence is
* left as-is rather than throwing. Without this, tokens such as `~1pets`
* never match the real `/pets` key and the external `$ref` fails to resolve.
*/
function decodeRefToken(token) {
	let decoded = token;
	try {
		decoded = decodeURIComponent(token);
	} catch {}
	return decoded.replaceAll("~1", "/").replaceAll("~0", "~");
}
/**
* Replace x-ext refs with standard component refs, or inline the content.
* `inliningRefs` tracks the inline chain to break cycles in recursive
* external schemas that aren't under `components.schemas` (#1642).
*/
function replaceXExtRefs(obj, extensions, schemaNameMappings, refPrefix, inliningRefs = /* @__PURE__ */ new Set()) {
	if (isNullish(obj)) return obj;
	if (Array.isArray(obj)) return obj.map((element) => replaceXExtRefs(element, extensions, schemaNameMappings, refPrefix, inliningRefs));
	if (isObject(obj)) {
		const record = obj;
		if ("$ref" in record && isString(record.$ref)) {
			const refValue = record.$ref;
			if (refValue.startsWith("#/x-ext/")) {
				const parts = refValue.replace("#/x-ext/", "").split("/");
				const extKey = parts.shift();
				if (extKey) {
					if (parts.length >= 3 && parts[0] === "components" && parts[1] === "schemas") {
						const schemaName = parts.slice(2).join("/");
						return { $ref: `${refPrefix}${schemaNameMappings[extKey][schemaName] || schemaName}` };
					}
					if (inliningRefs.has(refValue)) {
						logger.warn(`Detected a circular external $ref while inlining "${refValue}". Replacing with an empty schema to avoid infinite recursion. Move the schema under "components.schemas" in its source file or pre-bundle the spec to keep the recursion intact.`);
						return {};
					}
					let refObj = extensions[extKey];
					for (const rawPart of parts) {
						const p = decodeRefToken(rawPart);
						if (refObj && (isObject(refObj) || Array.isArray(refObj)) && p in refObj) refObj = refObj[p];
						else {
							refObj = void 0;
							break;
						}
					}
					if (refObj) {
						const cleaned = scrubUnwantedKeys(refObj);
						const nextInlining = new Set(inliningRefs);
						nextInlining.add(refValue);
						return replaceXExtRefs(cleaned, extensions, schemaNameMappings, refPrefix, nextInlining);
					}
				}
			}
		}
		const result = {};
		for (const [key, value] of Object.entries(record)) result[key] = replaceXExtRefs(value, extensions, schemaNameMappings, refPrefix, inliningRefs);
		return result;
	}
	return obj;
}
//#endregion
//#region src/formatters/prettier.ts
async function createPrettierFileTransform() {
	const prettier = await tryImportPrettier();
	if (!prettier) return;
	return async (filePath, content) => {
		try {
			const config = await prettier.resolveConfig(filePath);
			return await prettier.format(content, {
				...config,
				filepath: filePath
			});
		} catch (error) {
			if (error instanceof Error && error.name === "UndefinedParserError") return content;
			logger.warn(error, `Failed to format file ${filePath}`);
			return content;
		}
	};
}
/**
* Format files with prettier.
* Tries the programmatic API first (project dependency),
* then falls back to the globally installed CLI.
*/
async function formatWithPrettier(paths) {
	const format = await createPrettierFileTransform();
	if (format) {
		const filePaths = [...new Set(await collectFilePaths(paths))];
		if (filePaths.length === 0) return;
		await Promise.all(filePaths.map(async (filePath) => {
			try {
				const content = await fs.readFile(filePath, "utf8");
				await writeGeneratedFile(filePath, await format(filePath, content));
			} catch (error) {
				if (isMissingFileError(error)) return;
				if (error instanceof Error && error.name === "UndefinedParserError") return;
				logger.warn(error, `Failed to format file ${filePath}`);
			}
		}));
		return;
	}
	try {
		await execa("prettier", ["--write", ...paths]);
	} catch {
		logger.warn("prettier not found. Install it as a project dependency or globally.");
	}
}
function isMissingFileError(error) {
	return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
/**
* Try to import prettier from the project's dependencies.
* Returns undefined if prettier is not installed.
*/
async function tryImportPrettier() {
	try {
		return await import("prettier");
	} catch {
		return;
	}
}
/**
* Recursively collect absolute file paths from a mix of files and directories.
*/
async function collectFilePaths(paths) {
	const results = [];
	for (const p of paths) {
		const absolute = path.resolve(p);
		try {
			const stat = await fs.stat(absolute);
			if (stat.isFile()) results.push(absolute);
			else if (stat.isDirectory()) {
				const subFiles = await collectFilePaths((await fs.readdir(absolute)).map((entry) => path.join(absolute, entry)));
				results.push(...subFiles);
			}
		} catch {}
	}
	return results;
}
//#endregion
//#region src/utils/execute-hook.ts
const executeHook = async (name, commands = [], args = []) => {
	logger.info(styleText("white", `Running ${name} hook...`));
	for (const command of commands) try {
		if (isString(command)) await executeCommand(command, args);
		else if (isFunction(command)) await command(args);
		else if (isObject(command)) await executeObjectCommand(command, args);
	} catch (error) {
		logger.error(error, `Failed to run ${name} hook`);
	}
};
async function executeCommand(command, args) {
	const [cmd, ..._args] = [...parseArgsStringToArgv(command), ...args];
	await execa(cmd, _args);
}
async function executeObjectCommand(command, args) {
	if (command.injectGeneratedDirsAndFiles === false) args = [];
	if (isString(command.command)) await executeCommand(command.command, args);
	else if (isFunction(command.command)) await command.command();
}
//#endregion
//#region src/utils/watcher.ts
/**
* Start a file watcher and invoke an async callback on file changes.
*
* If `watchOptions` is falsy the watcher is not started. Supported shapes:
*  - boolean: when true the `defaultTarget` is watched
*  - string: a single path to watch
*  - string[]: an array of paths to watch
*
* @param watchOptions - false to disable watching, or a path/paths to watch
* @param watchFn - async callback executed on change events
* @param defaultTarget - path(s) to watch when `watchOptions` is `true` (default: '.')
* @returns Resolves once the watcher has been started (or immediately if disabled)
*
* @example
* await startWatcher(true, async () => { await buildProject(); }, 'src');
*/
async function startWatcher(watchOptions, watchFn, defaultTarget = ".") {
	if (!watchOptions) return;
	const { watch } = await import("chokidar");
	const restore = bindReporter();
	const ignored = ["**/{.git,node_modules}/**"];
	const watchPaths = isBoolean(watchOptions) ? defaultTarget : watchOptions;
	logger.info(`Watching for changes in ${Array.isArray(watchPaths) ? watchPaths.map((v) => "\"" + v + "\"").join(" | ") : "\"" + watchPaths + "\""}`);
	const watcher = watch(watchPaths, {
		ignorePermissionErrors: true,
		ignored
	});
	watcher.on("ready", () => {
		restore(() => {
			logger.info("Initial scan complete. Watching for changes...");
			watcher.on("all", (type, file) => {
				restore(() => {
					logger.info(`Change detected: ${type} ${file}`);
					watchFn().catch((error) => {
						restore(() => {
							logger.error(error);
						});
					});
				});
			});
		});
	});
}
//#endregion
//#region src/write-specs.ts
let zodWritersModuleCache;
const loadZodWriters = () => zodWritersModuleCache ??= import("./write-zod-specs-C2xM-gnX.mjs");
async function runExternalFormatter(bin, args) {
	try {
		await execa(bin, args);
	} catch (error) {
		if (error instanceof ExecaError && error.code === "ENOENT") logger.warn(`${bin} not found`);
		else logger.warn(error);
	}
}
async function runFormatter(formatter, paths) {
	switch (formatter) {
		case SupportedFormatter.PRETTIER:
			await formatWithPrettier(paths);
			break;
		case SupportedFormatter.BIOME:
			await runExternalFormatter(SupportedFormatter.BIOME, [
				"check",
				"--write",
				...paths
			]);
			break;
		case SupportedFormatter.OXFMT: await runExternalFormatter(SupportedFormatter.OXFMT, paths);
	}
}
const DOCS_MARKDOWN_PLUGIN = "typedoc-plugin-markdown";
const DOCS_MARKDOWN_THEME = "markdown";
/**
* `typedoc` and `typedoc-plugin-markdown` are optional peer dependencies: only
* `output.docs` needs them, so projects that never generate docs don't have to
* install or resolve them.
*/
async function importTypedoc() {
	try {
		return await import("typedoc");
	} catch (error) {
		throw new Error(`Install \`typedoc\` and \`${DOCS_MARKDOWN_PLUGIN}\` to use the \`docs\` output option.`, { cause: error });
	}
}
function getDocsTypedocOptions(entryPoints, config) {
	const plugin = config.plugin ?? [];
	const options = {
		entryPoints,
		skipErrorChecking: true,
		logLevel: "None",
		...config,
		plugin: plugin.includes(DOCS_MARKDOWN_PLUGIN) ? plugin : [DOCS_MARKDOWN_PLUGIN, ...plugin]
	};
	if (options.entryPoints) options.entryPoints = options.entryPoints.map((entryPoint) => upath.toUnix(entryPoint));
	return options;
}
/**
* Gives the TypeDoc output for a theme. The markdown plugin makes markdown the
* default output, thus all other themes must use the html output.
*/
function getDocsOutputName(theme) {
	return theme === DOCS_MARKDOWN_THEME ? "markdown" : "html";
}
/**
* Builds a TypeDoc `OptionsReader` that guarantees `typedoc-plugin-markdown`
* stays in the resolved `plugin` list, no matter what a user-supplied
* `configPath` config file declares.
*
* TypeDoc's `Application.bootstrapWithPlugins` applies the options we pass
* in *before* running its option readers (`Options.read`), and one of those
* readers (`TypeDocReader`) unconditionally overwrites the `plugin` option
* with whatever the config file specifies. Since plugin loading
* (`loadPlugins`) happens right after `Options.read` and before our options
* are re-applied, a config file that supplies its own `plugin` array without
* `typedoc-plugin-markdown` would otherwise silence the plugin entirely for
* the run that matters, even though `getDocsTypedocOptions` re-injects it
* into the *final* options object.
*
* Readers are processed in ascending `order`, and a later reader's
* `setValue` call wins outright — there's no merge. Registering this reader
* with the highest possible order makes it run after every built-in reader
* (`typedoc.json`/`typedoc.js`, `package.json`, `tsconfig.json`), so it has
* the final say before `loadPlugins` reads the resolved value.
*/
function createMarkdownPluginReader() {
	return {
		name: "orval-ensure-markdown-plugin",
		order: Number.MAX_SAFE_INTEGER,
		supportsPackages: false,
		read(container) {
			const current = container.isSet("plugin") ? container.getValue("plugin") : [];
			if (!current.includes(DOCS_MARKDOWN_PLUGIN)) container.setValue("plugin", [...current, DOCS_MARKDOWN_PLUGIN]);
		}
	};
}
function getComparableFilePath(filePath) {
	const resolvedPath = path.resolve(filePath);
	let comparablePath = resolvedPath;
	try {
		comparablePath = fs$1.realpathSync(resolvedPath);
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	return process.platform === "win32" || process.platform === "darwin" ? comparablePath.toLowerCase() : comparablePath;
}
function excludeFilePath(filePaths, filePathToExclude) {
	const comparablePathToExclude = getComparableFilePath(filePathToExclude);
	return filePaths.map((filePath) => ({
		filePath,
		comparablePath: getComparableFilePath(filePath)
	})).filter(({ comparablePath }) => comparablePath !== comparablePathToExclude).map(({ filePath }) => filePath);
}
function getHeader(option, info) {
	if (!option) return "";
	const header = option(info);
	return Array.isArray(header) ? jsDoc({ description: header }) : header;
}
/**
* Add re-export of operation schemas from the main schemas index file.
* Handles the case where the index file doesn't exist (no regular schemas).
*
* NOTE: `operationSchemasPath` is a directory, so under NodeNext the re-export
* would need an `/index.js` suffix rather than a bare `.js`. That directory-
* import case is tracked separately and intentionally left as-is here.
*/
async function addOperationSchemasReExport(schemaPath, operationSchemasPath, header) {
	const schemaIndexPath = path.join(schemaPath, `index.ts`);
	const esmImportPath = upath.getRelativeImportPath(schemaIndexPath, operationSchemasPath);
	const exportLine = `export * from '${esmImportPath}';\n`;
	let existingContent;
	try {
		existingContent = await fs$1.promises.readFile(schemaIndexPath, "utf8");
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	if (existingContent !== void 0) {
		if (!readReExportSpecifiers(existingContent).has(esmImportPath)) await writeGeneratedFile(schemaIndexPath, existingContent + exportLine);
	} else {
		const content = header && header.trim().length > 0 ? `${header}\n${exportLine}` : exportLine;
		await writeGeneratedFile(schemaIndexPath, content);
	}
}
/**
* Emit `<schemas-dir>/index.faker.ts` (or `<output-root>/schemas.faker.ts`
* when `output.schemas` is not configured) when a faker generator entry has
* `schemas: true`. Each `components/schemas` entry becomes a
* `get<SchemaName>Mock(overrides)` factory in the file. Returns the written
* file path so callers can include it in formatter / hook runs, or
* `undefined` if no file was written.
*/
async function writeFakerSchemaMocks(builder, options, header, schemaTagMap) {
	const { output } = options;
	const fakerEntry = output.mock.generators.find((g) => !isFunction(g) && g.type === OutputMockType.FAKER && g.schemas === true);
	if (!fakerEntry) return;
	const schemasWithDef = builder.schemas.filter((s) => !!s.schema);
	if (schemasWithDef.length === 0) return;
	const context = {
		spec: builder.spec,
		target: builder.target,
		workspace: "",
		output
	};
	const { implementation, imports, strictMockSchemaTypeNames, strictMockSchemaKinds } = (await import("@orval/mock")).generateFakerForSchemas(schemasWithDef, context, fakerEntry);
	if (!implementation.trim()) return;
	const finalizedImplementation = builder.finalizeMockImplementation ? builder.finalizeMockImplementation(implementation, {
		mockOptions: output.override.mock,
		strictSchemaTypeNames: strictMockSchemaTypeNames,
		strictMockSchemaKinds
	}) : implementation;
	let filePath;
	let schemaImportPath;
	const fileExtension = output.fileExtension || ".ts";
	const importExtension = getImportExtension(fileExtension, output.tsconfig);
	const schemasDir = isString(output.schemas) ? output.schemas : output.schemas?.path;
	const isRelocated = !!schemasDir && !!fakerEntry.schemasPath;
	if (schemasDir && fakerEntry.schemasPath) {
		filePath = path.join(fakerEntry.schemasPath, `index.faker${fileExtension}`);
		schemaImportPath = getSchemasImportPath(output.schemas) ?? upath.relativeSafe(fakerEntry.schemasPath, schemasDir);
	} else if (schemasDir) {
		filePath = path.join(schemasDir, `index.faker${fileExtension}`);
		schemaImportPath = ".";
	} else {
		const targetInfo = output.target ? getFileInfo(output.target, { extension: fileExtension }) : void 0;
		const dir = targetInfo?.dirname ?? process.cwd();
		filePath = path.join(dir, `schemas.faker${fileExtension}`);
		schemaImportPath = targetInfo ? `./${targetInfo.filename}${getImportExtension(fileExtension, output.tsconfig)}` : void 0;
	}
	const schemaSuffix = isObject(output.schemas) && output.schemas.type === "zod" ? ".zod" : "";
	const isRelativeSchemaImport = !!schemaImportPath?.startsWith(".");
	const perSchemaImportPath = /* @__PURE__ */ new Map();
	if (isRelativeSchemaImport && !output.indexFiles && schemasDir) for (const schema of builder.schemas) {
		const tsName = pascal(schema.name);
		const fileName = conventionName(schema.name, output.namingConvention);
		const tagDir = schemaTagMap?.get(schema.name);
		const tagSegment = tagDir && tagDir !== "." ? `${tagDir}/` : "";
		perSchemaImportPath.set(tsName, `${schemaImportPath}/${tagSegment}${fileName}${schemaSuffix}${importExtension}`);
	}
	else if (isRelocated && isRelativeSchemaImport && importExtension) schemaImportPath = `${schemaImportPath}/index${importExtension}`;
	const reroutedImports = imports.map((imp) => {
		if (imp.importPath) return imp;
		if (imp.schemaFactory) return {
			...imp,
			importPath: "."
		};
		const resolved = perSchemaImportPath.get(imp.name);
		if (resolved) return {
			...imp,
			importPath: resolved
		};
		return {
			...imp,
			importPath: schemaImportPath
		};
	});
	const grouped = /* @__PURE__ */ new Map();
	for (const imp of reroutedImports) {
		const key = imp.importPath ?? "";
		if (!key) continue;
		const bucket = grouped.get(key) ?? [];
		bucket.push(imp);
		grouped.set(key, bucket);
	}
	const content = `${header}${generateDependencyImports(finalizedImplementation, [{
		exports: [{
			name: "faker",
			values: true
		}],
		dependency: fakerEntry.locale ? `@faker-js/faker/locale/${fakerEntry.locale}` : "@faker-js/faker"
	}, ...[...grouped.entries()].map(([dependency, exports]) => ({
		exports,
		dependency
	}))], void 0, !!output.schemas, false)}\n\n${finalizedImplementation}`;
	await writeGeneratedFile(filePath, content);
	return filePath;
}
const EXPORTED_NAME_RE = /^export\s+(?:const|function)\s+(\w+)/gm;
/**
* Re-exports the relocated schema factories from the faker barrel when
* `schemasPath` sits inside the faker directory, so the faker group exposes
* them too. Names an operation mock already exports are left out: two
* re-exports of one name break the barrel (TS2308).
*/
async function reexportFakerSchemaFactories(output, factoriesPath) {
	const faker = getFakerEntry(output.mock);
	if (!output.mock.indexMockFiles || !faker?.path || !faker.schemasPath) return;
	if (upath.relativeSafe(faker.path, faker.schemasPath).startsWith("..")) return;
	const fileExtension = output.fileExtension || ".ts";
	const importExtension = getImportExtension(fileExtension, output.tsconfig);
	const barrelPath = path.join(faker.path, `index.faker${fileExtension}`);
	const barrel = fs$1.existsSync(barrelPath) ? await fs$1.promises.readFile(barrelPath, "utf8") : "";
	const taken = /* @__PURE__ */ new Set();
	for (const specifier of readReExportSpecifiers(barrel)) {
		const modulePath = path.resolve(faker.path, importExtension && specifier.endsWith(importExtension) ? specifier.slice(0, -importExtension.length) : specifier);
		const content = await fs$1.promises.readFile(`${modulePath}${fileExtension}`, "utf8").catch(() => "");
		for (const match of content.matchAll(EXPORTED_NAME_RE)) taken.add(match[1]);
	}
	const names = [...(await fs$1.promises.readFile(factoriesPath, "utf8")).matchAll(EXPORTED_NAME_RE)].map((match) => match[1]).filter((name) => !taken.has(name));
	const specifier = stripFileExtension(upath.getRelativeImportPath(barrelPath, factoriesPath, true), fileExtension) + importExtension;
	const withoutFactories = barrel.split(/\r?\n/).filter((line) => !isNamedReExportOf(line, specifier)).join("\n");
	const next = names.length > 0 ? `${withoutFactories}${withoutFactories && !withoutFactories.endsWith("\n") ? "\n" : ""}export { ${names.join(", ")} } from '${specifier}';\n` : withoutFactories;
	if (next === barrel) return;
	await writeGeneratedFile(barrelPath, next);
}
function isNamedReExportOf(line, specifier) {
	return /^\s*export\s*\{[^}]*\}\s*from\s*['"]([^'"]+)['"]\s*;?\s*$/.exec(line)?.[1] === specifier;
}
function isSchemaValidatorClient(client) {
	return client === "zod" || client === "effect";
}
function shouldGenerateZodSchemasInline(output, hasOperations) {
	if (output.client !== "zod" || output.schemas) return false;
	if (output.override.zod.generateReusableSchemas) return true;
	return !hasOperations;
}
function shouldGenerateSchemas(output, hasOperations) {
	return !output.schemas && !isSchemaValidatorClient(output.client) || shouldGenerateZodSchemasInline(output, hasOperations);
}
function applyWorkspaceExports(workspaceExports, generatedExports) {
	const result = workspaceExports([...generatedExports]);
	if (!Array.isArray(result) || !result.every((s) => isString(s))) throw new TypeError("`output.workspaceExports` must return an array of module specifiers");
	return [...new Set(result)];
}
function getImplementationPathsForIndex(output, implementationPaths, indexFile) {
	const shouldExcludeSelf = output.indexFiles;
	const paths = shouldExcludeSelf ? excludeFilePath(implementationPaths, indexFile) : implementationPaths;
	if (shouldExcludeSelf && output.mode === OutputMode.SPLIT && getComparableFilePath(output.target) === getComparableFilePath(indexFile)) {
		const targetInfo = getFileInfo(output.target, { extension: output.fileExtension });
		return excludeFilePath(paths, path.join(targetInfo.dirname, `${targetInfo.filename}.schemas${output.schemaFileExtension}`));
	}
	if (!(output.mode === OutputMode.TAGS_OPERATIONS || output.mode === OutputMode.TAGS_OPERATIONS_SPLIT) || !shouldExcludeSelf) return paths;
	const targetInfo = getFileInfo(output.target, { extension: output.fileExtension });
	const rootBarrel = path.join(targetInfo.dirname, `index${output.fileExtension}`);
	const globalSchemas = path.join(targetInfo.dirname, `${targetInfo.filename}.schemas${output.schemaFileExtension}`);
	return paths.filter((p) => getComparableFilePath(p) === getComparableFilePath(rootBarrel) || getComparableFilePath(p) === getComparableFilePath(globalSchemas));
}
/** Coordinates schema, operation, mock, and client generation for one spec. */
async function writeSpecsInternal(builder, workspace, options, projectName) {
	const { info, schemas, target } = builder;
	const { output } = options;
	const { schemaTagMap, schemaOutputPlan } = builder;
	const shouldSplitSchemasByTags = isObject(output.schemas) && output.schemas.splitByTags === true;
	const header = getHeader(output.override.header, info);
	if (output.schemas) {
		const schemasPath = isString(output.schemas) ? output.schemas : output.schemas.path;
		const isZodSchemas = !isString(output.schemas) && output.schemas.type === "zod" || isString(output.schemas) && output.client === "zod" && output.override.zod.generateReusableSchemas;
		const singleSchemasFile = isObject(output.schemas) && output.schemas.mode === "single";
		if (shouldSplitSchemasByTags && output.operationSchemas) throw new Error("schemas.splitByTags cannot be used with output.operationSchemas. The tags-split schema mode handles operation type placement within tag directories.");
		if (isZodSchemas) {
			const zodWriters = await loadZodWriters();
			const fileExtension = output.schemaFileExtension;
			const schemasDir = singleSchemasFile && namesAFile(schemasPath) ? path.dirname(schemasPath) : schemasPath;
			const schemasParamsMutator = output.override.zod.params ? await generateMutator({
				output: path.join(schemasDir, `__params__${fileExtension}`),
				mutator: output.override.zod.params,
				name: "zodParams",
				workspace,
				tsconfig: output.tsconfig
			}) : void 0;
			if (singleSchemasFile) await zodWriters.writeZodSchemasSingle(builder, builder.verbOptions, schemasPath, fileExtension, header, output, {
				spec: builder.spec,
				target: builder.target,
				workspace,
				output
			}, schemasParamsMutator);
			else if (shouldSplitSchemasByTags) {
				const componentDirs = await zodWriters.writeZodSchemas(builder, schemasPath, fileExtension, header, output, schemasParamsMutator, schemaTagMap, schemaOutputPlan);
				const verbDirs = await zodWriters.writeZodSchemasFromVerbs(builder.verbOptions, schemasPath, fileExtension, header, output, {
					spec: builder.spec,
					target: builder.target,
					workspace,
					output
				}, schemaTagMap, schemaOutputPlan);
				if (output.indexFiles) {
					if (schemaOutputPlan) await zodWriters.writeZodSchemaRoutesBarrel(schemaOutputPlan, fileExtension, header, [...componentDirs.values(), ...verbDirs.values()].flat(), output.namingConvention, output.tsconfig);
					else await zodWriters.writeZodSchemaTagsSplitBarrel(schemasPath, fileExtension, header, componentDirs, verbDirs, output.namingConvention, output.tsconfig);
				}
			} else {
				const componentDirs = await zodWriters.writeZodSchemas(builder, schemasPath, fileExtension, header, output, schemasParamsMutator, void 0, schemaOutputPlan);
				const verbDirs = await zodWriters.writeZodSchemasFromVerbs(builder.verbOptions, schemasPath, fileExtension, header, output, {
					spec: builder.spec,
					target: builder.target,
					workspace,
					output
				}, void 0, schemaOutputPlan);
				if (schemaOutputPlan && output.indexFiles) await zodWriters.writeZodSchemaRoutesBarrel(schemaOutputPlan, fileExtension, header, [...componentDirs.values(), ...verbDirs.values()].flat(), output.namingConvention, output.tsconfig);
				else if (output.indexFiles) await warnAmbiguousBarrelExports(path.join(schemasPath, "index.ts"));
			}
		} else {
			const fileExtension = output.schemaFileExtension || ".ts";
			if (singleSchemasFile) await writeGeneratedFile(namesAFile(schemasPath) ? schemasPath : path.join(schemasPath, `index${fileExtension}`), header + generateModelsInline(schemas));
			else if (schemaOutputPlan) await writeRoutedSchemas({
				plan: schemaOutputPlan,
				target,
				namingConvention: output.namingConvention,
				fileExtension,
				header,
				indexFiles: output.indexFiles,
				tsconfig: output.tsconfig
			});
			else if (shouldSplitSchemasByTags) {
				if (!schemaTagMap) throw new Error("schemas.splitByTags is enabled but no schema tag map was built. The map comes from getApiBuilder, so a WriteSpecBuilder assembled another way has to carry one.");
				await writeSchemasTagsSplit({
					schemaPath: schemasPath,
					schemas,
					target,
					namingConvention: output.namingConvention,
					fileExtension,
					header,
					indexFiles: output.indexFiles,
					tsconfig: output.tsconfig,
					factoryOutputDirectory: output.factoryMethods?.outputDirectory,
					schemaTagMap
				});
			} else if (output.operationSchemas) {
				const { regularSchemas, operationSchemas: opSchemas } = splitSchemasByType(schemas);
				const regularSchemaNames = new Set(regularSchemas.map((s) => s.name));
				const operationSchemaNames = new Set(opSchemas.map((s) => s.name));
				fixCrossDirectoryImports(opSchemas, regularSchemaNames, schemasPath, output.operationSchemas, output.namingConvention, fileExtension, output.tsconfig);
				fixRegularSchemaImports(regularSchemas, operationSchemaNames, schemasPath, output.operationSchemas, output.namingConvention, fileExtension, output.tsconfig);
				if (regularSchemas.length > 0) await writeSchemas({
					schemaPath: schemasPath,
					schemas: regularSchemas,
					target,
					namingConvention: output.namingConvention,
					fileExtension,
					header,
					indexFiles: output.indexFiles,
					tsconfig: output.tsconfig,
					factoryOutputDirectory: output.factoryMethods?.outputDirectory
				});
				if (opSchemas.length > 0) {
					await writeSchemas({
						schemaPath: output.operationSchemas,
						schemas: opSchemas,
						target,
						namingConvention: output.namingConvention,
						fileExtension,
						header,
						indexFiles: output.indexFiles,
						tsconfig: output.tsconfig,
						factoryOutputDirectory: output.factoryMethods?.outputDirectory
					});
					if (output.indexFiles) await addOperationSchemasReExport(schemasPath, output.operationSchemas, header);
				}
			} else await writeSchemas({
				schemaPath: schemasPath,
				schemas,
				target,
				namingConvention: output.namingConvention,
				fileExtension,
				header,
				indexFiles: output.indexFiles,
				tsconfig: output.tsconfig,
				factoryOutputDirectory: output.factoryMethods?.outputDirectory
			});
		}
	}
	const fakerSchemaPath = await writeFakerSchemaMocks(builder, options, header, schemaTagMap);
	let implementationPaths = [];
	if (output.target) {
		const writeMode = getWriteMode(output.mode);
		const hasOperations = Object.keys(builder.operations).length > 0;
		const needZodSchemasInline = shouldGenerateZodSchemasInline(output, hasOperations);
		const isSchemasInSeparateFile = output.mode !== OutputMode.SINGLE;
		const operationsUseZod = Object.values(builder.operations).some((operation) => /\bzod\b/.test(operation.implementation));
		const includeZodImport = isSchemasInSeparateFile || !operationsUseZod;
		const inlineSchemasParamsMutator = needZodSchemasInline && output.override.zod.params ? await generateMutator({
			output: output.target,
			mutator: output.override.zod.params,
			name: "zodParams",
			workspace,
			tsconfig: output.tsconfig
		}) : void 0;
		const includeParamsImport = !hasOperations || isSchemasInSeparateFile;
		const zodWriters = needZodSchemasInline ? await loadZodWriters() : void 0;
		implementationPaths = await writeMode({
			builder,
			workspace,
			output,
			projectName,
			header,
			needSchema: shouldGenerateSchemas(output, hasOperations),
			schemaTagMap,
			schemaOutputPlan,
			generateSchemasInline: needZodSchemasInline ? () => zodWriters.generateZodSchemasInline(builder, output, includeZodImport, inlineSchemasParamsMutator, includeParamsImport) : void 0
		});
	}
	if (fakerSchemaPath) await reexportFakerSchemaFactories(output, fakerSchemaPath);
	if (output.workspace) {
		const workspacePath = output.workspace;
		const indexFile = path.join(workspacePath, "index.ts");
		const mockExtensions = output.mock.generators.map((g) => getMockFileExtensionByTypeName(g));
		const importExtension = getImportExtension(output.fileExtension, output.tsconfig);
		const imports = getImplementationPathsForIndex(output, implementationPaths, indexFile).filter((p) => mockExtensions.length === 0 || !mockExtensions.some((ext) => p.endsWith(`.${ext}.ts`))).map((p) => {
			const relative = upath.getRelativeImportPath(indexFile, p, true);
			const fileExtension = !p.endsWith(output.fileExtension) && p.endsWith(output.schemaFileExtension) ? output.schemaFileExtension : output.fileExtension;
			return stripFileExtension(relative, fileExtension) + getImportExtension(fileExtension, output.tsconfig);
		});
		if (output.schemas) {
			const schemasPath = isString(output.schemas) ? output.schemas : output.schemas.path;
			const isNamedSingleSchema = isObject(output.schemas) && output.schemas.mode === "single" && namesAFile(schemasPath);
			if (schemaOutputPlan) imports.push(upath.getRelativeImportPath(indexFile, schemaOutputPlan.basePath));
			else if (isNamedSingleSchema) {
				const schemaSourceExtension = path.extname(schemasPath);
				const schemaImportExtension = getImportExtension(schemaSourceExtension, output.tsconfig);
				const relative = upath.getRelativeImportPath(indexFile, schemasPath, true);
				imports.push(stripFileExtension(relative, schemaSourceExtension) + schemaImportExtension);
			} else imports.push(upath.getRelativeImportPath(indexFile, getFileInfo(schemasPath).dirname));
		}
		if (output.operationSchemas) imports.push(upath.getRelativeImportPath(indexFile, getFileInfo(output.operationSchemas).dirname));
		if (output.indexFiles) {
			const generatedExports = [...new Set(imports)];
			const workspaceExports = output.workspaceExports ? applyWorkspaceExports(output.workspaceExports, generatedExports) : generatedExports;
			const keptExports = new Set(workspaceExports);
			await reconcileWorkspaceBarrel(indexFile, workspaceExports, output.fileExtension, importExtension, new Set(generatedExports.filter((s) => !keptExports.has(s))));
			implementationPaths = [indexFile, ...excludeFilePath(implementationPaths, indexFile)];
		}
	}
	if (builder.extraFiles.length > 0) {
		await Promise.all(builder.extraFiles.map(async (file) => writeGeneratedFile(file.path, file.content)));
		implementationPaths = [...implementationPaths, ...builder.extraFiles.map((file) => file.path)];
	}
	const paths = [
		...schemaOutputPlan ? [
			schemaOutputPlan.basePath,
			...schemaOutputPlan.routeDirectories,
			...schemaOutputPlan.rootIndexPath ? [schemaOutputPlan.rootIndexPath] : []
		] : output.schemas ? [!isString(output.schemas) && output.schemas.mode === "single" && namesAFile(output.schemas.path) ? output.schemas.path : getFileInfo(isString(output.schemas) ? output.schemas : output.schemas.path).dirname] : [],
		...fakerSchemaPath ? [fakerSchemaPath] : [],
		...output.operationSchemas ? [getFileInfo(output.operationSchemas).dirname] : [],
		...implementationPaths
	];
	if (options.hooks.afterAllFilesWrite) await executeHook("afterAllFilesWrite", options.hooks.afterAllFilesWrite, paths);
	await runFormatter(output.formatter, paths);
	if (output.docs) try {
		let config = {};
		let configPath;
		if (isObject(output.docs)) {
			const { configPath: docsConfigPath, ...docsOptions } = output.docs;
			configPath = docsConfigPath;
			config = docsOptions;
			if (configPath) config.options = configPath;
		}
		const { Application, PackageJsonReader, TSConfigReader, TypeDocReader } = await importTypedoc();
		const app = await Application.bootstrapWithPlugins(getDocsTypedocOptions(paths.map((x) => upath.toUnix(x)), config), [
			new TypeDocReader(),
			new PackageJsonReader(),
			new TSConfigReader(),
			createMarkdownPluginReader()
		]);
		if (!app.options.isSet("theme")) app.options.setValue("theme", DOCS_MARKDOWN_THEME);
		if (!app.options.isSet("readme")) app.options.setValue("readme", "none");
		if (!app.options.isSet("logLevel")) app.options.setValue("logLevel", "None");
		const project = await app.convert();
		if (project) {
			const outputPath = app.options.getValue("out");
			app.outputs.setDefaultOutputName(getDocsOutputName(app.options.getValue("theme")));
			await app.generateOutputs(project);
			await runFormatter(output.formatter, [outputPath]);
		} else throw new Error("TypeDoc not initialized");
	} catch (error) {
		logger.warn(error instanceof Error ? error : "Unable to generate docs");
	}
	logger.info(createSuccessMessage(info.title));
}
async function writeSpecs(builder, workspace, options, projectName) {
	const transform = options.output.formatter === SupportedFormatter.PRETTIER && !options.hooks.afterAllFilesWrite ? await createPrettierFileTransform() : void 0;
	if (transform) return withGeneratedFileTransform(transform, () => writeSpecsInternal(builder, workspace, options, projectName));
	return writeSpecsInternal(builder, workspace, options, projectName);
}
function getWriteMode(mode) {
	switch (mode) {
		case OutputMode.SPLIT: return writeSplitMode;
		case OutputMode.TAGS: return writeTagsMode;
		case OutputMode.TAGS_SPLIT: return writeSplitTagsMode;
		case OutputMode.TAGS_OPERATIONS: return writeTagsOperationsMode;
		case OutputMode.TAGS_OPERATIONS_SPLIT: return writeTagsOperationsSplitMode;
		default: return writeSingleMode;
	}
}
//#endregion
//#region src/generate-spec.ts
/**
* Source extensions that a mock file can carry. `output.fileExtension` selects
* one of them, but a run after a change of that option must still find the
* files that the previous extension left behind.
*/
const MOCK_FILE_EXTENSIONS = [
	".ts",
	".tsx",
	".mts",
	".cts",
	".js",
	".jsx",
	".mjs",
	".cjs"
];
/** An absolute POSIX path, so paths from different options compare equal. */
const toComparablePath = (directory) => upath.resolve(directory);
/**
* Tells whether `child` names a directory below `parent`. The comparison is
* per path segment, so `src/api/mocks-extra` is not below `src/api/mocks`.
*/
const isBelow = (parent, child) => {
	const parentSegments = parent.split("/");
	const childSegments = child.split("/");
	return childSegments.length > parentSegments.length && parentSegments.every((segment, index) => segment === childSegments[index]);
};
/** The path of `child` relative to `parent`. Requires `isBelow(parent, child)`. */
const relativeToParent = (parent, child) => child.split("/").slice(parent.split("/").length).join("/");
/**
* Generate client/spec files for a single Orval project.
*
* @param workspace - Absolute or relative workspace path used to resolve imports.
* @param options - Normalized generation options for this project.
* @param projectName - Optional project name used in generation (imports, writers).
* @returns A promise that resolves once generation (and optional cleaning) completes.
*
* @example
* await generateSpec(process.cwd(), normalizedOptions, 'my-project');
*/
async function generateSpec(workspace, options, projectName) {
	if (options.output.clean) {
		const extraPatterns = Array.isArray(options.output.clean) ? options.output.clean : [];
		const ownedDirectories = /* @__PURE__ */ new Set();
		if (options.output.target) ownedDirectories.add(toComparablePath(getFileInfo(options.output.target).dirname));
		if (options.output.schemas) {
			const schemas = options.output.schemas;
			if (!isString(schemas) && schemas.mode === "single" && namesAFile(schemas.path)) {
				const schemasDirectory = getFileInfo(schemas.path).dirname;
				await Promise.all([fs.rm(schemas.path, { force: true }), fs.rm(upath.join(schemasDirectory, `__params__${options.output.schemaFileExtension}`), { force: true })]);
			} else ownedDirectories.add(toComparablePath(isString(schemas) ? schemas : schemas.path));
		}
		const mockDirectories = getConfiguredMockDirectories(options.output.mock).map(toComparablePath);
		for (const directory of ownedDirectories) {
			const nestedMockPatterns = mockDirectories.filter((mockDirectory) => isBelow(directory, mockDirectory)).map((mockDirectory) => `!${escapePath(relativeToParent(directory, mockDirectory))}/**`);
			await removeFilesAndEmptyFolders([
				"**/*",
				"!**/*.d.ts",
				...extraPatterns,
				...nestedMockPatterns
			], directory);
		}
		const mockPatterns = Object.values(OutputMockType).flatMap((type) => [.../* @__PURE__ */ new Set([options.output.fileExtension, ...MOCK_FILE_EXTENSIONS])].map((extension) => `**/*.${type}${extension}`));
		for (const directory of mockDirectories) {
			if (ownedDirectories.has(directory)) continue;
			let mockRootStats;
			try {
				mockRootStats = await fs.lstat(directory);
			} catch {
				continue;
			}
			if (mockRootStats.isSymbolicLink()) {
				logger.warn(`Skipped cleaning "${directory}": the configured mock path is a symbolic link.`);
				continue;
			}
			await removeFilesAndEmptyFolders(mockPatterns, directory, { followSymbolicLinks: false });
		}
		logger.info("Cleaning output folder");
	}
	await writeSpecs(await importSpecs(workspace, options, projectName), workspace, options, projectName);
}
//#endregion
//#region src/utils/config.ts
/**
* Resolve the Orval config file path.
*
* @param configFilePath - Optional path to the config file (absolute or relative).
* @returns The absolute path to the resolved config file.
* @throws If a provided path does not exist or if no config file is found.
*
* @example
* // explicit path
* const p = findConfigFile('./orval.config.ts');
*
* @example
* // automatic discovery (searches process.cwd())
* const p = findConfigFile();
*/
function findConfigFile(configFilePath) {
	if (configFilePath) {
		const absolutePath = path.isAbsolute(configFilePath) ? configFilePath : path.resolve(process.cwd(), configFilePath);
		if (!fs$1.existsSync(absolutePath)) throw new Error(`Config file ${configFilePath} does not exist`);
		return absolutePath;
	}
	const root = process.cwd();
	for (const ext of [
		".ts",
		".js",
		".mjs",
		".mts"
	]) {
		const fullPath = path.resolve(root, `orval.config${ext}`);
		if (fs$1.existsSync(fullPath)) return fullPath;
	}
	throw new Error(`No config file found in ${root}`);
}
/**
* Load an Orval config file
* @param configFilePath - Path to the config file (absolute or relative).
* @returns The resolved Orval `Config` object.
* @throws If the module does not provide a default export or the default export resolves to `undefined`.
*
* @example
* // load a config object
* const cfg = await loadConfigFile('./orval.config.ts');
*/
async function loadConfigFile(configFilePath) {
	const configExternal = await createJiti(process.cwd(), { interopDefault: true }).import(configFilePath, { default: true });
	if (configExternal === void 0) throw new Error(`${configFilePath} doesn't have a default export`);
	return await (isFunction(configExternal) ? configExternal() : configExternal);
}
/** Project entries, excluding the file-level {@link Config.logLevel} key. */
function getConfigProjects(config) {
	return Object.entries(config).filter((entry) => entry[0] !== "logLevel");
}
//#endregion
export { startWatcher as a, generateSpec as i, getConfigProjects as n, loadConfigFile as r, findConfigFile as t };

//# sourceMappingURL=config-CLbRt_oo.mjs.map