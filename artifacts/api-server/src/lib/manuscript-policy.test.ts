import test from "node:test";
import assert from "node:assert/strict";
import { figureRevisionRequest, JOURNAL_DRAFT_INSTRUCTIONS } from "./manuscript-policy";
import { canRepairMissingFigures, figureReviewContext } from "./figure-review-policy";

test("figure reviewers see the manuscript being illustrated, not just contradictory older project context",()=>{
  const manuscript="## Proposed wind-generator load-matching protocol\n\nOnly a proposed investigation; no measurements are available.";
  const sources=[{id:"older-project",text:"Solar-integrated battery scheduling proposal."}];
  const context=figureReviewContext("journal paper on power generation",manuscript,[{kind:"diagram"}],sources);
  assert.equal(context.reviewedManuscript,manuscript);
  assert.equal(context.sources,sources);
  assert.match(context.scopeRule,/not verified experimental results/);
  assert.equal(figureReviewContext("", "x".repeat(30000),[],[]).reviewedManuscript.length,22000);
});

test("missing manuscript illustrations get at most one repair attempt without manufacturing charts",()=>{
  const content="Proposed methodology and evidence synthesis. ".repeat(20);
  for(const kind of ["journal","thesis","literature","synopsis"])
    assert.equal(canRepairMissingFigures(kind,content,"Write a paper",0,false),true);
  assert.equal(canRepairMissingFigures("journal",content,"Write a paper",0,true),false);
  assert.equal(canRepairMissingFigures("journal",content,"Write a paper",1,false),false);
  assert.equal(canRepairMissingFigures("journal",content,"No diagrams",0,false),false);
  assert.equal(canRepairMissingFigures("journal",content,"text-only manuscript",0,false),false);
  assert.equal(canRepairMissingFigures("answer",content,"Hello",0,false),false);
});

test("a full manuscript with diagrams never reuses its preceding answer as a figure-only draft",()=>{
  assert.equal(figureRevisionRequest("Generate a journal paper with diagrams","journal","answer"),false);
  assert.equal(figureRevisionRequest("Write a journal paper with diagrams","journal","journal"),false);
  assert.equal(figureRevisionRequest("Create a thesis including graphs","thesis","thesis"),false);
  assert.equal(figureRevisionRequest("Add a diagram to this journal paper","journal","journal"),true);
  assert.equal(figureRevisionRequest("Replace figure 1 in my thesis","thesis","thesis"),true);
  assert.equal(figureRevisionRequest("Generate a diagram for this draft","journal","journal"),true);
  assert.equal(figureRevisionRequest("Generate a literature review with a taxonomy diagram","literature","answer"),false);
});

test("journal generation requires developed prose and honest article types, not section-writing advice",()=>{
  assert.match(JOURNAL_DRAFT_INSTRUCTIONS,/actual developed journal manuscript, not an outline/);
  assert.match(JOURNAL_DRAFT_INSTRUCTIONS,/1800–2500/);
  assert.match(JOURNAL_DRAFT_INSTRUCTIONS,/narrative review or a proposed-study manuscript/);
  assert.match(JOURNAL_DRAFT_INSTRUCTIONS,/Do not fabricate measurements/);
});
