import { assertSafeNumericConstraint, camel, compareVersions, createLogger, getEnumMembers, getFormDataFieldFileType, getNumberWord, isBoolean, isNumber, isObject, isSchemaNullable, isString, jsStringEscape, jsStringLiteralEscape, pascal, resolveRef, safeNumericConstraint, stringify, toJsLiteral, toObjectSchema, unique } from "@orval/core";
//#region src/compatible-v4.ts
const getEffectPackageVersion = (packageJson) => {
	return packageJson.resolvedVersions?.effect ?? packageJson.dependencies?.effect ?? packageJson.devDependencies?.effect ?? packageJson.peerDependencies?.effect;
};
const isEffectVersionV4 = (packageJson) => {
	const version = getEffectPackageVersion(packageJson);
	if (!version) return false;
	const withoutPrerelease = version.split("-")[0];
	return compareVersions(withoutPrerelease, "4.0.0");
};
/**
* Resolves whether to emit Effect 4 Schema output.
*
* An explicit `override.effect.version` of `3` or `4` always wins; `'auto'`
* (the default) infers from the output project's resolved `effect` version via
* {@link isEffectVersionV4}, and falls back to Effect 4, the current major,
* when no `effect` version can be detected.
*/
const resolveIsEffectV4 = (version, packageJson) => {
	if (version === 4) return true;
	if (version === 3) return false;
	if (!packageJson || !getEffectPackageVersion(packageJson)) return true;
	try {
		return isEffectVersionV4(packageJson);
	} catch {
		return true;
	}
};
//#endregion
//#region src/logger.ts
const logger = createLogger("@orval/effect");
//#endregion
//#region src/index.ts
const effectImport = (name, alias) => ({
	default: false,
	name,
	syntheticDefaultImport: false,
	namespaceImport: false,
	values: true,
	...alias ? { alias } : {}
});
const EFFECT_DEPENDENCIES = [{
	exports: [effectImport("Schema", "S")],
	dependency: "effect"
}];
const EFFECT_WITH_EFFECT_DEPENDENCIES = [{
	exports: [effectImport("Schema", "S"), effectImport("Effect")],
	dependency: "effect"
}];
const getEffectDependencies = (_hasGlobalMutator, _hasParamsSerializerOptions, _packageJson, _httpClient, _hasTagsMutator, _override, implementation) => implementation?.includes("Effect.succeed(") ? EFFECT_WITH_EFFECT_DEPENDENCIES : EFFECT_DEPENDENCIES;
const possibleSchemaTypes = /* @__PURE__ */ new Set([
	"integer",
	"number",
	"string",
	"boolean",
	"object",
	"null",
	"array"
]);
const resolveEffectType = (schema) => {
	if (typeof schema !== "object") return schema ? "unknown" : "never";
	const schemaTypeValue = schema.type;
	if (Array.isArray(schemaTypeValue)) {
		const nonNullTypes = schemaTypeValue.filter((t) => t !== "null" && possibleSchemaTypes.has(t)).map((t) => t === "integer" ? "number" : t);
		if (nonNullTypes.length > 1) return { multiType: nonNullTypes };
		const type = nonNullTypes[0];
		if (type === "array" && "prefixItems" in schema) return "tuple";
		return type;
	}
	const type = isString(schemaTypeValue) ? schemaTypeValue : void 0;
	if (schema.type === "array" && "prefixItems" in schema) return "tuple";
	switch (type) {
		case "integer": return "number";
		default: return type ?? "unknown";
	}
};
const minAndMaxTypes = /* @__PURE__ */ new Set([
	"number",
	"string",
	"array"
]);
const removeReadOnlyProperties = (schema) => {
	if (typeof schema !== "object") return toObjectSchema(schema);
	if (schema.properties && isObject(schema.properties)) {
		const filteredProperties = {};
		for (const [key, value] of Object.entries(schema.properties)) {
			if (isObject(value) && "readOnly" in value && value.readOnly) continue;
			filteredProperties[key] = value;
		}
		return {
			...schema,
			properties: filteredProperties
		};
	}
	if (schema.items && isObject(schema.items) && "properties" in schema.items) return {
		...schema,
		items: removeReadOnlyProperties(schema.items)
	};
	return schema;
};
const generateEffectValidationSchemaDefinition = (schemaInput, context, name, strict, rules) => {
	if (schemaInput == null || typeof schemaInput !== "object") {
		const functions = schemaInput === true ? [["unknown", void 0]] : schemaInput === false ? [["never", void 0]] : [];
		if (functions.length > 0 && !rules?.required) functions.push(["optional", void 0]);
		return {
			functions,
			consts: []
		};
	}
	const schema = schemaInput;
	const consts = [];
	const constNameRegistry = rules?.constNameRegistry ?? {};
	const constsCounter = isNumber(constNameRegistry[name]) ? constNameRegistry[name] + 1 : 0;
	const constsCounterValue = constsCounter ? pascal(getNumberWord(constsCounter)) : "";
	constNameRegistry[name] = constsCounter;
	const functions = [];
	const type = resolveEffectType(schema);
	const required = rules?.required ?? false;
	const hasDefault = schema.default !== void 0;
	const nullable = Array.isArray(schema.type) && schema.type.includes("null");
	const min = schema.minimum ?? schema.minLength ?? schema.minItems;
	const max = schema.maximum ?? schema.maxLength ?? schema.maxItems;
	const exclusiveMin = "exclusiveMinimum" in schema ? schema.exclusiveMinimum : void 0;
	const exclusiveMax = "exclusiveMaximum" in schema ? schema.exclusiveMaximum : void 0;
	const multipleOf = schema.multipleOf;
	const matches = schema.pattern ?? void 0;
	const hasNonArrayEnum = !!schema.enum && type !== "array";
	let skipSwitchStatement = false;
	if (schema.allOf || schema.oneOf || schema.anyOf) {
		const separator = schema.allOf ? "allOf" : schema.oneOf ? "oneOf" : "anyOf";
		const baseSchemas = (schema.allOf ?? schema.oneOf ?? schema.anyOf).map((schema, index) => generateEffectValidationSchemaDefinition(schema, context, `${camel(name)}${pascal(getNumberWord(index + 1))}`, strict, {
			required: true,
			constNameRegistry
		}));
		if ((schema.allOf || schema.oneOf || schema.anyOf) && schema.properties) {
			const additionalPropertiesSchema = {
				properties: schema.properties,
				required: schema.required,
				additionalProperties: schema.additionalProperties,
				type: schema.type
			};
			const additionalIndex = baseSchemas.length + 1;
			const additionalPropertiesDefinition = generateEffectValidationSchemaDefinition(additionalPropertiesSchema, context, `${camel(name)}${pascal(getNumberWord(additionalIndex))}`, strict, {
				required: true,
				constNameRegistry
			});
			if (schema.oneOf || schema.anyOf) functions.push(["allOf", [{
				functions: [[separator, baseSchemas]],
				consts: []
			}, additionalPropertiesDefinition]]);
			else {
				baseSchemas.push(additionalPropertiesDefinition);
				functions.push([separator, baseSchemas]);
			}
		} else functions.push([separator, baseSchemas]);
		skipSwitchStatement = true;
	}
	let defaultVarName;
	if (schema.default !== void 0) {
		defaultVarName = `${name}Default${constsCounterValue}`;
		let defaultValue;
		if (schema.type === "string" && (schema.format === "date" || schema.format === "date-time") && context.output.override.useDates) defaultValue = `new Date(${JSON.stringify(schema.default)})`;
		else if (isObject(schema.default)) {
			const entries = Object.entries(schema.default).map(([key, value]) => {
				const safeKey = JSON.stringify(key);
				if (isString(value)) return `${safeKey}: ${JSON.stringify(value)} as const`;
				if (Array.isArray(value)) return `${safeKey}: [${value.map((item) => isString(item) ? `${JSON.stringify(item)} as const` : JSON.stringify(item)).join(", ")}]`;
				if (value === null || value === void 0 || isNumber(value) || isBoolean(value)) return `${safeKey}: ${value}`;
			}).filter((entry) => entry !== void 0).join(", ");
			defaultValue = entries.length === 0 ? `{}` : `{ ${entries} }`;
		} else {
			const rawStringified = stringify(schema.default);
			defaultValue = rawStringified === void 0 ? "null" : rawStringified;
			if (Array.isArray(schema.default) && type === "array" && schema.items && typeof schema.items === "object" && "enum" in schema.items && schema.default.length > 0) {
				defaultVarName = defaultValue;
				defaultValue = void 0;
			}
		}
		if (defaultValue) consts.push(`export const ${defaultVarName} = ${defaultValue};`);
	}
	if (isObject(type) && "multiType" in type) {
		const types = type.multiType;
		functions.push(["oneOf", types.map((t) => generateEffectValidationSchemaDefinition({
			...schema,
			type: t
		}, context, name, strict, {
			required: true,
			constNameRegistry
		}))]);
		if (!required && nullable) functions.push(["nullish", void 0]);
		else if (nullable) functions.push(["nullable", void 0]);
		else if (!required) functions.push(["optional", void 0]);
		return {
			functions,
			consts
		};
	}
	if (!skipSwitchStatement) switch (type) {
		case "tuple":
			if (schema.prefixItems) {
				const prefixItems = Array.isArray(schema.prefixItems) ? schema.prefixItems : [];
				if (prefixItems.length > 0) functions.push(["tuple", prefixItems.map((item, idx) => generateEffectValidationSchemaDefinition(dereference(item, context), context, camel(`${name}-${idx}-item`), strict, {
					required: true,
					constNameRegistry
				}))]);
			}
			break;
		case "array":
			functions.push(["array", generateEffectValidationSchemaDefinition(schema.items, context, camel(`${name}-item`), strict, {
				required: true,
				constNameRegistry
			})]);
			break;
		case "string":
			if (schema.enum) break;
			if (context.output.override.useDates && (schema.format === "date" || schema.format === "date-time")) {
				functions.push(["date", void 0]);
				break;
			}
			if (schema.format === "binary") {
				functions.push(["instanceof", "File"]);
				break;
			}
			if (schema.contentMediaType === "application/octet-stream" && !schema.contentEncoding) {
				functions.push(["instanceof", "File"]);
				break;
			}
			if ("const" in schema) functions.push(["literal", JSON.stringify(String(schema.const))]);
			else functions.push([type, void 0]);
			if (schema.format === "date") {
				functions.push(["dateFormat", void 0]);
				break;
			}
			if (schema.format === "date-time") {
				functions.push(["dateTimeFormat", void 0]);
				break;
			}
			if (schema.format === "email") {
				functions.push(["email", void 0]);
				break;
			}
			if (schema.format === "uri") {
				functions.push(["url", void 0]);
				break;
			}
			if (schema.format === "uuid") {
				functions.push(["uuid", void 0]);
				break;
			}
			break;
		default: {
			const hasProperties = !!schema.properties;
			const properties = schema.properties ?? {};
			const hasDefinedProperties = Object.keys(properties).length > 0;
			const hasAdditionalPropertiesSchema = !!schema.additionalProperties && !isBoolean(schema.additionalProperties);
			const shouldUseLooseObject = type === "object" && !hasDefinedProperties && schema.additionalProperties === void 0 && !hasAdditionalPropertiesSchema;
			if (hasProperties && hasDefinedProperties) {
				functions.push([strict ? "strictObject" : "object", Object.keys(properties).map((key) => ({ [key]: rules?.propertyOverrides?.[key] ?? generateEffectValidationSchemaDefinition(properties[key], context, camel(`${name}-${key}`), strict, {
					required: schema.required?.includes(key),
					constNameRegistry
				}) })).reduce((acc, curr) => ({
					...acc,
					...curr
				}), {})]);
				break;
			}
			if (shouldUseLooseObject) {
				functions.push(["looseObject", {}]);
				break;
			}
			if (schema.additionalProperties) {
				functions.push(["additionalProperties", generateEffectValidationSchemaDefinition(isBoolean(schema.additionalProperties) ? {} : schema.additionalProperties, context, name, strict, {
					required: true,
					constNameRegistry
				})]);
				break;
			}
			if (schema.enum) break;
			functions.push([type, void 0]);
			break;
		}
	}
	const hasFixedValue = hasNonArrayEnum || functions.some(([fn]) => fn === "literal");
	if (!hasFixedValue && isString(type) && minAndMaxTypes.has(type)) {
		const shouldUseExclusiveMin = exclusiveMin !== void 0;
		const shouldUseExclusiveMax = exclusiveMax !== void 0;
		if (shouldUseExclusiveMin && exclusiveMin !== void 0) {
			const safeExclusiveMin = assertSafeNumericConstraint(exclusiveMin, "exclusiveMinimum");
			consts.push(`export const ${name}ExclusiveMin${constsCounterValue} = ${safeExclusiveMin};`);
			functions.push(["gt", `${name}ExclusiveMin${constsCounterValue}`]);
		} else if (min !== void 0) {
			const safeMin = assertSafeNumericConstraint(min, "minimum");
			if (safeMin === 1) functions.push(["min", `${safeMin}`]);
			else {
				consts.push(`export const ${name}Min${constsCounterValue} = ${safeMin};`);
				functions.push(["min", `${name}Min${constsCounterValue}`]);
			}
		}
		if (shouldUseExclusiveMax && exclusiveMax !== void 0) {
			const safeExclusiveMax = assertSafeNumericConstraint(exclusiveMax, "exclusiveMaximum");
			consts.push(`export const ${name}ExclusiveMax${constsCounterValue} = ${safeExclusiveMax};`);
			functions.push(["lt", `${name}ExclusiveMax${constsCounterValue}`]);
		} else if (max !== void 0) {
			const safeMax = assertSafeNumericConstraint(max, "maximum");
			consts.push(`export const ${name}Max${constsCounterValue} = ${safeMax};`);
			functions.push(["max", `${name}Max${constsCounterValue}`]);
		}
		if (multipleOf !== void 0) {
			const safeMultipleOf = assertSafeNumericConstraint(multipleOf, "multipleOf");
			consts.push(`export const ${name}MultipleOf${constsCounterValue} = ${safeMultipleOf.toString()};`);
			functions.push(["multipleOf", `${name}MultipleOf${constsCounterValue}`]);
		}
		if (exclusiveMin !== void 0 || min !== void 0 || exclusiveMax !== void 0 || multipleOf !== void 0 || max !== void 0) consts.push(`\n`);
	}
	if (matches && !hasFixedValue && type === "string") {
		const isStartWithSlash = matches.startsWith("/");
		const isEndWithSlash = matches.endsWith("/");
		const regexp = `new RegExp('${jsStringLiteralEscape(matches.slice(isStartWithSlash ? 1 : 0, isEndWithSlash ? -1 : void 0))}')`;
		consts.push(`export const ${name}RegExp${constsCounterValue} = ${regexp};\n`);
		functions.push(["regex", `${name}RegExp${constsCounterValue}`]);
	}
	if (schema.enum && type !== "array") {
		const uniqueEnumValues = getEnumMembers(schema).map((member) => member.value);
		if (uniqueEnumValues.every((value) => isString(value))) functions.push(["enum", `[${uniqueEnumValues.map((value) => `'${jsStringLiteralEscape(value)}'`).join(", ")}]`]);
		else functions.push(["oneOf", uniqueEnumValues.map((value) => ({
			functions: [["literal", value === null ? null : toJsLiteral(value)]],
			consts: []
		}))]);
	}
	if (!required && nullable) functions.push(["nullish", void 0]);
	else if (nullable) functions.push(["nullable", void 0]);
	else if (!required && !hasDefault) functions.push(["optional", void 0]);
	if (hasDefault) functions.push(["default", defaultVarName]);
	if (schema.description) functions.push(["describe", `'${jsStringEscape(schema.description)}'`]);
	return {
		functions,
		consts: unique(consts)
	};
};
/**
* Categorize a function name so the parser can decide how to render it
* (constructor base, pipe filter, or schema wrapper).
*/
const CONSTRUCTORS = /* @__PURE__ */ new Set([
	"never",
	"string",
	"number",
	"integer",
	"boolean",
	"null",
	"unknown",
	"any",
	"array",
	"tuple",
	"object",
	"strictObject",
	"looseObject",
	"additionalProperties",
	"literal",
	"enum",
	"oneOf",
	"anyOf",
	"allOf",
	"instanceof",
	"fileOrString",
	"date"
]);
const FILTERS = /* @__PURE__ */ new Set([
	"min",
	"max",
	"gt",
	"lt",
	"multipleOf",
	"regex",
	"email",
	"uuid",
	"url",
	"dateFormat",
	"dateTimeFormat"
]);
/**
* Renders a single filter for a `.pipe(...)` (Effect 3) or `.check(...)`
* (Effect 4) group, choosing the right Effect Schema function based on the
* base type (string/number/array).
*/
const renderFilter = (fn, arg, baseType, isEffectV4) => {
	const filter = (v3Name, v4Name, filterArg = arg) => `S.${isEffectV4 ? v4Name : v3Name}(${filterArg})`;
	switch (fn) {
		case "min":
			if (baseType === "string") return filter("minLength", "isMinLength");
			if (baseType === "array") return filter("minItems", "isMinLength");
			return filter("greaterThanOrEqualTo", "isGreaterThanOrEqualTo");
		case "max":
			if (baseType === "string") return filter("maxLength", "isMaxLength");
			if (baseType === "array") return filter("maxItems", "isMaxLength");
			return filter("lessThanOrEqualTo", "isLessThanOrEqualTo");
		case "gt": return filter("greaterThan", "isGreaterThan");
		case "lt": return filter("lessThan", "isLessThan");
		case "multipleOf": return filter("multipleOf", "isMultipleOf");
		case "regex": return filter("pattern", "isPattern");
		case "email": return filter("pattern", "isPattern", String.raw`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`);
		case "uuid": return filter("pattern", "isPattern", "/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/");
		case "url": return filter("pattern", "isPattern", String.raw`/^https?:\/\/.+/`);
		case "dateFormat": return filter("pattern", "isPattern", String.raw`/^\d{4}-\d{2}-\d{2}$/`);
		case "dateTimeFormat": return filter("pattern", "isPattern", String.raw`/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/`);
		default: return "";
	}
};
const determineBaseType = (functions) => {
	for (const [fn] of functions) {
		if (fn === "string") return "string";
		if (fn === "number" || fn === "integer") return "number";
		if (fn === "array") return "array";
	}
	return "unknown";
};
/**
* Parse the intermediate definition into Effect Schema source code.
*/
const parseEffectValidationSchemaDefinition = (input, context, strict, brandName, exactOptional = false, isEffectV4 = false) => {
	if (input.functions.length === 0) return {
		effect: "",
		consts: ""
	};
	let consts = "";
	const appendConstsChunk = (chunk) => {
		if (!chunk) return;
		if (consts.length > 0 && !consts.endsWith("\n") && !chunk.startsWith("\n")) consts += "\n";
		consts += chunk;
	};
	const renderSchema = (definition, isStructProperty) => {
		const { functions } = definition;
		if (functions.length === 0) return "S.Unknown";
		appendConstsChunk(definition.consts.join("\n"));
		const baseType = determineBaseType(functions);
		let base = "";
		const filters = [];
		const wrappers = [];
		for (const [fn, arg] of functions) {
			if (CONSTRUCTORS.has(fn) && !base) {
				base = renderConstructor(fn, arg);
				continue;
			}
			if (FILTERS.has(fn)) {
				filters.push(renderFilter(fn, formatArg(arg), baseType, isEffectV4));
				continue;
			}
			if (fn === "nullable" || fn === "nullish" || fn === "optional" || fn === "default" || fn === "describe") {
				wrappers.push([fn, arg]);
				continue;
			}
		}
		if (!base) base = "S.Unknown";
		let out = filters.length > 0 ? `${base}.${isEffectV4 ? "check" : "pipe"}(${filters.join(", ")})` : base;
		let hasDefault = false;
		let defaultValue;
		let isOptional = false;
		let isNullable = false;
		let isNullish = false;
		let description;
		for (const [fn, arg] of wrappers) switch (fn) {
			case "default":
				hasDefault = true;
				defaultValue = arg;
				break;
			case "optional":
				isOptional = true;
				break;
			case "nullable":
				isNullable = true;
				break;
			case "nullish":
				isNullish = true;
				break;
			case "describe": description = arg;
		}
		if (isNullable || isNullish) out = `S.NullOr(${out})`;
		if (isStructProperty) {
			if (hasDefault) out = isEffectV4 ? `${out}.pipe(S.withDecodingDefaultType(Effect.succeed(${defaultValue})))` : `S.optionalWith(${out}, { default: () => ${defaultValue} })`;
			else if (isOptional || isNullish) {
				if (exactOptional && isOptional) out = isEffectV4 ? `S.optionalKey(${out})` : `S.optionalWith(${out}, { exact: true })`;
				else out = `S.optional(${out})`;
			}
		} else if (isNullish) out = `S.UndefinedOr(${out})`;
		else if (isOptional) out = `S.UndefinedOr(${out})`;
		if (description !== void 0) out = `${out}.${isEffectV4 ? "annotate" : "annotations"}({ description: ${description} })`;
		return out;
	};
	const formatArg = (value) => {
		if (value === void 0) return "";
		if (value === null) return "null";
		if (isString(value)) return value;
		if (Array.isArray(value)) return value.map((item) => formatArg(item)).join(", ");
		if (isObject(value)) return stringify(value) ?? "";
		if (isNumber(value) || isBoolean(value)) return `${value}`;
		return "";
	};
	const structVariants = (definition) => {
		const functions = definition.functions.filter(([fn]) => fn !== "describe" && fn !== "default" && fn !== "nullable" && fn !== "nullish");
		const [fn, arg] = functions[0] ?? [];
		if (functions.length === 1 && (fn === "oneOf" || fn === "anyOf" || fn === "allOf")) {
			appendConstsChunk(definition.consts.join("\n"));
			const members = arg;
			return fn === "allOf" ? allOfVariants(members) : members.filter((member) => member.functions[0]?.[0] !== "null").flatMap((member) => structVariants(member));
		}
		if (functions.length === 1 && (fn === "looseObject" || fn === "additionalProperties" && arg.functions.every(([value]) => value === "unknown"))) return [{ open: true }];
		const rendered = renderSchema({
			...definition,
			functions
		}, false);
		if (functions.length !== 1 || fn !== "object" && fn !== "strictObject") throw new Error(`Effect 4 output merges allOf members as structs, and this member is not one: ${rendered}`);
		return [{
			struct: rendered,
			open: false
		}];
	};
	const allOfVariants = (members) => members.map((member) => structVariants(member)).reduce((targets, sources) => targets.flatMap((target) => sources.map((source) => ({
		struct: target.struct && source.struct ? `${target.struct}.pipe(S.fieldsAssign(${source.struct}.fields))` : target.struct ?? source.struct,
		open: target.open || source.open
	}))));
	const admitsNull = (definition) => definition.functions.some(([fn, arg]) => fn === "null" || fn === "nullable" || fn === "nullish" || (fn === "oneOf" || fn === "anyOf") && arg.some(admitsNull) || fn === "allOf" && arg.every(admitsNull));
	const renderConstructor = (fn, arg) => {
		switch (fn) {
			case "never": return "S.Never";
			case "string": return "S.String";
			case "number":
			case "integer": return "S.Number";
			case "boolean": return "S.Boolean";
			case "null": return "S.Null";
			case "unknown": return "S.Unknown";
			case "any": return "S.Any";
			case "date": return "S.DateFromString";
			case "literal":
				if (isEffectV4 && arg === null) return "S.Null";
				return `S.Literal(${arg})`;
			case "enum":
				if (isEffectV4) return `S.Literals(${arg})`;
				return `S.Literal(${arg.replaceAll(/^\[|\]$/g, "")})`;
			case "instanceof": return `S.instanceOf(${arg})`;
			case "fileOrString": return isEffectV4 ? "S.Union([S.instanceOf(File), S.String])" : "S.Union(S.instanceOf(File), S.String)";
			case "array": {
				const inner = renderSchema(arg, false);
				if (inner === "S.Never") return isEffectV4 ? "S.Tuple([])" : "S.Tuple()";
				return `S.Array(${inner})`;
			}
			case "tuple": {
				const items = arg.map((d) => renderSchema(d, false)).join(", ");
				return isEffectV4 ? `S.Tuple([${items}])` : `S.Tuple(${items})`;
			}
			case "object":
			case "strictObject":
			case "looseObject": {
				const struct = `S.Struct({\n${Object.entries(arg).map(([key, def]) => {
					const value = renderSchema(def, true);
					return `  ${JSON.stringify(key)}: ${value}`;
				}).join(",\n")}\n})`;
				if (fn === "looseObject") return isEffectV4 ? `S.StructWithRest(${struct}, [S.Record(S.String, S.Unknown)])` : `S.extend(${struct}, S.Record({ key: S.String, value: S.Unknown }))`;
				return struct;
			}
			case "additionalProperties": {
				const inner = renderSchema(arg, false);
				return isEffectV4 ? `S.Record(S.String, ${inner})` : `S.Record({ key: S.String, value: ${inner} })`;
			}
			case "oneOf":
			case "anyOf": {
				const args = arg;
				if (args.length === 1) return renderSchema(args[0], false);
				const items = args.map((d) => renderSchema(d, false)).join(", ");
				return isEffectV4 ? `S.Union([${items}])` : `S.Union(${items})`;
			}
			case "allOf": {
				const args = arg;
				if (args.length === 1) return renderSchema(args[0], false);
				if (!isEffectV4) return args.map((d) => renderSchema(d, false)).reduce((acc, cur) => `S.extend(${acc}, ${cur})`);
				const variants = allOfVariants(args).map(({ struct = "S.Struct({})", open }) => open ? `S.StructWithRest(${struct}, [S.Record(S.String, S.Unknown)])` : struct);
				const merged = variants.length === 1 ? variants[0] : `S.Union([${variants.join(", ")}])`;
				return args.every(admitsNull) ? `S.NullOr(${merged})` : merged;
			}
			default: return "S.Unknown";
		}
	};
	appendConstsChunk(input.consts.join("\n"));
	let effect = renderSchema(input, false);
	if (brandName) effect = `${effect}.pipe(S.brand("${brandName}"))`;
	if (consts.includes(",export")) consts = consts.replaceAll(",export", "\nexport");
	return {
		effect,
		consts
	};
};
const dereferenceScalar = (value, context) => {
	if (isObject(value)) return dereference(value, context);
	else if (Array.isArray(value)) return value.map((item) => dereferenceScalar(item, context));
	else return value;
};
function tryResolveRefSchema($ref, context) {
	try {
		return resolveRef({ $ref }, context).schema;
	} catch (error) {
		logger.verbose(`Failed to resolve $ref "${$ref}": ${error instanceof Error ? error.message : String(error)}`);
		return;
	}
}
const dereference = (schema, context) => {
	if (typeof schema !== "object") return toObjectSchema(schema);
	const refName = typeof schema.$ref === "string" ? schema.$ref : void 0;
	if (refName && context.parents?.includes(refName)) return {};
	const childContext = {
		...context,
		...refName ? { parents: [...context.parents ?? [], refName] } : void 0
	};
	const resolvedSchema = typeof schema.$ref === "string" ? (() => {
		const referencedSchema = tryResolveRefSchema(schema.$ref, context);
		if (!referencedSchema) return;
		if (typeof referencedSchema !== "object") return toObjectSchema(referencedSchema);
		const siblingProperties = Object.fromEntries(Object.entries(schema).filter(([key]) => key !== "$ref"));
		return {
			...referencedSchema,
			...siblingProperties
		};
	})() : schema;
	if (!resolvedSchema || typeof resolvedSchema !== "object") return typeof resolvedSchema === "boolean" ? toObjectSchema(resolvedSchema) : {};
	const resolvedContext = childContext;
	return Object.entries(resolvedSchema).reduce((acc, [key, value]) => {
		if (key === "properties" && isObject(value)) acc[key] = Object.entries(value).reduce((props, [propKey, propSchema]) => {
			props[propKey] = dereference(propSchema, resolvedContext);
			return props;
		}, {});
		else if (key === "default" || key === "example" || key === "examples") acc[key] = value;
		else acc[key] = dereferenceScalar(value, resolvedContext);
		return acc;
	}, {});
};
const generateFormDataEffectSchema = (schema, context, name, strict, encoding) => {
	if (typeof schema !== "object") return generateEffectValidationSchemaDefinition(schema, context, name, strict, { required: true });
	const propertyOverrides = {};
	if (schema.properties) for (const key of Object.keys(schema.properties)) {
		const propSchema = schema.properties[key];
		const resolvedPropSchema = propSchema ? dereference(propSchema, context) : void 0;
		const fileType = resolvedPropSchema ? getFormDataFieldFileType(resolvedPropSchema, encoding?.[key]?.contentType) : void 0;
		if (fileType) {
			const isRequired = schema.required?.includes(key);
			const isNullable = !!resolvedPropSchema && isSchemaNullable(resolvedPropSchema);
			const fileFunctions = [fileType === "binary" ? ["instanceof", "File"] : ["fileOrString", void 0]];
			if (!isRequired && isNullable) fileFunctions.push(["nullish", void 0]);
			else if (isNullable) fileFunctions.push(["nullable", void 0]);
			else if (!isRequired) fileFunctions.push(["optional", void 0]);
			propertyOverrides[key] = {
				functions: fileFunctions,
				consts: []
			};
		}
	}
	return generateEffectValidationSchemaDefinition(schema, context, name, strict, {
		required: true,
		propertyOverrides: Object.keys(propertyOverrides).length > 0 ? propertyOverrides : void 0
	});
};
const parseBodyAndResponse = ({ data, context, name, strict, generate, parseType }) => {
	if (!data || !generate) return {
		input: {
			functions: [],
			consts: []
		},
		isArray: false
	};
	const resolvedRef = resolveRef(data, context).schema;
	const jsonMedia = resolvedRef.content?.["application/json"];
	const formDataMedia = resolvedRef.content?.["multipart/form-data"];
	const [contentType, mediaType] = jsonMedia ? ["application/json", jsonMedia] : formDataMedia ? ["multipart/form-data", formDataMedia] : [void 0, void 0];
	const schema = mediaType?.schema;
	if (!schema) return {
		input: {
			functions: [],
			consts: []
		},
		isArray: false
	};
	const encoding = mediaType.encoding;
	const resolvedJsonSchema = dereference(schema, context);
	if (resolvedJsonSchema.items) {
		const rawMin = resolvedJsonSchema.minimum ?? resolvedJsonSchema.minLength ?? resolvedJsonSchema.minItems;
		const rawMax = resolvedJsonSchema.maximum ?? resolvedJsonSchema.maxLength ?? resolvedJsonSchema.maxItems;
		const min = safeNumericConstraint(rawMin, "minimum/minLength/minItems");
		const max = safeNumericConstraint(rawMax, "maximum/maxLength/maxItems");
		return {
			input: generateEffectValidationSchemaDefinition(parseType === "body" ? removeReadOnlyProperties(resolvedJsonSchema.items) : resolvedJsonSchema.items, context, name, strict, { required: true }),
			isArray: true,
			rules: {
				...min === void 0 ? {} : { min },
				...max === void 0 ? {} : { max }
			}
		};
	}
	const effectiveSchema = parseType === "body" ? removeReadOnlyProperties(resolvedJsonSchema) : resolvedJsonSchema;
	return {
		input: contentType === "multipart/form-data" ? generateFormDataEffectSchema(effectiveSchema, context, name, strict, encoding) : generateEffectValidationSchemaDefinition(effectiveSchema, context, name, strict, { required: true }),
		isArray: false
	};
};
const getSingleResponse = (responses) => {
	if (!responses) return;
	return responses["200"] ?? responses["2XX"] ?? responses["2xx"];
};
const parseParameters = ({ data, context, operationName, strict, generate }) => {
	if (!data) return {
		headers: {
			functions: [],
			consts: []
		},
		queryParams: {
			functions: [],
			consts: []
		},
		params: {
			functions: [],
			consts: []
		}
	};
	const defs = data.reduce((acc, val) => {
		const { schema: parameter } = resolveRef(val, context);
		if (!("schema" in parameter) || !parameter.in || !parameter.name) return acc;
		const parameterSchema = typeof parameter.schema === "boolean" ? toObjectSchema(parameter.schema) : parameter.schema;
		const resolvedSchema = dereference(parameterSchema, context);
		resolvedSchema.description = parameter.description;
		const mapStrict = {
			path: strict.param,
			query: strict.query,
			header: strict.header
		};
		const mapGenerate = {
			path: generate.param,
			query: generate.query,
			header: generate.header
		};
		if (parameter.in !== "path" && parameter.in !== "query" && parameter.in !== "header") return acc;
		const definition = generateEffectValidationSchemaDefinition(resolvedSchema, context, camel(`${operationName}-${parameter.in}-${parameter.name}`), mapStrict[parameter.in], { required: parameter.required });
		if (parameter.in === "header" && mapGenerate.header) return {
			...acc,
			headers: {
				...acc.headers,
				[parameter.name]: definition
			}
		};
		if (parameter.in === "query" && mapGenerate.query) return {
			...acc,
			queryParams: {
				...acc.queryParams,
				[parameter.name]: definition
			}
		};
		if (parameter.in === "path" && mapGenerate.path) return {
			...acc,
			params: {
				...acc.params,
				[parameter.name]: definition
			}
		};
		return acc;
	}, {
		headers: {},
		queryParams: {},
		params: {}
	});
	const toStruct = (props, isStrict) => {
		if (Object.keys(props).length === 0) return {
			functions: [],
			consts: []
		};
		return {
			functions: [[isStrict ? "strictObject" : "object", props]],
			consts: []
		};
	};
	return {
		headers: toStruct(defs.headers, strict.header),
		queryParams: toStruct(defs.queryParams, strict.query),
		params: toStruct(defs.params, strict.param)
	};
};
const generateEffectRoute = ({ typeName, verb, override }, { pathRoute, context }) => {
	const spec = context.spec.paths?.[pathRoute];
	if (spec == void 0) throw new Error(`No such path ${pathRoute} in ${context.projectName}`);
	const operation = verb === "query" ? void 0 : spec[verb];
	const parameters = [...spec.parameters ?? [], ...operation?.parameters ?? []];
	const effectOptions = override.effect;
	const parsedParameters = parseParameters({
		data: parameters,
		context,
		operationName: typeName,
		strict: effectOptions.strict,
		generate: effectOptions.generate
	});
	const requestBody = operation?.requestBody;
	const parsedBody = parseBodyAndResponse({
		data: requestBody,
		context,
		name: camel(`${typeName}-body`),
		strict: effectOptions.strict.body,
		generate: effectOptions.generate.body,
		parseType: "body"
	});
	const responses = effectOptions.generateEachHttpStatus ? Object.entries(operation?.responses ?? {}) : [["", getSingleResponse(operation?.responses)]];
	const parsedResponses = responses.map(([code, response]) => parseBodyAndResponse({
		data: response,
		context,
		name: camel(`${typeName}-${code}-response`),
		strict: effectOptions.strict.response,
		generate: effectOptions.generate.response,
		parseType: "response"
	}));
	const pascalTypeName = pascal(typeName);
	const useBrandedTypes = effectOptions.useBrandedTypes;
	const brand = (name) => useBrandedTypes ? name : void 0;
	const isEffectV4 = resolveIsEffectV4(context.output.override.effect.version, context.output.packageJson);
	const arrayRules = (rules) => {
		const checks = [...rules?.min ? [isEffectV4 ? `S.isMinLength(${rules.min})` : `S.minItems(${rules.min})`] : [], ...rules?.max ? [isEffectV4 ? `S.isMaxLength(${rules.max})` : `S.maxItems(${rules.max})`] : []];
		if (checks.length === 0) return "";
		return isEffectV4 ? `.check(${checks.join(", ")})` : checks.map((check) => `.pipe(${check})`).join("");
	};
	const inputParams = parseEffectValidationSchemaDefinition(parsedParameters.params, context, effectOptions.strict.param, brand(`${pascalTypeName}Params`), effectOptions.exactOptional, isEffectV4);
	const inputQueryParams = parseEffectValidationSchemaDefinition(parsedParameters.queryParams, context, effectOptions.strict.query, brand(`${pascalTypeName}QueryParams`), effectOptions.exactOptional, isEffectV4);
	const inputHeaders = parseEffectValidationSchemaDefinition(parsedParameters.headers, context, effectOptions.strict.header, brand(`${pascalTypeName}Header`), effectOptions.exactOptional, isEffectV4);
	const inputBody = parseEffectValidationSchemaDefinition(parsedBody.input, context, effectOptions.strict.body, brand(`${pascalTypeName}Body`), effectOptions.exactOptional, isEffectV4);
	const inputResponses = parsedResponses.map((parsedResponse, idx) => parseEffectValidationSchemaDefinition(parsedResponse.input, context, effectOptions.strict.response, brand(pascal(`${typeName}-${responses[idx][0]}-response`)), effectOptions.exactOptional, isEffectV4));
	if (!inputParams.effect && !inputQueryParams.effect && !inputHeaders.effect && !inputBody.effect && !inputResponses.some((r) => r.effect)) return {
		implementation: "",
		mutators: []
	};
	return {
		implementation: [
			...inputParams.consts ? [inputParams.consts] : [],
			...inputParams.effect ? [`export const ${pascalTypeName}Params = ${inputParams.effect}`] : [],
			...inputQueryParams.consts ? [inputQueryParams.consts] : [],
			...inputQueryParams.effect ? [`export const ${pascalTypeName}QueryParams = ${inputQueryParams.effect}`] : [],
			...inputHeaders.consts ? [inputHeaders.consts] : [],
			...inputHeaders.effect ? [`export const ${pascalTypeName}Header = ${inputHeaders.effect}`] : [],
			...inputBody.consts ? [inputBody.consts] : [],
			...inputBody.effect ? [parsedBody.isArray ? `export const ${pascalTypeName}BodyItem = ${inputBody.effect}
export const ${pascalTypeName}Body = S.Array(${pascalTypeName}BodyItem)${arrayRules(parsedBody.rules)}` : `export const ${pascalTypeName}Body = ${inputBody.effect}`] : [],
			...inputResponses.flatMap((inputResponse, index) => {
				const operationResponse = pascal(`${typeName}-${responses[index][0]}-response`);
				return [...inputResponse.consts ? [inputResponse.consts] : [], ...inputResponse.effect ? [parsedResponses[index].isArray ? `export const ${operationResponse}Item = ${inputResponse.effect}
export const ${operationResponse} = S.Array(${operationResponse}Item)${arrayRules(parsedResponses[index].rules)}` : `export const ${operationResponse} = ${inputResponse.effect}`] : []];
			})
		].join("\n\n"),
		mutators: []
	};
};
const generateEffect = (verbOptions, options) => {
	const { implementation, mutators } = generateEffectRoute(verbOptions, options);
	return {
		implementation: implementation ? `${implementation}\n\n` : "",
		imports: [],
		mutators
	};
};
const effectClientBuilder = {
	client: generateEffect,
	dependencies: getEffectDependencies
};
const builder = () => () => effectClientBuilder;
//#endregion
export { builder, builder as default, dereference, generateEffect, generateEffectValidationSchemaDefinition, generateFormDataEffectSchema, getEffectDependencies, parseEffectValidationSchemaDefinition, parseParameters };

//# sourceMappingURL=index.mjs.map