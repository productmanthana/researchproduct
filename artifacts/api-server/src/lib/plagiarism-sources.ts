// Candidate retrieval for the plagiarism check (the "source retrieval" stage of
// the PAN pipeline): keyword queries per document chunk against the scholarly
// index, open-access full text for the closest hits, and Internet searches for
// the draft's most distinctive sentences.
import { openAlex, fromOpenAlex, type Paper } from "./catalogue";
import { retrieveFullText } from "./open-full-text";
import { searchWeb } from "./web-evidence";
import { checkedText, sentences, tokenize, type CandidateSource } from "./plagiarism-align";
import { logger } from "./logger";

const KEYWORD_QUERIES = 6, WORKS_PER_QUERY = 15, ABSTRACTS = 40, FULL_TEXTS = 4, WEB_QUERIES = 4;

const within = <T,>(work: Promise<T>, ms: number, fallback: T) =>
  Promise.race([work.catch(() => fallback), new Promise<T>(r => setTimeout(() => r(fallback), ms))]);

function chunks<T>(list: T[], n: number) {
  const size = Math.ceil(list.length / n) || 1;
  return Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, (i + 1) * size));
}

/** One query per document chunk: its most frequent content words (PAN-style keyword queries). */
export function keywordQueries(masked: string, title: string) {
  const toks = tokenize(masked), sents = sentences(masked, toks);
  const queries = chunks(sents, KEYWORD_QUERIES).map(group => {
    const freq = new Map<string, { word: string; n: number }>();
    for (const [a, b] of group) for (const t of toks.slice(a, b + 1)) {
      if (t.stop || t.w.length < 4 || /^\d+$/.test(t.w)) continue;
      const e = freq.get(t.s) ?? { word: t.w, n: 0 }; e.n++; freq.set(t.s, e);
    }
    return [...freq.values()].sort((x, y) => y.n - x.n).slice(0, 7).map(e => e.word).join(" ");
  });
  return [...new Set([title.replace(/[#*_`]/g, "").trim(), ...queries].filter(q => q.split(" ").length >= 2))];
}

/** Distinctive sentences (long, rare-looking words), spread across the draft. */
export function distinctiveSentences(masked: string) {
  const toks = tokenize(masked);
  const scored = sentences(masked, toks).filter(([a, b]) => b - a + 1 >= 12 && b - a + 1 <= 45).map(([a, b]) => ({
    text: masked.slice(toks[a].start, toks[b].end).replace(/\s+/g, " ").trim(),
    score: toks.slice(a, b + 1).filter(t => !t.stop && t.w.length >= 7).length,
  }));
  return chunks(scored, WEB_QUERIES).map(g => g.sort((x, y) => y.score - x.score)[0]?.text).filter((s): s is string => !!s);
}

function overlap(text: string, grams: Set<string>) {
  const c = tokenize(text).filter(t => !t.stop);
  let n = 0; for (let i = 0; i + 3 <= c.length; i++) if (grams.has(c[i].s + " " + c[i + 1].s + " " + c[i + 2].s)) n++;
  return n;
}

export async function findCandidates(content: string, title: string, owner?: string) {
  const { masked } = checkedText(content), notices: string[] = [];
  const c = tokenize(masked).filter(t => !t.stop), grams = new Set<string>();
  for (let i = 0; i + 3 <= c.length; i++) grams.add(c[i].s + " " + c[i + 1].s + " " + c[i + 2].s);

  // Scholarly index: keyword queries, ranked by shared content-word trigrams.
  const results = await Promise.allSettled(keywordQueries(masked, title).map(q =>
    within(openAlex(`works?${new URLSearchParams({ search: q, "per-page": String(WORKS_PER_QUERY) })}`), 20_000, { results: [] })));
  const papers = new Map<string, Paper>();
  for (const r of results) if (r.status === "fulfilled") for (const w of r.value?.results ?? []) {
    const p = fromOpenAlex(w); if (p.abstract && !papers.has(p.id)) papers.set(p.id, p);
  }
  if (!papers.size) notices.push("The scholarly index returned no comparable abstracts.");
  const ranked = [...papers.values()].map(p => ({ p, score: overlap(p.abstract, grams) })).sort((a, b) => b.score - a.score);
  const abstracts: CandidateSource[] = ranked.slice(0, ABSTRACTS).map(({ p }) => ({ title: `${p.title}${p.year ? ` (${p.year})` : ""}`, url: p.url, origin: "scholarly", text: p.abstract }));

  // Full text of the closest open-access papers.
  const full = await Promise.allSettled(ranked.filter(r => r.p.isOa && r.score > 0).slice(0, FULL_TEXTS).map(async ({ p }) => {
    const r: any = await within<any>(retrieveFullText(p), 30_000, {});
    return r?.pages?.length ? { title: `${p.title} (open-access full text)`, url: r.url ?? p.url, origin: "scholarly", text: r.pages.map((x: any) => x.text).join("\n\n") } as CandidateSource : null;
  }));
  const fullTexts = full.flatMap(r => r.status === "fulfilled" && r.value ? [r.value] : []);

  // Internet: exact-sentence searches surface copies on web pages and repositories.
  const web: CandidateSource[] = [];
  if (owner) for (const sentence of distinctiveSentences(masked)) {
    const r = await within(searchWeb(sentence, owner), 60_000, null);
    if (!r) { notices.push("An Internet search timed out."); continue; }
    if (r.status !== "ready" && r.status !== "empty") { notices.push(r.message); break; }
    for (const x of r.results) if (!web.some(w => w.url === x.url)) web.push({ title: x.title, url: x.url, origin: "web", text: x.text });
  }
  else notices.push("Internet search needs a signed-in owner; it was skipped.");
  logger.info({ abstracts: abstracts.length, fullTexts: fullTexts.length, web: web.length }, "Plagiarism candidates retrieved");
  return { sources: [...fullTexts, ...abstracts, ...web], searched: { scholarly: abstracts.length, fullText: fullTexts.length, web: web.length }, notices: [...new Set(notices)] };
}
