import { createRequire } from "node:module";
import path from "node:path";
import { FormDataArrayHandling, NamingConvention, OutputClient, OutputHttpClient, OutputMockType, OutputMode, PropertySortOrder, RefComponentSuffix, createLogger, dynamicImport, isBoolean, isFunction, isNullish, isObject, isString, isUrl, normalizeAngularRuntimeValidation, normalizeRuntimeValidation, operationZodOverrideKeys, resolveInstalledVersions, upath } from "@orval/core";
import { access } from "node:fs/promises";
import yaml from "js-yaml";
import fs$1, { existsSync } from "node:fs";
import { styleText } from "node:util";
import JSON5 from "json5";
import { parseTsconfig } from "get-tsconfig";
//#region package.json
var name = "orval";
var version = "8.41.0";
var description = "A swagger client generator for typescript";
//#endregion
//#region src/logger.ts
const logger = createLogger("orval");
//#endregion
//#region src/utils/find-up.ts
const isFile = (file) => {
	try {
		return fs$1.statSync(file, { throwIfNoEntry: false })?.isFile() ?? false;
	} catch {
		return false;
	}
};
/**
* Walks from `cwd` up to the filesystem root and returns, nearest first, one
* path per directory that holds any of `names` (tried in order) as a file.
*/
function findUpMultiple(names, cwd) {
	const found = [];
	for (let dir = path.resolve(cwd);; dir = path.dirname(dir)) {
		const file = [names].flat().map((name) => path.join(dir, name)).find(isFile);
		if (file) found.push(file);
		if (path.dirname(dir) === dir) return found;
	}
}
/** The nearest of `names` at or above `cwd`, or `undefined`. */
const findUp = (names, cwd) => findUpMultiple(names, cwd)[0];
//#endregion
//#region src/utils/package-json.ts
const loadPackageJson = async (packageJson, workspace = process.cwd()) => {
	if (!packageJson) {
		const pkgPath = findUp("package.json", workspace);
		if (pkgPath) {
			const pkg = await dynamicImport(pkgPath, workspace);
			if (isPackageJson(pkg)) return resolveAndAttachVersions(await maybeReplaceCatalog(pkg, workspace), workspace, pkgPath);
			else throw new Error("Invalid package.json file");
		}
		return;
	}
	const normalizedPath = normalizePath(packageJson, workspace);
	if (fs$1.existsSync(normalizedPath)) {
		let pkg;
		try {
			pkg = JSON5.parse(await fs$1.promises.readFile(normalizedPath, "utf8"));
		} catch (error) {
			throw new Error(`Oups... 🍺. Path: ${normalizedPath} => ${String(error)}`, { cause: error });
		}
		if (isPackageJson(pkg)) return resolveAndAttachVersions(await maybeReplaceCatalog(pkg, workspace), workspace, normalizedPath);
		else throw new Error(`Invalid package.json file: ${normalizedPath}`);
	}
};
const isPackageJson = (obj) => isObject(obj);
const resolvedCache = /* @__PURE__ */ new Map();
const resolveAndAttachVersions = (pkg, workspace, cacheKey) => {
	const cached = resolvedCache.get(cacheKey);
	if (cached) {
		pkg.resolvedVersions = cached;
		return pkg;
	}
	const resolved = resolveInstalledVersions(pkg, workspace);
	if (Object.keys(resolved).length > 0) {
		pkg.resolvedVersions = resolved;
		resolvedCache.set(cacheKey, resolved);
		for (const [name, version] of Object.entries(resolved)) logger.verbose(styleText("dim", `Detected ${styleText("white", name)} v${styleText("white", version)}`));
	}
	return pkg;
};
const hasCatalogReferences = (pkg) => {
	return [
		...Object.entries(pkg.dependencies ?? {}),
		...Object.entries(pkg.devDependencies ?? {}),
		...Object.entries(pkg.peerDependencies ?? {})
	].some(([, value]) => isString(value) && value.startsWith("catalog:"));
};
const pickCatalog = (data) => data?.catalog || data?.catalogs ? {
	catalog: data.catalog,
	catalogs: data.catalogs
} : void 0;
/** The catalog of the nearest `fileName` (pnpm-workspace.yaml, .yarnrc.yml). */
const loadYamlCatalog = async (fileName, workspace) => {
	const filePath = findUp(fileName, workspace);
	if (!filePath) return void 0;
	try {
		const file = await fs$1.promises.readFile(filePath, "utf8");
		return pickCatalog(yaml.load(file));
	} catch {
		return;
	}
};
const loadPackageJsonCatalog = async (workspace) => {
	for (const filePath of findUpMultiple("package.json", workspace)) try {
		const catalog = pickCatalog(JSON.parse((await fs$1.promises.readFile(filePath, "utf8")).replace(/^\uFEFF/, "")));
		if (catalog) return catalog;
	} catch {}
};
const maybeReplaceCatalog = async (pkg, workspace) => {
	if (!hasCatalogReferences(pkg)) return pkg;
	const catalogData = await loadYamlCatalog("pnpm-workspace.yaml", workspace) ?? await loadPackageJsonCatalog(workspace) ?? await loadYamlCatalog(".yarnrc.yml", workspace);
	if (!catalogData) {
		logger.warn("package.json contains catalog: references, but no catalog source was found (checked: pnpm-workspace.yaml, package.json, .yarnrc.yml).");
		return pkg;
	}
	performSubstitution(pkg.dependencies, catalogData);
	performSubstitution(pkg.devDependencies, catalogData);
	performSubstitution(pkg.peerDependencies, catalogData);
	return pkg;
};
const performSubstitution = (dependencies, catalogData) => {
	if (!dependencies) return;
	for (const [packageName, version] of Object.entries(dependencies)) if (version === "catalog:" || version === "catalog:default") {
		if (!catalogData.catalog) {
			logger.warn(`catalog: substitution for the package '${packageName}' failed as there is no default catalog.`);
			continue;
		}
		const sub = catalogData.catalog[packageName];
		if (!sub) {
			logger.warn(`catalog: substitution for the package '${packageName}' failed as there is no matching package in the default catalog.`);
			continue;
		}
		dependencies[packageName] = sub;
	} else if (version.startsWith("catalog:")) {
		const catalogName = version.slice(8);
		const catalog = catalogData.catalogs?.[catalogName];
		if (!catalog) {
			logger.warn(`'${version}' substitution for the package '${packageName}' failed as there is no matching catalog named '${catalogName}'. (available named catalogs are: ${Object.keys(catalogData.catalogs ?? {}).join(", ")})`);
			continue;
		}
		const sub = catalog[packageName];
		if (!sub) {
			logger.warn(`'${version}' substitution for the package '${packageName}' failed as there is no package in the catalog named '${catalogName}'. (packages in the catalog are: ${Object.keys(catalog).join(", ")})`);
			continue;
		}
		dependencies[packageName] = sub;
	}
};
//#endregion
//#region src/utils/tsconfig.ts
const convertTarget = (config) => {
	if (!config.compilerOptions?.target) return {
		baseUrl: config.compilerOptions?.baseUrl,
		...config
	};
	const lowercaseTarget = config.compilerOptions.target.toLowerCase();
	return {
		baseUrl: config.compilerOptions.baseUrl,
		...config,
		compilerOptions: {
			...config.compilerOptions,
			target: lowercaseTarget
		}
	};
};
const loadTsconfig = async (tsconfig, workspace = process.cwd()) => {
	if (isNullish(tsconfig)) {
		const configPath = findUp(["tsconfig.json", "jsconfig.json"], workspace);
		if (configPath) {
			const config = parseTsconfig(configPath);
			return convertTarget(config);
		}
		return;
	}
	if (isString(tsconfig)) {
		const normalizedPath = normalizePath(tsconfig, workspace);
		if (fs$1.existsSync(normalizedPath)) {
			const config = parseTsconfig(normalizedPath);
			return convertTarget(config);
		}
		return;
	}
	if (isObject(tsconfig)) return tsconfig;
};
//#endregion
//#region src/utils/options.ts
const INPUT_TARGET_FETCH_TIMEOUT_MS = 1e4;
let mockModuleCache;
const getDefaultMockOptionsForType = async (type) => (await (mockModuleCache ??= import("@orval/mock"))).getDefaultMockOptionsForType(type);
/**
* Type helper to make it easier to use orval.config.ts
* accepts a direct {@link ConfigExternal} object.
*/
function defineConfig(options) {
	return options;
}
/**
* Type helper to make it easier to write input transformers.
* accepts a direct {@link InputTransformerFn} function.
*/
function defineTransformer(transformer) {
	return transformer;
}
function createFormData(workspace, formData) {
	const defaultArrayHandling = FormDataArrayHandling.SERIALIZE;
	if (formData === void 0) return {
		disabled: false,
		arrayHandling: defaultArrayHandling
	};
	if (isBoolean(formData)) return {
		disabled: !formData,
		arrayHandling: defaultArrayHandling
	};
	if (isString(formData)) return {
		disabled: false,
		mutator: normalizeMutator(workspace, formData),
		arrayHandling: defaultArrayHandling
	};
	if ("mutator" in formData || "arrayHandling" in formData) return {
		disabled: false,
		mutator: normalizeMutator(workspace, formData.mutator),
		arrayHandling: formData.arrayHandling ?? defaultArrayHandling
	};
	return {
		disabled: false,
		mutator: normalizeMutator(workspace, formData),
		arrayHandling: defaultArrayHandling
	};
}
/** Extensions that mean a value names a source file rather than a directory. */
const SOURCE_FILE_EXTENSIONS = /* @__PURE__ */ new Set([
	".ts",
	".tsx",
	".mts",
	".cts",
	".js",
	".jsx",
	".mjs",
	".cjs"
]);
/** True when a path names a source file rather than a directory. */
function namesAFile(path$1) {
	return SOURCE_FILE_EXTENSIONS.has(path.extname(path$1).toLowerCase());
}
/**
* Reject a schemas path that names a source file.
*
* The path is always a directory — orval writes one file per schema into it,
* plus a barrel. A filename was accepted silently and produced a *directory*
* with that name, so `./model/example.zod.ts` became a folder called
* `example.zod.ts` holding the split files: the shape a user asking for
* single-file output would least expect (#4042).
*
* `schemas.mode: 'single'` is the exception: there the path may name the
* schema module itself.
*/
function assertSchemasPathIsDirectory(path, option) {
	if (!namesAFile(path)) return;
	throw new Error(styleText("red", `\`${option}\` is a directory, but "${path}" names a file. Orval writes one file per schema into that directory, so a filename would become a directory with that name.\nPass the directory instead (e.g. \`${option}: './model'\`), or omit \`schemas\` to generate them alongside the target.`));
}
function normalizeSchemasOption(schemas, workspace) {
	if (!schemas) return;
	if (isString(schemas)) {
		assertSchemasPathIsDirectory(schemas, "schemas");
		return normalizePath(schemas, workspace);
	}
	if (!isString(schemas.path) || schemas.path.trim() === "") throw new Error(styleText("red", `\`schemas.path\` is required when \`schemas\` is an object (e.g. \`schemas: { path: './model', type: 'zod' }\`). To generate schemas alongside the target instead, omit \`schemas\` or set \`schemas: false\`.`));
	if (schemas.mode !== void 0 && schemas.mode !== "split" && schemas.mode !== "single") throw new Error("schemas.mode must be \"split\" or \"single\".");
	if (schemas.mode === "single") {
		if (schemas.splitByTags || schemas.routes) throw new Error("schemas.mode \"single\" cannot be combined with schemas.splitByTags or schemas.routes.");
	}
	if (schemas.mode !== "single") assertSchemasPathIsDirectory(schemas.path, "schemas.path");
	validatePackageSpecifier(schemas.importPath, "schemas.importPath");
	const routes = schemas.routes ? normalizeSchemaRoutes(schemas.routes) : void 0;
	return {
		path: normalizePath(schemas.path, workspace),
		type: schemas.type ?? "typescript",
		importPath: schemas.importPath,
		splitByTags: schemas.splitByTags ?? false,
		...schemas.mode === void 0 ? {} : { mode: schemas.mode },
		routes
	};
}
/** Normalizes the configured default and enum schema routes. */
function normalizeSchemaRoutes(routes) {
	if (!isString(routes.default)) throw new Error(styleText("red", "`schemas.routes.default` is required when `schemas.routes` is configured."));
	const normalized = {
		default: validateSchemaRoute(routes.default, "schemas.routes.default"),
		...routes.enum !== void 0 ? { enum: validateSchemaRoute(routes.enum, "schemas.routes.enum") } : {}
	};
	if (normalized.enum && normalized.enum.toLowerCase() === normalized.default.toLowerCase()) throw new Error(styleText("red", "`schemas.routes.default` and `schemas.routes.enum` must be different directories."));
	return normalized;
}
/** Validates and normalizes one schema route relative to `schemas.path`. */
function validateSchemaRoute(value, fieldName) {
	const route = value.trim();
	const portableRoute = route.replaceAll("\\", "/");
	const isWindowsAbsolute = /^[A-Za-z]:\//.test(portableRoute);
	const isUncAbsolute = portableRoute.startsWith("//");
	const segments = portableRoute.split("/").filter(Boolean).filter((segment) => segment !== ".");
	if (route === "" || path.isAbsolute(route) || isWindowsAbsolute || isUncAbsolute || segments.length === 0 || segments.includes("..")) throw new Error(styleText("red", `\`${fieldName}\` must be a relative directory under \`schemas.path\`.`));
	return upath.joinSafe(...segments);
}
/** Rejects schema-routing combinations that are unsupported by generation. */
function validateSchemaRoutes(output) {
	const schemas = output.schemas;
	if (!schemas || isString(schemas)) return;
	if (schemas.mode === "single") {
		if (output.operationSchemas || output.factoryMethods) throw new Error("schemas.mode \"single\" cannot be combined with operationSchemas or factoryMethods.");
		if (schemas.type === "zod" && output.mock.generators.length > 0) throw new Error("schemas.mode \"single\" cannot be combined with mock generators when schemas.type is \"zod\".");
	}
	if (!schemas.routes) return;
	if (output.operationSchemas) throw new Error(styleText("red", "`schemas.routes` cannot be used with `output.operationSchemas` in this release."));
	if (output.mock.generators.length > 0) throw new Error(styleText("red", "`schemas.routes` cannot be used with mock generators in this release."));
	if (output.factoryMethods) throw new Error(styleText("red", "`schemas.routes` cannot be used with `output.factoryMethods` in this release."));
}
/** Rejects a faker `schemasPath` that has nothing to write or would clash. */
function validateFakerSchemasPath(output) {
	const faker = output.mock.generators.find((g) => !isFunction(g) && g.type === OutputMockType.FAKER && !!g.schemasPath);
	if (!faker?.schemasPath) return;
	if (faker.schemas !== true) throw new Error(styleText("red", "`mock.generators[faker].schemasPath` requires `schemas: true` on the same generator. It only moves the schema-level faker factories file."));
	if (!output.schemas) throw new Error(styleText("red", "`mock.generators[faker].schemasPath` requires `output.schemas` to be set. Without it the factories are written next to the target as `schemas.faker.ts`."));
	if (output.mock.indexMockFiles && faker.path && upath.resolve(faker.schemasPath) === upath.resolve(faker.path)) throw new Error(styleText("red", "`mock.generators[faker].schemasPath` cannot be the faker `path` when `indexMockFiles` is true, because both write `index.faker.ts` there. Use a subdirectory such as `<faker path>/schemas`."));
}
/**
* Validates that a config value is a valid package specifier (bare specifier
* or sub-path import like `@acme/models` / `@acme/models/fakers`). Rejects
* empty, whitespace-only, relative (`./`, `../`), and absolute paths with a
* clear, actionable error message. No-op when the value is `undefined`.
*/
function validatePackageSpecifier(value, fieldName) {
	if (value === void 0) return;
	if (!value) throw new Error(`\`${fieldName}\` must be a non-empty package specifier (e.g. '@acme/models'). Received an empty string.`);
	if (value.trim() === "") throw new Error(`\`${fieldName}\` must be a non-empty package specifier (e.g. '@acme/models'). Received a whitespace-only string.`);
	if (value.trim() !== value) throw new Error(`\`${fieldName}\` must be a non-empty package specifier (e.g. '@acme/models'). Received a value with leading or trailing whitespace: "${value}"`);
	if (value.startsWith(".")) throw new Error(`\`${fieldName}\` must be a package specifier (e.g. '@acme/models'), not a relative path. Received: "${value}"`);
	if (path.isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value) || value.startsWith("\\\\")) throw new Error(`\`${fieldName}\` must be a package specifier (e.g. '@acme/models'), not an absolute path. Received: "${value}"`);
}
function looksLikePackageSpecifier(value) {
	return !!value && value.trim() === value && !value.startsWith(".") && !path.isAbsolute(value) && !/^[A-Za-z]:[\\/]/.test(value) && !value.startsWith("\\\\");
}
function resolvePackageSpecifier(workspace, value) {
	try {
		return createRequire(path.join(workspace, "package.json")).resolve(value);
	} catch {
		return;
	}
}
function isPackageSpecifierCandidate(workspace, value) {
	if (!looksLikePackageSpecifier(value)) return false;
	if (existsSync(path.resolve(workspace, value))) return false;
	if (value.startsWith("@")) return true;
	const [packageName] = value.split("/");
	if (!value.includes("/")) return true;
	for (let dir = workspace;;) {
		if (existsSync(path.join(dir, "node_modules", packageName))) return true;
		const parent = path.dirname(dir);
		if (parent === dir) return false;
		dir = parent;
	}
}
function normalizeEffectOptions(effect) {
	return {
		strict: {
			param: effect?.strict?.param ?? false,
			query: effect?.strict?.query ?? false,
			header: effect?.strict?.header ?? false,
			body: effect?.strict?.body ?? false,
			response: effect?.strict?.response ?? false
		},
		generate: {
			param: effect?.generate?.param ?? true,
			query: effect?.generate?.query ?? true,
			header: effect?.generate?.header ?? true,
			body: effect?.generate?.body ?? true,
			response: effect?.generate?.response ?? true
		},
		generateEachHttpStatus: effect?.generateEachHttpStatus ?? false,
		useBrandedTypes: effect?.useBrandedTypes ?? false,
		exactOptional: effect?.exactOptional ?? false,
		version: effect?.version ?? "auto"
	};
}
const ANGULAR_BASE_URL_API_ID_REGEX = /^[A-Za-z][A-Za-z0-9_-]*$/;
/**
* Normalizes and validates `override.angular.baseUrl` (opt-in Angular DI
* base-URL composition, see `AngularBaseUrlOptions`).
*
* - `apiId` must be an explicit, stable identifier (`/^[A-Za-z][A-Za-z0-9_-]*$/`).
* - Mutually exclusive with the top-level `output.baseUrl`, which bakes a
*   static prefix into every generated route for ALL clients — combining
*   both would double-prefix (or conflict with) every URL.
* - Only meaningful for the `angular` client; warns (without dropping the
*   option) when configured for any other client.
*/
function normalizeAngularBaseUrl(baseUrl, outputClient, outputBaseUrl) {
	if (!baseUrl.apiId || !ANGULAR_BASE_URL_API_ID_REGEX.test(baseUrl.apiId)) throw new Error(styleText("red", `\`override.angular.baseUrl.apiId\` must be a non-empty string matching /^[A-Za-z][A-Za-z0-9_-]*$/ (got: ${JSON.stringify(baseUrl.apiId)}).`));
	if (outputBaseUrl !== void 0) throw new Error(styleText("red", "`override.angular.baseUrl` cannot be combined with the top-level `output.baseUrl`. Remove `output.baseUrl` — the base-URL token's server-URL fallback is resolved from the specification's `servers` field, or provide a custom resolver via the generated `provide<Api>BaseUrlResolver` helper."));
	if (outputClient !== OutputClient.ANGULAR) logger.warn(`\`override.angular.baseUrl\` is only supported by the \`angular\` client. It has no effect for other clients.`);
	return {
		apiId: baseUrl.apiId,
		...baseUrl.index !== void 0 ? { index: baseUrl.index } : {},
		...baseUrl.variables ? { variables: baseUrl.variables } : {}
	};
}
async function normalizeOptions(optionsExport, workspace = process.cwd(), globalOptions = {}) {
	const options = await (isFunction(optionsExport) ? optionsExport() : optionsExport);
	if (!options.input) throw new Error(styleText("red", `Config requires an input.`));
	if (!options.output) throw new Error(styleText("red", `Config requires an output.`));
	const inputOptions = isString(options.input) || Array.isArray(options.input) ? { target: options.input } : options.input;
	const outputOptions = isString(options.output) ? { target: options.output } : options.output;
	const outputWorkspace = normalizePath(outputOptions.workspace ?? "", workspace);
	const { clean, client, httpClient, mode } = globalOptions;
	const tsconfig = await loadTsconfig(outputOptions.tsconfig ?? globalOptions.tsconfig, workspace);
	const packageJson = await loadPackageJson(outputOptions.packageJson ?? globalOptions.packageJson, workspace);
	const mocksOption = outputOptions.mock ?? globalOptions.mock;
	let mocks = {
		indexMockFiles: false,
		inline: false,
		generators: []
	};
	if (isBoolean(mocksOption) && mocksOption) mocks = {
		indexMockFiles: false,
		inline: false,
		generators: [await getDefaultMockOptionsForType(OutputMockType.MSW), await getDefaultMockOptionsForType(OutputMockType.FAKER)]
	};
	else if (isFunction(mocksOption)) mocks = {
		indexMockFiles: false,
		inline: false,
		generators: [mocksOption]
	};
	else if (mocksOption && typeof mocksOption === "object") {
		if (!Array.isArray(mocksOption.generators)) throw new TypeError("mock.generators must be an array of generator entries (e.g. [{ type: \"msw\" }]).");
		const sharedMockPath = mocksOption.path && isString(mocksOption.path) ? normalizePath(mocksOption.path, outputWorkspace) : void 0;
		mocks = {
			indexMockFiles: mocksOption.indexMockFiles ?? false,
			path: sharedMockPath,
			inline: mocksOption.inline ?? false,
			generators: await Promise.all(mocksOption.generators.map(async (m) => isFunction(m) ? m : {
				...await getDefaultMockOptionsForType(m.type),
				...m,
				path: m.path && isString(m.path) ? normalizePath(m.path, outputWorkspace) : sharedMockPath,
				...m.type === OutputMockType.FAKER && m.schemasPath && isString(m.schemasPath) && { schemasPath: normalizePath(m.schemasPath, outputWorkspace) }
			}))
		};
	}
	const seenMockTypes = /* @__PURE__ */ new Set();
	for (const entry of mocks.generators) {
		if (isFunction(entry)) continue;
		if (seenMockTypes.has(entry.type)) throw new Error(`Duplicate mock generator type "${entry.type}". Each type can only appear once in mock.generators.`);
		seenMockTypes.add(entry.type);
		if (entry.type === OutputMockType.FAKER) {
			validatePackageSpecifier(entry.schemasImportPath, "mock.generators[faker].schemasImportPath");
			validatePackageSpecifier(entry.importPath, "mock.generators[faker].importPath");
			if (entry.importPath && !mocks.indexMockFiles) throw new Error("`mock.generators[faker].importPath` requires `mock.indexMockFiles: true`.");
		}
	}
	const defaultFileExtension = ".ts";
	const defaultSchemaFileExtension = !!outputOptions.schemas && (!isString(outputOptions.schemas) && outputOptions.schemas.type === "zod" || isString(outputOptions.schemas) && (outputOptions.client ?? client) === "zod" && outputOptions.override?.zod?.generateReusableSchemas === true) ? ".zod.ts" : defaultFileExtension;
	const factoryMethodsConfig = outputOptions.factoryMethods;
	let factoryMethods = void 0;
	if (factoryMethodsConfig) factoryMethods = {
		functionNamePrefix: factoryMethodsConfig.functionNamePrefix ?? "create",
		mode: factoryMethodsConfig.mode ?? "split",
		outputDirectory: factoryMethodsConfig.outputDirectory ? normalizePath(factoryMethodsConfig.outputDirectory, outputWorkspace) : outputOptions.schemas ? normalizePath(isString(outputOptions.schemas) ? outputOptions.schemas : outputOptions.schemas.path, outputWorkspace) : normalizePath(outputWorkspace, outputWorkspace),
		includeOptionalProperty: factoryMethodsConfig.includeOptionalProperty ?? true
	};
	const globalQueryOptions = {
		signal: true,
		shouldExportMutatorHooks: true,
		shouldExportHttpClient: true,
		shouldExportKeys: true,
		shouldFilterQueryKey: false,
		shouldSplitQueryKey: false,
		...normalizeQueryOptions(outputOptions.override?.query, outputWorkspace)
	};
	const normalizedOptions = {
		input: {
			target: globalOptions.input ? Array.isArray(globalOptions.input) ? await resolveFirstValidTarget(globalOptions.input, process.cwd(), inputOptions.parserOptions) : normalizePathOrUrl(globalOptions.input, process.cwd()) : Array.isArray(inputOptions.target) ? await resolveFirstValidTarget(inputOptions.target, workspace, inputOptions.parserOptions) : normalizeInputTarget(inputOptions.target, workspace),
			override: { transformer: normalizePath(inputOptions.override?.transformer, workspace) },
			unsafeDisableValidation: inputOptions.unsafeDisableValidation ?? false,
			filters: inputOptions.filters,
			parserOptions: inputOptions.parserOptions
		},
		output: {
			target: globalOptions.output ? normalizePath(globalOptions.output, process.cwd()) : normalizePath(outputOptions.target, outputWorkspace),
			schemas: normalizeSchemasOption(outputOptions.schemas, outputWorkspace),
			operationSchemas: outputOptions.operationSchemas ? normalizePath(outputOptions.operationSchemas, outputWorkspace) : void 0,
			namingConvention: outputOptions.namingConvention ?? NamingConvention.CAMEL_CASE,
			fileExtension: outputOptions.fileExtension ?? defaultFileExtension,
			schemaFileExtension: outputOptions.schemaFileExtension ?? outputOptions.fileExtension ?? defaultSchemaFileExtension,
			workspace: outputOptions.workspace ? outputWorkspace : void 0,
			workspaceExports: outputOptions.workspaceExports,
			client: outputOptions.client ?? client ?? OutputClient.AXIOS_FUNCTIONS,
			httpClient: outputOptions.httpClient ?? httpClient ?? ((outputOptions.client ?? client) === OutputClient.ANGULAR_QUERY ? OutputHttpClient.ANGULAR : OutputHttpClient.FETCH),
			mode: normalizeOutputMode(outputOptions.mode ?? mode),
			mock: mocks,
			clean: outputOptions.clean ?? clean ?? false,
			docs: outputOptions.docs ?? false,
			formatter: outputOptions.formatter ?? globalOptions.formatter,
			tsconfig,
			packageJson,
			headers: outputOptions.headers ?? false,
			indexFiles: outputOptions.indexFiles ?? true,
			baseUrl: outputOptions.baseUrl,
			unionAddMissingProperties: outputOptions.unionAddMissingProperties ?? false,
			factoryMethods,
			tagsSplitDeduplication: outputOptions.tagsSplitDeduplication ?? false,
			commonTypesFileName: outputOptions.commonTypesFileName ?? "common-types",
			override: {
				...outputOptions.override,
				mock: {
					arrayMin: outputOptions.override?.mock?.arrayMin ?? 1,
					arrayMax: outputOptions.override?.mock?.arrayMax ?? 10,
					stringMin: outputOptions.override?.mock?.stringMin ?? 10,
					stringMax: outputOptions.override?.mock?.stringMax ?? 20,
					fractionDigits: outputOptions.override?.mock?.fractionDigits ?? 2,
					...outputOptions.override?.mock
				},
				operations: normalizeOperationsAndTags(outputOptions.override?.operations ?? {}, outputWorkspace, { query: globalQueryOptions }, "operations"),
				tags: normalizeOperationsAndTags(outputOptions.override?.tags ?? {}, outputWorkspace, { query: globalQueryOptions }, "tags"),
				mutator: normalizeMutator(outputWorkspace, outputOptions.override?.mutator),
				formData: createFormData(outputWorkspace, outputOptions.override?.formData),
				formUrlEncoded: (isBoolean(outputOptions.override?.formUrlEncoded) ? outputOptions.override.formUrlEncoded : normalizeMutator(outputWorkspace, outputOptions.override?.formUrlEncoded)) ?? true,
				paramsSerializer: normalizeMutator(outputWorkspace, outputOptions.override?.paramsSerializer),
				paramsFilter: normalizeMutator(outputWorkspace, outputOptions.override?.paramsFilter),
				header: outputOptions.override?.header === false ? false : isFunction(outputOptions.override?.header) ? outputOptions.override.header : getDefaultFilesHeader,
				requestOptions: outputOptions.override?.requestOptions ?? true,
				namingConvention: outputOptions.override?.namingConvention ?? {},
				components: {
					schemas: {
						prefix: outputOptions.override?.components?.schemas?.prefix ?? "",
						suffix: RefComponentSuffix.schemas,
						itemPrefix: outputOptions.override?.components?.schemas?.itemPrefix ?? "",
						itemSuffix: outputOptions.override?.components?.schemas?.itemSuffix ?? "Item",
						...outputOptions.override?.components?.schemas
					},
					responses: {
						prefix: outputOptions.override?.components?.responses?.prefix ?? "",
						suffix: RefComponentSuffix.responses,
						...outputOptions.override?.components?.responses
					},
					parameters: {
						prefix: outputOptions.override?.components?.parameters?.prefix ?? "",
						suffix: RefComponentSuffix.parameters,
						...outputOptions.override?.components?.parameters
					},
					requestBodies: {
						prefix: outputOptions.override?.components?.requestBodies?.prefix ?? "",
						suffix: RefComponentSuffix.requestBodies,
						...outputOptions.override?.components?.requestBodies
					}
				},
				hono: normalizeHonoOptions(outputOptions.override?.hono, workspace),
				mcp: normalizeMcpOptions(outputOptions.override?.mcp, workspace),
				jsDoc: normalizeJSDocOptions(outputOptions.override?.jsDoc),
				query: globalQueryOptions,
				zod: {
					strict: {
						param: outputOptions.override?.zod?.strict?.param ?? false,
						query: outputOptions.override?.zod?.strict?.query ?? false,
						header: outputOptions.override?.zod?.strict?.header ?? false,
						body: outputOptions.override?.zod?.strict?.body ?? false,
						response: outputOptions.override?.zod?.strict?.response ?? false
					},
					generate: {
						param: outputOptions.override?.zod?.generate?.param ?? true,
						query: outputOptions.override?.zod?.generate?.query ?? true,
						header: outputOptions.override?.zod?.generate?.header ?? true,
						body: outputOptions.override?.zod?.generate?.body ?? true,
						response: outputOptions.override?.zod?.generate?.response ?? true
					},
					coerce: {
						param: outputOptions.override?.zod?.coerce?.param ?? false,
						query: outputOptions.override?.zod?.coerce?.query ?? false,
						header: outputOptions.override?.zod?.coerce?.header ?? false,
						body: outputOptions.override?.zod?.coerce?.body ?? false,
						response: outputOptions.override?.zod?.coerce?.response ?? false
					},
					preprocess: {
						...outputOptions.override?.zod?.preprocess?.param ? { param: normalizeMutator(outputWorkspace, outputOptions.override.zod.preprocess.param) } : {},
						...outputOptions.override?.zod?.preprocess?.query ? { query: normalizeMutator(outputWorkspace, outputOptions.override.zod.preprocess.query) } : {},
						...outputOptions.override?.zod?.preprocess?.header ? { header: normalizeMutator(outputWorkspace, outputOptions.override.zod.preprocess.header) } : {},
						...outputOptions.override?.zod?.preprocess?.body ? { body: normalizeMutator(outputWorkspace, outputOptions.override.zod.preprocess.body) } : {},
						...outputOptions.override?.zod?.preprocess?.response ? { response: normalizeMutator(outputWorkspace, outputOptions.override.zod.preprocess.response) } : {}
					},
					...outputOptions.override?.zod?.params ? { params: normalizeMutator(outputWorkspace, outputOptions.override.zod.params) } : {},
					variant: outputOptions.override?.zod?.variant ?? "classic",
					version: outputOptions.override?.zod?.version ?? "auto",
					generateEachHttpStatus: outputOptions.override?.zod?.generateEachHttpStatus ?? false,
					useBrandedTypes: outputOptions.override?.zod?.useBrandedTypes ?? false,
					generateReusableSchemas: outputOptions.override?.zod?.generateReusableSchemas ?? false,
					generateMeta: outputOptions.override?.zod?.generateMeta ?? false,
					generateDiscriminatedUnion: outputOptions.override?.zod?.generateDiscriminatedUnion ?? false,
					exactOptional: outputOptions.override?.zod?.exactOptional ?? false,
					generateCompanionTypes: outputOptions.override?.zod?.generateCompanionTypes ?? false,
					dateTimeOptions: outputOptions.override?.zod?.dateTimeOptions ?? { offset: true },
					timeOptions: outputOptions.override?.zod?.timeOptions ?? {}
				},
				effect: normalizeEffectOptions(outputOptions.override?.effect),
				swr: {
					generateErrorTypes: false,
					...outputOptions.override?.swr
				},
				angular: {
					provideIn: outputOptions.override?.angular?.provideIn ?? "root",
					client: outputOptions.override?.angular?.retrievalClient ?? outputOptions.override?.angular?.client ?? "httpClient",
					runtimeValidation: normalizeAngularRuntimeValidation(outputOptions.override?.angular?.runtimeValidation),
					queryObjectSerialization: outputOptions.override?.angular?.queryObjectSerialization ?? "spec",
					...outputOptions.override?.angular?.httpResource ? { httpResource: outputOptions.override.angular.httpResource } : {},
					...outputOptions.override?.angular?.baseUrl ? { baseUrl: normalizeAngularBaseUrl(outputOptions.override.angular.baseUrl, outputOptions.client ?? client, outputOptions.baseUrl) } : {}
				},
				axios: { includeHttpResponseReturnType: outputOptions.override?.axios?.includeHttpResponseReturnType ?? false },
				fetch: {
					...outputOptions.override?.fetch,
					includeHttpResponseReturnType: outputOptions.override?.fetch?.includeHttpResponseReturnType ?? true,
					forceSuccessResponse: outputOptions.override?.fetch?.forceSuccessResponse ?? false,
					serializeResponseHeaders: outputOptions.override?.fetch?.serializeResponseHeaders ?? false,
					runtimeValidation: normalizeRuntimeValidation(outputOptions.override?.fetch?.runtimeValidation),
					useRuntimeFetcher: outputOptions.override?.fetch?.useRuntimeFetcher ?? false,
					...outputOptions.override?.fetch?.arrayFormat ? { arrayFormat: outputOptions.override.fetch.arrayFormat } : {},
					...outputOptions.override?.fetch?.jsonReviver ? { jsonReviver: normalizeMutator(outputWorkspace, outputOptions.override.fetch.jsonReviver) } : {}
				},
				useDates: (outputOptions.override?.useDates ?? false) || (outputOptions.override?.useDatesTransform ?? false),
				useDatesTransform: outputOptions.override?.useDatesTransform ?? false,
				useDeprecatedOperations: outputOptions.override?.useDeprecatedOperations ?? true,
				enumGenerationType: outputOptions.override?.enumGenerationType ?? "const",
				suppressReadonlyModifier: outputOptions.override?.suppressReadonlyModifier ?? false,
				preserveReadonlyRequestBodies: outputOptions.override?.preserveReadonlyRequestBodies ?? "strip",
				splitByContentType: outputOptions.override?.splitByContentType ?? false,
				aliasCombinedTypes: outputOptions.override?.aliasCombinedTypes ?? false,
				includeZodSchemaInArguments: outputOptions.override?.includeZodSchemaInArguments ?? false
			},
			allParamsOptional: outputOptions.allParamsOptional ?? false,
			urlEncodeParameters: outputOptions.urlEncodeParameters ?? false,
			optionsParamRequired: outputOptions.optionsParamRequired ?? false,
			propertySortOrder: outputOptions.propertySortOrder ?? PropertySortOrder.SPECIFICATION
		},
		hooks: options.hooks ? normalizeHooks(options.hooks) : {}
	};
	if (!normalizedOptions.input.target) throw new Error(styleText("red", `Config requires an input target.`));
	if (!normalizedOptions.output.target && !normalizedOptions.output.schemas) throw new Error(styleText("red", `Config requires an output target or schemas.`));
	validateSchemaRoutes(normalizedOptions.output);
	const fakerWithSchemasImportPath = normalizedOptions.output.mock.generators.find((g) => !isFunction(g) && g.type === OutputMockType.FAKER && !!g.schemasImportPath);
	if (fakerWithSchemasImportPath) {
		if (fakerWithSchemasImportPath.schemas !== true) throw new Error(styleText("red", `\`mock.generators[faker].schemasImportPath\` requires \`schemas: true\` on the same generator. Schema-level faker factories are only emitted when \`schemas: true\`.`));
		if (!fakerWithSchemasImportPath.schemasPath && !(isObject(normalizedOptions.output.schemas) && normalizedOptions.output.schemas.importPath)) throw new Error(styleText("red", `\`mock.generators[faker].schemasImportPath\` requires \`schemas.importPath\` or \`schemasPath\` to also be set. It overrides the package specifier used for importing schema-level faker factories.`));
	}
	validateFakerSchemasPath(normalizedOptions.output);
	const usesAngularGenerator = normalizedOptions.output.client === OutputClient.ANGULAR || normalizedOptions.output.client === OutputClient.ANGULAR_QUERY && normalizedOptions.output.httpClient === OutputHttpClient.ANGULAR;
	if (normalizedOptions.output.override.paramsFilter && !usesAngularGenerator) throw new Error(styleText("red", `\`override.paramsFilter\` is only supported by the Angular generator (the \`angular\` client, or \`angular-query\` with \`httpClient: 'angular'\`). It has no effect for other clients — use \`override.paramsSerializer\` instead.`));
	if (!usesAngularGenerator) {
		const offendingOperation = Object.entries(normalizedOptions.output.override.operations).find(([, opOverride]) => opOverride?.paramsFilter)?.[0];
		if (offendingOperation) throw new Error(styleText("red", `\`override.operations["${offendingOperation}"].paramsFilter\` is only supported by the Angular generator (the \`angular\` client, or \`angular-query\` with \`httpClient: 'angular'\`). It has no effect for other clients — use \`override.paramsSerializer\` instead.`));
		const offendingTag = Object.entries(normalizedOptions.output.override.tags).find(([, tagOverride]) => tagOverride?.paramsFilter)?.[0];
		if (offendingTag) throw new Error(styleText("red", `\`override.tags["${offendingTag}"].paramsFilter\` is only supported by the Angular generator (the \`angular\` client, or \`angular-query\` with \`httpClient: 'angular'\`). It has no effect for other clients — use \`override.paramsSerializer\` instead.`));
	}
	if (normalizedOptions.output.httpClient === OutputHttpClient.FETCH && normalizedOptions.output.optionsParamRequired && normalizedOptions.output.override.requestOptions !== false) logger.warn(`With \`httpClient: 'fetch'\`, \`optionsParamRequired: true\` cannot make the generated \`options\` parameter required. The fetch \`options\` parameter remains optional with type \`RequestInit\` (\`optionsParamRequired\` may still affect other generated parameters). Set \`httpClient: 'axios'\` to make the \`options\` parameter required.`);
	return normalizedOptions;
}
function normalizeMutator(workspace, mutator) {
	if (isObject(mutator)) {
		const m = mutator;
		if (!m.path) throw new Error(styleText("red", `Mutator requires a path.`));
		const resolvedPath = looksLikePackageSpecifier(m.path) ? resolvePackageSpecifier(workspace, m.path) : void 0;
		return {
			path: !!resolvedPath || isPackageSpecifierCandidate(workspace, m.path) ? m.path : path.resolve(workspace, m.path),
			...resolvedPath ? { resolvedPath } : {},
			name: m.name,
			default: m.default ?? !m.name,
			alias: m.alias,
			external: m.external,
			extension: m.extension,
			useHooks: m.useHooks,
			inferred: m.inferred
		};
	}
	if (isString(mutator)) {
		const resolvedPath = looksLikePackageSpecifier(mutator) ? resolvePackageSpecifier(workspace, mutator) : void 0;
		return {
			path: !!resolvedPath || isPackageSpecifierCandidate(workspace, mutator) ? mutator : path.resolve(workspace, mutator),
			...resolvedPath ? { resolvedPath } : {},
			default: true
		};
	}
}
async function resolveFirstValidTarget(targets, workspace, parserOptions) {
	for (const target of targets) {
		if (isUrl(target)) {
			try {
				const headers = getHeadersForUrl(target, parserOptions?.headers);
				const headResponse = await fetchWithTimeout(target, {
					method: "HEAD",
					headers
				});
				if (headResponse.ok) return target;
				if (headResponse.status === 405 || headResponse.status === 501) {
					if ((await fetchWithTimeout(target, {
						method: "GET",
						headers
					})).ok) return target;
				}
			} catch {
				continue;
			}
			continue;
		}
		const resolvedTarget = normalizePath(target, workspace);
		try {
			await access(resolvedTarget);
			return resolvedTarget;
		} catch {
			continue;
		}
	}
	throw new Error(styleText("red", `None of the input targets could be resolved:\n${targets.map((target) => `  - ${target}`).join("\n")}`));
}
function getHeadersForUrl(url, headersConfig) {
	if (!headersConfig) return {};
	const { hostname } = new URL(url);
	const matchedHeaders = {};
	for (const headerEntry of headersConfig) if (headerEntry.domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) Object.assign(matchedHeaders, headerEntry.headers);
	return matchedHeaders;
}
async function fetchWithTimeout(target, init) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => {
		controller.abort();
	}, INPUT_TARGET_FETCH_TIMEOUT_MS);
	try {
		return await fetch(target, {
			...init,
			signal: controller.signal
		});
	} finally {
		clearTimeout(timeoutId);
	}
}
function normalizeInputTarget(target, workspace) {
	if (typeof target === "string") return isUrl(target) ? target : normalizePath(target, workspace);
	return target;
}
function normalizePathOrUrl(path, workspace) {
	if (isString(path) && !isUrl(path)) return normalizePath(path, workspace);
	return path;
}
function normalizePath(path$2, workspace) {
	if (!isString(path$2)) return path$2;
	return path.resolve(workspace, path$2);
}
const unsupportedZodKeys = [
	"version",
	"variant",
	"dateTimeOptions",
	"timeOptions",
	"generateEachHttpStatus",
	"generateReusableSchemas",
	"generateMeta",
	"generateDiscriminatedUnion",
	"exactOptional"
];
const supportedZodKeysLabel = `${operationZodOverrideKeys.slice(0, -1).join(", ")}, and ${operationZodOverrideKeys.at(-1)}`;
function normalizeOperationsAndTags(operationsOrTags, workspace, global, source) {
	return Object.fromEntries(Object.entries(operationsOrTags).map(([key, { transformer, mutator, formData, formUrlEncoded, paramsSerializer, paramsFilter, query, angular, zod, effect, ...rest }]) => {
		const unsupportedOperationZodKeys = zod && unsupportedZodKeys.filter((unsupportedKey) => zod[unsupportedKey] !== void 0);
		if (unsupportedOperationZodKeys && unsupportedOperationZodKeys.length) {
			const fieldLabel = unsupportedOperationZodKeys.length === 1 ? "field" : "fields";
			const unsupportedFields = unsupportedOperationZodKeys.map((unsupportedKey) => `zod.${unsupportedKey}`).join(", ");
			logger.warn(`override.${source}.${key}.zod only supports ${supportedZodKeysLabel}. Ignoring unsupported ${fieldLabel}: ${unsupportedFields}.`);
		}
		const hasSupportedOperationZodConfig = !!zod && operationZodOverrideKeys.some((supportedKey) => zod[supportedKey] !== void 0);
		if (angular?.baseUrl) logger.warn(`override.${source}.${key}.angular.baseUrl is not supported — \`baseUrl\` is an output-level concern and is configured via \`override.angular.baseUrl\`. Ignoring.`);
		return [key, {
			...rest,
			...angular ? { angular: {
				provideIn: angular.provideIn ?? "root",
				client: angular.retrievalClient ?? angular.client ?? "httpClient",
				runtimeValidation: normalizeAngularRuntimeValidation(angular.runtimeValidation),
				queryObjectSerialization: angular.queryObjectSerialization ?? "spec",
				...angular.httpResource ? { httpResource: angular.httpResource } : {}
			} } : {},
			...query ? { query: normalizeQueryOptions(query, workspace, global.query) } : {},
			...hasSupportedOperationZodConfig && zod ? { zod: {
				strict: {
					param: zod.strict?.param ?? false,
					query: zod.strict?.query ?? false,
					header: zod.strict?.header ?? false,
					body: zod.strict?.body ?? false,
					response: zod.strict?.response ?? false
				},
				generate: {
					param: zod.generate?.param ?? true,
					query: zod.generate?.query ?? true,
					header: zod.generate?.header ?? true,
					body: zod.generate?.body ?? true,
					response: zod.generate?.response ?? true
				},
				coerce: {
					param: zod.coerce?.param ?? false,
					query: zod.coerce?.query ?? false,
					header: zod.coerce?.header ?? false,
					body: zod.coerce?.body ?? false,
					response: zod.coerce?.response ?? false
				},
				preprocess: {
					...zod.preprocess?.param ? { param: normalizeMutator(workspace, zod.preprocess.param) } : {},
					...zod.preprocess?.query ? { query: normalizeMutator(workspace, zod.preprocess.query) } : {},
					...zod.preprocess?.header ? { header: normalizeMutator(workspace, zod.preprocess.header) } : {},
					...zod.preprocess?.body ? { body: normalizeMutator(workspace, zod.preprocess.body) } : {},
					...zod.preprocess?.response ? { response: normalizeMutator(workspace, zod.preprocess.response) } : {}
				},
				...zod.params ? { params: normalizeMutator(workspace, zod.params) } : {},
				useBrandedTypes: zod.useBrandedTypes ?? false,
				generateCompanionTypes: zod.generateCompanionTypes ?? false
			} } : {},
			...effect ? { effect: normalizeEffectOptions(effect) } : {},
			...transformer ? { transformer: normalizePath(transformer, workspace) } : {},
			...mutator ? { mutator: normalizeMutator(workspace, mutator) } : {},
			...formData === void 0 ? {} : { formData: createFormData(workspace, formData) },
			...formUrlEncoded ? { formUrlEncoded: isBoolean(formUrlEncoded) ? formUrlEncoded : normalizeMutator(workspace, formUrlEncoded) } : {},
			...paramsSerializer ? { paramsSerializer: normalizeMutator(workspace, paramsSerializer) } : {},
			...paramsFilter ? { paramsFilter: normalizeMutator(workspace, paramsFilter) } : {}
		}];
	}));
}
function normalizeOutputMode(mode) {
	if (!mode) return OutputMode.SINGLE;
	if (!Object.values(OutputMode).includes(mode)) {
		logger.warn(`Unknown provided mode => ${mode}`);
		return OutputMode.SINGLE;
	}
	return mode;
}
function normalizeHooks(hooks) {
	const keys = Object.keys(hooks);
	const result = {};
	for (const key of keys) if (isString(hooks[key])) result[key] = [hooks[key]];
	else if (Array.isArray(hooks[key])) result[key] = hooks[key];
	else if (isFunction(hooks[key])) result[key] = [hooks[key]];
	else if (isObject(hooks[key])) result[key] = [hooks[key]];
	return result;
}
function normalizeHonoOptions(hono = {}, workspace) {
	return {
		...hono.handlers ? { handlers: path.resolve(workspace, hono.handlers) } : {},
		handlerGenerationStrategy: hono.handlerGenerationStrategy ?? "smart",
		compositeRoute: hono.compositeRoute ? path.resolve(workspace, hono.compositeRoute) : "",
		validator: hono.validator ?? true,
		validatorOutputPath: hono.validatorOutputPath ? path.resolve(workspace, hono.validatorOutputPath) : ""
	};
}
function normalizeMcpModuleOptions(module, workspace) {
	return {
		path: path.resolve(workspace, module.path),
		name: module.name,
		default: module.default ?? !module.name
	};
}
function normalizeMcpOptions(mcp = {}, workspace) {
	return {
		...mcp.server && { server: normalizeMcpModuleOptions(mcp.server, workspace) },
		...mcp.handler && { handler: normalizeMcpModuleOptions(mcp.handler, workspace) }
	};
}
function normalizeJSDocOptions(jsdoc = {}) {
	return { ...jsdoc };
}
function normalizeQueryOptions(queryOptions = {}, outputWorkspace, globalOptions = {}) {
	if (queryOptions.options) logger.warn("Using query options is deprecated and will be removed in a future major release. Please use queryOptions or mutationOptions instead.");
	if (!isNullish(queryOptions.shouldExportQueryKey)) logger.warn("shouldExportQueryKey is deprecated and will be removed in a future major release. Please use shouldExportKeys instead, which also gates the mutation key getters.");
	const shouldExportKeys = queryOptions.shouldExportKeys ?? queryOptions.shouldExportQueryKey;
	return {
		...isNullish(queryOptions.usePrefetch) ? {} : { usePrefetch: queryOptions.usePrefetch },
		...isNullish(queryOptions.useInvalidate) ? {} : { useInvalidate: queryOptions.useInvalidate },
		...isNullish(queryOptions.useSetQueryData) ? {} : { useSetQueryData: queryOptions.useSetQueryData },
		...isNullish(queryOptions.useGetQueryData) ? {} : { useGetQueryData: queryOptions.useGetQueryData },
		...isNullish(queryOptions.useSkipToken) ? {} : { useSkipToken: queryOptions.useSkipToken },
		...isNullish(queryOptions.useQuery) ? {} : { useQuery: queryOptions.useQuery },
		...isNullish(queryOptions.useSuspenseQuery) ? {} : { useSuspenseQuery: queryOptions.useSuspenseQuery },
		...isNullish(queryOptions.useMutation) ? {} : { useMutation: queryOptions.useMutation },
		...isNullish(queryOptions.useInfinite) ? {} : { useInfinite: queryOptions.useInfinite },
		...isNullish(queryOptions.useSuspenseInfiniteQuery) ? {} : { useSuspenseInfiniteQuery: queryOptions.useSuspenseInfiniteQuery },
		...queryOptions.useInfiniteQueryParam ? { useInfiniteQueryParam: queryOptions.useInfiniteQueryParam } : {},
		...queryOptions.useInfiniteQueryParamLocation ? { useInfiniteQueryParamLocation: queryOptions.useInfiniteQueryParamLocation } : {},
		...queryOptions.options ? { options: queryOptions.options } : {},
		...globalOptions.queryKey ? { queryKey: globalOptions.queryKey } : {},
		...queryOptions.queryKey ? { queryKey: normalizeMutator(outputWorkspace, queryOptions.queryKey) } : {},
		...globalOptions.queryOptions ? { queryOptions: globalOptions.queryOptions } : {},
		...queryOptions.queryOptions ? { queryOptions: normalizeMutator(outputWorkspace, queryOptions.queryOptions) } : {},
		...globalOptions.mutationOptions ? { mutationOptions: globalOptions.mutationOptions } : {},
		...queryOptions.mutationOptions ? { mutationOptions: normalizeMutator(outputWorkspace, queryOptions.mutationOptions) } : {},
		...isNullish(globalOptions.shouldExportKeys) ? {} : { shouldExportKeys: globalOptions.shouldExportKeys },
		...isNullish(shouldExportKeys) ? {} : { shouldExportKeys },
		...isNullish(globalOptions.shouldFilterQueryKey) ? {} : { shouldFilterQueryKey: globalOptions.shouldFilterQueryKey },
		...isNullish(queryOptions.shouldFilterQueryKey) ? {} : { shouldFilterQueryKey: queryOptions.shouldFilterQueryKey },
		...isNullish(globalOptions.queryKeyFilter) ? {} : { queryKeyFilter: globalOptions.queryKeyFilter },
		...isNullish(queryOptions.queryKeyFilter) ? {} : { queryKeyFilter: queryOptions.queryKeyFilter },
		...isNullish(globalOptions.shouldExportHttpClient) ? {} : { shouldExportHttpClient: globalOptions.shouldExportHttpClient },
		...isNullish(queryOptions.shouldExportHttpClient) ? {} : { shouldExportHttpClient: queryOptions.shouldExportHttpClient },
		...isNullish(globalOptions.shouldExportMutatorHooks) ? {} : { shouldExportMutatorHooks: globalOptions.shouldExportMutatorHooks },
		...isNullish(queryOptions.shouldExportMutatorHooks) ? {} : { shouldExportMutatorHooks: queryOptions.shouldExportMutatorHooks },
		...isNullish(globalOptions.shouldSplitQueryKey) ? {} : { shouldSplitQueryKey: globalOptions.shouldSplitQueryKey },
		...isNullish(queryOptions.shouldSplitQueryKey) ? {} : { shouldSplitQueryKey: queryOptions.shouldSplitQueryKey },
		...isNullish(globalOptions.signal) ? {} : { signal: globalOptions.signal },
		...isNullish(globalOptions.useOperationIdAsQueryKey) ? {} : { useOperationIdAsQueryKey: globalOptions.useOperationIdAsQueryKey },
		...isNullish(queryOptions.useOperationIdAsQueryKey) ? {} : { useOperationIdAsQueryKey: queryOptions.useOperationIdAsQueryKey },
		...isNullish(globalOptions.signal) ? {} : { signal: globalOptions.signal },
		...isNullish(queryOptions.signal) ? {} : { signal: queryOptions.signal },
		...isNullish(globalOptions.version) ? {} : { version: globalOptions.version },
		...isNullish(queryOptions.version) ? {} : { version: queryOptions.version },
		...queryOptions.mutationInvalidates ? { mutationInvalidates: queryOptions.mutationInvalidates } : {},
		runtimeValidation: isNullish(queryOptions.runtimeValidation) ? globalOptions.runtimeValidation ?? normalizeRuntimeValidation(void 0) : normalizeRuntimeValidation(queryOptions.runtimeValidation)
	};
}
function getDefaultFilesHeader({ title, description, version } = {}) {
	return [
		`Generated by ${name} 🍺`,
		`Do not edit manually.`,
		...title ? [title] : [],
		...description ? [description] : [],
		...version ? [`OpenAPI spec version: ${version}`] : []
	];
}
//#endregion
export { normalizeOptions as a, name as c, namesAFile as i, version as l, defineTransformer as n, logger as o, getHeadersForUrl as r, description as s, defineConfig as t };

//# sourceMappingURL=options-B6dinSa6.mjs.map