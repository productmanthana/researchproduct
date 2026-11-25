import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve, relative, join } from "node:path";
import yauzl from "yauzl";
import { renderStudioPdf } from "./studio-pdf";
import { renderStudioWord } from "./studio-docx";

const apiRoot = existsSync(resolve("src/lib/studio-pdf.ts"))
  ? process.cwd() : resolve("artifacts/api-server");
const appRoot = resolve(apiRoot, "../evidora");
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]);
}

test("litvo.ai replaces legacy branding without renaming persistent namespaces", () => {
  const allowed: Record<string, RegExp> = {
    "lib/selection.ts": /^const KEY = "evidora\.selection\.v1";$/,
    "lib/active-project.tsx": /^const keyFor = \(uid: string\) => `evidora:active-project:\$\{uid\}`;$/,
  };
  const violations: string[] = [];
  for (const path of files(resolve(appRoot, "src"))) {
    if (!/\.(tsx?|css)$/.test(path) || /\.test\./.test(path)) continue;
    const key = relative(resolve(appRoot, "src"), path);
    for (const line of readFileSync(path, "utf8").split("\n")) {
      if (/evidora/i.test(line) && !allowed[key]?.test(line)) violations.push(`${key}: ${line.trim()}`);
    }
  }
  assert.deepEqual(violations, [], "legacy name must not return in visible app text");
  for (const [file, line] of Object.entries(allowed)) {
    assert.ok(readFileSync(resolve(appRoot, "src", file), "utf8").split("\n").some(s => line.test(s)),
      "keep saved projects and selected papers readable after the rebrand");
  }
  const html = readFileSync(resolve(appRoot, "index.html"), "utf8");
  assert.match(html, /<title>litvo\.ai/);
  assert.doesNotMatch(html, /evidora|Update this description/i);
  for (const logo of ["logo.svg", "favicon.svg"]) {
    const svg = readFileSync(resolve(appRoot, "public", logo), "utf8");
    assert.match(svg, /litvo\.ai/);
    assert.doesNotMatch(svg, /evidora/i);
  }
});

function coreProperties(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (error, zip) => {
      if (error || !zip) return reject(error ?? new Error("Invalid Word archive"));
      zip.on("error", reject);
      zip.on("end", () => reject(new Error("Word core properties missing")));
      zip.on("entry", entry => {
        if (entry.fileName !== "docProps/core.xml") return zip.readEntry();
        zip.openReadStream(entry, (streamError, stream) => {
          if (streamError || !stream) return reject(streamError ?? new Error("Missing core stream"));
          const chunks: Buffer[] = [];
          stream.on("error", reject);
          stream.on("data", chunk => chunks.push(chunk));
          stream.on("end", () => { zip.close(); resolve(Buffer.concat(chunks).toString("utf8")); });
        });
      });
      zip.readEntry();
    });
  });
}

test("PDF and Word exports use litvo.ai defaults and preserve the researcher's authorship", async () => {
  const row = { kind: "journal", title: "Branding regression",
    content: "## Abstract\n\nA source-grounded working manuscript.", metadata: {} };
  const pdf = (await renderStudioPdf(row)).toString("latin1");
  const word = await coreProperties(await renderStudioWord(row));
  assert.match(pdf, /\(litvo\.ai research workspace\)/);
  assert.match(word, /<dc:creator>litvo\.ai<\/dc:creator>/);
  assert.doesNotMatch(pdf, /evidora/i);
  assert.doesNotMatch(word, /evidora/i);
  const authored = { ...row, metadata: { documentDetails: { author: "Test Researcher" } } };
  assert.match((await renderStudioPdf(authored)).toString("latin1"), /\(Test Researcher\)/);
  assert.match(await coreProperties(await renderStudioWord(authored)), /<dc:creator>Test Researcher<\/dc:creator>/);
});

test("all download endpoints and assistant instructions use the new brand", () => {
  for (const name of ["analyses", "paper-reviews", "studio"]) {
    const route = readFileSync(resolve(apiRoot, `src/routes/${name}.ts`), "utf8");
    assert.match(route, /filename="litvo-/);
    assert.doesNotMatch(route, /evidora/i);
  }
  for (const name of ["ai-json", "studio-worker", "studio-docx", "studio-pdf", "openrouter-web",
    "source-registry", "open-full-text", "official-guidelines"]) {
    assert.doesNotMatch(readFileSync(resolve(apiRoot, `src/lib/${name}.ts`), "utf8"), /evidora/i);
  }
});
