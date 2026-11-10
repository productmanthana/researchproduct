import { test } from "node:test";
import assert from "node:assert/strict";
import { GRAPH_LIMIT, layoutGraph, mergeRelations, passesFilters, timelineBuckets } from "./related-graph";

const mk = (id: string, year = 2020, extra = {}) => ({ id, title: `T ${id}`, year, ...extra });

test("caps each relation at 25 and drops the root", () => {
  const many = Array.from({ length: 40 }, (_, i) => mk(`r${i}`));
  const merged = mergeRelations("root", { references: [mk("root"), ...many] });
  assert.equal(merged.length, GRAPH_LIMIT - 1);
});

test("dedupes papers appearing in several relations and keeps every kind", () => {
  const merged = mergeRelations("root", { references: [mk("a")], similar: [mk("a"), mk("b")] });
  assert.deepEqual(merged.find((m) => m.paper.id === "a")?.kinds, ["references", "similar"]);
  assert.equal(merged.length, 2);
});

test("only root edges are produced, direction follows citation", () => {
  const { edges } = layoutGraph(mergeRelations("root", { references: [mk("a")], citedBy: [mk("b")], similar: [mk("c")] }));
  assert.ok(edges.every((e) => e.from === "root" || e.to === "root"));
  assert.deepEqual(edges.find((e) => e.kind === "citedBy"), { from: "b", to: "root", kind: "citedBy" });
  assert.deepEqual(edges.find((e) => e.kind === "references"), { from: "root", to: "a", kind: "references" });
});

test("filters by age, open access and publisher; unknown years excluded from age filters", () => {
  const base = { age: "all" as const, oaOnly: false, publisher: "", now: 2025 };
  assert.equal(passesFilters(mk("a", 2023), { ...base, age: "recent" }), true);
  assert.equal(passesFilters(mk("a", 2010), { ...base, age: "recent" }), false);
  assert.equal(passesFilters(mk("a", 0), { ...base, age: "older" }), false);
  assert.equal(passesFilters(mk("a", 2020, { isOa: false }), { ...base, oaOnly: true }), false);
  assert.equal(passesFilters(mk("a", 2020, { publisher: "X" }), { ...base, publisher: "Y" }), false);
});

test("timeline sorts newest first with unknown last", () => {
  const b = timelineBuckets(mergeRelations("root", { references: [mk("a", 2001), mk("b", 0), mk("c", 2019)] }));
  assert.deepEqual(b.map((x) => x[0]), [2019, 2001, "unknown"]);
});

import { sharedTitleTerms } from "./related-graph";
test("shared title terms are exact and stop-word free", () => {
  assert.deepEqual(sharedTitleTerms("Thermal model of the battery pack", "A battery thermal study"), ["thermal", "battery"]);
});

import { layoutGraph as lg } from "./related-graph";
test("75-node layout keeps the three zones separated", () => {
  const mkN = (p: string) => Array.from({ length: 25 }, (_, i) => mk(`${p}${i}`));
  const { nodes } = lg(mergeRelations("root", { references: mkN("r"), citedBy: mkN("c"), similar: mkN("s") }));
  assert.equal(nodes.length, 75);
  const z = (k: string) => nodes.filter((n) => n.kinds[0] === k);
  assert.ok(z("references").every((n) => n.x < 300 && n.y < 430));
  assert.ok(z("citedBy").every((n) => n.x > 500 && n.y < 430));
  assert.ok(z("similar").every((n) => n.y > 470));
  const pts = nodes.map((n) => `${n.x},${n.y}`);
  assert.equal(new Set(pts).size, 75);
});
