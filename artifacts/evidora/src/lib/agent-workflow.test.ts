import { test } from "node:test";
import assert from "node:assert/strict";
import { buildWorkflowView, observe, researchWorkflow, studioWorkflow, reviewWorkflow, uploadWorkflow, originalityWorkflow, watchWorkflow } from "./agent-workflow";

const states = (v: ReturnType<typeof buildWorkflowView>) => v.tiles.map(t => t.state);

test("every workflow has exactly five roles", () => {
  const all = [
    researchWorkflow({ id: "a", status: "running", stage: "planning", question: "q", reusedSources: false }),
    studioWorkflow({ id: "s", kind: "thesis", status: "running", title: "t", metadata: {} }),
    reviewWorkflow({ id: "r", status: "running", title: "t", metadata: {} }),
    uploadWorkflow("put", "f.pdf").input, originalityWorkflow("o", "t"),
    watchWorkflow({ projectId: "p", status: "running", patents: false, topic: "t" }),
  ];
  for (const w of all) assert.equal(w.roles.length, 5);
});

test("queued and unknown research stages are indeterminate", () => {
  assert.equal(buildWorkflowView(researchWorkflow({ id: "a", status: "queued", stage: "", question: "q", reusedSources: false })).indeterminate, true);
  assert.equal(buildWorkflowView(researchWorkflow({ id: "a", status: "running", stage: "mystery", question: "q", reusedSources: false })).indeterminate, true);
});

test("only observed earlier stages are completed; unseen earlier ones are not reported", () => {
  const input = researchWorkflow({ id: "a", status: "running", stage: "writing", question: "q", reusedSources: false });
  assert.deepEqual(states(buildWorkflowView(input, ["plan"])), ["done", "unreported", "unreported", "active", "pending"]);
});

test("reused sources mark survey skipped, never done", () => {
  const input = researchWorkflow({ id: "a", status: "running", stage: "reading", question: "q", reusedSources: true });
  assert.deepEqual(states(buildWorkflowView(input, ["plan", "survey"])), ["done", "skipped", "active", "pending", "pending"]);
});

test("studio stages map into five roles and project-only skips survey", () => {
  const w = studioWorkflow({ id: "s", kind: "literature", status: "running", title: "t", metadata: { stage: "Writing Agent · drafting with retrieved evidence", request: { evidenceMode: "project" } } });
  assert.equal(w.active, "write");
  assert.equal(w.skipped?.survey !== undefined, true);
  assert.equal(studioWorkflow({ id: "s", kind: "ideas", status: "running", title: "t", metadata: { stage: "Scientific Figure Agent · validating data and diagrams" } }).active, "figures");
  assert.equal(studioWorkflow({ id: "s", kind: "ideas", status: "queued", title: "t", metadata: { stage: "Queued" } }).active, null);
});

test("review, upload, watch mapping is honest", () => {
  assert.equal(reviewWorkflow({ id: "r", status: "running", title: "t", metadata: { stage: "Scientific Review Agent · checking proposed changes" } }).active, "check");
  const u = uploadWorkflow("complete", "f.pdf");
  assert.deepEqual(states(buildWorkflowView(u.input, u.observed)), ["done", "done", "done", "active", "pending"]);
  const w = buildWorkflowView(watchWorkflow({ projectId: "p", status: "running", patents: false, topic: "t" }));
  assert.equal(w.tiles[2].state, "skipped");
  assert.ok(!w.tiles.some(t => t.state === "done"));
  assert.ok(!/internet|plagiarism score/i.test(originalityWorkflow("o", "t").roles.map(r => r.task).join(" ")));
});

test("observe is idempotent", () => {
  assert.deepEqual(observe(observe([], "plan"), "plan"), ["plan"]);
  assert.deepEqual(observe(["plan"], null), ["plan"]);
});
