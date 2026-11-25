import test from "node:test";
import assert from "node:assert/strict";
import { splitChapters, thesisContents, THESIS_PARTS } from "./thesis-policy";
import { mapLimit } from "./thesis-writer";
import { doiYear, implausibleDoiYear } from "./manuscript-references";
import { stripProcessNotes } from "./process-notes";

test("thesis is written in enough parts for 150+ pages and covers every required chapter", () => {
  const words = THESIS_PARTS.reduce((n, p) => n + p.words, 0);
  assert.ok(words >= 60000, `planned ${words} words`);
  for (const ch of ["ch1", "ch2a", "ch2b", "ch3", "ch4", "ch5", "ch6", "ch7", "ch8", "appendix", "front"]) assert.ok(THESIS_PARTS.some(p => p.id === ch));
  assert.ok(THESIS_PARTS.every(p => p.words <= 8000), "each part fits one response");
});

test("table of contents lists chapters and sections, chapters split for per-chapter checks", () => {
  const doc = "# Declaration by the Candidate\n\nText\n\n# Abstract\n\nA\n\n# Chapter 1: Introduction\n\n## 1.1 Background\n\nB\n\n# Chapter 2: Literature Review\n\n## 2.1 Review Methodology\n\nC";
  const toc = thesisContents(doc);
  assert.match(toc, /- Chapter 1: Introduction\n  - 1\.1 Background/);
  assert.doesNotMatch(toc, /Declaration/);
  assert.equal(splitChapters(doc).length, 4);
});

test("mapLimit keeps order and bounds concurrency", async () => {
  let live = 0, peak = 0;
  const out = await mapLimit([1, 2, 3, 4, 5], 2, async n => { live++; peak = Math.max(peak, live); await new Promise(r => setTimeout(r, 5)); live--; return n * 2; });
  assert.deepEqual(out, [2, 4, 6, 8, 10]);
  assert.ok(peak <= 2);
});

test("a later DOI year marks the published version of a preprint record", () => {
  assert.equal(doiYear("10.3389/frai.2026.1891798"), 2026);
  assert.equal(doiYear("10.1016/j.egyai.2026.100938"), 2026);
  assert.equal(doiYear("10.20944/preprints202611.0619.v1"), 2026);
  assert.equal(doiYear("10.3390/en19215172"), undefined);
  assert.ok(implausibleDoiYear("10.3389/frai.2026.1891798", 2023));
  assert.ok(!implausibleDoiYear("10.1016/j.egyai.2026.100938", 2026));
});

test("drafting leftovers flagged by reviewers are removed from prose", () => {
  const text = "The design pairs each policy with one realisation. The account provides no dataset (“project literature: Empirical Assessment of Co-Located Wind–Solar Generation”). The comparison is especially limited by search-excerpt access. Results follow.";
  const out = stripProcessNotes(text);
  assert.doesNotMatch(out, /project literature|search-excerpt/);
  assert.match(out, /pairs each policy/);
  assert.match(out, /Results follow\./);
});
