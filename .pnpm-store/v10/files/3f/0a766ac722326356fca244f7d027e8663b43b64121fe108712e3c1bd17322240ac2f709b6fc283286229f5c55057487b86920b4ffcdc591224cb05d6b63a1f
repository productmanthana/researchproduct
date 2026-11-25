import { t as __exportAll } from "./rolldown-runtime-8H4AJuhK.mjs";
import { createRequire } from "node:module";
import { isBooleanJsonSchema, isDereferenced, isMultiTypeSchema, isNullSchema, isStringSchema, isUntypedSchema } from "@scalar/openapi-types/helpers";
import { keyword } from "esutils";
import path from "node:path";
import fs, { existsSync, readFileSync } from "node:fs";
import { escapePath, glob } from "tinyglobby";
import { compare } from "compare-versions";
import { pathToFileURL } from "node:url";
import { createJiti } from "jiti";
import { AsyncLocalStorage } from "node:async_hooks";
import { styleText } from "node:util";
import jsesc from "jsesc";
import { createHash } from "node:crypto";
import { Parser } from "acorn";
import { build } from "esbuild";
//#region src/types.ts
const SupportedFormatter = {
	PRETTIER: "prettier",
	BIOME: "biome",
	OXFMT: "oxfmt"
};
const PropertySortOrder = {
	ALPHABETICAL: "Alphabetical",
	SPECIFICATION: "Specification"
};
const NamingConvention = {
	CAMEL_CASE: "camelCase",
	PASCAL_CASE: "PascalCase",
	SNAKE_CASE: "snake_case",
	KEBAB_CASE: "kebab-case"
};
const EnumGeneration = {
	CONST: "const",
	ENUM: "enum",
	UNION: "union"
};
const OutputClient = {
	ANGULAR: "angular",
	ANGULAR_QUERY: "angular-query",
	AXIOS: "axios",
	AXIOS_FUNCTIONS: "axios-functions",
	REACT_QUERY: "react-query",
	SOLID_START: "solid-start",
	SOLID_QUERY: "solid-query",
	SVELTE_QUERY: "svelte-query",
	VUE_QUERY: "vue-query",
	SWR: "swr",
	PINIA_COLADA: "pinia-colada",
	ZOD: "zod",
	EFFECT: "effect",
	HONO: "hono",
	FETCH: "fetch",
	MCP: "mcp"
};
const OutputHttpClient = {
	AXIOS: "axios",
	FETCH: "fetch",
	ANGULAR: "angular"
};
const OutputMode = {
	SINGLE: "single",
	SPLIT: "split",
	TAGS: "tags",
	TAGS_SPLIT: "tags-split",
	TAGS_OPERATIONS: "tags-operations",
	TAGS_OPERATIONS_SPLIT: "tags-operations-split"
};
const OutputMockType = {
	MSW: "msw",
	FAKER: "faker"
};
const FormDataArrayHandling = {
	SERIALIZE: "serialize",
	EXPLODE: "explode",
	SERIALIZE_WITH_BRACKETS: "serialize-with-brackets"
};
/**
* Runtime source of truth for the `override.zod` keys that may also be set per
* operation or tag. `NormalizedOperationZodOptions`, the unsupported-key
* warning, and the operation/tag normalization in `orval` are all derived from
* this array; the `satisfies` clause plus the `Exclude` assertion below force
* it to stay in lockstep with `OperationZodOptions`.
*/
const operationZodOverrideKeys = [
	"strict",
	"generate",
	"coerce",
	"preprocess",
	"params",
	"useBrandedTypes",
	"generateCompanionTypes"
];
const Verbs = {
	GET: "get",
	PUT: "put",
	POST: "post",
	DELETE: "delete",
	OPTIONS: "options",
	HEAD: "head",
	PATCH: "patch",
	QUERY: "query"
};
/**
* Canonical tag name used for the generated bucket that collects untagged operations.
*/
const DefaultTag = "default";
const LOG_LEVELS = [
	"error",
	"warn",
	"info",
	"verbose",
	"debug"
];
const GetterPropType = {
	PARAM: "param",
	NAMED_PATH_PARAMS: "namedPathParams",
	BODY: "body",
	QUERY_PARAM: "queryParam",
	HEADER: "header"
};
const SchemaType = {
	integer: "integer",
	number: "number",
	string: "string",
	boolean: "boolean",
	object: "object",
	null: "null",
	array: "array",
	enum: "enum",
	unknown: "unknown"
};
var ErrorWithTag = class extends Error {
	tag;
	constructor(message, tag, options) {
		super(message, options);
		this.tag = tag;
	}
};
//#endregion
//#region src/constants.ts
const generalJSTypes = [
	"number",
	"string",
	"null",
	"unknown",
	"undefined",
	"object",
	"blob"
];
const generalJSTypesWithArray = generalJSTypes.flatMap((type) => [
	type,
	`Array<${type}>`,
	`${type}[]`
]);
const VERBS_WITH_BODY = [
	Verbs.POST,
	Verbs.PUT,
	Verbs.PATCH,
	Verbs.DELETE,
	Verbs.QUERY
];
/**
* Matches a `${thing}` tag in template-literal source.
*
* @deprecated Unsound on generated routes: it cannot tell an interpolation
* from escaped static text, so it rewrites the `\${x}` produced for a spec
* path like `/foo${x}` and stops at the first `}` inside an expression.
* Use {@link parseTemplateLiteral} / {@link mapTemplateExpressions} instead
* (#3703). Kept for backwards compatibility with custom client builders.
*/
const TEMPLATE_TAG_REGEX = /\${(.+?)}/g;
//#endregion
//#region src/utils/object-schema.ts
/**
* True for an inline value, including JSON Schema booleans (`true` / `false`).
*
* `isDereferenced` is false for booleans because they are not objects, so
* `!isDereferenced(true)` looks like a `$ref`. A boolean schema is inline:
* `true` admits every instance and `false` admits none.
*/
function isInlineSchema(value) {
	return isBooleanJsonSchema(value) || isDereferenced(value);
}
/**
* JSON Schema boolean schemas as objects: `true` ≡ `{}`, `false` ≡ `{ not: {} }`.
*/
function toObjectSchema(schema) {
	if (!isBooleanJsonSchema(schema)) return schema;
	return schema ? {} : { not: {} };
}
//#endregion
//#region src/utils/assertion.ts
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
function isDynamicReference(obj) {
	return !isNullish(obj) && Object.hasOwn(obj, "$dynamicRef") && typeof obj.$dynamicRef === "string";
}
/**
* Returns `true` when `pathValue` has no file extension and is treated as a
* directory path.
*
* @param pathValue - Path string to inspect.
*/
function isDirectory(pathValue) {
	return !path.extname(pathValue);
}
/**
* Type guard for plain objects created with `{}` or `new Object()`.
*
* Excludes `null`, arrays, dates, and other non-plain object values.
*
* @param x - Value to test.
*/
function isObject(x) {
	return Object.prototype.toString.call(x) === "[object Object]";
}
/**
* Type guard for ES module namespace objects.
*
* @param x - Value to test.
*/
function isModule(x) {
	return Object.prototype.toString.call(x) === "[object Module]";
}
/**
* Type guard for integer numbers and numeric strings.
*
* Accepts finite integers (`42`) and strings that match `/^-?\d+$/`
* (`"-1"`, `"0"`). Rejects floats, empty strings, and non-numeric values.
*
* @param x - Value to test.
*/
function isNumeric(x) {
	if (typeof x === "number") return Number.isInteger(x);
	return isString(x) && /^-?\d+$/.test(x);
}
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
function isSchema(x) {
	if (!isObject(x)) return false;
	if (isString(x.type) && Object.values(SchemaType).includes(x.type)) return true;
	const combine = x.allOf ?? x.anyOf ?? x.oneOf;
	if (Array.isArray(combine)) return true;
	if (isObject(x.properties)) return true;
	return false;
}
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
function isStringLikeSchema(schema) {
	if (isStringSchema(schema)) return true;
	return isMultiTypeSchema(schema) && schema.type.includes("string") && schema.type.every((member) => member === "string" || member === "null");
}
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
function isSchemaNullable(schema) {
	if (isBooleanJsonSchema(schema)) return schema;
	if (isNullSchema(schema)) return true;
	if (isMultiTypeSchema(schema) && schema.type.includes("null")) return true;
	if (isUntypedSchema(schema) && Array.isArray(schema.enum) && schema.enum.includes(null) && !someAllOfBranchRejectsNull(schema.allOf)) return true;
	return [...Array.isArray(schema.oneOf) ? schema.oneOf : [], ...Array.isArray(schema.anyOf) ? schema.anyOf : []].some((variant) => {
		if (!isObject(variant) || !isInlineSchema(variant)) return false;
		return isSchemaNullable(variant);
	});
}
/**
* Whether the schema's `enum` admits only `null` — the OAS 3.0 spelling of a
* null branch (`anyOf: [{ $ref }, { enum: [null] }]`), whatever its `type`.
*/
function isNullOnlyEnum(schema) {
	if (!isObject(schema)) return false;
	const schemaEnum = schema.enum;
	return Array.isArray(schemaEnum) && schemaEnum.length > 0 && schemaEnum.every((member) => member === null);
}
/**
* Whether any member of an `allOf` rules `null` out.
*
* `allOf` is an intersection, so one branch refusing null is enough to make an
* enclosing enum's `null` member unreachable:
* `{ enum: ['a', null], allOf: [{ type: 'string' }] }` admits only `'a'`.
*
* Only a branch that *definitely* rejects null counts. A branch constraining
* nothing permits it, and a `$ref` is not resolved here, so neither is read as
* rejecting — erring toward a `| null` that was not strictly needed rather than
* dropping one the API can really return.
*
* @param allOf - Value of the enclosing schema's `allOf`, if it has one.
*/
function someAllOfBranchRejectsNull(allOf) {
	if (!Array.isArray(allOf)) return false;
	return allOf.some((branch) => {
		if (!isObject(branch) || !isInlineSchema(branch)) return false;
		const { type, enum: members } = branch;
		if (type !== void 0) {
			if (!(Array.isArray(type) ? type.includes("null") : type === "null")) return true;
		}
		return Array.isArray(members) && !members.includes(null);
	});
}
/**
* Type guard for HTTP methods defined in {@link Verbs}.
*
* @param verb - Method name to test (for example, `"get"`, `"post"`).
*/
function isVerb(verb) {
	return Object.values(Verbs).includes(verb);
}
/**
* Returns `true` when `str` is a valid absolute URL with an `http:` or
* `https:` protocol.
*
* Empty or whitespace-only strings are rejected.
*
* @param str - URL string to validate.
*/
function isUrl(str) {
	if (!str.trim()) return false;
	try {
		const url = new URL(str);
		return ["http:", "https:"].includes(url.protocol);
	} catch {
		return false;
	}
}
/**
* Type guard for the MSW mock generator. Use to narrow a
* `GlobalMockOptions | ClientMockBuilder` value to `MswMockOptions`.
*
* @param mock - Mock configuration or builder to test.
*/
function isMswMock(mock) {
	return !isFunction(mock) && mock.type === OutputMockType.MSW;
}
function isString(x) {
	return typeof x === "string";
}
/** A number other than `NaN`. */
function isNumber(x) {
	return typeof x === "number" && !Number.isNaN(x);
}
function isBoolean(x) {
	return typeof x === "boolean";
}
/**
* Narrows `x` to the function members of its own type (all of it when nothing
* more precise is known), the way remeda's guard did.
*/
function isFunction(x) {
	return typeof x === "function";
}
function isNullish(x) {
	return x === null || x === void 0;
}
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
function assertSafeNumericConstraint(value, label) {
	if (!isNumber(value) || !Number.isFinite(value)) throw new Error(`orval: refusing to generate code for an OpenAPI document whose "${label}" constraint is not a finite number (got ${String(value)}). This value would otherwise be emitted verbatim into generated source.`);
	return value;
}
/**
* {@link assertSafeNumericConstraint} for an optional constraint.
*
* Passes `undefined` straight through so callers keep "absent" distinct from
* "present but not a number", which must still be rejected.
*
* @param value Constraint value taken from the document, possibly absent
* @param label Field name, used in the error message
*/
function safeNumericConstraint(value, label) {
	return value === void 0 ? void 0 : assertSafeNumericConstraint(value, label);
}
//#endregion
//#region src/utils/async-reduce.ts
async function asyncReduce(array, reducer, initValue) {
	let accumulate = initValue === null || initValue === Object(initValue) && !isFunction(initValue) ? Object.create(initValue) : initValue;
	for (const item of array) accumulate = await reducer(accumulate, item);
	return accumulate;
}
//#endregion
//#region src/utils/file.ts
/**
* Removes the last extension from a path. A dot in a directory name stays,
* which is why `\` counts as a separator too: without it, `.\v1.0\pets` would
* lose everything after the version dot.
*/
function pathWithoutExtension(filePath) {
	return filePath.replace(/\.[^\\/.]+$/, "");
}
/**
* Removes a configured file extension, which may have several parts. Stripping
* only the last segment would leave `pets.generated.ts` as `pets.generated`,
* and re-adding the extension then gives `pets.generated.generated`. Falls
* back to the last segment for a path that does not carry the full extension.
*/
function stripFileExtension(filePath, fileExtension) {
	return filePath.endsWith(fileExtension) ? filePath.slice(0, -fileExtension.length) : pathWithoutExtension(filePath);
}
function getFileInfo(target = "", { backupFilename = "filename", extension = ".ts" } = {}) {
	const isDir = isDirectory(target);
	const filePath = isDir ? path.join(target, backupFilename + extension) : target;
	const dir = path.dirname(filePath);
	const filename = path.basename(filePath, extension.startsWith(".") ? extension : `.${extension}`);
	return {
		path: filePath,
		pathWithoutExtension: pathWithoutExtension(filePath),
		extension,
		isDirectory: isDir,
		dirname: dir,
		filename
	};
}
async function removeFilesAndEmptyFolders(patterns, dir, { followSymbolicLinks = true } = {}) {
	const files = await glob(patterns, {
		cwd: dir,
		absolute: true,
		followSymbolicLinks
	});
	await Promise.all(files.map((file) => fs.promises.unlink(file)));
	const sortedDirectories = (await glob(["**/*"], {
		cwd: dir,
		absolute: true,
		onlyDirectories: true,
		followSymbolicLinks
	})).toSorted((a, b) => {
		const depthA = a.split("/").length;
		return b.split("/").length - depthA;
	});
	for (const directory of sortedDirectories) try {
		if ((await fs.promises.readdir(directory)).length === 0) await fs.promises.rmdir(directory);
	} catch {}
}
//#endregion
//#region src/utils/extension.ts
function getExtension(path) {
	return path.toLowerCase().includes(".yaml") || path.toLowerCase().includes(".yml") ? "yaml" : "json";
}
//#endregion
//#region src/utils/path.ts
var path_exports = /* @__PURE__ */ __exportAll({
	getRelativeImportPath: () => getRelativeImportPath,
	getSchemaFileName: () => getSchemaFileName,
	isAbsolute: () => isAbsolute,
	join: () => join,
	joinSafe: () => joinSafe,
	normalizeSafe: () => normalizeSafe,
	relativeSafe: () => relativeSafe,
	resolve: () => resolve,
	separator: () => "/",
	toUnix: () => toUnix
});
function isAbsolute(value) {
	return path.isAbsolute(value);
}
function resolve(...args) {
	return toUnix(path.resolve(...args));
}
function toUnix(value) {
	value = value.replaceAll("\\", "/");
	value = value.replaceAll(/(?<!^)\/+/g, "/");
	return value;
}
function join(...args) {
	return toUnix(path.join(...args.map((a) => toUnix(a))));
}
/**
* Behaves exactly like `path.relative(from, to)`, but keeps the first meaningful "./"
*/
function relativeSafe(from, to) {
	return normalizeSafe(`./${toUnix(path.relative(toUnix(from), toUnix(to)))}`);
}
function getSchemaFileName(path) {
	const fileName = path.slice(path.lastIndexOf("/") + 1);
	const extension = `.${getExtension(fileName)}`;
	return fileName.endsWith(extension) ? fileName.slice(0, -extension.length) : fileName;
}
function normalizeSafe(value) {
	let result;
	value = toUnix(value);
	result = toUnix(path.normalize(value));
	if (value.startsWith("./") && !result.startsWith("./") && !result.startsWith("..")) result = "./" + result;
	else if (value.startsWith("//") && !result.startsWith("//")) result = value.startsWith("//./") ? "//." + result : "/" + result;
	return result;
}
function joinSafe(...values) {
	let result = toUnix(path.join(...values.map((v) => toUnix(v))));
	if (values.length > 0) {
		const firstValue = toUnix(values[0]);
		if (firstValue.startsWith("./") && !result.startsWith("./") && !result.startsWith("..")) result = "./" + result;
		else if (firstValue.startsWith("//") && !result.startsWith("//")) result = firstValue.startsWith("//./") ? "//." + result : "/" + result;
	}
	return result;
}
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
function getRelativeImportPath(importerFilePath, exporterFilePath, includeFileExtension = false) {
	if (!path.isAbsolute(importerFilePath)) throw new Error(`'importerFilePath' is not an absolute path. "${importerFilePath}"`);
	if (!path.isAbsolute(exporterFilePath)) throw new Error(`'exporterFilePath' is not an absolute path. "${exporterFilePath}"`);
	const importerDir = path.dirname(importerFilePath);
	const relativePath = path.relative(importerDir, exporterFilePath);
	let posixPath = path.posix.join(...relativePath.split(path.sep));
	if (!posixPath.startsWith("./") && !posixPath.startsWith("../")) posixPath = `./${posixPath}`;
	if (!includeFileExtension) {
		const ext = path.extname(posixPath);
		if (ext && posixPath.endsWith(ext)) posixPath = posixPath.slice(0, -ext.length);
	}
	return posixPath;
}
//#endregion
//#region src/utils/barrel-re-exports.ts
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
function buildBarrelReExports(files, { dirname, extension, importExtension }, alreadyExported = {}) {
	const entries = files.map((file) => ({
		sharedExports: file.sharedExports,
		relativePath: relativeSafe(dirname, file.path)
	})).filter(({ relativePath }) => !relativePath.startsWith("..")).toSorted((a, b) => a.relativePath.localeCompare(b.relativePath)).map(({ sharedExports, relativePath }) => ({
		sharedExports,
		specifier: stripFileExtension(relativePath, extension) + importExtension
	}));
	const declaredNames = ({ types, values }) => /* @__PURE__ */ new Set([...types, ...values]);
	const declarationKind = ({ values }, name) => values.includes(name) ? "value" : "type";
	const declarations = /* @__PURE__ */ new Map();
	for (const { sharedExports } of entries) {
		if (!sharedExports) continue;
		for (const name of declaredNames(sharedExports)) {
			const kind = declarationKind(sharedExports, name);
			const seen = declarations.get(name);
			declarations.set(name, {
				count: (seen?.count ?? 0) + 1,
				kind: !seen || seen.kind === kind ? kind : "mixed"
			});
		}
	}
	const claimed = /* @__PURE__ */ new Set([...alreadyExported.types ?? [], ...alreadyExported.values ?? []]);
	const lines = [];
	for (const { specifier, sharedExports } of entries) {
		if (!sharedExports) continue;
		const owned = {
			type: [],
			value: []
		};
		for (const name of declaredNames(sharedExports)) {
			const declaration = declarations.get(name);
			if (!declaration || claimed.has(name)) continue;
			if (declaration.count < 2 || declaration.kind === "mixed") continue;
			claimed.add(name);
			owned[declaration.kind].push(name);
		}
		if (owned.type.length > 0) lines.push(`export type { ${owned.type.toSorted().join(", ")} } from '${specifier}';`);
		if (owned.value.length > 0) lines.push(`export { ${owned.value.toSorted().join(", ")} } from '${specifier}';`);
	}
	lines.push(...entries.map(({ specifier }) => `export * from '${specifier}';`));
	return lines;
}
//#endregion
//#region src/utils/case.ts
const SYMBOLS = String.raw`\u0020-\u0026\u0028-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E\u00A0-\u00BF\u00D7\u00F7`;
const LOWERS = String.raw`a-z\u00DF-\u00F6\u00F8-\u00FF`;
const UPPERS = String.raw`A-Z\u00C0-\u00D6\u00D8-\u00DE`;
const allUpperRe = new RegExp(`^[^${LOWERS}]+$`);
const hasSymbolRe = new RegExp(`[${SYMBOLS}]`);
const fillRe = new RegExp(`[${SYMBOLS}]+(.|$)`, "g");
const acronymRe = new RegExp(`([^${UPPERS}])([${UPPERS}]*)([${UPPERS}])(?=[^${UPPERS}]|$)`, "g");
const lower = (s, fillWith) => {
	if (allUpperRe.test(s)) s = s.toLowerCase();
	if (!hasSymbolRe.test(s)) s = s.replace(acronymRe, (_, before, acronym, caps) => `${before} ${acronym ? `${acronym} ` : ""}${caps}`);
	return s.toLowerCase().replace(fillRe, (_, next) => next ? fillWith + next : "").replaceAll("'", "");
};
const pascalMemory = /* @__PURE__ */ new Map();
function pascal(s = "") {
	const cached = pascalMemory.get(s);
	if (cached !== void 0) return cached;
	const isStartWithUnderscore = s.startsWith("_");
	const cacheKey = s;
	if (allUpperRe.test(s)) s = s.toLowerCase();
	const pascalString = (s.match(/[a-zA-Z0-9\u00C0-\u017F]+/g) ?? []).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
	const pascalWithUnderscore = isStartWithUnderscore ? `_${pascalString}` : pascalString;
	pascalMemory.set(cacheKey, pascalWithUnderscore);
	return pascalWithUnderscore;
}
function camel(s = "") {
	const isStartWithUnderscore = s.startsWith("_");
	const at = isStartWithUnderscore ? 1 : 0;
	const p = pascal(s);
	const camelString = p.charAt(at).toLowerCase() + p.slice(at + 1);
	return isStartWithUnderscore ? `_${camelString}` : camelString;
}
function snake(s = "") {
	return lower(s, "_");
}
function kebab(s = "") {
	return lower(s, "-");
}
function conventionName(name, convention) {
	let nameConventionTransform = camel;
	switch (convention) {
		case NamingConvention.PASCAL_CASE:
			nameConventionTransform = pascal;
			break;
		case NamingConvention.SNAKE_CASE:
			nameConventionTransform = snake;
			break;
		case NamingConvention.KEBAB_CASE: nameConventionTransform = kebab;
	}
	return nameConventionTransform(name);
}
//#endregion
//#region src/utils/collection.ts
/** Keeps the first occurrence of every value. */
const unique = (values) => [...new Set(values)];
/** Keeps the first item for every distinct `key(item)`. */
function uniqueBy(items, key) {
	const seen = /* @__PURE__ */ new Set();
	return items.filter((item, index, all) => {
		const k = key(item, index, all);
		if (seen.has(k)) return false;
		seen.add(k);
		return true;
	});
}
/** Keeps the first of every run of items that `isEqual` treats as the same. */
const uniqueWith = (items, isEqual) => items.filter((item, index) => items.findIndex((other, j) => j === index || isEqual(item, other)) === index);
/**
* Buckets `items` by `key(item)` in first-seen order. Only keys that occur get
* a bucket, so `get` on any other key is `undefined`.
*/
const groupBy = (items, key) => Map.groupBy(items, key);
/** The subset of `obj` at `keys`; keys absent from `obj` are left out. */
const pick = (obj, keys) => Object.fromEntries([...keys].filter((key) => Object.hasOwn(obj, key)).map((key) => [key, obj[key]]));
/** `obj` without the entries `drop` returns true for. */
const omitBy = (obj, drop) => Object.fromEntries(Object.entries(obj).filter(([key, value]) => !drop(value, key)));
/** Walks `path` into `value`; `undefined` as soon as a step is missing. */
const getAtPath = (value, path) => path.reduce((current, key) => current === null || current === void 0 ? void 0 : current[key], value);
//#endregion
//#region src/utils/compare-version.ts
const getComparableVersion = (version) => {
	const npmAliasVersion = version.match(/^npm:(?:@[^/]+\/)?[^@]+@(.+)$/)?.[1];
	if (npmAliasVersion) return npmAliasVersion;
	if (version.startsWith("npm:")) return "latest";
	return version;
};
function compareVersions(firstVersion, secondVersions, operator = ">=") {
	const comparableVersion = getComparableVersion(firstVersion);
	if (comparableVersion === "latest" || comparableVersion === "*") return true;
	if (comparableVersion.startsWith("catalog:")) return true;
	return compare(comparableVersion.replace(/(\s(.*))/, ""), secondVersions, operator);
}
//#endregion
//#region src/utils/content-type.ts
const binaryApplicationTypes = /* @__PURE__ */ new Set([
	"application/octet-stream",
	"application/pdf",
	"application/zip"
]);
/**
* Determine if a content type is binary.
* Only known binary types return true. Unknown types default to false (non-binary)
* so that schema type information is preserved rather than being overridden with Blob.
*/
function isBinaryContentType(contentType) {
	const baseType = contentType.split(";")[0].trim();
	if (baseType.startsWith("image/")) return true;
	if (baseType.startsWith("audio/")) return true;
	if (baseType.startsWith("video/")) return true;
	if (baseType.startsWith("font/")) return true;
	return binaryApplicationTypes.has(baseType);
}
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
function getFormDataFieldFileType(resolvedSchema, partContentType) {
	if (isBooleanJsonSchema(resolvedSchema) || !isStringLikeSchema(resolvedSchema)) return;
	if (resolvedSchema.contentEncoding) return;
	const contentMediaType = resolvedSchema.contentMediaType;
	const effectiveContentType = partContentType ?? contentMediaType;
	if (effectiveContentType) return isBinaryContentType(effectiveContentType) ? "binary" : "text";
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
function filterByContentType(items, filter) {
	if (!filter) return items;
	return items.filter((item) => {
		const shouldInclude = !filter.include || filter.include.includes(item.contentType);
		const shouldExclude = filter.exclude?.includes(item.contentType) ?? false;
		return shouldInclude && !shouldExclude;
	});
}
//#endregion
//#region src/utils/doc.ts
const search = String.raw`\*/`;
const replacement = String.raw`*\/`;
const regex = new RegExp(search, "g");
function trimTrailingEmptyLines(lines) {
	let lastLineIndex = lines.length - 1;
	while (lastLineIndex >= 0 && lines[lastLineIndex]?.trim() === "") lastLineIndex--;
	return lines.slice(0, lastLineIndex + 1);
}
function escapeJsDoc(value) {
	return value.replaceAll(regex, replacement);
}
function getDescriptionLines(description) {
	return trimTrailingEmptyLines((Array.isArray(description) ? description.filter((line) => !line.includes("eslint-disable")) : [description ?? ""]).flatMap((block) => block.split(/\r?\n/).map((line) => escapeJsDoc(line))));
}
function getEslintDisable(description) {
	return Array.isArray(description) ? description.find((line) => line.includes("eslint-disable")) : void 0;
}
const itemValidationKeys = [
	"minLength",
	"maxLength",
	"minimum",
	"maximum",
	"exclusiveMinimum",
	"exclusiveMaximum",
	"minItems",
	"maxItems",
	"pattern"
];
function getItemValidationDocEntries(schema, prefix = "items", visited = /* @__PURE__ */ new WeakSet()) {
	if (!schema) return [];
	if (visited.has(schema)) return [];
	visited.add(schema);
	return [...itemValidationKeys.flatMap((key) => {
		const value = schema[key];
		return value === void 0 ? [] : [{
			key: `${prefix}.${key}`,
			value
		}];
	}), ...getItemValidationDocEntries(schema.items, `${prefix}.items`, visited)];
}
function toJsDocEntry(key, value) {
	if (value === void 0 || value === false || value === "") return [];
	return [{
		key,
		value
	}];
}
function getSchemaDocEntries(schema, itemValidationDocEntries, isNullable) {
	const { deprecated, summary, minLength, maxLength, minimum, maximum, exclusiveMinimum, exclusiveMaximum, minItems, maxItems, pattern } = schema;
	return [
		...toJsDocEntry("deprecated", deprecated),
		...toJsDocEntry("summary", summary),
		...toJsDocEntry("minLength", minLength),
		...toJsDocEntry("maxLength", maxLength),
		...toJsDocEntry("minimum", minimum),
		...toJsDocEntry("maximum", maximum),
		...toJsDocEntry("exclusiveMinimum", exclusiveMinimum),
		...toJsDocEntry("exclusiveMaximum", exclusiveMaximum),
		...toJsDocEntry("minItems", minItems),
		...toJsDocEntry("maxItems", maxItems),
		...toJsDocEntry("nullable", isNullable),
		...toJsDocEntry("pattern", pattern),
		...itemValidationDocEntries.flatMap(({ key, value }) => toJsDocEntry(key, value))
	];
}
function formatJsDocEntry({ key, value }) {
	if (value === true) return `@${key}`;
	return `@${key} ${escapeJsDoc(value.toString())}`;
}
function renderJsDocBlock(lines, tryOneLine = false) {
	if (lines.length === 0) return "";
	if (lines.length === 1 && tryOneLine) return `/** ${lines[0]} */\n`;
	const linePrefix = `${tryOneLine ? "  " : ""} *`;
	const closingPrefix = ` ${tryOneLine ? "  " : ""}`;
	return `/**\n${lines.map((line) => `${linePrefix}${line ? ` ${line}` : ""}`).join("\n")}\n${closingPrefix}*/\n`;
}
function jsDoc(schema, tryOneLine = false, context) {
	if (isBooleanJsonSchema(schema)) return "";
	const jsDocSchema = schema;
	if (context?.output.override.jsDoc) {
		const { filter } = context.output.override.jsDoc;
		if (filter) return keyValuePairsToJsDoc(filter(jsDocSchema));
	}
	const isNullable = jsDocSchema.type === "null" || Array.isArray(jsDocSchema.type) && jsDocSchema.type.includes("null");
	const itemValidationDocEntries = getItemValidationDocEntries(jsDocSchema.items);
	const lines = [...getDescriptionLines(jsDocSchema.description), ...getSchemaDocEntries(jsDocSchema, itemValidationDocEntries, isNullable).map((entry) => formatJsDocEntry(entry))];
	const eslintDisable = getEslintDisable(jsDocSchema.description);
	const doc = renderJsDocBlock(lines, tryOneLine);
	return `${eslintDisable ? `/* ${escapeJsDoc(eslintDisable)} */\n` : ""}${doc}`;
}
function keyValuePairsToJsDoc(keyValues) {
	return renderJsDocBlock(keyValues.map(({ key, value }) => `@${key} ${value}`));
}
//#endregion
//#region src/utils/dynamic-import.ts
const TS_MODULE_EXTENSIONS = /* @__PURE__ */ new Set([
	".ts",
	".mts",
	".cts",
	".tsx",
	".jsx"
]);
async function dynamicImport(toImport, from = process.cwd(), takeDefault = true) {
	if (!toImport) return toImport;
	try {
		if (isString(toImport)) {
			const filePath = path.resolve(from, toImport);
			const extension = path.extname(filePath);
			if (TS_MODULE_EXTENSIONS.has(extension)) {
				const data = await createJiti(from, { interopDefault: true }).import(filePath);
				if (takeDefault && (isObject(data) || isModule(data)) && data.default) return data.default;
				return data;
			}
			const fileUrl = pathToFileURL(filePath);
			const data = extension === ".json" ? await import(fileUrl.href, { with: { type: "json" } }) : await import(fileUrl.href);
			if (takeDefault && (isObject(data) || isModule(data)) && data.default) return data.default;
			return data;
		}
		return toImport;
	} catch (error) {
		throw new Error(`Oups... 🍻. Path: ${String(toImport)} => ${String(error)}`, { cause: error });
	}
}
//#endregion
//#region src/utils/file-extensions.ts
/**
* Returns the filename suffix for a given mock entry's output file. For
* example a `{ type: OutputMockType.MSW }` entry produces `<file>.msw.ts` and
* a `{ type: OutputMockType.FAKER }` entry produces `<file>.faker.ts`.
*
* Custom `ClientMockBuilder` functions default to the `msw` suffix to preserve
* the historical behavior.
*/
function getMockFileExtensionByTypeName(mock) {
	if (isFunction(mock)) return OutputMockType.MSW;
	return mock.type;
}
//#endregion
//#region src/utils/get-property-safe.ts
/**
* Type safe way to get arbitrary property from an object.
*
* @param obj - The object from which to retrieve the property.
* @param propertyName - The name of the property to retrieve.
* @returns Object with `hasProperty: true` and `value` of the property if it exists; otherwise `hasProperty: false` and undefined.
*
* @remarks Until TypeScript adds type-narrowing for Object.hasOwn we have to use this workaround
*/
function getPropertySafe(obj, propertyName) {
	if (Object.hasOwn(obj, propertyName)) return {
		hasProperty: true,
		value: obj[propertyName]
	};
	return {
		hasProperty: false,
		value: void 0
	};
}
//#endregion
//#region src/utils/http-status.ts
const WILDCARD_STATUS_CODE_REGEX = /^[1-5]XX$/i;
const EXACT_STATUS_CODE_REGEX = /^[1-5]\d{2}$/;
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
const assertSafeResponseStatusKey = (key) => {
	if (WILDCARD_STATUS_CODE_REGEX.test(key) || EXACT_STATUS_CODE_REGEX.test(key)) return key;
	throw new Error(`orval: refusing to generate code for an OpenAPI response key that is not a status code (got "${key}"). This value would otherwise be emitted verbatim into generated source.`);
};
const getStatusCodeType = (key, responseKeys = []) => {
	if (WILDCARD_STATUS_CODE_REGEX.test(key)) {
		const wildcardType = `HTTPStatusCode${key[0]}xx`;
		const exactStatuses = [...new Set(responseKeys.filter((responseKey) => EXACT_STATUS_CODE_REGEX.test(responseKey) && responseKey[0] === key[0]))];
		return exactStatuses.length ? `Exclude<${wildcardType}, ${exactStatuses.join(" | ")}>` : wildcardType;
	}
	return assertSafeResponseStatusKey(key);
};
const HTTP_STATUS_CODE_SHARED_TYPES = [
	{
		name: "HTTPStatusCode1xx",
		exported: true,
		code: "type HTTPStatusCode1xx = 100 | 101 | 102 | 103;"
	},
	{
		name: "HTTPStatusCode2xx",
		exported: true,
		code: "type HTTPStatusCode2xx = 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207;"
	},
	{
		name: "HTTPStatusCode3xx",
		exported: true,
		code: "type HTTPStatusCode3xx = 300 | 301 | 302 | 303 | 304 | 305 | 307 | 308;"
	},
	{
		name: "HTTPStatusCode4xx",
		exported: true,
		code: "type HTTPStatusCode4xx = 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 419 | 420 | 421 | 422 | 423 | 424 | 426 | 428 | 429 | 431 | 451;"
	},
	{
		name: "HTTPStatusCode5xx",
		exported: true,
		code: "type HTTPStatusCode5xx = 500 | 501 | 502 | 503 | 504 | 505 | 507 | 511;"
	},
	{
		name: "HTTPStatusCodes",
		exported: true,
		code: "type HTTPStatusCodes = HTTPStatusCode1xx | HTTPStatusCode2xx | HTTPStatusCode3xx | HTTPStatusCode4xx | HTTPStatusCode5xx;"
	}
];
const needsHttpStatusCodeTypes = (implementation) => /HTTPStatusCode[1-5]xx|<HTTPStatusCodes,/.test(implementation);
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
const getResponseStatusCondition = ({ key, declaredKeys, accessor }) => {
	const exactStatuses = declaredKeys.filter((declared) => EXACT_STATUS_CODE_REGEX.test(declared));
	const conditionFor = (statusKey) => {
		if (WILDCARD_STATUS_CODE_REGEX.test(statusKey)) {
			const start = Number(statusKey[0]) * 100;
			const exclusions = exactStatuses.filter((status) => status[0] === statusKey[0]).map((status) => `${accessor} !== ${status}`).join(" && ");
			return `${accessor} >= ${start} && ${accessor} < ${start + 100}${exclusions ? ` && ${exclusions}` : ""}`;
		}
		return `${accessor} === ${assertSafeResponseStatusKey(statusKey)}`;
	};
	if (key === "default") {
		const declaredConditions = declaredKeys.filter((declared) => declared !== "default").map(conditionFor);
		return declaredConditions.length ? `!(${declaredConditions.join(" || ")})` : "true";
	}
	return conditionFor(key);
};
//#endregion
//#region src/utils/is-body-verb.ts
function getIsBodyVerb(verb) {
	return VERBS_WITH_BODY.includes(verb);
}
//#endregion
//#region src/utils/logger.ts
const storage = new AsyncLocalStorage();
function writeConsole(event) {
	console.log(event.message);
}
const noopReporter = {
	info() {},
	warn() {},
	error() {},
	verbose() {},
	debug() {}
};
const consoleReporter = {
	info: writeConsole,
	warn: writeConsole,
	error: writeConsole,
	verbose: writeConsole,
	debug: writeConsole
};
function run(patch, callback) {
	const current = storage.getStore();
	return storage.run({
		reporter: patch.reporter ?? current?.reporter ?? noopReporter,
		projectName: patch.projectName ?? current?.projectName,
		reporterSet: patch.reporter !== void 0 || current?.reporterSet === true
	}, callback);
}
function toScope(value) {
	const maybeReporter = value;
	const maybeScope = value;
	const hasInfo = typeof maybeReporter.info === "function";
	const hasScopeField = maybeScope.reporter !== void 0 || maybeScope.ifUnset !== void 0 || Object.hasOwn(maybeScope, "projectName");
	if (!hasInfo) return maybeScope;
	if (hasScopeField) return {
		reporter: maybeScope.reporter ?? maybeReporter,
		projectName: maybeScope.projectName,
		ifUnset: maybeScope.ifUnset
	};
	return { reporter: maybeReporter };
}
/**
* Run `callback` with a reporter. Unspecified fields inherit from the current
* scope. Prefer {@link setProjectName} to set the project name.
*/
function withReporter(reporterOrScope, callback) {
	const scope = toScope(reporterOrScope);
	if (scope.ifUnset && storage.getStore()?.reporterSet) return callback();
	return run(scope, callback);
}
/**
* Set the ambient project name for subsequent log events. Creates a new
* report store so earlier `bindReporter()` captures stay isolated.
*/
function setProjectName(projectName) {
	const current = storage.getStore();
	if (!current && projectName === void 0) return;
	storage.enterWith({
		reporter: current?.reporter ?? noopReporter,
		projectName,
		reporterSet: current?.reporterSet === true
	});
}
/** Re-enter the current report scope from later callbacks (watchers). */
function bindReporter() {
	const context = storage.getStore();
	return (callback) => context ? storage.run(context, callback) : callback();
}
const LOG_LEVEL_RANK = {
	error: 0,
	warn: 1,
	info: 2,
	verbose: 3,
	debug: 4
};
let warningCount = 0;
let logLevel = "info";
function setLogLevel(level) {
	logLevel = level;
}
/** Map CLI flags to a {@link LogLevel}. `--quiet` keeps warnings visible. */
function resolveLogLevel(options) {
	if (options.verbose) return "verbose";
	if (options.quiet) return "warn";
	return options.logLevel ?? "info";
}
function isLogLevelEnabled(level) {
	return LOG_LEVEL_RANK[level] <= LOG_LEVEL_RANK[logLevel];
}
function prefixMessage(message, { projectName, packageName } = {}) {
	return [
		projectName && styleText("green", projectName),
		packageName && `[${packageName}]`,
		message
	].filter(Boolean).join(" - ");
}
function createLogger(packageName) {
	const emit = (level, message) => {
		const { reporter, projectName } = storage.getStore() ?? { reporter: noopReporter };
		reporter[level]({
			message: prefixMessage(message, {
				projectName,
				packageName: isLogLevelEnabled("verbose") ? packageName : void 0
			}),
			packageName,
			projectName
		});
	};
	return {
		info(message) {
			if (isLogLevelEnabled("info")) emit("info", message);
		},
		warn(err, tag) {
			warningCount++;
			if (isLogLevelEnabled("warn")) emit("warn", formatReportMessage("⚠️  ", "yellow", err, tag));
		},
		error(err, tag) {
			if (!isLogLevelEnabled("error")) return;
			if (err instanceof ErrorWithTag && tag === void 0) {
				emit("error", formatReportMessage("🛑 ", "red", err.cause ?? err, err.tag));
				return;
			}
			emit("error", formatReportMessage("🛑 ", "red", err, tag));
		},
		verbose(message) {
			if (isLogLevelEnabled("verbose")) emit("verbose", message);
		},
		debug(message) {
			if (isLogLevelEnabled("debug")) emit("debug", message);
		}
	};
}
const logger = createLogger("@orval/core");
const getWarningCount = () => warningCount;
const resetWarnings = () => {
	warningCount = 0;
};
function startMessage({ name, version, description }) {
	return `🍻 ${styleText(["cyan", "bold"], name)} ${styleText("green", `v${version}`)}${description ? ` - ${description}` : ""}`;
}
function createSuccessMessage(projectTitle) {
	return `🎉 ${projectTitle ? `${styleText("green", projectTitle)} - ` : ""}Your OpenAPI spec has been converted into ready to use orval!`;
}
function formatReportMessage(marker, color, err, tag) {
	const message = err instanceof Error ? formatError(err) : String(err);
	const body = [tag ? `${tag} -` : void 0, message].filter(Boolean).join(" ");
	return styleText(color, `${marker}${body}`);
}
function formatError(err) {
	const message = (err.message || err.stack) ?? "Unknown error";
	if (!err.cause) return message;
	return `${message}\n  Cause: ${err.cause instanceof Error ? err.cause.message : isString(err.cause) ? err.cause : JSON.stringify(err.cause, void 0, 2)}`;
}
//#endregion
//#region src/utils/merge-deep.ts
function mergeDeep(source, target) {
	if (!isObject(target) || !isObject(source)) return source;
	const acc = Object.assign({}, source);
	for (const [key, value] of Object.entries(target)) {
		const sourceValue = acc[key];
		if (Array.isArray(sourceValue) && Array.isArray(value)) acc[key] = [...sourceValue, ...value];
		else if (isObject(sourceValue) && isObject(value)) acc[key] = mergeDeep(sourceValue, value);
		else acc[key] = value;
	}
	return acc;
}
//#endregion
//#region src/utils/mutation-invalidates.ts
/** The query key function name an `invalidates` target resolves to. */
const queryKeyFnNameFor = (operationName) => camel(`get-${operationName}-query-key`);
/**
* The query key function name of an operation's infinite variant, shared by
* its infinite and suspense-infinite queries. An `invalidates` target spelled
* `<operation>Infinite` (or `<operation>_infinite`) folds to this same name, so
* it is a working reference. See #4215.
*/
const infiniteQueryKeyFnNameFor = (operationName) => camel(`get-${operationName}-infinite-query-key`);
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
const getUnknownMutationInvalidatesWarnings = ({ mutationInvalidates, operationNames }) => {
	if (!mutationInvalidates?.length) return [];
	const generated = new Set(operationNames);
	const byQueryKeyFn = new Map(operationNames.map((name) => [queryKeyFnNameFor(name), name]));
	const queryKeyFns = /* @__PURE__ */ new Set([...byQueryKeyFn.keys(), ...operationNames.map((name) => infiniteQueryKeyFnNameFor(name))]);
	const warnings = [];
	const reported = /* @__PURE__ */ new Set();
	const report = (field, name) => {
		const key = `${field}:${name}`;
		if (reported.has(key)) return;
		reported.add(key);
		const suggestion = byQueryKeyFn.get(queryKeyFnNameFor(name));
		warnings.push(`mutationInvalidates references an unknown operation '${name}' in ${field}. No operation with that name is generated for this output, so the rule is ignored` + (suggestion && suggestion !== name ? ` — did you mean '${suggestion}'?` : "."));
	};
	for (const rule of mutationInvalidates) {
		for (const name of rule.onMutations) if (!generated.has(name)) report("onMutations", name);
		for (const target of rule.invalidates) {
			const name = isString(target) ? target : target.query;
			if (!queryKeyFns.has(queryKeyFnNameFor(name))) report("invalidates", name);
		}
	}
	return warnings;
};
//#endregion
//#region src/utils/string.ts
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
function toJsLiteral(value) {
	if (isString(value)) return `'${jsStringLiteralEscape(value)}'`;
	if (isNumber(value) && Number.isFinite(value) || isBoolean(value)) return String(value);
	return toStructuralLiteral(value);
}
/**
* `JSON.stringify` for structural values, except that `__proto__` is emitted as
* a computed key.
*
* A document parsed with `JSON.parse` can carry a real own `__proto__`
* property, and `JSON.stringify` renders it as a plain key. In an object
* literal that key is the prototype setter, not a data property (Annex B.3.1),
* so the constant would silently lose the property and take the document's
* value as its prototype instead. `['__proto__']` is the only form that stays
* an own property, and it is valid in type position as well as value position.
*
* Output is byte-identical to `JSON.stringify` for values without a
* `__proto__` key, so no generated output moves.
*/
function toStructuralLiteral(value) {
	if (Array.isArray(value)) return `[${value.map((item) => toStructuralLiteral(item)).join(",")}]`;
	if (isObject(value)) return `{${Object.entries(value).filter(([, entryValue]) => entryValue !== void 0).map(([key, entryValue]) => {
		const serializedKey = JSON.stringify(key);
		return `${key === "__proto__" ? `[${serializedKey}]` : serializedKey}:${toStructuralLiteral(entryValue)}`;
	}).join(",")}}`;
	return JSON.stringify(value);
}
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
function stringify(data) {
	if (data === void 0) return;
	if (data === null) return "null";
	if (isString(data)) return `'${jsStringLiteralEscape(data)}'`;
	if (isNumber(data) || isBoolean(data) || isFunction(data)) return String(data);
	if (Array.isArray(data)) return `[${data.map((item) => stringify(item)).join(", ")}]`;
	const entries = Object.entries(data);
	if (entries.length === 0) return "{}";
	let result = "";
	for (const [index, [key, value]] of entries.entries()) {
		const strValue = stringify(value);
		const safeKey = key === "__proto__" ? `['${jsStringLiteralEscape(key)}']` : keyword.isIdentifierNameES5(key) ? key : `'${jsStringLiteralEscape(key)}'`;
		if (entries.length === 1) result = `{ ${safeKey}: ${strValue}, }`;
		else if (!index) result = `{ ${safeKey}: ${strValue}, `;
		else if (entries.length - 1 === index) result += `${safeKey}: ${strValue}, }`;
		else result += `${safeKey}: ${strValue}, `;
	}
	return result;
}
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
function sanitize(value, options) {
	const { whitespace = "", underscore = "", dot = "", dash = "", es5keyword = false, es5IdentifierName = false, special = false } = options ?? {};
	let newValue = value;
	if (!special) newValue = newValue.replaceAll(/[!"`'#%&,:;<>=@{}~$()*+/\\?[\]^|]/g, "");
	if (whitespace !== true) newValue = newValue.replaceAll(/[\s]/g, whitespace);
	if (underscore !== true) newValue = newValue.replaceAll(/['_']/g, underscore);
	if (dot !== true) newValue = newValue.replaceAll(/[.]/g, dot);
	if (dash !== true) newValue = newValue.replaceAll(/[-]/g, dash);
	if (es5keyword) newValue = keyword.isKeywordES5(newValue, true) ? `_${newValue}` : newValue;
	if (es5IdentifierName) {
		if (/^[0-9]/.test(newValue)) newValue = `N${newValue}`;
		else newValue = keyword.isIdentifierNameES5(newValue) ? newValue : `_${newValue}`;
	}
	return newValue;
}
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
function toObjectString(props, path) {
	if (props.length === 0) return "";
	return (isString(path) ? props.map((prop) => {
		let obj = prop;
		for (const key of path.split(".")) obj = obj && (isObject(obj) || Array.isArray(obj)) ? obj[key] : void 0;
		return obj;
	}) : props).join(",\n    ") + ",";
}
const NUMBERS = {
	"0": "zero",
	"1": "one",
	"2": "two",
	"3": "three",
	"4": "four",
	"5": "five",
	"6": "six",
	"7": "seven",
	"8": "eight",
	"9": "nine"
};
/**
* Converts a number to its word representation by translating each digit to its word form.
*
* @param num - The number to convert to words.
* @returns A string containing the word representation of each digit concatenated together.
* @example
* getNumberWord(123) // returns "onetwothree"
* getNumberWord(42) // returns "fourtwo"
*/
function getNumberWord(num) {
	return [...num.toString()].reduce((acc, n) => acc + NUMBERS[n], "");
}
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
function escape(str, char = "'") {
	return str?.replaceAll(char, `\\${char}`);
}
/**
* Escapes regular expression metacharacters in a string so it can be safely
* embedded inside a RegExp pattern.
*
* @param value - The raw string value to escape for regex usage.
* @returns The escaped string.
* @example
* escapeRegExp('foo$bar') // returns 'foo\\$bar'
*/
function escapeRegExp(value) {
	return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}
/**
* Escape all characters not included in SingleStringCharacters and
* DoubleStringCharacters on
* http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
*
* Based on https://github.com/joliss/js-string-escape/blob/master/index.js
*
* @param input String to escape
*/
function jsStringEscape(input) {
	return input.replaceAll(/["'\\\n\r\u2028\u2029/*]/g, (character) => {
		switch (character) {
			case "\"":
			case "'":
			case "\\":
			case "/":
			case "*": return "\\" + character;
			case "\n": return String.raw`\n`;
			case "\r": return String.raw`\r`;
			case "\u2028": return String.raw`\u2028`;
			case "\u2029": return String.raw`\u2029`;
			default: return "";
		}
	});
}
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
function jsStringLiteralEscape(input) {
	return input.replaceAll(/['\\\n\r\u2028\u2029]/g, (character) => {
		switch (character) {
			case "'":
			case "\\": return "\\" + character;
			case "\n": return String.raw`\n`;
			case "\r": return String.raw`\r`;
			case "\u2028": return String.raw`\u2028`;
			case "\u2029": return String.raw`\u2029`;
			default: return "";
		}
	});
}
/**
* Deduplicates a TypeScript union type string.
* Handles types like "A | B | B" → "A | B" and "null | null" → "null".
* Only splits on top-level | (not inside {} () [] <> or string literals).
*/
function dedupeUnionType(unionType) {
	const parts = [];
	let current = "";
	let depth = 0;
	let quote = "";
	let escaped = false;
	for (const c of unionType) {
		if (!escaped && (c === "'" || c === "\"")) {
			if (!quote) quote = c;
			else if (quote === c) quote = "";
		}
		if (!quote) {
			if ("{([<".includes(c)) depth++;
			if ("})]>".includes(c)) depth--;
			if (c === "|" && depth === 0) {
				parts.push(current.trim());
				current = "";
				continue;
			}
		}
		current += c;
		escaped = !!quote && !escaped && c === "\\";
	}
	if (current.trim()) parts.push(current.trim());
	return [...new Set(parts)].join(" | ");
}
//#endregion
//#region src/utils/name.ts
/**
* Returns `name` or the first deterministic numeric suffix not in
* `reservedNames`.
*/
function getUniqueName(name, reservedNames) {
	let candidate = name;
	let index = 2;
	while (reservedNames.has(candidate)) {
		candidate = `${name}${index}`;
		index += 1;
	}
	return candidate;
}
/**
* Resolves URL helper names while reserving every generated operation name.
* The returned names correspond to `helperOperationNames` in order.
*/
function getOperationUrlHelperNames(operationNames, helperOperationNames) {
	const reservedNames = new Set(operationNames);
	return helperOperationNames.map((operationName) => {
		const helperName = getUniqueName(camel(`get-${operationName}-url`), reservedNames);
		reservedNames.add(helperName);
		return helperName;
	});
}
const componentBaseNamesCache = /* @__PURE__ */ new WeakMap();
/**
* The identifier a base name ends up as once the definition/ref generators
* sanitize it (`1Address` → `N1Address`, keyword → `_keyword`). Collisions are
* checked on this form so two keys cannot meet only after sanitization. The
* section's prefix/suffix are constant, so they are left out: at worst a name
* that would only collide without an affix is disambiguated anyway.
*/
function toComponentIdentifier(baseName) {
	return sanitize(baseName, {
		underscore: true,
		dash: true,
		es5keyword: true,
		es5IdentifierName: true
	});
}
/**
* Resolves the PascalCase base name of every key in a `components` section
* (e.g. `components.schemas`), so distinct keys that only differ in casing or
* separators (`Address` and `address`) never share a generated TypeScript
* name. Within each colliding group the key already spelled in PascalCase (or
* else the first declared) keeps the plain name; the others get the first
* numeric suffix whose sanitized identifier is still free (`Address2`).
* Memoized per section object.
*/
function getComponentBaseNames(section) {
	if (!section) return /* @__PURE__ */ new Map();
	const cached = componentBaseNamesCache.get(section);
	if (cached) return cached;
	const groups = /* @__PURE__ */ new Map();
	for (const key of Object.keys(section)) {
		const identifier = toComponentIdentifier(pascal(key));
		const group = groups.get(identifier);
		if (group) group.push(key);
		else groups.set(identifier, [key]);
	}
	const reservedIdentifiers = new Set(groups.keys());
	const names = /* @__PURE__ */ new Map();
	for (const keys of groups.values()) {
		const owner = keys.find((key) => key === pascal(key)) ?? keys[0];
		names.set(owner, pascal(owner));
		for (const key of keys) {
			if (key === owner) continue;
			const base = pascal(key);
			let index = 2;
			let uniqueName = `${base}${index}`;
			while (reservedIdentifiers.has(toComponentIdentifier(uniqueName))) {
				index += 1;
				uniqueName = `${base}${index}`;
			}
			reservedIdentifiers.add(toComponentIdentifier(uniqueName));
			names.set(key, uniqueName);
		}
	}
	componentBaseNamesCache.set(section, names);
	return names;
}
/**
* Returns the collision-free PascalCase base name of component `key` within
* `section`. See {@link getComponentBaseNames}.
*/
function getComponentBaseName(section, key) {
	return getComponentBaseNames(section).get(key) ?? pascal(key);
}
//#endregion
//#region src/utils/required.ts
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
function getRequiredKeys(schema, name) {
	if (isBooleanJsonSchema(schema)) return [];
	const required = schema.required;
	if (required === void 0) return [];
	if (Array.isArray(required)) return required;
	throw new Error(`Invalid OpenAPI document: schema "${name}" has \`required: ${JSON.stringify(required)}\`, but a schema object's \`required\` must be an array of property names. A boolean \`required\` belongs on the request body object or on a parameter, not on the schema it references.`);
}
//#endregion
//#region src/utils/resolve-version.ts
function resolveInstalledVersion(packageName, fromDir) {
	try {
		const require = createRequire(path.join(fromDir, "noop.js"));
		try {
			return require(`${packageName}/package.json`).version;
		} catch (directError) {
			if (directError instanceof Error && "code" in directError && directError.code === "ERR_PACKAGE_PATH_NOT_EXPORTED") {
				const entryPath = require.resolve(packageName);
				let dir = path.dirname(entryPath);
				while (dir !== path.parse(dir).root) {
					const pkgPath = path.join(dir, "package.json");
					if (existsSync(pkgPath)) {
						const pkgData = JSON.parse(readFileSync(pkgPath, "utf8"));
						if (pkgData.name === packageName) return pkgData.version;
					}
					dir = path.dirname(dir);
				}
				return;
			}
			throw directError;
		}
	} catch {
		return;
	}
}
function resolveInstalledVersions(packageJson, fromDir) {
	const resolved = {};
	const allDeps = /* @__PURE__ */ new Set([
		...Object.keys(packageJson.dependencies ?? {}),
		...Object.keys(packageJson.devDependencies ?? {}),
		...Object.keys(packageJson.peerDependencies ?? {})
	]);
	for (const pkgName of allDeps) {
		const version = resolveInstalledVersion(pkgName, fromDir);
		if (version) resolved[pkgName] = version;
	}
	return resolved;
}
//#endregion
//#region src/utils/schemas-options.ts
/**
* Extracts the custom package import specifier from a normalized `schemas`
* config. Returns `undefined` when `schemas` is a plain string, `false`,
* `undefined`, or when `importPath` is not set.
*/
function getSchemasImportPath(schemas) {
	if (isObject(schemas)) return schemas.importPath;
}
//#endregion
//#region src/utils/tsconfig.ts
function isSyntheticDefaultImportsAllow(config) {
	if (!config) return true;
	return !!(config.compilerOptions?.allowSyntheticDefaultImports ?? config.compilerOptions?.esModuleInterop);
}
const NODE_NEXT_MODULES = /* @__PURE__ */ new Set(["nodenext", "node16"]);
const NODE_NEXT_EXTENSION_MAP = [
	[".tsx", ".jsx"],
	[".mts", ".mjs"],
	[".cts", ".cjs"],
	[".ts", ".js"]
];
function getImportExtension(fileExtension, tsconfig) {
	const compilerOptions = tsconfig?.compilerOptions;
	if (compilerOptions?.allowImportingTsExtensions) return fileExtension;
	const module = compilerOptions?.module?.toLowerCase();
	const moduleResolution = compilerOptions?.moduleResolution?.toLowerCase();
	if (module && NODE_NEXT_MODULES.has(module) || moduleResolution && NODE_NEXT_MODULES.has(moduleResolution)) {
		for (const [from, to] of NODE_NEXT_EXTENSION_MAP) if (fileExtension.endsWith(from)) return `${fileExtension.slice(0, -from.length)}${to}`;
		return fileExtension;
	}
	return fileExtension.replace(/\.ts$/, "") || "";
}
//#endregion
//#region src/utils/schema-import-path.ts
/** Known source file extensions used to detect named single-schema files. */
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
/**
* Tag directory for a schema that more than one tag uses. Such schemas stay at
* the schemas root rather than being duplicated into each tag directory.
*/
const SHARED_DIR = ".";
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
function resolveSchemaImportDependencies(output, imports, relativeSchemasPath, { schemaTagMap, schemaOutputPlan }) {
	const resolved = schemaOutputPlan ? imports.map((schemaImport) => {
		if (!schemaOutputPlan.hasSchema(schemaImport.name)) return schemaImport;
		const canonicalName = schemaOutputPlan.canonicalNameFor(schemaImport.name);
		return canonicalName === schemaImport.name ? schemaImport : {
			...schemaImport,
			name: canonicalName
		};
	}) : imports;
	const schemasImportPath = getSchemasImportPath(output.schemas);
	const isPackageImport = !!schemasImportPath;
	if (output.schemas && typeof output.schemas === "object" && output.schemas.mode === "single") {
		const namedSingleSchemaPath = typeof output.schemas.path === "string" && SOURCE_FILE_EXTENSIONS.has(path.extname(output.schemas.path).toLowerCase()) ? output.schemas.path : void 0;
		const namedSingleSchemaStem = namedSingleSchemaPath ? path.basename(stripFileExtension(namedSingleSchemaPath, path.extname(namedSingleSchemaPath)) + getImportExtension(path.extname(namedSingleSchemaPath), output.tsconfig)) : void 0;
		const relativeSchemasBasename = path.posix.basename(relativeSchemasPath);
		const relativeSchemasDir = namedSingleSchemaPath && (relativeSchemasBasename === path.basename(namedSingleSchemaPath) || relativeSchemasBasename === path.basename(namedSingleSchemaPath, path.extname(namedSingleSchemaPath))) ? path.posix.dirname(relativeSchemasPath) : relativeSchemasPath;
		return [{
			exports: dedupeSchemaImports(resolved),
			dependency: schemasImportPath ?? joinSafe(relativeSchemasDir === "." ? "./" : relativeSchemasDir, namedSingleSchemaStem ?? `index${getImportExtension(output.schemaFileExtension, output.tsconfig)}`)
		}];
	}
	if (output.indexFiles) return [{
		exports: dedupeSchemaImports(resolved),
		dependency: schemasImportPath ?? relativeSchemasPath
	}];
	if (!output.schemas) return [{
		exports: dedupeSchemaImports(resolved),
		dependency: relativeSchemasPath
	}];
	const { schemaFileExtension } = output;
	const importExtension = getImportExtension(schemaFileExtension, isPackageImport ? void 0 : output.tsconfig);
	const importsByDependency = /* @__PURE__ */ new Map();
	for (const schemaImport of resolved) {
		const baseName = schemaImport.zodBaseName ?? schemaImport.name;
		const normalizedName = conventionName(baseName, output.namingConvention);
		const tagDir = schemaTagMap?.get(baseName);
		const flatDependency = joinSafe(relativeSchemasPath, `${tagDir && tagDir !== "." ? `${tagDir}/` : ""}${normalizedName}${importExtension}`);
		const dependency = schemaOutputPlan ? isPackageImport ? schemaOutputPlan.packageImportPath(baseName) ?? flatDependency : schemaOutputPlan.clientImportPath(baseName, relativeSchemasPath) : flatDependency;
		const existing = importsByDependency.get(dependency);
		if (existing) existing.push(schemaImport);
		else importsByDependency.set(dependency, [schemaImport]);
	}
	return [...importsByDependency.entries()].map(([dependency, dependencyImports]) => ({
		dependency,
		exports: dedupeSchemaImports(dependencyImports)
	}));
}
/**
* Collapses imports that name the same binding. The key holds every field that
* changes the binding, so one schema under two aliases stays twice.
*
* `values` is merged, not keyed on: `generateImports` groups by it, so keeping
* a type-only entry beside its value twin emits `import type { Pet }` and
* `import { Pet }` from one module — TS2300. A value import serves the type
* position too, so it wins for the whole binding.
*/
function dedupeSchemaImports(imports) {
	const byBinding = /* @__PURE__ */ new Map();
	for (const entry of imports) {
		const key = `${entry.name}|${entry.alias ?? ""}|${String(entry.default)}`;
		const existing = byBinding.get(key);
		if (!existing) byBinding.set(key, entry);
		else if (entry.values && !existing.values) byBinding.set(key, {
			...existing,
			values: true
		});
	}
	return [...byBinding.values()];
}
//#endregion
//#region src/utils/sort.ts
const sortByPriority = (arr) => arr.toSorted((a, b) => {
	const aHasDefault = a.default !== void 0;
	if (aHasDefault !== (b.default !== void 0)) return aHasDefault ? 1 : -1;
	if (a.required && b.required) return 0;
	if (a.required) return -1;
	if (b.required) return 1;
	return 0;
});
let naturalCompareCollator;
function compareNatural(a, b) {
	naturalCompareCollator ??= new Intl.Collator("en", { numeric: true });
	return naturalCompareCollator.compare(a, b);
}
//#endregion
//#region src/utils/tags.ts
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
function getTagKey(tag) {
	const normalizedTag = tag?.trim();
	return kebab(normalizedTag ? normalizedTag : DefaultTag);
}
/**
* Canonical bucket key for an operation, derived from its primary (first) tag.
*
* Untagged operations resolve to the {@link DefaultTag} bucket.
*/
function getOperationTagKey(operation) {
	return getTagKey(operation.tags[0]);
}
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
function isOperationInTagBucket(operation, tagKey) {
	if (tagKey == null) return true;
	return getOperationTagKey(operation) === getTagKey(tagKey);
}
//#endregion
//#region src/utils/template-literal.ts
/**
* Scans the expression that starts at `source[start]` (the `$` of a `${`) and
* returns the index just past its closing `}`, or `-1` when the block is
* unterminated. Nested braces and quoted strings inside the expression are
* tracked so `${a ? '{' : '}'}` and `${ {a: 1}.a }` terminate correctly.
*/
function findExpressionEnd(source, start) {
	let depth = 0;
	let index = start + 1;
	while (index < source.length) {
		const char = source[index];
		if (char === "\\") {
			index += 2;
			continue;
		}
		if (char === "'" || char === "\"" || char === "`") {
			const quote = char;
			index++;
			while (index < source.length && source[index] !== quote) index += source[index] === "\\" ? 2 : 1;
			index++;
			continue;
		}
		if (char === "{") depth++;
		else if (char === "}") {
			depth--;
			if (depth === 0) return index + 1;
		}
		index++;
	}
	return -1;
}
/**
* Splits template-literal source into static and interpolated parts.
*
* Escapes are preserved verbatim in `literal` parts (the output is meant to be
* spliced straight back into generated source), and an unterminated or
* backslash-escaped `${` stays literal rather than being guessed at.
*/
function parseTemplateLiteral(source) {
	const parts = [];
	let literal = "";
	let index = 0;
	const flushLiteral = () => {
		if (literal) {
			parts.push({
				kind: "literal",
				source: literal
			});
			literal = "";
		}
	};
	while (index < source.length) {
		const char = source[index];
		if (char === "\\") {
			literal += source.slice(index, index + 2);
			index += 2;
			continue;
		}
		if (char === "$" && source[index + 1] === "{") {
			const end = findExpressionEnd(source, index);
			if (end !== -1) {
				flushLiteral();
				parts.push({
					kind: "expression",
					source: source.slice(index + 2, end - 1)
				});
				index = end;
				continue;
			}
		}
		literal += char;
		index++;
	}
	flushLiteral();
	return parts;
}
/** Re-assembles parts produced by {@link parseTemplateLiteral} losslessly. */
function stringifyTemplateLiteral(parts) {
	return parts.map((part) => part.kind === "literal" ? part.source : `\${${part.source}}`).join("");
}
/**
* Rewrites every `${...}` expression in template-literal source, leaving
* static text (including escaped `\${...}` sequences) untouched.
*
* Returning the expression unchanged is a no-op, so this is the safe
* replacement for `route.replaceAll(TEMPLATE_TAG_REGEX, ...)`.
*/
function mapTemplateExpressions(source, mapper) {
	return stringifyTemplateLiteral(parseTemplateLiteral(source).map((part) => part.kind === "expression" ? {
		kind: "expression",
		source: mapper(part.source)
	} : part));
}
//#endregion
//#region src/getters/enum.ts
/**
* Map of special characters to semantic word replacements.
*
* Applied before naming convention transforms (PascalCase, camelCase, …) so
* that characters which would otherwise be stripped still contribute a unique
* segment to the generated key.  Without this, values like "created_at" and
* "-created_at" both PascalCase to "CreatedAt", silently overwriting one
* another in the generated const/enum object.
*
* Only characters that appear as leading/trailing modifiers in real-world
* OpenAPI enums are mapped — the list is intentionally conservative to avoid
* changing output for schemas that don't hit collisions.
*/
const ENUM_SPECIAL_CHARACTER_MAP = {
	"-": "minus",
	"+": "plus"
};
/**
* Vendor extension keys used by various OpenAPI tools
* to define custom names for enum members.
*/
const ENUM_NAME_EXTENSIONS = [
	"x-enumNames",
	"x-enumnames",
	"x-enum-varnames"
];
/**
* Vendor extension keys used to provide explicit documentation or descriptions
* for individual enum members in OpenAPI schemas.
*/
const ENUM_DESC_EXTENSIONS = [
	"x-enumDescriptions",
	"x-enumdescriptions",
	"x-enum-descriptions"
];
function getEnumNameMetadata(schemaObject) {
	if (!schemaObject || isBooleanJsonSchema(schemaObject)) return void 0;
	const key = ENUM_NAME_EXTENSIONS.find((ext) => ext in schemaObject);
	return key ? schemaObject[key] : void 0;
}
function getEnumDescriptionMetadata(schemaObject) {
	if (!schemaObject || isBooleanJsonSchema(schemaObject)) return void 0;
	const key = ENUM_DESC_EXTENSIONS.find((ext) => ext in schemaObject);
	return key ? schemaObject[key] : void 0;
}
function applyEnumMetadata(members, metadata, key) {
	if (!metadata) return;
	if (Array.isArray(metadata)) {
		metadata.forEach((value, index) => {
			if (value && members[index]) members[index][key] = jsStringEscape(value);
		});
		return;
	}
	members.forEach((member) => {
		const value = metadata[String(member.value)];
		if (value) member[key] = jsStringEscape(value);
	});
}
function getEnumMembers(schemaObject, metadataObject = schemaObject) {
	if (!schemaObject || isBooleanJsonSchema(schemaObject)) return [];
	const members = dedupeEnumMembersByValue(getRawEnumMembers(schemaObject));
	applyEnumMetadata(members, getEnumNameMetadata(schemaObject), "name");
	applyEnumMetadata(members, getEnumDescriptionMetadata(schemaObject), "description");
	if (metadataObject !== schemaObject) {
		applyEnumMetadata(members, getEnumNameMetadata(metadataObject), "name");
		applyEnumMetadata(members, getEnumDescriptionMetadata(metadataObject), "description");
	}
	return members.filter((member) => isSchemaEnumValue(member.value));
}
/**
* Generates the implementation of an enum from normalized enum members.
*/
function getEnumImplementation(members, options) {
	if (options.enumGenerationType === EnumGeneration.UNION) return getEnumUnion(members);
	const assignmentOperator = options.enumGenerationType === EnumGeneration.CONST ? ":" : "=";
	const membersWithoutNull = getEnumMembersWithoutNull(members);
	const disambiguate = !!options.enumNamingConvention && new Set(membersWithoutNull.map((member) => deriveEnumKey(member.value, options.enumNamingConvention))).size < membersWithoutNull.length;
	let result = "";
	const derivedKeys = membersWithoutNull.map((member) => member.name ? member.name : deriveEnumKey(member.value, options.enumNamingConvention, disambiguate));
	const keyCounts = /* @__PURE__ */ new Map();
	for (const k of derivedKeys) keyCounts.set(k, (keyCounts.get(k) ?? 0) + 1);
	const usedKeys = /* @__PURE__ */ new Set();
	for (let i = 0; i < membersWithoutNull.length; i++) {
		const member = membersWithoutNull[i];
		const value = stringifyEnumValue(member.value);
		const comment = getEnumMemberComment(member);
		let rawKey = member.name ? member.name : derivedKeys[i];
		if (!member.name && (keyCounts.get(rawKey) ?? 0) > 1) {
			const typePrefix = typeof member.value === "string" ? "STRING_" : typeof member.value === "boolean" ? "BOOLEAN_" : "";
			if (typePrefix) rawKey = `${typePrefix}${deriveEnumKey(member.value, options.enumNamingConvention, disambiguate).replace(/^(NUMBER|BOOLEAN)_/, "")}`;
		}
		if (!member.name) {
			let candidate = rawKey;
			let suffix = 2;
			while (usedKeys.has(candidate)) candidate = `${rawKey}_${suffix++}`;
			rawKey = candidate;
		}
		usedKeys.add(rawKey);
		const formattedKey = keyword.isIdentifierNameES5(rawKey) ? rawKey : `'${jsStringLiteralEscape(rawKey)}'`;
		result += `${comment}  ${formattedKey}${assignmentOperator} ${value},\n`;
	}
	return result;
}
function getEnum(enumMembers, enumName, nullable, enumGenerationType, enumNamingConvention) {
	if (enumGenerationType === EnumGeneration.CONST) return getTypeConstEnum(enumMembers, enumName, nullable, enumNamingConvention);
	if (enumGenerationType === EnumGeneration.ENUM) return getNativeEnum(enumMembers, enumName, enumNamingConvention);
	return getUnion(enumMembers, enumName);
}
/**
* Whether a reference to the enum generated by `getEnum` has to add `| null`
* itself. The const type alias already carries it, and a union carries it when
* `null` is one of its members, but a native `enum` cannot hold `null` (#4203).
*/
function isEnumReferenceMissingNull(enumMembers, nullable, enumGenerationType) {
	if (!nullable || enumGenerationType === EnumGeneration.CONST) return false;
	if (enumGenerationType === EnumGeneration.ENUM) return true;
	return !enumMembers.some((member) => member.value === null);
}
/**
* Checks whether any enum member has a name, description, or deprecation metadata.
*/
function hasEnumMetadata(members) {
	return members.some((member) => member.name !== void 0 || member.description !== void 0);
}
function getEnumValueInfo(members) {
	const firstType = typeof members[0]?.value;
	return {
		isHomogeneous: members.every((member) => typeof member.value === firstType),
		isBoolean: members.length > 0 && members.every((member) => typeof member.value === "boolean")
	};
}
function getEnumUnion(enumMembers) {
	return enumMembers.map(({ value }) => stringifyEnumValue(value)).join(" | ");
}
/**
* Builds the runtime value for a combined enum.
*
* Each input represents an individually resolved enum branch. Inline branches
* are normalized into enum members so their names, descriptions, and
* deprecation metadata can be preserved in the generated enum object.
*
* Referenced enum branches keep the existing spread and import behavior.
*/
function getCombinedEnumValue(inputs) {
	const membersByInput = inputs.map((input) => ({
		input,
		members: getEnumMembers(input.schema)
	}));
	const members = membersByInput.flatMap(({ input, members }) => input.isRef ? [] : members);
	const hasNull = membersByInput.some(({ input, members }) => {
		if (input.value === "null" || input.value.includes("| null")) return true;
		return members.some((member) => member.value === null);
	});
	if (inputs.every((input) => !input.isRef) && hasEnumMetadata(members)) return {
		value: `{
${getEnumImplementation(members, { enumGenerationType: EnumGeneration.CONST })}} as const`,
		valueImports: [],
		hasNull
	};
	const valueImports = [];
	const addValueImport = (name) => {
		if (!valueImports.includes(name)) valueImports.push(name);
	};
	if (inputs.length === 1) {
		const input = inputs[0];
		if (input.isRef) {
			const refName = stripNullUnion(input.value);
			if (isSpreadableEnumRef(input.schema, refName)) {
				addValueImport(refName);
				return {
					value: refName,
					valueImports,
					hasNull
				};
			}
			return {
				value: `{${buildInlineEnum(input.schema)}} as const`,
				valueImports,
				hasNull
			};
		}
		return {
			value: `{${buildInlineEnum(input.schema)}} as const`,
			valueImports,
			hasNull
		};
	}
	return {
		value: `{${inputs.map((input) => {
			if (input.isRef) {
				const refName = stripNullUnion(input.value);
				if (isSpreadableEnumRef(input.schema, refName)) {
					addValueImport(refName);
					return `...${refName},`;
				}
				return buildInlineEnum(input.schema);
			}
			return buildInlineEnum(input.schema);
		}).join("")}} as const`,
		valueImports,
		hasNull
	};
}
function getEnumMembersFromBranches(schemaObject, seen = /* @__PURE__ */ new Set()) {
	if (!schemaObject || isBooleanJsonSchema(schemaObject) || seen.has(schemaObject)) return [];
	seen.add(schemaObject);
	const branches = [...schemaObject.oneOf ?? [], ...schemaObject.anyOf ?? []];
	const members = [];
	for (const branch of branches) {
		if (hasConst(branch)) {
			members.push({
				value: branch.const,
				name: branch.title ? jsStringEscape(branch.title) : void 0,
				description: branch.description ? jsStringEscape(branch.description) : void 0,
				deprecated: branch.deprecated === true ? true : void 0
			});
			continue;
		}
		const enumValues = getSchemaEnumValues(branch.enum);
		members.push(...enumValues.map((value) => ({ value })));
		if (branch.type === "null" || Array.isArray(branch.type) && branch.type.includes("null")) members.push({ value: null });
		const isNullOnlyBranch = branch.type === "null" || Array.isArray(branch.type) && branch.type.length > 0 && branch.type.every((type) => type === "null");
		if (enumValues.length === 0 && !isNullOnlyBranch) {
			const nestedBranch = branch;
			if (!isBooleanJsonSchema(nestedBranch) && (nestedBranch.oneOf || nestedBranch.anyOf)) members.push(...getEnumMembersFromBranches(nestedBranch, seen));
		}
	}
	return dedupeEnumMembersByValue(members);
}
/**
* `enum` and `const` accept any JSON value, but only primitives can become enum
* members. The document is untrusted, so check the runtime type rather than
* trusting the `SchemaEnumValue` cast: an array or object member would
* otherwise be spliced raw into the generated module.
*/
function isSchemaEnumValue(value) {
	return typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null;
}
function getSchemaEnumValues(value) {
	return Array.isArray(value) ? value.filter(isSchemaEnumValue) : [];
}
function getRawEnumMembers(schemaObject) {
	if (isBooleanJsonSchema(schemaObject)) return [];
	if ("const" in schemaObject) {
		if (!isSchemaEnumValue(schemaObject.const)) return [];
		return [{
			value: schemaObject.const,
			name: schemaObject.title ? jsStringEscape(schemaObject.title) : void 0,
			description: schemaObject.description ? jsStringEscape(schemaObject.description) : void 0,
			deprecated: schemaObject.deprecated === true ? true : void 0
		}];
	}
	if (Array.isArray(schemaObject.enum)) return schemaObject.enum.map((value) => ({ value }));
	return getEnumMembersFromBranches(schemaObject);
}
function getEnumMembersWithoutNull(members) {
	return members.filter((member) => member.value !== null);
}
const getEnumMemberComment = (member) => {
	if (member.description && member.deprecated) return `  /**\n   * ${member.description}\n   * @deprecated\n   */\n`;
	if (member.description) return `  /** ${member.description} */\n`;
	if (member.deprecated) return `  /** @deprecated */\n`;
	return "";
};
const getTypeConstEnum = (enumMembers, enumName, nullable, enumNamingConvention) => {
	let enumValue = `export type ${enumName} = typeof ${enumName}[keyof typeof ${enumName}]`;
	if (nullable) enumValue += " | null";
	enumValue += ";\n";
	const implementation = getEnumImplementation(enumMembers, {
		enumGenerationType: EnumGeneration.CONST,
		enumNamingConvention
	});
	enumValue += "\n\n";
	enumValue += `export const ${enumName} = {\n${implementation}} as const;\n`;
	return enumValue;
};
const getNativeEnum = (enumMembers, enumName, enumNamingConvention) => {
	return `export enum ${enumName} {\n${getEnumImplementation(getEnumMembersWithoutNull(enumMembers), {
		enumNamingConvention,
		enumGenerationType: EnumGeneration.ENUM
	})}\n}`;
};
function getUnion(enumMembers, enumName) {
	return `export type ${enumName} = ${getEnumUnion(enumMembers)};`;
}
function getEnumUnionFromSchema(schema) {
	if (!schema || isBooleanJsonSchema(schema) || !schema.enum) return "";
	return schema.enum.filter((val) => val !== null).map((val) => toJsLiteral(val)).join(" | ");
}
const stripNullUnion = (value) => value.replaceAll(/\s*\|\s*null/g, "").trim();
const isSpreadableEnumRef = (schema, refName) => {
	if (!schema || isBooleanJsonSchema(schema) || !schema.enum || !refName) return false;
	if (!getEnumUnionFromSchema(schema)) return false;
	const type = schema.type;
	if (type === "boolean" || Array.isArray(type) && type.includes("boolean")) return false;
	return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(refName);
};
const buildInlineEnum = (schema) => {
	return getEnumImplementation(getEnumMembers(schema), { enumGenerationType: EnumGeneration.CONST });
};
/**
* Replace special characters with semantic words (plus an underscore separator)
* so that naming convention transforms (PascalCase, etc.) produce unique keys.
*
* The trailing underscore acts as a word boundary so that PascalCase treats the
* replacement as a separate word: "-created_at" → "minus_created_at" → "MinusCreatedAt".
*/
function replaceSpecialCharacters(key) {
	let result = "";
	for (const char of key) {
		const replacement = ENUM_SPECIAL_CHARACTER_MAP[char];
		result += replacement ? replacement + "_" : char;
	}
	return result;
}
function stringifyEnumValue(value) {
	return toJsLiteral(value);
}
const toNumberKey = (value) => {
	if (value.startsWith("-")) return `NUMBER_MINUS_${value.slice(1)}`;
	if (value.startsWith("+")) return `NUMBER_PLUS_${value.slice(1)}`;
	return `NUMBER_${value}`;
};
/**
* Derive the object/enum key for a single enum value.
*
* Handles numeric prefixes, sanitization, and optional naming convention
* transforms.  When `disambiguate` is true, special characters (-/+) are
* replaced with semantic words before the convention transform to prevent
* key collisions.
*/
function deriveEnumKey(val, enumNamingConvention, disambiguate = false) {
	let key = String(val);
	if (isNumeric(key)) key = toNumberKey(key);
	if (key.length > 1) key = sanitize(key, {
		whitespace: "_",
		underscore: true,
		dash: true,
		special: true
	});
	if (enumNamingConvention) {
		if (disambiguate) key = replaceSpecialCharacters(key);
		key = conventionName(key, enumNamingConvention);
	}
	return key;
}
function hasConst(branch) {
	return "const" in branch && isSchemaEnumValue(branch.const);
}
function dedupeEnumMembersByValue(members) {
	return members.filter((member, index, array) => array.findIndex((item) => item.value === member.value) === index);
}
//#endregion
//#region src/getters/ref.ts
/**
* `$ref`s targeting these sections under `#/components/...` are emitted as
* named TypeScript imports (e.g. `import type { Pet } from './model'`).
* Refs to any other location — for example `#/paths/.../schema` produced by
* JSON-Schema-Ref-Parser `bundle()` — have no corresponding `export type`
* and must be inlined by the resolver. See issue #398.
*/
const NAMED_COMPONENT_SECTIONS = [
	"schemas",
	"responses",
	"parameters",
	"requestBodies"
];
const RefComponentSuffix = {
	schemas: "",
	responses: "Response",
	parameters: "Parameter",
	requestBodies: "Body"
};
const COMPONENT_REF_PATTERN = new RegExp(String.raw`^#\/components\/(${NAMED_COMPONENT_SECTIONS.join("|")})\/[^/]+$`);
/**
* True iff `ref` targets a named slot eligible for emission as a TypeScript
* import. Used by `resolveValue` to decide between named import vs inlining
* the resolved schema.
*/
function isComponentRef(ref) {
	return COMPONENT_REF_PATTERN.test(ref);
}
const TILDE_1 = /~1/g;
const TILDE_0 = /~0/g;
/**
* Return the output type from the $ref
*
* @param $ref
*/
function getRefInfo($ref, context) {
	const [pathname, ref] = $ref.split("#");
	const refPaths = ref.slice(1).split("/").map((part) => decodeURIComponent(part).replaceAll(TILDE_1, "/").replaceAll(TILDE_0, "~"));
	const getOverrideSuffix = (override, paths) => {
		const firstLevel = override[paths[0]];
		if (!firstLevel) return "";
		return firstLevel[paths[1]]?.suffix ?? "";
	};
	const getOverridePrefix = (override, paths) => {
		const firstLevel = override[paths[0]];
		if (!firstLevel) return "";
		return firstLevel[paths[1]]?.prefix ?? "";
	};
	const suffix = getOverrideSuffix(context.output.override, refPaths);
	const prefix = getOverridePrefix(context.output.override, refPaths);
	const originalName = ref ? refPaths.at(-1) ?? "" : getSchemaFileName(pathname);
	if (!pathname) return {
		name: sanitize(prefix + (refPaths.length === 3 && refPaths[0] === "components" ? getComponentBaseName(context.spec.components?.[refPaths[1]], originalName) : pascal(originalName)) + suffix, {
			es5keyword: true,
			es5IdentifierName: true,
			underscore: true,
			dash: true
		}),
		originalName,
		refPaths
	};
	return {
		name: sanitize(prefix + pascal(originalName) + suffix, {
			es5keyword: true,
			es5IdentifierName: true,
			underscore: true,
			dash: true
		}),
		originalName,
		refPaths
	};
}
/**
* Extracts the anchor name from a fragment-only `$dynamicRef` (e.g. `#category` → `category`).
*
* Returns `undefined` for external-document `$dynamicRef` values (e.g. `other.json#anchor`)
* which are not supported.
*/
function getDynamicAnchorName(dynamicRef) {
	if (!dynamicRef.startsWith("#") || dynamicRef.length <= 1) return;
	return dynamicRef.slice(1);
}
//#endregion
//#region src/getters/imports.ts
function getAliasedImports({ name, resolvedValue, context }) {
	return context.output.schemas && resolvedValue.isRef ? resolvedValue.imports.map((imp) => {
		if (!needCreateImportAlias({
			name,
			imp
		})) return imp;
		return {
			...imp,
			alias: `__${imp.name}`
		};
	}) : resolvedValue.imports;
}
function needCreateImportAlias({ imp, name }) {
	return !imp.alias && imp.name === name;
}
function getImportAliasForRefOrValue({ context, imports, resolvedValue }) {
	if (!context.output.schemas || !resolvedValue.isRef) return resolvedValue.value;
	return imports.find((imp) => imp.name === resolvedValue.value)?.alias ?? resolvedValue.value;
}
//#endregion
//#region src/getters/keys.ts
function getKey(key) {
	return keyword.isIdentifierNameES5(key) ? key : `'${jsStringLiteralEscape(key)}'`;
}
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
function getStringLiteralType(name) {
	return `'${jsStringLiteralEscape(name)}'`;
}
/**
* Joins schema-derived names into a union of string literal types
* (`'a' | 'b'`). See {@link getStringLiteralType}.
*/
function getStringLiteralTypeUnion(names) {
	return names.map((name) => getStringLiteralType(name)).join(" | ");
}
/**
* Whether a schema-derived name can be emitted as a local binding
* (`const name`, a destructuring target): a valid identifier that is not a
* reserved word in strict mode.
*/
function isBindingIdentifier(name) {
	return keyword.isIdentifierNameES5(name) && !keyword.isReservedWordES6(name, true);
}
/**
* Emits a property access for a possibly non-identifier name: dot access for
* valid identifier names (`.petId`), quoted bracket access otherwise
* (`['scope.id']`).
*/
function getPropertyAccessor(name) {
	return keyword.isIdentifierNameES5(name) ? `.${name}` : `[${getKey(name)}]`;
}
/**
* Returns a Set of property keys that, after applying `conventionName`,
* would collide with another key (e.g. `first_name` and `firstName` both
* convert to `firstName` under camelCase). The generator falls back to the
* original (unique) schema key for these so the emitted type stays
* collision-free. Returns an empty Set when no convention is configured.
*/
function getPropertyNameCollisionKeys(keys, convention) {
	const collisionKeys = /* @__PURE__ */ new Set();
	if (!convention) return collisionKeys;
	const convertedNames = /* @__PURE__ */ new Map();
	for (const key of keys) {
		const converted = convention(key);
		const bucket = convertedNames.get(converted) ?? [];
		bucket.push(key);
		convertedNames.set(converted, bucket);
	}
	for (const bucket of convertedNames.values()) if (bucket.length > 1) for (const key of bucket) collisionKeys.add(key);
	return collisionKeys;
}
//#endregion
//#region src/getters/combine.ts
const mergeableAllOfKeys = /* @__PURE__ */ new Set([
	"type",
	"properties",
	"required"
]);
/** A `const` value a runtime enum object can hold as a member. */
function isScalarConst(value) {
	return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}
function isMergeableAllOfObject(schema) {
	if (isBooleanJsonSchema(schema)) return false;
	if (isNullish(schema.properties)) return false;
	if (schema.allOf || schema.anyOf || schema.oneOf) return false;
	if (!isNullish(schema.type) && schema.type !== "object") return false;
	return Object.keys(schema).every((key) => mergeableAllOfKeys.has(key));
}
function normalizeAllOfSchema(schemaInput) {
	const schema = toObjectSchema(schemaInput);
	const schemaAllOf = schema.allOf;
	if (!schemaAllOf) return schema;
	let didMerge = false;
	const schemaProperties = schema.properties;
	const schemaRequired = schema.required;
	const mergedProperties = schemaProperties ? { ...schemaProperties } : {};
	const mergedRequired = new Set(schemaRequired);
	const remainingAllOf = [];
	for (const subSchema of schemaAllOf) {
		if (isInlineSchema(subSchema) && !isBooleanJsonSchema(subSchema) && isMergeableAllOfObject(subSchema)) {
			didMerge = true;
			if (subSchema.properties) Object.assign(mergedProperties, subSchema.properties);
			const subRequired = subSchema.required;
			if (subRequired) for (const prop of subRequired) mergedRequired.add(prop);
			continue;
		}
		remainingAllOf.push(subSchema);
	}
	if (!didMerge || remainingAllOf.length === 0) return schema;
	return {
		...schema,
		...Object.keys(mergedProperties).length > 0 && { properties: mergedProperties },
		...mergedRequired.size > 0 && { required: [...mergedRequired] },
		...remainingAllOf.length > 0 && { allOf: remainingAllOf }
	};
}
/** True when the schema node itself is not a single object shape. */
function directlyEmitsNonObjectType(schema) {
	if (isBooleanJsonSchema(schema)) return false;
	const objectSchema = schema;
	if (objectSchema.enum) return true;
	const type = objectSchema.type;
	if (!(!type || type === "object" || Array.isArray(type) && type.length === 1 && type[0] === "object")) return true;
	return false;
}
function isDirectlyNullable(schema) {
	if (isBooleanJsonSchema(schema)) return schema;
	const type = schema.type;
	return type === "null" || Array.isArray(type) && type.includes("null");
}
function directlyEmitsOnlyObjectOrNull(schema) {
	if (isBooleanJsonSchema(schema)) return false;
	const objectSchema = schema;
	if (objectSchema.enum) return false;
	const type = objectSchema.type;
	const hasObjectType = !type || type === "object" || Array.isArray(type) && type.includes("object");
	const hasOnlyObjectAndNull = !type || type === "object" || Array.isArray(type) && type.every((memberType) => ["object", "null"].includes(memberType));
	return hasObjectType && hasOnlyObjectAndNull && Array.isArray(type) && type.includes("null");
}
function isEnumMember(schema, context) {
	return resolveObject({
		schema,
		combined: true,
		context
	}).isEnum;
}
function hasAllEnumMembers(schema, context) {
	if (!isInlineSchema(schema) || isBooleanJsonSchema(schema)) return false;
	return [
		schema.allOf,
		schema.oneOf,
		schema.anyOf
	].some((members) => !!members?.length && members.every((member) => isEnumMember(member, context)));
}
function usesCanonicalNullableOneOfObject(schema) {
	if (!isInlineSchema(schema) || isBooleanJsonSchema(schema)) return false;
	const members = schema.oneOf;
	if (!members) return false;
	const isNullMember = (member) => {
		if (!isInlineSchema(member) || isBooleanJsonSchema(member)) return false;
		const type = member.type;
		return type === "null" || Array.isArray(type) && type.length === 1 && type[0] === "null";
	};
	const nonNullMembers = members.filter((member) => !isNullMember(member));
	const nonNullMember = nonNullMembers[0];
	if (!members.some(isNullMember) || nonNullMembers.length !== 1 || !nonNullMember || !isInlineSchema(nonNullMember) || isBooleanJsonSchema(nonNullMember)) return false;
	const type = nonNullMember.type;
	const properties = nonNullMember.properties;
	return (type === "object" || !type && !!properties) && !!properties && Object.keys(properties).length > 0;
}
function propagatesNullAcrossRef(schema, crossesComponentRefBoundary) {
	if (!crossesComponentRefBoundary) return false;
	if (isDirectlyNullable(schema)) return true;
	if (!isInlineSchema(schema) || isBooleanJsonSchema(schema)) return false;
	return (schema.anyOf ?? []).some((member) => isInlineSchema(member) && isDirectlyNullable(member));
}
/**
* True when this node can emit a branch that also omits keys contributed by
* its `allOf` descendants. Direct non-object output escapes the full
* intersection. Direct or inline-anyOf nullability can also escape when
* `resolveValue` resolves this node through a component `$ref` and preserves
* or appends `| null` outside the alias intersection. Canonical nullable oneOf
* and all-enum sibling compositions only make the node's own properties
* unsafe: `combineSchemas` still
* intersects every `allOf` member with their emitted union. A non-null object
* sibling or guaranteed properties on the parent also eliminate an
* object-or-null member's null branch from the parent intersection, preserving
* that member's object keys.
*/
function cannotGuaranteeAllOfPropertyKeys(schema, crossesComponentRefBoundary, nullBranchesEliminated = false) {
	if (directlyEmitsNonObjectType(schema) && !(nullBranchesEliminated && directlyEmitsOnlyObjectOrNull(schema))) return true;
	return !nullBranchesEliminated && propagatesNullAcrossRef(schema, crossesComponentRefBoundary);
}
/**
* True when this node's own property keys are not guaranteed in `keyof` of the
* referenced output. Nullable, enum, scalar, array, or mixed-type nodes fail
* directly; a missing type and OAS 3.1 `type: ['object']` remain object-capable.
*
* anyOf/oneOf members otherwise remain safe because `combineSchemas`
* intersects the node's own properties into every grouped branch. The exception
* is nullability on a component `$ref` target or one of its direct inline anyOf
* members: `resolveValue`/`getScalar` can propagate it outside the referenced
* wrapper's allOf intersection. Inline allOf members, reference members,
* non-null scalars, oneOf members, and nested unions stay inside the grouped
* intersection. An all-enum composition is also unsafe because `combineValues`
* emits the node's properties as a separate union branch instead. Finally, the
* canonical nullable-oneOf object shortcut emits only its inline object and
* `null`, dropping the node's own properties.
*/
function cannotGuaranteeOwnPropertyKeys(schema, context, crossesComponentRefBoundary, nullBranchesEliminated = false) {
	return cannotGuaranteeAllOfPropertyKeys(schema, crossesComponentRefBoundary, nullBranchesEliminated) || hasAllEnumMembers(schema, context) || usesCanonicalNullableOneOfObject(schema);
}
/**
* Dereference a component `$ref`, following `$ref`-to-`$ref` chains. Returns
* `undefined` (rather than throwing like `resolveRef`) for non-component,
* cyclic, malformed, or unresolvable refs so callers can fall back to the
* `Extract` guard. `seenRefs` records every visited hop and doubles as the
* cycle guard across the whole walk.
*/
function derefComponentSchema($ref, context, seenRefs) {
	let current = $ref;
	while (current && !seenRefs.has(current) && isComponentRef(current)) {
		seenRefs.add(current);
		let target;
		try {
			const { refPaths } = getRefInfo(current, context);
			target = Array.isArray(refPaths) ? getAtPath(context.spec, refPaths) : void 0;
		} catch {
			return;
		}
		if (!isObject(target)) return;
		if (!isInlineSchema(target)) {
			if (cannotGuaranteeAllOfPropertyKeys(target, true)) return;
			current = target.$ref;
			continue;
		}
		return target;
	}
}
/**
* True when this member is guaranteed to emit a non-null object. Walk the
* original `allOf` composition so object constraints hidden behind nested
* component refs are not lost when normalization merges an inline member into
* its parent. `seenRefs` keeps recursive component compositions cycle-safe.
*/
function guaranteesNonNullableObject(schema, context, seenRefs = /* @__PURE__ */ new Set(), crossesComponentRefBoundary = !isInlineSchema(schema)) {
	if (isBooleanJsonSchema(schema)) return false;
	if (!isInlineSchema(schema)) {
		if (cannotGuaranteeOwnPropertyKeys(schema, context, crossesComponentRefBoundary)) return false;
		const resolvedSchema = derefComponentSchema(schema.$ref, context, seenRefs);
		return resolvedSchema ? guaranteesNonNullableObject(resolvedSchema, context, seenRefs, true) : false;
	}
	if (propagatesNullAcrossRef(schema, crossesComponentRefBoundary)) return false;
	const properties = schema.properties;
	const type = schema.type;
	const isExplicitlyNonNullableObject = type === "object" || Array.isArray(type) && type.length === 1 && type[0] === "object";
	if (!cannotGuaranteeOwnPropertyKeys(schema, context, crossesComponentRefBoundary) && (isExplicitlyNonNullableObject || !!properties && Object.keys(properties).length > 0)) return true;
	return (schema.allOf ?? []).some((member) => guaranteesNonNullableObject(member, context, new Set(seenRefs)));
}
/**
* Collect the property keys reachable through a schema's `allOf` composition,
* resolving component `$ref` members against the spec. Feeds the
* pickable/unresolved split for required-override keys: a key found here is
* provably in `keyof` of the emitted intersection, so a plain
* `Required<Pick<T, 'k'>>` is safe even when an `additionalProperties` index
* signature would collapse the `Extract` guard to `never` (#3748). Union
* members are deliberately not walked, while a node's own top-level properties
* are collected when the generator intersects them into every anyOf/oneOf
* branch. A node's own unsafe properties are skipped without discarding keys
* from sibling `allOf` descendants that remain in the emitted intersection.
* Nodes that can emit a branch outside that full intersection are skipped
* entirely, degrading to the compile-safe `Extract` guard. The component-ref
* boundary flag mirrors the only `resolveValue` path that lifts inline anyOf
* nullability outside the alias intersection. Parent allOf traversal also uses
* guaranteed properties on the parent or a sibling as proof that null cannot
* survive the full intersection.
*/
function collectDeepPropertyKeys(schema, context, crossesComponentRefBoundary = false, nullBranchesEliminated = false, seenRefs = /* @__PURE__ */ new Set()) {
	if (isBooleanJsonSchema(schema)) return [];
	const resolvesComponentRef = crossesComponentRefBoundary || !isInlineSchema(schema);
	if (cannotGuaranteeAllOfPropertyKeys(schema, resolvesComponentRef, nullBranchesEliminated)) return [];
	if (!isInlineSchema(schema)) {
		const target = derefComponentSchema(schema.$ref, context, seenRefs);
		return target ? collectDeepPropertyKeys(target, context, true, nullBranchesEliminated, seenRefs) : [];
	}
	const properties = schema.properties;
	const keys = properties && !cannotGuaranteeOwnPropertyKeys(schema, context, resolvesComponentRef, nullBranchesEliminated) ? Object.keys(properties) : [];
	const parentPropertiesEliminateNull = keys.length > 0;
	const members = schema.allOf ?? [];
	const guaranteedObjectMembers = members.map((member) => guaranteesNonNullableObject(member, context));
	for (const [index, member] of members.entries()) {
		const hasObjectSibling = guaranteedObjectMembers.some((isGuaranteedObject, siblingIndex) => siblingIndex !== index && isGuaranteedObject);
		keys.push(...collectDeepPropertyKeys(member, context, false, nullBranchesEliminated || parentPropertiesEliminateNull || hasObjectSibling, seenRefs));
	}
	return keys;
}
function combineValues({ resolvedData, resolvedValue, separator, context, parentSchema, parentNullBranchesEliminated = false }) {
	if (resolvedData.isEnum.every(Boolean)) return `${resolvedData.values.join(` | `)}${resolvedValue ? ` | ${resolvedValue.value}` : ""}`;
	if (separator === "allOf") {
		let resolvedDataValue = resolvedData.values.map((v) => v.includes(" | ") ? `(${v})` : v).join(` & `);
		if (resolvedData.originalSchema.length > 0 && resolvedValue) {
			const discriminatedPropertySchemas = resolvedData.originalSchema.filter((s) => s !== void 0 && !isBooleanJsonSchema(s) && Boolean(s.discriminator?.propertyName && resolvedValue.value.includes(` ${s.discriminator?.propertyName}:`)));
			if (discriminatedPropertySchemas.length > 0) resolvedDataValue = `Omit<${resolvedDataValue}, ${getStringLiteralTypeUnion(discriminatedPropertySchemas.map((s) => s.discriminator?.propertyName ?? ""))}>`;
		}
		const resolvedValueStr = resolvedValue?.value.includes(" | ") ? `(${resolvedValue.value})` : resolvedValue?.value;
		const joined = `${resolvedDataValue}${resolvedValue ? ` & ${resolvedValueStr}` : ""}`;
		const parentObject = parentSchema !== void 0 && !isBooleanJsonSchema(parentSchema) ? parentSchema : void 0;
		const parentProperties = parentObject?.properties;
		const parentRequiredProperties = parentObject?.required;
		const overrideRequiredProperties = resolvedData.requiredProperties.filter((prop) => !resolvedData.originalSchema.some((schema) => {
			if (schema === void 0 || isBooleanJsonSchema(schema)) return false;
			const props = schema.properties;
			const req = schema.required;
			return Boolean(props?.[prop] && req?.includes(prop));
		}) && !(parentProperties?.[prop] && parentRequiredProperties?.includes(prop)));
		const pickableParentProperties = parentSchema && parentProperties && !cannotGuaranteeOwnPropertyKeys(parentSchema, context, false, parentNullBranchesEliminated) ? Object.keys(parentProperties) : [];
		const pickableNonNullParentProperties = parentSchema && parentProperties && !cannotGuaranteeOwnPropertyKeys(parentSchema, context, false, true) ? Object.keys(parentProperties) : [];
		const pickableProperties = /* @__PURE__ */ new Set([...resolvedData.allProperties, ...pickableParentProperties]);
		const pickableRequiredProperties = overrideRequiredProperties.filter((prop) => pickableProperties.has(prop));
		const unresolvedRequiredProperties = overrideRequiredProperties.filter((prop) => !pickableProperties.has(prop));
		const nullableParentRequiredProperties = unresolvedRequiredProperties.filter((prop) => pickableNonNullParentProperties.includes(prop));
		let result = joined;
		if (pickableRequiredProperties.length > 0) result = `${result} & Required<Pick<${joined}, ${getStringLiteralTypeUnion(pickableRequiredProperties)}>>`;
		if (unresolvedRequiredProperties.length > 0) result = `${result} & Required<Pick<${joined}, Extract<keyof (${joined}), ${getStringLiteralTypeUnion(unresolvedRequiredProperties)}>>>`;
		if (nullableParentRequiredProperties.length > 0) result = `${result} & (Required<Pick<NonNullable<${joined}>, ${getStringLiteralTypeUnion(nullableParentRequiredProperties)}>> | null)`;
		if (pickableRequiredProperties.length > 0 || unresolvedRequiredProperties.length > 0) return result;
		return joined;
	}
	let values = resolvedData.values;
	if (resolvedData.allProperties.length && context.output.unionAddMissingProperties) {
		values = [];
		for (let i = 0; i < resolvedData.values.length; i += 1) {
			const subSchema = resolvedData.originalSchema[i];
			if (subSchema === void 0 || isBooleanJsonSchema(subSchema) || subSchema.type !== "object" || !subSchema.properties) {
				values.push(resolvedData.values[i]);
				continue;
			}
			const subSchemaProps = subSchema.properties;
			const missingProperties = unique(resolvedData.allProperties.filter((p) => !Object.keys(subSchemaProps).includes(p)));
			values.push(`${resolvedData.values[i]}${missingProperties.length > 0 ? ` & {${missingProperties.map((p) => `${getKey(p)}?: never`).join("; ")}}` : ""}`);
		}
	}
	if (resolvedValue) {
		const resolvedValueStr = resolvedValue.value.includes(" | ") ? `(${resolvedValue.value})` : resolvedValue.value;
		return values.map((value) => {
			return `(${value.includes(" | ") ? `(${value})` : value} & ${resolvedValueStr})`;
		}).join(" | ");
	}
	return values.join(" | ");
}
function combineSchemas({ name, schema: schemaInput, separator, context, nullable, formDataContext }) {
	const schema = toObjectSchema(schemaInput);
	const originalAllOfMembers = schema.allOf ?? [];
	const parentNullBranchesEliminated = separator === "allOf" && originalAllOfMembers.some((member) => guaranteesNonNullableObject(member, context));
	const normalizedSchema = separator === "allOf" && !context.output.override.aliasCombinedTypes && !schema.oneOf && !schema.anyOf ? normalizeAllOfSchema(schema) : schema;
	const items = normalizedSchema[separator] ?? [];
	const resolvedData = {
		values: [],
		imports: [],
		schemas: [],
		isEnum: [],
		isRef: [],
		types: [],
		dependencies: [],
		originalSchema: [],
		allProperties: [],
		hasReadonlyProps: false,
		example: schema.example,
		examples: resolveExampleRefs(schema.examples, context),
		requiredProperties: separator === "allOf" ? [...normalizedSchema.required ?? []] : []
	};
	for (const subSchema of items) {
		let propName;
		if (context.output.override.aliasCombinedTypes) {
			propName = name ? name + pascal(separator) : void 0;
			if (propName && resolvedData.schemas.length > 0) propName = propName + pascal(getNumberWord(resolvedData.schemas.length + 1));
		}
		const resolvedValue = resolveObject({
			schema: subSchema,
			propName,
			combined: true,
			context,
			formDataContext
		});
		if (separator === "allOf") {
			const memberRequired = !isBooleanJsonSchema(resolvedValue.originalSchema) && resolvedValue.originalSchema.required;
			if (Array.isArray(memberRequired)) resolvedData.requiredProperties.push(...memberRequired);
		}
		const aliasedImports = getAliasedImports({
			context,
			name,
			resolvedValue
		});
		const value = getImportAliasForRefOrValue({
			context,
			resolvedValue,
			imports: aliasedImports
		});
		resolvedData.values.push(value);
		resolvedData.imports.push(...aliasedImports);
		resolvedData.schemas.push(...resolvedValue.schemas);
		resolvedData.dependencies.push(...resolvedValue.dependencies);
		resolvedData.isEnum.push(resolvedValue.isEnum);
		resolvedData.types.push(resolvedValue.type);
		resolvedData.isRef.push(resolvedValue.isRef);
		resolvedData.originalSchema.push(resolvedValue.originalSchema);
		if (resolvedValue.hasReadonlyProps) resolvedData.hasReadonlyProps = true;
		if (resolvedValue.type === "object") {
			if (separator === "allOf" && typeof resolvedValue.originalSchema !== "boolean" && isInlineSchema(resolvedValue.originalSchema)) resolvedData.allProperties.push(...collectDeepPropertyKeys(resolvedValue.originalSchema, context, !isInlineSchema(subSchema)));
			else {
				const originalProps = !isBooleanJsonSchema(resolvedValue.originalSchema) ? resolvedValue.originalSchema.properties : void 0;
				if (originalProps) resolvedData.allProperties.push(...Object.keys(originalProps));
			}
		}
	}
	const isAllEnums = resolvedData.isEnum.every((isEnum, index) => isEnum || isNullOnlyEnum(resolvedData.originalSchema[index]));
	const isNullableEnumComposition = (separator === "anyOf" || separator === "oneOf") && !isAllEnums && resolvedData.isEnum.some(Boolean) && resolvedData.isEnum.every((isEnum, index) => isEnum && !resolvedData.isRef[index] || resolvedData.types[index] === "null");
	const hasAnnotatedEnum = hasEnumMetadata(getEnumMembers(schema));
	const isEveryBranchEnumLike = resolvedData.isEnum.every((isEnum, index) => {
		const branch = resolvedData.originalSchema[index];
		return isEnum || isNullOnlyEnum(branch) || resolvedData.types[index] === "null" || isObject(branch) && "const" in branch && isScalarConst(branch.const);
	});
	if ((isAllEnums || hasAnnotatedEnum && isEveryBranchEnumLike) && name && items.length > 1 && context.output.override.enumGenerationType !== EnumGeneration.UNION) {
		const { value: combinedEnumValue, valueImports, hasNull } = getCombinedEnumValue(resolvedData.values.map((value, index) => ({
			value,
			isRef: resolvedData.isRef[index],
			schema: resolvedData.originalSchema[index]
		})));
		const newEnum = `export const ${pascal(name)} = ${combinedEnumValue}`;
		const valueImportSet = new Set(valueImports);
		const typeSuffix = `${nullable}${hasNull && !nullable.includes("null") ? " | null" : ""}`;
		return {
			value: `typeof ${pascal(name)}[keyof typeof ${pascal(name)}]${typeSuffix}`,
			imports: [{ name: pascal(name) }],
			schemas: [...resolvedData.schemas, {
				imports: resolvedData.imports.filter((toImport) => valueImportSet.has(toImport.alias ?? toImport.name)).map((toImport) => ({
					...toImport,
					values: true
				})),
				model: newEnum,
				name,
				kind: "enum"
			}],
			isEnum: false,
			type: "object",
			isRef: false,
			hasReadonlyProps: resolvedData.hasReadonlyProps,
			dependencies: resolvedData.dependencies,
			example: schema.example,
			examples: resolveExampleRefs(schema.examples, context)
		};
	}
	let resolvedValue;
	const normalizedProperties = normalizedSchema.properties;
	const schemaOneOf = schema.oneOf;
	const schemaAnyOf = schema.anyOf;
	const unionMembers = (separator === "oneOf" ? schemaOneOf : separator === "anyOf" ? schemaAnyOf : void 0) ?? [];
	const parentPropKeys = new Set(Object.keys(normalizedProperties ?? {}));
	const isDiscriminatedRefCycle = !!schema.discriminator && unionMembers.length > 0 && unionMembers.every((member) => typeof member === "object" && member !== null && "$ref" in member) && unionMembers.some((member) => {
		if (typeof member !== "object" || member === null || !("$ref" in member)) return false;
		const ref = member.$ref;
		if (!ref) return false;
		const refName = ref.split("/").pop();
		const refSchema = context.spec?.components?.schemas?.[refName ?? ""];
		return ((refSchema !== void 0 && !isBooleanJsonSchema(refSchema) ? refSchema.allOf : void 0) ?? []).some((entry) => {
			if (isBooleanJsonSchema(entry)) return false;
			if ("$ref" in entry) return !!entry.$ref && entry.$ref.endsWith("/" + name);
			return Object.keys(entry.properties ?? {}).some((key) => parentPropKeys.has(key));
		});
	});
	if (normalizedProperties && !isDiscriminatedRefCycle) resolvedValue = getScalar({
		item: Object.fromEntries(Object.entries(normalizedSchema).filter(([key]) => key !== separator)),
		name,
		context,
		formDataContext
	});
	else if (separator === "allOf" && (schemaOneOf || schemaAnyOf)) {
		const siblingCombiner = schemaOneOf ? "oneOf" : "anyOf";
		const siblingSchemas = schemaOneOf ?? schemaAnyOf;
		resolvedValue = combineSchemas({
			schema: { [siblingCombiner]: siblingSchemas },
			name,
			separator: siblingCombiner,
			context,
			nullable: ""
		});
	}
	return {
		value: dedupeUnionType(combineValues({
			resolvedData,
			separator,
			resolvedValue,
			context,
			parentSchema: normalizedSchema,
			parentNullBranchesEliminated
		}) + nullable),
		imports: resolvedValue ? [...resolvedData.imports, ...resolvedValue.imports] : resolvedData.imports,
		schemas: resolvedValue ? [...resolvedData.schemas, ...resolvedValue.schemas] : resolvedData.schemas,
		dependencies: resolvedValue ? [...resolvedData.dependencies, ...resolvedValue.dependencies] : resolvedData.dependencies,
		isEnum: isNullableEnumComposition,
		type: "object",
		isRef: false,
		hasReadonlyProps: resolvedData.hasReadonlyProps || (resolvedValue?.hasReadonlyProps ?? false),
		example: schema.example,
		examples: resolveExampleRefs(schema.examples, context)
	};
}
//#endregion
//#region src/getters/object.ts
function getPropertyNamesEnumKeyType(item) {
	if (isBooleanJsonSchema(item) || !("propertyNames" in item) || !item.propertyNames) return;
	const propertyNames = item.propertyNames;
	if (Array.isArray(propertyNames.enum)) {
		const enumValues = propertyNames.enum.filter((val) => isString(val));
		if (enumValues.length > 0) return {
			value: enumValues.map((val) => `'${jsStringLiteralEscape(val)}'`).join(" | "),
			imports: [],
			dependencies: []
		};
	}
	if (isString(propertyNames.const)) return {
		value: `'${jsStringLiteralEscape(propertyNames.const)}'`,
		imports: [],
		dependencies: []
	};
}
/**
* Resolve a narrowed key type from OpenAPI 3.1 propertyNames.
* Supports inline enum/const and $ref string enums.
*/
function getPropertyNamesKeyType(item, context) {
	if (isBooleanJsonSchema(item)) return;
	const inlineKeyType = getPropertyNamesEnumKeyType(item);
	if (inlineKeyType) return inlineKeyType;
	const propertyNames = item.propertyNames;
	if (!propertyNames || isInlineSchema(propertyNames)) return;
	const resolvedValue = resolveValue({
		schema: propertyNames,
		context
	});
	const originalSchema = resolvedValue.originalSchema;
	if (isBooleanJsonSchema(originalSchema)) return;
	const resolvedConst = originalSchema.const;
	const isStringConst = resolvedValue.type === "string" && isString(resolvedConst);
	if (!resolvedValue.isEnum && !isStringConst) return;
	return {
		value: resolvedValue.value,
		imports: resolvedValue.imports,
		dependencies: resolvedValue.dependencies
	};
}
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
function hasNarrowedPropertyNames(item, context) {
	return getPropertyNamesKeyType(item, context) !== void 0;
}
/**
* Generate index signature key type based on propertyNames enum or const
* Returns union type string like "'foo' | 'bar'", "'x'", or 'string' if neither
*/
function getIndexSignatureKey(item) {
	return getPropertyNamesEnumKeyType(item)?.value ?? "string";
}
function getPropertyNamesRecordType(item, valueType, context) {
	const keyType = getPropertyNamesKeyType(item, context);
	if (!keyType) return;
	return {
		...keyType,
		value: `Partial<Record<${keyType.value}, ${valueType}>>`
	};
}
function getNormalizedComponentSchemaNames(context) {
	context.normalizedComponentSchemaNames ??= new Set(getComponentBaseNames(context.spec.components?.schemas).values());
	return context.normalizedComponentSchemaNames;
}
/**
* Return the output type from an object
*
* @param item item with type === "object"
*/
function getObject({ item, name, context, nullable, formDataContext }) {
	if (!isInlineSchema(item)) {
		const { name } = getRefInfo(item.$ref, context);
		return {
			value: name + nullable,
			imports: [{ name }],
			schemas: [],
			isEnum: false,
			type: "object",
			isRef: true,
			hasReadonlyProps: Boolean(item.readOnly),
			dependencies: [name],
			example: item.example,
			examples: resolveExampleRefs(item.examples, context)
		};
	}
	const schemaItem = toObjectSchema(item);
	const itemAllOf = schemaItem.allOf;
	const itemOneOf = schemaItem.oneOf;
	const itemAnyOf = schemaItem.anyOf;
	const itemType = schemaItem.type;
	if (itemAllOf || itemOneOf || itemAnyOf) {
		const separator = itemAllOf ? "allOf" : itemOneOf ? "oneOf" : "anyOf";
		const members = separator === "anyOf" ? itemAnyOf : separator === "oneOf" ? itemOneOf : void 0;
		if (members) {
			const isNullMember = (member) => {
				if (!isInlineSchema(member) || isBooleanJsonSchema(member)) return false;
				const memberType = member.type;
				return memberType === "null" || Array.isArray(memberType) && memberType.length === 1 && memberType[0] === "null";
			};
			const nonNullMembers = members.filter((member) => !isNullMember(member));
			const nonNullMember = nonNullMembers[0];
			const nonNullMemberType = nonNullMember && isInlineSchema(nonNullMember) && !isBooleanJsonSchema(nonNullMember) ? nonNullMember.type : void 0;
			const nonNullMemberProperties = nonNullMember && isInlineSchema(nonNullMember) && !isBooleanJsonSchema(nonNullMember) ? nonNullMember.properties : void 0;
			if (members.some(isNullMember) && nonNullMembers.length === 1 && nonNullMember !== void 0 && isInlineSchema(nonNullMember) && (nonNullMemberType === "object" || nonNullMemberType === void 0 && nonNullMemberProperties !== void 0) && nonNullMemberProperties !== void 0 && Object.keys(nonNullMemberProperties).length > 0) return getObject({
				item: nonNullMember,
				name,
				context,
				nullable: nullable || " | null",
				formDataContext
			});
		}
		return combineSchemas({
			schema: schemaItem,
			name,
			separator,
			context,
			nullable,
			formDataContext
		});
	}
	if (Array.isArray(itemType)) {
		const typeArray = itemType;
		const nonNullTypes = typeArray.filter((type) => type !== "null");
		const typeArrayProperties = schemaItem.properties;
		if (!(nonNullTypes.length === 1 && nonNullTypes[0] === "object" && typeArrayProperties !== void 0 && Object.keys(typeArrayProperties).length > 0)) {
			const baseItem = schemaItem;
			return combineSchemas({
				schema: { anyOf: typeArray.map((type) => ({
					...baseItem,
					type
				})) },
				name,
				separator: "anyOf",
				context,
				nullable
			});
		}
	}
	const itemProperties = schemaItem.properties;
	if (itemProperties && Object.entries(itemProperties).length > 0) {
		const entries = Object.entries(itemProperties);
		if (context.output.propertySortOrder === PropertySortOrder.ALPHABETICAL) entries.sort((a, b) => {
			return compareNatural(a[0], b[0]);
		});
		const propertyConvention = context.output.override.namingConvention?.properties;
		const collisionKeys = getPropertyNameCollisionKeys(entries.map(([key]) => key), propertyConvention ? (name) => conventionName(name, propertyConvention) : void 0);
		const acc = {
			imports: [],
			schemas: [],
			value: "",
			isEnum: false,
			type: "object",
			isRef: false,
			hasReadonlyProps: false,
			useTypeAlias: false,
			dependencies: [],
			example: schemaItem.example,
			examples: resolveExampleRefs(schemaItem.examples, context)
		};
		const itemRequired = schemaItem.required;
		for (const [index, [key, schema]] of entries.entries()) {
			const isRequired = (Array.isArray(itemRequired) ? itemRequired : []).includes(key);
			let propName = "";
			if (name) {
				const isKeyStartWithUnderscore = key.startsWith("_");
				propName += pascal(`${isKeyStartWithUnderscore ? "_" : ""}${name}_${key}`);
			}
			if (getNormalizedComponentSchemaNames(context).has(propName)) propName = propName + "Property";
			const propertyFormDataContext = formDataContext && !formDataContext.atPart ? {
				atPart: true,
				partContentType: formDataContext.encoding[key]?.contentType,
				urlEncoded: formDataContext.urlEncoded
			} : void 0;
			const resolvedValue = resolveObject({
				schema,
				propName,
				context,
				formDataContext: propertyFormDataContext
			});
			const isReadOnly = Boolean(schemaItem.readOnly) || Boolean(typeof schema === "object" && schema !== null && schema.readOnly);
			if (!index) acc.value += "{";
			const doc = jsDoc(schema, true, context);
			const propertyDoc = doc ? `${doc.trimEnd().split("\n").map((line) => `  ${line}`).join("\n")}\n` : "";
			if (isReadOnly || resolvedValue.hasReadonlyProps) acc.hasReadonlyProps = true;
			const constValue = typeof schema === "object" && schema !== null && "const" in schema ? schema.const : void 0;
			const hasConst = constValue !== void 0;
			const constLiteral = hasConst ? toJsLiteral(constValue) : void 0;
			const needsValueImport = hasConst && (resolvedValue.isEnum || resolvedValue.type === "enum");
			const usedResolvedValue = !hasConst || needsValueImport;
			const aliasedImports = needsValueImport ? resolvedValue.imports.map((imp) => ({
				...imp,
				isConstant: true
			})) : hasConst ? [] : getAliasedImports({
				name,
				context,
				resolvedValue
			});
			if (aliasedImports.length > 0) acc.imports.push(...aliasedImports);
			const alias = getImportAliasForRefOrValue({
				context,
				resolvedValue,
				imports: aliasedImports
			});
			const propValue = needsValueImport ? alias : constLiteral ?? alias;
			const finalPropValue = isRequired ? propValue : context.output.override.useNullForOptional === true ? `${propValue} | null` : propValue;
			acc.value += `\n${propertyDoc}${isReadOnly && !context.output.override.suppressReadonlyModifier ? "  readonly " : "  "}${getKey(propertyConvention ? collisionKeys.has(key) ? key : conventionName(key, propertyConvention) : key)}${isRequired ? "" : "?"}: ${finalPropValue};`;
			if (usedResolvedValue) {
				acc.schemas.push(...resolvedValue.schemas);
				acc.dependencies.push(...resolvedValue.dependencies);
			}
			if (entries.length - 1 === index) {
				const additionalProps = schemaItem.additionalProperties ?? schemaItem.unevaluatedProperties;
				if (additionalProps) {
					if (additionalProps === true) {
						const recordType = getPropertyNamesRecordType(schemaItem, "unknown", context);
						if (recordType) {
							acc.value += "\n}";
							acc.value += ` & ${recordType.value}`;
							acc.useTypeAlias = true;
							acc.imports.push(...recordType.imports);
							acc.dependencies.push(...recordType.dependencies);
						} else {
							const keyType = getIndexSignatureKey(schemaItem);
							acc.value += `\n  [key: ${keyType}]: unknown;\n }`;
						}
					} else {
						const resolvedValue = resolveValue({
							schema: additionalProps,
							name,
							context
						});
						const recordType = getPropertyNamesRecordType(schemaItem, resolvedValue.value, context);
						if (recordType) {
							acc.value += "\n}";
							acc.value += ` & ${recordType.value}`;
							acc.useTypeAlias = true;
							acc.imports.push(...recordType.imports);
							acc.dependencies.push(...recordType.dependencies);
							acc.imports.push(...resolvedValue.imports);
							acc.schemas.push(...resolvedValue.schemas);
							acc.dependencies.push(...resolvedValue.dependencies);
						} else {
							const keyType = getIndexSignatureKey(schemaItem);
							acc.value += `\n  [key: ${keyType}]: unknown;\n}`;
						}
					}
				} else acc.value += "\n}";
				acc.value += nullable;
			}
		}
		return acc;
	}
	const outerAdditionalProps = schemaItem.additionalProperties ?? schemaItem.unevaluatedProperties;
	const readOnlyFlag = schemaItem.readOnly;
	if (outerAdditionalProps) {
		if (outerAdditionalProps === true) {
			const recordType = getPropertyNamesRecordType(schemaItem, "unknown", context);
			if (recordType) return {
				value: recordType.value + nullable,
				imports: recordType.imports,
				schemas: [],
				isEnum: false,
				type: "object",
				isRef: false,
				hasReadonlyProps: readOnlyFlag ?? false,
				useTypeAlias: true,
				dependencies: recordType.dependencies
			};
			return {
				value: `{ [key: ${getIndexSignatureKey(schemaItem)}]: unknown }` + nullable,
				imports: [],
				schemas: [],
				isEnum: false,
				type: "object",
				isRef: false,
				hasReadonlyProps: readOnlyFlag ?? false,
				useTypeAlias: false,
				dependencies: []
			};
		}
		const resolvedValue = resolveValue({
			schema: outerAdditionalProps,
			name,
			context
		});
		const recordType = getPropertyNamesRecordType(schemaItem, resolvedValue.value, context);
		if (recordType) return {
			value: recordType.value + nullable,
			imports: [...recordType.imports, ...resolvedValue.imports],
			schemas: resolvedValue.schemas,
			isEnum: false,
			type: "object",
			isRef: false,
			hasReadonlyProps: resolvedValue.hasReadonlyProps,
			useTypeAlias: true,
			dependencies: [...recordType.dependencies, ...resolvedValue.dependencies]
		};
		return {
			value: `{[key: ${getIndexSignatureKey(schemaItem)}]: ${resolvedValue.value}}` + nullable,
			imports: resolvedValue.imports,
			schemas: resolvedValue.schemas,
			isEnum: false,
			type: "object",
			isRef: false,
			hasReadonlyProps: resolvedValue.hasReadonlyProps,
			useTypeAlias: false,
			dependencies: resolvedValue.dependencies
		};
	}
	const constValue = schemaItem.const;
	if (constValue !== void 0) {
		let type;
		if (Array.isArray(constValue)) type = "array";
		else if (constValue === null) type = "null";
		else if (typeof constValue === "string") type = "string";
		else if (typeof constValue === "number") type = "number";
		else if (typeof constValue === "boolean") type = "boolean";
		else type = "object";
		return {
			value: toJsLiteral(constValue),
			imports: [],
			schemas: [],
			isEnum: false,
			type,
			isRef: false,
			hasReadonlyProps: readOnlyFlag ?? false,
			dependencies: []
		};
	}
	const keyType = itemType === "object" ? getIndexSignatureKey(schemaItem) : "string";
	const recordType = getPropertyNamesRecordType(schemaItem, "unknown", context);
	if (itemType === "object" && recordType) return {
		value: recordType.value + nullable,
		imports: recordType.imports,
		schemas: [],
		isEnum: false,
		type: "object",
		isRef: false,
		hasReadonlyProps: readOnlyFlag ?? false,
		useTypeAlias: true,
		dependencies: recordType.dependencies
	};
	return {
		value: (itemType === "object" ? `{ [key: ${keyType}]: unknown }` : "unknown") + nullable,
		imports: [],
		schemas: [],
		isEnum: false,
		type: "object",
		isRef: false,
		hasReadonlyProps: readOnlyFlag ?? false,
		useTypeAlias: false,
		dependencies: []
	};
}
//#endregion
//#region src/getters/scalar.ts
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
function isBinaryScalarSchema(schema) {
	if (isBooleanJsonSchema(schema) || !isStringLikeSchema(schema)) return false;
	if (schema.format === "binary") return true;
	const contentMediaType = schema.contentMediaType;
	const contentEncoding = schema.contentEncoding;
	return contentMediaType === "application/octet-stream" && !contentEncoding;
}
const binaryTypeNamesCache = /* @__PURE__ */ new WeakMap();
const noComponentOverrides = {};
/**
* Returns the type names to emit for binary scalars. A component named `Blob`
* or `File` (e.g. a `File` metadata schema) is emitted as a same-named
* interface that shadows the DOM global wherever both live in one module, so
* those globals are qualified with `globalThis.` in that case (#4259).
*/
function getBinaryTypeNames(context) {
	const overrides = context.output.override.components ?? noComponentOverrides;
	let specCache = binaryTypeNamesCache.get(context.spec);
	if (!specCache) {
		specCache = /* @__PURE__ */ new WeakMap();
		binaryTypeNamesCache.set(context.spec, specCache);
	}
	const cached = specCache.get(overrides);
	if (cached) return cached;
	const { components } = context.spec;
	const sections = [
		[components?.schemas, overrides.schemas],
		[components?.responses, overrides.responses],
		[components?.requestBodies, overrides.requestBodies],
		[components?.parameters, overrides.parameters]
	];
	const componentNames = /* @__PURE__ */ new Set();
	for (const [section, { prefix = "", suffix = "" } = {}] of sections) for (const baseName of getComponentBaseNames(section).values()) componentNames.add(sanitize(`${prefix}${baseName}${suffix}`, {
		underscore: "_",
		whitespace: "_",
		dash: true,
		es5keyword: true,
		es5IdentifierName: true
	}));
	const qualify = (name) => componentNames.has(name) ? `globalThis.${name}` : name;
	const names = {
		blob: qualify("Blob"),
		file: qualify("File")
	};
	specCache.set(overrides, names);
	return names;
}
/**
* Return the typescript equivalent of open-api data type
*
* @param item
* @ref https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#data-types
*/
const booleanSchemaScalar = (value) => ({
	value,
	isEnum: false,
	hasReadonlyProps: false,
	type: "unknown",
	imports: [],
	schemas: [],
	isRef: false,
	dependencies: []
});
function getScalar({ item, name, context, formDataContext }) {
	if (item === true) return booleanSchemaScalar("unknown");
	if (item === false) return booleanSchemaScalar("never");
	const schemaEnum = item.enum;
	const schemaType = item.type;
	const schemaReadOnly = item.readOnly;
	const schemaExample = item.example;
	const schemaExamples = item.examples;
	const schemaConst = item.const;
	const schemaFormat = item.format;
	const nullable = Array.isArray(schemaType) && schemaType.includes("null") ? " | null" : "";
	const enumItems = schemaEnum?.filter((enumItem) => enumItem !== null);
	let itemType = schemaType;
	if (!itemType && item.items) {
		item.type = "array";
		itemType = "array";
	}
	if (Array.isArray(schemaType) && schemaType.includes("null")) {
		const typesWithoutNull = schemaType.filter((x) => x !== "null");
		itemType = typesWithoutNull.length === 1 ? typesWithoutNull[0] : typesWithoutNull;
	}
	if (isNullOnlyEnum(item)) itemType = "null";
	switch (itemType) {
		case "number":
		case "integer": {
			let value = context.output.override.useBigInt && (schemaFormat === "int64" || schemaFormat === "uint64") ? "bigint" : "number";
			let isEnum = false;
			if (enumItems) {
				value = enumItems.map((enumItem) => toJsLiteral(enumItem)).join(" | ");
				isEnum = true;
			}
			value += nullable;
			if (schemaConst !== void 0) value = `${toJsLiteral(schemaConst)}${nullable}`;
			return {
				value,
				isEnum,
				type: "number",
				schemas: [],
				imports: [],
				isRef: false,
				hasReadonlyProps: schemaReadOnly ?? false,
				dependencies: [],
				example: schemaExample,
				examples: resolveExampleRefs(schemaExamples, context)
			};
		}
		case "boolean": {
			let value = "boolean";
			if (enumItems && !(enumItems.includes(true) && enumItems.includes(false))) value = enumItems.map((enumItem) => toJsLiteral(enumItem)).join(" | ");
			value += nullable;
			if (schemaConst !== void 0) value = `${toJsLiteral(schemaConst)}${nullable}`;
			return {
				value,
				type: "boolean",
				isEnum: false,
				schemas: [],
				imports: [],
				isRef: false,
				hasReadonlyProps: schemaReadOnly ?? false,
				dependencies: [],
				example: schemaExample,
				examples: resolveExampleRefs(schemaExamples, context)
			};
		}
		case "array": {
			const { value, ...rest } = getArray({
				schema: item,
				name,
				context,
				formDataContext
			});
			return {
				value: value + nullable,
				...rest,
				dependencies: rest.dependencies
			};
		}
		case "string": {
			let value = "string";
			let isEnum = false;
			if (enumItems) {
				value = enumItems.map((enumItem) => toJsLiteral(enumItem)).filter(Boolean).join(` | `);
				isEnum = true;
			}
			if (!formDataContext?.urlEncoded) {
				const { blob, file } = getBinaryTypeNames(context);
				if (schemaFormat === "binary") value = formDataContext ? `${blob} | ${file}` : blob;
				else if (formDataContext?.atPart) {
					const fileType = getFormDataFieldFileType(item, formDataContext.partContentType);
					if (fileType) value = fileType === "binary" ? `${blob} | ${file}` : `${blob} | ${file} | string`;
				} else if (isBinaryScalarSchema(item)) value = formDataContext ? `${blob} | ${file}` : blob;
			}
			if (context.output.override.useDates && (schemaFormat === "date" || schemaFormat === "date-time")) value = "Date";
			value += nullable;
			if (schemaConst !== void 0) value = `${toJsLiteral(schemaConst)}${nullable}`;
			return {
				value,
				isEnum,
				type: "string",
				imports: [],
				schemas: [],
				isRef: false,
				hasReadonlyProps: schemaReadOnly ?? false,
				dependencies: [],
				example: schemaExample,
				examples: resolveExampleRefs(schemaExamples, context)
			};
		}
		case "null": {
			const itemAllOf = item.allOf;
			const itemOneOf = item.oneOf;
			const itemAnyOf = item.anyOf;
			let separator;
			if (itemAllOf?.length) separator = "allOf";
			else if (itemOneOf?.length) separator = "oneOf";
			else if (itemAnyOf?.length) separator = "anyOf";
			if (separator) return combineSchemas({
				schema: Object.fromEntries(Object.entries(item).filter(([key]) => key !== "type")),
				name,
				separator,
				context,
				nullable: nullable || " | null",
				formDataContext
			});
			return {
				value: "null",
				isEnum: false,
				type: "null",
				imports: [],
				schemas: [],
				isRef: false,
				hasReadonlyProps: schemaReadOnly ?? false,
				dependencies: []
			};
		}
		default: {
			if (Array.isArray(itemType)) return combineSchemas({
				schema: { anyOf: itemType.map((type) => Object.assign({}, item, { type })) },
				name,
				separator: "anyOf",
				context,
				nullable
			});
			if (enumItems) return {
				value: enumItems.map((enumItem) => toJsLiteral(enumItem)).filter(Boolean).join(` | `) + nullable,
				isEnum: true,
				type: "string",
				imports: [],
				schemas: [],
				isRef: false,
				hasReadonlyProps: schemaReadOnly ?? false,
				dependencies: [],
				example: schemaExample,
				examples: resolveExampleRefs(schemaExamples, context)
			};
			const hasCombiners = item.allOf ?? item.anyOf ?? item.oneOf;
			const { value, ...rest } = getObject({
				item,
				name,
				context,
				nullable,
				formDataContext: formDataContext?.atPart === false || formDataContext?.atPart && hasCombiners ? formDataContext : void 0
			});
			return {
				value,
				...rest
			};
		}
	}
}
//#endregion
//#region src/resolvers/ref.ts
/** Convert a `$dynamicAnchor` name to a valid TypeScript generic parameter identifier. */
function dynamicAnchorToParamName(anchor) {
	return sanitize(anchor, {
		underscore: "_",
		whitespace: "_",
		dash: "_",
		es5keyword: true,
		es5IdentifierName: true
	});
}
function dynamicAnchorsToUniqueParamNames(anchors) {
	const result = /* @__PURE__ */ new Map();
	const usedNames = /* @__PURE__ */ new Map();
	for (const anchor of anchors) {
		const base = dynamicAnchorToParamName(anchor);
		const count = usedNames.get(base) ?? 0;
		usedNames.set(base, count + 1);
		const paramName = count === 0 ? base : `${base}${count + 1}`;
		result.set(anchor, paramName);
	}
	return result;
}
const REF_NOT_FOUND_PREFIX = "Oops... 🍻. Ref not found";
/**
* Recursively resolves a `$ref` in an OpenAPI document, following
* nested schema refs and collecting imports along the way.
*
* Handles type-array hints on direct refs.
*
* @see https://spec.openapis.org/oas/v3.1.0#reference-object
*/
function resolveRef(schema, context, imports = []) {
	const refPath = "$ref" in schema ? schema.$ref : void 0;
	const nestedSchema = "schema" in schema ? schema.schema : void 0;
	if (isObject(nestedSchema) && !isInlineSchema(nestedSchema)) {
		const resolvedRef = resolveRef(nestedSchema, context, imports);
		if ("examples" in schema) {
			const schemaWithExamples = schema;
			schemaWithExamples.examples = resolveExampleRefs(schemaWithExamples.examples, context);
		}
		if (typeof resolvedRef.schema === "object" && resolvedRef.schema !== null && "examples" in resolvedRef.schema) {
			const resolvedWithExamples = resolvedRef.schema;
			resolvedWithExamples.examples = resolveExampleRefs(resolvedWithExamples.examples, context);
		}
		return {
			schema: {
				...schema,
				schema: resolvedRef.schema
			},
			imports: resolvedRef.imports
		};
	}
	if (isInlineSchema(schema)) {
		if ("examples" in schema) {
			const schemaWithExamples = schema;
			schemaWithExamples.examples = resolveExampleRefs(schemaWithExamples.examples, context);
		}
		return {
			schema,
			imports
		};
	}
	if (!refPath) throw new Error(`${REF_NOT_FOUND_PREFIX}: missing $ref`);
	const { currentSchema, refInfo: { name, originalName } } = getSchema$1(schema, context);
	if (!currentSchema) throw new Error(`${REF_NOT_FOUND_PREFIX}: ${refPath}`);
	return resolveRef(currentSchema, { ...context }, [...imports, {
		name,
		schemaName: originalName
	}]);
}
/** Check whether a schema reference has at least one `$defs` entry with both `$dynamicAnchor` and `$ref`. */
function isBoundAlias(schema) {
	if (!("$defs" in schema)) return false;
	const defs = schema.$defs;
	if (!defs || typeof defs !== "object") return false;
	for (const defSchema of Object.values(defs)) {
		if (!defSchema || typeof defSchema !== "object") continue;
		if (typeof defSchema.$dynamicAnchor === "string" && typeof defSchema.$ref === "string") return true;
	}
	return false;
}
/**
* Extract bound-alias information from a schema that references a generic template
* and binds `$dynamicAnchor` entries to concrete types via `$defs`.
*/
function extractBoundAliasInfo(schema, context) {
	let bindingElement;
	let extraSchemas;
	if (!isInlineSchema(schema) && isBoundAlias(schema)) bindingElement = schema;
	else {
		const allOf = schema.allOf;
		if (Array.isArray(allOf)) for (let i = 0; i < allOf.length; i++) {
			const element = allOf[i];
			if (!isInlineSchema(element) && isBoundAlias(element)) {
				bindingElement = element;
				extraSchemas = allOf.filter((_, j) => j !== i);
				break;
			}
		}
	}
	if (!bindingElement) return void 0;
	const defs = bindingElement.$defs;
	if (!defs || typeof defs !== "object") return void 0;
	const bindingByAnchor = /* @__PURE__ */ new Map();
	for (const defSchema of Object.values(defs)) {
		if (!defSchema || typeof defSchema !== "object") continue;
		const rec = defSchema;
		if (rec.$dynamicAnchor === void 0) continue;
		const ref = rec.$ref;
		if (!ref || !isComponentRef(ref)) continue;
		const anchor = rec.$dynamicAnchor;
		const { name, originalName } = getRefInfo(ref, context);
		bindingByAnchor.set(anchor, {
			typeName: name,
			originalName
		});
	}
	if (bindingByAnchor.size === 0) return void 0;
	const refPath = bindingElement.$ref;
	if (typeof refPath !== "string") return void 0;
	const { name: genericName, refPaths: templateRefPaths } = getRefInfo(refPath, context);
	const templateDefs = (templateRefPaths ? getAtPath(context.spec, templateRefPaths) : void 0)?.$defs;
	const typeArgs = [];
	const genericParams = [];
	const imports = [];
	if (templateDefs && typeof templateDefs === "object") {
		const templateAnchors = [];
		for (const defSchema of Object.values(templateDefs)) {
			if (!defSchema || typeof defSchema !== "object") continue;
			const rec = defSchema;
			if (rec.$dynamicAnchor === void 0 || rec.$ref !== void 0) continue;
			templateAnchors.push(rec.$dynamicAnchor);
		}
		const uniqueNames = dynamicAnchorsToUniqueParamNames(templateAnchors);
		for (const anchor of templateAnchors) {
			const binding = bindingByAnchor.get(anchor);
			if (binding) {
				typeArgs.push(binding.typeName);
				imports.push({
					name: binding.typeName,
					schemaName: binding.originalName
				});
			} else {
				const paramName = uniqueNames.get(anchor) ?? dynamicAnchorToParamName(anchor);
				typeArgs.push(paramName);
				genericParams.push(paramName);
			}
		}
	}
	if (typeArgs.length === 0) for (const { typeName, originalName } of bindingByAnchor.values()) {
		typeArgs.push(typeName);
		imports.push({
			name: typeName,
			schemaName: originalName
		});
	}
	return {
		genericName,
		genericParams,
		typeArgs,
		imports,
		extraSchemas
	};
}
function getSchema$1(schema, context) {
	if (!schema.$ref) throw new Error(`${REF_NOT_FOUND_PREFIX}: missing $ref`);
	const refInfo = getRefInfo(schema.$ref, context);
	const { refPaths } = refInfo;
	const schemaByRefPaths = Array.isArray(refPaths) ? getAtPath(context.spec, refPaths) : void 0;
	if (isObject(schemaByRefPaths) && !isInlineSchema(schemaByRefPaths) && !isBoundAlias(schemaByRefPaths)) return getSchema$1(schemaByRefPaths, context);
	let currentSchema = schemaByRefPaths;
	if (isObject(currentSchema) && "type" in schema && Array.isArray(schema.type)) {
		const type = schema.type;
		currentSchema = {
			...currentSchema,
			type
		};
	}
	return {
		currentSchema,
		refInfo
	};
}
function encodeJsonPointerSegment(segment) {
	return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}
/**
* Build the dynamic scope for a schema: maps `$dynamicAnchor` names to concrete
* type entries for self-referential resolution, `$defs` bindings, and sibling anchors.
*/
function buildDynamicScope(schemaName, schema, context) {
	const scope = {};
	const getSchemaScopeEntry = (name) => {
		const refInfo = getRefInfo(`#/components/schemas/${encodeJsonPointerSegment(name)}`, context);
		return {
			name: refInfo.name,
			schemaName: refInfo.originalName
		};
	};
	const schemaRecord = schema;
	if (typeof schemaRecord.$dynamicAnchor === "string") scope[schemaRecord.$dynamicAnchor] = getSchemaScopeEntry(schemaName);
	const defs = schemaRecord.$defs;
	if (defs && typeof defs === "object") {
		const unboundAnchors = [];
		for (const [, defSchema] of Object.entries(defs)) {
			if (!defSchema || typeof defSchema !== "object") continue;
			const defRecord = defSchema;
			if (typeof defRecord.$dynamicAnchor === "string") {
				const anchorName = defRecord.$dynamicAnchor;
				const refInDef = defSchema.$ref;
				if (refInDef?.startsWith("#/components/schemas/")) {
					const { name, originalName } = getRefInfo(refInDef, context);
					scope[anchorName] = {
						name,
						schemaName: originalName
					};
				} else if (!refInDef) unboundAnchors.push(anchorName);
			}
		}
		if (unboundAnchors.length > 0) {
			const uniqueNames = dynamicAnchorsToUniqueParamNames(unboundAnchors);
			for (const anchor of unboundAnchors) {
				const paramName = uniqueNames.get(anchor);
				if (paramName === void 0) continue;
				scope[anchor] = {
					name: paramName,
					schemaName: paramName,
					isParameter: true
				};
			}
		}
	}
	return scope;
}
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
function buildInlineDynamicScope(schema) {
	const scope = {};
	const schemaRecord = schema;
	if (typeof schemaRecord.$dynamicAnchor === "string") {
		const anchor = schemaRecord.$dynamicAnchor;
		scope[anchor] = {
			name: anchor,
			schemaName: anchor,
			inlineSchema: schema
		};
	}
	const defs = schemaRecord.$defs;
	if (defs && typeof defs === "object") for (const defSchema of Object.values(defs)) {
		if (!defSchema || typeof defSchema !== "object") continue;
		const defRecord = defSchema;
		if (typeof defRecord.$dynamicAnchor === "string" && !defSchema.$ref) {
			const anchor = defRecord.$dynamicAnchor;
			scope[anchor] = {
				name: anchor,
				schemaName: anchor,
				inlineSchema: defSchema
			};
		}
	}
	return scope;
}
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
function getDynamicAnchorIndex(context) {
	const cached = context.dynamicAnchorIndex;
	if (cached) return cached;
	const index = /* @__PURE__ */ new Map();
	const schemas = context.spec.components?.schemas;
	if (schemas && typeof schemas === "object") for (const [schemaName, schemaObj] of Object.entries(schemas)) {
		if (!schemaObj || typeof schemaObj !== "object") continue;
		const anchor = schemaObj.$dynamicAnchor;
		if (typeof anchor !== "string") continue;
		let entry = index.get(anchor);
		if (!entry) {
			entry = { count: 0 };
			index.set(anchor, entry);
		}
		if (schemaName === anchor) entry.exactName = schemaName;
		else if (entry.count < 2) {
			entry.count += 1;
			if (!entry.firstName) entry.firstName = schemaName;
		}
	}
	context.dynamicAnchorIndex = index;
	return index;
}
/**
* Resolve a `$dynamicRef` anchor to its concrete type using the current dynamic scope.
* Returns `{ schema: {}, resolvedTypeName: 'unknown' }` when no scope override exists.
*/
function resolveDynamicRef(anchorName, context, imports = []) {
	let scopeEntry = (context.dynamicScope ?? {})[anchorName];
	if (!scopeEntry) {
		const entry = getDynamicAnchorIndex(context).get(anchorName);
		const match = entry?.exactName ?? (entry?.count === 1 ? entry?.firstName : void 0);
		if (match) {
			const refInfo = getRefInfo(`#/components/schemas/${encodeJsonPointerSegment(match)}`, context);
			scopeEntry = {
				name: refInfo.name,
				schemaName: refInfo.originalName
			};
		}
	}
	if (!scopeEntry) return {
		schema: {},
		imports,
		resolvedTypeName: "unknown",
		schemaName: void 0
	};
	if (scopeEntry.isParameter) return {
		schema: {},
		imports,
		resolvedTypeName: scopeEntry.name,
		schemaName: void 0
	};
	if (scopeEntry.inlineSchema) return {
		schema: scopeEntry.inlineSchema,
		imports,
		resolvedTypeName: scopeEntry.name,
		schemaName: void 0
	};
	const resolvedTypeName = scopeEntry.name;
	const schemaRef = `#/components/schemas/${encodeJsonPointerSegment(scopeEntry.schemaName)}`;
	try {
		const { schema: resolvedSchema, imports: resolvedImports } = resolveRef({ $ref: schemaRef }, context, imports);
		return {
			schema: resolvedSchema,
			imports: resolvedImports,
			resolvedTypeName,
			schemaName: scopeEntry.schemaName
		};
	} catch {
		return {
			schema: {},
			imports,
			resolvedTypeName: "unknown",
			schemaName: void 0
		};
	}
}
/** Recursively resolves `$ref` entries in an examples array or record. */
function resolveExampleRefs(examples, context) {
	if (!examples) return;
	return Array.isArray(examples) ? examples.map((example) => {
		if (isObject(example) && !isInlineSchema(example)) {
			const { schema } = resolveRef(example, context);
			return schema.value;
		}
		return example;
	}) : (() => {
		const result = {};
		for (const [key, example] of Object.entries(examples)) result[key] = isObject(example) && !isInlineSchema(example) ? resolveRef(example, context).schema.value : example;
		return result;
	})();
}
//#endregion
//#region src/resolvers/value.ts
const schemaArrayKeys = [
	"allOf",
	"anyOf",
	"oneOf",
	"prefixItems"
];
const schemaObjectKeys = [
	"additionalProperties",
	"contains",
	"else",
	"if",
	"items",
	"not",
	"propertyNames",
	"then",
	"unevaluatedItems",
	"unevaluatedProperties"
];
const schemaMapKeys = [
	"$defs",
	"dependentSchemas",
	"patternProperties",
	"properties"
];
/**
* Recursively walks a schema value and returns `true` if any nested
* `$dynamicRef` resolves — via the current `context.dynamicScope` — to a
* schema *other* than `refName`.
*
* Used by `resolveValue` to decide whether a `$ref`'d schema must be
* instantiated with its bound type arguments rather than referenced by name.
*
* @param value   - The schema node (or sub-node) to inspect.
* @param context - Current resolution context, including the dynamic scope.
* @param refName - The resolved name of the enclosing `$ref` schema; dynamic
*                  refs that resolve to this same name are considered
*                  self-references and do not count as "scope-affected".
* @param seen    - Cycle-guard; tracks already-visited objects.
*/
function hasScopeAffectedDynamicRef(value, context, refName, seen = /* @__PURE__ */ new WeakSet()) {
	if (!value || typeof value !== "object") return false;
	if (!context.dynamicScope || Object.keys(context.dynamicScope).length === 0) return false;
	if (seen.has(value)) return false;
	seen.add(value);
	if (isDynamicReference(value) && value.$dynamicRef.startsWith("#")) {
		const anchorName = getDynamicAnchorName(value.$dynamicRef);
		if (anchorName) {
			const scopeEntry = context.dynamicScope[anchorName];
			if (scopeEntry && scopeEntry.name !== refName) return true;
		}
	}
	const schema = value;
	for (const key of schemaArrayKeys) {
		const items = schema[key];
		if (Array.isArray(items) && items.some((item) => hasScopeAffectedDynamicRef(item, context, refName, seen))) return true;
	}
	for (const key of schemaObjectKeys) if (hasScopeAffectedDynamicRef(schema[key], context, refName, seen)) return true;
	for (const key of schemaMapKeys) {
		const schemaMap = schema[key];
		if (schemaMap && typeof schemaMap === "object" && Object.values(schemaMap).some((item) => hasScopeAffectedDynamicRef(item, context, refName, seen))) return true;
	}
	return false;
}
/**
* Metadata `type` for a resolved component schema.
*
* A single non-null member of an array `type` is kept (`['string', 'null']`
* is `string`, `['object', 'null']` is `object`). A mixed array such as
* `['string', 'number']` is `unknown`, so composition does not treat it as
* an object and pull its keys into `unionAddMissingProperties`.
*/
function toResolverSchemaType(type) {
	if (!Array.isArray(type)) return type ?? "object";
	const nonNull = type.filter((member) => member !== "null");
	if (nonNull.length === 1) return nonNull[0];
	if (nonNull.length === 0) return "null";
	return "unknown";
}
function makeUnknownValue(originalSchema) {
	return {
		value: "unknown",
		imports: [],
		type: "unknown",
		isEnum: false,
		schemas: [],
		isRef: false,
		hasReadonlyProps: false,
		originalSchema,
		dependencies: []
	};
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
function resolveValue({ schema, name, context, formDataContext }) {
	if (isBooleanJsonSchema(schema)) return {
		...getScalar({
			item: schema,
			name,
			context,
			formDataContext
		}),
		originalSchema: schema,
		isRef: false
	};
	if (!isInlineSchema(schema)) {
		const alias = extractBoundAliasInfo(schema, context);
		if (alias) {
			const value = `${alias.genericName}<${alias.typeArgs.join(", ")}>`;
			const allImports = [{
				name: alias.genericName,
				schemaName: alias.genericName
			}, ...alias.imports];
			return {
				value,
				imports: allImports,
				type: "object",
				schemas: [],
				isEnum: false,
				originalSchema: schema,
				hasReadonlyProps: false,
				isRef: true,
				dependencies: allImports.map((i) => i.name)
			};
		}
		const refValue = schema.$ref;
		const { schema: schemaObject, imports } = resolveRef(schema, context);
		if (isBooleanJsonSchema(schemaObject)) return {
			...getScalar({
				item: schemaObject,
				name,
				context,
				formDataContext
			}),
			originalSchema: schemaObject,
			isRef: true
		};
		if (refValue && !isComponentRef(refValue)) {
			if (context.parents?.includes(refValue)) return {
				value: "unknown",
				imports: [],
				schemas: [],
				type: "unknown",
				isEnum: false,
				originalSchema: schemaObject,
				hasReadonlyProps: false,
				isRef: false,
				dependencies: []
			};
			return {
				...getScalar({
					item: schemaObject,
					name,
					context: {
						...context,
						parents: [...context.parents ?? [], refValue]
					},
					formDataContext
				}),
				originalSchema: schemaObject,
				isRef: false
			};
		}
		if (formDataContext?.urlEncoded && isBinaryScalarSchema(schemaObject)) return {
			...getScalar({
				item: schemaObject,
				name,
				context,
				formDataContext
			}),
			originalSchema: schemaObject,
			isRef: false
		};
		const resolvedImport = imports[0];
		let hasReadonlyProps = false;
		const refName = resolvedImport.name;
		let effectiveContext = context;
		const refAnchor = schemaObject.$dynamicAnchor;
		if (typeof refAnchor === "string" && context.dynamicScope?.[refAnchor] && context.dynamicScope[refAnchor].name !== refName && !context.dynamicScope[refAnchor].isParameter && !context.dynamicScope[refAnchor].inlineSchema) {
			const scopeEntry = context.dynamicScope[refAnchor];
			const allOf = ((context.spec.components?.schemas)?.[scopeEntry.schemaName])?.allOf;
			if (!(Array.isArray(allOf) && allOf.some((el) => {
				if (!el || typeof el !== "object") return false;
				const rec = el;
				if (typeof rec.$ref !== "string" || !isComponentRef(rec.$ref)) return false;
				const { name } = getRefInfo(rec.$ref, context);
				return name === refName;
			}))) {
				const filteredScope = Object.fromEntries(Object.entries(context.dynamicScope).filter(([key]) => key !== refAnchor));
				effectiveContext = {
					...context,
					dynamicScope: filteredScope
				};
			}
		}
		if (!effectiveContext.parents?.includes(refName) && hasScopeAffectedDynamicRef(schemaObject, effectiveContext, refName)) return {
			...getScalar({
				item: schemaObject,
				name: name ?? refName,
				context: {
					...effectiveContext,
					parents: [...effectiveContext.parents ?? [], refName]
				},
				formDataContext
			}),
			originalSchema: schemaObject,
			isRef: false
		};
		if (!effectiveContext.parents?.includes(refName)) hasReadonlyProps = getScalar({
			item: schemaObject,
			name: refName,
			context: {
				...effectiveContext,
				parents: [...effectiveContext.parents ?? [], refName]
			}
		}).hasReadonlyProps;
		const isAnyOfNullable = schemaObject.anyOf?.some((anyOfItem) => {
			if (!isInlineSchema(anyOfItem) || isBooleanJsonSchema(anyOfItem)) return false;
			return anyOfItem.type === "null" || Array.isArray(anyOfItem.type) && anyOfItem.type.includes("null");
		});
		const schemaType = schemaObject.type;
		const nullable = Array.isArray(schemaType) && schemaType.includes("null") || isAnyOfNullable ? " | null" : "";
		return {
			value: resolvedImport.name + nullable,
			imports: [{
				name: resolvedImport.name,
				schemaName: resolvedImport.schemaName
			}],
			type: toResolverSchemaType(schemaObject.type),
			schemas: [],
			isEnum: !!schemaObject.enum,
			originalSchema: schemaObject,
			hasReadonlyProps,
			isRef: true,
			dependencies: [resolvedImport.name]
		};
	}
	if (isDynamicReference(schema)) {
		const dynamicRef = schema.$dynamicRef;
		if (!dynamicRef.startsWith("#")) return makeUnknownValue(schema);
		const anchorName = getDynamicAnchorName(dynamicRef);
		if (!anchorName) return makeUnknownValue(schema);
		const { imports: resolvedImports, resolvedTypeName } = resolveDynamicRef(anchorName, context);
		if (resolvedTypeName === "unknown") return makeUnknownValue(schema);
		return {
			value: resolvedTypeName,
			imports: resolvedImports,
			type: "object",
			isEnum: false,
			schemas: [],
			isRef: true,
			hasReadonlyProps: false,
			originalSchema: schema,
			dependencies: [resolvedTypeName]
		};
	}
	return {
		...getScalar({
			item: schema,
			name,
			context,
			formDataContext
		}),
		originalSchema: schema,
		isRef: false
	};
}
//#endregion
//#region src/resolvers/object.ts
/**
* Wraps inline object type in a type alias.
* E.g. `{ foo: string }` → value becomes `FooBody`, schema gets `export type FooBody = { foo: string };`
*/
function createTypeAliasIfNeeded({ resolvedValue, propName, context }) {
	if (!propName) return;
	if (resolvedValue.isEnum || resolvedValue.type !== "object") return;
	const aliasPattern = context.output.override.aliasCombinedTypes ? String.raw`{|&|\|` : "{";
	if (!new RegExp(aliasPattern).test(resolvedValue.value)) return;
	const { originalSchema } = resolvedValue;
	if (isBooleanJsonSchema(originalSchema)) return;
	const doc = jsDoc(originalSchema);
	const isConstant = "const" in originalSchema;
	const model = isConstant ? `${doc}export const ${propName} = ${toJsLiteral(originalSchema.const)} as const;\n` : `${doc}export type ${propName} = ${resolvedValue.value};\n`;
	return {
		value: propName,
		imports: [{
			name: propName,
			isConstant
		}],
		schemas: [...resolvedValue.schemas, {
			name: propName,
			model,
			imports: resolvedValue.imports,
			dependencies: resolvedValue.dependencies,
			kind: "schema"
		}],
		isEnum: false,
		type: "object",
		isRef: resolvedValue.isRef,
		hasReadonlyProps: resolvedValue.hasReadonlyProps,
		dependencies: resolvedValue.dependencies
	};
}
function resolveObjectOriginal({ schema, propName, combined = false, context, formDataContext }) {
	const resolvedValue = resolveValue({
		schema,
		name: propName,
		context,
		formDataContext
	});
	const aliased = createTypeAliasIfNeeded({
		resolvedValue,
		propName,
		context
	});
	if (aliased) return {
		...aliased,
		originalSchema: resolvedValue.originalSchema
	};
	if (propName && resolvedValue.isEnum && !combined && !resolvedValue.isRef) {
		const doc = jsDoc(resolvedValue.originalSchema);
		const enumMembers = getEnumMembers(resolvedValue.originalSchema);
		const nullable = isSchemaNullable(resolvedValue.originalSchema);
		const { enumGenerationType } = context.output.override;
		const enumValue = getEnum(enumMembers, propName, nullable, enumGenerationType, context.output.override.namingConvention.enum);
		return {
			value: isEnumReferenceMissingNull(enumMembers, nullable, enumGenerationType) ? `${propName} | null` : propName,
			imports: [{ name: propName }],
			schemas: [...resolvedValue.schemas, {
				name: propName,
				model: doc + enumValue,
				imports: resolvedValue.imports,
				dependencies: resolvedValue.dependencies,
				kind: "enum"
			}],
			isEnum: false,
			type: "enum",
			originalSchema: resolvedValue.originalSchema,
			isRef: resolvedValue.isRef,
			hasReadonlyProps: resolvedValue.hasReadonlyProps,
			dependencies: [...resolvedValue.dependencies, propName]
		};
	}
	return resolvedValue;
}
const resolveObjectCacheMap = /* @__PURE__ */ new Map();
function resolveObject({ schema, propName, combined = false, context, formDataContext }) {
	const hashKey = JSON.stringify({
		schema,
		propName,
		combined,
		projectName: context.projectName ?? context.output.target,
		formDataContext,
		dynamicScope: context.dynamicScope
	});
	if (resolveObjectCacheMap.has(hashKey)) return resolveObjectCacheMap.get(hashKey);
	const result = resolveObjectOriginal({
		schema,
		propName,
		combined,
		context,
		formDataContext
	});
	resolveObjectCacheMap.set(hashKey, result);
	return result;
}
//#endregion
//#region src/getters/array.ts
/**
* Return the output type from an array
*
* @param item item with type === "array"
*/
function getArray({ schema, name, context, formDataContext }) {
	schema = toObjectSchema(schema);
	const schemaPrefixItems = schema.prefixItems;
	const schemaItems = schema.items;
	const schemaExample = schema.example;
	const schemaExamples = schema.examples;
	const itemPrefix = context.output.override.components.schemas.itemPrefix ?? "";
	const itemSuffix = context.output.override.components.schemas.itemSuffix ?? "";
	if (schemaPrefixItems) {
		const resolvedObjects = schemaPrefixItems.map((item, index) => resolveObject({
			schema: item,
			propName: name ? itemPrefix + name + itemSuffix + String(index) : void 0,
			context
		}));
		if (schemaItems) {
			const additional = resolveObject({
				schema: schemaItems,
				propName: name ? itemPrefix + name + itemSuffix + "Additional" : void 0,
				context
			});
			resolvedObjects.push({
				...additional,
				value: `...${additional.value}[]`
			});
		}
		return {
			type: "array",
			isEnum: false,
			isRef: false,
			value: `[${resolvedObjects.map((o) => o.value).join(", ")}]`,
			imports: resolvedObjects.flatMap((o) => o.imports),
			schemas: resolvedObjects.flatMap((o) => o.schemas),
			dependencies: resolvedObjects.flatMap((o) => o.dependencies),
			hasReadonlyProps: resolvedObjects.some((o) => o.hasReadonlyProps),
			example: schemaExample,
			examples: resolveExampleRefs(schemaExamples, context)
		};
	}
	if (schemaItems) {
		const resolvedObject = resolveObject({
			schema: schemaItems,
			propName: name ? itemPrefix + name + itemSuffix : void 0,
			context,
			formDataContext
		});
		return {
			value: `${schema.readOnly === true && !context.output.override.suppressReadonlyModifier ? "readonly " : ""}${resolvedObject.value.includes("|") || resolvedObject.value.includes("&") ? `(${resolvedObject.value})[]` : `${resolvedObject.value}[]`}`,
			imports: resolvedObject.imports,
			schemas: resolvedObject.schemas,
			dependencies: resolvedObject.dependencies,
			isEnum: false,
			type: "array",
			isRef: false,
			hasReadonlyProps: resolvedObject.hasReadonlyProps,
			example: schemaExample,
			examples: resolveExampleRefs(schemaExamples, context)
		};
	} else if (compareVersions(context.spec.openapi ?? "3.0.0", "3.1", ">=")) return {
		value: "unknown[]",
		imports: [],
		schemas: [],
		dependencies: [],
		isEnum: false,
		type: "array",
		isRef: false,
		hasReadonlyProps: false
	};
	else throw new Error(`All arrays must have an \`items\` key defined (name=${name}, schema=${JSON.stringify(schema)})`);
}
//#endregion
//#region src/generators/runtime-validation.ts
/**
* Builds the statement body shared by every `both` emission: `safeParse`, log
* the raw `ZodError` for production visibility, then re-throw so the failure
* still propagates through the client's native error channel.
*
* The raw `ZodError` is passed to `console.error` (no `prettifyError`/`flatten`)
* to stay agnostic across Zod 3 and Zod 4.
*
* `operationName` is interpolated into a single-quoted string literal. The
* default is a sanitized camelCase identifier, but `override.operationName` can
* return arbitrary strings, so backslashes and single quotes are escaped to
* keep the generated literal syntactically valid. Sanitized identifiers contain
* neither character, so common output is unchanged.
*/
const escapeSingleQuoted = (value) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
const buildGuardBody = (schemaRef, operationName, input, subject = "response") => `const result = ${schemaRef}.safeParse(${input}); if (!result.success) { console.error('[orval] ${escapeSingleQuoted(operationName)} ${subject} validation failed', result.error); throw result.error; } return result.data;`;
/**
* Emits the response-validation snippet for a single call site.
*
* The `throw` strategy is byte-identical to the historical inline
* `Schema.parse(...)` emission, which keeps existing snapshots unchanged.
*/
const emitResponseValidation = ({ schemaRef, operationName, strategy, context, inputExpression }) => {
	switch (context) {
		case "rxjs-map": return strategy === "both" ? `.pipe(map(data => { ${buildGuardBody(schemaRef, operationName, "data")} }))` : `.pipe(map(data => ${schemaRef}.parse(data)))`;
		case "clone-expression":
		case "fetch-assign":
			if (inputExpression === void 0) throw new Error(`emitResponseValidation: "${context}" requires an inputExpression`);
			return strategy === "both" ? `(() => { ${buildGuardBody(schemaRef, operationName, inputExpression)} })()` : `${schemaRef}.parse(${inputExpression})`;
		case "parse-fn": return strategy === "both" ? `(raw) => { ${buildGuardBody(schemaRef, operationName, "raw")} }` : `${schemaRef}.parse`;
	}
};
/**
* Emits an expression that parses a request body before it is sent. `throw`
* is a bare `Schema.parse(...)`; `both` logs the raw `ZodError` and re-throws,
* like its response counterpart.
*/
const emitRequestBodyValidation = ({ schemaRef, operationName, strategy, inputExpression, isOptional = false }) => {
	const parse = strategy === "both" ? `(() => { ${buildGuardBody(schemaRef, operationName, inputExpression, "request body")} })()` : `${schemaRef}.parse(${inputExpression})`;
	return isOptional ? `${inputExpression} === undefined ? undefined : ${parse}` : parse;
};
/**
* Normalizes the user-facing `runtimeValidation` config surface
* (`boolean | { strategy }`) into the canonical `{ enabled, strategy }` object
* consumed by the generators.
*
* Idempotent: an already-normalized value is returned unchanged, so it is safe
* to call on an inherited (already-normalized) value — e.g. when a per-operation
* `query` override inherits the normalized global default.
*/
const normalizeRuntimeValidation = (value) => {
	if (!value) return {
		enabled: false,
		strategy: "throw"
	};
	if (value === true) return {
		enabled: true,
		strategy: "throw"
	};
	if ("enabled" in value) return value;
	return {
		enabled: true,
		strategy: value.strategy ?? "throw"
	};
};
/**
* Angular variant of {@link normalizeRuntimeValidation}: also resolves the
* `requestBodies` opt-in, which only the object form can switch on.
* Idempotent, like the shared normalizer.
*/
const normalizeAngularRuntimeValidation = (value) => {
	if (typeof value !== "object") return {
		...normalizeRuntimeValidation(value),
		requestBodies: false
	};
	if ("enabled" in value) return value;
	return {
		...normalizeRuntimeValidation({ strategy: value.strategy ?? "throw" }),
		requestBodies: value.requestBodies ?? false
	};
};
/**
* Bare TypeScript definitions without a schema binding. When enabled, inline
* scalar responses get named schemas before reaching the client generators;
* `void`/`unknown` still have no schema to parse against.
*/
const RESPONSE_PRIMITIVE_TYPES = /* @__PURE__ */ new Set([
	"string",
	"number",
	"boolean",
	"void",
	"unknown"
]);
/**
* Indicates whether a response definition names a primitive (non-schema) type,
* which runtime validation skips.
*/
const isPrimitiveResponseType = (t) => t !== void 0 && RESPONSE_PRIMITIVE_TYPES.has(t);
const RESPONSE_SCALAR_SCHEMA_TYPES = /* @__PURE__ */ new Set([
	"string",
	"number",
	"integer",
	"boolean",
	"null"
]);
/**
* Whether an inline response describes scalar JSON data. Inspect the source
* schema rather than its TypeScript definition: `integer` and `number` both
* become `number`, while nullable scalars and enums need their full schema.
* Missing/unconstrained schemas and arrays are deliberately left alone.
*/
const isPrimitiveResponseSchema = (schema) => {
	if (typeof schema !== "object" || "$ref" in schema) return false;
	if (schema.type) {
		const types = Array.isArray(schema.type) ? schema.type : [schema.type];
		return types.length > 0 && types.every((type) => RESPONSE_SCALAR_SCHEMA_TYPES.has(type));
	}
	const combined = schema.anyOf ?? schema.oneOf ?? schema.allOf;
	if (combined) return combined.length > 0 && combined.every(isPrimitiveResponseSchema);
	const isScalar = (value) => value === null || [
		"string",
		"number",
		"boolean"
	].includes(typeof value);
	if (schema.enum) return schema.enum.length > 0 && schema.enum.every(isScalar);
	return "const" in schema && isScalar(schema.const);
};
/**
* Indicates whether the response imports carry a schema for the given type
* name — the precondition for emitting a `Schema.parse`/`safeParse` call.
*/
const hasSchemaImport = (imports, typeName) => typeName !== void 0 && imports.some((imp) => imp.name === typeName);
/**
* Maps a response type name to the identifier its Zod schema value is bound to
* at the call site. `Error` collides with the global constructor, so validated
* call sites reference that schema as `ErrorSchema`.
*/
const getSchemaValueRef = (typeName) => typeName === "Error" ? "ErrorSchema" : typeName;
/**
* Maps a schema type name to its Zod output-type alias (`${typeName}Output`),
* emitted next to every schema in zod-schemas mode. A validated response
* returns `zod.output` at runtime, so its declared type must reference this
* alias — the bare schema name aliases `zod.input`, which diverges under
* `coerce`, `useDates`, defaults and transforms.
*/
const getSchemaOutputTypeRef = (typeName) => `${typeName}Output`;
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
const rewriteImportsForResponseValidation = (imports, responseType, { includeOutputType = true } = {}) => [...imports.map((imp) => imp.name === responseType ? {
	...imp,
	values: true
} : imp), ...includeOutputType ? [{
	name: getSchemaOutputTypeRef(responseType),
	zodBaseName: responseType
}] : []];
/** A definition that is exactly one `[]` level over a bare identifier. */
const ARRAY_DEFINITION_PATTERN = /^([A-Za-z_$][\w$]*)\[]$/;
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
const getArrayResponseSchema = (imports, definition, toValueRef = (typeName) => typeName) => {
	if (definition === void 0) return void 0;
	const elementName = ARRAY_DEFINITION_PATTERN.exec(definition)?.[1];
	if (elementName === void 0 || isPrimitiveResponseType(elementName)) return;
	if (!imports.some((imp) => imp.name === elementName)) return void 0;
	return {
		elementName,
		schemaRef: `zod.array(${toValueRef(elementName)})`,
		outputTypeRef: `${getSchemaOutputTypeRef(elementName)}[]`
	};
};
/**
* Module specifier for the `zod` namespace import that composed array
* expressions reference. Mini ships its constructors from a separate entry
* point, and only the functional `zod.array(...)` form exists there — which is
* why the composed expression is built that way rather than as `Item.array()`.
*/
const getZodNamespaceImportSource = (override) => override?.zod.variant === "mini" ? "zod/mini" : "zod";
/** The namespace import a composed `zod.array(...)` expression requires. */
const getZodNamespaceImport = (override) => ({
	name: "zod",
	values: true,
	namespaceImport: true,
	importPath: getZodNamespaceImportSource(override)
});
//#endregion
//#region src/getters/res-req-types.ts
const getSchemaType$1 = (s) => isBooleanJsonSchema(s) ? void 0 : s.type;
const getSchemaCombined = (s) => isBooleanJsonSchema(s) ? void 0 : s.oneOf ?? s.anyOf ?? s.allOf;
const getSchemaOneOf = (s) => isBooleanJsonSchema(s) ? void 0 : s.oneOf;
const getSchemaAnyOf = (s) => isBooleanJsonSchema(s) ? void 0 : s.anyOf;
const getSchemaItems = (s) => isBooleanJsonSchema(s) ? void 0 : s.items;
const getSchemaRequired = (s) => isBooleanJsonSchema(s) ? void 0 : s.required;
const getSchemaProperties = (s) => isBooleanJsonSchema(s) ? void 0 : s.properties;
const resolveSchemaRef = (schema, context) => resolveRef(schema, context);
const resolveResponseOrRequestRef = (schema, context) => resolveRef(schema, context);
const formDataContentTypes = /* @__PURE__ */ new Set(["multipart/form-data"]);
const formUrlEncodedContentTypes = /* @__PURE__ */ new Set(["application/x-www-form-urlencoded"]);
function getResReqContentTypes({ mediaType, propName, context, isFormData, contentType, generatePrimitiveSchema }) {
	if (mediaType.schema === void 0 || mediaType.schema === null) return;
	const isFormUrlEncoded = formUrlEncodedContentTypes.has(contentType);
	const formDataContext = isFormData ? {
		atPart: false,
		encoding: mediaType.encoding ?? {}
	} : isFormUrlEncoded ? {
		atPart: false,
		encoding: mediaType.encoding ?? {},
		urlEncoded: true
	} : void 0;
	const resolvedObject = resolveObject({
		schema: mediaType.schema,
		propName,
		context,
		formDataContext
	});
	if (!isFormData && isBinaryContentType(contentType)) return {
		...resolvedObject,
		value: "Blob"
	};
	if (generatePrimitiveSchema && propName && isPrimitiveResponseSchema(mediaType.schema) && resolvedObject.value !== "Blob") {
		const existingSchema = resolvedObject.schemas.find(({ name }) => name === propName);
		return {
			...resolvedObject,
			value: propName,
			imports: [{ name: propName }],
			schemas: [...resolvedObject.schemas.filter(({ name }) => name !== propName), {
				name: propName,
				model: existingSchema?.model ?? `export type ${propName} = ${resolvedObject.value};\n`,
				imports: existingSchema?.imports ?? resolvedObject.imports,
				dependencies: existingSchema?.dependencies ?? resolvedObject.dependencies,
				kind: existingSchema?.kind ?? "schema",
				schema: resolvedObject.originalSchema
			}]
		};
	}
	return resolvedObject;
}
function getResReqTypes(responsesOrRequests, name, context, defaultType = "unknown", uniqueKey = (item) => item.value, generatePrimitiveSchemas = false) {
	return uniqueBy(responsesOrRequests.filter(([, res]) => Boolean(res)).map(([key, res]) => {
		if (!isInlineSchema(res)) {
			const { schema: bodySchema, imports: [{ name, schemaName }] } = resolveResponseOrRequestRef(res, context);
			const firstEntry = Object.entries(bodySchema.content ?? {}).at(0);
			if (!firstEntry) return [{
				value: name,
				imports: [{
					name,
					schemaName
				}],
				schemas: [],
				type: "unknown",
				isEnum: false,
				isRef: true,
				hasReadonlyProps: false,
				dependencies: [name],
				originalSchema: void 0,
				example: void 0,
				examples: void 0,
				key,
				contentType: ""
			}];
			const [contentType, mediaType] = firstEntry;
			const isFormData = formDataContentTypes.has(contentType);
			const isFormUrlEncoded = formUrlEncodedContentTypes.has(contentType);
			if (!isFormData && !isFormUrlEncoded || !mediaType.schema) return [{
				value: name,
				imports: [{
					name,
					schemaName
				}],
				schemas: [],
				type: "unknown",
				isEnum: false,
				isRef: true,
				hasReadonlyProps: false,
				dependencies: [name],
				originalSchema: mediaType.schema,
				example: mediaType.example,
				examples: resolveExampleRefs(mediaType.examples, context),
				key,
				contentType
			}];
			const isRequestBodyOptional = !("required" in bodySchema) || bodySchema.required !== true;
			const formData = isFormData ? getSchemaFormDataAndUrlEncoded({
				name,
				schemaObject: mediaType.schema,
				context,
				isRequestBodyOptional,
				isRef: true,
				encoding: mediaType.encoding
			}) : void 0;
			const formUrlEncoded = isFormUrlEncoded ? getSchemaFormDataAndUrlEncoded({
				name,
				schemaObject: mediaType.schema,
				context,
				isRequestBodyOptional,
				isUrlEncoded: true,
				isRef: true,
				encoding: mediaType.encoding
			}) : void 0;
			const additionalImports = getFormDataAdditionalImports({
				schemaObject: mediaType.schema,
				context
			});
			return [{
				value: name,
				imports: [{
					name,
					schemaName
				}, ...additionalImports],
				schemas: [],
				type: "unknown",
				isEnum: false,
				hasReadonlyProps: false,
				dependencies: [name],
				formData,
				formUrlEncoded,
				isRef: true,
				originalSchema: mediaType.schema,
				example: mediaType.example,
				examples: resolveExampleRefs(mediaType.examples, context),
				key,
				contentType
			}];
		}
		if (res.content) return Object.entries(res.content).map(([contentType, mediaType], index, arr) => {
			let propName = key ? sanitize(pascal(name) + pascal(key), {
				underscore: "_",
				whitespace: "_",
				dash: true,
				es5keyword: true,
				es5IdentifierName: true
			}) : void 0;
			if (propName && arr.length > 1) propName = propName + pascal(getNumberWord(index + 1));
			const isFormData = formDataContentTypes.has(contentType);
			const isFormUrlEncoded = formUrlEncodedContentTypes.has(contentType);
			let effectivePropName = propName;
			if (mediaType.schema && !isInlineSchema(mediaType.schema)) {
				const { imports } = resolveSchemaRef(mediaType.schema, context);
				if (imports[0]?.name) effectivePropName = imports[0].name;
			} else if ((isFormData || isFormUrlEncoded) && mediaType.schema) {
				const combinedRefs = getSchemaOneOf(mediaType.schema) ?? getSchemaAnyOf(mediaType.schema);
				if (combinedRefs) {
					const names = [];
					for (const ref of combinedRefs) {
						if (isInlineSchema(ref)) continue;
						const refName = resolveSchemaRef(ref, context).imports[0]?.name;
						if (refName) names.push(refName);
					}
					if (names.length > 0) effectivePropName = names.join("");
				}
			}
			const resolvedValue = getResReqContentTypes({
				mediaType,
				propName: effectivePropName,
				context,
				isFormData,
				contentType,
				generatePrimitiveSchema: generatePrimitiveSchemas && key.startsWith("2") && contentType.includes("json") && !contentType.includes("ndjson") && !contentType.includes("nd-json")
			});
			if (!resolvedValue) {
				if (isBinaryContentType(contentType)) return {
					value: "Blob",
					imports: [],
					schemas: [],
					type: "Blob",
					isEnum: false,
					key,
					isRef: false,
					hasReadonlyProps: false,
					contentType
				};
				return;
			}
			if (!isFormData && !isFormUrlEncoded || !effectivePropName || !mediaType.schema) return {
				...resolvedValue,
				imports: resolvedValue.imports,
				dependencies: resolvedValue.dependencies,
				contentType,
				example: mediaType.example,
				examples: resolveExampleRefs(mediaType.examples, context)
			};
			const formData = isFormData ? getSchemaFormDataAndUrlEncoded({
				name: effectivePropName,
				schemaObject: mediaType.schema,
				context,
				isRequestBodyOptional: !("required" in res) || res.required !== true,
				isRef: true,
				encoding: mediaType.encoding
			}) : void 0;
			const formUrlEncoded = isFormUrlEncoded ? getSchemaFormDataAndUrlEncoded({
				name: effectivePropName,
				schemaObject: mediaType.schema,
				context,
				isUrlEncoded: true,
				isRequestBodyOptional: !("required" in res) || res.required !== true,
				isRef: true,
				encoding: mediaType.encoding
			}) : void 0;
			const additionalImports = getFormDataAdditionalImports({
				schemaObject: mediaType.schema,
				context
			});
			return {
				...resolvedValue,
				imports: [...resolvedValue.imports, ...additionalImports],
				formData,
				formUrlEncoded,
				contentType,
				example: mediaType.example,
				examples: resolveExampleRefs(mediaType.examples, context)
			};
		}).filter(Boolean).map((x) => ({
			...x,
			key
		}));
		const swaggerSchema = "schema" in res ? res.schema : void 0;
		if (swaggerSchema) return [{
			...resolveObject({
				schema: swaggerSchema,
				propName: key ? sanitize(pascal(name) + pascal(key), {
					underscore: "_",
					whitespace: "_",
					dash: true,
					es5keyword: true,
					es5IdentifierName: true
				}) : void 0,
				context
			}),
			contentType: "application/json",
			key
		}];
		return [{
			value: defaultType,
			imports: [],
			schemas: [],
			type: defaultType,
			isEnum: false,
			dependencies: [],
			key,
			isRef: false,
			hasReadonlyProps: false,
			contentType: "application/json"
		}];
	}).flat(), uniqueKey);
}
/**
* Determine the responseType option based on success content types only.
* This avoids error-response content types influencing the responseType.
*/
function getSuccessResponseType(response) {
	const successContentTypes = response.types.success.map((t) => t.contentType).filter(Boolean);
	if (response.isBlob) return "blob";
	const hasJsonResponse = successContentTypes.some((contentType) => contentType.includes("json") || contentType.includes("+json"));
	const hasTextResponse = successContentTypes.some((contentType) => contentType.startsWith("text/") || contentType.includes("xml"));
	if (!hasJsonResponse && hasTextResponse) return "text";
}
/**
* Get the default content type from a list of content types.
* Priority: application/json > any JSON-like type > first in list
*
* @param contentTypes - Array of content types from OpenAPI spec
* @returns The default content type to use
*/
function getDefaultContentType(contentTypes) {
	if (contentTypes.length === 0) return "application/json";
	if (contentTypes.includes("application/json")) return "application/json";
	const jsonType = contentTypes.find((ct) => ct.includes("+json") || ct.includes("-json"));
	if (jsonType) return jsonType;
	return contentTypes[0];
}
function getFormDataAdditionalImports({ schemaObject, context }) {
	const { schema } = resolveSchemaRef(schemaObject, context);
	if (getSchemaType$1(schema) !== "object") return [];
	const combinedSchemas = getSchemaOneOf(schema) ?? getSchemaAnyOf(schema);
	if (!combinedSchemas) return [];
	return combinedSchemas.map((subSchema) => resolveSchemaRef(subSchema, context).imports[0]).filter(Boolean);
}
function getSchemaFormDataAndUrlEncoded({ name, schemaObject, context, isRequestBodyOptional, isUrlEncoded, isRef, encoding }) {
	const { schema, imports } = resolveSchemaRef(schemaObject, context);
	const propName = camel(!isRef && !isInlineSchema(schemaObject) ? imports[0].name : name);
	const variableName = isUrlEncoded ? "formUrlEncoded" : "formData";
	let form = isUrlEncoded ? `const ${variableName} = new URLSearchParams();\n` : `const ${variableName} = new FormData();\n`;
	const combinedSchemas = getSchemaCombined(schema);
	const schemaType = getSchemaType$1(schema);
	if (schemaType === "object" || schemaType === void 0 && combinedSchemas) {
		if (combinedSchemas) {
			if (!!getSchemaOneOf(schema) || !!getSchemaAnyOf(schema)) {
				const directProperties = getSchemaProperties(schema);
				const directKeys = directProperties ? Object.entries(directProperties).filter(([, value]) => {
					const resolved = resolveSchemaRef(value, context).schema;
					return isBooleanJsonSchema(resolved) || !resolved.readOnly;
				}).map(([key]) => key) : [];
				const skipLine = directKeys.length > 0 ? `  if ([${directKeys.map((k) => JSON.stringify(k)).join(", ")}].includes(key)) return;\n` : "";
				form += `Object.entries(${propName} ?? {}).forEach(([key, value]) => {\n`;
				form += skipLine;
				form += `  if (value !== undefined && value !== null) {\n`;
				if (isUrlEncoded) {
					form += `    if (Array.isArray(value)) {\n`;
					form += `      value.forEach(v => {\n`;
					form += `        ${variableName}.append(key, typeof v === 'object' ? JSON.stringify(v) : String(v));\n`;
					form += `      });\n`;
					form += `    } else if (typeof value === 'object') {\n`;
					form += `      ${variableName}.append(key, JSON.stringify(value));\n`;
					form += `    } else {\n`;
					form += `      ${variableName}.append(key, String(value));\n`;
					form += `    }\n`;
				} else {
					form += `    if ((typeof File !== 'undefined' && value instanceof File) || value instanceof Blob) {\n`;
					form += `      ${variableName}.append(key, value);\n`;
					form += `    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {\n`;
					form += `      ${variableName}.append(key, new Blob([Uint8Array.from(value)]));\n`;
					form += `    } else if (Array.isArray(value)) {\n`;
					form += `      value.forEach(v => {\n`;
					form += `        if ((typeof File !== 'undefined' && v instanceof File) || v instanceof Blob) {\n`;
					form += `          ${variableName}.append(key, v);\n`;
					form += `        } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(v)) {\n`;
					form += `          ${variableName}.append(key, new Blob([Uint8Array.from(v)]));\n`;
					form += `        } else {\n`;
					form += `          ${variableName}.append(key, typeof v === 'object' ? JSON.stringify(v) : String(v));\n`;
					form += `        }\n`;
					form += `      });\n`;
					form += `    } else if (typeof value === 'object') {\n`;
					form += `      ${variableName}.append(key, JSON.stringify(value));\n`;
					form += `    } else {\n`;
					form += `      ${variableName}.append(key, String(value));\n`;
					form += `    }\n`;
				}
				form += `  }\n`;
				form += `});\n`;
			} else {
				const combinedSchemasFormData = combinedSchemas.map((subSchema) => {
					const { schema: combinedSchema } = resolveSchemaRef(subSchema, context);
					return resolveSchemaPropertiesToFormData({
						schema: combinedSchema,
						variableName,
						propName,
						context,
						isRequestBodyOptional,
						encoding
					});
				}).filter(Boolean).join("\n");
				form += combinedSchemasFormData;
			}
		}
		if (getSchemaProperties(schema)) {
			const formDataValues = resolveSchemaPropertiesToFormData({
				schema,
				variableName,
				propName,
				context,
				isRequestBodyOptional,
				encoding
			});
			form += formDataValues;
		}
		return form;
	}
	if (getSchemaType$1(schema) === "array") {
		let valueStr = "value";
		const schemaItems = getSchemaItems(schema);
		if (schemaItems) {
			const { schema: resolvedItem } = resolveSchemaRef(schemaItems, context);
			const itemSchema = unwrapNullableSchema(resolvedItem, context);
			const itemType = getSchemaType$1(resolvedItem);
			if (isEffectivelyObjectSchema(itemSchema, context) || isEffectivelyArraySchema(itemSchema, context)) valueStr = "JSON.stringify(value)";
			else if (itemType === "number" || itemType === "integer" || itemType === "boolean") valueStr = "value.toString()";
		}
		return `${form}${propName}.forEach(value => ${variableName}.append('data', ${valueStr}))\n`;
	}
	const scalarType = getSchemaType$1(schema);
	if (scalarType === "number" || scalarType === "integer" || scalarType === "boolean") return `${form}${variableName}.append('data', ${propName}.toString())\n`;
	return `${form}${variableName}.append('data', ${propName})\n`;
}
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
function isEffectivelyObjectSchema(schema, context, seen = /* @__PURE__ */ new Set()) {
	if (isBooleanJsonSchema(schema)) return false;
	if (seen.has(schema)) return false;
	seen.add(schema);
	if (schema.type === "object" || Array.isArray(schema.type) && schema.type.includes("object")) return true;
	if (schema.properties || schema.additionalProperties) return true;
	const schemaAllOf = schema.allOf;
	if (Array.isArray(schemaAllOf)) return schemaAllOf.some((member) => {
		const { schema: resolved } = resolveSchemaRef(member, context);
		return isEffectivelyObjectSchema(resolved, context, seen);
	});
	return false;
}
/**
* Array counterpart of {@link isEffectivelyObjectSchema}: `type: array`
* either on the schema itself or behind its `allOf` members.
*/
function isEffectivelyArraySchema(schema, context, seen = /* @__PURE__ */ new Set()) {
	if (isBooleanJsonSchema(schema)) return false;
	if (seen.has(schema)) return false;
	seen.add(schema);
	if (schema.type === "array") return true;
	const schemaAllOf = schema.allOf;
	return Array.isArray(schemaAllOf) && schemaAllOf.some((member) => {
		const { schema: resolved } = resolveSchemaRef(member, context);
		return isEffectivelyArraySchema(resolved, context, seen);
	});
}
/**
* The only non-null branch of an `anyOf`/`oneOf` wrapper, e.g.
* `anyOf: [{ $ref }, { type: 'null' }]`, which is how an OAS 3.0
* `nullable: true` next to a `$ref` or `allOf` arrives after the upgrade.
* A schema that is typed or object-shaped on its own is returned as is.
*/
function unwrapNullableSchema(schema, context) {
	if (isBooleanJsonSchema(schema) || schema.type !== void 0 || isEffectivelyObjectSchema(schema, context)) return schema;
	const branches = (schema.anyOf ?? schema.oneOf ?? []).map((branch) => resolveSchemaRef(branch, context).schema).filter((branch) => !isNullSchema(branch));
	return branches.length === 1 ? branches[0] : schema;
}
/**
* Collects a schema's own `properties`, merged with any `properties`
* reachable through `allOf` composition (recursively, following `$ref`s).
* A pure wrapper schema (`{ allOf: [{ $ref: ... }] }`) has no `properties`
* of its own — its fields only exist behind the allOf member — so a plain
* `schema.properties` read misses them entirely.
*/
function collectPropertiesThroughAllOf(schema, context, seen = /* @__PURE__ */ new Set()) {
	if (isBooleanJsonSchema(schema)) return {};
	if (seen.has(schema)) return {};
	seen.add(schema);
	const ownProps = getSchemaProperties(schema) ?? {};
	const schemaAllOf = schema.allOf;
	if (!Array.isArray(schemaAllOf)) return ownProps;
	let merged = {};
	for (const member of schemaAllOf) {
		const { schema: resolved } = resolveSchemaRef(member, context);
		merged = {
			...merged,
			...collectPropertiesThroughAllOf(resolved, context, seen)
		};
	}
	return {
		...merged,
		...ownProps
	};
}
/**
* Same reasoning as {@link collectPropertiesThroughAllOf}, but for
* `required`: a pure `allOf` wrapper schema has no `required` array of its
* own, so a plain `schema.required` read loses required-ness for every
* field that only exists behind the allOf composition.
*/
function collectRequiredThroughAllOf(schema, context, seen = /* @__PURE__ */ new Set()) {
	if (isBooleanJsonSchema(schema)) return [];
	if (seen.has(schema)) return [];
	seen.add(schema);
	const ownRequired = getSchemaRequired(schema) ?? [];
	const schemaAllOf = schema.allOf;
	if (!Array.isArray(schemaAllOf)) return ownRequired;
	return [...schemaAllOf.flatMap((member) => {
		const { schema: resolved } = resolveSchemaRef(member, context);
		return collectRequiredThroughAllOf(resolved, context, seen);
	}), ...ownRequired];
}
function resolveSchemaPropertiesToFormData({ schema, variableName, propName, context, isRequestBodyOptional, keyPrefix = "", depth = 0, encoding, ancestors = /* @__PURE__ */ new Set() }) {
	let formDataValues = "";
	const nestedAncestors = new Set(ancestors).add(schema);
	const isUrlEncoded = variableName === "formUrlEncoded";
	const schemaProps = collectPropertiesThroughAllOf(schema, context);
	const propertyConvention = context.output.override.namingConvention?.properties;
	const collisionKeys = getPropertyNameCollisionKeys(Object.keys(schemaProps), propertyConvention ? (name) => conventionName(name, propertyConvention) : void 0);
	for (const [key, value] of Object.entries(schemaProps)) {
		const { schema: property } = resolveSchemaRef(value, context);
		if (isBooleanJsonSchema(property)) continue;
		const escapedKey = key.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
		if (property.readOnly) continue;
		let formDataValue = "";
		const fieldEncoding = depth === 0 ? encoding?.[key] : void 0;
		const partContentType = fieldEncoding?.contentType;
		const propertyConvention = context.output.override.namingConvention?.properties;
		const accessorKey = propertyConvention && !collisionKeys.has(key) ? conventionName(key, propertyConvention) : key;
		const formattedConvertedKeyPrefix = isRequestBodyOptional ? keyword.isIdentifierNameES5(accessorKey) ? "?" : "?." : "";
		const formattedConvertedKey = keyword.isIdentifierNameES5(accessorKey) ? `.${accessorKey}` : `[${getKey(accessorKey)}]`;
		const valueKey = `${propName}${formattedConvertedKeyPrefix}${formattedConvertedKey}`;
		const nonOptionalValueKey = `${propName}${formattedConvertedKey}`;
		const fileType = getFormDataFieldFileType(property, partContentType);
		const effectiveContentType = partContentType ?? property.contentMediaType;
		const valueSchema = unwrapNullableSchema(property, context);
		const valueType = getSchemaType$1(valueSchema);
		if (isUrlEncoded && (fileType || property.format === "binary")) formDataValue = `${variableName}.append(\`${keyPrefix}${escapedKey}\`, ${nonOptionalValueKey});\n`;
		else if (fileType === "binary" || property.format === "binary") formDataValue = `${variableName}.append(\`${keyPrefix}${escapedKey}\`, ${nonOptionalValueKey});\n`;
		else if (fileType === "text") formDataValue = `${variableName}.append(\`${keyPrefix}${escapedKey}\`, ${nonOptionalValueKey} instanceof Blob ? ${nonOptionalValueKey} : new Blob([${nonOptionalValueKey}], { type: '${jsStringLiteralEscape(effectiveContentType ?? "")}' }));\n`;
		else if (isEffectivelyObjectSchema(valueSchema, context)) {
			if (isUrlEncoded && fieldEncoding?.style === "deepObject") formDataValue = `${nonOptionalValueKey} && Object.entries(${nonOptionalValueKey}).forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            ${variableName}.append(\`${keyPrefix}${escapedKey}[\${k}]\`, typeof v === 'object' ? JSON.stringify(v) : String(v));
          }
        });\n`;
			else formDataValue = context.output.override.formData.arrayHandling === FormDataArrayHandling.EXPLODE && !nestedAncestors.has(valueSchema) ? resolveSchemaPropertiesToFormData({
				schema: valueSchema,
				variableName,
				propName: nonOptionalValueKey,
				context,
				isRequestBodyOptional,
				keyPrefix: `${keyPrefix}${escapedKey}.`,
				depth: depth + 1,
				encoding,
				ancestors: nestedAncestors
			}) : `${variableName}.append(\`${keyPrefix}${escapedKey}\`, JSON.stringify(${nonOptionalValueKey}));\n`;
		} else if (valueType === "array" || Array.isArray(valueType) && valueType.includes("array")) {
			let valueStr = "value";
			let hasNonPrimitiveChild = false;
			const propertyItems = getSchemaItems(valueSchema);
			if (propertyItems) {
				const { schema: resolvedItem } = resolveSchemaRef(propertyItems, context);
				const itemSchema = unwrapNullableSchema(resolvedItem, context);
				if (isEffectivelyObjectSchema(itemSchema, context) || isEffectivelyArraySchema(itemSchema, context)) {
					const resolvedValue = context.output.override.formData.arrayHandling === FormDataArrayHandling.EXPLODE && !nestedAncestors.has(itemSchema) ? resolveSchemaPropertiesToFormData({
						schema: itemSchema,
						variableName,
						propName: "value",
						context,
						isRequestBodyOptional,
						keyPrefix: `${keyPrefix}${escapedKey}[\${index${depth > 0 ? depth : ""}}].`,
						depth: depth + 1,
						ancestors: nestedAncestors
					}) : "";
					if (resolvedValue) {
						hasNonPrimitiveChild = true;
						const body = isSchemaNullable(resolvedItem) ? `if (value !== null && value !== undefined) {\n ${resolvedValue} }\n` : resolvedValue;
						formDataValue = `${valueKey}.forEach((value, index${depth > 0 ? depth : ""}) => {
    ${body}});\n`;
					} else valueStr = "JSON.stringify(value)";
				} else {
					const itemType = getSchemaType$1(resolvedItem);
					if (itemType === "number" || Array.isArray(itemType) && itemType.includes("number") || itemType === "integer" || Array.isArray(itemType) && itemType.includes("integer") || itemType === "boolean" || Array.isArray(itemType) && itemType.includes("boolean")) valueStr = "value.toString()";
				}
			}
			if (context.output.override.formData.arrayHandling === FormDataArrayHandling.EXPLODE) {
				if (!hasNonPrimitiveChild) formDataValue = `${valueKey}.forEach((value, index${depth > 0 ? depth : ""}) => ${variableName}.append(\`${keyPrefix}${escapedKey}[\${index${depth > 0 ? depth : ""}}]\`, ${valueStr}));\n`;
			} else formDataValue = `${valueKey}.forEach(value => ${variableName}.append(\`${keyPrefix}${escapedKey}${context.output.override.formData.arrayHandling === FormDataArrayHandling.SERIALIZE_WITH_BRACKETS ? "[]" : ""}\`, ${valueStr}));\n`;
		} else if ((() => {
			const propType = getSchemaType$1(property);
			return propType === "number" || Array.isArray(propType) && propType.includes("number") || propType === "integer" || Array.isArray(propType) && propType.includes("integer") || propType === "boolean" || Array.isArray(propType) && propType.includes("boolean");
		})()) formDataValue = `${variableName}.append(\`${keyPrefix}${escapedKey}\`, ${nonOptionalValueKey}.toString())\n`;
		else formDataValue = `${variableName}.append(\`${keyPrefix}${escapedKey}\`, ${nonOptionalValueKey});\n`;
		let existSubSchemaNullable = false;
		const combine = getSchemaCombined(property);
		if (combine) {
			const subSchemas = combine.map((c) => resolveObject({
				schema: c,
				combined: true,
				context
			}));
			if (subSchemas.some((subSchema) => {
				return [
					"number",
					"integer",
					"boolean"
				].includes(subSchema.type);
			})) formDataValue = `${variableName}.append(\`${escapedKey}\`, ${nonOptionalValueKey}.toString())\n`;
			if (subSchemas.some((subSchema) => {
				return subSchema.type === "null";
			})) existSubSchemaNullable = true;
		}
		const isRequired = collectRequiredThroughAllOf(schema, context)?.includes(key) && !isRequestBodyOptional;
		const propType = getSchemaType$1(property);
		if (Array.isArray(propType) && propType.includes("null") || existSubSchemaNullable) {
			if (isRequired) {
				formDataValues += `if(${valueKey} !== null) {\n ${formDataValue} }\n`;
				continue;
			}
			formDataValues += `if(${valueKey} !== undefined && ${nonOptionalValueKey} !== null) {\n ${formDataValue} }\n`;
			continue;
		}
		if (isRequired) {
			formDataValues += formDataValue;
			continue;
		}
		formDataValues += `if(${valueKey} !== undefined) {\n ${formDataValue} }\n`;
	}
	return formDataValues;
}
//#endregion
//#region src/getters/body.ts
function buildBody(filteredBodyTypes, requestBody, operationName, context) {
	const imports = filteredBodyTypes.flatMap(({ imports }) => imports);
	const schemas = filteredBodyTypes.flatMap(({ schemas }) => schemas);
	const definition = filteredBodyTypes.map(({ value }) => value).join(" | ");
	const nonReadonlyDefinition = filteredBodyTypes.some((x) => x.hasReadonlyProps) && definition && context.output.override.preserveReadonlyRequestBodies !== "preserve" ? `NonReadonly<${definition}>` : definition;
	let implementation = generalJSTypesWithArray.includes(definition.toLowerCase()) || filteredBodyTypes.length > 1 ? camel(operationName) + context.output.override.components.requestBodies.suffix : camel(definition);
	const overrideName = getRequestBodyExtensionName(requestBody, context);
	if (overrideName) implementation = camel(overrideName);
	let isOptional = false;
	if (implementation) {
		implementation = sanitize(implementation, {
			underscore: "_",
			whitespace: "_",
			dash: true,
			es5keyword: true,
			es5IdentifierName: true
		});
		if (isInlineSchema(requestBody)) isOptional = requestBody.required !== true;
		else {
			const { schema: bodySchema } = resolveRef(requestBody, context);
			isOptional = bodySchema.required !== true;
		}
	}
	return {
		originalSchema: requestBody,
		definition: nonReadonlyDefinition,
		isBlob: filteredBodyTypes.some((t) => !!t.contentType && isBinaryContentType(t.contentType) || t.originalSchema !== void 0 && !isBooleanJsonSchema(t.originalSchema) && (t.originalSchema.format === "binary" || t.originalSchema.contentMediaType === "application/octet-stream" && !t.originalSchema.contentEncoding)),
		implementation,
		imports,
		schemas,
		isOptional,
		...filteredBodyTypes.length === 1 ? {
			formData: filteredBodyTypes[0].formData,
			formUrlEncoded: filteredBodyTypes[0].formUrlEncoded,
			contentType: filteredBodyTypes[0].contentType
		} : {
			formData: "",
			formUrlEncoded: "",
			contentType: ""
		}
	};
}
function getBody({ requestBody, operationName, context, contentType }) {
	return buildBody(filterByContentType(getResReqTypes([[context.output.override.components.requestBodies.suffix, requestBody]], operationName, context), contentType), requestBody, operationName, context);
}
/**
* Returns per-content-type bodies when `splitByContentType` is enabled.
* Each entry includes a `contentTypeSuffix` for generating distinct function names.
*/
function getBodiesByContentType({ requestBody, operationName, context, contentType }) {
	const filteredBodyTypes = filterByContentType(getResReqTypes([[context.output.override.components.requestBodies.suffix, requestBody]], operationName, context, void 0, (item) => `${item.value}::${item.contentType}`), contentType);
	if (filteredBodyTypes.length <= 1) return [{
		...buildBody(filteredBodyTypes, requestBody, operationName, context),
		contentTypeSuffix: ""
	}];
	const usedSuffixes = /* @__PURE__ */ new Set();
	return filteredBodyTypes.map((bodyType) => {
		const baseSuffix = getContentTypeSuffix(bodyType.contentType);
		let suffix = baseSuffix;
		for (let n = 2; usedSuffixes.has(suffix); n++) suffix = `${baseSuffix}${n}`;
		usedSuffixes.add(suffix);
		return {
			...buildBody([bodyType], requestBody, operationName, context),
			contentTypeSuffix: suffix
		};
	});
}
function getRequestBodyExtensionName(requestBody, context) {
	let value;
	if (!isInlineSchema(requestBody)) {
		const { schema } = resolveRef(requestBody, context);
		value = schema?.["x-codegen-request-body-name"];
	} else value = requestBody?.["x-codegen-request-body-name"];
	return typeof value === "string" ? value : void 0;
}
const CONTENT_TYPE_SUFFIX_MAP = {
	"application/json": "Json",
	"multipart/form-data": "FormData",
	"application/x-www-form-urlencoded": "UrlEncoded",
	"text/plain": "Text",
	"application/xml": "Xml",
	"text/xml": "Xml",
	"application/octet-stream": "Blob"
};
function getContentTypeSuffix(contentType) {
	if (Object.hasOwn(CONTENT_TYPE_SUFFIX_MAP, contentType)) return CONTENT_TYPE_SUFFIX_MAP[contentType];
	return (contentType.split("/")[1] ?? contentType).split(/[-+.]/).map((part) => part.replaceAll(/[^A-Za-z0-9_$]/g, "")).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("") || "Content";
}
//#endregion
//#region src/getters/discriminators.ts
function resolveDiscriminators(schemas, context) {
	const transformedSchemas = schemas;
	for (const schema of Object.values(transformedSchemas)) {
		if (isBooleanJsonSchema(schema)) continue;
		const discriminator = schema.discriminator;
		if (!schema.oneOf && Array.isArray(discriminator?.oneOf)) schema.oneOf = discriminator.oneOf;
		if (schema.discriminator?.mapping) {
			const { mapping, propertyName } = schema.discriminator;
			for (const [mappingKey, mappingValue] of Object.entries(mapping)) {
				let subTypeSchema;
				try {
					const { originalName } = getRefInfo(mappingValue, context);
					const name = pascal(originalName);
					subTypeSchema = transformedSchemas[originalName] ?? transformedSchemas[name];
				} catch {
					subTypeSchema = transformedSchemas[mappingValue];
				}
				if (typeof propertyName !== "string" || !subTypeSchema || isBooleanJsonSchema(subTypeSchema)) continue;
				const property = subTypeSchema.properties?.[propertyName];
				if (isBooleanJsonSchema(property)) continue;
				if (property && Array.isArray(property.allOf) && property.allOf.length === 1 && !isInlineSchema(property.allOf[0])) continue;
				const schemaProperty = property && isInlineSchema(property) ? property : void 0;
				const enumProperty = schemaProperty ? getPropertySafe(schemaProperty, "enum") : {
					hasProperty: false,
					value: void 0
				};
				const enumValues = enumProperty.hasProperty && Array.isArray(enumProperty.value) ? enumProperty.value : void 0;
				const propertyType = schemaProperty?.type ?? "string";
				let typedMappingKey = mappingKey;
				if (propertyType === "boolean") typedMappingKey = mappingKey === "true";
				else if (propertyType === "number" || propertyType === "integer") {
					const parsed = Number(mappingKey);
					if (!Number.isNaN(parsed)) typedMappingKey = parsed;
				}
				const mergedEnumValues = [...(enumValues ?? []).filter((value) => value !== typedMappingKey), typedMappingKey];
				const mergedProperty = {
					...schemaProperty,
					type: propertyType,
					enum: mergedEnumValues
				};
				delete mergedProperty.const;
				subTypeSchema.properties = {
					...subTypeSchema.properties,
					[propertyName]: mergedProperty
				};
				subTypeSchema.required = [.../* @__PURE__ */ new Set([...subTypeSchema.required ?? [], propertyName])];
			}
		}
	}
	for (const [parentName, parentSchema] of Object.entries(transformedSchemas)) {
		if (isBooleanJsonSchema(parentSchema)) continue;
		const variants = parentSchema.oneOf ?? parentSchema.anyOf;
		if (!variants || !parentSchema.discriminator) continue;
		const { propertyName, mapping } = parentSchema.discriminator;
		if (!propertyName) continue;
		const mappedRefs = mapping ? Object.values(mapping) : [];
		const variantArrayRefs = variants.filter((item) => !isBooleanJsonSchema(item) && typeof item.$ref === "string").map((item) => item.$ref);
		const variantRefs = [.../* @__PURE__ */ new Set([...mappedRefs, ...variantArrayRefs])];
		const parentProperties = parentSchema.properties;
		const parentRequired = parentSchema.required;
		const inheritableProps = {};
		if (parentProperties) {
			for (const [key, value] of Object.entries(parentProperties)) if (key !== propertyName) inheritableProps[key] = value;
		}
		const inheritableRequired = parentRequired?.filter((key) => key !== propertyName);
		const hasInheritableProps = Object.keys(inheritableProps).length > 0;
		for (const mappingValue of variantRefs) {
			let variantSchema;
			try {
				const { originalName } = getRefInfo(mappingValue, context);
				const name = pascal(originalName);
				variantSchema = transformedSchemas[originalName] ?? transformedSchemas[name];
			} catch {
				variantSchema = transformedSchemas[mappingValue];
			}
			if (!variantSchema || isBooleanJsonSchema(variantSchema)) continue;
			const variantAllOf = variantSchema.allOf;
			if (!variantAllOf) continue;
			const rewritten = [];
			for (const item of variantAllOf) {
				if (isInlineSchema(item) || !item.$ref) {
					rewritten.push(item);
					continue;
				}
				let refOriginalName;
				try {
					refOriginalName = getRefInfo(item.$ref, context).originalName;
				} catch {
					refOriginalName = void 0;
				}
				if (!(refOriginalName === parentName || refOriginalName !== void 0 && pascal(refOriginalName) === pascal(parentName))) {
					rewritten.push(item);
					continue;
				}
				const inlinedParent = { ...parentSchema };
				delete inlinedParent.oneOf;
				delete inlinedParent.discriminator;
				delete inlinedParent.allOf;
				delete inlinedParent.anyOf;
				if (hasInheritableProps) inlinedParent.properties = { ...inheritableProps };
				else delete inlinedParent.properties;
				if (inheritableRequired && inheritableRequired.length > 0) inlinedParent.required = [...inheritableRequired];
				else delete inlinedParent.required;
				if (Object.keys(inlinedParent).filter((key) => key !== "type").length > 0) rewritten.push(inlinedParent);
			}
			if (rewritten.length === 0) delete variantSchema.allOf;
			else variantSchema.allOf = rewritten;
		}
	}
	return transformedSchemas;
}
//#endregion
//#region src/getters/form-data-components.ts
const MULTIPART_CONTENT_TYPE = "multipart/form-data";
const SCHEMA_REF_PREFIX = "#/components/schemas/";
const VERBS = new Set(Object.values(Verbs));
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
function getFormDataComponentContexts(context) {
	const encodings = /* @__PURE__ */ new Map();
	const requestBodies = context.spec.components?.requestBodies ?? {};
	for (const requestBody of Object.values(requestBodies)) indexRequestBody(requestBody, context, encodings);
	for (const pathItem of Object.values(context.spec.paths ?? {})) {
		if (!pathItem) continue;
		for (const [verb, operation] of Object.entries(pathItem)) {
			if (!VERBS.has(verb)) continue;
			const requestBody = operation?.requestBody;
			if (requestBody) indexRequestBody(requestBody, context, encodings);
		}
	}
	return new Map([...encodings].map(([schemaName, encoding]) => [schemaName, {
		atPart: false,
		encoding
	}]));
}
function indexRequestBody(requestBody, context, encodings) {
	if (!isInlineSchema(requestBody)) return;
	const mediaType = requestBody.content[MULTIPART_CONTENT_TYPE];
	const schema = mediaType?.schema;
	if (!schema || isBooleanJsonSchema(schema) || typeof schema.$ref !== "string" || !schema.$ref.startsWith(SCHEMA_REF_PREFIX) || !isComponentRef(schema.$ref)) return;
	const { originalName } = getRefInfo(schema.$ref, context);
	const encoding = mediaType.encoding ?? {};
	const indexed = encodings.get(originalName);
	if (!indexed) {
		encodings.set(originalName, { ...encoding });
		return;
	}
	for (const [part, partEncoding] of Object.entries(encoding)) indexed[part] ??= partEncoding;
}
//#endregion
//#region src/getters/operation.ts
function getOperationId(operation, route, verb) {
	if (isString(operation.operationId)) return operation.operationId;
	return pascal([verb, ...route.split("/").map((p) => sanitize(p, {
		dash: true,
		underscore: "-",
		dot: "-",
		whitespace: "-"
	}))].join("-"));
}
//#endregion
//#region src/getters/parameters.ts
function getParameters({ parameters, context }) {
	const result = {
		path: [],
		query: [],
		header: []
	};
	for (const p of parameters) if (!isInlineSchema(p)) {
		const { schema } = resolveRef(p, context);
		const parameter = schema;
		const location = parameter.in;
		if (location === "path" || location === "query" || location === "header") {
			const componentRefInfo = p.$ref && isComponentRef(p.$ref) ? getRefInfo(p.$ref, context) : void 0;
			const safeImports = componentRefInfo ? [{
				name: componentRefInfo.name,
				schemaName: componentRefInfo.originalName
			}] : [];
			result[location].push({
				parameter,
				imports: safeImports
			});
		}
	} else if (p.in === "query" || p.in === "path" || p.in === "header") result[p.in].push({
		parameter: p,
		imports: []
	});
	for (const location of [
		"path",
		"query",
		"header"
	]) result[location] = [...new Map(result[location].map((entry) => [location === "header" ? entry.parameter.name?.toLowerCase() : entry.parameter.name, entry])).values()];
	return result;
}
//#endregion
//#region src/getters/route.ts
function isBaseUrlRuntime(baseUrl) {
	return isObject(baseUrl) && "runtime" in baseUrl && typeof baseUrl.runtime === "string";
}
function isVariableRuntimeValue(value) {
	return isObject(value) && "runtime" in value;
}
/**
* Wraps a runtime expression for generated URL template literals.
* Pass the expression only (e.g. `process.env.API_BASE_URL`), not a `${...}` fragment.
*/
function runtimeExpressionToUrlPrefix(expression) {
	const t = expression.trim();
	if (!t) return "";
	return "${" + t + "}";
}
const PATH_PARAM_NAME_REGEX = /\{([\w.*-]+)\}/y;
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
const parseRoutePath = (path) => {
	const tokens = [];
	let literal = "";
	let index = 0;
	const flushLiteral = () => {
		if (literal) {
			tokens.push({
				kind: "literal",
				value: literal
			});
			literal = "";
		}
	};
	while (index < path.length) {
		const char = path[index];
		if (char === "$" && path[index + 1] === "{") {
			literal += "${";
			index += 2;
			continue;
		}
		if (char === "{") {
			PATH_PARAM_NAME_REGEX.lastIndex = index;
			const match = PATH_PARAM_NAME_REGEX.exec(path);
			if (match) {
				flushLiteral();
				tokens.push({
					kind: "param",
					name: match[1]
				});
				index += match[0].length;
				continue;
			}
		}
		literal += char;
		index++;
	}
	flushLiteral();
	return tokens;
};
const ensureLeadingSlash = (path) => path && !path.startsWith("/") ? `/${path}` : path;
/**
* Sanitizes an OpenAPI path-parameter name while preserving the spec's
* spelling: keeps word characters, underscores, dashes and dots, strips
* everything else, and prefixes ES5 keywords with an underscore. Use this
* when the emitted name must match the spec (e.g. Hono routes).
*/
const sanitizePathParamName = (name) => sanitize(name, {
	es5keyword: true,
	underscore: true,
	dash: true,
	dot: true
});
/**
* Derives the generated JS identifier for an OpenAPI path-parameter name
* (`scope.id` → `scopeId`, `_id` → `id`, `class` → `_class`). This is the
* single source of truth for param variable names: the emitted route
* interpolations, the generated function arguments and the spec-parameter
* matching must all agree on it.
*/
const camelPathParamName = (name) => sanitize(camel(name), { es5keyword: true });
/**
* Converts every `{param}` in an OpenAPI path to `:param` (Hono/MSW style
* routes). `formatParamName` maps the raw OpenAPI parameter name to the
* emitted one (`sanitizePathParamName` or `camelPathParamName`).
*/
const toColonRoutePath = (path, formatParamName) => parseRoutePath(ensureLeadingSlash(path)).map((token) => token.kind === "param" ? `:${formatParamName(token.name)}` : token.value).join("");
const esc = (str) => jsesc(str, {
	quotes: "backtick",
	wrap: false
});
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
const escapeRouteForSingleQuotes = (route) => route.replaceAll("'", String.raw`\'`);
/**
* Converts an OpenAPI path (`{param}`) to a template-literal route (`${param}`),
* escaping static text with jsesc for safe embedding in backtick strings.
* The `route` arg must be a raw OpenAPI path; a non-empty route always emits
* with a leading `/`.
*/
function getRoute(route) {
	return parseRoutePath(ensureLeadingSlash(route)).map((token) => token.kind === "param" ? `\${${camelPathParamName(token.name)}}` : esc(token.value)).join("");
}
/**
* Resolves a concrete base URL from an OpenAPI specification's `servers`
* field, applying the same `index`/`variables` selection semantics as
* `BaseUrlFromSpec`.
*
* Unlike `getFullRoute`'s `BaseUrlFromSpec` handling, this returns `''` when
* `servers` is missing or empty instead of throwing — callers that want a
* relative-URL fallback (e.g. the Angular DI base-url token) can use this
* directly, while `getFullRoute` still throws for its own
* `getBaseUrlFromSpecification` path to preserve existing behavior.
*
* The returned value is NOT escaped for embedding in a template literal —
* callers that splice it into generated backtick source (e.g. `getFullRoute`)
* must escape it themselves; callers that embed it via `JSON.stringify`
* (e.g. the Angular DI base-url token file) should use the raw value as-is.
*/
const VARIABLE_MARKER_PREFIX = "__ORVAL_RT_";
/** Deterministic djb2 hash so markers are opaque yet stable across runs. */
function hashString(value) {
	let hash = 5381;
	for (let i = 0; i < value.length; i++) hash = (hash << 5) + hash + value.charCodeAt(i) | 0;
	return (hash >>> 0).toString(36);
}
/**
* Collision-resistant opaque marker for a runtime server variable. The hash
* of the full server URL plus the variable key makes accidental matches with
* literal URL text practically impossible, while staying deterministic so
* generated output (and snapshots) never churn between runs.
*/
function runtimeVariableMarker(serverUrl, variableKey) {
	return `${VARIABLE_MARKER_PREFIX}${hashString(serverUrl + variableKey)}__`;
}
function resolveServerUrl(servers, options) {
	if (!servers || servers.length === 0) return "";
	const server = servers.at(Math.min(options.index ?? 0, servers.length - 1));
	if (!server) return "";
	const serverUrl = server.url ?? "";
	if (!server.variables) return serverUrl;
	let url = serverUrl;
	const variables = options.variables;
	const staticMarkers = /* @__PURE__ */ new Map();
	for (const variableKey of Object.keys(server.variables)) {
		const variable = server.variables[variableKey];
		const raw = variables?.[variableKey];
		const marker = runtimeVariableMarker(serverUrl, variableKey);
		if (isVariableRuntimeValue(raw)) url = url.replaceAll(`{${variableKey}}`, marker);
		else {
			if (raw !== void 0 && variable.enum && !variable.enum.some((e) => e == raw)) throw new Error(`Invalid variable value '${raw}' for variable '${variableKey}' when resolving ${serverUrl}. Valid values are: ${variable.enum.join(", ")}.`);
			const resolved = raw !== void 0 ? String(raw) : String(variable.default);
			url = url.replaceAll(`{${variableKey}}`, marker);
			staticMarkers.set(marker, resolved);
		}
	}
	for (const [marker, value] of staticMarkers) url = url.replaceAll(marker, value);
	return url;
}
/**
* Prepends a base URL to an already-processed route.
*
* `route` must be the output of {@link getRoute} (already escaped for template
* literals). This function does NOT re-escape it — jsesc is not idempotent, so
* escaping twice would double the backslashes. Only the server URL from
* `getBaseUrlFromSpecification` is escaped here, after variable substitution.
*/
function getFullRoute(route, servers, baseUrl) {
	const getBaseUrl = () => {
		if (!baseUrl) return "";
		if (isString(baseUrl)) return baseUrl;
		if (isBaseUrlRuntime(baseUrl)) return runtimeExpressionToUrlPrefix(baseUrl.runtime);
		if (baseUrl.getBaseUrlFromSpecification) {
			if (!servers) throw new Error("Orval is configured to use baseUrl from the specifications 'servers' field, but there exist no servers in the specification.");
			const selectedServer = servers.at(Math.min(baseUrl.index ?? 0, servers.length - 1)) ?? servers[0];
			let base = esc(resolveServerUrl(servers, {
				index: baseUrl.index,
				variables: baseUrl.variables
			}));
			if (baseUrl.variables && selectedServer?.url) {
				for (const [key, value] of Object.entries(baseUrl.variables)) if (isVariableRuntimeValue(value)) base = base.replaceAll(runtimeVariableMarker(selectedServer.url, key), `\${${value.runtime}}`);
			}
			return base;
		}
		return baseUrl.baseUrl;
	};
	let fullRoute = route;
	const base = getBaseUrl();
	if (base) {
		if (base.endsWith("/") && route.startsWith("/")) fullRoute = route.slice(1);
		fullRoute = `${base}${fullRoute}`;
	}
	return fullRoute;
}
/**
* Returns `GeneratorImport` entries for {@link BaseUrlRuntime.imports} when `baseUrl` is a runtime config.
*
* Defaults `values` to true so symbols in `runtime` emit as value imports in the
* generated client. Set `values: false` explicitly only for unusual cases (e.g.
* type-only symbols referenced from the expression).
*/
function getBaseUrlRuntimeImports(baseUrl) {
	if (!baseUrl) return [];
	if (!isBaseUrlRuntime(baseUrl)) return [];
	return (baseUrl.imports ?? []).map((imp) => ({
		...imp,
		values: imp.values ?? true
	}));
}
const wrapRouteParameters = (route, prepend, append, skip = /* @__PURE__ */ new Set(), only) => mapTemplateExpressions(route, (name) => {
	const key = name.replace(/^pathParams\(\)\?\./, "").replace(/^pathParams\(\)\./, "").replace(/\?\.\(\)\s*\?\?.*$/, "").replace(/\s*\?\?.*$/, "").replace(/\(\)$/, "").replace(/[()?]/g, "").trim();
	return skip.has(key) || only && !only.has(key) ? name : `${prepend}${name}${append}`;
});
const makeRouteSafe = (route, skip = /* @__PURE__ */ new Set(), only) => wrapRouteParameters(route, "encodeURIComponent(String(", "))", skip, only);
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
function getRouteAsArray(route) {
	const entries = [];
	const pushLiteral = (value) => {
		if (value) entries.push(`'${escapeRouteForSingleQuotes(value)}'`);
	};
	for (const part of parseTemplateLiteral(route)) {
		if (part.kind === "expression") {
			entries.push(part.source);
			continue;
		}
		let chunk = "";
		let index = 0;
		while (index < part.source.length) {
			const char = part.source[index];
			if (char === "\\") {
				chunk += part.source.slice(index, index + 2);
				index += 2;
				continue;
			}
			if (char === "/") {
				pushLiteral(chunk);
				chunk = "";
				index++;
				continue;
			}
			chunk += char;
			index++;
		}
		pushLiteral(chunk);
	}
	return entries.join(",");
}
//#endregion
//#region src/getters/params.ts
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
function getParamsInPath(path) {
	return parseRoutePath(path).filter((token) => token.kind === "param").map((token) => token.name);
}
/**
* Resolves a route placeholder to its single matching spec path parameter.
* `identifier` already is the generated JS identifier (it comes from the
* processed route), so we re-derive the same identifier from each spec name via
* `camelPathParamName` to match. Throws when two spec names collapse onto the
* same identifier, or when none match.
*/
function resolvePathParam(identifier, pathParams, operationId) {
	const matching = pathParams.filter(({ parameter }) => camelPathParamName(parameter.name ?? "") === identifier);
	if (matching.length > 1) {
		const names = matching.map(({ parameter }) => `'${parameter.name}'`).join(", ");
		throw new Error(`Path parameters ${names} all map to the same generated identifier '${identifier}' (${operationId}). Rename them so they don't collide.`);
	}
	const pathParam = matching[0];
	if (!pathParam) throw new Error(`The path params ${identifier} can't be found in parameters (${operationId})`);
	return pathParam;
}
function getParams({ pathRoute, pathParams = [], operationId, context, output }) {
	return getParamsInPath(pathRoute).map((specName) => {
		const parameter = resolvePathParam(camelPathParamName(specName), pathParams, operationId).parameter;
		const nameWithoutSanitize = parameter.name;
		const required = parameter.required ?? false;
		const schema = "schema" in parameter ? parameter.schema : void 0;
		const allowReserved = "allowReserved" in parameter ? parameter.allowReserved : false;
		const name = camelPathParamName(nameWithoutSanitize ?? "");
		if (!schema) return {
			name,
			definition: `${name}${required ? "" : "?"}: unknown`,
			implementation: `${name}${required ? "" : "?"}: unknown`,
			default: void 0,
			required,
			allowReserved,
			imports: []
		};
		const resolvedValue = resolveValue({
			schema,
			context
		});
		const originalSchema = resolvedValue.originalSchema;
		const schemaDefault = !isBooleanJsonSchema(originalSchema) ? originalSchema.default : void 0;
		let paramType = resolvedValue.value;
		if (output.allParamsOptional) paramType = `${paramType} | undefined | null`;
		const hasSchemaDefault = schemaDefault !== void 0;
		return {
			name,
			definition: `${name}${!required || hasSchemaDefault ? "?" : ""}: ${paramType}`,
			implementation: `${name}${!required && !hasSchemaDefault ? "?" : ""}${hasSchemaDefault ? `: ${paramType} = ${stringify(schemaDefault)}` : `: ${paramType}`}`,
			default: schemaDefault,
			required,
			allowReserved,
			imports: resolvedValue.imports,
			originalSchema
		};
	});
}
//#endregion
//#region src/getters/props.ts
function getProps({ body, queryParams, params, operationName, headers, context }) {
	const bodyProp = {
		name: body.implementation,
		definition: `${body.implementation}${body.isOptional && !context.output.optionsParamRequired ? "?" : ""}: ${body.definition}`,
		implementation: `${body.implementation}${body.isOptional && !context.output.optionsParamRequired ? "?" : ""}: ${body.definition}`,
		default: void 0,
		required: !body.isOptional || context.output.optionsParamRequired,
		type: GetterPropType.BODY
	};
	const queryParamsProp = {
		name: "params",
		definition: getQueryParamDefinition(queryParams, context),
		implementation: getQueryParamDefinition(queryParams, context),
		default: void 0,
		required: isNullish(queryParams?.isOptional) ? !context.output.allParamsOptional || context.output.optionsParamRequired : !queryParams.isOptional && !context.output.allParamsOptional || context.output.optionsParamRequired,
		type: GetterPropType.QUERY_PARAM
	};
	const headersProp = {
		name: "headers",
		definition: `headers${headers?.isOptional && !context.output.optionsParamRequired ? "?" : ""}: ${headers?.schema.name}`,
		implementation: `headers${headers?.isOptional && !context.output.optionsParamRequired ? "?" : ""}: ${headers?.schema.name}`,
		default: void 0,
		required: isNullish(headers?.isOptional) ? false : !headers.isOptional || context.output.optionsParamRequired,
		type: GetterPropType.HEADER
	};
	let paramGetterProps;
	if (context.output.override.useNamedParameters && params.length > 0) {
		const parameterTypeName = `${pascal(operationName)}PathParameters`;
		const name = "pathParams";
		const namedParametersTypeDefinition = `export type ${parameterTypeName} = {\n ${params.map((property) => property.definition).join(",\n    ")},\n }`;
		const isOptional = context.output.optionsParamRequired || params.every((param) => param.default !== void 0);
		const implementation = `{ ${params.map((property) => property.default === void 0 ? property.name : `${property.name} = ${stringify(property.default)}`).join(", ")} }: ${parameterTypeName}${isOptional ? " = {}" : ""}`;
		const destructured = `{ ${params.map((property) => property.name).join(", ")} }`;
		paramGetterProps = [{
			type: GetterPropType.NAMED_PATH_PARAMS,
			name,
			definition: `${name}: ${parameterTypeName}`,
			implementation,
			default: void 0,
			destructured,
			required: true,
			schema: {
				name: parameterTypeName,
				model: namedParametersTypeDefinition,
				imports: params.flatMap((property) => property.imports)
			}
		}];
	} else paramGetterProps = params.map((param) => ({
		...param,
		type: GetterPropType.PARAM
	}));
	const props = [
		...paramGetterProps,
		...body.definition ? [bodyProp] : [],
		...queryParams ? [queryParamsProp] : [],
		...headers ? [headersProp] : []
	];
	return sortByPriority(props);
}
function getQueryParamDefinition(queryParams, context) {
	const paramType = queryParams?.schema.name;
	return `params${(queryParams?.isOptional || context.output.allParamsOptional) && !context.output.optionsParamRequired ? "?" : ""}: ${paramType}`;
}
//#endregion
//#region src/getters/query-params.ts
const isOpenApiSchemaObject = (value) => {
	if (!value || typeof value !== "object") return false;
	return !("$ref" in value);
};
/**
* A `$ref` schema object (e.g. array `items` or a oneOf/anyOf/allOf variant
* pointing at a component). We don't resolve the reference here, but a query
* parameter behind a `$ref` is virtually always a complex (object-like) type,
* so it must be treated as non-primitive. Over-flagging is harmless: the only
* consumer (the Angular `nonPrimitiveKeys` passthrough) is gated on a
* configured `paramsSerializer`, which is precisely what handles raw values.
*/
const isRefObject = (value) => !!value && typeof value === "object" && "$ref" in value;
const getSchemaType = (schema) => {
	const type = schema.type;
	if (typeof type === "string") return type;
	if (Array.isArray(type) && type.every((variant) => typeof variant === "string")) return type;
};
/**
* Detects whether a query parameter's resolved schema is non-primitive — i.e.
* an object, an array of objects, or a composition (oneOf/anyOf/allOf) that
* resolves to a non-primitive shape.
*
* Used by Angular generators so the default `filterParams` helper preserves
* such values instead of silently dropping them. Angular's `HttpParams` only
* accepts primitives, but a user-provided `paramsSerializer`, `mutator`, or
* `paramsFilter` may need the raw object to flatten or stringify it.
*/
const isSchemaNonPrimitive = (schema) => {
	if (isBooleanJsonSchema(schema)) return false;
	const schemaType = getSchemaType(schema);
	const type = Array.isArray(schemaType) ? schemaType.filter((variant) => variant !== "null") : schemaType;
	const additionalProperties = schema.additionalProperties;
	if (type === "object") return true;
	if (Array.isArray(type) && type.includes("object")) return true;
	if (type === "array" || Array.isArray(type) && type.includes("array")) {
		const items = schema.items;
		if (isOpenApiSchemaObject(items)) return isSchemaNonPrimitive(items);
		return true;
	}
	const compositions = [
		...Array.isArray(schema.oneOf) ? schema.oneOf : [],
		...Array.isArray(schema.anyOf) ? schema.anyOf : [],
		...Array.isArray(schema.allOf) ? schema.allOf : []
	];
	if (compositions.length > 0) return compositions.some((variant) => isOpenApiSchemaObject(variant) ? isSchemaNonPrimitive(variant) : isRefObject(variant));
	if (!type && (schema.properties !== void 0 || additionalProperties !== void 0 && additionalProperties !== false)) return true;
	return false;
};
/**
* Detects whether a query parameter's resolved schema is a plain object —
* i.e. serializable per OpenAPI's `style`/`explode` object rules (form/
* deepObject). Unlike {@link isSchemaNonPrimitive}, arrays (including arrays
* of objects) are explicitly excluded: OpenAPI defines no style/explode
* object-serialization for them, so they stay on the existing
* passthrough/drop path.
*
* Used to compute {@link GetterQueryParam.objectQueryParams}. See issue #3705.
*/
const isPlainObjectSchema = (schema) => {
	if (isBooleanJsonSchema(schema)) return false;
	const schemaType = getSchemaType(schema);
	const type = Array.isArray(schemaType) ? schemaType.filter((variant) => variant !== "null") : schemaType;
	const additionalProperties = schema.additionalProperties;
	if (type === "object") return true;
	if (Array.isArray(type) && type.includes("object")) return true;
	if (type === "array" || Array.isArray(type) && type.includes("array")) return false;
	const compositions = [
		...Array.isArray(schema.oneOf) ? schema.oneOf : [],
		...Array.isArray(schema.anyOf) ? schema.anyOf : [],
		...Array.isArray(schema.allOf) ? schema.allOf : []
	];
	if (compositions.length > 0) return compositions.some((variant) => isOpenApiSchemaObject(variant) && isPlainObjectSchema(variant));
	if (!type && (schema.properties !== void 0 || additionalProperties !== void 0 && additionalProperties !== false)) return true;
	return false;
};
/**
* Derives the object-serialization strategy for a query parameter from its
* declared `style`/`explode`, following the OpenAPI defaults (`style: form`,
* `explode: true` for `form`). Returns `undefined` for parameters that are
* not plain-object schemas or that are defined via `content:` (their
* spec-correct encoding is a JSON string — a separate follow-up). See issue
* #3705.
*/
const getObjectQueryParamStrategy = (parameter, schema, isContentBased) => {
	if (isContentBased || !schema || !isPlainObjectSchema(schema)) return;
	const { style, explode } = parameter;
	if (style === "deepObject") return "deepObject";
	return explode ?? (style ?? "form") === "form" ? "flatten" : "comma";
};
function getQueryParamsTypes(queryParams, operationName, context) {
	return queryParams.map(({ parameter, imports: parameterImports }) => {
		const { name, required, schema: schemaParam, content } = parameter;
		const queryName = sanitize(`${pascal(operationName)}${pascal(name)}`, {
			underscore: "_",
			whitespace: "_",
			dash: true,
			es5keyword: true,
			es5IdentifierName: true
		});
		const schema = schemaParam ?? content?.["application/json"]?.schema;
		if (!schema) throw new Error(`Query parameter "${name}" has no schema or content definition`);
		const hasSchemaDefault = !isBooleanJsonSchema(schema) && schema.default !== void 0;
		const resolvedValue = resolveValue({
			schema,
			context,
			name: queryName
		});
		const objectStrategy = getObjectQueryParamStrategy(parameter, resolvedValue.originalSchema, schemaParam === void 0);
		const key = getKey(name);
		const schemaForDoc = schema;
		const doc = jsDoc({
			description: parameter.description,
			...schemaForDoc
		}, void 0, context);
		if (parameterImports.length > 0) return {
			name,
			required,
			definition: `${doc}${key}${!required || hasSchemaDefault ? "?" : ""}: ${parameterImports[0].name};`,
			imports: parameterImports,
			schemas: [],
			originalSchema: resolvedValue.originalSchema,
			objectStrategy
		};
		if (resolvedValue.isEnum && !resolvedValue.isRef) {
			const enumName = queryName;
			const parameterAsSchema = parameter;
			const enumMembers = getEnumMembers(resolvedValue.originalSchema, parameterAsSchema);
			const isNullable = isSchemaNullable(resolvedValue.originalSchema) || isSchemaNullable(parameterAsSchema);
			const enumValue = getEnum(enumMembers, enumName, isNullable, context.output.override.enumGenerationType, context.output.override.namingConvention.enum);
			const enumType = isEnumReferenceMissingNull(enumMembers, isNullable, context.output.override.enumGenerationType) ? `${enumName} | null` : enumName;
			return {
				name,
				required,
				definition: `${doc}${key}${!required || hasSchemaDefault ? "?" : ""}: ${enumType};`,
				imports: [{ name: enumName }],
				schemas: [...resolvedValue.schemas, {
					name: enumName,
					model: enumValue,
					imports: resolvedValue.imports,
					kind: "enum"
				}],
				originalSchema: resolvedValue.originalSchema,
				objectStrategy
			};
		}
		return {
			name,
			required,
			definition: `${doc}${key}${!required || hasSchemaDefault ? "?" : ""}: ${resolvedValue.value};`,
			imports: resolvedValue.imports,
			schemas: resolvedValue.schemas,
			originalSchema: resolvedValue.originalSchema,
			objectStrategy
		};
	});
}
function getQueryParams({ queryParams, operationName, context, suffix = "params" }) {
	if (queryParams.length === 0) return;
	const types = getQueryParamsTypes(queryParams, operationName, context);
	const imports = types.flatMap(({ imports }) => imports);
	const schemas = types.flatMap(({ schemas }) => schemas);
	const name = `${pascal(operationName)}${pascal(suffix)}`;
	const type = types.map(({ definition }) => definition).join("\n");
	const allOptional = queryParams.every(({ parameter }) => !parameter.required);
	const requiredNullableKeys = types.filter(({ required, originalSchema }) => required && isSchemaNullable(originalSchema)).map(({ name }) => name);
	const nonPrimitiveKeys = types.filter(({ originalSchema }) => isSchemaNonPrimitive(originalSchema)).map(({ name }) => name);
	const objectQueryParams = types.filter((type) => type.objectStrategy !== void 0).map(({ name, objectStrategy }) => ({
		key: name,
		strategy: objectStrategy
	}));
	return {
		schema: {
			name,
			model: `export type ${name} = {\n${type}\n};\n`,
			imports
		},
		deps: schemas,
		isOptional: allOptional,
		paramNames: types.map(({ name }) => name),
		requiredNullableKeys,
		...nonPrimitiveKeys.length > 0 ? { nonPrimitiveKeys } : {},
		...objectQueryParams.length > 0 ? { objectQueryParams } : {}
	};
}
//#endregion
//#region src/getters/response.ts
function getResponse({ responses, operationName, context, contentType, generatePrimitiveSchemas = false }) {
	const filteredTypes = filterByContentType(getResReqTypes(Object.entries(responses), operationName, context, "void", (type) => `${type.key}-${type.value}-${type.contentType}`, generatePrimitiveSchemas), contentType);
	const imports = filteredTypes.flatMap(({ imports }) => imports);
	const schemas = filteredTypes.flatMap(({ schemas }) => schemas);
	const contentTypes = [...new Set(filteredTypes.map(({ contentType }) => contentType))];
	const groupedByStatus = {
		success: [],
		errors: []
	};
	for (const type of filteredTypes) if (type.key.startsWith("2")) groupedByStatus.success.push(type);
	else groupedByStatus.errors.push(type);
	const success = dedupeUnionType(groupedByStatus.success.map(({ value, formData }) => formData ? "Blob" : value).join(" | "));
	const errors = dedupeUnionType(groupedByStatus.errors.map(({ value }) => value).join(" | "));
	const defaultType = filteredTypes.find(({ key }) => key === "default")?.value;
	return {
		imports,
		definition: {
			success: success || (defaultType ?? "unknown"),
			errors: errors || (defaultType ?? "unknown")
		},
		isBlob: groupedByStatus.success.some((t) => !!t.contentType && isBinaryContentType(t.contentType) || t.originalSchema !== void 0 && !isBooleanJsonSchema(t.originalSchema) && (t.originalSchema.format === "binary" || t.originalSchema.contentMediaType === "application/octet-stream" && !t.originalSchema.contentEncoding)),
		types: groupedByStatus,
		contentTypes,
		schemas,
		originalSchema: responses
	};
}
//#endregion
//#region src/generators/component-definition.ts
function generateComponentDefinition(responses = {}, context, suffix, prefix = "") {
	if (Object.keys(responses).length === 0) return [];
	const generatorSchemas = [];
	for (const [name, response] of Object.entries(responses)) {
		const baseName = getComponentBaseName(responses, name);
		const allResponseTypes = getResReqTypes([[suffix, response]], baseName, context, "void");
		const imports = allResponseTypes.flatMap(({ imports }) => imports);
		const schemas = allResponseTypes.flatMap(({ schemas }) => schemas);
		const type = allResponseTypes.map(({ value }) => value).join(" | ");
		const modelName = sanitize(`${prefix}${baseName}${suffix}`, {
			underscore: "_",
			whitespace: "_",
			dash: true,
			es5keyword: true,
			es5IdentifierName: true
		});
		const model = `${jsDoc(response)}export type ${modelName} = ${type || "unknown"};\n`;
		generatorSchemas.push(...schemas);
		if (modelName !== type) generatorSchemas.push({
			name: modelName,
			model,
			imports,
			kind: "schema"
		});
	}
	return generatorSchemas;
}
//#endregion
//#region src/generators/date-transform.ts
const isDateSchema = (schema) => !isBooleanJsonSchema(schema) && (schema.format === "date" || schema.format === "date-time");
const isNullTypeSchema = (schemaOrRef) => {
	if (!isInlineSchema(schemaOrRef) || isBooleanJsonSchema(schemaOrRef)) return false;
	const { type } = schemaOrRef;
	return type === "null" || Array.isArray(type) && type.length > 0 && type.every((t) => t === "null");
};
const hasNullableType = (schema) => !isBooleanJsonSchema(schema) && Array.isArray(schema.type) && schema.type.includes("null");
/**
* True when the schema itself names at least one property. An empty
* `properties: {}` names none: the object getter types it — alongside a
* schema-valued `additionalProperties` — as the same index signature as a bare
* map, so it must not count as declaring keys or as needing an object copy.
*/
const hasOwnProperties = (schema) => !isBooleanJsonSchema(schema) && schema.properties !== void 0 && Object.keys(schema.properties).length > 0;
/**
* True when this schema, or any of its `allOf` branches (recursively,
* through `$ref`s), declares its own `properties` — or is itself a `oneOf`/
* `anyOf` union whose variants declare theirs. Mirrors `needsObjectCopy`'s
* `allOf` recursion, but is asked before that function exists in the file, so
* it stays a narrower, standalone check.
*
* Exists so Rule 1 (below) can mean "does this level declare any keys at
* all" rather than "does this exact schema object have a `properties` key"
* — an intersection built from `allOf` merges every branch's properties into
* the same object, and a discriminated (or undiscriminated) union's variants
* are merged into the same level's type by the getter just as surely, so
* either is just as unsafe to combine with a map loop as a literal
* `properties` block on the schema being asked about directly. A `oneOf`/
* `anyOf` reaching this point is a genuine union, not a nullable wrapper:
* `normalizeSchema` (called first, below) already unwraps the nullable
* spellings (`anyOf: [T, null]`, `type: [T, 'null']`) to the bare
* schema before this check ever sees them, so a nullable map or a nullable
* map value is unaffected.
*/
const declaresProperties = (schemaOrRef, context, seenRefs = /* @__PURE__ */ new Set()) => {
	const { schema, ref } = normalizeSchema(schemaOrRef, context);
	if (ref) {
		if (seenRefs.has(ref)) return false;
		seenRefs.add(ref);
	}
	if (isBooleanJsonSchema(schema)) return false;
	if (hasOwnProperties(schema)) return true;
	if (schema.oneOf || schema.anyOf) return true;
	return (schema.allOf ?? []).some((branch) => declaresProperties(branch, context, seenRefs));
};
/**
* The `additionalProperties` schema when this level of the object is a map
* of same-shaped values, or undefined when it is not.
*
* Several shapes contribute nothing (Rule 2): `additionalProperties: true`
* and `additionalProperties: false` are a permissive/forbidding flag, not a
* value schema, and an absent `additionalProperties` obviously isn't one
* either. An array (`additionalProperties: []`, invalid JSON Schema but seen
* in the wild) and a keyless object (`additionalProperties: {}`, the common
* "extra keys are allowed, of any shape" idiom) are rejected too: neither
* has a format, a `$ref`, or any nested shape this walk could ever turn into
* a statement, so treating either as a real map value schema would only
* make the items/map conflict check in `buildResolvedStatements` fire on a
* purely syntactic `!= null` and silently drop an array walk that used to
* run. Only a non-empty object (a schema, possibly a `$ref` to one) counts
* as a map's value type.
*
* A schema that also declares `properties` — directly, via an `allOf`
* branch (Rule 1), or as a `oneOf`/`anyOf` union sitting beside
* `additionalProperties` — is never walked as a map, full stop:
* `additionalProperties` only governs the keys `properties` doesn't name,
* and a blind loop over every key would revisit — and, since not every
* declared property holds a date, potentially corrupt — the composition's
* own declared properties (or, for a union, whichever variant's properties
* the discriminator switch just converted). The `allOf` check here only sees
* branches nested inside *this* schema's own `allOf` array (`{ allOf: [Base],
* additionalProperties }`); the sibling spelling, where this schema is
* itself one of a *parent's* `allOf` branches (`allOf: [Base,
* { additionalProperties }]`), is caught separately in
* `buildResolvedStatements`, which has visibility into the parent's other
* branches that this function does not. Distinguishing "the extra keys" from
* the named ones would need the full set of sibling property names threaded
* through the walk for no real-world payoff, so a schema declaring both is
* left to its `properties` statements only. A `oneOf`/`anyOf` whose values
* are the map's *value* type (`additionalProperties: { oneOf: [...] }`) is
* unaffected — that union lives one object level down, on the schema
* `mapValueSchema` returns, not on the schema it's asked about.
*
* A `propertyNames` that narrows the key type to a finite set of literals
* (`enum`, `const`, or a `$ref` to a string enum/const) also disqualifies a
* schema from map traversal: `getters/object.ts` (`hasNarrowedPropertyNames`)
* types that combination as `Partial<Record<K, V>>`, not an index signature,
* so `Object.keys()` (typed `string`) can't index it without a `TS7053`, and
* even a correctly-typed key would read a value typed `V | undefined` that
* this walk has no way to narrow. Emit nothing rather than code that doesn't
* compile. Any other `propertyNames` constraint — `format`, `pattern`,
* `minLength`, or none at all — still types as a plain index signature
* (`[key: string]: V`), which a blind `Object.keys` loop indexes fine, so
* those cases fall through to the traversal below.
*/
const mapValueSchema = (schema, context) => {
	if (isBooleanJsonSchema(schema)) return void 0;
	if (declaresProperties(schema, context)) return void 0;
	if (schema.propertyNames && hasNarrowedPropertyNames(schema, context)) return;
	const { additionalProperties } = schema;
	if (!additionalProperties || typeof additionalProperties !== "object") return;
	if (Array.isArray(additionalProperties)) return void 0;
	if (Object.keys(additionalProperties).length === 0) return void 0;
	return additionalProperties;
};
/**
* Resolves `$ref`s and unwraps the OAS 3.1 spelling of a nullable schema
* (`anyOf: [<schema>, { type: 'null' }]`) so a nullable date is recognised
* whichever spelling the document uses, instead of being skipped as an
* undiscriminated union.
*/
const normalizeSchema = (schemaOrRef, context, nullable = false, seenRefs = /* @__PURE__ */ new Set()) => {
	if (isBooleanJsonSchema(schemaOrRef)) return {
		schema: toObjectSchema(schemaOrRef),
		nullable: schemaOrRef
	};
	if (!isInlineSchema(schemaOrRef) && schemaOrRef.$ref) {
		const ref = schemaOrRef.$ref;
		if (seenRefs.has(ref)) return {
			schema: {},
			ref,
			nullable
		};
		seenRefs.add(ref);
		const { schema } = resolveRef(schemaOrRef, context);
		return {
			...normalizeSchema(schema, context, nullable, seenRefs),
			ref
		};
	}
	const schema = schemaOrRef;
	const variants = schema.oneOf ?? schema.anyOf;
	if (variants && !schema.discriminator && !schema.properties && !schema.allOf) {
		const nonNullVariants = variants.filter((variant) => !isNullTypeSchema(variant));
		if (nonNullVariants.length === 1 && nonNullVariants.length < variants.length) return normalizeSchema(nonNullVariants[0], context, true, seenRefs);
	}
	return {
		schema,
		nullable: nullable || hasNullableType(schema)
	};
};
const IDENTIFIER_REGEX = /^[A-Za-z_$][\w$]*$/;
const propertyAccessor = (parent, key) => IDENTIFIER_REGEX.test(key) ? `${parent}.${key}` : `${parent}[${JSON.stringify(key)}]`;
/**
* `readOnly` schema properties are generated with a `readonly` modifier, so
* the deserializer cannot assign to them directly. Casting the container to
* its mutable twin keeps the assignment type-checked — the assigned value
* must still be a `Date` — without widening anything to `any`.
*/
const mutableCast = (accessor) => `(${accessor} as { -readonly [K in keyof typeof ${accessor}]: (typeof ${accessor})[K] })`;
const indent = (statements) => statements.map((statement) => `  ${statement}`);
/**
* A discriminator mapping value is either a `$ref` or a bare component schema
* name (OpenAPI allows both); bare names are expanded to the component ref.
*/
const discriminatorMappingRef = (value) => value.startsWith("#") || value.includes("/") ? value : `#/components/schemas/${value}`;
const emptyResult = () => ({
	statements: [],
	cyclicRefs: /* @__PURE__ */ new Set()
});
const mergeResults = (results) => ({
	statements: results.flatMap((result) => result.statements),
	cyclicRefs: new Set(results.flatMap((result) => [...result.cyclicRefs]))
});
const buildStatements = ({ schema: schemaOrRef, accessor, context, visitedRefs, depth, writeAccessor, mode, mapSuppressed }) => {
	const { schema, ref } = normalizeSchema(schemaOrRef, context);
	if (ref) {
		if (visitedRefs.has(ref)) return {
			statements: [],
			cyclicRefs: /* @__PURE__ */ new Set([ref])
		};
		visitedRefs.add(ref);
	}
	try {
		return buildResolvedStatements({
			schema,
			ref,
			accessor,
			context,
			visitedRefs,
			depth,
			writeAccessor,
			mode,
			mapSuppressed
		});
	} finally {
		if (ref) visitedRefs.delete(ref);
	}
};
const buildResolvedStatements = ({ schema, ref, accessor, context, visitedRefs, depth, writeAccessor, mode, mapSuppressed }) => {
	if (isBooleanJsonSchema(schema)) return emptyResult();
	let result;
	const mapSuppressedHere = mapSuppressed || declaresProperties(schema, context);
	const mapValue = mapSuppressedHere ? void 0 : mapValueSchema(schema, context);
	if (mode.isLeaf(schema)) result = {
		statements: [mode.leafStatement(accessor, writeAccessor ?? accessor)],
		cyclicRefs: /* @__PURE__ */ new Set()
	};
	else if (isArrayShaped(schema, context) && (mode.dropArrayObjectConflict && needsObjectCopy(schema, context) || mapValue != null)) result = emptyResult();
	else {
		const allOfResults = (schema.allOf ?? []).map((branch) => buildStatements({
			schema: branch,
			accessor,
			context,
			visitedRefs,
			depth,
			writeAccessor,
			mode,
			mapSuppressed: mapSuppressedHere
		}));
		const unionResult = buildUnionStatements({
			schema,
			accessor,
			context,
			visitedRefs,
			depth,
			mode
		});
		const itemsResult = schema.items ? mode.arrayStatements({
			items: schema.items,
			accessor,
			context,
			visitedRefs,
			depth,
			mode
		}) : emptyResult();
		const mapResult = mapValue ? mode.mapStatements({
			values: mapValue,
			accessor,
			context,
			visitedRefs,
			depth,
			mode
		}) : emptyResult();
		const propertiesResult = schema.properties ? buildPropertiesStatements({
			properties: schema.properties,
			required: schema.required,
			accessor,
			context,
			visitedRefs,
			depth,
			mode
		}) : emptyResult();
		result = mergeResults([
			...allOfResults,
			unionResult,
			itemsResult,
			mapResult,
			propertiesResult
		]);
	}
	if (ref) {
		if (result.cyclicRefs.has(ref)) {
			const cyclicRefs = new Set(result.cyclicRefs);
			cyclicRefs.delete(ref);
			result = {
				statements: [],
				cyclicRefs
			};
		}
	}
	return result;
};
/**
* True when the subtree assigns to the accessor itself (a date, possibly
* wrapped in `allOf` or a nullable union) rather than into its properties or
* elements.
*
* Callers: the response direction's in-place array and map builders, where
* such elements must be written back through the array or map slot (a
* hoisted `const` would make the generated assignment reassign a const); and
* the shared property builder (both directions), where it distinguishes a
* required date leaf (unguarded — a response's `new Date(undefined)` degrades
* to `Invalid Date` rather than throwing, and a request's
* `x instanceof Date ? … : x` already tolerates `undefined`) from a required
* container (object copy or shallow mutation, array `.map` or in-place loop,
* map copy or key loop, or union dispatch), which must be null-guarded in
* both directions so an omitted container isn't turned into `{}`, thrown on,
* or dereferenced before the caller can handle it. Every use asks the same
* question — "does this write straight to the accessor, or into something
* reached through it?" — regardless of which formats a given direction
* converts, so it checks `isDateSchema` directly rather than taking a `mode`
* parameter.
*/
const writesToAccessorItself = (schemaOrRef, context, seenRefs = /* @__PURE__ */ new Set()) => {
	const { schema, ref } = normalizeSchema(schemaOrRef, context);
	if (ref) {
		if (seenRefs.has(ref)) return false;
		seenRefs.add(ref);
	}
	if (isDateSchema(schema)) return true;
	return (schema.allOf ?? []).some((branch) => writesToAccessorItself(branch, context, seenRefs));
};
const buildInPlaceItemsStatements = ({ items, accessor, context, visitedRefs, depth, mode }) => {
	const index = `i${depth}`;
	const { nullable } = normalizeSchema(items, context);
	const loopHeader = `for (let ${index} = 0; ${index} < ${accessor}.length; ${index}++) {`;
	if (writesToAccessorItself(items, context)) {
		const element = `${accessor}[${index}]`;
		const inner = buildStatements({
			schema: items,
			accessor: `${element}!`,
			writeAccessor: element,
			context,
			visitedRefs,
			depth: depth + 1,
			mode
		});
		if (inner.statements.length === 0) return inner;
		const body = nullable ? [
			`if (${element} != null) {`,
			...indent(inner.statements),
			"}"
		] : inner.statements;
		return {
			statements: [
				loopHeader,
				...indent(body),
				"}"
			],
			cyclicRefs: inner.cyclicRefs
		};
	}
	const item = `item${depth}`;
	const inner = buildStatements({
		schema: items,
		accessor: item,
		context,
		visitedRefs,
		depth: depth + 1,
		mode
	});
	if (inner.statements.length === 0) return inner;
	const body = nullable ? [
		`if (${item} != null) {`,
		...indent(inner.statements),
		"}"
	] : inner.statements;
	return {
		statements: [
			loopHeader,
			`  const ${item} = ${accessor}[${index}]!;`,
			...indent(body),
			"}"
		],
		cyclicRefs: inner.cyclicRefs
	};
};
/**
* The response direction's map traversal: an in-place `for...of` loop over
* `Object.keys(accessor)`, mirroring `buildInPlaceItemsStatements` with a
* key lookup in place of an index. A value that writes to the accessor
* itself (a date leaf, or an `allOf`-wrapped one) is written back through
* the key slot directly; anything else is hoisted into a `const` so
* `!= null` narrowing survives, exactly as the array builder hoists an
* object element.
*/
const buildInPlaceMapStatements = ({ values, accessor, context, visitedRefs, depth, mode }) => {
	const key = `key${depth}`;
	const { nullable } = normalizeSchema(values, context);
	const loopHeader = `for (const ${key} of Object.keys(${accessor})) {`;
	if (writesToAccessorItself(values, context)) {
		const element = `${accessor}[${key}]`;
		const inner = buildStatements({
			schema: values,
			accessor: `${element}!`,
			writeAccessor: element,
			context,
			visitedRefs,
			depth: depth + 1,
			mode
		});
		if (inner.statements.length === 0) return inner;
		const body = nullable ? [
			`if (${element} != null) {`,
			...indent(inner.statements),
			"}"
		] : inner.statements;
		return {
			statements: [
				loopHeader,
				...indent(body),
				"}"
			],
			cyclicRefs: inner.cyclicRefs
		};
	}
	const item = `item${depth}`;
	const inner = buildStatements({
		schema: values,
		accessor: item,
		context,
		visitedRefs,
		depth: depth + 1,
		mode
	});
	if (inner.statements.length === 0) return inner;
	const body = nullable ? [
		`if (${item} != null) {`,
		...indent(inner.statements),
		"}"
	] : inner.statements;
	return {
		statements: [
			loopHeader,
			`  const ${item} = ${accessor}[${key}]!;`,
			...indent(body),
			"}"
		],
		cyclicRefs: inner.cyclicRefs
	};
};
const responseMode = {
	isLeaf: isDateSchema,
	leafStatement: (read, write) => `${write} = new Date(${read});`,
	objectPrelude: () => [],
	arrayStatements: buildInPlaceItemsStatements,
	mapStatements: buildInPlaceMapStatements,
	propertyWriteAccessor: (accessor, key, propertySchema) => !isBooleanJsonSchema(propertySchema) && propertySchema.readOnly ? propertyAccessor(mutableCast(accessor), key) : void 0,
	skipProperty: () => false,
	dropArrayObjectConflict: false
};
const buildPropertiesStatements = ({ properties, required, accessor, context, visitedRefs, depth, mode, presenceGuarded }) => {
	const requiredSet = new Set(required ?? []);
	return mergeResults(Object.entries(properties).map(([key, property]) => {
		const target = propertyAccessor(accessor, key);
		const { schema: propertySchema, nullable } = normalizeSchema(property, context);
		if (mode.skipProperty(propertySchema)) return emptyResult();
		const inner = buildStatements({
			schema: property,
			accessor: target,
			context,
			visitedRefs,
			depth,
			writeAccessor: mode.propertyWriteAccessor(accessor, key, propertySchema),
			mode
		});
		if (inner.statements.length === 0) return inner;
		const statements = [...mode.objectPrelude(target, property, context), ...inner.statements];
		if (!(presenceGuarded || !requiredSet.has(key) || nullable || !writesToAccessorItself(property, context))) return {
			...inner,
			statements
		};
		return {
			statements: [
				`if (${presenceGuarded ? `${JSON.stringify(key)} in ${accessor} && ${target} != null` : `${target} != null`}) {`,
				...indent(statements),
				"}"
			],
			cyclicRefs: inner.cyclicRefs
		};
	}));
};
/**
* Emits a `switch` on the discriminator property for a `oneOf`/`anyOf` that
* carries an OpenAPI `discriminator` with an explicit `mapping`.
*/
const buildMappedUnionStatements = ({ schema, accessor, context, visitedRefs, depth, mode }) => {
	if (isBooleanJsonSchema(schema)) return emptyResult();
	const variants = schema.oneOf ?? schema.anyOf;
	const discriminator = schema.discriminator;
	const propertyName = discriminator?.propertyName;
	const mapping = discriminator?.mapping;
	if (!variants || typeof propertyName !== "string" || !mapping || typeof mapping !== "object") return emptyResult();
	const caseResults = Object.entries(mapping).map(([value, target]) => {
		let inner;
		try {
			inner = buildStatements({
				schema: { $ref: discriminatorMappingRef(target) },
				accessor,
				context,
				visitedRefs,
				depth,
				mode,
				mapSuppressed: true
			});
		} catch {
			return emptyResult();
		}
		if (inner.statements.length === 0) return inner;
		return {
			statements: [
				`case ${JSON.stringify(value)}: {`,
				...indent(inner.statements),
				"  break;",
				"}"
			],
			cyclicRefs: inner.cyclicRefs
		};
	});
	const merged = mergeResults(caseResults);
	if (merged.statements.length === 0) return merged;
	return {
		statements: [
			`switch (${propertyAccessor(accessor, propertyName)}) {`,
			...indent(merged.statements),
			"}"
		],
		cyclicRefs: merged.cyclicRefs
	};
};
/**
* A union's variant must declare its own `properties` for the structural
* walk: it reads properties off the union accessor, which an array or
* scalar variant has none of, and an `allOf` variant's inherited properties
* are never merged into `.properties` by the key-collection step below. An
* `allOf` variant admitted here would therefore be silently under-converted:
* its inherited properties contribute no keys at all, so a plain string
* re-declared at this level could get converted while a real nested date is
* never reached. Requiring own `properties` disqualifies the whole union
* instead, which is exactly today's (pre-structural-walk) behaviour for a
* union with an `allOf` variant, so this is not a regression.
*
* `items` (or `type: 'array'`) is checked first and disqualifies the variant
* outright, even when it also declares `properties`: `needsObjectCopy`
* treats any union as needing a shallow-object copy, and a hybrid
* array-and-object variant spread as `{ ...value }` in the request direction
* would silently drop its array-ness at runtime.
*
* A `type: 'null'` variant does reach here — whenever the union has more
* than one non-null variant, `normalizeSchema` does not collapse it (that
* collapse only applies to the single-non-null-variant `T | null` spelling)
* — and it's correctly rejected too, since a null schema declares no
* properties of its own.
*/
const isObjectVariant = (schema) => {
	if (schema.items || schema.type === "array") return false;
	return hasOwnProperties(schema);
};
/**
* Judges one variant without walking it.
*
* Asking `visitedRefs` here, before the walk, reads the same answer the walk
* would: no variant's ref is registered during classification, and the walk
* registers a variant's ref only for the duration of that one variant
* (released in a `finally` before the next), so no variant can hide a
* sibling's ref from another.
*/
const classifyUnionVariant = (variant, context, visitedRefs) => {
	let variantSchema;
	let ref;
	try {
		({schema: variantSchema, ref} = normalizeSchema(variant, context));
	} catch {
		return { kind: "unresolvable" };
	}
	if (ref && visitedRefs.has(ref)) return {
		kind: "cyclic",
		ref
	};
	return {
		kind: "walkable",
		schema: variantSchema,
		ref,
		objectShaped: isObjectVariant(variantSchema)
	};
};
/**
* Walks a variant for the sole purpose of learning which refs it sees close
* a cycle, and throws its statements away.
*
* The structural walk reads a variant's `properties` and nothing else, so a
* cycle reachable only through the parts it ignores — most concretely a
* disqualifying variant's `items` — is invisible to it, while the
* discriminated spelling of the same schema, which resolves every variant
* through `buildStatements`, finds it and drops the whole subtree. Running
* that very call (with the same `mapSuppressed: true` the mapped path
* passes, so the two also agree about a bare-map variant, whose values
* neither of them walks) and keeping only its `cyclicRefs` leaves "is this
* schema recursive?" answered identically in both spellings, whatever each
* then chooses to convert.
*
* ## Two callers, with different stakes
*
* The first caller is a union that is *already disqualified* and so emits no
* statements of its own. There, nothing learned can change what that union
* converts — it converts nothing either way — and the refs only travel
* upwards, where at most they make a recursive ancestor drop its subtree,
* which is this file's standing rule.
*
* The second caller is an *admitted* variant of a *qualified* union, walked
* for the branches the per-property walk never reads (`hasUnwalkedBranches`:
* an `allOf`, or a nested union beside the variant's own `properties`).
* There what is learned very much does change what converts: the returned
* refs become that variant's `branchRefs`, and `branchRefs.has(variantRef)`
* is half of the variant's own cycle-closing check — a hit wipes every
* statement the variant contributed. The statements this function throws
* away are still never emitted; it is the *refs* that carry weight on that
* path.
*
* A throw — an unresolvable `$ref` nested somewhere inside the variant —
* yields an empty set, so the caller proceeds as if the walk found no cycle.
* `buildStatements` restores `visitedRefs` through its own `finally` before
* the throw gets here, so the caller's bookkeeping is intact either way.
* That choice matches how the rest of the file treats a broken corner of a
* spec — `buildMappedUnionStatements` around a mapping target,
* `classifyUnionVariant` around a variant's own `$ref` — rather than turning
* it into a failed generation of the whole document. It is not free on the
* second caller: a cycle reachable only *past* the unresolvable ref goes
* unreported, and the variant keeps converting its own properties. It is the
* same trade the other two catches already make, over a spec that cannot be
* resolved as written.
*/
const discoverVariantCycles = ({ variant, accessor, context, visitedRefs, depth, mode }) => {
	try {
		return buildStatements({
			schema: variant,
			accessor,
			context,
			visitedRefs,
			depth,
			mode,
			mapSuppressed: true
		}).cyclicRefs;
	} catch {
		return /* @__PURE__ */ new Set();
	}
};
/**
* True when an admitted variant carries branches the per-property walk does
* not read, and which therefore have to be walked separately for what they
* can say about cycles: an `allOf`, or a `oneOf`/`anyOf` sitting beside the
* variant's own `properties`.
*
* Two shapes are deliberately absent. `items` never reaches here — it
* disqualifies the variant outright, and a disqualified union already takes
* the statement-free walk. And `additionalProperties` beside `properties` is
* suppressed for *every* path in this file by Rule 1 (`mapValueSchema`
* returns nothing for a properties-declaring schema), the mapped spelling
* included: a cycle hiding under such a map is invisible to both spellings,
* which agree by converting the variant's declared properties and leaving
* the map's values alone, cycle or no cycle. Walking it here would make this
* spelling alone drop the schema — a disagreement where there is currently
* none, over a branch neither spelling ever converts.
*/
const hasUnwalkedBranches = (schema) => (schema.allOf ?? []).length > 0 || schema.oneOf != null || schema.anyOf != null;
/**
* Walks a union that carries no usable `discriminator.mapping` by property
* presence instead of by discriminator value.
*
* For each property name any variant declares, the shared property builder
* runs once per variant declaring it, against the same accessor, and the
* resulting statements are compared. Identical statements mean the variants
* agree on what that property is, so one block is emitted, guarded by
* `'key' in accessor` — which is also what lets TypeScript narrow the union
* so the generated assignment type-checks. Statements that differ mean the
* variants disagree (a scalar against an array, an object against a string,
* or any nested divergence that changes what gets emitted), and that
* property is skipped while the rest of the union still converts. Comparing
* generated statements rather than schemas makes the check semantic: two
* spellings of the same shape agree, and no schema comparator has to exist.
*
* ## Two passes, and why they cannot be one
*
* Every variant is classified before any variant is walked, and then every
* classification that *can* be walked is walked — including the ones that
* already disqualified the union. Only afterwards is it decided whether the
* collected statements are emitted at all.
*
* Deciding and walking in a single interleaved pass would make the union's
* answer depend on the order the spec happens to list its variants in: a
* disqualifying variant (unresolvable, not object-shaped, or one an ancestor
* is already expanding) would abandon the loop, so a cycle reachable only
* through a *later* variant would never be discovered, and an ancestor
* holding the cyclic ref would convert its own levels while everything under
* the union silently stayed a string. The discriminated spelling of that same
* schema walks every mapping target regardless, finds the cycle and drops the
* whole subtree — so the two spellings would disagree on whether a schema is
* safe to convert. Splitting classification from walking is what makes the
* two passes independent of variant order.
*
* ## What each variant contributes
*
* Three classifications disqualify the union's *statements* — an
* unresolvable `$ref` target (the whole spec's generation must not abort
* over one bad variant, mirroring `buildMappedUnionStatements`'s own
* try/catch around a mapping target), a variant that is not object-shaped,
* and a variant whose ref an ancestor is already expanding. None of the
* three excuses discarding what the *other* variants learned: every
* `cyclicRefs` collected by any variant is merged into the union's result
* whatever becomes of its statements, because a cycle is no less real for
* having been found beside a variant that disqualified the union.
*
* A ref that is already registered when a variant is classified can only be
* an ancestor cycle (this same union nested inside a schema one of its own
* variants refers back to, directly or transitively) — a *sibling* variant's
* ref (`anyOf: [Cat, Dog]` where `Cat.pal: { $ref: Dog }`) is never
* registered while a different variant is being walked, so referring to a
* sibling is ordinary, not cyclic. It is reported the way every other
* recursive shape in this file reports one, `cyclicRefs: new Set([ref])`,
* and that ref is *added* to what propagates rather than consumed here: the
* ancestor that registered it is the one that closes the cycle and drops its
* subtree.
*
* A cycle can also surface without ever hitting that check — not at a
* variant's own ref, but deeper inside one of its properties (a variant
* referring to a *different* schema that itself, transitively, refers back
* to an ancestor, or back to this same variant through another path). Two
* things make that case work, mirroring what
* `buildStatements`/`buildResolvedStatements` already do for every non-union
* shape:
*
* - Every declaring variant's `cyclicRefs` for a key are always merged into
*   that key's result, even when the property contributes no statements or
*   the variants disagree — dropping them there would silently swallow a
*   cycle detected below a variant rather than at its own ref, leaving an
*   ancestor with no way to learn its own subtree needs to close.
* - After a variant's own properties are all walked, if its *own* ref shows
*   back up among the `cyclicRefs` they collected, the cycle closes right
*   here — the same `if (result.cyclicRefs.has(ref))` check
*   `buildResolvedStatements` runs for every ref-reached schema, just run by
*   hand here since a union manages its variants' ref bookkeeping itself
*   rather than going through `buildStatements`. That variant's contribution
*   is wiped (its subtree is exactly as internally inconsistent as any other
*   recursive schema reaching this point) and its own ref is removed from
*   what propagates further, while any other refs survive.
*/
const buildUndiscriminatedUnionStatements = ({ schema, accessor, context, visitedRefs, depth, mode }) => {
	const variants = schema.oneOf ?? schema.anyOf;
	if (!variants || variants.length === 0) return emptyResult();
	const classified = variants.map((variant) => classifyUnionVariant(variant, context, visitedRefs));
	const disqualified = classified.some((variant) => variant.kind !== "walkable" || !variant.objectShaped);
	const perVariant = [];
	const discoveredRefs = /* @__PURE__ */ new Set();
	for (const [index, variant] of classified.entries()) {
		if (variant.kind !== "walkable") continue;
		if (disqualified) {
			for (const cyclicRef of discoverVariantCycles({
				variant: variants[index],
				accessor,
				context,
				visitedRefs,
				depth,
				mode
			})) discoveredRefs.add(cyclicRef);
			continue;
		}
		const { schema: variantSchema, ref } = variant;
		if (ref) visitedRefs.add(ref);
		try {
			const perKey = /* @__PURE__ */ new Map();
			for (const key of Object.keys(variantSchema.properties ?? {})) perKey.set(key, buildPropertiesStatements({
				properties: { [key]: (variantSchema.properties ?? {})[key] },
				required: variantSchema.required,
				accessor,
				context,
				visitedRefs,
				depth,
				mode,
				presenceGuarded: true
			}));
			let branchRefs = hasUnwalkedBranches(variantSchema) ? discoverVariantCycles({
				variant: variantSchema,
				accessor,
				context,
				visitedRefs,
				depth,
				mode
			}) : /* @__PURE__ */ new Set();
			if (ref) {
				const variantRef = ref;
				if (branchRefs.has(variantRef) || [...perKey.values()].some((result) => result.cyclicRefs.has(variantRef))) {
					for (const [key, result] of perKey) {
						const cyclicRefs = new Set(result.cyclicRefs);
						cyclicRefs.delete(variantRef);
						perKey.set(key, {
							statements: [],
							cyclicRefs
						});
					}
					branchRefs = new Set(branchRefs);
					branchRefs.delete(variantRef);
				}
			}
			perVariant.push({
				schema: variantSchema,
				perKey,
				branchRefs
			});
		} finally {
			if (ref) visitedRefs.delete(ref);
		}
	}
	const learned = {
		statements: [],
		cyclicRefs: /* @__PURE__ */ new Set([
			...classified.flatMap((variant) => variant.kind === "cyclic" ? [variant.ref] : []),
			...discoveredRefs,
			...perVariant.flatMap(({ perKey, branchRefs }) => [...branchRefs, ...[...perKey.values()].flatMap((result) => [...result.cyclicRefs])])
		])
	};
	if (disqualified) return learned;
	const keys = [];
	for (const { schema: variantSchema } of perVariant) for (const key of Object.keys(variantSchema.properties ?? {})) {
		if (Object.hasOwn(Object.prototype, key)) continue;
		if (!keys.includes(key)) keys.push(key);
	}
	const results = keys.map((key) => {
		const declaringResults = perVariant.flatMap(({ perKey }) => {
			const result = perKey.get(key);
			return result ? [result] : [];
		});
		const cyclicRefs = new Set(declaringResults.flatMap((result) => [...result.cyclicRefs]));
		const [first, ...rest] = declaringResults;
		if (!first || first.statements.length === 0) return {
			statements: [],
			cyclicRefs
		};
		return {
			statements: rest.every((result) => result.statements.join("\n") === first.statements.join("\n")) ? first.statements : [],
			cyclicRefs
		};
	});
	return mergeResults([learned, ...results]);
};
/**
* Emits the statements for a `oneOf`/`anyOf`. With an explicit
* `discriminator.mapping` the variant is known from the discriminator value,
* so a `switch` dispatches precisely; without one, the variants are walked
* structurally by property presence. A union that carries a `discriminator`
* but no `mapping` takes the structural path too — the mapping is what the
* `switch` needs, not the property name.
*/
const buildUnionStatements = (params) => params.schema.discriminator?.propertyName && params.schema.discriminator?.mapping ? buildMappedUnionStatements(params) : buildUndiscriminatedUnionStatements(params);
const buildDateTransformStatements = ({ schema, accessor, context, visitedRefs = /* @__PURE__ */ new Set(), depth = 0 }) => buildStatements({
	schema,
	accessor,
	context,
	visitedRefs,
	depth,
	mode: responseMode
}).statements;
const isDateOnlySchema = (schema) => !isBooleanJsonSchema(schema) && schema.format === "date";
/**
* OpenAPI `format: date` is a calendar day, but JavaScript has no date-only
* type and `Date.prototype.toJSON()` always renders an instant. The value is
* read as its UTC calendar day, matching what the mock generator emits for the
* same format (mock/src/faker/constants.ts).
*
* Guarded on `instanceof Date`: the same accessor can be reached twice (an
* `allOf` branch re-declaring a property its base already declares, or a
* discriminated-union variant re-declaring one its parent schema's own
* `properties` also converts), and unlike the response leaf's `new Date(...)`
* — a clone, harmless to repeat — this conversion produces a string. Running
* it twice without the guard would call `.toISOString()` on that string and
* throw at runtime. The guard makes a second pass a no-op instead.
*/
const serializeLeafStatement = (read, write) => `${write} = ${read} instanceof Date ? (${read}.toISOString().slice(0, 10) as unknown as Date) : ${read};`;
/**
* True when the subtree writes into the accessor's own properties, so the
* accessor must be shallow-copied before those writes. A bare array (`items`
* with no sibling `properties`/`allOf` contributing any) is excluded: `.map`
* already produces a new array, and spreading one would turn it into an
* object. `items`, `properties` and `allOf` are siblings in JSON Schema (see
* buildResolvedStatements), so `items` being present must not short-circuit
* before `allOf` is checked — a schema combining the two still needs a copy
* for whichever branch writes properties.
*
* A `oneOf`/`anyOf` counts too, mapped or not: a discriminated union's own
* `switch` writes into the accessor's properties exactly like a plain
* `properties` block does (hence `schema.discriminator` below), and the
* structural walk (`buildUndiscriminatedUnionStatements`) does the same
* for an undiscriminated one — it has no `properties` of its own for
* `hasOwnProperties` to see, so without this it would go uncopied and the
* generated request serializer would write straight into the caller's
* object. This is deliberately coarse, matching the existing
* `schema.discriminator` check: it doesn't ask whether the union actually
* ends up emitting a write, only whether it structurally could, since a
* copy nobody ends up needing is harmless where a missing one is a
* mutation bug.
*/
const needsObjectCopy = (schemaOrRef, context, seenRefs = /* @__PURE__ */ new Set()) => {
	const { schema, ref } = normalizeSchema(schemaOrRef, context);
	if (ref) {
		if (seenRefs.has(ref)) return false;
		seenRefs.add(ref);
	}
	if (isDateOnlySchema(schema)) return false;
	if (hasOwnProperties(schema) || schema.discriminator || schema.oneOf || schema.anyOf) return true;
	return (schema.allOf ?? []).some((branch) => needsObjectCopy(branch, context, seenRefs));
};
/**
* True when the schema is array-shaped — carries `items`, either directly or
* through an `allOf` branch. Mirrors `needsObjectCopy`'s own `allOf`
* recursion (and its `seenRefs` cycle guard) so the two predicates agree on
* shape: `needsObjectCopy` already looks through `allOf` to find an object
* shape, and the array/object conflict guard above must see an array shape
* the same way, or a schema combining an array `allOf` branch with an object
* `allOf` branch (rather than a sibling `items` and `properties`) slips past
* the guard and emits both an array reassignment and an object-copy
* property write, which crashes at runtime.
*/
const isArrayShaped = (schemaOrRef, context, seenRefs = /* @__PURE__ */ new Set()) => {
	const { schema, ref } = normalizeSchema(schemaOrRef, context);
	if (ref) {
		if (seenRefs.has(ref)) return false;
		seenRefs.add(ref);
	}
	if (schema.items) return true;
	return (schema.allOf ?? []).some((branch) => isArrayShaped(branch, context, seenRefs));
};
const buildCopyingItemsStatements = ({ items, accessor, context, visitedRefs, depth, mode }) => {
	const element = `item${depth}`;
	const value = `value${depth}`;
	const { nullable } = normalizeSchema(items, context);
	const inner = buildStatements({
		schema: items,
		accessor: value,
		context,
		visitedRefs,
		depth: depth + 1,
		mode
	});
	if (inner.statements.length === 0) return inner;
	const body = [
		...nullable ? [`if (${element} == null) return ${element};`] : [],
		`let ${value} = ${element};`,
		...needsObjectCopy(items, context) ? [`${value} = { ...${value} };`] : [],
		...inner.statements,
		`return ${value};`
	];
	return {
		statements: [
			`${accessor} = ${accessor}.map((${element}) => {`,
			...indent(body),
			"});"
		],
		cyclicRefs: inner.cyclicRefs
	};
};
/**
* The request direction's map traversal. Unlike the response direction, a
* request-mode map never needs the `writesToAccessorItself` distinction:
* every value is bound to a `let`, so a date leaf reassigns that `let`
* exactly the way `buildCopyingItemsStatements` reassigns its own `value`
* binding — no in-place key write is ever required.
*
* The map itself is shallow-copied unconditionally, up front, before the
* loop — mirroring the array builder's copy-on-path discipline, but on the
* container itself rather than inside a `.map()` callback, since a map has
* no built-in traversal that already produces a fresh copy the way `.map`
* does for arrays. Each value is then read into its own `let`, optionally
* spread-copied when it needs its own writable copy (an object, exactly the
* same `needsObjectCopy` check the array builder makes for its elements),
* mutated by the recursive walk, and written back through the key.
*
* A nullable value is skipped with `continue` rather than wrapped in an
* `if`: the map has already been copied, so the original (possibly null)
* value is already sitting at that key and needs no rewrite.
*/
const buildCopyingMapStatements = ({ values, accessor, context, visitedRefs, depth, mode }) => {
	const key = `key${depth}`;
	const value = `value${depth}`;
	const { nullable } = normalizeSchema(values, context);
	const inner = buildStatements({
		schema: values,
		accessor: value,
		context,
		visitedRefs,
		depth: depth + 1,
		mode
	});
	if (inner.statements.length === 0) return inner;
	const body = [
		`let ${value} = ${accessor}[${key}]!;`,
		...nullable ? [`if (${value} == null) continue;`] : [],
		...needsObjectCopy(values, context) ? [`${value} = { ...${value} };`] : [],
		...inner.statements,
		`${accessor}[${key}] = ${value};`
	];
	return {
		statements: [
			`${accessor} = { ...${accessor} };`,
			`for (const ${key} of Object.keys(${accessor})) {`,
			...indent(body),
			"}"
		],
		cyclicRefs: inner.cyclicRefs
	};
};
const requestMode = {
	isLeaf: isDateOnlySchema,
	leafStatement: serializeLeafStatement,
	objectPrelude: (accessor, schema, context) => needsObjectCopy(schema, context) ? [`${accessor} = { ...${accessor} };`] : [],
	arrayStatements: buildCopyingItemsStatements,
	mapStatements: buildCopyingMapStatements,
	propertyWriteAccessor: () => void 0,
	skipProperty: (schema) => !isBooleanJsonSchema(schema) && schema.readOnly === true,
	dropArrayObjectConflict: true
};
const buildRequestDateSerializeStatements = ({ schema, accessor, context, visitedRefs = /* @__PURE__ */ new Set(), depth = 0 }) => buildStatements({
	schema,
	accessor,
	context,
	visitedRefs,
	depth,
	mode: requestMode
}).statements;
/**
* Resolves a request body down to its single JSON content schema. Returns
* undefined for non-JSON bodies and for bodies offering several JSON media
* types, where there is no one schema to walk.
*/
const resolveJsonBodySchema = (body, context) => {
	const content = (!isInlineSchema(body.originalSchema) ? resolveRef(body.originalSchema, context).schema : body.originalSchema).content;
	if (!content) return void 0;
	const jsonEntries = Object.entries(content).filter(([mediaType]) => mediaType.toLowerCase().includes("json"));
	if (jsonEntries.length !== 1) return void 0;
	return jsonEntries[0][1].schema;
};
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
const generateRequestDateSerializer = ({ operationName, body, context }) => {
	if (body.isBlob || !body.definition || !body.implementation) return void 0;
	if (!body.contentType?.toLowerCase().includes("json")) return void 0;
	const schema = resolveJsonBodySchema(body, context);
	if (!schema) return void 0;
	const statements = buildRequestDateSerializeStatements({
		schema,
		accessor: "copy",
		context
	});
	if (statements.length === 0) return void 0;
	const dataType = body.definition;
	const modelType = /^NonReadonly<(.+)>$/s.exec(dataType)?.[1];
	const workingType = modelType ? ` as unknown as ${modelType}` : "";
	const returnValue = modelType ? `copy as unknown as ${dataType}` : "copy";
	const declaration = needsObjectCopy(schema, context) ? `const copy = { ...data }${workingType};` : `let copy = data${workingType};`;
	const name = `serialize${pascal(operationName)}Request`;
	const optionalSuffix = body.isOptional ? " | undefined" : "";
	return {
		name,
		implementation: `const ${name} = (data: ${dataType}${optionalSuffix}): ${dataType}${optionalSuffix} => {
  if (data == null) return data;
  ${declaration}
${indent(statements).join("\n")}
  return ${returnValue};
};
`
	};
};
/**
* Builds a `deserialize{Op}Response` function converting schema-declared
* date fields of the (single) JSON success response in place. Returns
* undefined when there is nothing to transform, so callers emit no code.
*/
const generateResponseDateDeserializer = ({ operationName, response, context }) => {
	if (response.isBlob) return void 0;
	if (response.types.success.length !== 1) return void 0;
	const [successType] = response.types.success;
	if (!successType.originalSchema || !successType.contentType.toLowerCase().includes("json")) return;
	const statements = buildDateTransformStatements({
		schema: successType.originalSchema,
		accessor: "data",
		context
	});
	if (statements.length === 0) return void 0;
	const dataType = response.definition.success || "unknown";
	const name = `deserialize${pascal(operationName)}Response`;
	return {
		name,
		implementation: `const ${name} = (data: ${dataType}): ${dataType} => {
  if (data == null) return data;
${indent(statements).join("\n")}
  return data;
};
`
	};
};
//#endregion
//#region src/generators/factory.ts
const circularRefCache = /* @__PURE__ */ new WeakMap();
function getSchemasPath(context) {
	const { schemas, target } = context.output;
	if (schemas) return normalizeSafe(isString(schemas) ? schemas : schemas.path);
	const { dirname, filename } = getFileInfo(target);
	return joinSafe(dirname, filename + ".schemas");
}
function getSchemaImportPath(refName, context) {
	if (context.output.factoryMethods?.mode === "single") return;
	const importPathBase = getSchemasImportPath(context.output.schemas);
	if (importPathBase) return joinSafe(importPathBase, conventionName(refName, context.output.namingConvention));
	let outputDir = context.output.factoryMethods?.outputDirectory;
	let schemasPath = getSchemasPath(context);
	if (context.output.workspace) {
		if (outputDir && !isAbsolute(outputDir)) outputDir = resolve(context.output.workspace, outputDir);
		if (schemasPath && !isAbsolute(schemasPath)) schemasPath = resolve(context.output.workspace, schemasPath);
	}
	return joinSafe(outputDir ? relativeSafe(outputDir, schemasPath) : "./", conventionName(refName, context.output.namingConvention));
}
function getResolvedRef(schema, context) {
	return resolveRef(schema, context);
}
function hasSchemaFlag(schema, key) {
	if (isBooleanJsonSchema(schema)) return false;
	return Boolean(schema[key]);
}
function getProperties(schema) {
	if (isBooleanJsonSchema(schema)) return {};
	return schema.properties ?? {};
}
function getItems(schema) {
	if (isBooleanJsonSchema(schema)) return void 0;
	return schema.items;
}
function getAdditionalProperties(schema) {
	if (isBooleanJsonSchema(schema)) return void 0;
	return schema.additionalProperties ?? schema.unevaluatedProperties;
}
function getSchemas(schemas) {
	return schemas;
}
function getExtendedProps(schema) {
	const extended = schema;
	return {
		constValue: extended.const,
		prefixItems: extended.prefixItems,
		minItems: extended.minItems
	};
}
function generateFactory(schema, name, context) {
	if (isBooleanJsonSchema(schema) || !canGenerateSchema(schema) || !context.output.factoryMethods) return void 0;
	const { functionNamePrefix, mode } = context.output.factoryMethods;
	const factoryName = `${functionNamePrefix}${pascal(name)}`;
	const imports = [];
	const payload = buildPayload(schema, context, [name], imports);
	if (mode !== "single") {
		const schemaImportPath = getSchemaImportPath(name, context);
		imports.push({
			name,
			importPath: schemaImportPath
		});
	}
	return {
		model: `export function ${factoryName}(): ${name} {\n  return ${payload};\n}\n`,
		imports
	};
}
function canGenerateSchema(schema) {
	if (isBooleanJsonSchema(schema)) return false;
	return schema.type === "object" || schema.type === "array" || !!schema.properties || !!schema.allOf || !!schema.oneOf || !!schema.anyOf || !!schema.items || !!schema.enum;
}
function hasCircularReference(target, sourceName, context, visited = /* @__PURE__ */ new Set()) {
	if (!isInlineSchema(target)) {
		const { imports, schema } = getResolvedRef(target, context);
		const refName = imports[0]?.name;
		if (refName === sourceName) return true;
		if (refName && visited.has(refName)) return false;
		if (refName) visited.add(refName);
		let cache = circularRefCache.get(context);
		if (!cache) {
			cache = /* @__PURE__ */ new Map();
			circularRefCache.set(context, cache);
		}
		const cacheKey = refName ? `${sourceName}::${refName}` : void 0;
		if (cacheKey) {
			const cached = cache.get(cacheKey);
			if (cached !== void 0) return cached;
		}
		const result = hasCircularReference(schema, sourceName, context, visited);
		if (cacheKey) cache.set(cacheKey, result);
		return result;
	}
	if (isBooleanJsonSchema(target)) return false;
	const check = (schemas) => schemas?.some((s) => hasCircularReference(s, sourceName, context, visited)) ?? false;
	const items = getItems(target);
	const additionalProperties = getAdditionalProperties(target);
	return check(getSchemas(target.allOf)) || check(getSchemas(target.oneOf)) || check(getSchemas(target.anyOf)) || Object.values(getProperties(target)).some((s) => hasCircularReference(s, sourceName, context, visited)) || !!items && hasCircularReference(items, sourceName, context, visited) || typeof additionalProperties === "object" && hasCircularReference(additionalProperties, sourceName, context, visited);
}
function buildPayload(target, context, parents, imports) {
	if (!isInlineSchema(target)) return buildRefPayload(target, context, parents, imports);
	if (isBooleanJsonSchema(target)) return "{}";
	const schema = target;
	const payloads = [];
	if (schema.allOf) payloads.push(buildAllOfPayload(getSchemas(schema.allOf) ?? [], context, parents, imports));
	else if (schema.oneOf) payloads.push(buildFirstOfPayload(getSchemas(schema.oneOf) ?? [], context, parents, imports));
	else if (schema.anyOf) payloads.push(buildFirstOfPayload(getSchemas(schema.anyOf) ?? [], context, parents, imports));
	if (Object.keys(getProperties(schema)).length > 0) payloads.push(buildObjectPayload(schema, context, parents, imports));
	if (payloads.length > 0) return payloads.length === 1 ? payloads[0] : `Object.assign({}, ${payloads.join(", ")})`;
	const { constValue } = getExtendedProps(schema);
	if (constValue !== void 0) return formatValue(constValue);
	if (schema.default !== void 0) return buildDefaultPayload(schema, context);
	const schemaType = inferSchemaType(schema);
	if (schemaType === "object") return "{}";
	if (schemaType === "array") return buildArrayPayload(schema, context, parents, imports);
	return buildPrimitivePayload(schema, schemaType, context);
}
function buildRefPayload(schema, context, parents, imports) {
	const { schema: resolved, imports: refImports } = getResolvedRef(schema, context);
	const refName = refImports[0]?.name;
	if (!refName) return "{}";
	if (parents.includes(refName) || hasCircularReference(resolved, parents[0], context)) {
		imports.push({
			name: refName,
			importPath: getSchemaImportPath(refName, context)
		});
		return `{} as ${refName}`;
	}
	const { functionNamePrefix = "create", mode = "single" } = context.output.factoryMethods ?? {};
	const refFactoryName = `${functionNamePrefix}${pascal(refName)}`;
	if (mode !== "single-split") {
		const importPath = resolveImportPath(mode, refName, context);
		imports.push({
			name: refFactoryName,
			importPath,
			isConstant: true
		});
	}
	imports.push({
		name: refName,
		importPath: getSchemaImportPath(refName, context)
	});
	return `${refFactoryName}()`;
}
function resolveImportPath(mode, refName, context) {
	const baseName = conventionName(refName, context.output.namingConvention);
	const pkgBase = getSchemasImportPath(context.output.schemas);
	switch (mode) {
		case "split": return pkgBase ? joinSafe(pkgBase, `${baseName}.factory`) : `./${baseName}.factory`;
		case "single-split": return pkgBase ? joinSafe(pkgBase, conventionName("factoryMethods", context.output.namingConvention)) : `./${conventionName("factoryMethods", context.output.namingConvention)}`;
		case "single": return pkgBase ? joinSafe(pkgBase, baseName) : `./${baseName}`;
	}
}
function buildAllOfPayload(allOf, context, parents, imports) {
	const payloads = allOf.map((s) => buildPayload(s, context, parents, imports));
	return payloads.length > 0 ? `Object.assign({}, ${payloads.join(", ")})` : "{}";
}
function buildFirstOfPayload(schemas, context, parents, imports) {
	const first = schemas[0];
	return first ? buildPayload(first, context, parents, imports) : "{}";
}
function buildObjectPayload(schema, context, parents, imports) {
	if (isBooleanJsonSchema(schema)) return "{}";
	const { includeOptionalProperty = false } = context.output.factoryMethods ?? {};
	const props = getProperties(schema);
	const requiredProps = schema.required ?? [];
	const entries = Object.entries(props);
	if (context.output.propertySortOrder === PropertySortOrder.ALPHABETICAL) entries.sort(([a], [b]) => a.localeCompare(b));
	const includeOptional = includeOptionalProperty;
	const lines = [];
	for (const [key, prop] of entries) {
		const isRequired = requiredProps.includes(key);
		const resolved = isInlineSchema(prop) ? prop : getResolvedRef(prop, context).schema;
		const isReadOnly = hasSchemaFlag(prop, "readOnly") || hasSchemaFlag(resolved, "readOnly");
		const isWriteOnly = hasSchemaFlag(prop, "writeOnly") || hasSchemaFlag(resolved, "writeOnly");
		if (!isRequired) {
			if (isReadOnly) continue;
			if (!isWriteOnly && !includeOptional) continue;
		}
		const payload = buildPayload(prop, context, parents, imports);
		const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
		lines.push(`${safeKey}: ${payload}`);
	}
	return `{\n    ${lines.join(",\n    ")}\n  }`;
}
function buildArrayPayload(schema, context, parents, imports) {
	if (isBooleanJsonSchema(schema)) return "[]";
	const { prefixItems, minItems } = getExtendedProps(schema);
	const items = getItems(schema);
	if (prefixItems && prefixItems.length > 0) return `[${prefixItems.map((item) => buildPayload(item, context, parents, imports)).join(", ")}]`;
	if (minItems && items) {
		const MAX_MIN_ITEMS = 50;
		if (minItems > MAX_MIN_ITEMS) logger.warn(`minItems is ${minItems}, capping at ${MAX_MIN_ITEMS} to prevent massive payload.`);
		const count = Math.min(minItems, MAX_MIN_ITEMS);
		const itemPayload = buildPayload(items, context, parents, imports);
		return `[${Array.from({ length: count }).fill(itemPayload).join(", ")}]`;
	}
	return "[]";
}
function inferSchemaType(schema) {
	if (isBooleanJsonSchema(schema)) return void 0;
	let type = schema.type;
	if (Array.isArray(type)) {
		const nonNull = type.filter((t) => t !== "null");
		type = nonNull.length > 0 ? nonNull[0] : "null";
	}
	if (!type && schema.items) return "array";
	if (!type && schema.enum) {
		const first = schema.enum[0];
		if (typeof first === "number") return "number";
		if (typeof first === "boolean") return "boolean";
		return "string";
	}
	return type;
}
function buildDefaultPayload(schema, context) {
	if (isBooleanJsonSchema(schema)) return formatValue(void 0);
	if (context.output.override.useDates && typeof schema.default === "string" && (schema.format === "date" || schema.format === "date-time")) return `new Date('${jsStringLiteralEscape(schema.default)}')`;
	return formatValue(schema.default);
}
function buildPrimitivePayload(schema, schemaType, context) {
	if (isBooleanJsonSchema(schema)) return "{}";
	if (schemaType === "null") return "null";
	const enumValues = schema.enum;
	if (schemaType === "boolean") return enumValues && enumValues.length > 0 ? formatValue(enumValues[0]) : "false";
	if (schemaType === "number" || schemaType === "integer") return enumValues && enumValues.length > 0 ? formatValue(enumValues[0]) : "0";
	if (schemaType === "string") {
		if (enumValues && enumValues.length > 0) return formatValue(enumValues[0]);
		if (schema.format === "date" || schema.format === "date-time") return context.output.override.useDates ? "new Date(0)" : `'${(/* @__PURE__ */ new Date(0)).toISOString()}'`;
		return "''";
	}
	return "undefined as unknown";
}
function formatValue(val) {
	if (val === null) return "null";
	if (typeof val === "string") return JSON.stringify(val);
	if (typeof val === "object") return JSON.stringify(val);
	return String(val);
}
//#endregion
//#region src/generators/imports.ts
function generateImports({ imports, namingConvention = NamingConvention.CAMEL_CASE, importExtension = "" }) {
	if (imports.length === 0) return "";
	const normalized = uniqueWith(imports, (a, b) => a.name === b.name && a.default === b.default && a.alias === b.alias && a.values === b.values && a.isConstant === b.isConstant && a.namespaceImport === b.namespaceImport && a.syntheticDefaultImport === b.syntheticDefaultImport && a.importPath === b.importPath).map((imp) => ({
		...imp,
		importPath: imp.importPath ?? `./${conventionName(imp.name, namingConvention)}${importExtension}`
	}));
	return [...groupBy(normalized, (imp) => !imp.default && !imp.namespaceImport && !imp.syntheticDefaultImport && !imp.values && !imp.isConstant ? `aggregate|${imp.importPath}` : `single|${imp.importPath}|${imp.name}|${imp.alias ?? ""}|${String(imp.default)}|${String(imp.namespaceImport)}|${String(imp.syntheticDefaultImport)}|${String(imp.values)}|${String(imp.isConstant)}`)].toSorted(([a], [b]) => compareNatural(a, b)).map(([, group]) => {
		const sample = group[0];
		if (!sample.default && !sample.namespaceImport && !sample.syntheticDefaultImport && !sample.values && !sample.isConstant) return `import type { ${[...new Set(group.map(({ name, alias }) => `${name}${alias ? ` as ${alias}` : ""}`))].toSorted().join(", ")} } from '${sample.importPath}';`;
		const { name, values, alias, isConstant, importPath } = sample;
		return `import ${!values && !isConstant ? "type " : ""}{ ${name}${alias ? ` as ${alias}` : ""} } from '${importPath}';`;
	}).join("\n");
}
function generateMutatorImports({ mutators, implementation, oneMore }) {
	let imports = "";
	for (const mutator of uniqueWith(mutators, (a, b) => a.name === b.name && a.default === b.default)) {
		if (implementation && !implementation.split(/[^\w$]+/).includes(mutator.name)) continue;
		const isRelativeImport = mutator.path.startsWith(".");
		const path = `${oneMore && isRelativeImport ? "../" : ""}${mutator.path}`;
		const importDefault = mutator.default ? mutator.name : `{ ${mutator.name} }`;
		imports += `import ${importDefault} from '${path}';`;
		imports += "\n";
		if (implementation && (mutator.hasErrorType || mutator.bodyTypeName)) {
			let errorImportName = "";
			const targetErrorImportName = mutator.default ? `ErrorType as ${mutator.errorTypeName}` : mutator.errorTypeName;
			if (mutator.hasErrorType && implementation.includes(mutator.errorTypeName) && !imports.includes(`{ ${targetErrorImportName} `)) errorImportName = targetErrorImportName;
			let bodyImportName = "";
			const targetBodyImportName = mutator.default ? `BodyType as ${mutator.bodyTypeName}` : mutator.bodyTypeName;
			if (mutator.bodyTypeName && implementation.includes(mutator.bodyTypeName) && !imports.includes(` ${targetBodyImportName} }`)) bodyImportName = targetBodyImportName ?? "";
			if (bodyImportName || errorImportName) {
				imports += `import type { ${errorImportName}${errorImportName && bodyImportName ? " , " : ""}${bodyImportName} } from '${path}';`;
				imports += "\n";
			}
		}
	}
	return imports;
}
function generateDependency({ deps, isAllowSyntheticDefaultImports, dependency, projectName, key, onlyTypes }) {
	const defaultDep = deps.find((e) => e.default && (isAllowSyntheticDefaultImports || !e.syntheticDefaultImport));
	const namespaceImportDep = defaultDep ? void 0 : deps.find((e) => !!e.namespaceImport || !isAllowSyntheticDefaultImports && e.syntheticDefaultImport);
	const depsString = unique(deps.filter((e) => !e.default && !e.syntheticDefaultImport && !e.namespaceImport).map(({ name, alias }) => alias ? `${name} as ${alias}` : name)).toSorted().join(",\n  ");
	let importString = "";
	const namespaceImportString = namespaceImportDep ? `import * as ${namespaceImportDep.name} from '${dependency}';` : "";
	if (namespaceImportString) {
		if (deps.length === 1) return namespaceImportString;
		importString += `${namespaceImportString}\n`;
	}
	importString += `import ${onlyTypes ? "type " : ""}${defaultDep ? `${defaultDep.name}${depsString ? "," : ""}` : ""}${depsString ? `{\n  ${depsString}\n}` : ""} from '${dependency}${key !== "default" && projectName ? `/${projectName}` : ""}';`;
	return importString;
}
const IDENTIFIER_PATTERN = /[$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*/gu;
/**
* Whether the identifier starting at `start` is a member name — the `map` of
* `value.map(...)` — rather than a reference to a binding in scope.
*
* A member name is never the import: an imported binding that the code really
* uses has to appear bare somewhere (`map(...)`, `{ map }`, `Pet`), because a
* name after a dot is a property of the object on its left. Reading one as a
* reference kept imports alive that nothing used — the rxjs `map` that every
* generated Angular `httpResource` file carried came from the `.map((item) =>`
* in its own query-param serializer (#4143).
*
* `...spread` is not a member access even though a `.` sits in front of it, so
* the third dot of a spread token does not count. Two dots are not enough to
* recognize one: `1..map` is valid, where the first dot ends the numeric
* literal `1.` and the second is the member access. Optional chaining
* (`value?.map`) is a member access like any other.
*/
function isMemberName(source, start) {
	let index = start - 1;
	while (index >= 0 && /\s/.test(source[index])) index--;
	if (index < 0 || source[index] !== ".") return false;
	return !(source[index - 1] === "." && source[index - 2] === ".");
}
function getReferencedIdentifiers(implementation) {
	const identifiers = /* @__PURE__ */ new Set();
	for (const match of implementation.matchAll(IDENTIFIER_PATTERN)) if (match.index !== void 0 && !isMemberName(implementation, match.index)) identifiers.add(match[0]);
	return identifiers;
}
function addDependencyFromIdentifiers({ referencedIdentifiers, exports, dependency, projectName, isAllowSyntheticDefaultImports }) {
	const toAdds = exports.filter((e) => {
		const identifier = e.alias?.length ? e.alias : e.name;
		if (!identifier) return false;
		return referencedIdentifiers.has(identifier);
	});
	if (toAdds.length === 0) return;
	const groupedBySpecKey = { default: {
		types: [],
		values: []
	} };
	for (const dep of toAdds) {
		const key = "default";
		if (dep.values && (isAllowSyntheticDefaultImports || !dep.syntheticDefaultImport)) groupedBySpecKey[key].values.push(dep);
		else groupedBySpecKey[key].types.push(dep);
	}
	return Object.entries(groupedBySpecKey).map(([key, { values, types }]) => {
		let dep = "";
		if (values.length > 0) dep += generateDependency({
			deps: values,
			isAllowSyntheticDefaultImports,
			dependency,
			projectName,
			key,
			onlyTypes: false
		});
		if (types.length > 0) {
			let uniqueTypes = types;
			if (values.length > 0) uniqueTypes = types.filter((t) => !values.some((v) => v.name === t.name && (v.alias ?? "") === (t.alias ?? "")));
			if (uniqueTypes.length > 0) {
				if (values.length > 0) dep += "\n";
				dep += generateDependency({
					deps: uniqueTypes,
					isAllowSyntheticDefaultImports,
					dependency,
					projectName,
					key,
					onlyTypes: true
				});
			}
		}
		return dep;
	}).join("\n") + "\n";
}
function addDependency({ implementation, ...options }) {
	return addDependencyFromIdentifiers({
		...options,
		referencedIdentifiers: getReferencedIdentifiers(implementation)
	});
}
function getLibName(code) {
	return (code.split(" from ").at(-1) ?? "").split(";")[0].trim();
}
function generateDependencyImports(implementation, imports, projectName, hasSchemaDir, isAllowSyntheticDefaultImports) {
	if (imports.length === 0) return "";
	const referencedIdentifiers = getReferencedIdentifiers(implementation);
	const dependencies = imports.map((dep) => addDependencyFromIdentifiers({
		...dep,
		referencedIdentifiers,
		projectName,
		hasSchemaDir,
		isAllowSyntheticDefaultImports
	})).filter((x) => Boolean(x)).toSorted((a, b) => {
		const aLib = getLibName(a);
		const bLib = getLibName(b);
		if (aLib === bLib) return 0;
		if (aLib.startsWith("'.") && !bLib.startsWith("'.")) return 1;
		return aLib < bLib ? -1 : 1;
	}).join("\n");
	return dependencies ? dependencies + "\n" : "";
}
function generateVerbImports({ response, body, queryParams, props, headers, params }) {
	return [
		...response.imports,
		...body.imports,
		...props.flatMap((prop) => prop.type === GetterPropType.NAMED_PATH_PARAMS ? [{ name: prop.schema.name }] : []),
		...queryParams ? [{ name: queryParams.schema.name }] : [],
		...headers ? [{ name: headers.schema.name }] : [],
		...params.flatMap(({ imports }) => imports)
	].flatMap((imp) => {
		if (imp.name !== "Error" || !imp.values || imp.alias) return [imp];
		return [{
			...imp,
			values: void 0
		}, {
			...imp,
			alias: "ErrorSchema",
			values: true
		}];
	});
}
//#endregion
//#region src/generators/input-filters.ts
const COMPONENT_TYPES = [
	"schemas",
	"responses",
	"parameters",
	"requestBodies"
];
function filteredVerbs(verbs, filters) {
	if (filters?.tags === void 0) return Object.entries(verbs);
	const filterTags = filters.tags;
	const filterMode = filters.mode ?? "include";
	return Object.entries(verbs).filter(([, operation]) => {
		if (!operation || typeof operation !== "object") return false;
		const isMatch = (operation.tags ?? []).some((tag) => filterTags.some((filterTag) => filterTag instanceof RegExp ? filterTag.test(tag) : filterTag === tag));
		return filterMode === "exclude" ? !isMatch : isMatch;
	});
}
function findRefs(value) {
	if (!value || typeof value !== "object") return [];
	if (Array.isArray(value)) return value.flatMap((item) => findRefs(item));
	const obj = value;
	const refs = [];
	if (typeof obj.$ref === "string") refs.push(obj.$ref);
	return refs.concat(Object.values(obj).flatMap((val) => findRefs(val)));
}
function parseComponentRef(ref) {
	const parts = ref.split("/");
	if (parts[0] !== "#" || parts[1] !== "components" || parts.length < 4) return;
	const type = parts[2];
	const name = parts[3];
	if (!COMPONENT_TYPES.includes(type)) return;
	return {
		type,
		name
	};
}
function getComponentNames(refs, spec) {
	return refs.map((ref) => parseComponentRef(ref)).filter((parsed) => !!parsed && !!spec.components?.[parsed.type]?.[parsed.name]);
}
function resolveReferencedComponents(refs, spec, resolved) {
	const newComponents = getComponentNames(refs, spec).filter(({ type, name }) => !resolved[type].includes(name));
	if (newComponents.length === 0) return resolved;
	const nextResolved = {
		schemas: [...resolved.schemas],
		responses: [...resolved.responses],
		parameters: [...resolved.parameters],
		requestBodies: [...resolved.requestBodies]
	};
	for (const { type, name } of newComponents) nextResolved[type].push(name);
	return resolveReferencedComponents(newComponents.flatMap(({ type, name }) => findRefs(spec.components?.[type]?.[name])), spec, nextResolved);
}
const collectReferencedComponents = (spec, tags, mode) => {
	const filters = {
		tags,
		mode
	};
	return resolveReferencedComponents(Object.values(spec.paths ?? {}).filter((pathItem) => !!pathItem).flatMap((pathItem) => {
		return [...filteredVerbs(pathItem, filters).flatMap(([, operation]) => findRefs(operation)), ...findRefs(pathItem.parameters)];
	}), spec, {
		schemas: [],
		responses: [],
		parameters: [],
		requestBodies: []
	});
};
/**
* Prune operations that do not reference any of the kept schemas, so only
* artifacts related to the requested schemas are generated (#3689).
*
* An operation is kept when at least one of its (transitively resolved)
* component references points at a schema matching the include/exclude
* filters. Operations without any schema references cannot be attributed to
* the filter and are kept as-is.
*/
function filterPathsBySchemas(spec, schemas, mode = "include") {
	const keepSchemaName = (name) => {
		const isMatch = schemas.some((filter) => {
			if (isString(filter)) return filter === name;
			filter.lastIndex = 0;
			return filter.test(name);
		});
		return mode === "exclude" ? !isMatch : isMatch;
	};
	const schemasOfRefs = (refs, visited = /* @__PURE__ */ new Set()) => {
		const components = getComponentNames(refs, spec).filter(({ type, name }) => !visited.has(`${type}/${name}`));
		components.forEach(({ type, name }) => visited.add(`${type}/${name}`));
		return components.flatMap(({ type, name }) => {
			if (type === "schemas") return [{
				type,
				name
			}];
			return schemasOfRefs(findRefs(spec.components?.[type]?.[name]), new Set(visited));
		});
	};
	return {
		...spec,
		paths: Object.fromEntries(Object.entries(spec.paths ?? {}).map(([pathRoute, pathItem]) => {
			if (!pathItem || typeof pathItem !== "object") return [pathRoute, pathItem];
			const resolvedPathItem = !isInlineSchema(pathItem) ? resolveRef(pathItem, { spec }).schema : pathItem;
			const httpMethods = /* @__PURE__ */ new Set([
				"get",
				"put",
				"post",
				"delete",
				"options",
				"head",
				"patch",
				"trace"
			]);
			const keptVerbs = {};
			const pathMetadata = {};
			for (const [key, operation] of Object.entries(resolvedPathItem)) {
				if (!httpMethods.has(key.toLowerCase())) {
					pathMetadata[key] = operation;
					continue;
				}
				if (!operation || typeof operation !== "object" || !isInlineSchema(operation)) {
					keptVerbs[key] = operation;
					continue;
				}
				const referencedSchemas = schemasOfRefs([...findRefs(operation), ...findRefs(resolvedPathItem.parameters)]).filter((c) => c.type === "schemas").map((c) => c.name);
				if (referencedSchemas.length === 0 || referencedSchemas.some(keepSchemaName)) keptVerbs[key] = operation;
			}
			if (Object.keys(keptVerbs).length === 0) return [pathRoute, void 0];
			return [pathRoute, {
				...pathMetadata,
				...keptVerbs
			}];
		}).filter((entry) => Boolean(entry[1])))
	};
}
//#endregion
//#region src/generators/models-inline.ts
function generateModelInline(acc, model) {
	return acc + `${model}\n`;
}
function generateModelsInline(obj) {
	const schemas = Array.isArray(obj) ? obj : Object.values(obj).flat();
	let result = "";
	for (const { model } of schemas) result = generateModelInline(result, model);
	return result;
}
//#endregion
//#region src/generators/mutator-info.ts
/**
* `generateMutator` runs once per operation, and every operation usually shares
* the same mutator, so without this each one re-bundled the same file (#4222).
* Holding promises lets concurrent callers share one in-flight bundle.
*/
const mutatorInfoCache = /* @__PURE__ */ new Map();
async function getMutatorInfo(filePath, options) {
	const { root = process.cwd(), namedExport = "default", alias, external } = options ?? {};
	if (external !== void 0) return parseFile(await bundleFile(root, filePath, alias, external), namedExport);
	const resolvedPath = path.resolve(root, filePath);
	const key = JSON.stringify([
		root,
		resolvedPath,
		namedExport,
		alias ?? null,
		hashFile(resolvedPath)
	]);
	let info = mutatorInfoCache.get(key);
	if (!info) {
		info = bundleFile(root, filePath, alias).then((code) => parseFile(code, namedExport));
		mutatorInfoCache.set(key, info);
		info.catch(() => mutatorInfoCache.delete(key));
	}
	return info;
}
/** `null` for a missing file, which lets esbuild report the error. */
function hashFile(filePath) {
	try {
		return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
	} catch {
		return null;
	}
}
/**
* Bundles the mutator purely so its exported function can be parsed for arity —
* `write: false`, and the only thing read back out is `numberOfParams` /
* `returnNumberOfParams`. None of this output reaches the generated client.
*
* That is why no `target` is set: esbuild defaults to `esnext`, and downleveling
* a throwaway bundle to the project's TypeScript target has no upside and three
* failure modes. It emitted `"import.meta" is not available in the configured
* target environment` for the `es6` fallback that applied whenever
* `compilerOptions.target` was absent — which covers a TypeScript 6+ project
* (where an omitted `target` means *latest*, not ES2015) and a solution-style
* `tsconfig.json` that only carries `references`. It failed outright on a low
* target, since esbuild cannot transform `const`, `async` or default arguments
* to `es5`. And rewriting default or rest parameters into the function body
* changes the very arity this parse exists to measure.
*
* `parseFile` reads the result with `ecmaVersion: 'latest'`, so a modern bundle
* is the safe input here, not a risky one.
*
* @see https://github.com/orval-labs/orval/issues/4093
* @see https://github.com/orval-labs/orval/issues/1185
*/
async function bundleFile(root, fileName, alias, external) {
	const { text } = (await build({
		absWorkingDir: root,
		entryPoints: [fileName],
		write: false,
		platform: "node",
		bundle: true,
		format: "esm",
		metafile: false,
		minify: false,
		minifyIdentifiers: false,
		minifySyntax: false,
		minifyWhitespace: false,
		treeShaking: false,
		keepNames: false,
		alias,
		external: external ?? ["*"]
	})).outputFiles[0];
	return text;
}
function parseFile(file, name) {
	try {
		const ast = Parser.parse(file, {
			ecmaVersion: "latest",
			sourceType: "module"
		});
		const foundExport = ast.body.filter((x) => x.type === "ExportNamedDeclaration").map((declaration) => ({
			declaration,
			specifier: declaration.specifiers.find((specifier) => specifier.exported.type === "Identifier" && specifier.exported.name === name && specifier.local.type === "Identifier")
		})).find((item) => item.specifier);
		const foundSpecifier = foundExport?.specifier;
		if (foundExport && foundSpecifier && "name" in foundSpecifier.local) {
			const exportedFuncName = foundSpecifier.local.name;
			const mutatorInfo = parseFunction(ast, exportedFuncName);
			if (mutatorInfo) return mutatorInfo;
			if (foundExport.declaration.source || isImportedBinding(ast, exportedFuncName)) return standardMutatorInfo();
		}
	} catch {
		return;
	}
}
function isImportedBinding(ast, name) {
	return ast.body.some((node) => {
		if (node.type !== "ImportDeclaration") return false;
		return node.specifiers.some((specifier) => "name" in specifier.local && specifier.local.name === name);
	});
}
function standardMutatorInfo() {
	return { numberOfParams: 1 };
}
function parseFunction(ast, funcName) {
	const node = ast.body.find((childNode) => {
		if (childNode.type === "VariableDeclaration") return childNode.declarations.find((d) => d.id.type === "Identifier" && d.id.name === funcName);
		if (childNode.type === "FunctionDeclaration" && childNode.id.name === funcName) return childNode;
	});
	if (!node) return;
	if (node.type === "FunctionDeclaration") {
		const returnStatement = node.body.body.find((b) => b.type === "ReturnStatement");
		if (returnStatement?.argument && "params" in returnStatement.argument) return {
			numberOfParams: node.params.length,
			returnNumberOfParams: returnStatement.argument.params.length
		};
		else if (returnStatement?.argument?.type === "CallExpression") {
			const arrowFn = returnStatement.argument.arguments.at(0);
			if (arrowFn?.type === "ArrowFunctionExpression") return {
				numberOfParams: node.params.length,
				returnNumberOfParams: arrowFn.params.length
			};
		}
		return { numberOfParams: node.params.length };
	}
	const declaration = "declarations" in node ? node.declarations.find((d) => d.id.type === "Identifier" && d.id.name === funcName) : void 0;
	if (declaration?.init) {
		if ("name" in declaration.init) return parseFunction(ast, declaration.init.name);
		if (declaration.init.type === "CallExpression") return standardMutatorInfo();
		if ("body" in declaration.init && "params" in declaration.init && declaration.init.body.type === "ArrowFunctionExpression") return {
			numberOfParams: declaration.init.params.length,
			returnNumberOfParams: declaration.init.body.params.length
		};
		const returnStatement = "body" in declaration.init && "body" in declaration.init.body && Array.isArray(declaration.init.body.body) ? declaration.init.body.body.find((b) => b.type === "ReturnStatement") : void 0;
		if ("params" in declaration.init) {
			if (returnStatement?.argument && "params" in returnStatement.argument) return {
				numberOfParams: declaration.init.params.length,
				returnNumberOfParams: returnStatement.argument.params.length
			};
			else if (returnStatement?.argument?.type === "CallExpression" && returnStatement.argument.arguments[0]?.type === "ArrowFunctionExpression") {
				const arrowFn = returnStatement.argument.arguments[0];
				return {
					numberOfParams: declaration.init.params.length,
					returnNumberOfParams: arrowFn.params.length
				};
			}
			return { numberOfParams: declaration.init.params.length };
		}
	}
}
//#endregion
//#region src/generators/mutator.ts
const BODY_TYPE_NAME = "BodyType";
const getImport = (output, mutator, tsconfig) => {
	if (mutator.resolvedPath || !path.isAbsolute(mutator.path)) return mutator.path;
	const outputFile = getFileInfo(output).path;
	const ext = mutator.extension ?? getImportExtension(path.extname(mutator.path), tsconfig);
	return `${getRelativeImportPath(outputFile, mutator.path)}${ext}`;
};
async function generateMutator({ output, mutator, name, workspace, tsconfig }) {
	if (!mutator || !output) return;
	const isDefault = mutator.default;
	const importName = mutator.name ?? `${name}Mutator`;
	const importPath = mutator.path;
	const inspectionPath = mutator.resolvedPath ?? mutator.path;
	const mutatorInfoName = isDefault ? "default" : mutator.name;
	if (mutatorInfoName === void 0) throw new Error(styleText("red", `Mutator ${importPath} must have a named or default export.`));
	let rawFile = path.isAbsolute(inspectionPath) ? await fs.promises.readFile(inspectionPath, "utf8") : "";
	rawFile = removeComments(rawFile);
	const hasErrorType = !!rawFile && (rawFile.includes("export type ErrorType") || rawFile.includes("export interface ErrorType"));
	const hasBodyType = !!rawFile && (rawFile.includes(`export type BodyType`) || rawFile.includes(`export interface BodyType`));
	const errorTypeName = mutator.default ? `${pascal(name)}ErrorType` : "ErrorType";
	const bodyTypeName = mutator.default ? `${pascal(name)}${BODY_TYPE_NAME}` : BODY_TYPE_NAME;
	const mutatorInfo = await getMutatorInfo(inspectionPath, {
		root: workspace,
		namedExport: mutatorInfoName,
		alias: mutator.alias,
		external: mutator.external
	});
	if (!mutatorInfo) throw new Error(styleText("red", `Your mutator file doesn't have the ${mutatorInfoName} exported function`));
	const importStatementPath = getImport(output, mutator, tsconfig);
	const isHook = mutator.name ? mutator.name.startsWith("use") && !mutatorInfo.numberOfParams : !mutatorInfo.numberOfParams;
	return {
		name: mutator.name || !isHook ? importName : `use${pascal(importName)}`,
		path: importStatementPath,
		default: isDefault,
		hasErrorType,
		errorTypeName,
		hasSecondArg: isHook ? (mutatorInfo.returnNumberOfParams ?? 0) > 1 : mutatorInfo.numberOfParams > 1,
		hasThirdArg: mutatorInfo.numberOfParams > 2,
		isHook,
		useHooks: mutator.useHooks,
		inferred: mutator.inferred,
		...hasBodyType ? { bodyTypeName } : {}
	};
}
function removeComments(file) {
	return file.replaceAll(/\/\/.*|\/\*[\s\S]*?\*\//g, "");
}
//#endregion
//#region src/generators/options.ts
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
const getAngularFilteredParamsExpression = (paramsExpression, requiredNullableParamKeys = [], preserveRequiredNullables = false, nonPrimitiveKeys = [], objectParamStrategies = {}) => {
	const hasPassthrough = nonPrimitiveKeys.length > 0;
	const hasObjectStrategies = Object.keys(objectParamStrategies).length > 0;
	const filteredParamValueType = hasPassthrough ? "unknown" : `string | number | boolean${preserveRequiredNullables ? " | null" : ""} | Array<string | number | boolean>`;
	const passthroughBranch = hasPassthrough ? `    if (passthroughKeys.has(key)) {
      if (value !== undefined) {
        filteredParams[key] = value;
      }
      continue;
    }
` : "";
	const objectStrategyBranch = hasObjectStrategies ? `    if (
      value != null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.prototype.hasOwnProperty.call(objectParamStrategies, key)
    ) {
      const objectStrategy = objectParamStrategies[key];
      const entries = Object.entries(value as Record<string, unknown>);
      if (objectStrategy === 'comma') {
        const commaParts: string[] = [];
        for (const [prop, propValue] of entries) {
          if (Array.isArray(propValue)) {
            const filteredItems = propValue.filter(
              (item) =>
                item != null &&
                (typeof item === 'string' ||
                  typeof item === 'number' ||
                  typeof item === 'boolean'),
            ) as Array<string | number | boolean>;
            if (filteredItems.length) {
              commaParts.push(prop, ...filteredItems.map(String));
            }
          } else if (
            propValue != null &&
            (typeof propValue === 'string' ||
              typeof propValue === 'number' ||
              typeof propValue === 'boolean')
          ) {
            commaParts.push(prop, String(propValue));
          } else if (
            propValue instanceof Date &&
            !Number.isNaN(propValue.getTime())
          ) {
            commaParts.push(prop, propValue.toISOString());
          }
        }
        if (commaParts.length) {
          filteredParams[key] = commaParts.join(',');
        }
      } else {
        for (const [prop, propValue] of entries) {
          const targetKey =
            objectStrategy === 'deepObject' ? key + '[' + prop + ']' : prop;
          if (Array.isArray(propValue)) {
            const filteredProp = propValue.filter(
              (item) =>
                item != null &&
                (typeof item === 'string' ||
                  typeof item === 'number' ||
                  typeof item === 'boolean'),
            ) as Array<string | number | boolean>;
            if (filteredProp.length) {
              filteredParams[targetKey] = filteredProp;
            }
          } else if (
            propValue != null &&
            (typeof propValue === 'string' ||
              typeof propValue === 'number' ||
              typeof propValue === 'boolean')
          ) {
            filteredParams[targetKey] = propValue;
          } else if (
            propValue instanceof Date &&
            !Number.isNaN(propValue.getTime())
          ) {
            filteredParams[targetKey] = propValue.toISOString();
          }
        }
      }
      continue;
    }
` : "";
	const emitRequiredNullableBranch = preserveRequiredNullables || requiredNullableParamKeys.length > 0;
	const preserveNullableBranch = emitRequiredNullableBranch ? `    } else if (value === null && requiredNullableParamKeys.has(key)) {
      filteredParams[key] = ${preserveRequiredNullables ? "null" : "''"};
` : "";
	const requiredNullableParamKeysBranch = emitRequiredNullableBranch ? `const requiredNullableParamKeys = new Set<string>(${JSON.stringify(requiredNullableParamKeys)});` : "";
	return `(() => {
${hasPassthrough ? `  const passthroughKeys = new Set<string>(${JSON.stringify(nonPrimitiveKeys)});\n` : ""}${hasObjectStrategies ? `  const objectParamStrategies: Readonly<Record<string, 'flatten' | 'comma' | 'deepObject'>> = ${JSON.stringify(objectParamStrategies)};\n` : ""}  ${requiredNullableParamKeysBranch}
  const filteredParams: Record<string, ${filteredParamValueType}> = {};
  for (const [key, value] of Object.entries(${paramsExpression})) {
${passthroughBranch}${objectStrategyBranch}    if (Array.isArray(value)) {
      const filtered = value
        .filter(
          (item) =>
            item != null &&
            (typeof item === 'string' ||
              typeof item === 'number' ||
              typeof item === 'boolean' ||
              ((item as unknown) instanceof Date &&
                !Number.isNaN((item as unknown as Date).getTime()))),
        )
        .map((item) =>
          (item as unknown) instanceof Date
            ? (item as unknown as Date).toISOString()
            : item,
        ) as Array<string | number | boolean>;
      if (filtered.length) {
        filteredParams[key] = filtered;
      }
${preserveNullableBranch}    } else if (
      (value as unknown) instanceof Date &&
      !Number.isNaN((value as unknown as Date).getTime())
    ) {
      // useDates produces Date query params; serialize to ISO so they reach
      // the wire instead of being dropped by the primitive check below. See #3856.
      filteredParams[key] = (value as unknown as Date).toISOString();
    } else if (
      value != null &&
      (typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean')
    ) {
      filteredParams[key] = value;
    }
  }
  return filteredParams;
})()`;
};
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
const getAngularFilteredParamsHelperBody = ({ hasObjectParams = false } = {}) => {
	if (!hasObjectParams) return `type AngularHttpParamValue = string | number | boolean | Array<string | number | boolean>;
type AngularHttpParamValueWithNullable = AngularHttpParamValue | null;

function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys?: ReadonlySet<string>,
  preserveRequiredNullables?: false,
  passthroughKeys?: undefined,
): Record<string, AngularHttpParamValue>;
function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys: ReadonlySet<string> | undefined,
  preserveRequiredNullables: true,
  passthroughKeys?: undefined,
): Record<string, AngularHttpParamValueWithNullable>;
function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys: ReadonlySet<string> | undefined,
  preserveRequiredNullables: boolean | undefined,
  passthroughKeys: ReadonlySet<string>,
): Record<string, unknown>;
function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys: ReadonlySet<string> = new Set(),
  preserveRequiredNullables = false,
  passthroughKeys: ReadonlySet<string> = new Set(),
): Record<string, unknown> {
  const filteredParams: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (passthroughKeys.has(key)) {
      if (value !== undefined) {
        filteredParams[key] = value;
      }
      continue;
    }
    if (Array.isArray(value)) {
      const filtered = value
        .filter(
          (item) =>
            item != null &&
            (typeof item === 'string' ||
              typeof item === 'number' ||
              typeof item === 'boolean' ||
              (item instanceof Date && !Number.isNaN(item.getTime()))),
        )
        .map((item) =>
          item instanceof Date ? item.toISOString() : item,
        ) as Array<string | number | boolean>;
      if (filtered.length) {
        filteredParams[key] = filtered;
      }
    } else if (value === null && requiredNullableKeys.has(key)) {
      // With a paramsSerializer (preserveRequiredNullables) the literal null
      // is passed through for it to consume; without one, emit an empty
      // string so the required key still reaches the wire as \`?key=\`
      // instead of being silently dropped. See #3712.
      filteredParams[key] = preserveRequiredNullables ? null : '';
    } else if (value instanceof Date && !Number.isNaN(value.getTime())) {
      // useDates produces Date query params; serialize to ISO so they reach
      // the wire instead of being dropped by the primitive check below. See #3856.
      filteredParams[key] = value.toISOString();
    } else if (
      value != null &&
      (typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean')
    ) {
      filteredParams[key] = value;
    }
  }
  return filteredParams;
}`;
	return `type AngularHttpParamValue = string | number | boolean | Array<string | number | boolean>;
type AngularHttpParamValueWithNullable = AngularHttpParamValue | null;
type AngularObjectParamStrategy = 'flatten' | 'comma' | 'deepObject';

function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys?: ReadonlySet<string>,
  preserveRequiredNullables?: false,
  passthroughKeys?: undefined,
): Record<string, AngularHttpParamValue>;
function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys: ReadonlySet<string> | undefined,
  preserveRequiredNullables: true,
  passthroughKeys?: undefined,
): Record<string, AngularHttpParamValueWithNullable>;
function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys: ReadonlySet<string> | undefined,
  preserveRequiredNullables: boolean | undefined,
  passthroughKeys: ReadonlySet<string>,
): Record<string, unknown>;
function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys: ReadonlySet<string> | undefined,
  preserveRequiredNullables: boolean | undefined,
  passthroughKeys: ReadonlySet<string> | undefined,
  objectParamStrategies: Readonly<Record<string, AngularObjectParamStrategy>>,
): Record<string, AngularHttpParamValue>;
function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys: ReadonlySet<string> = new Set(),
  preserveRequiredNullables = false,
  passthroughKeys: ReadonlySet<string> = new Set(),
  objectParamStrategies: Readonly<Record<string, AngularObjectParamStrategy>> = {},
): Record<string, unknown> {
  const filteredParams: Record<string, unknown> = {};
  const filterPrimitiveArray = (
    value: unknown[],
  ): Array<string | number | boolean> =>
    value
      .filter(
        (item) =>
          item != null &&
          (typeof item === 'string' ||
            typeof item === 'number' ||
            typeof item === 'boolean' ||
            (item instanceof Date && !Number.isNaN(item.getTime()))),
      )
      .map((item) => (item instanceof Date ? item.toISOString() : item)) as Array<
      string | number | boolean
    >;
  for (const [key, value] of Object.entries(params)) {
    if (passthroughKeys.has(key)) {
      if (value !== undefined) {
        filteredParams[key] = value;
      }
      continue;
    }
    if (
      value != null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.prototype.hasOwnProperty.call(objectParamStrategies, key)
    ) {
      const objectStrategy = objectParamStrategies[key];
      const entries = Object.entries(value as Record<string, unknown>);
      if (objectStrategy === 'comma') {
        const commaParts: string[] = [];
        for (const [prop, propValue] of entries) {
          if (Array.isArray(propValue)) {
            const filteredItems = filterPrimitiveArray(propValue);
            if (filteredItems.length) {
              commaParts.push(prop, ...filteredItems.map(String));
            }
          } else if (
            propValue != null &&
            (typeof propValue === 'string' ||
              typeof propValue === 'number' ||
              typeof propValue === 'boolean')
          ) {
            commaParts.push(prop, String(propValue));
          } else if (
            propValue instanceof Date &&
            !Number.isNaN(propValue.getTime())
          ) {
            commaParts.push(prop, propValue.toISOString());
          }
        }
        if (commaParts.length) {
          filteredParams[key] = commaParts.join(',');
        }
      } else {
        for (const [prop, propValue] of entries) {
          const targetKey =
            objectStrategy === 'deepObject' ? key + '[' + prop + ']' : prop;
          if (Array.isArray(propValue)) {
            const filteredProp = filterPrimitiveArray(propValue);
            if (filteredProp.length) {
              filteredParams[targetKey] = filteredProp;
            }
          } else if (
            propValue != null &&
            (typeof propValue === 'string' ||
              typeof propValue === 'number' ||
              typeof propValue === 'boolean')
          ) {
            filteredParams[targetKey] = propValue;
          } else if (
            propValue instanceof Date &&
            !Number.isNaN(propValue.getTime())
          ) {
            filteredParams[targetKey] = propValue.toISOString();
          }
        }
      }
      continue;
    }
    if (Array.isArray(value)) {
      const filtered = filterPrimitiveArray(value);
      if (filtered.length) {
        filteredParams[key] = filtered;
      }
    } else if (value === null && requiredNullableKeys.has(key)) {
      // With a paramsSerializer (preserveRequiredNullables) the literal null
      // is passed through for it to consume; without one, emit an empty
      // string so the required key still reaches the wire as \`?key=\`
      // instead of being silently dropped. See #3712.
      filteredParams[key] = preserveRequiredNullables ? null : '';
    } else if (value instanceof Date && !Number.isNaN(value.getTime())) {
      // useDates produces Date query params; serialize to ISO so they reach
      // the wire instead of being dropped by the primitive check below. See #3856.
      filteredParams[key] = value.toISOString();
    } else if (
      value != null &&
      (typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean')
    ) {
      filteredParams[key] = value;
    }
  }
  return filteredParams;
}`;
};
/**
* Returns a call expression to the `filterParams` helper function.
*/
const getAngularFilteredParamsCallExpression = (paramsExpression, requiredNullableParamKeys = [], preserveRequiredNullables = false, nonPrimitiveKeys = [], objectParamStrategies = {}) => {
	const baseArgs = `${paramsExpression}, new Set<string>(${JSON.stringify(requiredNullableParamKeys)})`;
	if (Object.keys(objectParamStrategies).length > 0) return `filterParams(${baseArgs}, ${preserveRequiredNullables}, new Set<string>(${JSON.stringify(nonPrimitiveKeys)}), ${JSON.stringify(objectParamStrategies)} as const)`;
	if (nonPrimitiveKeys.length > 0) return `filterParams(${baseArgs}, ${preserveRequiredNullables}, new Set<string>(${JSON.stringify(nonPrimitiveKeys)}))`;
	return `filterParams(${baseArgs}${preserveRequiredNullables ? ", true" : ""})`;
};
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
const buildAngularParamsFilterExpression = ({ paramsExpression, requiredNullableParamKeys = [], preserveRequiredNullables = false, nonPrimitiveKeys = [], objectParamStrategies = {}, paramsFilter, useSharedHelper }) => {
	if (paramsFilter) return `${paramsFilter.name}(${paramsExpression})`;
	if (useSharedHelper) return getAngularFilteredParamsCallExpression(paramsExpression, requiredNullableParamKeys, preserveRequiredNullables, nonPrimitiveKeys, objectParamStrategies);
	return getAngularFilteredParamsExpression(paramsExpression, requiredNullableParamKeys, preserveRequiredNullables, nonPrimitiveKeys, objectParamStrategies);
};
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
const getAngularObjectParamStrategies = ({ queryParams, paramsSerializer, paramsFilter, queryObjectSerialization }) => {
	if (paramsFilter || paramsSerializer || queryObjectSerialization === "legacy" || !queryParams?.objectQueryParams?.length) return {};
	return Object.fromEntries(queryParams.objectQueryParams.map(({ key, strategy }) => [key, strategy]));
};
function generateBodyOptions(body, isFormData, isFormUrlEncoded) {
	if (isFormData && body.formData) return "formData";
	if (isFormUrlEncoded && body.formUrlEncoded) return "formUrlEncoded";
	if (body.implementation) return body.implementation;
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
function generateAxiosUrl({ functionName, propsImplementation, route, axiosRef, hasQueryParams, beforeReturn, paramsSerializer, paramsSerializerOptions }) {
	const serializer = paramsSerializer ? `paramsSerializer: ${paramsSerializer},` : paramsSerializerOptions?.qs ? `paramsSerializer: (params) => qs.stringify(params, ${JSON.stringify(paramsSerializerOptions.qs)}),` : "";
	return `export const ${functionName} = (${propsImplementation}) => {
    ${beforeReturn ?? ""}
  return ${axiosRef}.create({
    baseURL: '',
    params: null,
  }).getUri({
    url: \`${route}\`,
    baseURL: '',
    ${hasQueryParams ? "params," : ""}
    ${serializer}
  });
}
`;
}
function generateAxiosOptions({ response, isExactOptionalPropertyTypes, angularObserve, angularParamsRef, requiredNullableQueryParamKeys, nonPrimitiveQueryParamKeys, objectQueryParamStrategies, queryParams, headers, requestOptions, hasSignal, hasSignalParam = false, isAngular, paramsSerializer, paramsSerializerOptions, paramsFilter }) {
	const isRequestOptions = requestOptions !== false;
	const angularPassthroughQueryParamKeys = paramsSerializer ? nonPrimitiveQueryParamKeys : [];
	const angularObjectParamStrategies = paramsSerializer ? {} : objectQueryParamStrategies ?? {};
	const signalVar = hasSignalParam ? "querySignal" : "signal";
	const signalProp = hasSignalParam ? `signal: ${signalVar}` : "signal";
	if (!queryParams && !headers && !response.isBlob && response.definition.success !== "string") {
		if (isRequestOptions) return isAngular ? angularObserve ? `{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: '${angularObserve}',
      }` : "(options as Omit<NonNullable<typeof options>, 'observe'>)" : "options";
		if (hasSignal) return isExactOptionalPropertyTypes ? `...(${signalVar} ? { ${signalProp} } : {})` : signalProp;
		return "";
	}
	let value = "";
	if (!isRequestOptions) {
		if (queryParams) {
			if (isAngular) {
				const iifeExpr = buildAngularParamsFilterExpression({
					paramsExpression: "params ?? {}",
					requiredNullableParamKeys: requiredNullableQueryParamKeys,
					preserveRequiredNullables: !!paramsSerializer,
					nonPrimitiveKeys: angularPassthroughQueryParamKeys,
					objectParamStrategies: angularObjectParamStrategies,
					paramsFilter,
					useSharedHelper: false
				});
				value += paramsSerializer ? `\n        params: ${paramsSerializer.name}(${iifeExpr}),` : `\n        params: ${iifeExpr},`;
			} else value += "\n        params,";
		}
		if (headers) value += "\n        headers,";
		if (hasSignal) value += isExactOptionalPropertyTypes ? `\n        ...(${signalVar} ? { ${signalProp} } : {}),` : `\n        ${signalProp},`;
	}
	if (!isObject(requestOptions) || !Object.hasOwn(requestOptions, "responseType")) {
		const successResponseType = getSuccessResponseType(response);
		if (successResponseType) value += `\n        responseType: '${successResponseType}',`;
	}
	if (isObject(requestOptions)) value += `\n ${stringify(requestOptions)?.slice(1, -1)}`;
	if (isRequestOptions) {
		value += isAngular ? "\n    ...(options as Omit<NonNullable<typeof options>, 'observe'>)," : "\n    ...options,";
		if (isAngular && angularObserve) value += `\n        observe: '${angularObserve}',`;
		if (queryParams) {
			if (isAngular && angularParamsRef) value += `\n        params: ${angularParamsRef},`;
			else if (isAngular && paramsSerializer) {
				const callExpr = buildAngularParamsFilterExpression({
					paramsExpression: "{...params, ...options?.params}",
					requiredNullableParamKeys: requiredNullableQueryParamKeys,
					preserveRequiredNullables: true,
					nonPrimitiveKeys: angularPassthroughQueryParamKeys,
					objectParamStrategies: angularObjectParamStrategies,
					paramsFilter,
					useSharedHelper: true
				});
				value += `\n        params: ${paramsSerializer.name}(${callExpr}),`;
			} else if (isAngular) {
				const callExpr = buildAngularParamsFilterExpression({
					paramsExpression: "{...params, ...options?.params}",
					requiredNullableParamKeys: requiredNullableQueryParamKeys,
					nonPrimitiveKeys: angularPassthroughQueryParamKeys,
					objectParamStrategies: angularObjectParamStrategies,
					paramsFilter,
					useSharedHelper: true
				});
				value += `\n        params: ${callExpr},`;
			} else value += "\n        params: {...params, ...options?.params},";
		}
		if (headers) value += "\n        headers: {...headers, ...options?.headers},";
	}
	if (!isAngular && queryParams && (paramsSerializer || paramsSerializerOptions?.qs)) {
		const qsOptions = paramsSerializerOptions?.qs;
		value += paramsSerializer ? `\n        paramsSerializer: ${paramsSerializer.name},` : `\n        paramsSerializer: (params) => qs.stringify(params, ${JSON.stringify(qsOptions)}),`;
	}
	return value;
}
function generateOptions({ route, body, angularObserve, angularParamsRef, headers, queryParams, objectQueryParamStrategies, response, verb, requestOptions, isFormData, isFormUrlEncoded, isAngular, isExactOptionalPropertyTypes, hasSignal, hasSignalParam, paramsSerializer, paramsSerializerOptions, paramsFilter }) {
	const bodyIdentifier = getIsBodyVerb(verb) ? generateBodyOptions(body, isFormData, isFormUrlEncoded) : void 0;
	const axiosOptions = generateAxiosOptions({
		response,
		angularObserve,
		angularParamsRef,
		requiredNullableQueryParamKeys: queryParams?.requiredNullableKeys,
		nonPrimitiveQueryParamKeys: queryParams?.nonPrimitiveKeys,
		objectQueryParamStrategies,
		queryParams: queryParams?.schema,
		headers: headers?.schema,
		requestOptions,
		isExactOptionalPropertyTypes,
		hasSignal,
		hasSignalParam,
		isAngular: isAngular ?? false,
		paramsSerializer,
		paramsSerializerOptions,
		paramsFilter
	});
	const trimmedAxiosOptions = axiosOptions.trim();
	const isRawOptionsArgument = trimmedAxiosOptions === "options" || trimmedAxiosOptions.startsWith("(") && trimmedAxiosOptions.endsWith(")") || trimmedAxiosOptions.startsWith("{") && trimmedAxiosOptions.endsWith("}");
	const optionsArgument = axiosOptions ? isRawOptionsArgument ? axiosOptions : `{${axiosOptions}}` : "";
	if (verb === Verbs.DELETE) {
		if (!bodyIdentifier) return `\n      \`${route}\`${optionsArgument ? `,${optionsArgument}` : ""}\n    `;
		const deleteBodyOptions = isRawOptionsArgument ? `...${optionsArgument}` : axiosOptions;
		return `\n      \`${route}\`,{${`${isAngular ? "body" : "data"}: ${bodyIdentifier}`}${axiosOptions ? `,${deleteBodyOptions}` : ""}}\n    `;
	}
	const bodyOrOptions = getIsBodyVerb(verb) ? `\n      ${bodyIdentifier ?? "undefined"},` : "";
	return `\n      \`${route}\`${bodyOrOptions || optionsArgument ? "," : ""}${bodyOrOptions}${optionsArgument}\n    `;
}
function generateBodyMutatorConfig(body, isFormData, isFormUrlEncoded) {
	if (isFormData && body.formData) return ",\n       data: formData";
	if (isFormUrlEncoded && body.formUrlEncoded) return ",\n       data: formUrlEncoded";
	if (body.implementation) return `,\n      data: ${body.implementation}`;
	return "";
}
function generateQueryParamsAxiosConfig(response, isAngular, requiredNullableQueryParamKeys, queryParams, paramsFilter) {
	if (!queryParams && !response.isBlob) return "";
	let value = "";
	if (queryParams) {
		if (isAngular) {
			const paramsExpr = buildAngularParamsFilterExpression({
				paramsExpression: "params ?? {}",
				requiredNullableParamKeys: requiredNullableQueryParamKeys,
				nonPrimitiveKeys: queryParams.nonPrimitiveKeys,
				paramsFilter,
				useSharedHelper: false
			});
			value += `,\n        params: ${paramsExpr}`;
		} else value += ",\n        params";
	}
	if (response.isBlob) value += `,\n        responseType: 'blob'`;
	return value;
}
function generateMutatorConfig({ route, body, headers, queryParams, response, verb, isFormData, isFormUrlEncoded, hasSignal, hasSignalParam = false, isExactOptionalPropertyTypes, isAngular, paramsFilter }) {
	const bodyOptions = getIsBodyVerb(verb) ? generateBodyMutatorConfig(body, isFormData, isFormUrlEncoded) : "";
	const queryParamsOptions = generateQueryParamsAxiosConfig(response, isAngular ?? false, queryParams?.requiredNullableKeys, queryParams, paramsFilter);
	const ignoreContentTypes = isAngular ? ["multipart/form-data"] : [];
	const headerOptions = body.contentType && !ignoreContentTypes.includes(body.contentType) ? `,\n      headers: {'Content-Type': '${jsStringLiteralEscape(body.contentType)}', ${headers ? "...headers" : ""}}` : headers ? ",\n      headers" : "";
	const signalVar = hasSignalParam ? "querySignal" : "signal";
	const signalProp = hasSignalParam ? `signal: ${signalVar}` : "signal";
	return `{url: \`${route}\`, method: '${verb.toUpperCase()}'${headerOptions}${bodyOptions}${queryParamsOptions}${hasSignal ? `, ${isExactOptionalPropertyTypes ? `...(${signalVar} ? { ${signalProp} }: {})` : signalProp}` : ""}\n    }`;
}
function generateMutatorRequestOptions(requestOptions, hasSecondArgument) {
	if (!hasSecondArgument) return isObject(requestOptions) ? `{${stringify(requestOptions)?.slice(1, -1)}}` : "";
	if (isObject(requestOptions)) return `{${stringify(requestOptions)?.slice(1, -1)} ...options}`;
	return "options";
}
function generateFormDataAndUrlEncodedFunction({ body, formData, formUrlEncoded, isFormData, isFormUrlEncoded }) {
	if (isFormData && body.formData) {
		if (formData) return `const formData = ${formData.name}(${body.implementation})`;
		return body.formData;
	}
	if (isFormUrlEncoded && body.formUrlEncoded) {
		if (formUrlEncoded) return `const formUrlEncoded = ${formUrlEncoded.name}(${body.implementation})`;
		return body.formUrlEncoded;
	}
	return "";
}
//#endregion
//#region src/generators/parameter-definition.ts
function generateParameterDefinition(parameters = {}, context, suffix, prefix = "") {
	if (Object.keys(parameters).length === 0) return [];
	const generatorSchemas = [];
	for (const [parameterName, parameter] of Object.entries(parameters)) {
		const modelName = sanitize(`${prefix}${getComponentBaseName(parameters, parameterName)}${suffix}`, {
			underscore: "_",
			whitespace: "_",
			dash: true,
			es5keyword: true,
			es5IdentifierName: true
		});
		const { schema, imports } = resolveRef(parameter, context);
		if (schema.in !== "query" && schema.in !== "header") continue;
		if (!("schema" in schema) || !schema.schema || imports.length > 0) {
			generatorSchemas.push({
				name: modelName,
				imports: imports.length > 0 ? [{
					name: imports[0].name,
					schemaName: imports[0].schemaName
				}] : [],
				model: `export type ${modelName} = ${imports.length > 0 ? imports[0].name : "unknown"};\n`,
				dependencies: imports.length > 0 ? [imports[0].name] : [],
				kind: "schema"
			});
			continue;
		}
		const resolvedObject = resolveObject({
			schema: schema.schema,
			propName: modelName,
			context
		});
		const model = `${jsDoc(schema)}export type ${modelName} = ${resolvedObject.value || "unknown"};\n`;
		generatorSchemas.push(...resolvedObject.schemas);
		if (modelName !== resolvedObject.value) generatorSchemas.push({
			name: modelName,
			model,
			imports: resolvedObject.imports,
			dependencies: resolvedObject.dependencies,
			kind: "schema"
		});
	}
	return generatorSchemas;
}
//#endregion
//#region src/generators/interface.ts
/**
* Generate the interface string
* An eslint comment is insert if the resulted object is empty
*
* @param name interface name
* @param schema
*/
function generateInterface({ name, schema, context, formDataContext, genericParams }) {
	const scalar = getScalar({
		item: schema,
		name,
		context,
		formDataContext
	});
	const isEmptyObject = scalar.value === "{}";
	const shouldUseTypeAlias = context.output.override.useTypeOverInterfaces ?? scalar.useTypeAlias;
	const genericSuffix = genericParams && genericParams.length > 0 ? `<${genericParams.join(", ")}>` : "";
	let model = "";
	if (!isBooleanJsonSchema(schema)) model += jsDoc(schema);
	if (isEmptyObject) model += "// eslint-disable-next-line @typescript-eslint/no-empty-interface\n";
	if (scalar.type === "object" && !shouldUseTypeAlias && !isBooleanJsonSchema(schema)) {
		const properties = schema.properties;
		if (properties && Object.values(properties).length > 0 && Object.values(properties).every((item) => !isBooleanJsonSchema(item) && "const" in item)) {
			const mappedScalarValue = scalar.value.replaceAll(";", ",").replaceAll("?:", ":");
			model += `export const ${name}Value = ${mappedScalarValue} as const;\nexport type ${name}${genericSuffix} = typeof ${name}Value;\n`;
		} else {
			const blankInterfaceValue = scalar.value === "unknown" ? "{}" : scalar.value;
			model += `export interface ${name}${genericSuffix} ${blankInterfaceValue}\n`;
		}
	} else model += `export type ${name}${genericSuffix} = ${scalar.value};\n`;
	const externalModulesImportsOnly = scalar.imports.filter((importName) => importName.alias ? importName.alias !== name : importName.name !== name);
	return [...scalar.schemas, {
		name,
		model,
		imports: externalModulesImportsOnly,
		dependencies: scalar.dependencies,
		schema,
		kind: "schema"
	}];
}
//#endregion
//#region src/generators/schema-definition.ts
/**
* Extract all types from #/components/schemas
*/
function generateSchemasDefinition(schemas = {}, context, suffix, filters, prefix = "") {
	if (Object.keys(schemas).length === 0) return [];
	const transformedSchemas = resolveDiscriminators(schemas, context);
	let generateSchemas = Object.entries(transformedSchemas);
	if (filters?.schemas) {
		const schemasFilters = filters.schemas;
		const mode = filters.mode ?? "include";
		generateSchemas = generateSchemas.filter(([schemaName]) => {
			const isMatch = schemasFilters.some((filter) => isString(filter) ? filter === schemaName : filter.test(schemaName));
			return mode === "include" ? isMatch : !isMatch;
		});
	}
	const formDataContexts = getFormDataComponentContexts(context);
	const models = generateSchemas.flatMap(([schemaName, schema]) => generateSchemaDefinitions(schemaName, schema, context, suffix, prefix, formDataContexts.get(schemaName)));
	const seenNames = /* @__PURE__ */ new Set();
	const deduplicatedModels = [];
	for (const schema of models) {
		const normalizedName = conventionName(schema.name, context.output.namingConvention);
		if (!seenNames.has(normalizedName)) {
			seenNames.add(normalizedName);
			if (context.output.factoryMethods && schema.schema) {
				const factoryData = generateFactory(schema.schema, schema.name, context);
				if (factoryData) {
					if (context.output.factoryMethods.mode === "single") {
						schema.model += `\n${factoryData.model}`;
						for (const imp of factoryData.imports) if (!schema.imports.some((existing) => existing.name === imp.name)) schema.imports.push(imp);
					} else {
						schema.factory = factoryData.model;
						schema.factoryImports = factoryData.imports;
						schema.factoryMode = context.output.factoryMethods.mode;
					}
				}
			}
			deduplicatedModels.push(schema);
		}
	}
	return sortSchemasByDependencies(deduplicatedModels);
}
function sortSchemasByDependencies(schemas) {
	if (schemas.length === 0) return schemas;
	const schemaNames = new Set(schemas.map((schema) => schema.name));
	const dependencyMap = /* @__PURE__ */ new Map();
	for (const schema of schemas) {
		const dependencies = /* @__PURE__ */ new Set();
		if (schema.dependencies) {
			for (const dependencyName of schema.dependencies) if (dependencyName && schemaNames.has(dependencyName)) dependencies.add(dependencyName);
		}
		for (const imp of schema.imports) {
			const dependencyName = imp.alias ?? imp.name;
			if (dependencyName && schemaNames.has(dependencyName)) dependencies.add(dependencyName);
		}
		dependencyMap.set(schema.name, dependencies);
	}
	const sorted = [];
	const temporary = /* @__PURE__ */ new Set();
	const permanent = /* @__PURE__ */ new Set();
	const schemaMap = new Map(schemas.map((schema) => [schema.name, schema]));
	const visit = (name) => {
		if (permanent.has(name)) return;
		if (temporary.has(name)) return;
		temporary.add(name);
		const dependencies = dependencyMap.get(name);
		if (dependencies) {
			for (const dep of dependencies) if (dep !== name) visit(dep);
		}
		temporary.delete(name);
		permanent.add(name);
		const schema = schemaMap.get(name);
		if (schema) sorted.push(schema);
	};
	for (const schema of schemas) visit(schema.name);
	return sorted;
}
function shouldCreateInterface(schema) {
	if (isBooleanJsonSchema(schema)) return false;
	const isNullable = Array.isArray(schema.type) && schema.type.includes("null");
	return (!schema.type || schema.type === "object") && !schema.allOf && !schema.oneOf && !schema.anyOf && isInlineSchema(schema) && !schema.enum && !isNullable;
}
function collectGenericParams(schema) {
	const defs = schema.$defs;
	if (!defs || typeof defs !== "object") return [];
	const anchors = [];
	for (const defSchema of Object.values(defs)) {
		if (!defSchema || typeof defSchema !== "object") continue;
		const rec = defSchema;
		if (rec.$dynamicAnchor !== void 0 && rec.$ref === void 0) anchors.push(rec.$dynamicAnchor);
	}
	const uniqueNames = dynamicAnchorsToUniqueParamNames(anchors);
	return anchors.map((anchor) => ({
		anchorName: anchor,
		paramName: uniqueNames.get(anchor) ?? dynamicAnchorToParamName(anchor)
	}));
}
function generateSchemaDefinitions(schemaName, schema, context, suffix, prefix = "", formDataContext) {
	const sanitizedSchemaName = sanitize(`${prefix}${getComponentBaseName(context.spec.components?.schemas, schemaName)}${suffix}`, {
		underscore: "_",
		whitespace: "_",
		dash: true,
		es5keyword: true,
		es5IdentifierName: true
	});
	if (isBooleanJsonSchema(schema)) return [{
		name: sanitizedSchemaName,
		model: `export type ${sanitizedSchemaName} = ${schema ? "unknown" : "never"};\n`,
		imports: [],
		schema,
		kind: "schema"
	}];
	const schemaType = schema.type;
	const nullable = Array.isArray(schemaType) && schemaType.includes("null") ? " | null" : "";
	const alias = extractBoundAliasInfo(schema, context);
	if (alias) {
		const genericParams = alias.genericParams.map((paramName) => ({
			anchorName: paramName,
			paramName
		}));
		const genericSuffix = genericParams.length > 0 ? `<${genericParams.map((p) => p.paramName).join(", ")}>` : "";
		const typeArgsStr = alias.typeArgs.join(", ");
		const genericPart = `${alias.genericName}<${typeArgsStr}>`;
		let model;
		const allImports = [{
			name: alias.genericName,
			schemaName: alias.genericName
		}, ...alias.imports];
		if (alias.extraSchemas && alias.extraSchemas.length > 0) {
			const aliasScopedContext = {
				...context,
				dynamicScope: buildDynamicScope(schemaName, toObjectSchema(schema), context)
			};
			const subSchemas = [];
			model = `export type ${sanitizedSchemaName}${genericSuffix} = (${[genericPart, ...alias.extraSchemas.map((extraSchema) => {
				const resolved = resolveValue({
					schema: extraSchema,
					name: sanitizedSchemaName,
					context: aliasScopedContext,
					formDataContext
				});
				for (const imp of resolved.imports) {
					const impSchemaName = imp.schemaName ?? imp.name;
					if (!allImports.some((a) => a.name === imp.name && a.schemaName === impSchemaName)) allImports.push({
						name: imp.name,
						schemaName: impSchemaName
					});
				}
				for (const sub of resolved.schemas) if (sub.name !== sanitizedSchemaName) subSchemas.push(sub);
				return resolved.value;
			})].join(" & ")})${nullable};\n`;
			return [...subSchemas, {
				name: sanitizedSchemaName,
				model,
				imports: allImports,
				dependencies: allImports.map((i) => i.name),
				schema,
				kind: "schema"
			}];
		} else model = `export type ${sanitizedSchemaName}${genericSuffix} = ${genericPart}${nullable};\n`;
		return [{
			name: sanitizedSchemaName,
			model,
			imports: allImports,
			dependencies: allImports.map((i) => i.name),
			schema,
			kind: "schema"
		}];
	}
	const scopedContext = isBoolean(schema) ? context : {
		...context,
		dynamicScope: buildDynamicScope(schemaName, toObjectSchema(schema), context)
	};
	const genericParams = collectGenericParams(schema);
	if (shouldCreateInterface(schema)) return generateInterface({
		name: sanitizedSchemaName,
		schema,
		context: scopedContext,
		formDataContext,
		genericParams: genericParams.length > 0 ? genericParams.map((p) => p.paramName) : void 0
	});
	const resolvedValue = resolveValue({
		schema,
		name: sanitizedSchemaName,
		context: scopedContext,
		formDataContext
	});
	let output = "";
	let imports = resolvedValue.imports;
	let kind = resolvedValue.isEnum && !resolvedValue.isRef ? "enum" : "schema";
	output += jsDoc(schema);
	if (resolvedValue.isEnum && !resolvedValue.isRef) output += getEnum(getEnumMembers(resolvedValue.originalSchema), sanitizedSchemaName, !!nullable || isSchemaNullable(resolvedValue.originalSchema), context.output.override.enumGenerationType, context.output.override.namingConvention.enum);
	else if (sanitizedSchemaName === resolvedValue.value && resolvedValue.isRef) {
		if (isInlineSchema(schema)) throw new Error(`Expected a reference schema for ${sanitizedSchemaName}, but received an inline schema`);
		const { schema: referredSchema } = resolveRef(schema, scopedContext);
		if (!shouldCreateInterface(referredSchema)) {
			const imp = resolvedValue.imports.find((imp) => imp.name === sanitizedSchemaName);
			if (imp) {
				const alias = `${resolvedValue.value}Bis`;
				output += `export type ${sanitizedSchemaName} = ${alias};\n`;
				imports = imports.map((imp) => imp.name === sanitizedSchemaName ? {
					...imp,
					alias
				} : imp);
				resolvedValue.dependencies = [imp.name];
			} else output += `export type ${sanitizedSchemaName} = ${resolvedValue.value};\n`;
		}
	} else {
		resolvedValue.schemas = resolvedValue.schemas.filter((schema) => {
			if (schema.name !== sanitizedSchemaName) return true;
			output += `${schema.model}\n`;
			imports = [...imports, ...schema.imports];
			resolvedValue.dependencies.push(...schema.dependencies ?? []);
			kind = schema.kind ?? kind;
			return false;
		});
		const genericSuffix = genericParams.length > 0 ? `<${genericParams.map((p) => p.paramName).join(", ")}>` : "";
		output += `export type ${sanitizedSchemaName}${genericSuffix} = ${resolvedValue.value};\n`;
	}
	return [...resolvedValue.schemas, {
		name: sanitizedSchemaName,
		model: output,
		imports,
		dependencies: resolvedValue.dependencies,
		schema,
		kind
	}];
}
//#endregion
//#region src/generators/verbs-options.ts
const renameFormIdentifier = (form, from, to) => form.replace(new RegExp(`(?<![.\\w$'"\`])${escapeRegExp(from)}(?![\\w$])`, "g"), to);
const resolveBodyNameShadowing = (body, operationName, params) => {
	if (!body.implementation || body.implementation !== operationName) return body;
	const reservedNames = /* @__PURE__ */ new Set([
		operationName,
		"params",
		"headers",
		...params.map(({ name }) => name)
	]);
	let implementation = camel(`${operationName}-body`);
	let index = 2;
	while (reservedNames.has(implementation)) {
		implementation = camel(`${operationName}-body-${index}`);
		index += 1;
	}
	return {
		...body,
		implementation,
		formData: body.formData && renameFormIdentifier(body.formData, body.implementation, implementation),
		formUrlEncoded: body.formUrlEncoded && renameFormIdentifier(body.formUrlEncoded, body.implementation, implementation)
	};
};
async function buildVerbOption({ verb, output, operation, route, pathRoute, verbParameters = [], context, body: rawBody, operationName, typeName, operationId, override, tags, deprecated, description, summary }) {
	const response = getResponse({
		responses: operation.responses ?? {},
		operationName: typeName,
		context,
		contentType: override.contentType,
		generatePrimitiveSchemas: !override.mutator && isObject(output.schemas) && output.schemas.type === "zod" && (output.client === "angular" ? override.angular.runtimeValidation.enabled : output.client === "angular-query" ? override.query.runtimeValidation?.enabled : (output.client === "fetch" || output.httpClient === "fetch") && override.fetch.runtimeValidation.enabled)
	});
	const parameters = getParameters({
		parameters: [...verbParameters, ...operation.parameters ?? []],
		context
	});
	const queryParams = getQueryParams({
		queryParams: parameters.query,
		operationName: typeName,
		context
	});
	const headers = output.headers ? getQueryParams({
		queryParams: parameters.header,
		operationName: typeName,
		context,
		suffix: "headers"
	}) : void 0;
	const params = getParams({
		pathRoute,
		pathParams: parameters.path,
		operationId,
		context,
		output
	});
	const body = resolveBodyNameShadowing(rawBody, operationName, params);
	const verbOption = {
		verb,
		tags,
		route,
		pathRoute,
		summary,
		operationId,
		operationName,
		typeName,
		response,
		body,
		headers,
		queryParams,
		params,
		props: getProps({
			body,
			queryParams,
			params,
			headers,
			operationName: typeName,
			context
		}),
		mutator: await generateMutator({
			output: output.target,
			name: typeName,
			mutator: override.mutator,
			workspace: context.workspace,
			tsconfig: context.output.tsconfig
		}),
		formData: !override.formData.disabled && body.formData ? await generateMutator({
			output: output.target,
			name: typeName,
			mutator: override.formData.mutator,
			workspace: context.workspace,
			tsconfig: context.output.tsconfig
		}) : void 0,
		formUrlEncoded: isString(override.formUrlEncoded) || isObject(override.formUrlEncoded) ? await generateMutator({
			output: output.target,
			name: typeName,
			mutator: override.formUrlEncoded,
			workspace: context.workspace,
			tsconfig: context.output.tsconfig
		}) : void 0,
		paramsSerializer: isString(override.paramsSerializer) || isObject(override.paramsSerializer) ? await generateMutator({
			output: output.target,
			name: "paramsSerializer",
			mutator: override.paramsSerializer,
			workspace: context.workspace,
			tsconfig: context.output.tsconfig
		}) : void 0,
		paramsFilter: isString(override.paramsFilter) || isObject(override.paramsFilter) ? await generateMutator({
			output: output.target,
			name: "paramsFilter",
			mutator: override.paramsFilter,
			workspace: context.workspace,
			tsconfig: context.output.tsconfig
		}) : void 0,
		fetchReviver: isString(override.fetch.jsonReviver) || isObject(override.fetch.jsonReviver) ? await generateMutator({
			output: output.target,
			name: "fetchReviver",
			mutator: override.fetch.jsonReviver,
			workspace: context.workspace,
			tsconfig: context.output.tsconfig
		}) : void 0,
		override,
		doc: jsDoc({
			description,
			deprecated,
			summary
		}),
		deprecated,
		originalOperation: operation
	};
	const transformer = await dynamicImport(override.transformer, context.workspace);
	return transformer ? transformer(verbOption) : verbOption;
}
async function generateVerbOptions({ verb, output, operation, route, pathRoute, verbParameters = [], context, reservedOperationNames, reservedTypeNames }) {
	const { requestBody, tags: rawTags, deprecated: rawDeprecated, description: rawDescription, summary: rawSummary } = operation;
	const tags = rawTags ?? [];
	const deprecated = rawDeprecated;
	const description = rawDescription;
	const summary = rawSummary;
	const operationId = getOperationId(operation, route, verb);
	const overrideOperation = output.override.operations[operationId];
	let overrideTag = {};
	for (const [tag, options] of Object.entries(output.override.tags)) if (tags.includes(tag) && options) overrideTag = mergeDeep(overrideTag, options);
	const override = mergeDeep(mergeDeep(output.override, overrideTag), overrideOperation ?? {});
	const overrideOperationName = overrideOperation?.operationName ?? output.override.operationName;
	let operationName;
	let typeName;
	if (overrideOperationName) {
		const result = overrideOperationName(operation, route, verb);
		if (Array.isArray(result)) {
			operationName = result[0];
			typeName = result[1];
		} else {
			operationName = result;
			typeName = operationName;
		}
	} else {
		operationName = sanitize(camel(operationId), { es5keyword: true });
		typeName = operationName;
	}
	const shouldReserve = !deprecated || output.override.useDeprecatedOperations !== false;
	const reserve = (name, reservedNames) => {
		if (!shouldReserve || !reservedNames) return name;
		const uniqueName = getUniqueName(name, reservedNames);
		reservedNames.add(uniqueName);
		return uniqueName;
	};
	operationName = reserve(operationName, reservedOperationNames);
	typeName = reserve(typeName, reservedTypeNames);
	if (override.splitByContentType && requestBody) {
		const bodies = getBodiesByContentType({
			requestBody,
			operationName: typeName,
			context,
			contentType: override.contentType
		});
		const results = [];
		for (const bodyEntry of bodies) {
			const { contentTypeSuffix, ...body } = bodyEntry;
			const verbOption = await buildVerbOption({
				verb,
				output,
				operation,
				route,
				pathRoute,
				verbParameters,
				context,
				body,
				operationName: contentTypeSuffix ? reserve(`${operationName}With${contentTypeSuffix}`, reservedOperationNames) : operationName,
				typeName: contentTypeSuffix ? reserve(`${typeName}With${contentTypeSuffix}`, reservedTypeNames) : typeName,
				operationId,
				override,
				tags,
				deprecated,
				description,
				summary
			});
			results.push(verbOption);
		}
		return results;
	}
	return [await buildVerbOption({
		verb,
		output,
		operation,
		route,
		pathRoute,
		verbParameters,
		context,
		body: requestBody ? getBody({
			requestBody,
			operationName: typeName,
			context,
			contentType: override.contentType
		}) : {
			originalSchema: {},
			definition: "",
			implementation: "",
			imports: [],
			schemas: [],
			formData: "",
			formUrlEncoded: "",
			contentType: "",
			isOptional: false,
			isBlob: false
		},
		operationName,
		typeName,
		operationId,
		override,
		tags,
		deprecated,
		description,
		summary
	})];
}
function generateVerbsOptions({ verbs, input, output, route, pathRoute, context, reservedOperationNames, reservedTypeNames }) {
	return asyncReduce(filteredVerbs(verbs, input.filters), async (acc, [verb, operation]) => {
		if (isVerb(verb)) {
			const verbOptions = await generateVerbOptions({
				verb,
				output,
				verbParameters: verbs.parameters,
				route,
				pathRoute,
				operation,
				context,
				reservedOperationNames,
				reservedTypeNames
			});
			acc.push(...verbOptions);
		}
		return acc;
	}, []);
}
//#endregion
//#region src/writers/barrel-collisions.ts
const RE_EXPORT_STAR = /^\s*export\s+\*\s+from\s*['"](\.[^'"]*)['"]\s*;?\s*$/gm;
const RE_EXPORTED_DECLARATION = /^export\s+(?:declare\s+)?(?:const|let|var|function|abstract\s+class|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gm;
const resolveModuleFile = (indexPath, specifier) => {
	const resolved = path.resolve(path.dirname(indexPath), specifier);
	return [
		`${resolved}.ts`,
		resolved.replace(/\.[cm]?js$/, ".ts"),
		resolved
	].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
};
/**
* Names that more than one module of a barrel exports. TypeScript cannot
* resolve an ambiguous `export *` (TS2308), so each such name is unusable
* through the barrel. Nested barrels (directory re-exports) are skipped.
*/
const getAmbiguousBarrelExports = async (indexPath) => {
	if (!fs.existsSync(indexPath)) return /* @__PURE__ */ new Map();
	const content = await fs.promises.readFile(indexPath, "utf8");
	const modulesByName = /* @__PURE__ */ new Map();
	const scannedFiles = /* @__PURE__ */ new Set();
	for (const [, specifier] of content.matchAll(RE_EXPORT_STAR)) {
		const file = resolveModuleFile(indexPath, specifier);
		if (!file || scannedFiles.has(file)) continue;
		scannedFiles.add(file);
		const source = await fs.promises.readFile(file, "utf8");
		const names = new Set([...source.matchAll(RE_EXPORTED_DECLARATION)].map(([, name]) => name));
		for (const name of names) {
			const modules = modulesByName.get(name);
			if (modules) modules.push(specifier);
			else modulesByName.set(name, [specifier]);
		}
	}
	return new Map([...modulesByName].filter(([, modules]) => modules.length > 1));
};
/**
* Two outputs whose `schemas` point at one directory share its `index.ts`,
* and each merges the other's exports into it. When both generate a schema
* of the same name (a TypeScript model and a reusable Zod schema, say), the
* barrel re-exports it twice and consumers can import neither. Which one is
* meant cannot be decided here, so this only reports it. See #4217.
*/
const warnAmbiguousBarrelExports = async (indexPath) => {
	const ambiguous = await getAmbiguousBarrelExports(indexPath);
	if (ambiguous.size === 0) return;
	const details = [...ambiguous].map(([name, modules]) => `'${name}' (${modules.map((m) => `'${m}'`).join(", ")})`).join(", ");
	logger.warn(`Schemas index ${indexPath} re-exports the same name from more than one module: ${details}. TypeScript treats these as ambiguous, so they cannot be imported from the index. This usually means several outputs share one \`schemas\` directory; give each its own.`);
};
//#endregion
//#region src/writers/file.ts
const TRAILING_WHITESPACE_RE = /[^\S\r\n]+$/gm;
const generatedFileTransform = new AsyncLocalStorage();
function withGeneratedFileTransform(transform, callback) {
	return generatedFileTransform.run(transform, callback);
}
function isMissingFileError(error) {
	return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
/**
* Write generated code to a file, stripping trailing whitespace from each line.
*
* Template literals in code generators can produce lines with only whitespace
* when conditional expressions evaluate to empty strings. This function
* ensures the output is always clean regardless of generator implementation.
*/
async function writeGeneratedFile(filePath, content) {
	let nextContent = content.replaceAll(TRAILING_WHITESPACE_RE, "");
	const transform = generatedFileTransform.getStore();
	if (transform) nextContent = (await transform(filePath, nextContent)).replaceAll(TRAILING_WHITESPACE_RE, "");
	try {
		if (await fs.promises.readFile(filePath, "utf8") === nextContent) return;
	} catch (error) {
		if (!isMissingFileError(error)) throw error;
	}
	await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
	await fs.promises.writeFile(filePath, nextContent);
}
//#endregion
//#region src/writers/mock-utils.ts
function getMockDir(entry, mockConfig) {
	if (!isFunction(entry) && entry.path) return entry.path;
	return mockConfig.path;
}
/** The faker generator entry, when one is configured. */
function getFakerEntry(mockConfig) {
	return mockConfig.generators.find((g) => !isFunction(g) && g.type === OutputMockType.FAKER);
}
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
function getConfiguredMockDirectories(mockConfig) {
	const directories = /* @__PURE__ */ new Set();
	if (mockConfig.path) directories.add(mockConfig.path);
	for (const generator of mockConfig.generators) {
		const directory = getMockDir(generator, mockConfig);
		if (directory) directories.add(directory);
	}
	const schemasPath = getFakerEntry(mockConfig)?.schemasPath;
	if (schemasPath) directories.add(schemasPath);
	return [...directories];
}
function resolveMockSchemasPath(mockFilePath, schemasTarget) {
	const targetExt = path.extname(schemasTarget);
	return getRelativeImportPath(mockFilePath, schemasTarget, !SOURCE_FILE_EXTENSIONS.has(targetExt));
}
//#endregion
//#region src/writers/schema-tag-mapper.ts
function buildSchemaTagMap(operations, schemas) {
	const schemaNames = new Set(schemas.map((s) => s.name));
	const schemaToTags = /* @__PURE__ */ new Map();
	for (const schema of schemas) if (!schemaToTags.has(schema.name)) schemaToTags.set(schema.name, /* @__PURE__ */ new Set());
	for (const operation of operations) {
		const tag = kebab(operation.tags[0] ?? "default");
		for (const imp of operation.imports) if (!imp.importPath && schemaNames.has(imp.name)) addTag(schemaToTags, imp.name, tag);
	}
	propagateTransitiveTags(schemaToTags, new Map(schemas.map((s) => [s.name, s])));
	const result = /* @__PURE__ */ new Map();
	for (const [name, tags] of schemaToTags) if (tags.size === 0 || tags.size > 1) result.set(name, ".");
	else result.set(name, [...tags][0]);
	return result;
}
function addTag(schemaToTags, schemaName, tag) {
	if (!schemaToTags.has(schemaName)) schemaToTags.set(schemaName, /* @__PURE__ */ new Set());
	schemaToTags.get(schemaName).add(tag);
}
function propagateTransitiveTags(schemaToTags, schemaByName) {
	let changed = true;
	while (changed) {
		changed = false;
		for (const [name, tags] of schemaToTags) {
			const schema = schemaByName.get(name);
			if (!schema) continue;
			for (const imp of schema.imports) {
				if (!isSchemaImport(imp)) continue;
				if (!schemaByName.has(imp.name)) continue;
				const targetTags = schemaToTags.get(imp.name);
				if (!targetTags) continue;
				for (const tag of tags) if (!targetTags.has(tag)) {
					targetTags.add(tag);
					changed = true;
				}
			}
		}
	}
}
function isSchemaImport(imp) {
	return !imp.importPath;
}
//#endregion
//#region src/writers/schema-output-plan.ts
/** Detects enum definitions used to select the configured schema route. */
function isOpenApiEnumSchema(schema) {
	return !!schema && typeof schema === "object" && Array.isArray(schema.enum);
}
/** Normalizes a schema name for grouping names that generate the same file. */
function schemaNameKey(name, namingConvention) {
	return conventionName(name, namingConvention).toLowerCase();
}
/** Converts a schema name to the configured output naming convention. */
function canonicalName(name, namingConvention) {
	return conventionName(name, namingConvention);
}
/** Merges generated schemas that share the same original name. */
function mergeSchemas(schemas) {
	const first = schemas[0];
	if (new Set(schemas.map((schema) => requireSchemaKind(schema))).size > 1) throw new Error(`Conflicting generated schema kinds for canonical schema "${first.name}".`);
	return {
		...first,
		model: schemas.map((schema) => schema.model).join("\n"),
		imports: [...new Map(schemas.flatMap((schema) => schema.imports).map((imp) => [JSON.stringify(imp), imp])).values()],
		dependencies: [...new Set(schemas.flatMap((schema) => schema.dependencies ?? []))],
		kind: requireSchemaKind(first)
	};
}
/** Returns schema kind metadata or fails when route planning lacks it. */
function requireSchemaKind(schema) {
	if (!schema.kind) throw new Error(`Generated schema "${schema.name}" is missing its kind metadata.`);
	return schema.kind;
}
/** Serializes schema values with sorted keys for order-independent comparison. */
function stableSerialize(value) {
	if (value === null) return "null";
	if (value === void 0) return "undefined";
	if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
	if (typeof value !== "object") return JSON.stringify(value);
	return `{${Object.entries(value).toSorted(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`).join(",")}}`;
}
/** Checks whether two generated schemas have the same kind and definition. */
function hasSameSchemaDefinition(left, right) {
	return left.kind === right.kind && left.schema !== void 0 && right.schema !== void 0 && stableSerialize(left.schema) === stableSerialize(right.schema);
}
/** Rejects generated-file collisions between incompatible schema definitions. */
function assertNoConflictingCanonicalSchema(schemas, namingConvention) {
	const canonical = schemas[0];
	const aliases = schemas.filter((schema) => schema.name !== canonical.name);
	const conflictingAlias = aliases.find((schema) => !hasSameSchemaDefinition(canonical, schema));
	if (aliases.length > 0 && conflictingAlias) {
		const generatedName = conventionName(canonical.name, namingConvention);
		throw new Error(`Schemas "${canonical.name}" and "${conflictingAlias.name}" produce the same generated file "${generatedName}" but have different definitions. Rename one schema or change the naming convention.`);
	}
}
/** Removes the configured extension from a generated file name. */
function stripExtension(fileName, fileExtension) {
	return fileName.endsWith(fileExtension) ? fileName.slice(0, -fileExtension.length) : fileName;
}
/** Builds the output plan used to route generated schemas and their imports. */
function createSchemaOutputPlan({ basePath, schemas, routes, namingConvention, fileExtension, indexFiles, importPath, tsconfig, schemaTagMap }) {
	const grouped = /* @__PURE__ */ new Map();
	for (const schema of schemas) {
		const key = schemaNameKey(schema.name, namingConvention);
		const group = grouped.get(key);
		if (group) group.push(schema);
		else grouped.set(key, [schema]);
	}
	const canonicalNameByAlias = /* @__PURE__ */ new Map();
	const canonicalSchemas = [...grouped.values()].map((group) => {
		assertNoConflictingCanonicalSchema(group, namingConvention);
		const canonical = group[0];
		for (const schema of group) canonicalNameByAlias.set(schema.name, canonical.name);
		return group.length === 1 || group.some((schema) => schema.name !== canonical.name) ? {
			...canonical,
			kind: requireSchemaKind(canonical)
		} : mergeSchemas(group);
	});
	const routeKeyByName = /* @__PURE__ */ new Map();
	const routePathByName = /* @__PURE__ */ new Map();
	const scopePathByName = /* @__PURE__ */ new Map();
	const filePathByName = /* @__PURE__ */ new Map();
	const importPathByName = /* @__PURE__ */ new Map();
	const routePathByKey = {
		default: path.join(basePath, routes.default),
		enum: path.join(basePath, routes.enum ?? routes.default)
	};
	const routeDirectories = [...new Set(canonicalSchemas.map((schema) => {
		const routeKey = schema.kind === "enum" && routes.enum ? "enum" : "default";
		const routePath = routePathByKey[routeKey];
		const tag = schemaTagMap?.get(schema.name);
		const directory = schemaTagMap ? path.join(routePath, tag === "." ? "shared" : tag ?? "shared") : routePath;
		const key = schema.name;
		const fileName = `${conventionName(schema.name, namingConvention)}${fileExtension}`;
		const filePath = path.join(directory, fileName);
		routeKeyByName.set(key, routeKey);
		routePathByName.set(key, directory);
		scopePathByName.set(key, directory);
		filePathByName.set(key, filePath);
		importPathByName.set(key, `./${toUnix(stripExtension(path.relative(basePath, filePath), fileExtension))}`);
		return directory;
	}))];
	const findKey = (name) => {
		const alias = canonicalNameByAlias.get(name);
		if (alias && filePathByName.has(alias)) return alias;
		if (filePathByName.has(name)) return name;
		const converted = canonicalName(name, namingConvention);
		if (filePathByName.has(converted)) return converted;
		return [...filePathByName.keys()].find((key) => key.toLowerCase() === name.toLowerCase()) ?? name;
	};
	return {
		basePath,
		canonicalSchemas,
		canonicalNameByAlias,
		routeKeyByName,
		routePathByName,
		scopePathByName,
		filePathByName,
		importPathByName,
		routePathByKey,
		routeDirectories,
		usesTagRouting: !!schemaTagMap,
		rootIndexPath: indexFiles ? path.join(basePath, "index.ts") : void 0,
		registerSchema(name, route, scopePath = routePathByKey[route]) {
			const existing = filePathByName.get(name);
			if (existing) return existing;
			const filePath = path.join(scopePath, `${conventionName(name, namingConvention)}${fileExtension}`);
			routeKeyByName.set(name, route);
			routePathByName.set(name, scopePath);
			scopePathByName.set(name, scopePath);
			filePathByName.set(name, filePath);
			importPathByName.set(name, `./${toUnix(stripExtension(path.relative(basePath, filePath), fileExtension))}`);
			if (!routeDirectories.includes(scopePath)) routeDirectories.push(scopePath);
			return filePath;
		},
		canonicalNameFor(name) {
			return canonicalNameByAlias.get(name) ?? name;
		},
		importPathFor(importerName, targetName) {
			const importerPath = filePathByName.get(findKey(importerName));
			const targetPath = filePathByName.get(findKey(targetName));
			if (!importerPath || !targetPath) return `./${targetName}`;
			const extension = getImportExtension(fileExtension, tsconfig);
			return `${relativeSafe(path.dirname(importerPath), stripExtension(targetPath, fileExtension))}${extension}`;
		},
		clientImportPath(name, relativeSchemasPath) {
			if (indexFiles) return relativeSchemasPath;
			const key = findKey(name);
			const importPath = key ? importPathByName.get(key) : void 0;
			if (!importPath) return joinSafe(relativeSchemasPath, name);
			const extension = getImportExtension(fileExtension, tsconfig);
			return `${joinSafe(relativeSchemasPath, importPath.slice(2))}${extension}`;
		},
		packageImportPath(name) {
			if (!importPath || indexFiles) return importPath;
			const key = findKey(name);
			const routeImportPath = key ? importPathByName.get(key) : void 0;
			if (!routeImportPath) return void 0;
			const importExtension = getImportExtension(fileExtension, void 0);
			return `${joinSafe(importPath, routeImportPath.slice(2))}${importExtension}`;
		},
		hasSchema(name) {
			return filePathByName.has(findKey(name));
		}
	};
}
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
function createSchemaOutputPlanForOutput(schemas, output, schemaTagMap) {
	const schemaOptions = output.schemas;
	if (!schemaOptions || isString(schemaOptions) || !schemaOptions.routes) return;
	return createSchemaOutputPlan({
		basePath: schemaOptions.path,
		schemas: schemas.map((schema) => ({
			...schema,
			kind: schema.kind ?? (isOpenApiEnumSchema(schema.schema) ? "enum" : "schema")
		})),
		routes: schemaOptions.routes,
		namingConvention: output.namingConvention,
		fileExtension: output.schemaFileExtension || ".ts",
		indexFiles: output.indexFiles,
		importPath: schemaOptions.importPath,
		tsconfig: output.tsconfig,
		schemaTagMap
	});
}
//#endregion
//#region src/writers/schemas.ts
/**
* Patterns to detect operation-derived types (params, bodies, responses).
* These types are auto-generated from OpenAPI operations, not from component schemas.
*/
const OPERATION_TYPE_PATTERNS = [
	/Params$/i,
	/Body$/,
	/Body(One|Two|Three|Four|Five|Item)$/,
	/Parameter$/i,
	/Query$/i,
	/Header$/i,
	/Response\d*$/i,
	/^[1-5]\d{2}$/,
	/\d{3}(One|Two|Three|Four|Five|Item)$/i,
	/^(get|post|put|patch|delete|head|options)[A-Z].*\d{3}$/
];
/**
* Check if a schema name matches operation type patterns.
*/
function isOperationType(schemaName) {
	return OPERATION_TYPE_PATTERNS.some((pattern) => pattern.test(schemaName));
}
/**
* Split schemas into regular and operation types.
*/
function splitSchemasByType(schemas) {
	const regularSchemas = [];
	const operationSchemas = [];
	for (const schema of schemas) if (isOperationType(schema.name)) operationSchemas.push(schema);
	else regularSchemas.push(schema);
	return {
		regularSchemas,
		operationSchemas
	};
}
/**
* Fix cross-directory imports when schemas reference other schemas in a different directory.
* Updates import paths to use correct relative paths between directories.
*/
function fixSchemaImports(schemas, targetSchemaNames, fromPath, toPath, namingConvention, fileExtension, tsconfig) {
	const relativePath = relativeSafe(fromPath, toPath);
	const importExtension = getImportExtension(fileExtension, tsconfig);
	for (const schema of schemas) schema.imports = schema.imports.map((imp) => {
		if (targetSchemaNames.has(imp.name)) {
			const fileName = conventionName(imp.name, namingConvention);
			return {
				...imp,
				importPath: joinSafe(relativePath, fileName) + importExtension
			};
		}
		return imp;
	});
}
/**
* Fix imports in operation schemas that reference regular schemas.
*/
function fixCrossDirectoryImports(operationSchemas, regularSchemaNames, schemaPath, operationSchemaPath, namingConvention, fileExtension, tsconfig) {
	fixSchemaImports(operationSchemas, regularSchemaNames, operationSchemaPath, schemaPath, namingConvention, fileExtension, tsconfig);
}
/**
* Fix imports in regular schemas that reference operation schemas.
*/
function fixRegularSchemaImports(regularSchemas, operationSchemaNames, schemaPath, operationSchemaPath, namingConvention, fileExtension, tsconfig) {
	fixSchemaImports(regularSchemas, operationSchemaNames, schemaPath, operationSchemaPath, namingConvention, fileExtension, tsconfig);
}
function getSchemaKey(schemaPath, schemaName, namingConvention, fileExtension) {
	return getPath(schemaPath, conventionName(schemaName, namingConvention), fileExtension).toLowerCase().replaceAll("\\", "/");
}
function getSchemaGroups(schemaPath, schemas, namingConvention, fileExtension) {
	return groupBy(schemas, (schema) => getSchemaKey(schemaPath, schema.name, namingConvention, fileExtension));
}
function getCanonicalMap(schemaGroups, schemaPath, namingConvention, fileExtension) {
	const canonicalPathMap = /* @__PURE__ */ new Map();
	const canonicalNameMap = /* @__PURE__ */ new Map();
	for (const [key, groupSchemas] of schemaGroups) {
		const canonicalInfo = {
			importPath: getPath(schemaPath, conventionName(groupSchemas[0].name, namingConvention), fileExtension),
			name: groupSchemas[0].name
		};
		canonicalPathMap.set(key, canonicalInfo);
		for (const schema of groupSchemas) canonicalNameMap.set(schema.name, canonicalInfo);
	}
	return {
		canonicalPathMap,
		canonicalNameMap
	};
}
function normalizeCanonicalImportPaths(schemas, canonicalPathMap, canonicalNameMap, schemaPath, namingConvention, fileExtension, tsconfig, factoryOutputDirectory) {
	const importExtension = getImportExtension(fileExtension, tsconfig);
	const factoryDir = factoryOutputDirectory ?? schemaPath;
	for (const schema of schemas) {
		schema.imports = schema.imports.map((imp) => {
			const canonicalByName = canonicalNameMap.get(imp.name);
			const resolvedImportKey = resolveImportKey(schemaPath, imp.importPath ?? `./${conventionName(imp.name, namingConvention)}`, fileExtension);
			const canonicalByPath = canonicalPathMap.get(resolvedImportKey);
			const canonical = canonicalByName ?? canonicalByPath;
			if (!canonical?.importPath) return imp;
			const relative = relativeSafe(schemaPath, canonical.importPath.replaceAll("\\", "/"));
			const importPath = `${relative.endsWith(fileExtension) ? relative.slice(0, -fileExtension.length) : relative.replace(/\.ts$/, "")}${importExtension}`;
			return {
				...imp,
				importPath
			};
		});
		if (schema.factoryImports) schema.factoryImports = schema.factoryImports.map((imp) => {
			const canonicalByName = canonicalNameMap.get(imp.name);
			const resolvedImportKey = resolveImportKey(factoryDir, imp.importPath ?? `./${conventionName(imp.name, namingConvention)}`, fileExtension);
			const canonicalByPath = canonicalPathMap.get(resolvedImportKey);
			const canonical = canonicalByName ?? canonicalByPath;
			if (!canonical?.importPath) return imp;
			const relative = relativeSafe(factoryDir, canonical.importPath.replaceAll("\\", "/"));
			const importPath = `${relative.endsWith(fileExtension) ? relative.slice(0, -fileExtension.length) : relative.replace(/\.ts$/, "")}${importExtension}`;
			return {
				...imp,
				importPath
			};
		});
	}
}
function mergeSchemaGroup(schemas) {
	const baseSchemaName = schemas[0].name;
	const baseSchema = schemas[0].schema;
	const mergedImports = [...new Map(schemas.flatMap((schema) => schema.imports).map((imp) => [JSON.stringify(imp), imp])).values()];
	const mergedDependencies = [...new Set(schemas.flatMap((schema) => schema.dependencies ?? []))];
	const mergedFactory = schemas.map((s) => s.factory).filter(Boolean).join("\n");
	const mergedFactoryImports = [...new Map(schemas.flatMap((schema) => schema.factoryImports ?? []).map((imp) => [JSON.stringify(imp), imp])).values()];
	return {
		name: baseSchemaName,
		schema: baseSchema,
		model: schemas.map((schema) => schema.model).join("\n"),
		imports: mergedImports,
		dependencies: mergedDependencies,
		factory: mergedFactory || void 0,
		factoryImports: mergedFactoryImports,
		factoryMode: schemas[0].factoryMode
	};
}
function resolveImportKey(schemaPath, importPath, fileExtension) {
	return join(schemaPath, `${importPath}${fileExtension}`).toLowerCase().replaceAll("\\", "/");
}
function getSchema({ schema: { imports, model }, header, namingConvention = NamingConvention.CAMEL_CASE, importExtension }) {
	let file = header;
	file += generateImports({
		imports: imports.filter((imp) => !model.includes(`type ${imp.alias ?? imp.name} =`) && !model.includes(`interface ${imp.alias ?? imp.name} {`)),
		namingConvention,
		importExtension
	});
	file += imports.length > 0 ? "\n\n" : "\n";
	file += model;
	return file;
}
function getPath(path$1, name, fileExtension) {
	return path.join(path$1, `${name}${fileExtension}`);
}
async function writeSchema({ path, schema, target, namingConvention, fileExtension, header, tsconfig }) {
	const name = conventionName(schema.name, namingConvention);
	try {
		await writeGeneratedFile(getPath(path, name, fileExtension), getSchema({
			schema,
			target,
			header,
			namingConvention,
			importExtension: getImportExtension(fileExtension, tsconfig)
		}));
	} catch (error) {
		throw new Error(`Oups... 🍻. An Error occurred while writing schema ${name} => ${String(error)}`, { cause: error });
	}
}
async function emitFactoryForSchema(schema, namingConvention, header, factoryDir, fileExtension, helpers) {
	if (schema.factory && schema.factoryMode) {
		const mode = schema.factoryMode;
		if (mode === "split") {
			const factoryName = `${conventionName(schema.name, namingConvention)}.factory`;
			helpers.separateFactoryNames.push(factoryName);
			const factoryFile = `${header}\n${generateImports({
				imports: schema.factoryImports ?? [],
				namingConvention
			})}\n\n${schema.factory}`;
			await writeGeneratedFile(getPath(factoryDir, factoryName, fileExtension), factoryFile);
		} else if (mode === "single-split") {
			helpers.isCombined.value = true;
			helpers.combinedFactoryContent.value += `${schema.factory}\n`;
			helpers.combinedFactoryImports.push(...schema.factoryImports ?? []);
		}
	}
}
async function writeSchemas({ schemaPath, schemas, target, namingConvention, fileExtension, header, indexFiles, tsconfig, factoryOutputDirectory }) {
	const schemaGroups = getSchemaGroups(schemaPath, schemas, namingConvention, fileExtension);
	const { canonicalPathMap, canonicalNameMap } = getCanonicalMap(schemaGroups, schemaPath, namingConvention, fileExtension);
	normalizeCanonicalImportPaths(schemas, canonicalPathMap, canonicalNameMap, schemaPath, namingConvention, fileExtension, tsconfig, factoryOutputDirectory);
	const factoryDir = factoryOutputDirectory ?? schemaPath;
	const combinedFactoryContent = { value: "" };
	const combinedFactoryImports = [];
	const isCombined = { value: false };
	const separateFactoryNames = [];
	const factoryHelpers = {
		separateFactoryNames,
		combinedFactoryContent,
		combinedFactoryImports,
		isCombined
	};
	for (const groupSchemas of schemaGroups.values()) {
		if (groupSchemas.length === 1) {
			await writeSchema({
				path: schemaPath,
				schema: groupSchemas[0],
				target,
				namingConvention,
				fileExtension,
				header,
				tsconfig
			});
			const singleSchema = groupSchemas[0];
			await emitFactoryForSchema(singleSchema, namingConvention, header, factoryDir, fileExtension, factoryHelpers);
			continue;
		}
		const mergedSchema = mergeSchemaGroup(groupSchemas);
		await writeSchema({
			path: schemaPath,
			schema: mergedSchema,
			target,
			namingConvention,
			fileExtension,
			header,
			tsconfig
		});
		await emitFactoryForSchema(mergedSchema, namingConvention, header, factoryDir, fileExtension, factoryHelpers);
	}
	if (isCombined.value) {
		const factoryFileName = conventionName("factoryMethods", namingConvention);
		const factoryFile = `${header}\n${generateImports({
			imports: combinedFactoryImports,
			namingConvention
		})}\n\n${combinedFactoryContent.value}`;
		await writeGeneratedFile(getPath(factoryDir, factoryFileName, fileExtension), factoryFile);
	}
	if (indexFiles) {
		const schemaFilePath = path.join(schemaPath, `index.ts`);
		const ext = getImportExtension(fileExtension, tsconfig);
		const conventionNamesSet = new Set([...schemaGroups.values()].map((group) => conventionName(group[0].name, namingConvention)));
		try {
			const currentExports = [...conventionNamesSet].map((schemaName) => `export * from './${schemaName}${ext}';`);
			if (factoryOutputDirectory && normalizeSafe(factoryOutputDirectory) !== normalizeSafe(schemaPath) && (isCombined.value || separateFactoryNames.length > 0)) {
				const factoryIndexFilePath = path.join(factoryOutputDirectory, `index.ts`);
				const factoryExports = [];
				if (isCombined.value) {
					const factoryFileName = conventionName("factoryMethods", namingConvention);
					factoryExports.push(`export * from './${factoryFileName}${ext}';`);
				}
				for (const fName of separateFactoryNames) factoryExports.push(`export * from './${fName}${ext}';`);
				await writeGeneratedFile(factoryIndexFilePath, `${header}\n${factoryExports.join("\n")}\n`);
			} else {
				if (isCombined.value) {
					const factoryFileName = conventionName("factoryMethods", namingConvention);
					currentExports.push(`export * from './${factoryFileName}${ext}';`);
				}
				for (const fName of separateFactoryNames) currentExports.push(`export * from './${fName}${ext}';`);
			}
			const existingExports = [...(fs.existsSync(schemaFilePath) ? await fs.promises.readFile(schemaFilePath, "utf8") : "").matchAll(/^\s*export\s+\*\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/gm)].map(([, specifier]) => `export * from '${specifier}';`);
			await writeGeneratedFile(schemaFilePath, `${header}\n${[.../* @__PURE__ */ new Set([...existingExports, ...currentExports])].toSorted((a, b) => compareNatural(a, b)).join("\n")}\n`);
			await warnAmbiguousBarrelExports(schemaFilePath);
		} catch (error) {
			throw new Error(`Oups... 🍻. An Error occurred while writing schema index file ${schemaFilePath} => ${String(error)}`, { cause: error });
		}
	}
}
/** Writes planned schemas and the route barrels that expose them. */
async function writeRoutedSchemas({ plan, target, namingConvention, fileExtension, header, indexFiles, tsconfig }) {
	const grouped = /* @__PURE__ */ new Map();
	for (const schema of plan.canonicalSchemas) {
		const route = plan.routeKeyByName.get(schema.name) ?? "default";
		const directory = plan.scopePathByName.get(schema.name) ?? plan.routePathByName.get(schema.name);
		if (!directory) continue;
		const group = grouped.get(directory);
		if (group) group.schemas.push(schema);
		else grouped.set(directory, {
			route,
			schemas: [schema]
		});
	}
	for (const [schemaPath, { schemas }] of grouped) {
		await fs.promises.mkdir(schemaPath, { recursive: true });
		for (const schema of schemas) {
			const imports = schema.imports.map((imp) => ({
				...imp,
				name: plan.canonicalNameFor(imp.name),
				...plan.hasSchema(imp.name) ? { importPath: plan.importPathFor(schema.name, imp.name) } : {}
			}));
			await writeSchema({
				path: schemaPath,
				schema: {
					...schema,
					imports
				},
				target,
				namingConvention,
				fileExtension,
				header,
				tsconfig
			});
		}
		if (indexFiles) {
			const extension = getImportExtension(fileExtension, tsconfig);
			const exports = schemas.map((schema) => `export * from './${conventionName(schema.name, namingConvention)}${extension}';`).toSorted((a, b) => compareNatural(a, b));
			await writeGeneratedFile(path.join(schemaPath, "index.ts"), `${header}\n${exports.join("\n")}\n`);
		}
	}
	if (indexFiles && plan.rootIndexPath) {
		const extension = getImportExtension(fileExtension, tsconfig);
		const indexExtension = getImportExtension(".ts", tsconfig);
		const routeDirectories = /* @__PURE__ */ new Map();
		for (const [schemaPath, { route }] of grouped) {
			const directories = routeDirectories.get(route) ?? /* @__PURE__ */ new Set();
			directories.add(schemaPath);
			routeDirectories.set(route, directories);
		}
		if (plan.usesTagRouting) for (const [route, directories] of routeDirectories) {
			const routePath = plan.routePathByKey[route];
			const routeIndexPath = path.join(routePath, "index.ts");
			const existingExports = [...(fs.existsSync(routeIndexPath) ? await fs.promises.readFile(routeIndexPath, "utf8") : "").matchAll(/^\s*export\s+\*\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/gm)].map(([, specifier]) => `export * from '${toUnix(specifier)}';`);
			const childExports = [...directories].map((directory) => {
				const relative = toUnix(path.relative(routePath, directory));
				if (!relative) return void 0;
				return `export * from './${relative}/index${indexExtension}';`;
			}).filter((entry) => !!entry);
			await writeGeneratedFile(routeIndexPath, `${header}\n${[.../* @__PURE__ */ new Set([...existingExports, ...childExports])].toSorted((a, b) => compareNatural(a, b)).join("\n")}\n`);
		}
		const routeExports = [...routeDirectories.keys()].map((route) => {
			return `export * from './${toUnix(path.relative(plan.basePath, plan.routePathByKey[route]))}${plan.usesTagRouting || extension ? `/index${indexExtension}` : ""}';`;
		}).toSorted((a, b) => compareNatural(a, b));
		await writeGeneratedFile(plan.rootIndexPath, `${header}\n${routeExports.join("\n")}\n`);
	}
}
//#endregion
//#region src/writers/schemas-tags-split.ts
async function writeSchemasTagsSplit({ schemaPath, schemas, target, namingConvention, fileExtension, header, indexFiles, tsconfig, factoryOutputDirectory, schemaTagMap }) {
	const importExtension = getImportExtension(fileExtension, tsconfig);
	const groups = /* @__PURE__ */ new Map();
	for (const schema of schemas) {
		const group = schemaTagMap.get(schema.name) ?? ".";
		if (!groups.has(group)) groups.set(group, []);
		groups.get(group).push(schema);
	}
	for (const [groupDir, groupSchemas] of groups) {
		const isRoot = groupDir === ".";
		const groupPath = isRoot ? schemaPath : path.join(schemaPath, groupDir);
		fixCrossTagImports(groupSchemas, schemaTagMap, schemaPath, groupDir, namingConvention, importExtension);
		const groupFactoryDir = factoryOutputDirectory ? isRoot ? factoryOutputDirectory : path.join(factoryOutputDirectory, groupDir) : void 0;
		await writeSchemas({
			schemaPath: groupPath,
			schemas: groupSchemas,
			target,
			namingConvention,
			fileExtension,
			header,
			indexFiles: !isRoot && indexFiles,
			tsconfig,
			factoryOutputDirectory: groupFactoryDir
		});
	}
	if (indexFiles && groups.size > 0) {
		const rootIndexPath = path.join(schemaPath, "index.ts");
		const rootExports = (groups.get(".") ?? []).map((s) => {
			return `export * from './${conventionName(s.name, namingConvention)}${importExtension}';`;
		});
		const tagExports = [...groups.keys()].filter((dir) => dir !== ".").toSorted((a, b) => compareNatural(a, b)).map((dir) => {
			return `export * from '${importExtension ? `./${dir}/index${importExtension}` : `./${dir}`}';`;
		});
		await writeGeneratedFile(rootIndexPath, `${header}\n${[...rootExports, ...tagExports].join("\n")}\n`);
	}
}
function fixCrossTagImports(schemas, schemaTagMap, schemaPath, currentGroupDir, namingConvention, importExtension) {
	const fromPath = currentGroupDir === "." ? schemaPath : path.join(schemaPath, currentGroupDir);
	for (const schema of schemas) {
		const fixImports = (imports) => imports.map((imp) => {
			const targetGroup = schemaTagMap.get(imp.name);
			if (targetGroup === void 0 || targetGroup === currentGroupDir) return imp;
			const toPath = targetGroup === "." ? schemaPath : path.join(schemaPath, targetGroup);
			const importPath = joinSafe(relativeSafe(fromPath, toPath), conventionName(imp.name, namingConvention)) + importExtension;
			return {
				...imp,
				importPath
			};
		});
		schema.imports = fixImports(schema.imports);
		if (schema.factoryImports) schema.factoryImports = fixImports(schema.factoryImports);
	}
}
//#endregion
//#region src/writers/finalize-mock-implementation.ts
function getFinalizeMockImplementationOptions(output, mockOutputs) {
	const outputs = Array.isArray(mockOutputs) ? mockOutputs : [mockOutputs];
	const strictSchemaTypeNames = [...new Set(outputs.flatMap((mockOutput) => mockOutput.strictMockSchemaTypeNames ?? []))];
	const strictMockSchemaKinds = outputs.reduce((acc, mockOutput) => {
		if (!mockOutput.strictMockSchemaKinds) return acc;
		for (const [name, kind] of Object.entries(mockOutput.strictMockSchemaKinds)) acc[name] ??= kind;
		return acc;
	}, {});
	return {
		mockOptions: output.override.mock,
		strictSchemaTypeNames: strictSchemaTypeNames.length > 0 ? strictSchemaTypeNames : void 0,
		strictMockSchemaKinds: Object.keys(strictMockSchemaKinds).length > 0 ? strictMockSchemaKinds : void 0
	};
}
/** Drop schema-factory `{Schema}Mock` type imports that are declared locally. */
function filterLocalStrictMockTypeImports(imports, strictSchemaTypeNames) {
	if (!strictSchemaTypeNames?.length) return [...imports];
	const localMockTypeNames = new Set(strictSchemaTypeNames.map((name) => `${name}Mock`));
	return imports.filter((imp) => !(imp.schemaFactory && !imp.values && localMockTypeNames.has(imp.name)));
}
//#endregion
//#region src/writers/generate-imports-for-builder.ts
/** Builds client dependencies using tag routing or the planned schema paths. */
function generateImportsForBuilder(output, imports, relativeSchemasPath, schemaTagMap, schemaOutputPlan, filePath) {
	const isPackageImport = !!getSchemasImportPath(output.schemas);
	const schemaFactoryImports = imports.filter((i) => i.schemaFactory);
	const schemaFactoryImportExtension = isPackageImport ? "" : getImportExtension(output.fileExtension, output.tsconfig);
	const schemaFactories = getSchemaFactoriesEntry(output.mock);
	const fakerSchemasPath = schemaFactories?.schemasPath;
	const schemaFactoryDependency = schemaFactories?.schemasImportPath ?? (fakerSchemasPath && filePath ? getRelativeImportPath(filePath, join(fakerSchemasPath, "index.faker.ts")) + getImportExtension(output.fileExtension, output.tsconfig) : joinSafe(relativeSchemasPath, `index.faker${schemaFactoryImportExtension}`));
	const schemaFactoryDeps = schemaFactoryImports.length > 0 ? [{
		exports: uniqueBy(schemaFactoryImports, (entry) => `${entry.name}|${entry.alias ?? ""}`),
		dependency: schemaFactoryDependency
	}] : [];
	imports = imports.filter((i) => !i.schemaFactory);
	const schemaImports = resolveSchemaImportDependencies(output, imports.filter((i) => !i.importPath), relativeSchemasPath, {
		schemaTagMap,
		schemaOutputPlan
	});
	const otherImportsMap = /* @__PURE__ */ new Map();
	for (const imp of imports.filter((i) => !!i.importPath)) {
		const byBinding = otherImportsMap.get(imp.importPath) ?? /* @__PURE__ */ new Map();
		otherImportsMap.set(imp.importPath, byBinding);
		const key = `${imp.name}|${imp.alias ?? ""}`;
		const existing = byBinding.get(key);
		if (!existing) byBinding.set(key, imp);
		else if (imp.values && !existing.values) byBinding.set(key, {
			...existing,
			values: true
		});
	}
	const otherImports = [...otherImportsMap.entries()].map(([dependency, byBinding]) => ({
		exports: [...byBinding.values()],
		dependency
	}));
	return [
		...schemaImports,
		...schemaFactoryDeps,
		...otherImports
	];
}
/** The faker generator entry that emits schema factories (`schemas: true`). */
function getSchemaFactoriesEntry(mock) {
	return mock?.generators.find((g) => !isFunction(g) && g.type === OutputMockType.FAKER && g.schemas === true);
}
//#endregion
//#region src/writers/types.ts
function getOrvalGeneratedTypes() {
	return `
// https://stackoverflow.com/questions/49579094/typescript-conditional-types-filter-out-readonly-properties-pick-only-requir/49579497#49579497
type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends <
T,
>() => T extends Y ? 1 : 2
? A
: B;

type WritableKeys<T> = {
[P in keyof T]-?: IfEquals<
  { [Q in P]: T[P] },
  { -readonly [Q in P]: T[P] },
  P
>;
}[keyof T];

type UnionToIntersection<U> =
  (U extends any ? (k: U)=>void : never) extends ((k: infer I)=>void) ? I : never;
type DistributeReadOnlyOverUnions<T> = T extends any ? NonReadonly<T> : never;

type Writable<T> = Pick<T, WritableKeys<T>>;
type NonReadonly<T> = [T] extends [UnionToIntersection<T>] ? {
  [P in keyof Writable<T>]: T[P] extends object
    ? NonReadonly<NonNullable<T[P]>>
    : T[P];
} : DistributeReadOnlyOverUnions<T>;
`;
}
function getTypedResponse() {
	return `
interface TypedResponse<T> extends Response {
  json(): Promise<T>;
}
`;
}
//#endregion
//#region src/writers/implementation-parts.ts
/**
* Keeps only the imports whose name or alias appears in `implementation`, so
* an import pulled in by another tag or operation does not leak into a file
* that never references it.
*/
function filterImportsUsedInImplementation(imports, implementation) {
	return imports.filter((imp) => {
		const searchWords = [imp.alias, imp.name].filter((part) => Boolean(part?.length)).map((part) => escapeRegExp(part)).join("|");
		if (!searchWords) return false;
		return new RegExp(String.raw`\b(${searchWords})\b`, "g").test(implementation);
	});
}
/** The client's import header for one implementation file. */
async function generateClientImports({ builder, output, implementation, imports, projectName, isAllowSyntheticDefaultImports }) {
	return await builder.imports({
		client: output.client,
		implementation,
		imports,
		projectName,
		hasSchemaDir: !!output.schemas,
		isAllowSyntheticDefaultImports,
		hasGlobalMutator: !!output.override.mutator,
		hasTagsMutator: Object.values(output.override.tags).some((tag) => !!tag?.mutator),
		hasParamsSerializerOptions: !!output.override.paramsSerializerOptions,
		packageJson: output.packageJson,
		output
	});
}
/**
* Import statements for every mutator kind a target carries, in the order
* the generated file declares them. Only the plain `mutators` are matched
* against `implementation`; the other kinds are always imported.
*/
function generateTargetMutatorImports(target, implementation, oneMore) {
	let data = "";
	if (target.mutators) data += generateMutatorImports({
		mutators: target.mutators,
		implementation,
		oneMore
	});
	for (const mutators of [
		target.clientMutators,
		target.formData,
		target.formUrlEncoded,
		target.paramsSerializer,
		target.paramsFilter,
		target.fetchReviver
	]) if (mutators) data += generateMutatorImports({
		mutators,
		oneMore
	});
	return data;
}
/**
* Local type declarations an implementation relies on (`NonReadonly<>`,
* `TypedResponse<>`), emitted only when the implementation uses them.
*/
function generateOrvalHelperTypes(implementation) {
	let data = "";
	if (implementation.includes("NonReadonly<")) {
		data += getOrvalGeneratedTypes();
		data += "\n";
	}
	if (implementation.includes("TypedResponse<")) {
		data += getTypedResponse();
		data += "\n";
	}
	return data;
}
//#endregion
//#region src/writers/mock-imports.ts
/** Maps `components/schemas` names to consolidated index.faker import symbols. */
function buildKnownSchemaFactoryImportSets(schemaNames) {
	const factoryNames = /* @__PURE__ */ new Set();
	const typeNames = /* @__PURE__ */ new Set();
	for (const name of schemaNames) {
		const typeName = pascal(name);
		factoryNames.add(`get${typeName}Mock`);
		typeNames.add(`${typeName}Mock`);
	}
	return {
		factoryNames,
		typeNames
	};
}
/**
* Recover schema-factory imports referenced in generated mock bodies but
* missing from the collected import list (e.g. after shared-array import
* aggregation on large specs). Scans for `get<Schema>Mock()` calls and
* `as <Schema>Mock` casts emitted by strict schema delegation (#3590).
*
* When `knownSets` is provided, only symbols that exist in the consolidated
* schemas faker file are recovered — this avoids importing one-off split
* response helper factories that live in the tag file itself.
*/
function collectSchemaFactoryImportsFromImplementation(implementation, knownSets) {
	const imports = [];
	const seen = /* @__PURE__ */ new Set();
	for (const match of implementation.matchAll(/\b(get[A-Za-z0-9]+Mock)\(\)/g)) {
		const factoryName = match[1];
		if (knownSets && !knownSets.factoryNames.has(factoryName)) continue;
		const key = `value::${factoryName}`;
		if (seen.has(key)) continue;
		seen.add(key);
		imports.push({
			name: factoryName,
			values: true,
			schemaFactory: true
		});
	}
	for (const match of implementation.matchAll(/\bas ([A-Za-z0-9]+Mock)\b/g)) {
		const typeName = match[1];
		if (knownSets && !knownSets.typeNames.has(typeName)) continue;
		const key = `type::${typeName}`;
		if (seen.has(key)) continue;
		seen.add(key);
		imports.push({
			name: typeName,
			values: false,
			schemaFactory: true
		});
	}
	return imports;
}
function mergeGeneratorImports(...groups) {
	const merged = /* @__PURE__ */ new Map();
	for (const group of groups) for (const imp of group) {
		const key = `${imp.name}::${imp.alias ?? ""}`;
		const existing = merged.get(key);
		if (!existing) {
			merged.set(key, imp);
			continue;
		}
		if (!existing.values && imp.values) merged.set(key, imp);
	}
	return [...merged.values()];
}
/** Recover missing index.faker imports when `schemas: true` is enabled. */
function collectRecoveredSchemaFactoryImports(implementation, componentSchemaNames) {
	return collectSchemaFactoryImportsFromImplementation(implementation, buildKnownSchemaFactoryImportSets(componentSchemaNames));
}
//#endregion
//#region src/writers/mock-outputs.ts
/**
* Collapses the per-generator mock outputs for "inline" writer modes
* (`single`, `tags`) where every mock generator's content is concatenated
* into the implementation file. The MSW generator already emits the
* response-factory functions (`get<Op>ResponseMock`) that Faker would emit,
* so when both generators are configured we keep MSW and drop Faker to
* avoid duplicate function declarations and re-imported faker bindings.
*/
function collapseInlineMockOutputs(mockOutputs) {
	if (!mockOutputs.some((m) => m.type === OutputMockType.MSW)) return mockOutputs;
	return mockOutputs.filter((m) => m.type !== OutputMockType.FAKER);
}
/**
* Flattens a `GeneratorMockOutputFull` (which keeps `function` and `handler`
* separate) into a `GeneratorMockOutput` by concatenating the two portions.
*/
function flattenMockOutput(full) {
	return {
		type: full.type,
		implementation: full.implementation.function + full.implementation.handler,
		imports: full.imports,
		strictMockSchemaTypeNames: full.strictMockSchemaTypeNames,
		strictMockSchemaKinds: full.strictMockSchemaKinds
	};
}
const RESPONSE_MOCK_CALL_RE = /:\s*(get\w+ResponseMock\w*)\(\)/g;
/**
* Decides where the `get<Op>ResponseMock` factories live so `.msw.ts` never
* duplicates them:
*
* - The faker output declares every factory the handlers call: strip them
*   from the MSW output, the writer imports them from the faker file instead.
* - `mswOperationResponses` is false: strip the factories and replace the
*   handler fallbacks with `undefined`.
* - Otherwise leave the output unchanged, factories stay inline in `.msw.ts`.
*
* No need to remove the `faker` import when stripping, it is only added
* during import generation while the implementation still uses `faker.*`.
*/
function collapseMswFakerFullOutputs(mockOutputs, options = {}) {
	const mswEntry = mockOutputs.find((m) => m.type === OutputMockType.MSW);
	if (!mswEntry || mswEntry.implementation.function.trim().length === 0) return mockOutputs;
	const fakerEntry = mockOutputs.find((m) => m.type === OutputMockType.FAKER);
	let fakerDeclaresAllReferenced = false;
	if (fakerEntry) {
		const declared = new Set(extractResponseMockNames(fakerEntry.implementation.function));
		fakerDeclaresAllReferenced = extractResponseMockNames(mswEntry.implementation.handler).every((name) => declared.has(name));
	}
	if (fakerDeclaresAllReferenced) return mockOutputs.map((m) => m.type === OutputMockType.MSW ? {
		...m,
		implementation: {
			...m.implementation,
			function: ""
		}
	} : m);
	if (options.mswOperationResponses === false) {
		const strippedHandler = mswEntry.implementation.handler.replaceAll(RESPONSE_MOCK_CALL_RE, ": undefined");
		return mockOutputs.map((m) => m.type === OutputMockType.MSW ? {
			...m,
			implementation: {
				...m.implementation,
				function: "",
				handler: strippedHandler
			}
		} : m);
	}
	return mockOutputs;
}
const RESPONSE_MOCK_NAME_RE = /\bget\w+ResponseMock\w*\b/g;
/**
* Collects the unique `get<Op>ResponseMock` names in a mock implementation,
* including the status-suffixed ones from `generateEachHttpStatus`
* (e.g. `getListPetsResponseMock200`).
*/
function extractResponseMockNames(implementation) {
	return [...new Set([...implementation.matchAll(RESPONSE_MOCK_NAME_RE)].map((m) => m[0]))];
}
/**
* Builds the imports that let a `.msw.ts` file call the response factories
* declared in its `.faker.ts` file. Only imports names the handlers actually
* call and the faker file actually declares, so the import list can't drift
* out of sync with either file. `packageImportPath` (the faker generator's
* `importPath`) replaces the relative path when set.
*/
function buildCrossFileFakerImports(mswFilePath, fakerFilePath, mswImplementation, fakerImplementation, importExtension = "", packageImportPath) {
	const referencedNames = extractResponseMockNames(mswImplementation);
	if (referencedNames.length === 0) return [];
	const declaredNames = new Set(extractResponseMockNames(fakerImplementation));
	const responseMockNames = referencedNames.filter((name) => declaredNames.has(name));
	if (responseMockNames.length === 0) return [];
	const fakerImportPath = packageImportPath ?? getRelativeImportPath(mswFilePath, fakerFilePath) + importExtension;
	return responseMockNames.map((name) => ({
		name,
		values: true,
		importPath: fakerImportPath
	}));
}
/**
* Re-export statement for the factories a `.msw.ts` file imports from its
* faker file, so importing them from the msw file keeps working like before
* the split.
*/
function buildFakerReexportStatement(imports) {
	if (imports.length === 0) return "";
	return `export { ${imports.map((imp) => imp.name).join(", ")} } from '${imports[0].importPath}';\n`;
}
//#endregion
//#region src/writers/typescript-version.ts
const getTypeScriptVersion = (packageJson) => {
	return packageJson?.resolvedVersions?.typescript ?? packageJson?.dependencies?.typescript ?? packageJson?.devDependencies?.typescript ?? packageJson?.peerDependencies?.typescript ?? "4.4.0";
};
const hasTypeScriptAwaitedType = (packageJson) => compareVersions(getTypeScriptVersion(packageJson), "4.5.0");
//#endregion
//#region src/writers/target.ts
function emptyMockOutputFull$1(type) {
	return {
		type,
		implementation: {
			function: "",
			handler: "",
			handlerName: ""
		},
		imports: []
	};
}
async function generateTarget(builder, options) {
	const operationNames = Object.values(builder.operations).map(({ operationName }) => operationName);
	const isAngularClient = options.client === OutputClient.ANGULAR;
	const titles = await builder.title({
		outputClient: options.client,
		title: pascal(builder.info.title),
		customTitleFunc: options.override.title,
		output: options
	});
	const target = {
		imports: [],
		implementation: "",
		mockOutputs: [],
		mutators: [],
		clientMutators: [],
		formData: [],
		formUrlEncoded: [],
		paramsSerializer: [],
		paramsFilter: [],
		fetchReviver: [],
		sharedTypes: []
	};
	const operations = Object.values(builder.operations);
	for (const [index, operation] of operations.entries()) {
		target.imports.push(...operation.imports);
		target.implementation += operation.implementation + "\n";
		for (const opMock of operation.mockOutputs) {
			let acc = target.mockOutputs.find((m) => m.type === opMock.type);
			if (!acc) {
				acc = emptyMockOutputFull$1(opMock.type);
				target.mockOutputs.push(acc);
			}
			acc.imports.push(...opMock.imports);
			if (opMock.strictMockSchemaTypeNames?.length) acc.strictMockSchemaTypeNames = [.../* @__PURE__ */ new Set([...acc.strictMockSchemaTypeNames ?? [], ...opMock.strictMockSchemaTypeNames])];
			if (opMock.strictMockSchemaKinds) acc.strictMockSchemaKinds = {
				...acc.strictMockSchemaKinds,
				...opMock.strictMockSchemaKinds
			};
			acc.implementation.function += opMock.implementation.function;
			acc.implementation.handler += opMock.implementation.handler;
			if (opMock.implementation.handlerName) {
				const separator = acc.implementation.handlerName.length > 0 ? ",\n  " : "  ";
				acc.implementation.handlerName += separator + opMock.implementation.handlerName + "()";
			}
		}
		if (operation.mutator) target.mutators.push(operation.mutator);
		if (operation.formData) target.formData.push(operation.formData);
		if (operation.formUrlEncoded) target.formUrlEncoded.push(operation.formUrlEncoded);
		if (operation.paramsSerializer) target.paramsSerializer.push(operation.paramsSerializer);
		if (operation.paramsFilter) target.paramsFilter.push(operation.paramsFilter);
		if (operation.clientMutators) target.clientMutators.push(...operation.clientMutators);
		if (operation.fetchReviver) target.fetchReviver.push(operation.fetchReviver);
		if (index === operations.length - 1) {
			const isMutator = target.mutators.some((mutator) => isAngularClient ? mutator.hasThirdArg : mutator.hasSecondArg);
			const hasAwaitedType = hasTypeScriptAwaitedType(options.packageJson);
			const header = await builder.header({
				outputClient: options.client,
				isRequestOptions: options.override.requestOptions !== false,
				isMutator,
				isGlobalMutator: !!options.override.mutator,
				provideIn: options.override.angular.provideIn,
				hasAwaitedType,
				titles,
				output: options,
				verbOptions: builder.verbOptions,
				clientImplementation: target.implementation
			});
			target.implementation = (header.sharedTypes && header.sharedTypes.length > 0 ? header.sharedTypes.map((t) => `${t.exported ? "export " : ""}${t.code}`).join("\n") + "\n\n" : "") + header.implementation + target.implementation;
			const footer = await builder.footer({
				outputClient: options.client,
				operationNames,
				operations,
				hasMutator: target.mutators.length > 0,
				hasAwaitedType,
				titles,
				output: options
			});
			target.implementation += footer.implementation;
			for (const acc of target.mockOutputs) if (acc.implementation.handlerName) acc.implementation.handler = acc.implementation.handler + header.implementationMock + acc.implementation.handlerName + footer.implementationMock;
		}
	}
	return {
		imports: target.imports,
		implementation: target.implementation,
		mockOutputs: target.mockOutputs.map((m) => flattenMockOutput(m)),
		mockOutputsFull: target.mockOutputs,
		mutators: target.mutators,
		clientMutators: target.clientMutators,
		formData: target.formData,
		formUrlEncoded: target.formUrlEncoded,
		paramsSerializer: target.paramsSerializer,
		paramsFilter: target.paramsFilter,
		fetchReviver: target.fetchReviver
	};
}
//#endregion
//#region src/writers/single-mode.ts
async function writeSingleMode({ builder, output, projectName, header, needSchema, generateSchemasInline, schemaTagMap, schemaOutputPlan }) {
	try {
		const { path: targetPath, filename, dirname, extension } = getFileInfo(output.target, {
			backupFilename: conventionName(builder.info.title ?? "filename", output.namingConvention),
			extension: output.fileExtension
		});
		const target = await generateTarget(builder, output);
		const { imports, mockOutputs: rawMockOutputs, implementation } = target;
		const isAllowSyntheticDefaultImports = isSyntheticDefaultImportsAllow(output.tsconfig);
		const shouldDeinlineMocks = !output.mock.inline;
		const schemaCustomImportPath = getSchemasImportPath(output.schemas);
		const schemasPath = output.schemas ? schemaCustomImportPath ?? getRelativeImportPath(targetPath, getFileInfo(isString(output.schemas) ? output.schemas : output.schemas.path, { extension: output.fileExtension }).dirname) : void 0;
		const relativeSchemasPath = schemasPath ?? "./" + filename + ".schemas" + extension.replace(/\.ts$/, "");
		const schemasTarget = output.schemas ? getFileInfo(isString(output.schemas) ? output.schemas : output.schemas.path, { extension: output.fileExtension }).dirname : targetPath;
		const normalizedImports = filterImportsUsedInImplementation(imports, implementation).map((imp) => ({ ...imp }));
		const collapsedMockOutputs = shouldDeinlineMocks ? [] : collapseInlineMockOutputs(rawMockOutputs);
		if (!shouldDeinlineMocks) {
			const importsMock = collapsedMockOutputs.flatMap((m) => m.imports);
			for (const mockImport of importsMock) {
				const matchingImport = normalizedImports.find((imp) => imp.name === mockImport.name && (imp.alias ?? "") === (mockImport.alias ?? ""));
				if (!matchingImport) continue;
				if (!!mockImport.values || !!mockImport.isConstant || !!mockImport.default || !!mockImport.namespaceImport || !!mockImport.syntheticDefaultImport) matchingImport.values = true;
			}
		}
		let data = header;
		const importsForBuilder = schemasPath ? generateImportsForBuilder(output, normalizedImports, relativeSchemasPath, schemaTagMap, schemaOutputPlan) : generateImportsForBuilder(output, normalizedImports.filter((imp) => !!imp.importPath), ".");
		data += await generateClientImports({
			builder,
			output,
			implementation,
			imports: importsForBuilder,
			projectName,
			isAllowSyntheticDefaultImports
		});
		if (!shouldDeinlineMocks) for (const mockOutput of collapsedMockOutputs) {
			const entry = output.mock.generators.find((g) => !isFunction(g) && g.type === mockOutput.type);
			const finalizeMockOptions = getFinalizeMockImplementationOptions(output, mockOutput);
			const finalizedMockImplementation = builder.finalizeMockImplementation ? builder.finalizeMockImplementation(mockOutput.implementation, finalizeMockOptions) : mockOutput.implementation;
			const recoveredSchemaFactoryImports = !!entry && !isFunction(entry) && entry.type === OutputMockType.FAKER && entry.schemas === true && output.schemas ? collectRecoveredSchemaFactoryImports(finalizedMockImplementation, builder.schemas.filter((s) => s.schema).map((s) => s.name)) : [];
			const filteredMockImports = filterLocalStrictMockTypeImports(mergeGeneratorImports(mockOutput.imports, recoveredSchemaFactoryImports).filter((impMock) => !normalizedImports.some((imp) => imp.name === impMock.name && (imp.alias ?? "") === (impMock.alias ?? ""))), finalizeMockOptions.strictSchemaTypeNames);
			const importsMockForBuilder = schemasPath ? generateImportsForBuilder(output, filteredMockImports, relativeSchemasPath, schemaTagMap, schemaOutputPlan, targetPath) : generateImportsForBuilder(output, filteredMockImports.filter((imp) => !!imp.importPath), ".");
			data += builder.importsMock({
				implementation: finalizedMockImplementation,
				imports: importsMockForBuilder,
				projectName,
				hasSchemaDir: !!output.schemas,
				isAllowSyntheticDefaultImports,
				options: entry && !isFunction(entry) ? entry : void 0
			});
		}
		data += generateTargetMutatorImports(target, implementation);
		data += generateOrvalHelperTypes(implementation);
		if (!output.schemas && needSchema) data += generateSchemasInline ? generateSchemasInline() : generateModelsInline(builder.schemas);
		data += `${implementation.trim()}\n`;
		if (!shouldDeinlineMocks) {
			const implementationMock = collapsedMockOutputs.map((m) => m.implementation).join("\n\n");
			const finalizedImplementationMock = builder.finalizeMockImplementation ? builder.finalizeMockImplementation(implementationMock, getFinalizeMockImplementationOptions(output, collapsedMockOutputs)) : implementationMock;
			if (collapsedMockOutputs.length > 0) {
				data += "\n\n";
				data += finalizedImplementationMock;
			}
		}
		await writeGeneratedFile(targetPath, data);
		const extraPaths = [];
		if (shouldDeinlineMocks) {
			const seenMockIndexKeys = /* @__PURE__ */ new Set();
			const writtenMockEntries = [];
			for (const mockOutput of rawMockOutputs) {
				const rawEntry = output.mock.generators.find((g) => {
					if (isFunction(g)) return mockOutput.type === OutputMockType.MSW;
					return g.type === mockOutput.type;
				});
				if (!rawEntry) continue;
				const mockExtension = isFunction(rawEntry) ? OutputMockType.MSW : getMockFileExtensionByTypeName(rawEntry);
				const mockDir = getMockDir(rawEntry, output.mock) ?? dirname;
				const mockFilePath = path.join(mockDir, filename + "." + mockExtension + extension);
				const mockRelativeSchemasPath = schemaCustomImportPath ?? resolveMockSchemasPath(mockFilePath, schemasTarget);
				const finalizeMockOptions = getFinalizeMockImplementationOptions(output, mockOutput);
				const finalizedMockImplementation = builder.finalizeMockImplementation ? builder.finalizeMockImplementation(mockOutput.implementation, finalizeMockOptions) : mockOutput.implementation;
				const recoveredSchemaFactoryImports = !isFunction(rawEntry) && rawEntry.type === OutputMockType.FAKER && rawEntry.schemas === true && output.schemas ? collectRecoveredSchemaFactoryImports(finalizedMockImplementation, builder.schemas.filter((s) => s.schema).map((s) => s.name)) : [];
				const importsMockForBuilder = generateImportsForBuilder(output, filterLocalStrictMockTypeImports(mergeGeneratorImports(mockOutput.imports, recoveredSchemaFactoryImports), finalizeMockOptions.strictSchemaTypeNames), mockRelativeSchemasPath, schemaTagMap, schemaOutputPlan, mockFilePath);
				let mockData = header;
				mockData += builder.importsMock({
					implementation: finalizedMockImplementation,
					imports: importsMockForBuilder,
					projectName,
					hasSchemaDir: !!output.schemas,
					isAllowSyntheticDefaultImports,
					options: isFunction(rawEntry) ? void 0 : rawEntry
				});
				mockData += `\n${finalizedMockImplementation}`;
				await writeGeneratedFile(mockFilePath, mockData);
				extraPaths.push(mockFilePath);
				const indexKey = `${mockExtension}::${mockDir}`;
				if (!seenMockIndexKeys.has(indexKey)) {
					seenMockIndexKeys.add(indexKey);
					writtenMockEntries.push({
						extension: mockExtension,
						mockDir
					});
				}
			}
			if (output.mock.indexMockFiles) {
				const importExtension = getImportExtension(output.fileExtension, output.tsconfig);
				for (const { extension: mockExt, mockDir } of writtenMockEntries) {
					const indexMockPath = path.join(mockDir, `index.${mockExt}${extension}`);
					await writeGeneratedFile(indexMockPath, `export * from './${filename}.${mockExt}${importExtension}'\n`);
					extraPaths.push(indexMockPath);
				}
			}
		}
		return [targetPath, ...extraPaths];
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : "unknown error";
		throw new Error(`Oups... 🍻. An Error occurred while writing file => ${errorMsg}`, { cause: error });
	}
}
//#endregion
//#region src/writers/split-mode.ts
async function writeSplitMode({ builder, output, projectName, header, needSchema, generateSchemasInline, schemaTagMap, schemaOutputPlan }) {
	try {
		const { path: targetPath, filename, dirname, extension } = getFileInfo(output.target, {
			backupFilename: conventionName(builder.info.title ?? "filename", output.namingConvention),
			extension: output.fileExtension
		});
		const target = await generateTarget(builder, output);
		const { imports, implementation, mockOutputsFull } = target;
		const collapsedFull = collapseMswFakerFullOutputs(mockOutputsFull, { mswOperationResponses: output.mock.generators.find((g) => !isFunction(g) && g.type === OutputMockType.MSW)?.operationResponses });
		const mockOutputs = collapsedFull.map((m) => flattenMockOutput(m));
		let implementationData = header;
		const schemaCustomImportPath = getSchemasImportPath(output.schemas);
		const relativeSchemasPath = output.schemas ? schemaCustomImportPath ?? getRelativeImportPath(targetPath, isString(output.schemas) ? output.schemas : output.schemas.path, true) : "./" + filename + ".schemas" + getImportExtension(output.schemaFileExtension, output.tsconfig);
		const schemasTarget = output.schemas ? isString(output.schemas) ? output.schemas : output.schemas.path : path.join(dirname, filename + ".schemas" + getImportExtension(output.schemaFileExtension, output.tsconfig));
		const isAllowSyntheticDefaultImports = isSyntheticDefaultImportsAllow(output.tsconfig);
		const importsForBuilder = generateImportsForBuilder(output, imports, relativeSchemasPath, schemaTagMap, schemaOutputPlan);
		implementationData += await generateClientImports({
			builder,
			output,
			implementation,
			imports: importsForBuilder,
			projectName,
			isAllowSyntheticDefaultImports
		});
		const schemasPath = !output.schemas && needSchema ? path.join(dirname, filename + ".schemas" + output.schemaFileExtension) : void 0;
		if (schemasPath) await writeGeneratedFile(schemasPath, generateSchemasInline ? header + generateSchemasInline() : header + generateModelsInline(builder.schemas));
		implementationData += generateTargetMutatorImports(target, implementation);
		implementationData += generateOrvalHelperTypes(implementation);
		implementationData += `\n${implementation}`;
		const implementationFilename = filename + (OutputClient.ANGULAR === output.client ? ".service" : "") + extension;
		const implementationPath = path.join(dirname, implementationFilename);
		await writeGeneratedFile(implementationPath, implementationData);
		const mockPaths = [];
		const mswFactoriesMoved = mockOutputs.some((m) => m.type === OutputMockType.FAKER) && collapsedFull.some((m) => m.type === OutputMockType.MSW && m.implementation.function.trim().length === 0);
		const fakerImplementation = mockOutputs.find((m) => m.type === OutputMockType.FAKER)?.implementation ?? "";
		const fakerEntry = getFakerEntry(output.mock);
		const fakerDir = fakerEntry ? getMockDir(fakerEntry, output.mock) ?? dirname : dirname;
		const fakerFilePath = path.join(fakerDir, filename + ".faker" + extension);
		const fakerImportExtension = getImportExtension(extension, output.tsconfig);
		const seenMockIndexKeys = /* @__PURE__ */ new Set();
		const writtenMockEntries = [];
		for (const mockOutput of mockOutputs) {
			const rawEntry = output.mock.generators.find((g) => {
				if (isFunction(g)) return mockOutput.type === OutputMockType.MSW;
				return g.type === mockOutput.type;
			});
			if (!rawEntry) continue;
			const mockExtension = isFunction(rawEntry) ? OutputMockType.MSW : getMockFileExtensionByTypeName(rawEntry);
			const mockDir = getMockDir(rawEntry, output.mock) ?? dirname;
			const mockFilePath = path.join(mockDir, filename + "." + mockExtension + extension);
			const mockRelativeSchemasPath = schemaCustomImportPath ?? resolveMockSchemasPath(mockFilePath, schemasTarget);
			const finalizeMockOptions = getFinalizeMockImplementationOptions(output, mockOutput);
			const finalizedMockImplementation = builder.finalizeMockImplementation ? builder.finalizeMockImplementation(mockOutput.implementation, finalizeMockOptions) : mockOutput.implementation;
			const recoveredSchemaFactoryImports = !isFunction(rawEntry) && rawEntry.type === OutputMockType.FAKER && rawEntry.schemas === true && output.schemas ? collectRecoveredSchemaFactoryImports(finalizedMockImplementation, builder.schemas.filter((s) => s.schema).map((s) => s.name)) : [];
			const crossFileFakerImports = mswFactoriesMoved && mockOutput.type === OutputMockType.MSW ? buildCrossFileFakerImports(mockFilePath, fakerFilePath, mockOutput.implementation, fakerImplementation, fakerImportExtension, fakerEntry?.importPath) : [];
			const importsMockForBuilder = generateImportsForBuilder(output, filterLocalStrictMockTypeImports(mergeGeneratorImports(mockOutput.imports, recoveredSchemaFactoryImports, crossFileFakerImports), finalizeMockOptions.strictSchemaTypeNames), mockRelativeSchemasPath, schemaTagMap, schemaOutputPlan, mockFilePath);
			let mockData = header;
			mockData += builder.importsMock({
				implementation: finalizedMockImplementation,
				imports: importsMockForBuilder,
				projectName,
				hasSchemaDir: !!output.schemas,
				isAllowSyntheticDefaultImports,
				options: isFunction(rawEntry) ? void 0 : rawEntry
			});
			mockData += buildFakerReexportStatement(crossFileFakerImports);
			mockData += `\n${finalizedMockImplementation}`;
			await writeGeneratedFile(mockFilePath, mockData);
			mockPaths.push(mockFilePath);
			const indexKey = `${mockExtension}::${mockDir}`;
			if (!seenMockIndexKeys.has(indexKey)) {
				seenMockIndexKeys.add(indexKey);
				writtenMockEntries.push({
					extension: mockExtension,
					mockDir
				});
			}
		}
		const indexMockPaths = [];
		if (output.mock.indexMockFiles) {
			const importExtension = getImportExtension(output.fileExtension, output.tsconfig);
			for (const { extension: mockExt, mockDir } of writtenMockEntries) {
				const indexMockPath = path.join(mockDir, `index.${mockExt}${extension}`);
				await writeGeneratedFile(indexMockPath, `export * from './${filename}.${mockExt}${importExtension}'\n`);
				indexMockPaths.push(indexMockPath);
			}
		}
		return [
			implementationPath,
			...schemasPath ? [schemasPath] : [],
			...mockPaths,
			...indexMockPaths
		];
	} catch (error) {
		throw new Error(`Oups... 🍻. An Error occurred while splitting => ${String(error)}`, { cause: error });
	}
}
//#endregion
//#region src/writers/target-tags.ts
/**
* Ensures every operation has at least one tag by falling back to the
* {@link DefaultTag} constant for untagged operations, so the tag-routing
* logic in {@link generateTargetTags} always has a bucket to assign the
* operation to.
*/
function addDefaultTagIfEmpty$1(operation) {
	return {
		...operation,
		tags: operation.tags.length > 0 ? operation.tags : [DefaultTag]
	};
}
function emptyMockOutputFull(type) {
	return {
		type,
		implementation: {
			function: "",
			handler: "",
			handlerName: ""
		},
		imports: []
	};
}
function aliasConflictingSchemaFactory(mockOutput, localMockName) {
	if (!mockOutput.implementation.handlerName) return mockOutput;
	if (!mockOutput.imports.some((imp) => imp.schemaFactory && (imp.alias ?? imp.name) === localMockName)) return mockOutput;
	const implementation = Object.values(mockOutput.implementation).join("\n");
	const usedBindings = new Set(mockOutput.imports.map((imp) => imp.alias ?? imp.name));
	let alias = `${localMockName}SchemaFactory`;
	let suffix = 2;
	while (usedBindings.has(alias) || new RegExp(String.raw`\b${escapeRegExp(alias)}\b`).test(implementation)) {
		alias = `${localMockName}SchemaFactory${suffix}`;
		suffix += 1;
	}
	const bindingPattern = new RegExp(String.raw`\b${escapeRegExp(localMockName)}\b`, "g");
	const replaceBinding = (value) => value.replaceAll(bindingPattern, alias);
	return {
		...mockOutput,
		implementation: {
			function: replaceBinding(mockOutput.implementation.function),
			handler: replaceBinding(mockOutput.implementation.handler),
			handlerName: replaceBinding(mockOutput.implementation.handlerName)
		},
		imports: mockOutput.imports.map((imp) => imp.schemaFactory && (imp.alias ?? imp.name) === localMockName ? {
			...imp,
			alias
		} : imp)
	};
}
function mergeOperationMockOutputs(accMockOutputs, opMockOutputs) {
	const result = accMockOutputs.map((m) => ({
		type: m.type,
		implementation: { ...m.implementation },
		imports: [...m.imports],
		strictMockSchemaTypeNames: m.strictMockSchemaTypeNames ? [...m.strictMockSchemaTypeNames] : void 0,
		strictMockSchemaKinds: m.strictMockSchemaKinds ? { ...m.strictMockSchemaKinds } : void 0
	}));
	for (const op of opMockOutputs) {
		let acc = result.find((m) => m.type === op.type);
		if (!acc) {
			acc = emptyMockOutputFull(op.type);
			result.push(acc);
		}
		acc.imports.push(...op.imports);
		if (op.strictMockSchemaTypeNames?.length) acc.strictMockSchemaTypeNames = [.../* @__PURE__ */ new Set([...acc.strictMockSchemaTypeNames ?? [], ...op.strictMockSchemaTypeNames])];
		if (op.strictMockSchemaKinds) acc.strictMockSchemaKinds = {
			...acc.strictMockSchemaKinds,
			...op.strictMockSchemaKinds
		};
		acc.implementation.function += op.implementation.function;
		acc.implementation.handler += op.implementation.handler;
		if (op.implementation.handlerName) {
			const separator = acc.implementation.handlerName.length > 0 ? ",\n  " : "  ";
			acc.implementation.handlerName += separator + op.implementation.handlerName + "()";
		}
	}
	return result;
}
function initialMockOutputsForOperation(op) {
	return op.mockOutputs.map((m) => ({
		type: m.type,
		implementation: {
			function: m.implementation.function,
			handler: m.implementation.handler,
			handlerName: m.implementation.handlerName ? "  " + m.implementation.handlerName + "()" : ""
		},
		imports: [...m.imports],
		strictMockSchemaTypeNames: m.strictMockSchemaTypeNames ? [...m.strictMockSchemaTypeNames] : void 0,
		strictMockSchemaKinds: m.strictMockSchemaKinds ? { ...m.strictMockSchemaKinds } : void 0
	}));
}
function generateTargetTags(currentAcc, operation) {
	const tag = getOperationTagKey(operation);
	if (!Object.hasOwn(currentAcc, tag)) {
		currentAcc[tag] = {
			imports: operation.imports,
			mockOutputs: initialMockOutputsForOperation(operation),
			mutators: operation.mutator ? [operation.mutator] : [],
			clientMutators: operation.clientMutators ?? [],
			formData: operation.formData ? [operation.formData] : [],
			formUrlEncoded: operation.formUrlEncoded ? [operation.formUrlEncoded] : [],
			paramsSerializer: operation.paramsSerializer ? [operation.paramsSerializer] : [],
			paramsFilter: operation.paramsFilter ? [operation.paramsFilter] : [],
			fetchReviver: operation.fetchReviver ? [operation.fetchReviver] : [],
			implementation: operation.implementation
		};
		return currentAcc;
	}
	const currentOperation = currentAcc[tag];
	currentAcc[tag] = {
		implementation: currentOperation.implementation + operation.implementation,
		imports: [...currentOperation.imports, ...operation.imports],
		mockOutputs: mergeOperationMockOutputs(currentOperation.mockOutputs, operation.mockOutputs),
		mutators: operation.mutator ? [...currentOperation.mutators ?? [], operation.mutator] : currentOperation.mutators,
		clientMutators: operation.clientMutators ? [...currentOperation.clientMutators ?? [], ...operation.clientMutators] : currentOperation.clientMutators,
		formData: operation.formData ? [...currentOperation.formData ?? [], operation.formData] : currentOperation.formData,
		formUrlEncoded: operation.formUrlEncoded ? [...currentOperation.formUrlEncoded ?? [], operation.formUrlEncoded] : currentOperation.formUrlEncoded,
		paramsSerializer: operation.paramsSerializer ? [...currentOperation.paramsSerializer ?? [], operation.paramsSerializer] : currentOperation.paramsSerializer,
		paramsFilter: operation.paramsFilter ? [...currentOperation.paramsFilter ?? [], operation.paramsFilter] : currentOperation.paramsFilter,
		fetchReviver: operation.fetchReviver ? [...currentOperation.fetchReviver ?? [], operation.fetchReviver] : currentOperation.fetchReviver
	};
	return currentAcc;
}
async function generateTargetForTags(builder, options) {
	const isAngularClient = options.client === OutputClient.ANGULAR;
	const operations = Object.values(builder.operations).map((operation) => addDefaultTagIfEmpty$1(operation));
	let allTargetTags = {};
	for (const [index, operation] of operations.entries()) {
		allTargetTags = generateTargetTags(allTargetTags, operation);
		if (index === operations.length - 1) {
			const transformed = {};
			for (const [tag, target] of Object.entries(allTargetTags)) {
				const isMutator = !!target.mutators?.some((mutator) => isAngularClient ? mutator.hasThirdArg : mutator.hasSecondArg);
				const operationNames = operations.filter((operation) => isOperationInTagBucket(operation, tag));
				const hasAwaitedType = hasTypeScriptAwaitedType(options.packageJson);
				const titles = await builder.title({
					outputClient: options.client,
					title: pascal(tag),
					customTitleFunc: options.override.title,
					output: options
				});
				const footer = await builder.footer({
					outputClient: options.client,
					operationNames: operationNames.map(({ operationName }) => operationName),
					operations: operationNames,
					hasMutator: !!target.mutators?.length,
					hasAwaitedType,
					titles,
					output: options
				});
				const header = await builder.header({
					outputClient: options.client,
					isRequestOptions: options.override.requestOptions !== false,
					isMutator,
					isGlobalMutator: !!options.override.mutator,
					provideIn: options.override.angular.provideIn,
					hasAwaitedType,
					titles,
					output: options,
					verbOptions: builder.verbOptions,
					tag,
					isDefaultTagBucket: tag === "default" && Object.values(builder.operations).some((operation) => operation.tags.length === 0),
					clientImplementation: target.implementation
				});
				const sharedTypes = header.sharedTypes;
				const inlinedSharedTypes = !(options.tagsSplitDeduplication && !options.workspace) && sharedTypes && sharedTypes.length > 0 ? sharedTypes.map((t) => `${t.exported ? "export " : ""}${t.code}`).join("\n") + "\n\n" : "";
				const wrappedMockOutputs = target.mockOutputs.map((mockOutput) => {
					const collisionSafeMockOutput = aliasConflictingSchemaFactory(mockOutput, titles.implementationMock);
					return {
						...collisionSafeMockOutput,
						implementation: {
							function: collisionSafeMockOutput.implementation.function,
							handler: collisionSafeMockOutput.implementation.handlerName ? collisionSafeMockOutput.implementation.handler + header.implementationMock + collisionSafeMockOutput.implementation.handlerName + footer.implementationMock : collisionSafeMockOutput.implementation.handler,
							handlerName: collisionSafeMockOutput.implementation.handlerName
						}
					};
				});
				transformed[tag] = {
					implementation: inlinedSharedTypes + header.implementation + target.implementation + footer.implementation,
					mockOutputs: wrappedMockOutputs,
					imports: target.imports,
					mutators: target.mutators,
					clientMutators: target.clientMutators,
					formData: target.formData,
					formUrlEncoded: target.formUrlEncoded,
					paramsSerializer: target.paramsSerializer,
					paramsFilter: target.paramsFilter,
					fetchReviver: target.fetchReviver,
					sharedTypes
				};
			}
			allTargetTags = transformed;
		}
	}
	const result = {};
	for (const [tag, target] of Object.entries(allTargetTags)) result[tag] = {
		...target,
		mockOutputs: target.mockOutputs.map((m) => flattenMockOutput(m)),
		mockOutputsFull: target.mockOutputs
	};
	return result;
}
//#endregion
//#region src/writers/split-tags-mode.ts
async function writeSplitTagsMode({ builder, output, projectName, header, needSchema, generateSchemasInline, schemaTagMap, schemaOutputPlan }) {
	const { filename, dirname, extension } = getFileInfo(output.target, {
		backupFilename: conventionName(builder.info.title ?? "filename", output.namingConvention),
		extension: output.fileExtension
	});
	const target = await generateTargetForTags(builder, output);
	const isAllowSyntheticDefaultImports = isSyntheticDefaultImportsAllow(output.tsconfig);
	const mockIndexEntries = [];
	const schemasTarget = output.schemas ? isString(output.schemas) ? output.schemas : output.schemas.path : path.join(dirname, filename + ".schemas" + getImportExtension(output.schemaFileExtension, output.tsconfig));
	const tagEntries = Object.entries(target).toSorted(([a], [b]) => a.localeCompare(b));
	const deduplicationEnabled = output.tagsSplitDeduplication && !output.workspace;
	const collectedSharedTypes = [];
	const seenSharedTypeNames = /* @__PURE__ */ new Set();
	const firstTagForSharedType = /* @__PURE__ */ new Map();
	for (const [tag, target] of tagEntries) {
		if (!target.sharedTypes) continue;
		for (const t of target.sharedTypes) if (!seenSharedTypeNames.has(t.name)) {
			seenSharedTypeNames.add(t.name);
			collectedSharedTypes.push(t);
			firstTagForSharedType.set(t.name, tag);
		}
	}
	const commonTypesImportExtension = getImportExtension(extension, output.tsconfig);
	const commonTypesBasename = output.commonTypesFileName;
	const commonTypesPath = path.join(dirname, commonTypesBasename + extension);
	const commonTypesRelativeImport = "../" + commonTypesBasename + (deduplicationEnabled ? commonTypesImportExtension : "");
	const generatedFilePathsArray = await Promise.all(tagEntries.map(async ([tag, target]) => {
		try {
			const { imports, implementation, mockOutputsFull } = target;
			const collapsedFull = collapseMswFakerFullOutputs(mockOutputsFull, { mswOperationResponses: output.mock.generators.find((g) => !isFunction(g) && g.type === OutputMockType.MSW)?.operationResponses });
			const mockOutputs = collapsedFull.map((m) => flattenMockOutput(m));
			let implementationData = header;
			if (deduplicationEnabled && target.sharedTypes && target.sharedTypes.length > 0) {
				const typeNames = target.sharedTypes.map((t) => t.name).join(", ");
				implementationData += `import type { ${typeNames} } from '${commonTypesRelativeImport}';\n`;
			}
			const importerPath = path.join(dirname, tag, tag + extension);
			const schemaCustomImportPath = getSchemasImportPath(output.schemas);
			const relativeSchemasPath = output.schemas ? schemaCustomImportPath ?? getRelativeImportPath(importerPath, isString(output.schemas) ? output.schemas : output.schemas.path, true) : "../" + filename + ".schemas" + getImportExtension(output.schemaFileExtension, output.tsconfig);
			const tagNames = new Set(tagEntries.map(([t]) => t));
			const serviceSuffix = OutputClient.ANGULAR === output.client ? ".service" : "";
			const importsForBuilder = generateImportsForBuilder(output, imports.map((imp) => {
				if (!imp.importPath) return imp;
				if (!imp.importPath.startsWith(".")) return imp;
				const resolvedPath = path.resolve(dirname, imp.importPath);
				const targetBasename = path.basename(resolvedPath);
				let targetFile;
				if (tagNames.has(targetBasename)) {
					const tagFilename = targetBasename + serviceSuffix + extension;
					targetFile = path.join(resolvedPath, tagFilename);
				} else targetFile = resolvedPath + extension;
				const adjustedPath = getRelativeImportPath(importerPath, targetFile);
				return {
					...imp,
					importPath: adjustedPath
				};
			}), relativeSchemasPath, schemaTagMap, schemaOutputPlan);
			implementationData += await generateClientImports({
				builder,
				output,
				implementation,
				imports: importsForBuilder,
				projectName,
				isAllowSyntheticDefaultImports
			});
			const schemasPath = !output.schemas && needSchema ? path.join(dirname, filename + ".schemas" + output.schemaFileExtension) : void 0;
			if (schemasPath) await writeGeneratedFile(schemasPath, generateSchemasInline ? header + generateSchemasInline() : header + generateModelsInline(builder.schemas));
			implementationData += generateTargetMutatorImports(target, implementation, true);
			implementationData += generateOrvalHelperTypes(implementation);
			implementationData += `\n${implementation}`;
			const implementationFilename = tag + (OutputClient.ANGULAR === output.client ? ".service" : "") + extension;
			const implementationPath = path.join(dirname, tag, implementationFilename);
			await writeGeneratedFile(implementationPath, implementationData);
			const mockPaths = [];
			const mswFactoriesMoved = mockOutputs.some((m) => m.type === OutputMockType.FAKER) && collapsedFull.some((m) => m.type === OutputMockType.MSW && m.implementation.function.trim().length === 0);
			const fakerImplementation = mockOutputs.find((m) => m.type === OutputMockType.FAKER)?.implementation ?? "";
			const fakerEntry = getFakerEntry(output.mock);
			const fakerDir = fakerEntry ? getMockDir(fakerEntry, output.mock) ?? dirname : dirname;
			const fakerFilePath = path.join(fakerDir, tag, tag + ".faker" + extension);
			const fakerImportExtension = getImportExtension(extension, output.tsconfig);
			for (const mockOutput of mockOutputs) {
				const rawEntry = output.mock.generators.find((g) => {
					if (isFunction(g)) return mockOutput.type === OutputMockType.MSW;
					return g.type === mockOutput.type;
				});
				if (!rawEntry) continue;
				const mockExtension = isFunction(rawEntry) ? OutputMockType.MSW : getMockFileExtensionByTypeName(rawEntry);
				const mockDir = getMockDir(rawEntry, output.mock) ?? dirname;
				const mockFilePath = path.join(mockDir, tag, tag + "." + mockExtension + extension);
				const mockRelativeSchemasPath = schemaCustomImportPath ?? resolveMockSchemasPath(mockFilePath, schemasTarget);
				const finalizeMockOptions = getFinalizeMockImplementationOptions(output, mockOutput);
				const finalizedMockImplementation = builder.finalizeMockImplementation ? builder.finalizeMockImplementation(mockOutput.implementation, finalizeMockOptions) : mockOutput.implementation;
				const recoveredSchemaFactoryImports = !isFunction(rawEntry) && rawEntry.type === OutputMockType.FAKER && rawEntry.schemas === true && output.schemas ? collectRecoveredSchemaFactoryImports(finalizedMockImplementation, builder.schemas.filter((s) => s.schema).map((s) => s.name)) : [];
				const crossFileFakerImports = mswFactoriesMoved && mockOutput.type === OutputMockType.MSW ? buildCrossFileFakerImports(mockFilePath, fakerFilePath, mockOutput.implementation, fakerImplementation, fakerImportExtension, fakerEntry?.importPath) : [];
				const importsMockForBuilder = generateImportsForBuilder(output, filterLocalStrictMockTypeImports(mergeGeneratorImports(mockOutput.imports, recoveredSchemaFactoryImports, crossFileFakerImports), finalizeMockOptions.strictSchemaTypeNames), mockRelativeSchemasPath, schemaTagMap, schemaOutputPlan, mockFilePath);
				let mockData = header;
				mockData += builder.importsMock({
					implementation: finalizedMockImplementation,
					imports: importsMockForBuilder,
					projectName,
					hasSchemaDir: !!output.schemas,
					isAllowSyntheticDefaultImports,
					options: isFunction(rawEntry) ? void 0 : rawEntry
				});
				mockData += buildFakerReexportStatement(crossFileFakerImports);
				mockData += `\n${finalizedMockImplementation}`;
				await writeGeneratedFile(mockFilePath, mockData);
				mockPaths.push(mockFilePath);
				let indexEntry = mockIndexEntries.find((e) => e.ext === mockExtension && e.mockDir === mockDir);
				if (!indexEntry) {
					indexEntry = {
						ext: mockExtension,
						mockDir,
						tags: []
					};
					mockIndexEntries.push(indexEntry);
				}
				if (!indexEntry.tags.includes(tag)) indexEntry.tags.push(tag);
			}
			return [
				implementationPath,
				...schemasPath ? [schemasPath] : [],
				...mockPaths
			];
		} catch (error) {
			throw new Error(`Oups... 🍻. An Error occurred while splitting tag ${tag} => ${String(error)}`, { cause: error });
		}
	}));
	if (output.mock.indexMockFiles) {
		const mockImportExtension = getImportExtension(extension, output.tsconfig);
		for (const { ext, mockDir, tags } of mockIndexEntries) await writeGeneratedFile(path.join(mockDir, `index.${ext}${extension}`), tags.toSorted((a, b) => a.localeCompare(b)).map((tag) => {
			const localMockPath = joinSafe("./", tag, tag + "." + ext + mockImportExtension);
			return ext === OutputMockType.MSW ? `export { get${pascal(tag)}Mock } from '${localMockPath}'\n` : `export * from '${localMockPath}'\n`;
		}).join(""));
	}
	let commonTypesFilePath;
	if (deduplicationEnabled && collectedSharedTypes.length > 0) {
		const commonTypesContent = collectedSharedTypes.map((t) => `export ${t.code}`).join("\n") + "\n";
		commonTypesFilePath = commonTypesPath;
		await writeGeneratedFile(commonTypesPath, commonTypesContent);
	}
	let indexFilePath;
	if (output.indexFiles && tagEntries.length > 0) {
		const importExtension = getImportExtension(output.fileExtension, output.tsconfig);
		const serviceSuffix = OutputClient.ANGULAR === output.client ? ".service" : "";
		const publicSharedTypeNames = collectedSharedTypes.filter((t) => t.exported).map((t) => t.name);
		const namedReExports = publicSharedTypeNames.length === 0 ? "" : deduplicationEnabled ? `export type { ${publicSharedTypeNames.join(", ")} } from './${commonTypesBasename}${importExtension}';\n` : publicSharedTypeNames.map((name) => {
			const owningTag = firstTagForSharedType.get(name);
			if (!owningTag) return "";
			return `export type { ${name} } from '${joinSafe("./", owningTag, owningTag + serviceSuffix + importExtension)}';\n`;
		}).join("");
		const tagReExports = tagEntries.map(([tag]) => {
			return `export * from '${joinSafe("./", tag, tag + serviceSuffix + importExtension)}';\n`;
		}).join("");
		const extraFileReExports = buildBarrelReExports(builder.extraFiles.filter((file) => file.barrelExport), {
			dirname,
			extension,
			importExtension
		}, { types: publicSharedTypeNames });
		const indexContent = namedReExports + tagReExports + extraFileReExports.map((line) => `${line}\n`).join("");
		indexFilePath = path.join(dirname, `index${extension}`);
		await writeGeneratedFile(indexFilePath, indexContent);
	}
	return [.../* @__PURE__ */ new Set([
		...output.mock.indexMockFiles ? mockIndexEntries.map(({ mockDir, ext }) => path.join(mockDir, `index.${ext}${extension}`)) : [],
		...commonTypesFilePath ? [commonTypesFilePath] : [],
		...indexFilePath ? [indexFilePath] : [],
		...generatedFilePathsArray.flat()
	])];
}
//#endregion
//#region src/writers/tags-mode.ts
async function writeTagsMode({ builder, output, projectName, header, needSchema, generateSchemasInline, schemaTagMap, schemaOutputPlan }) {
	const { path: targetPath, filename, dirname, extension } = getFileInfo(output.target, {
		backupFilename: conventionName(builder.info.title ?? "filename", output.namingConvention),
		extension: output.fileExtension
	});
	const target = await generateTargetForTags(builder, output);
	const isAllowSyntheticDefaultImports = isSyntheticDefaultImportsAllow(output.tsconfig);
	const shouldDeinlineMocks = !output.mock.inline;
	const mockIndexEntries = [];
	const schemaCustomImportPath = getSchemasImportPath(output.schemas);
	const schemasPathRelative = output.schemas ? schemaCustomImportPath ?? getRelativeImportPath(targetPath, getFileInfo(isString(output.schemas) ? output.schemas : output.schemas.path, { extension: output.fileExtension }).dirname) : "./" + filename + ".schemas" + getImportExtension(output.schemaFileExtension, output.tsconfig);
	const schemasTarget = output.schemas ? getFileInfo(isString(output.schemas) ? output.schemas : output.schemas.path, { extension: output.fileExtension }).dirname : path.join(dirname, filename + ".schemas" + getImportExtension(output.schemaFileExtension, output.tsconfig));
	const tagEntries = Object.entries(target).toSorted(([a], [b]) => a.localeCompare(b));
	const generatedFilePathsArray = await Promise.all(tagEntries.map(async ([tag, target]) => {
		try {
			const { imports, implementation, mockOutputs: rawMockOutputs } = target;
			const normalizedImports = filterImportsUsedInImplementation(imports, implementation).map((imp) => ({ ...imp }));
			const collapsedMockOutputs = shouldDeinlineMocks ? [] : collapseInlineMockOutputs(rawMockOutputs);
			let data = header;
			if (!shouldDeinlineMocks) {
				const importsMock = collapsedMockOutputs.flatMap((m) => m.imports);
				for (const mockImport of importsMock) {
					const matchingImport = normalizedImports.find((imp) => imp.name === mockImport.name && (imp.alias ?? "") === (mockImport.alias ?? ""));
					if (!matchingImport) continue;
					if (!!mockImport.values || !!mockImport.isConstant || !!mockImport.default || !!mockImport.namespaceImport || !!mockImport.syntheticDefaultImport) matchingImport.values = true;
				}
			}
			const importsForBuilder = generateImportsForBuilder(output, normalizedImports, schemasPathRelative, schemaTagMap, schemaOutputPlan);
			data += await generateClientImports({
				builder,
				output,
				implementation,
				imports: importsForBuilder,
				projectName,
				isAllowSyntheticDefaultImports
			});
			const kebabTag = kebab(tag);
			const implementationPath = path.join(dirname, `${kebabTag}${extension}`);
			if (!shouldDeinlineMocks) for (const mockOutput of collapsedMockOutputs) {
				const entry = output.mock.generators.find((g) => !isFunction(g) && g.type === mockOutput.type);
				const importsMockForBuilder = generateImportsForBuilder(output, mockOutput.imports.filter((impMock) => !normalizedImports.some((imp) => imp.name === impMock.name && (imp.alias ?? "") === (impMock.alias ?? ""))), schemasPathRelative, schemaTagMap, schemaOutputPlan, implementationPath);
				data += builder.importsMock({
					implementation: mockOutput.implementation,
					imports: importsMockForBuilder,
					projectName,
					hasSchemaDir: !!output.schemas,
					isAllowSyntheticDefaultImports,
					options: entry && !isFunction(entry) ? entry : void 0
				});
			}
			const schemasPath = !output.schemas && needSchema ? path.join(dirname, filename + ".schemas" + output.schemaFileExtension) : void 0;
			if (schemasPath) await writeGeneratedFile(schemasPath, generateSchemasInline ? header + generateSchemasInline() : header + generateModelsInline(builder.schemas));
			data += generateTargetMutatorImports(target, implementation);
			data += "\n\n";
			data += generateOrvalHelperTypes(implementation);
			data += implementation;
			if (!shouldDeinlineMocks) {
				const implementationMock = collapsedMockOutputs.map((m) => m.implementation).join("\n\n");
				const finalizedImplementationMock = builder.finalizeMockImplementation ? builder.finalizeMockImplementation(implementationMock, getFinalizeMockImplementationOptions(output, collapsedMockOutputs)) : implementationMock;
				if (collapsedMockOutputs.length > 0) {
					data += "\n\n";
					data += finalizedImplementationMock;
				}
			}
			await writeGeneratedFile(implementationPath, data);
			const extraPaths = [];
			if (shouldDeinlineMocks) for (const mockOutput of rawMockOutputs) {
				const rawEntry = output.mock.generators.find((g) => {
					if (isFunction(g)) return mockOutput.type === OutputMockType.MSW;
					return g.type === mockOutput.type;
				});
				if (!rawEntry) continue;
				const mockExtension = isFunction(rawEntry) ? OutputMockType.MSW : getMockFileExtensionByTypeName(rawEntry);
				const mockDir = getMockDir(rawEntry, output.mock) ?? dirname;
				const mockFilePath = path.join(mockDir, kebabTag, kebabTag + "." + mockExtension + extension);
				const mockRelativeSchemasPath = schemaCustomImportPath ?? resolveMockSchemasPath(mockFilePath, schemasTarget);
				const finalizeMockOptions = getFinalizeMockImplementationOptions(output, mockOutput);
				const finalizedMockImplementation = builder.finalizeMockImplementation ? builder.finalizeMockImplementation(mockOutput.implementation, finalizeMockOptions) : mockOutput.implementation;
				const recoveredSchemaFactoryImports = !isFunction(rawEntry) && rawEntry.type === OutputMockType.FAKER && rawEntry.schemas === true && output.schemas ? collectRecoveredSchemaFactoryImports(finalizedMockImplementation, builder.schemas.filter((s) => s.schema).map((s) => s.name)) : [];
				const importsMockForBuilder = generateImportsForBuilder(output, filterLocalStrictMockTypeImports(mergeGeneratorImports(mockOutput.imports, recoveredSchemaFactoryImports), finalizeMockOptions.strictSchemaTypeNames), mockRelativeSchemasPath, schemaTagMap, schemaOutputPlan, mockFilePath);
				let mockData = header;
				mockData += builder.importsMock({
					implementation: finalizedMockImplementation,
					imports: importsMockForBuilder,
					projectName,
					hasSchemaDir: !!output.schemas,
					isAllowSyntheticDefaultImports,
					options: isFunction(rawEntry) ? void 0 : rawEntry
				});
				mockData += `\n${finalizedMockImplementation}`;
				await writeGeneratedFile(mockFilePath, mockData);
				extraPaths.push(mockFilePath);
				let indexEntry = mockIndexEntries.find((e) => e.ext === mockExtension && e.mockDir === mockDir);
				if (!indexEntry) {
					indexEntry = {
						ext: mockExtension,
						mockDir,
						tags: []
					};
					mockIndexEntries.push(indexEntry);
				}
				if (!indexEntry.tags.includes(kebabTag)) indexEntry.tags.push(kebabTag);
			}
			return [
				implementationPath,
				...schemasPath ? [schemasPath] : [],
				...extraPaths
			];
		} catch (error) {
			throw new Error(`Oups... 🍻. An Error occurred while writing tag ${tag} => ${String(error)}`, { cause: error });
		}
	}));
	if (shouldDeinlineMocks && output.mock.indexMockFiles) {
		const mockImportExtension = getImportExtension(extension, output.tsconfig);
		for (const { ext, mockDir, tags } of mockIndexEntries) {
			const indexPath = path.join(mockDir, `index.${ext}${extension}`);
			await writeGeneratedFile(indexPath, tags.toSorted((a, b) => a.localeCompare(b)).map((kebabTag) => {
				const localMockPath = joinSafe("./", kebabTag, kebabTag + "." + ext + mockImportExtension);
				return ext === OutputMockType.MSW ? `export { get${pascal(kebabTag)}Mock } from '${localMockPath}'\n` : `export * from '${localMockPath}'\n`;
			}).join(""));
			generatedFilePathsArray.push([indexPath]);
		}
	}
	return generatedFilePathsArray.flat();
}
//#endregion
//#region src/writers/target-tags-operations.ts
/**
* Resolves the transitive closure of component schemas an operation's
* implementation references, so `tags-operations-split`'s per-operation
* `.schemas` file includes not just the schemas named directly in the
* operation's imports but everything those schemas reference too (e.g. a
* `Pet` schema composed from `Dog` / `Cat` via `oneOf`). Mirrors the
* traversal in `schema-tag-mapper.ts`'s `propagateTransitiveTags`.
*/
function resolveTransitiveSchemas(directNames, schemas) {
	const schemaByName = new Map(schemas.map((s) => [s.name, s]));
	const included = /* @__PURE__ */ new Set();
	const queue = [...directNames];
	while (queue.length > 0) {
		const name = queue.pop();
		if (included.has(name)) continue;
		const schema = schemaByName.get(name);
		if (!schema) continue;
		included.add(name);
		for (const imp of schema.imports) if (schemaByName.has(imp.name) && !included.has(imp.name)) queue.push(imp.name);
	}
	return schemas.filter((s) => included.has(s.name));
}
const TYPE_DECLARATION_RE = /^(export\s+)?type\s+([A-Za-z_$][\w$]*)/gm;
const VALUE_DECLARATION_RE = /^(export\s+)?(const|function)\s+([A-Za-z_$][\w$]*)/gm;
/**
* Extracts the top-level `type`/`const`/`function` names declared in the
* tag helper block, and rewrites the block so every one of them is
* `export`ed — necessary now that the block lives in its own module and is
* imported by name rather than inlined into the operation file.
*/
function extractDeclaredNames(implementation) {
	const typeNames = [...implementation.matchAll(TYPE_DECLARATION_RE)].map((match) => match[2]);
	const valueNames = [...implementation.matchAll(VALUE_DECLARATION_RE)].map((match) => match[3]);
	return {
		implementation: implementation.replaceAll(TYPE_DECLARATION_RE, (whole, existingExport) => existingExport ? whole : `export ${whole}`).replaceAll(VALUE_DECLARATION_RE, (whole, existingExport) => existingExport ? whole : `export ${whole}`),
		typeNames,
		valueNames
	};
}
/**
* Builds the import statement(s) an operation file uses to pull in its
* tag's shared helper block, or `''` when the helper has nothing to export.
* A plain `import './tag.helpers'` would compile but never bring the
* helper's `type`/`const` names into scope — callers must import them by
* name, and type names must use `import type` while runtime values
* (e.g. `withQueryKey`) need a real import so they survive to the emitted JS.
*/
function buildTagHelpersImport(helpers, helperImportPath, usedIn) {
	const used = (name) => !usedIn || new RegExp(String.raw`\b${name}\b`).test(usedIn);
	const typeNames = helpers.typeNames.filter(used);
	const valueNames = helpers.valueNames.filter(used);
	let result = "";
	if (typeNames.length > 0) result += `import type { ${typeNames.join(", ")} } from '${helperImportPath}';\n`;
	if (valueNames.length > 0) result += `import { ${valueNames.join(", ")} } from '${helperImportPath}';\n`;
	return result;
}
/**
* Ensures every operation has at least one tag by falling back to the
* {@link DefaultTag} constant for untagged operations, mirroring
* `target-tags.ts`'s `addDefaultTagIfEmpty` so operations without a tag still
* land in a bucket.
*/
function addDefaultTagIfEmpty(operation) {
	return {
		...operation,
		tags: operation.tags.length > 0 ? operation.tags : [DefaultTag]
	};
}
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
async function generateTargetForTagsOperations(builder, options) {
	const isAngularClient = options.client === OutputClient.ANGULAR;
	const hasAwaitedType = hasTypeScriptAwaitedType(options.packageJson);
	const operations = Object.values(builder.operations).map((operation) => addDefaultTagIfEmpty(operation));
	const tags = [...new Set(operations.map((op) => getOperationTagKey(op)))];
	const result = {};
	for (const tag of tags) {
		const tagOperations = operations.filter((operation) => isOperationInTagBucket(operation, tag));
		const mergedImplementation = tagOperations.map((operation) => operation.implementation).join("");
		const mergedMutators = tagOperations.map((operation) => operation.mutator).filter((mutator) => !!mutator);
		const isMutator = mergedMutators.some((mutator) => isAngularClient ? mutator.hasThirdArg : mutator.hasSecondArg);
		const titles = await builder.title({
			outputClient: options.client,
			title: pascal(tag),
			customTitleFunc: options.override.title,
			output: options
		});
		const footer = await builder.footer({
			outputClient: options.client,
			operationNames: tagOperations.map(({ operationName }) => operationName),
			operations: tagOperations,
			hasMutator: mergedMutators.length > 0,
			hasAwaitedType,
			titles,
			output: options
		});
		const header = await builder.header({
			outputClient: options.client,
			isRequestOptions: options.override.requestOptions !== false,
			isMutator,
			isGlobalMutator: !!options.override.mutator,
			provideIn: options.override.angular.provideIn,
			hasAwaitedType,
			titles,
			output: options,
			verbOptions: builder.verbOptions,
			tag,
			isDefaultTagBucket: tag === "default" && Object.values(builder.operations).some((operation) => operation.tags.length === 0),
			clientImplementation: mergedImplementation
		});
		const sharedTypes = header.sharedTypes;
		const { implementation: helperImplementation, typeNames, valueNames } = extractDeclaredNames((sharedTypes && sharedTypes.length > 0 ? sharedTypes.map((t) => `${t.exported ? "export " : ""}${t.code}`).join("\n") + "\n\n" : "") + header.implementation + footer.implementation);
		const operationTargets = tagOperations.map((operation) => {
			const wrappedMockOutputs = operation.mockOutputs.map((m) => ({
				type: m.type,
				implementation: {
					function: m.implementation.function,
					handler: m.implementation.handlerName ? m.implementation.handler + header.implementationMock + "  " + m.implementation.handlerName + "()" + footer.implementationMock : m.implementation.handler,
					handlerName: m.implementation.handlerName
				},
				imports: m.imports,
				strictMockSchemaTypeNames: m.strictMockSchemaTypeNames,
				strictMockSchemaKinds: m.strictMockSchemaKinds
			}));
			return {
				operationName: operation.operationName,
				imports: operation.imports,
				implementation: operation.implementation,
				mockOutputs: wrappedMockOutputs.map((m) => flattenMockOutput(m)),
				mockOutputsFull: wrappedMockOutputs,
				mutators: operation.mutator ? [operation.mutator] : void 0,
				clientMutators: operation.clientMutators,
				formData: operation.formData ? [operation.formData] : void 0,
				formUrlEncoded: operation.formUrlEncoded ? [operation.formUrlEncoded] : void 0,
				paramsSerializer: operation.paramsSerializer ? [operation.paramsSerializer] : void 0,
				paramsFilter: operation.paramsFilter ? [operation.paramsFilter] : void 0,
				fetchReviver: operation.fetchReviver ? [operation.fetchReviver] : void 0
			};
		});
		result[tag] = {
			helpers: {
				implementation: helperImplementation,
				sharedTypes,
				typeNames,
				valueNames
			},
			operations: operationTargets
		};
	}
	return result;
}
//#endregion
//#region src/writers/tags-operations-mode.ts
const SUPPORTED_CLIENTS = /* @__PURE__ */ new Set([
	OutputClient.REACT_QUERY,
	OutputClient.SVELTE_QUERY,
	OutputClient.VUE_QUERY,
	OutputClient.SWR,
	OutputClient.FETCH
]);
function assertClientSupportsTagsOperations(client, mode) {
	if (typeof client !== "string" || !SUPPORTED_CLIENTS.has(client)) {
		const clientLabel = typeof client === "string" ? client : "custom";
		throw new Error(`Output mode '${mode}' is not supported with the '${clientLabel}' client. It requires operations that compile to standalone functions (react-query, svelte-query, vue-query, swr, fetch); '${clientLabel}' groups operations into a shared structure. Use 'tags' or 'tags-split' instead.`);
	}
}
/**
* `tags-operations` mode: one file per operation, nested under a per-tag
* directory (`<dir>/<tag>/<operation><ext>`), each containing both the
* operation's types and its runtime implementation. A per-tag barrel
* (`<dir>/<tag>/index<ext>`) re-exports every operation file so existing
* `import from '<build>/<tag>'`-style imports keep working.
*/
async function writeTagsOperationsMode({ builder, output, projectName, header, needSchema, generateSchemasInline, schemaTagMap, schemaOutputPlan }) {
	assertClientSupportsTagsOperations(output.client, "tags-operations");
	const { filename, dirname, extension } = getFileInfo(output.target, {
		backupFilename: conventionName(builder.info.title ?? "filename", output.namingConvention),
		extension: output.fileExtension
	});
	const target = await generateTargetForTagsOperations(builder, output);
	const isAllowSyntheticDefaultImports = isSyntheticDefaultImportsAllow(output.tsconfig);
	const schemaCustomImportPath = getSchemasImportPath(output.schemas);
	const schemasPathRelative = output.schemas ? schemaCustomImportPath ?? getRelativeImportPath(path.join(dirname, "tag", filename + extension), getFileInfo(isString(output.schemas) ? output.schemas : output.schemas.path, { extension: output.fileExtension }).dirname, true) : "../" + filename + ".schemas" + getImportExtension(output.schemaFileExtension, output.tsconfig);
	const schemasTarget = output.schemas ? getFileInfo(isString(output.schemas) ? output.schemas : output.schemas.path, { extension: output.fileExtension }).dirname : path.join(dirname, filename + ".schemas" + getImportExtension(output.schemaFileExtension, output.tsconfig));
	const schemasPath = !output.schemas && needSchema ? path.join(dirname, filename + ".schemas" + output.schemaFileExtension) : void 0;
	if (schemasPath) await writeGeneratedFile(schemasPath, generateSchemasInline ? header + generateSchemasInline() : header + generateModelsInline(builder.schemas));
	const tagEntries = Object.entries(target).toSorted(([a], [b]) => a.localeCompare(b));
	const mockIndexEntries = [];
	const allGeneratedPaths = (await Promise.all(tagEntries.map(async ([tag, { helpers, operations }]) => {
		try {
			const tagDir = path.join(dirname, tag);
			const helperFilename = `${tag}.helpers${extension}`;
			const helperPath = path.join(tagDir, helperFilename);
			const hasHelpers = helpers.implementation.trim().length > 0;
			const helperImportExtension = getImportExtension(extension, output.tsconfig);
			const helperImportPath = "./" + tag + ".helpers" + helperImportExtension;
			if (hasHelpers) await writeGeneratedFile(helperPath, header + helpers.implementation);
			const operationFilePaths = await Promise.all(operations.map(async (operation) => {
				const operationFilename = kebab(operation.operationName);
				const implementationPath = path.join(tagDir, `${operationFilename}${extension}`);
				const importsForBuilder = generateImportsForBuilder(output, filterImportsUsedInImplementation(operation.imports, operation.implementation), schemasPathRelative, schemaTagMap, schemaOutputPlan);
				let data = header;
				if (hasHelpers) data += buildTagHelpersImport(helpers, helperImportPath, operation.implementation);
				data += await generateClientImports({
					builder,
					output,
					implementation: operation.implementation,
					imports: importsForBuilder,
					projectName,
					isAllowSyntheticDefaultImports
				});
				data += generateTargetMutatorImports(operation, operation.implementation, true);
				data += "\n\n";
				data += generateOrvalHelperTypes(operation.implementation);
				data += operation.implementation;
				await writeGeneratedFile(implementationPath, data);
				const extraPaths = [];
				for (const mockOutput of operation.mockOutputsFull) {
					if (!mockOutput.implementation.handlerName) continue;
					const rawEntry = output.mock.generators.find((g) => {
						if (isFunction(g)) return mockOutput.type === OutputMockType.MSW;
						return g.type === mockOutput.type;
					});
					if (!rawEntry) continue;
					const mockExtension = isFunction(rawEntry) ? OutputMockType.MSW : getMockFileExtensionByTypeName(rawEntry);
					const mockDir = getMockDir(rawEntry, output.mock) ?? dirname;
					const kebabOperation = kebab(operation.operationName);
					const mockFilePath = path.join(mockDir, tag, kebabOperation + "." + mockExtension + extension);
					const mockRelativeSchemasPath = schemaCustomImportPath ?? resolveMockSchemasPath(mockFilePath, schemasTarget);
					const finalizeMockOptions = getFinalizeMockImplementationOptions(output, mockOutput);
					const finalizedMockImplementation = builder.finalizeMockImplementation ? builder.finalizeMockImplementation(mockOutput.implementation.function + mockOutput.implementation.handler, finalizeMockOptions) : mockOutput.implementation.function + mockOutput.implementation.handler;
					const recoveredSchemaFactoryImports = !isFunction(rawEntry) && rawEntry.type === OutputMockType.FAKER && rawEntry.schemas === true && output.schemas ? collectRecoveredSchemaFactoryImports(finalizedMockImplementation, builder.schemas.filter((s) => s.schema).map((s) => s.name)) : [];
					const importsMockForBuilder = generateImportsForBuilder(output, filterLocalStrictMockTypeImports(mergeGeneratorImports(mockOutput.imports, recoveredSchemaFactoryImports), finalizeMockOptions.strictSchemaTypeNames), mockRelativeSchemasPath, schemaTagMap, void 0, mockFilePath);
					let mockData = header;
					mockData += builder.importsMock({
						implementation: finalizedMockImplementation,
						imports: importsMockForBuilder,
						projectName,
						hasSchemaDir: !!output.schemas,
						isAllowSyntheticDefaultImports,
						options: isFunction(rawEntry) ? void 0 : rawEntry
					});
					mockData += `\n${finalizedMockImplementation}`;
					await writeGeneratedFile(mockFilePath, mockData);
					extraPaths.push(mockFilePath);
					let indexEntry = mockIndexEntries.find((e) => e.ext === mockExtension && e.mockDir === mockDir);
					if (!indexEntry) {
						indexEntry = {
							ext: mockExtension,
							mockDir,
							operations: []
						};
						mockIndexEntries.push(indexEntry);
					}
					if (!indexEntry.operations.some((o) => o.tag === tag && o.opName === kebabOperation)) indexEntry.operations.push({
						tag,
						opName: kebabOperation,
						handlerName: mockOutput.implementation.handlerName
					});
				}
				return {
					operationFilename,
					paths: [implementationPath, ...extraPaths]
				};
			}));
			const indexPaths = [];
			if (output.indexFiles) {
				const importExtension = getImportExtension(extension, output.tsconfig);
				const barrelContent = operationFilePaths.map(({ operationFilename }) => `export * from './${operationFilename}${importExtension}';\n`).join("");
				const indexPath = path.join(tagDir, `index${extension}`);
				await writeGeneratedFile(indexPath, barrelContent);
				indexPaths.push(indexPath);
			}
			return [
				...hasHelpers ? [helperPath] : [],
				...operationFilePaths.flatMap(({ paths }) => paths),
				...indexPaths
			];
		} catch (error) {
			throw new Error(`Oups... 🍻. An Error occurred while writing tag ${tag} => ${String(error)}`, { cause: error });
		}
	}))).flat();
	const mockIndexPaths = [];
	if (output.mock.indexMockFiles) {
		const mockImportExtension = getImportExtension(extension, output.tsconfig);
		for (const { ext, mockDir, operations } of mockIndexEntries) {
			const indexPath = path.join(mockDir, `index.${ext}${extension}`);
			await writeGeneratedFile(indexPath, operations.toSorted((a, b) => a.tag.localeCompare(b.tag) || a.opName.localeCompare(b.opName)).map(({ tag, opName, handlerName }) => {
				const localMockPath = joinSafe("./", tag, opName + "." + ext + mockImportExtension);
				const alias = `${pascal(tag)}${pascal(opName)}MockHandler`;
				return ext === OutputMockType.MSW ? `export { ${handlerName} as ${alias} } from '${localMockPath}'\n` : `export * from '${localMockPath}'\n`;
			}).join(""));
			mockIndexPaths.push(indexPath);
		}
	}
	let rootIndexPath;
	if (output.indexFiles) {
		const importExtension = getImportExtension(extension, output.tsconfig);
		const rootBarrelContent = tagEntries.map(([tag]) => `export * from './${tag}/index${importExtension}';\n`).join("");
		rootIndexPath = path.join(dirname, `index${extension}`);
		await writeGeneratedFile(rootIndexPath, rootBarrelContent);
	}
	return [
		...schemasPath ? [schemasPath] : [],
		...rootIndexPath ? [rootIndexPath] : [],
		...allGeneratedPaths,
		...mockIndexPaths
	];
}
//#endregion
//#region src/writers/tags-operations-split-mode.ts
/**
* `tags-operations-split` mode: two files per operation, nested under a
* per-tag directory (`<dir>/<tag>/<operation><ext>` for the runtime
* implementation, `<dir>/<tag>/<operation>.schemas<ext>` for the component
* schemas that operation's implementation references), plus a per-tag
* barrel (`<dir>/<tag>/index<ext>`) re-exporting both files for every
* operation so existing `import from '<build>/<tag>'`-style imports keep
* working.
*/
async function writeTagsOperationsSplitMode({ builder, output, projectName, header, needSchema, generateSchemasInline, schemaTagMap, schemaOutputPlan }) {
	assertClientSupportsTagsOperations(output.client, "tags-operations-split");
	const { filename, dirname, extension } = getFileInfo(output.target, {
		backupFilename: conventionName(builder.info.title ?? "filename", output.namingConvention),
		extension: output.fileExtension
	});
	const target = await generateTargetForTagsOperations(builder, output);
	const isAllowSyntheticDefaultImports = isSyntheticDefaultImportsAllow(output.tsconfig);
	const schemaCustomImportPath = getSchemasImportPath(output.schemas);
	const schemasPathRelative = output.schemas ? schemaCustomImportPath ?? getRelativeImportPath(path.join(dirname, "tag", filename + extension), getFileInfo(isString(output.schemas) ? output.schemas : output.schemas.path, { extension: output.fileExtension }).dirname, true) : "../" + filename + ".schemas" + getImportExtension(output.schemaFileExtension, output.tsconfig);
	const schemasTarget = output.schemas ? getFileInfo(isString(output.schemas) ? output.schemas : output.schemas.path, { extension: output.fileExtension }).dirname : path.join(dirname, filename + ".schemas" + getImportExtension(output.schemaFileExtension, output.tsconfig));
	const globalSchemasPath = !output.schemas && needSchema ? path.join(dirname, filename + ".schemas" + output.schemaFileExtension) : void 0;
	if (globalSchemasPath) await writeGeneratedFile(globalSchemasPath, generateSchemasInline ? header + generateSchemasInline() : header + generateModelsInline(builder.schemas));
	const tagEntries = Object.entries(target).toSorted(([a], [b]) => a.localeCompare(b));
	const mockIndexEntries = [];
	const allGeneratedPaths = (await Promise.all(tagEntries.map(async ([tag, { helpers, operations }]) => {
		try {
			const tagDir = path.join(dirname, tag);
			const helperFilename = `${tag}.helpers${extension}`;
			const helperPath = path.join(tagDir, helperFilename);
			const hasHelpers = helpers.implementation.trim().length > 0;
			const helperImportExtension = getImportExtension(extension, output.tsconfig);
			const helperImportPath = "./" + tag + ".helpers" + helperImportExtension;
			if (hasHelpers) await writeGeneratedFile(helperPath, header + helpers.implementation);
			const operationFilePaths = await Promise.all(operations.map(async (operation) => {
				const operationFilename = kebab(operation.operationName);
				const implementationPath = path.join(tagDir, `${operationFilename}${extension}`);
				const operationSchemasFilename = `${operationFilename}.schemas${output.schemaFileExtension}`;
				const operationSchemasPath = path.join(tagDir, operationSchemasFilename);
				const operationSchemasImportPath = "./" + operationFilename + ".schemas" + getImportExtension(output.schemaFileExtension, output.tsconfig);
				const implementationImports = filterImportsUsedInImplementation(operation.imports, operation.implementation);
				const operationSchemas = resolveTransitiveSchemas(implementationImports.filter((imp) => !imp.importPath).map((imp) => imp.name), builder.schemas);
				const referencedSchemaNames = new Set(operationSchemas.map((s) => s.name));
				const hasOperationSchemas = operationSchemas.length > 0;
				if (hasOperationSchemas) await writeGeneratedFile(operationSchemasPath, header + generateModelsInline(operationSchemas));
				const importsForBuilder = generateImportsForBuilder(output, implementationImports.map((imp) => {
					if (imp.importPath) return imp;
					if (!referencedSchemaNames.has(imp.name)) return imp;
					return {
						...imp,
						importPath: operationSchemasImportPath
					};
				}), schemasPathRelative, schemaTagMap, schemaOutputPlan);
				let data = header;
				if (hasHelpers) data += buildTagHelpersImport(helpers, helperImportPath, operation.implementation);
				data += await generateClientImports({
					builder,
					output,
					implementation: operation.implementation,
					imports: importsForBuilder,
					projectName,
					isAllowSyntheticDefaultImports
				});
				data += generateTargetMutatorImports(operation, operation.implementation, true);
				data += "\n\n";
				data += generateOrvalHelperTypes(operation.implementation);
				data += operation.implementation;
				await writeGeneratedFile(implementationPath, data);
				const extraPaths = [];
				for (const mockOutput of operation.mockOutputsFull) {
					if (!mockOutput.implementation.handlerName) continue;
					const rawEntry = output.mock.generators.find((g) => {
						if (isFunction(g)) return mockOutput.type === OutputMockType.MSW;
						return g.type === mockOutput.type;
					});
					if (!rawEntry) continue;
					const mockExtension = isFunction(rawEntry) ? OutputMockType.MSW : getMockFileExtensionByTypeName(rawEntry);
					const mockDir = getMockDir(rawEntry, output.mock) ?? dirname;
					const kebabOperation = kebab(operation.operationName);
					const mockFilePath = path.join(mockDir, tag, kebabOperation + "." + mockExtension + extension);
					const mockRelativeSchemasPath = schemaCustomImportPath ?? resolveMockSchemasPath(mockFilePath, schemasTarget);
					const finalizeMockOptions = getFinalizeMockImplementationOptions(output, mockOutput);
					const finalizedMockImplementation = builder.finalizeMockImplementation ? builder.finalizeMockImplementation(mockOutput.implementation.function + mockOutput.implementation.handler, finalizeMockOptions) : mockOutput.implementation.function + mockOutput.implementation.handler;
					const recoveredSchemaFactoryImports = !isFunction(rawEntry) && rawEntry.type === OutputMockType.FAKER && rawEntry.schemas === true && output.schemas ? collectRecoveredSchemaFactoryImports(finalizedMockImplementation, builder.schemas.filter((s) => s.schema).map((s) => s.name)) : [];
					const importsMockForBuilder = generateImportsForBuilder(output, filterLocalStrictMockTypeImports(mergeGeneratorImports(mockOutput.imports, recoveredSchemaFactoryImports), finalizeMockOptions.strictSchemaTypeNames), mockRelativeSchemasPath, schemaTagMap, void 0, mockFilePath);
					let mockData = header;
					mockData += builder.importsMock({
						implementation: finalizedMockImplementation,
						imports: importsMockForBuilder,
						projectName,
						hasSchemaDir: !!output.schemas,
						isAllowSyntheticDefaultImports,
						options: isFunction(rawEntry) ? void 0 : rawEntry
					});
					mockData += `\n${finalizedMockImplementation}`;
					await writeGeneratedFile(mockFilePath, mockData);
					extraPaths.push(mockFilePath);
					let indexEntry = mockIndexEntries.find((e) => e.ext === mockExtension && e.mockDir === mockDir);
					if (!indexEntry) {
						indexEntry = {
							ext: mockExtension,
							mockDir,
							operations: []
						};
						mockIndexEntries.push(indexEntry);
					}
					if (!indexEntry.operations.some((o) => o.tag === tag && o.opName === kebabOperation)) indexEntry.operations.push({
						tag,
						opName: kebabOperation,
						handlerName: mockOutput.implementation.handlerName
					});
				}
				return {
					operationFilename,
					hasOperationSchemas,
					operationSchemasFilename,
					paths: [
						implementationPath,
						...hasOperationSchemas ? [operationSchemasPath] : [],
						...extraPaths
					]
				};
			}));
			const indexPaths = [];
			if (output.indexFiles) {
				const importExtension = getImportExtension(extension, output.tsconfig);
				const barrelContent = operationFilePaths.map(({ operationFilename }) => `export * from './${operationFilename}${importExtension}';\n`).join("");
				const indexPath = path.join(tagDir, `index${extension}`);
				await writeGeneratedFile(indexPath, barrelContent);
				indexPaths.push(indexPath);
			}
			return [
				...hasHelpers ? [helperPath] : [],
				...operationFilePaths.flatMap(({ paths }) => paths),
				...indexPaths
			];
		} catch (error) {
			throw new Error(`Oups... 🍻. An Error occurred while writing tag ${tag} => ${String(error)}`, { cause: error });
		}
	}))).flat();
	const mockIndexPaths = [];
	if (output.mock.indexMockFiles) {
		const mockImportExtension = getImportExtension(extension, output.tsconfig);
		for (const { ext, mockDir, operations } of mockIndexEntries) {
			const indexPath = path.join(mockDir, `index.${ext}${extension}`);
			await writeGeneratedFile(indexPath, operations.toSorted((a, b) => a.tag.localeCompare(b.tag) || a.opName.localeCompare(b.opName)).map(({ tag, opName, handlerName }) => {
				const localMockPath = joinSafe("./", tag, opName + "." + ext + mockImportExtension);
				const alias = `${pascal(tag)}${pascal(opName)}MockHandler`;
				return ext === OutputMockType.MSW ? `export { ${handlerName} as ${alias} } from '${localMockPath}'\n` : `export * from '${localMockPath}'\n`;
			}).join(""));
			mockIndexPaths.push(indexPath);
		}
	}
	let rootIndexPath;
	if (output.indexFiles) {
		const importExtension = getImportExtension(extension, output.tsconfig);
		const rootBarrelContent = tagEntries.map(([tag]) => `export * from './${tag}/index${importExtension}';\n`).join("");
		rootIndexPath = path.join(dirname, `index${extension}`);
		await writeGeneratedFile(rootIndexPath, rootBarrelContent);
	}
	return [
		...globalSchemasPath ? [globalSchemasPath] : [],
		...rootIndexPath ? [rootIndexPath] : [],
		...allGeneratedPaths,
		...mockIndexPaths
	];
}
//#endregion
export { BODY_TYPE_NAME, DefaultTag, EnumGeneration, ErrorWithTag, FormDataArrayHandling, GetterPropType, HTTP_STATUS_CODE_SHARED_TYPES, LOG_LEVELS, NAMED_COMPONENT_SECTIONS, NamingConvention, OutputClient, OutputHttpClient, OutputMockType, OutputMode, PropertySortOrder, RefComponentSuffix, SHARED_DIR, SOURCE_FILE_EXTENSIONS, SchemaType, SupportedFormatter, TEMPLATE_TAG_REGEX, VERBS_WITH_BODY, Verbs, addDependency, assertClientSupportsTagsOperations, assertSafeNumericConstraint, assertSafeResponseStatusKey, asyncReduce, bindReporter, buildAngularParamsFilterExpression, buildBarrelReExports, buildDateTransformStatements, buildDynamicScope, buildInlineDynamicScope, buildRequestDateSerializeStatements, buildSchemaTagMap, buildTagHelpersImport, camel, camelPathParamName, collectPropertiesThroughAllOf, collectReferencedComponents, collectRequiredThroughAllOf, combineSchemas, compareNatural, compareVersions, consoleReporter, conventionName, createLogger, createSchemaOutputPlan, createSchemaOutputPlanForOutput, createSuccessMessage, createTypeAliasIfNeeded, dedupeSchemaImports, dedupeUnionType, dynamicAnchorToParamName, dynamicAnchorsToUniqueParamNames, dynamicImport, emitRequestBodyValidation, emitResponseValidation, escape, escapePath, escapeRegExp, escapeRouteForSingleQuotes, extractBoundAliasInfo, filterByContentType, filterPathsBySchemas, filteredVerbs, fixCrossDirectoryImports, fixRegularSchemaImports, generalJSTypes, generalJSTypesWithArray, generateAxiosOptions, generateAxiosUrl, generateBodyMutatorConfig, generateBodyOptions, generateComponentDefinition, generateDependencyImports, generateFactory, generateFormDataAndUrlEncodedFunction, generateImports, generateModelInline, generateModelsInline, generateMutator, generateMutatorConfig, generateMutatorImports, generateMutatorRequestOptions, generateOptions, generateParameterDefinition, generateQueryParamsAxiosConfig, generateRequestDateSerializer, generateResponseDateDeserializer, generateSchemasDefinition, generateTarget, generateTargetForTags, generateTargetForTagsOperations, generateVerbImports, generateVerbOptions, generateVerbsOptions, getAmbiguousBarrelExports, getAngularFilteredParamsCallExpression, getAngularFilteredParamsExpression, getAngularFilteredParamsHelperBody, getAngularObjectParamStrategies, getArray, getArrayResponseSchema, getAtPath, getBaseUrlRuntimeImports, getBodiesByContentType, getBody, getCombinedEnumValue, getComponentBaseName, getComponentBaseNames, getConfiguredMockDirectories, getDefaultContentType, getDynamicAnchorIndex, getDynamicAnchorName, getEnum, getEnumImplementation, getEnumMembers, getEnumUnion, getEnumValueInfo, getExtension, getFakerEntry, getFileInfo, getFormDataComponentContexts, getFormDataFieldFileType, getFullRoute, getImportExtension, getIsBodyVerb, getKey, getMockDir, getMockFileExtensionByTypeName, getNumberWord, getObject, getOperationId, getOperationTagKey, getOperationUrlHelperNames, getOrvalGeneratedTypes, getParameters, getParams, getParamsInPath, getPropertyAccessor, getPropertyNameCollisionKeys, getPropertySafe, getProps, getQueryParams, getRefInfo, getRequiredKeys, getResReqTypes, getResponse, getResponseStatusCondition, getRoute, getRouteAsArray, getScalar, getSchemaOutputTypeRef, getSchemaValueRef, getSchemasImportPath, getStatusCodeType, getStringLiteralType, getStringLiteralTypeUnion, getSuccessResponseType, getTagKey, getTypedResponse, getUniqueName, getUnknownMutationInvalidatesWarnings, getWarningCount, getZodNamespaceImport, getZodNamespaceImportSource, groupBy, hasEnumMetadata, hasNarrowedPropertyNames, hasSchemaImport, isBinaryContentType, isBinaryScalarSchema, isBindingIdentifier, isBoolean, isComponentRef, isDirectory, isDynamicReference, isEffectivelyObjectSchema, isEnumReferenceMissingNull, isFunction, isInlineSchema, isLogLevelEnabled, isModule, isMswMock, isNullOnlyEnum, isNullish, isNumber, isNumeric, isObject, isOperationInTagBucket, isPrimitiveResponseSchema, isPrimitiveResponseType, isSchema, isSchemaNullable, isString, isStringLikeSchema, isSyntheticDefaultImportsAllow, isUrl, isVerb, jsDoc, jsStringEscape, jsStringLiteralEscape, kebab, keyValuePairsToJsDoc, logger, makeRouteSafe, mapTemplateExpressions, mergeDeep, needsHttpStatusCodeTypes, noopReporter, normalizeAngularRuntimeValidation, normalizeRuntimeValidation, omitBy, operationZodOverrideKeys, parseRoutePath, parseTemplateLiteral, pascal, pathWithoutExtension, pick, removeFilesAndEmptyFolders, resetWarnings, resolveDiscriminators, resolveDynamicRef, resolveExampleRefs, resolveInstalledVersion, resolveInstalledVersions, resolveLogLevel, resolveMockSchemasPath, resolveObject, resolveRef, resolveSchemaImportDependencies, resolveServerUrl, resolveTransitiveSchemas, resolveValue, rewriteImportsForResponseValidation, safeNumericConstraint, sanitize, sanitizePathParamName, setLogLevel, setProjectName, snake, sortByPriority, splitSchemasByType, startMessage, stringify, stringifyTemplateLiteral, stripFileExtension, toColonRoutePath, toJsLiteral, toObjectSchema, toObjectString, unique, uniqueBy, uniqueWith, path_exports as upath, warnAmbiguousBarrelExports, withGeneratedFileTransform, withReporter, wrapRouteParameters, writeGeneratedFile, writeRoutedSchemas, writeSchema, writeSchemas, writeSchemasTagsSplit, writeSingleMode, writeSplitMode, writeSplitTagsMode, writeTagsMode, writeTagsOperationsMode, writeTagsOperationsSplitMode };

//# sourceMappingURL=index.mjs.map