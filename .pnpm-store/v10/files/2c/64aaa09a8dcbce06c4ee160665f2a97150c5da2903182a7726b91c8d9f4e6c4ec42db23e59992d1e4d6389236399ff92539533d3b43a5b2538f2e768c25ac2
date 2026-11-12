import path from "node:path";
import { writeGeneratedFile } from "@orval/core";
import fs from "node:fs";
//#region src/utils/barrel.ts
const RE_EXPORT_LINE = /^\s*export\s+\*\s+from\s*['"]([^'"]+)['"]\s*;?\s*$/;
function readReExportSpecifiers(content) {
	const specifiers = /* @__PURE__ */ new Set();
	for (const line of content.split(/\r?\n/)) {
		const m = line.match(RE_EXPORT_LINE)?.[1];
		if (m) specifiers.add(m);
	}
	return specifiers;
}
async function reExportSpecifierExists(indexFile, specifier, fileExtension, importExtension) {
	if (!specifier.startsWith(".")) return true;
	const resolved = path.resolve(path.dirname(indexFile), specifier);
	const candidates = /* @__PURE__ */ new Set([resolved]);
	if (importExtension && specifier.endsWith(importExtension)) candidates.add(resolved.slice(0, -importExtension.length) + fileExtension);
	candidates.add(`${resolved}${fileExtension}`);
	candidates.add(path.join(resolved, `index${fileExtension}`));
	for (const candidate of candidates) if (fs.existsSync(candidate)) return true;
	return false;
}
async function reconcileWorkspaceBarrel(filePath, specifiers, fileExtension, importExtension, excluded = /* @__PURE__ */ new Set()) {
	let existingContent;
	try {
		existingContent = await fs.promises.readFile(filePath, "utf8");
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
		await writeGeneratedFile(filePath, specifiers.map((s) => `export * from '${s}';`).join("\n") + "\n");
		return;
	}
	const declared = [...readReExportSpecifiers(existingContent)];
	const resolvable = await Promise.all(declared.map((s) => reExportSpecifierExists(filePath, s, fileExtension, importExtension)));
	const desired = new Set(specifiers);
	declared.forEach((s, i) => {
		if (resolvable[i] && !excluded.has(s)) desired.add(s);
	});
	const seen = /* @__PURE__ */ new Set();
	const eol = existingContent.includes("\r\n") ? "\r\n" : "\n";
	const retained = [];
	for (const line of existingContent.split(/\r?\n/)) {
		const m = line.match(RE_EXPORT_LINE)?.[1];
		if (!m) retained.push(line);
		else if (desired.has(m) && !seen.has(m)) {
			retained.push(line);
			seen.add(m);
			desired.delete(m);
		}
	}
	const nextContent = [retained.join(eol).trimEnd(), [...desired].map((s) => `export * from '${s}';`).join(eol)].filter(Boolean).join(eol) + eol;
	if (nextContent !== existingContent) await writeGeneratedFile(filePath, nextContent);
}
async function reconcileZodBarrel(filePath, specifiers, header, mergeExisting) {
	let existingContent = "";
	try {
		existingContent = await fs.promises.readFile(filePath, "utf8");
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	const existing = mergeExisting ? readReExportSpecifiers(existingContent) : /* @__PURE__ */ new Set();
	const nextContent = `${header}\n${[.../* @__PURE__ */ new Set([...existing, ...specifiers])].sort().map((s) => `export * from '${s}';`).join("\n")}\n`;
	if (nextContent !== existingContent) await writeGeneratedFile(filePath, nextContent);
}
//#endregion
export { reconcileWorkspaceBarrel as n, reconcileZodBarrel as r, readReExportSpecifiers as t };

//# sourceMappingURL=barrel-DQrRgq4v.mjs.map