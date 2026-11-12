import test from "node:test";
import assert from "node:assert/strict";
import { HUMAN_AUTHORSHIP_STYLE, HUMAN_AUTHORSHIP_TARGET, markersPreserved } from "./human-authorship";

test("every generated paper targets a 99 percent human-authorship screen",()=>{
  assert.equal(HUMAN_AUTHORSHIP_TARGET,99);
  const style=HUMAN_AUTHORSHIP_STYLE.toLowerCase();
  for(const marker of ["delve","moreover","furthermore","in conclusion","it is important to note","underscore"])
    assert.ok(style.includes(marker),`style rules name the machine-written marker ${marker}`);
  assert.match(HUMAN_AUTHORSHIP_STYLE,/Vary sentence and paragraph length/);
  assert.match(HUMAN_AUTHORSHIP_STYLE,/Never claim human authorship/);
});

test("a humanising rewrite may not drop or invent citations and figure markers",()=>{
  const draft="# Methods\nThe rig runs at 12 m/s [1] and follows the IEC load case [2].\n\n[[figure:fig-abc123]]\n\n## References\n[1] A. [2] B.";
  const faithful=draft.replace("The rig runs at 12 m/s","The test rig, run at 12 m/s,");
  assert.equal(markersPreserved(draft,faithful),true);
  assert.equal(markersPreserved(draft,draft.replace("[2]","[3]")),false);
  assert.equal(markersPreserved(draft,draft.replace("[[figure:fig-abc123]]","")),false);
  assert.equal(markersPreserved(draft,draft.replace("[[figure:fig-abc123]]","[[figure:fig-xyz]]")),false);
});
