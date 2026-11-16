import test from "node:test";
import assert from "node:assert/strict";
import { submissionReady } from "./manuscript-policy";
import { documentBlocks } from "./studio-formatting";
import { mergeSameTitle } from "./studio-worker";
import { noveltyNotice, noveltyTopic } from "./novelty-check";

test("exports drop tool branding, app notes and the Author review section", () => {
  const md = `# T\n\nArticle type: Narrative review. Author details: Names remain to be supplied by the authors. Manuscript status: Working draft; requirements remain unconfirmed.\n\n## Declarations\n\nPreparation disclosure: Prepared with Evidora assistance.\n\n## References\n\n[1] A. Paper.\n\n## Author review\n\nAI-assisted working draft. Verify sources.`;
  const clean = submissionReady(md);
  assert.doesNotMatch(clean, /Evidora|Manuscript status|Author details/);
  assert.match(clean, /Article type: Narrative review\./);
  assert.match(clean, /AI-use statement: \[Authors to complete/);
  const text = JSON.stringify(documentBlocks(md));
  assert.doesNotMatch(text, /Author review|AI-assisted working draft|Evidora/);
  assert.match(text, /\[1\] A\. Paper\./);
});

test("duplicate records of one work share a single reference", () => {
  const s = (id: string, title: string, text: string) => ({ id, title, url: "", text, evidenceLevel: "x", page: null });
  const merged = mergeSameTitle([s("a", "Mathematical Modeling and Optimization.", "one"), s("b", "Mathematical modeling and optimization", "two"), s("c", "Other", "three")]);
  assert.equal(merged.length, 2);
  assert.match(merged[0].text, /one[\s\S]*two/);
});

test("novelty topic and notice", () => {
  assert.equal(noveltyTopic("Power system generation. Target length: about 5,000 words"), "Power system generation.");
  assert.match(noveltyNotice({ alreadyDone: [{ what: "dispatch", by: "HOMER Pro" }], openGaps: [], contribution: "Indian C&I data" })!, /1 existing study\/tool .*HOMER Pro.*Indian C&I data/);
});
