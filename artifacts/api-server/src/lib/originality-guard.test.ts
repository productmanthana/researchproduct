import test from "node:test";
import assert from "node:assert/strict";
import { alignDraft } from "./plagiarism-align";
import { matchedItems, sentencesCovering } from "./originality-guard";

const source = "Wind turbine blades experience fatigue loading from gravity and turbulent inflow over millions of rotations during their service life in offshore farms.";
const draft = `## Loads\n\nThe rotor sees steady thrust [1]. Wind turbine blades experience fatigue loading from gravity and turbulent inflow over millions of rotations during their service life [2]. Inspection intervals follow from this.`;

test("a matched passage maps back to the whole draft sentence, citations included", () => {
  const span = sentencesCovering(draft, "wind turbine blades experience fatigue loading from gravity and turbulent inflow over millions of rotations during their service life");
  assert.equal(span, "Wind turbine blades experience fatigue loading from gravity and turbulent inflow over millions of rotations during their service life [2].");
  assert.equal(sentencesCovering(draft, "text that is not in the draft at all anywhere"), null);
});

test("copied wording found by alignment becomes a sentence to rewrite, with its source", async () => {
  const report = await alignDraft(draft, [{ title: "Blade fatigue", origin: "project", text: source }]);
  assert.ok(report.matchedWords > 0);
  const items = matchedItems(draft, report);
  assert.equal(items.length, 1);
  assert.ok(items[0].sentence.startsWith("Wind turbine blades experience"));
  assert.ok(items[0].source?.includes("fatigue loading"));
  assert.match(items[0].reasons[0], /Blade fatigue/);
});
