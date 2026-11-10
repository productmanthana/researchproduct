import test from "node:test";
import assert from "node:assert/strict";
import { figureRevisionRequest, JOURNAL_DRAFT_INSTRUCTIONS } from "./manuscript-policy";

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
