import test from "node:test";
import assert from "node:assert/strict";
import { splitChapters, thesisCheckUnits, thesisContents, thesisParts, THESIS_PART_WORDS } from "./thesis-policy";
import { mapLimit } from "./thesis-writer";
import { doiYear, implausibleDoiYear } from "./manuscript-references";
import { stripProcessNotes } from "./process-notes";

test("thesis is planned as eight chapters written in section groups long enough for 150+ pages", () => {
  const chapters = Array.from({ length: 8 }, (_, i) => ({ number: i + 1, title: `Title ${i + 1}`, sections: Array.from({ length: i === 1 ? 12 : 8 }, (_, k) => `${i + 1}.${k + 1} Section ${k + 1}`) }));
  const parts = thesisParts(chapters);
  const words = parts.reduce((n, p) => n + p.words, 0);
  assert.ok(words >= 70000, `planned ${words} words`);
  assert.ok(parts.length >= 20, `${parts.length} parts`);
  assert.ok(parts.every(p => p.words <= THESIS_PART_WORDS + 500), "each part fits one response");
  assert.equal(parts[0].id, "front");
  assert.equal(parts.at(-1)!.id, "appendix");
  const ch2 = parts.filter(p => p.id.startsWith("ch2-"));
  assert.ok(ch2.length >= 4);
  assert.match(ch2[0].brief, /Start with "# Chapter 2: Title 2"/);
  assert.match(ch2[1].brief, /Do NOT repeat the chapter heading/);
  assert.match(ch2.at(-1)!.brief, /## 2\.13 Chapter Summary/);
  // every section is written exactly once
  for (const ch of chapters) for (const s of ch.sections) assert.equal(parts.filter(p => p.brief.includes(`these sections, in order, each with its "## " heading and "### " subsections as needed:`) && p.brief.split("Other parts")[0].includes(s)).length, 1, s);
  assert.doesNotMatch(parts.find(p => p.id.startsWith("ch8-"))!.brief, /Close the chapter/);
});

test("table of contents lists chapters and sections, chapters split for per-chapter checks", () => {
  const doc = "# Declaration by the Candidate\n\nText\n\n# Abstract\n\nA\n\n# Chapter 1: Introduction\n\n## 1.1 Background\n\nB\n\n# Chapter 2: Literature Review\n\n## 2.1 Review Methodology\n\nC";
  const toc = thesisContents(doc);
  assert.match(toc, /- Chapter 1: Introduction\n  - 1\.1 Background/);
  assert.doesNotMatch(toc, /Declaration/);
  assert.equal(splitChapters(doc).length, 4);
});

test("contents adds lists of figures and tables from captions only", () => {
  const doc = "# Chapter 3: Model\n\n**Table 3.1.** Parameters of the case study\n\nTable 3.1 shows the values.\n\nFigure 3.2. Single-line diagram";
  const toc = thesisContents(doc);
  assert.match(toc, /# List of Tables\n\n- Table 3\.1: Parameters of the case study$/m);
  assert.match(toc, /# List of Figures\n\n- Figure 3\.2: Single-line diagram/);
  assert.doesNotMatch(toc, /shows the values/);
});

test("long chapters are checked in section-sized units", () => {
  const para = "word ".repeat(1500);
  const doc = `# Chapter 2: Review\n\n## 2.1 A\n${para}\n## 2.2 B\n${para}\n## 2.3 C\n${para}\n\n# Chapter 3: Model\n\nshort`;
  const units = thesisCheckUnits(doc);
  assert.equal(units.length, 3);
  assert.ok(units[0].startsWith("# Chapter 2"));
  assert.ok(units[1].startsWith("## 2.3"));
  assert.equal(units.join("\n").replace(/\s+/g, " "), doc.replace(/\s+/g, " "));
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
