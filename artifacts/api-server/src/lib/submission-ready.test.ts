import test from "node:test";
import assert from "node:assert/strict";
import { submissionReady } from "./manuscript-policy";
import { documentBlocks } from "./studio-formatting";
import { mergeSameTitle } from "./manuscript-references";
import { noveltyNotice, noveltyTopic } from "./novelty-check";

test("exports drop tool branding, app notes and the Author review section", () => {
  const md = `# T\n\nArticle type: Narrative review. Author details: Names remain to be supplied by the authors. Manuscript status: Working draft; requirements remain unconfirmed.\n\n## Declarations\n\nPreparation disclosure: Prepared with Evidora assistance.\n\n**AI-use statement:** [Authors to complete]\n\nFunding: None.\n\n## Declaration of generative AI in the writing process\n\nThe authors used a language model.\n\n## References\n\n[1] A. Paper.\n\n## Author review\n\nAI-assisted working draft. Verify sources.`;
  const clean = submissionReady(md);
  assert.doesNotMatch(clean, /Evidora|Manuscript status|Author details/);
  assert.match(clean, /Article type: Narrative review\./);
  assert.doesNotMatch(clean, /AI-use|generative AI|language model|Preparation disclosure/i);
  assert.match(clean, /Funding: None\.[\s\S]*## References/);
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
  assert.match(noveltyNotice({ alreadyDone: [{ what: "dispatch", by: "HOMER Pro" }], openGaps: [], foundations: [], contribution: "Indian C&I data" })!, /1 existing study\/tool .*HOMER Pro.*Indian C&I data/);
});

test("reference list: duplicates merged, only cited works, renumbered by first citation", async () => {
  const { titleKey, citationOrder, renumberCitations, referenceTitle, stripProjectTitles } = await import("./manuscript-references");
  assert.equal(titleKey("A review of distributed generation technologies | Journal of Electrical Systems | Springer Nature Link"), titleKey("A review of distributed generation technologies"));
  assert.equal(titleKey("Optimal sizing of isolated hybrid renewable energy systems in Egypt - ScienceDirect"), titleKey("Optimal sizing of isolated hybrid renewable energy systems in Egypt"));
  const text = "Wind helps [5]. Storage matters [2, 5, 9]. Ranges [3–4].";
  const order = citationOrder([text], 10);
  assert.deepEqual(order, [5, 2, 9, 3, 4]);
  assert.equal(renumberCitations(text, order), "Wind helps [1]. Storage matters [1, 2, 3]. Ranges [4, 5].");
  assert.equal(referenceTitle({ title: "News", url: "https://www.psr-inc.com/news" }), "News (psr-inc.com)");
  const cleaned = stripProjectTitles("Thresholds differ (Dependable Power Generation for Community Microgrids in Azerbaijan). Done.", ["Dependable Power Generation for Community Microgrids in Azerbaijan"]);
  assert.equal(cleaned, "Thresholds differ. Done.");
});

test("figure captions drop rendering notes and pipeline wording", async () => {
  const { readerFigureText } = await import("./scientific-figures");
  const out = readerFigureText("Schematic based on supplied excerpts [17]. It supports the draft's discussion. Numbered stages, scientific pictograms, and a role-colour legend should distinguish inputs.");
  assert.equal(out, "Schematic based on the cited work [17]. It supports this paper's discussion.");
});
