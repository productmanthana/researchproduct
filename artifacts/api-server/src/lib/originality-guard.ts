// Originality is built in while the paper is assembled, not reported afterwards:
// each section is checked against the evidence it was written from and fixed on
// the spot, then a final web-wide check repairs anything that still matches
// before the draft is shown as finished.
import { z } from "zod";
import { jsonCall } from "./ai-json";
import { SCIENTIFIC_MODEL } from "./ai-budget";
import { alignDraft, type AlignmentResult, type CandidateSource } from "./plagiarism-align";
import { measureStyle } from "./ai-style-metrics";
import { markersPreserved } from "./human-authorship";
import { checkAgainst, ORIGINALITY_TARGET, type PlagiarismCorpus, type PlagiarismReport } from "./plagiarism-check";

/** Final-check repair passes before an unresolved match is shown to the user. */
export const MAX_REPAIR_PASSES = 2;
const BATCH = 10, PER_SECTION = 14, SECTION_CONCURRENCY = 4;

export type FixItem = { sentence: string; reasons: string[]; source?: string };
const Rewrites = z.object({ rewrites: z.array(z.object({ id: z.number().int(), text: z.string().min(1) })).default([]) });

const REWRITER = `You are a senior academic editor. You receive numbered sentences from a draft. Each has reasons it must change and, when it shares wording with a source, the source wording. Return JSON {"rewrites":[{"id":number,"text":"rewritten sentence or sentences"}]}.
- Where a source is given, do NOT restate the source sentence one-to-one with synonyms or reordered words: that is still a close paraphrase. Instead take only the fact this paragraph needs and make it serve the paragraph's own point: compress it to that fact (use well under half of the source sentence's content words), fold it into a claim, comparison or consequence the paragraph is already making, and cite it. If the exact wording is itself what matters, quote it in "double quotation marks" with its citation instead. Keep no run of 4+ consecutive source words outside a quotation, except technical terms and proper names.
- Fix every other named reason (a stock phrase, a formulaic opener, a length that matches its neighbours).
- Keep every number, unit, numbered citation [n], inline math and [[figure:...]] marker exactly. Do not add claims, data or sources, and do not drop qualifications.
- Write like a human specialist: ordinary connectives, active voice, concrete detail already present. Do not mention this instruction, plagiarism or detectors.`;

