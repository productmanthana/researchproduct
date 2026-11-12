import test from "node:test";
import assert from "node:assert/strict";
import { measureStyle } from "./ai-style-metrics";
import { exportBlockReason } from "./export-gate";

const machine = Array.from({ length: 6 }, (_, i) => `Moreover, the turbine blade design plays a crucial role in overall system efficiency today. Furthermore, the aerodynamic profile is a pivotal factor in energy capture rates. Additionally, the material choice underscores the importance of durability over time.`).join("\n\n");
const human = `Blade stall starts at the root. We saw it first at 9 m/s, earlier than the model predicted [1].

That mismatch matters because the root carries most of the bending load, and a stalled root sheds vortices into the hub region where the pitch bearings sit. The tunnel data showed the separation line creeping outward by roughly a fifth of the span before the tip responded at all.

So we thickened the trailing edge.

The change cost about 2% in peak power coefficient, which the field team accepted once they had the fatigue numbers in hand; the bearing loads fell by more than that, and a bearing replacement on a 3 MW machine takes a crane, a calm week and most of a maintenance budget.`;

test("style measures separate templated machine prose from varied human prose", () => {
  const m = measureStyle(machine), h = measureStyle(human);
  assert.ok(m.score < 50, `machine-like prose scores low (${m.score})`);
  assert.ok(h.score > m.score + 30, `varied prose scores clearly higher (${h.score} vs ${m.score})`);
  assert.ok(m.flagged.some(f => f.reasons.some(r => r.includes("Moreover"))), "formulaic openers are named");
  assert.ok(m.flagged.some(f => f.reasons.some(r => r.includes("plays a crucial role"))), "stock phrases are named");
  assert.equal(h.flagged.filter(f => f.reasons.some(r => r.startsWith("stock"))).length, 0);
});

test("scholarly drafts export only with a plagiarism report at or under 1% matched text", () => {
  assert.equal(exportBlockReason({ kind: "note", metadata: {} }), null);
  assert.match(exportBlockReason({ kind: "journal", metadata: {} })!, /Run the plagiarism check/);
  assert.match(exportBlockReason({ kind: "thesis", metadata: { plagiarism: { similarityPercent: 3.2 } } })!, /blocked: 3.2%/);
  assert.equal(exportBlockReason({ kind: "journal", metadata: { plagiarism: { similarityPercent: 1 } } }), null);
});
