import { i as namesAFile } from "./options-B6dinSa6.mjs";
import { r as reconcileZodBarrel } from "./barrel-DQrRgq4v.mjs";
import path from "node:path";
import { DefaultTag, buildDynamicScope, compareNatural, conventionName, getImportExtension, getRefInfo, isComponentRef, isInlineSchema, kebab, pascal, resolveRef, resolveValue, upath, writeGeneratedFile } from "@orval/core";
import { assertZodTarget, dereference, generateFormDataZodSchema, generateZodValidationSchemaDefinition, getZodImportSource, parseZodValidationSchemaDefinition, renderZodExport, resolveIsZodV4 } from "@orval/zod";
//#region src/reusable-schemas.ts
/**
* Resolve the export identifier for a `#/components/schemas/X` ref. We reuse
* `@orval/core`'s `getRefInfo(...).name` (`pascal` + sanitize + component
* suffix) so reusable zod schema exports match the operation wrappers and the
* TS model types exactly. `namingConvention` deliberately does NOT influence
* the identifier — it governs file names only, consistent with the rest of
* orval. The same call powers the generator's `namedRef` emission, so the
* definition name and every reference stay in sync.
*/
const resolveSchemaName = (ref, context) => getRefInfo(ref, context).name;
/**
* Resolve names for a set of refs, throwing on conflicts (two distinct refs
* collapsing to the same identifier). The mapping is the single source of
* truth for cross-schema references — the generator, the orchestrator's graph,
* and the sentinel rewriter all consult it.
*/
const resolveSchemaNames = (refs, context) => {
	const resolved = /* @__PURE__ */ new Map();
	const reverse = /* @__PURE__ */ new Map();
	for (const ref of refs) {
		const name = resolveSchemaName(ref, context);
		const previous = reverse.get(name);
		if (previous !== void 0 && previous !== ref) throw new Error(`[orval/zod] generateReusableSchemas: refs ${previous} and ${ref} both resolve to the export name "${name}". Rename one in the OpenAPI source.`);
		resolved.set(ref, name);
		reverse.set(name, ref);
	}
	return resolved;
};
/**
* For each component-schema ref, run the Zod generator + parser with
* `useReusableSchemas: true`. The resulting `zod` strings contain
* `__REF_<name>__` sentinels at every site that references another schema;
* the SCC step (Task 10) decides whether each sentinel becomes a direct
* identifier or a `z.lazy(() => Name)` wrapper.
*/
const generateReusableSchemaSet = (refs, context, options) => {
	const componentSchemas = context.spec.components?.schemas ?? {};
	const nameToRef = /* @__PURE__ */ new Map();
	for (const schemaName of Object.keys(componentSchemas)) {
		const ref = `#/components/schemas/${schemaName}`;
		nameToRef.set(resolveSchemaName(ref, context), ref);
	}
	const queue = [...refs];
	const seen = new Set(refs);
	const entries = [];
	for (const ref of queue) {
		const schemaName = ref.slice(21);
		const schema = componentSchemas[schemaName];
		if (!schema) continue;
		const name = resolveSchemaName(ref, context);
		const scopedContext = {
			...context,
			dynamicScope: buildDynamicScope(schemaName, schema, context)
		};
		const definition = generateZodValidationSchemaDefinition(schema, scopedContext, name, options.strict, options.isZodV4, {
			required: true,
			useReusableSchemas: true,
			emitMeta: options.generateMeta
		});
		const parsed = parseZodValidationSchemaDefinition(definition, scopedContext, options.coerce ?? false, options.strict, options.isZodV4, void 0, options.paramsMutator ? {
			mutator: options.paramsMutator,
			operationId: "",
			location: "schema",
			schemaName: name
		} : void 0, options.variant, options.exactOptional);
		entries.push({
			ref,
			name,
			zod: parsed.zod,
			consts: parsed.consts,
			usedRefs: parsed.usedRefs,
			variant: options.variant
		});
		for (const usedName of parsed.usedRefs) {
			const usedRef = nameToRef.get(usedName);
			if (usedRef !== void 0 && !seen.has(usedRef)) {
				seen.add(usedRef);
				queue.push(usedRef);
			}
		}
	}
	return entries;
};
const edgeKey = (from, to) => `${from}->${to}`;
const tarjan = (graph) => {
	let index = 0;
	const stack = [];
	const onStack = /* @__PURE__ */ new Set();
	const indices = /* @__PURE__ */ new Map();
	const lowlinks = /* @__PURE__ */ new Map();
	const sccs = [];
	const lazyEdges = /* @__PURE__ */ new Set();
	const strongconnect = (v) => {
		indices.set(v, index);
		lowlinks.set(v, index);
		index += 1;
		stack.push(v);
		onStack.add(v);
		const neighbors = graph.get(v) ?? /* @__PURE__ */ new Set();
		for (const w of neighbors) {
			if (v === w) {
				lazyEdges.add(edgeKey(v, w));
				continue;
			}
			if (!indices.has(w)) {
				strongconnect(w);
				lowlinks.set(v, Math.min(lowlinks.get(v) ?? -1, lowlinks.get(w) ?? -1));
			} else if (onStack.has(w)) {
				lazyEdges.add(edgeKey(v, w));
				lowlinks.set(v, Math.min(lowlinks.get(v) ?? -1, indices.get(w) ?? -1));
			}
		}
		if (lowlinks.get(v) === indices.get(v)) {
			const scc = [];
			let w;
			do {
				w = stack.pop();
				if (w === void 0) break;
				onStack.delete(w);
				scc.push(w);
			} while (w !== v);
			sccs.push(scc);
		}
	};
	for (const node of graph.keys()) if (!indices.has(node)) strongconnect(node);
	return {
		sccs,
		lazyEdges
	};
};
const SENTINEL_PATTERN = /__REF_([A-Za-z_$][A-Za-z0-9_$]*)__/g;
/**
* Replace every `__REF_<name>__` sentinel with the bare identifier. Use this
* for schemas that sit at the top of the dependency graph (operation params,
* bodies, responses) — they can never participate in a cycle with the
* component schemas they reference, so every ref is a direct (non-lazy) one.
*/
const rewriteSentinelsToDirect = (zod) => zod.replaceAll(SENTINEL_PATTERN, (_match, refName) => refName);
/**
* Replace every `__REF_<name>__` sentinel with either the bare identifier or
* `zod.lazy(() => <name>)` based on whether the edge closes a cycle, then
* reorder entries so that every non-lazy reference is emitted AFTER its
* target. This avoids TDZ errors at module load.
*
* Entries that sit in a cycle (SCC of size > 1, or a self-loop) are flagged
* `isRecursive`. Their generated `const` reads its own binding inside the
* initializer (through the `zod.lazy` wrapper), which TypeScript rejects with
* TS7022 ("'X' implicitly has type 'any' ... referenced directly or indirectly
* in its own initializer") unless the `const` carries an explicit type
* annotation. The writer (`write-zod-specs`) supplies that annotation —
* `const X: zod.ZodType<X>` — backed by a generated TS type, which both
* silences TS7022 and preserves full `z.infer` typing through the recursion.
*
* Both the lazy classification and the emit order come from a single Tarjan
* run, guaranteeing they agree: a non-lazy edge u→v means v is visited (and
* popped) before u in DFS, so v appears earlier in the SCC array → emitted
* before u → safe.
*/
const rewriteReusableSchemas = (entries) => {
	const graph = new Map(entries.map((e) => [e.name, new Set(e.usedRefs)]));
	for (const e of entries) for (const ref of e.usedRefs) if (!graph.has(ref)) graph.set(ref, /* @__PURE__ */ new Set());
	const { sccs, lazyEdges } = tarjan(graph);
	const recursiveNames = /* @__PURE__ */ new Set();
	for (const scc of sccs) if (scc.length > 1) for (const name of scc) recursiveNames.add(name);
	else if (lazyEdges.has(edgeKey(scc[0], scc[0]))) recursiveNames.add(scc[0]);
	const rewritten = new Map(entries.map((entry) => {
		const newZod = entry.zod.replaceAll(SENTINEL_PATTERN, (_match, refName) => {
			return lazyEdges.has(edgeKey(entry.name, refName)) ? `${entry.variant === "mini" ? "/*#__PURE__*/ " : ""}zod.lazy(() => ${refName})` : refName;
		});
		return [entry.name, {
			...entry,
			zod: newZod,
			isRecursive: recursiveNames.has(entry.name)
		}];
	}));
	const out = [];
	for (const scc of sccs) for (const name of scc) {
		const entry = rewritten.get(name);
		if (entry !== void 0) out.push(entry);
	}
	return out;
};
//#endregion
//#region src/write-zod-specs.ts
const getZodSchemaImportStatement = (variant) => `import * as zod from '${getZodImportSource(variant)}';`;
/**
* Render the `import { ... } from '...'` line for a resolved
* `GeneratorMutator`. Mirrors the format produced by
* `generateMutatorImports` in `@orval/core` but inlined to avoid pulling in
* its full surface area for a single statement.
*/
function buildMutatorImportStatement(mutator) {
	return `import ${mutator.default ? mutator.name : `{ ${mutator.name} }`} from '${mutator.path}';`;
}
const ROOT_DIR = ".";
function getSchemaDir(schemaTagMap, name) {
	return schemaTagMap?.get(name) ?? ROOT_DIR;
}
function computeCrossDirImportPath(schemasPath, fromDir, toDir, fileName, importExt) {
	if (fromDir === toDir) return `./${fileName}${importExt}`;
	const fromPath = fromDir === ROOT_DIR ? schemasPath : path.join(schemasPath, fromDir);
	const toPath = toDir === ROOT_DIR ? schemasPath : path.join(schemasPath, toDir);
	const relDir = upath.relativeSafe(fromPath, toPath);
	return `${upath.joinSafe(relDir, fileName)}${importExt}`;
}
function adjustMutatorPathForDir(mutatorPath, tagDir) {
	if (tagDir === ROOT_DIR) return mutatorPath;
	if (mutatorPath.startsWith("./")) return `../${mutatorPath.slice(2)}`;
	if (mutatorPath.startsWith("../")) return `../${mutatorPath}`;
	return mutatorPath;
}
/**
* Whole-word substring check for a resolved mutator alias inside generated
* code. Plain `String.includes` would false-positive when the user names the
* mutator something like `min` against `.min(1)`.
*/
function bodyReferencesMutator(body, mutator) {
	return new RegExp(String.raw`\b${mutator.name}\b`).test(body);
}
function generateZodSchemaFileContent(header, schemas, zodVariant, includeZodImport = true) {
	const refImports = [...new Set(schemas.flatMap((s) => s.importStatements ?? []))].toSorted();
	const importBlock = [...includeZodImport ? [getZodSchemaImportStatement(zodVariant)] : [], ...refImports].join("\n");
	const schemaContent = schemas.map(({ schemaName, consts, zodExpression }) => {
		return (consts ? `${consts}\n` : "") + renderZodExport({
			name: schemaName,
			expression: zodExpression,
			variant: zodVariant,
			companionTypes: true
		});
	}).join("\n\n");
	return `${header}${importBlock ? `${importBlock}\n\n` : ""}${schemaContent}\n`;
}
function renderReusableSchemaEntry(entry, context, zodVariant) {
	const consts = entry.consts ? `${entry.consts}\n\n` : "";
	if (entry.isRecursive) {
		const rawName = isComponentRef(entry.ref) ? getRefInfo(entry.ref, context).originalName : void 0;
		const schema = rawName ? context.spec.components?.schemas?.[rawName] : void 0;
		const resolved = schema ? resolveValue({
			schema,
			name: entry.name,
			context
		}) : void 0;
		const typeBody = resolved ? resolved.value : "unknown";
		const seenSubModels = /* @__PURE__ */ new Set();
		const subModels = (resolved?.schemas ?? []).filter((s) => {
			if (seenSubModels.has(s.name)) return false;
			seenSubModels.add(s.name);
			return true;
		});
		const subModelBlock = subModels.length ? `${subModels.map((s) => s.model.trimEnd()).join("\n")}\n\n` : "";
		const localNames = new Set(subModels.map((s) => s.name));
		const seen = /* @__PURE__ */ new Set();
		const extraImports = [];
		for (const imp of resolved?.imports ?? []) {
			if (!imp.name || imp.name === entry.name || localNames.has(imp.name)) continue;
			const bindingKey = imp.alias ?? imp.name;
			if (seen.has(bindingKey)) continue;
			seen.add(bindingKey);
			extraImports.push({
				name: imp.name,
				...imp.alias ? { alias: imp.alias } : {}
			});
		}
		return {
			content: consts + subModelBlock + renderZodExport({
				name: entry.name,
				expression: entry.zod,
				variant: zodVariant,
				recursivePin: { tsBody: typeBody }
			}),
			extraImports
		};
	}
	return {
		content: consts + renderZodExport({
			name: entry.name,
			expression: `${entry.zod};`,
			variant: zodVariant,
			companionTypes: true
		}),
		extraImports: []
	};
}
const isValidSchemaIdentifier = (name) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
/**
* Build the sibling-file `import { … } from './…'` block for one reusable
* schema file. Two sources feed in:
*   - `usedRefs` — names from the zod runtime expression. Sourced from the
*     sentinel parser, so always unaliased.
*   - `extraImports` — names the recursive TS body needs that the zod runtime
*     collapsed (`propertyNames` $refs, etc.). May carry `alias`.
* Keyed by export name (`name`) so an aliased `extraImports` entry overrides
* a bare `usedRefs` entry — the recursive TS body uses the local binding, so
* the aliased form has to win for the file to compile. Self-refs and
* non-component identifiers are filtered out.
*
* Exported for unit-test coverage of the alias-propagation path; no
* `resolveValue` producer surfaces aliases here today, so the integration
* tests can't exercise it.
*/
function buildSiblingImports({ usedRefs, extraImports, entryName, componentNames, namingConvention, importExt, schemaTagMap, schemaOutputPlan, currentDir, schemasPath }) {
	const importsByName = /* @__PURE__ */ new Map();
	for (const name of usedRefs) {
		if (name === entryName) continue;
		importsByName.set(name, { name });
	}
	for (const imp of extraImports) {
		if (imp.name === entryName || !componentNames.has(imp.name)) continue;
		importsByName.set(imp.name, imp);
	}
	return [...importsByName.values()].toSorted((a, b) => a.name.localeCompare(b.name)).map(({ name, alias }) => {
		const importedFile = conventionName(name, namingConvention);
		return `import { ${alias ? `${name} as ${alias}` : name} } from '${schemaOutputPlan ? schemaOutputPlan.importPathFor(entryName, name) : schemaTagMap && currentDir && schemasPath ? computeCrossDirImportPath(schemasPath, currentDir, getSchemaDir(schemaTagMap, name), importedFile, importExt) : `./${importedFile}${importExt}`}';`;
	}).join("\n");
}
const isPrimitiveSchemaName = (name) => [
	"string",
	"number",
	"boolean",
	"void",
	"unknown",
	"Blob"
].includes(name);
const dedupeSchemasByName = (schemas) => {
	const uniqueSchemas = /* @__PURE__ */ new Map();
	for (const schema of schemas) if (!uniqueSchemas.has(schema.name)) uniqueSchemas.set(schema.name, schema);
	return [...uniqueSchemas.values()];
};
const groupSchemasByFilePath = (schemas) => {
	const grouped = /* @__PURE__ */ new Map();
	for (const schema of schemas) {
		const key = schema.filePath.toLowerCase();
		const existingGroup = grouped.get(key);
		if (existingGroup) existingGroup.push(schema);
		else grouped.set(key, [schema]);
	}
	return [...grouped.values()].map((group) => [...group].toSorted((a, b) => compareNatural(a.filePath, b.filePath))).toSorted((a, b) => compareNatural(a[0].filePath, b[0].filePath));
};
/** Resolves a Zod schema file path from the route plan or legacy layout. */
function getZodSchemaFilePath(name, schemasPath, fileExtension, namingConvention, schemaOutputPlan, schemaTagMap, scopeTag) {
	if (schemaOutputPlan) {
		const existing = schemaOutputPlan.filePathByName.get(name);
		if (existing) return existing;
		const tag = scopeTag ?? schemaTagMap?.get(name);
		const scopePath = tag ? path.join(schemaOutputPlan.routePathByKey.default, tag === "." ? "shared" : tag) : schemaOutputPlan.routePathByKey.default;
		return schemaOutputPlan.registerSchema(name, "default", scopePath);
	}
	return path.join(schemasPath, `${conventionName(name, namingConvention)}${fileExtension}`);
}
async function writeZodSchemaIndex(schemasPath, fileExtension, header, schemaNames, namingConvention, shouldMergeExisting = false, tsconfig) {
	const importFileExtension = getImportExtension(fileExtension, tsconfig);
	const indexPath = path.join(schemasPath, `index.ts`);
	const newSpecifiers = [...new Set(schemaNames.map((schemaName) => {
		return `./${conventionName(schemaName, namingConvention)}${importFileExtension}`;
	}))];
	await reconcileZodBarrel(indexPath, newSpecifiers, header, shouldMergeExisting);
}
/** Writes a generated Zod barrel without merging unrelated existing exports. */
async function writeZodBarrel(indexPath, specifiers, header) {
	await reconcileZodBarrel(indexPath, specifiers, header, false);
}
/** Writes Zod schema barrels for each route, tag scope, and the root output. */
async function writeZodSchemaRoutesBarrel(plan, fileExtension, header, schemaNames, namingConvention, tsconfig) {
	const namesByScope = /* @__PURE__ */ new Map();
	for (const name of schemaNames) {
		const scope = plan.scopePathByName.get(name) ?? plan.routePathByName.get(name);
		if (!scope) continue;
		const names = namesByScope.get(scope) ?? [];
		names.push(name);
		namesByScope.set(scope, names);
	}
	const indexImportExt = getImportExtension(".ts", tsconfig);
	for (const [scopePath, names] of namesByScope) await writeZodSchemaIndex(scopePath, fileExtension, header, names, namingConvention, false, tsconfig);
	const scopesByRoute = /* @__PURE__ */ new Map();
	for (const [scopePath, names] of namesByScope) {
		const route = plan.routeKeyByName.get(names[0]) ?? "default";
		const scopes = scopesByRoute.get(route) ?? [];
		scopes.push(scopePath);
		scopesByRoute.set(route, scopes);
	}
	const routeExports = [];
	for (const route of ["default", "enum"]) {
		const routePath = plan.routePathByKey[route];
		const scopes = scopesByRoute.get(route) ?? [];
		if (scopes.length === 0) continue;
		if (plan.usesTagRouting) {
			const scopeExports = scopes.map((scopePath) => {
				return `./${upath.toUnix(path.relative(routePath, scopePath))}/index${indexImportExt}`;
			}).toSorted((a, b) => compareNatural(a, b));
			await writeZodBarrel(path.join(routePath, "index.ts"), scopeExports, header);
		}
		const routeName = upath.toUnix(path.relative(plan.basePath, routePath));
		routeExports.push(`./${routeName}/index${indexImportExt}`);
	}
	await writeZodBarrel(path.join(plan.basePath, "index.ts"), routeExports, header);
}
async function writeZodSchemaTagsSplitBarrel(schemasPath, fileExtension, header, componentDirs, verbDirs, namingConvention, tsconfig) {
	const importExt = getImportExtension(fileExtension, tsconfig);
	const indexImportExt = getImportExtension(".ts", tsconfig);
	const allDirs = /* @__PURE__ */ new Map();
	for (const [dir, names] of componentDirs) allDirs.set(dir, [...names]);
	for (const [dir, names] of verbDirs) if (allDirs.has(dir)) allDirs.get(dir).push(...names);
	else allDirs.set(dir, [...names]);
	for (const [dir, schemaNames] of allDirs) {
		if (dir === ROOT_DIR) continue;
		await writeZodSchemaIndex(path.join(schemasPath, dir), fileExtension, header, schemaNames, namingConvention, false, tsconfig);
	}
	const rootSchemas = allDirs.get(ROOT_DIR) ?? [];
	const rootExports = [...new Set(rootSchemas)].map((name) => {
		return `export * from './${conventionName(name, namingConvention)}${importExt}';`;
	}).toSorted();
	const tagExports = [...allDirs.keys()].filter((dir) => dir !== ROOT_DIR).toSorted((a, b) => compareNatural(a, b)).map((dir) => {
		return `export * from '${indexImportExt ? `./${dir}/index${indexImportExt}` : `./${dir}`}';`;
	});
	const allExports = [...rootExports, ...tagExports];
	const rootIndexPath = path.join(schemasPath, "index.ts");
	const content = `${header}\n${allExports.join("\n")}\n`;
	await writeGeneratedFile(rootIndexPath, content);
}
function generateZodSchemasInline(builder, output, includeZodImport = true, paramsMutator, includeParamsImport = false) {
	if (output.override.zod.generateReusableSchemas === true) return generateZodSchemasInlineReusable(builder, output, includeZodImport, paramsMutator, includeParamsImport);
	const schemasWithOpenApiDef = builder.schemas.filter((s) => s.schema);
	if (schemasWithOpenApiDef.length === 0) return "";
	const isZodV4 = resolveIsZodV4(output.override.zod.version, output.packageJson);
	assertZodTarget({
		variant: output.override.zod.variant,
		isZodV4
	});
	const strict = output.override.zod.strict.body;
	const coerce = output.override.zod.coerce.body;
	const schemas = [];
	for (const { name, schema: schemaObject } of schemasWithOpenApiDef) {
		if (!schemaObject) continue;
		const context = {
			spec: builder.spec,
			target: builder.target,
			workspace: "",
			output
		};
		const dereferencedSchema = dereference(schemaObject, context);
		const zodDefinition = generateZodValidationSchemaDefinition(dereferencedSchema, context, name, strict, isZodV4, {
			required: true,
			emitMeta: output.override.zod.generateMeta
		});
		const parsedZodDefinition = parseZodValidationSchemaDefinition(zodDefinition, context, coerce, strict, isZodV4, void 0, void 0, output.override.zod.variant, output.override.zod.exactOptional);
		schemas.push({
			schemaName: name,
			consts: parsedZodDefinition.consts,
			zodExpression: parsedZodDefinition.zod
		});
	}
	if (schemas.length === 0) return "";
	return generateZodSchemaFileContent("", schemas, output.override.zod.variant, includeZodImport);
}
function generateZodSchemasInlineReusable(builder, output, includeZodImport = true, paramsMutator, includeParamsImport = false) {
	const isZodV4 = resolveIsZodV4(output.override.zod.version, output.packageJson);
	assertZodTarget({
		variant: output.override.zod.variant,
		isZodV4
	});
	const strict = output.override.zod.strict.body;
	const coerce = output.override.zod.coerce.body;
	const context = {
		spec: builder.spec,
		target: builder.target,
		workspace: "",
		output
	};
	const componentSchemas = builder.spec.components?.schemas ?? {};
	const refs = Object.keys(componentSchemas).map((schemaName) => `#/components/schemas/${schemaName}`);
	if (refs.length === 0) return "";
	resolveSchemaNames(refs, context);
	const entries = generateReusableSchemaSet(refs, context, {
		strict,
		isZodV4,
		coerce,
		variant: output.override.zod.variant,
		generateMeta: output.override.zod.generateMeta,
		exactOptional: output.override.zod.exactOptional,
		paramsMutator
	});
	const body = rewriteReusableSchemas(entries).map((entry) => renderReusableSchemaEntry(entry, context, output.override.zod.variant).content).join("\n\n");
	const zodImport = includeZodImport ? `${getZodSchemaImportStatement(output.override.zod.variant)}\n` : "";
	const paramsImport = paramsMutator && includeParamsImport && bodyReferencesMutator(body, paramsMutator) ? `${buildMutatorImportStatement(paramsMutator)}\n` : "";
	return `${zodImport || paramsImport ? `${zodImport}${paramsImport}\n` : ""}${body}\n`;
}
/** Writes reusable or inline Zod component schemas using the selected layout. */
async function writeZodSchemas(builder, schemasPath, fileExtension, header, output, paramsMutator, schemaTagMap, schemaOutputPlan) {
	if (output.override.zod.generateReusableSchemas) return writeZodSchemasReusable(builder, schemasPath, fileExtension, header, output, paramsMutator, schemaTagMap, schemaOutputPlan);
	const isSplit = !!schemaTagMap;
	const schemasWithOpenApiDef = builder.schemas.filter((s) => s.schema);
	const schemasToWrite = [];
	const isZodV4 = resolveIsZodV4(output.override.zod.version, output.packageJson);
	assertZodTarget({
		variant: output.override.zod.variant,
		isZodV4
	});
	const strict = output.override.zod.strict.body;
	const coerce = output.override.zod.coerce.body;
	for (const generatorSchema of schemasWithOpenApiDef) {
		const { name, schema: schemaObject } = generatorSchema;
		if (!schemaObject) continue;
		const fileName = conventionName(name, output.namingConvention);
		const tagDir = getSchemaDir(schemaTagMap, name);
		const filePath = schemaOutputPlan ? getZodSchemaFilePath(name, schemasPath, fileExtension, output.namingConvention, schemaOutputPlan, schemaTagMap) : isSplit ? path.join(schemasPath, tagDir, `${fileName}${fileExtension}`) : path.join(schemasPath, `${fileName}${fileExtension}`);
		const context = {
			spec: builder.spec,
			target: builder.target,
			workspace: "",
			output
		};
		const dereferencedSchema = dereference(schemaObject, context);
		const zodDefinition = generateZodValidationSchemaDefinition(dereferencedSchema, context, name, strict, isZodV4, {
			required: true,
			emitMeta: output.override.zod.generateMeta
		});
		const parsedZodDefinition = parseZodValidationSchemaDefinition(zodDefinition, context, coerce, strict, isZodV4, void 0, void 0, output.override.zod.variant, output.override.zod.exactOptional);
		schemasToWrite.push({
			schemaName: name,
			filePath,
			consts: parsedZodDefinition.consts,
			zodExpression: parsedZodDefinition.zod
		});
	}
	const groupedSchemasToWrite = groupSchemasByFilePath(schemasToWrite);
	for (const schemaGroup of groupedSchemasToWrite) {
		const fileContent = generateZodSchemaFileContent(header, schemaGroup, output.override.zod.variant);
		await writeGeneratedFile(schemaGroup[0].filePath, fileContent);
	}
	const writtenSchemaNames = groupedSchemasToWrite.map((schemaGroup) => schemaGroup[0].schemaName);
	if (output.indexFiles && !isSplit && !schemaOutputPlan) await writeZodSchemaIndex(schemasPath, fileExtension, header, writtenSchemaNames, output.namingConvention, false, output.tsconfig);
	if (isSplit) {
		const dirSchemas = /* @__PURE__ */ new Map();
		for (const name of writtenSchemaNames) {
			const dir = getSchemaDir(schemaTagMap, name);
			if (!dirSchemas.has(dir)) dirSchemas.set(dir, []);
			dirSchemas.get(dir).push(name);
		}
		return dirSchemas;
	}
	return /* @__PURE__ */ new Map([[ROOT_DIR, writtenSchemaNames]]);
}
/** Writes reusable Zod schemas while preserving their planned route scopes. */
async function writeZodSchemasReusable(builder, schemasPath, fileExtension, header, output, paramsMutator, schemaTagMap, schemaOutputPlan) {
	const isSplit = !!schemaTagMap;
	const isZodV4 = resolveIsZodV4(output.override.zod.version, output.packageJson);
	assertZodTarget({
		variant: output.override.zod.variant,
		isZodV4
	});
	const strict = output.override.zod.strict.body;
	const coerce = output.override.zod.coerce.body;
	const context = {
		spec: builder.spec,
		target: builder.target,
		workspace: "",
		output
	};
	const componentSchemas = builder.spec.components?.schemas ?? {};
	const refs = Object.keys(componentSchemas).map((schemaName) => `#/components/schemas/${schemaName}`);
	resolveSchemaNames(refs, context);
	const entries = generateReusableSchemaSet(refs, context, {
		strict,
		isZodV4,
		coerce,
		variant: output.override.zod.variant,
		generateMeta: output.override.zod.generateMeta,
		exactOptional: output.override.zod.exactOptional,
		paramsMutator
	});
	const rewritten = rewriteReusableSchemas(entries);
	const componentNames = new Set(Object.keys(builder.spec.components?.schemas ?? {}).map((schemaName) => resolveSchemaName(`#/components/schemas/${schemaName}`, context)));
	for (const entry of rewritten) {
		const tagDir = getSchemaDir(schemaTagMap, entry.name);
		const fileName = conventionName(entry.name, output.namingConvention);
		const filePath = schemaOutputPlan ? getZodSchemaFilePath(entry.name, schemasPath, fileExtension, output.namingConvention, schemaOutputPlan, isSplit ? schemaTagMap : void 0, isSplit ? tagDir : void 0) : isSplit ? path.join(schemasPath, tagDir, `${fileName}${fileExtension}`) : path.join(schemasPath, `${fileName}${fileExtension}`);
		const importExt = getImportExtension(fileExtension, output.tsconfig);
		const rendered = renderReusableSchemaEntry(entry, context, output.override.zod.variant);
		const refImports = buildSiblingImports({
			usedRefs: entry.usedRefs,
			extraImports: rendered.extraImports,
			entryName: entry.name,
			componentNames,
			namingConvention: output.namingConvention,
			importExt,
			schemaOutputPlan,
			...isSplit ? {
				schemaTagMap,
				currentDir: tagDir,
				schemasPath
			} : {}
		});
		const mutatorImportStr = !!paramsMutator && bodyReferencesMutator(entry.zod, paramsMutator) ? buildMutatorImportStatement({
			...paramsMutator,
			path: isSplit ? adjustMutatorPathForDir(paramsMutator.path, tagDir) : paramsMutator.path
		}) : void 0;
		const imports = [...mutatorImportStr ? [mutatorImportStr] : [], ...refImports ? [refImports] : []].join("\n");
		const fileContent = `${header}${getZodSchemaImportStatement(output.override.zod.variant)}\n` + (imports ? `${imports}\n\n` : "\n") + `${rendered.content}\n`;
		await writeGeneratedFile(filePath, fileContent);
	}
	if (output.indexFiles && !isSplit && rewritten.length > 0 && !schemaOutputPlan) await writeZodSchemaIndex(schemasPath, fileExtension, header, rewritten.map((e) => e.name), output.namingConvention, true, output.tsconfig);
	if (isSplit) {
		const dirSchemas = /* @__PURE__ */ new Map();
		for (const entry of rewritten) {
			const dir = getSchemaDir(schemaTagMap, entry.name);
			if (!dirSchemas.has(dir)) dirSchemas.set(dir, []);
			dirSchemas.get(dir).push(entry.name);
		}
		return dirSchemas;
	}
	return /* @__PURE__ */ new Map([[ROOT_DIR, rewritten.map((e) => e.name)]]);
}
/** Builds operation schemas for either single-file or split-file output. */
function generateZodSchemasFromVerbs(verbOptions, schemasPath, fileExtension, output, context, schemaTagMap, schemaOutputPlan) {
	const isSplit = !!schemaTagMap;
	const zodContext = context;
	const verbOptionsArray = Object.values(verbOptions);
	if (verbOptionsArray.length === 0) return {
		schemasToWrite: [],
		uniqueVerbsSchemas: []
	};
	const isZodV4 = resolveIsZodV4(output.override.zod.version, output.packageJson);
	assertZodTarget({
		variant: output.override.zod.variant,
		isZodV4
	});
	const strict = output.override.zod.strict.body;
	const coerce = output.override.zod.coerce.body;
	const useReusableSchemas = output.override.zod.generateReusableSchemas === true;
	const useNamedParameters = output.override.useNamedParameters ?? false;
	const generateVerbsSchemas = verbOptionsArray.flatMap((verbOption) => {
		const operation = verbOption.originalOperation;
		const shouldGenerate = {
			...output.override.zod.generate,
			...verbOption.override?.zod.generate
		};
		const requestBody = operation.requestBody;
		const requestBodyContent = requestBody && "content" in requestBody ? requestBody.content : void 0;
		const jsonBodyMedia = requestBodyContent?.["application/json"];
		const formDataBodyMedia = requestBodyContent?.["multipart/form-data"];
		const formUrlEncodedBodyMedia = requestBodyContent?.["application/x-www-form-urlencoded"];
		const [bodyContentType, bodyMedia] = jsonBodyMedia ? ["application/json", jsonBodyMedia] : formDataBodyMedia ? ["multipart/form-data", formDataBodyMedia] : formUrlEncodedBodyMedia ? ["application/x-www-form-urlencoded", formUrlEncodedBodyMedia] : [void 0, void 0];
		const bodySchema = bodyMedia?.schema;
		const bodySchemas = shouldGenerate.body && bodySchema ? [{
			name: `${pascal(verbOption.typeName)}Body`,
			schema: useReusableSchemas ? bodySchema : dereference(bodySchema, zodContext),
			bodyContentType,
			encoding: bodyMedia?.encoding
		}] : [];
		const resolvedParameters = operation.parameters?.map((p) => !isInlineSchema(p) && typeof p.$ref === "string" ? resolveRef(p, zodContext).schema : p);
		const pathParams = resolvedParameters?.filter((p) => "in" in p && p.in === "path");
		const pathParamsSchemas = useNamedParameters && shouldGenerate.param && pathParams && pathParams.length > 0 ? [{
			name: `${pascal(verbOption.typeName)}PathParameters`,
			schema: {
				type: "object",
				properties: Object.fromEntries(pathParams.filter((p) => "schema" in p && p.schema !== void 0).map((p) => [p.name, useReusableSchemas ? p.schema : dereference(p.schema, zodContext)])),
				required: pathParams.filter((p) => p.required).map((p) => p.name).filter((name) => name !== void 0)
			}
		}] : [];
		const queryParams = resolvedParameters?.filter((p) => "in" in p && p.in === "query");
		const queryParamsSchemas = shouldGenerate.query && queryParams && queryParams.length > 0 ? [{
			name: `${pascal(verbOption.typeName)}Params`,
			schema: {
				type: "object",
				properties: Object.fromEntries(queryParams.filter((p) => "schema" in p && p.schema !== void 0).map((p) => [p.name, useReusableSchemas ? p.schema : dereference(p.schema, zodContext)])),
				required: queryParams.filter((p) => p.required).map((p) => p.name).filter((name) => name !== void 0)
			}
		}] : [];
		const headerParams = resolvedParameters?.filter((p) => "in" in p && p.in === "header");
		const headerParamsSchemas = shouldGenerate.header && headerParams && headerParams.length > 0 ? [{
			name: `${pascal(verbOption.typeName)}Headers`,
			schema: {
				type: "object",
				properties: Object.fromEntries(headerParams.filter((p) => "schema" in p && p.schema !== void 0).map((p) => [p.name, useReusableSchemas ? p.schema : dereference(p.schema, zodContext)])),
				required: headerParams.filter((p) => p.required).map((p) => p.name).filter((name) => name !== void 0)
			}
		}] : [];
		const responseSchemas = shouldGenerate.response ? [...verbOption.response.types.success, ...verbOption.response.types.errors].map((responseType) => {
			const cleanName = responseType.value.replace(/(\[\])+$/, "");
			const hadArraySuffix = cleanName !== responseType.value;
			let cleanSchema = responseType.originalSchema;
			if (hadArraySuffix) {
				while (cleanSchema && typeof cleanSchema === "object" && "type" in cleanSchema && cleanSchema.type === "array" && cleanSchema.items && typeof cleanSchema.items === "object" && isInlineSchema(cleanSchema.items) && !("$ref" in cleanSchema.items)) cleanSchema = cleanSchema.items;
				if (!cleanSchema || typeof cleanSchema === "object" && "type" in cleanSchema && cleanSchema.type === "array") cleanSchema = void 0;
			}
			return {
				isRef: responseType.isRef,
				cleanName,
				cleanSchema
			};
		}).filter((entry) => !!entry.cleanSchema && !entry.isRef && isValidSchemaIdentifier(entry.cleanName) && !isPrimitiveSchemaName(entry.cleanName)).map((entry) => ({
			name: entry.cleanName,
			schema: useReusableSchemas ? entry.cleanSchema : dereference(entry.cleanSchema, zodContext)
		})) : [];
		return dedupeSchemasByName([
			...bodySchemas,
			...pathParamsSchemas,
			...queryParamsSchemas,
			...headerParamsSchemas,
			...responseSchemas
		]).map((s) => ({
			...s,
			verbTagDir: isSplit ? kebab(verbOption.tags?.[0] ?? DefaultTag) : ROOT_DIR
		}));
	});
	const uniqueVerbsSchemas = dedupeSchemasByName(generateVerbsSchemas);
	const schemasToWrite = [];
	for (const entry of uniqueVerbsSchemas) {
		if (useReusableSchemas && entry.schema && typeof entry.schema.$ref === "string" && Object.keys(entry.schema).length === 1) continue;
		const { name, schema } = entry;
		const fileName = conventionName(name, output.namingConvention);
		const tagDir = entry.verbTagDir ?? ROOT_DIR;
		const filePath = schemaOutputPlan ? getZodSchemaFilePath(name, schemasPath, fileExtension, output.namingConvention, schemaOutputPlan, isSplit ? schemaTagMap : void 0, isSplit ? tagDir : void 0) : isSplit ? path.join(schemasPath, tagDir, `${fileName}${fileExtension}`) : path.join(schemasPath, `${fileName}${fileExtension}`);
		const zodDefinition = "bodyContentType" in entry && entry.bodyContentType === "multipart/form-data" ? generateFormDataZodSchema(schema, zodContext, name, strict, isZodV4, "encoding" in entry ? entry.encoding : void 0, useReusableSchemas) : generateZodValidationSchemaDefinition(schema, zodContext, name, strict, isZodV4, {
			required: true,
			useReusableSchemas
		});
		const parsedZodDefinition = parseZodValidationSchemaDefinition(zodDefinition, zodContext, coerce, strict, isZodV4, void 0, void 0, output.override.zod.variant, output.override.zod.exactOptional);
		let zodExpression = parsedZodDefinition.zod;
		let importStatements;
		if (useReusableSchemas && parsedZodDefinition.usedRefs.size > 0) {
			zodExpression = rewriteSentinelsToDirect(zodExpression);
			const importExt = getImportExtension(fileExtension, output.tsconfig);
			importStatements = [...parsedZodDefinition.usedRefs].filter((refName) => refName !== name).toSorted().map((refName) => {
				const importedFile = conventionName(refName, output.namingConvention);
				return `import { ${refName} } from '${schemaOutputPlan ? schemaOutputPlan.importPathFor(name, refName) : isSplit ? computeCrossDirImportPath(schemasPath, tagDir, getSchemaDir(schemaTagMap, refName), importedFile, importExt) : `./${importedFile}${importExt}`}';`;
			});
		}
		schemasToWrite.push({
			schemaName: name,
			filePath,
			consts: parsedZodDefinition.consts,
			zodExpression,
			importStatements
		});
	}
	return {
		schemasToWrite,
		uniqueVerbsSchemas
	};
}
async function writeZodSchemasFromVerbs(verbOptions, schemasPath, fileExtension, header, output, context, schemaTagMap, schemaOutputPlan) {
	const isSplit = !!schemaTagMap;
	const useReusableSchemas = output.override.zod.generateReusableSchemas === true;
	const { schemasToWrite, uniqueVerbsSchemas } = generateZodSchemasFromVerbs(verbOptions, schemasPath, fileExtension, output, context, schemaTagMap, schemaOutputPlan);
	if (Object.keys(verbOptions).length === 0) return /* @__PURE__ */ new Map();
	const groupedSchemasToWrite = groupSchemasByFilePath(schemasToWrite);
	for (const schemaGroup of groupedSchemasToWrite) {
		const fileContent = generateZodSchemaFileContent(header, schemaGroup, output.override.zod.variant);
		await writeGeneratedFile(schemaGroup[0].filePath, fileContent);
	}
	const writtenSchemaNames = groupedSchemasToWrite.map((schemaGroup) => schemaGroup[0].schemaName);
	if (output.indexFiles && !isSplit && uniqueVerbsSchemas.length > 0 && !schemaOutputPlan) await writeZodSchemaIndex(schemasPath, fileExtension, header, writtenSchemaNames, output.namingConvention, true, output.tsconfig);
	if (isSplit) {
		const dirSchemas = /* @__PURE__ */ new Map();
		for (const entry of uniqueVerbsSchemas) {
			if (useReusableSchemas && entry.schema && typeof entry.schema.$ref === "string" && Object.keys(entry.schema).length === 1) continue;
			const dir = entry.verbTagDir ?? ROOT_DIR;
			if (!dirSchemas.has(dir)) dirSchemas.set(dir, []);
			dirSchemas.get(dir).push(entry.name);
		}
		return dirSchemas;
	}
	return /* @__PURE__ */ new Map([[ROOT_DIR, writtenSchemaNames]]);
}
/** Writes component and operation schemas to one module, preserving dependency order. */
async function writeZodSchemasSingle(builder, verbOptions, schemasPath, fileExtension, header, output, context, paramsMutator) {
	const { schemasToWrite } = generateZodSchemasFromVerbs(verbOptions, schemasPath, fileExtension, output, context);
	const operationNames = new Set(schemasToWrite.map((entry) => entry.schemaName));
	const components = generateZodSchemasInline({
		...builder,
		schemas: builder.schemas.filter((schema) => !operationNames.has(schema.name))
	}, output, false, paramsMutator, true);
	const operations = generateZodSchemaFileContent("", schemasToWrite.map((entry) => ({
		...entry,
		importStatements: void 0
	})), output.override.zod.variant, false);
	await writeGeneratedFile(namesAFile(schemasPath) ? schemasPath : path.join(schemasPath, `index${fileExtension}`), `${header}${getZodSchemaImportStatement(output.override.zod.variant)}\n\n${components}${operations}`);
}
//#endregion
export { buildSiblingImports, generateZodSchemasInline, writeZodSchemaRoutesBarrel, writeZodSchemaTagsSplitBarrel, writeZodSchemas, writeZodSchemasFromVerbs, writeZodSchemasSingle };

//# sourceMappingURL=write-zod-specs-C2xM-gnX.mjs.map