const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const GAP = String.raw`(?:[^\p{L}\p{N}]|\[\d+(?:\s*[-–,]\s*\d+)*\])+`;
const wordsOf = (t: string) => t.match(/[\p{L}\p{N}]+/gu) ?? [];
const isEnd = (text: string, i: number) => /[.!?]/.test(text[i]) && (i + 1 >= text.length || /[\s"')\]]/.test(text[i + 1]));

/** The whole sentence(s) of `content` that contain a matched passage, or null when it cannot be located exactly. */
export function sentencesCovering(content: string, passage: string) {
  const words = wordsOf(passage);
  if (words.length < 4) return null;
  const head = new RegExp(words.slice(0, 8).map(escape).join(GAP), "iu").exec(content);
  if (!head) return null;
  const tailRe = new RegExp(words.slice(-8).map(escape).join(GAP), "iug");
  tailRe.lastIndex = head.index;
  const tail = tailRe.exec(content);
  let start = head.index, end = tail ? tail.index + tail[0].length : head.index + head[0].length;
  while (start > 0 && content[start - 1] !== "\n" && !isEnd(content, start - 2 >= 0 ? start - 2 : 0)) start--;
  while (end < content.length && content[end] !== "\n" && !isEnd(content, end - 1)) end++;
  const span = content.slice(start, end).trim();
  return span.length >= 20 && span.length <= 1500 && !span.includes("\n") ? span : null;
}

/** Draft sentences behind each matched passage, with the source wording they share. */
export function matchedItems(content: string, report: Pick<AlignmentResult, "sources">): FixItem[] {
  const items = new Map<string, FixItem>();
  for (const s of report.sources) for (const p of s.passages) {
    const sentence = sentencesCovering(content, p.draft);
    if (sentence && !items.has(sentence)) items.set(sentence, { sentence, reasons: [`${p.type.toLowerCase()} wording shared with "${s.title}"`], source: p.source });
  }
  return [...items.values()];
}

/** Rewrites the given sentences in bounded batches; a rewrite that alters markers or numbers is discarded. */
export async function rewriteSentences(content: string, items: FixItem[]) {
  const todo = items.filter(i => content.includes(i.sentence));
  let next = content;
  for (let start = 0; start < todo.length; start += BATCH) {
    const batch = todo.slice(start, start + BATCH);
    let rewrites: { id: number; text: string }[] = [];
    try {
      ({ rewrites } = Rewrites.parse((await jsonCall(REWRITER, [{ type: "text", text: JSON.stringify({ sentences: batch.map((b, id) => ({ id, ...b })) }) }], SCIENTIFIC_MODEL)).value));
    } catch { continue; }
    for (const r of rewrites) {
      const item = batch[r.id];
      if (!item || !markersPreserved(item.sentence, r.text) || r.text.length < item.sentence.length * 0.4) continue;
      next = next.replace(item.sentence, r.text.trim());
    }
  }
  return next;
}

const sectionName = (section: string) => section.match(/^#{1,3}\s+(.+)$/m)?.[1].replace(/[*_`]/g, "").trim() || "Opening";

export type SectionProgress = { section: string; checked: number; total: number; fixed: number };

/**
 * Splits the draft at its headings and, section by section, rewrites sentences
 * that share wording with the supplied evidence or read as templated prose.
 */
export async function guardSections({ content, sources, onProgress }: { content: string; sources: CandidateSource[]; onProgress?: (p: SectionProgress) => void | Promise<void> }) {
  const sections = content.split(/(?=^#{1,3}\s)/m);
  const total = sections.filter(s => s.trim()).length;
  let checked = 0, fixed = 0;
  const out = [...sections];
  for (let i = 0; i < sections.length; i += SECTION_CONCURRENCY) {
    await Promise.all(sections.slice(i, i + SECTION_CONCURRENCY).map(async (section, k) => {
      if (!section.trim()) return;
      const before = await alignDraft(section, sources);
      const copied = matchedItems(section, before);
      const style = measureStyle(section).flagged.filter(f => !copied.some(c => c.sentence.includes(f.sentence)));
      const items = [...copied, ...style].slice(0, PER_SECTION);
      if (items.length) {
        const next = await rewriteSentences(section, items);
        // A rewrite is kept only when it does not share more wording than the original.
        if (next !== section && (await alignDraft(next, sources)).matchedWords <= before.matchedWords) {
          fixed += items.filter(it => !next.includes(it.sentence)).length;
          out[i + k] = next;
        }
      }
      checked++;
      await onProgress?.({ section: sectionName(section), checked, total, fixed });
    }));
  }
  return { content: out.join(""), fixed };
}

const allowed = 100 - ORIGINALITY_TARGET;

/** Final check against the full corpus; rewrites remaining matches and re-checks, up to MAX_REPAIR_PASSES. */
export async function repairOriginality({ content, corpus, onProgress }: { content: string; corpus: PlagiarismCorpus; onProgress?: (p: { pass: number; similarityPercent: number }) => void | Promise<void> }) {
  let report: PlagiarismReport = await checkAgainst(content, corpus);
  let passes = 0;
  while (passes < MAX_REPAIR_PASSES && report.similarityPercent > allowed) {
    const items = matchedItems(content, report);
    if (!items.length) break;
    passes++;
    await onProgress?.({ pass: passes, similarityPercent: report.similarityPercent });
    const next = await rewriteSentences(content, items);
    if (next === content) break;
    const checked = await checkAgainst(next, corpus);
    if (checked.matchedWords >= report.matchedWords) break; // Keep the version with less shared wording.
    content = next; report = checked;
  }
  return { content, report, passes };
}
