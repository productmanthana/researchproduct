// Plagiarism text alignment, modelled on the PAN shared-task pipeline used by
// professional checkers: seeding (exact word 5-grams plus stemmed content-word
// 3-grams that survive inflection and function-word edits), extension (merge
// nearby seeds into passages), filtering (Turnitin-style minimum match length),
// then a sentence-level paraphrase layer confirmed by embeddings.
export type Origin = "project" | "scholarly" | "web";
export type CandidateSource = { title: string; url?: string; origin: Origin; text: string };
export type MatchType = "Identical" | "Minor changes" | "Paraphrased";
export type Passage = { draft: string; source: string; type: MatchType; words: number };
export type SourceMatch = { title: string; url?: string; origin: Origin; percent: number; matchedWords: number; passages: Passage[] };
export type AlignmentResult = {
  wordsChecked: number; matchedWords: number; excludedWords: number;
  similarityPercent: number; originalPercent: number;
  breakdown: { identical: number; minorChanges: number; paraphrased: number };
  sources: SourceMatch[]; notices: string[];
};
/** Cosine similarity for each pair, or null when embeddings are unavailable. */
export type Confirm = (pairs: { a: string; b: string }[]) => Promise<number[] | null>;

/** Matches shorter than this are ignored, as in Turnitin's "exclude small matches". */
export const MIN_MATCH_WORDS = 8;
const EXACT_N = 5, FUZZY_N = 3, MAX_KEY_HITS = 20, GAP_DRAFT = 8, GAP_SOURCE = 16;
const PARAPHRASE_DICE = 0.3, STRONG_DICE = 0.6, PARAPHRASE_COSINE = 0.86, MAX_PAIRS = 300;

const STOP = new Set(("a an the and or but nor of to in on at by for with from into onto as is are was were be been being this that these those it its their there here which who whom whose what when where while than then so such not no can could may might will would shall should do does did has have had also we our us they them he she his her i you your one both each either neither very more most less least other some any all over under between within without through during about after before above below up down out off only same just").split(" "));
const SUFFIXES = ["ational", "ization", "ations", "ation", "ments", "ment", "ness", "ings", "ing", "edly", "ed", "ers", "er", "ly", "es", "s"];
export function stem(word: string) {
  const w = word.replace(/['’]s$/, "");
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  for (const s of SUFFIXES) if (w.length - s.length >= 4 && w.endsWith(s)) return w.slice(0, -s.length);
  return w;
}

type Tok = { w: string; s: string; stop: boolean; start: number; end: number };
export function tokenize(text: string): Tok[] {
  return [...text.matchAll(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu)].map(m => {
    const w = m[0].normalize("NFKC").toLowerCase();
    return { w, s: stem(w), stop: STOP.has(w) || w.length < 3, start: m.index!, end: m.index! + m[0].length };
  });
}

const END_HEADING = /^#{1,3}\s+(?:\d+[.)]?\s+)?(?:References|Bibliography|Literature Cited|Works Cited|Author review)\s*$/im;
const blank = (m: string) => m.replace(/[^\n]/g, " ");
/** Body text with quotations, citations, headings, tables, maths and figure markers blanked (offsets preserved). */
export function checkedText(content: string) {
  const body = content.split(END_HEADING)[0];
  const masked = body
    .replace(/\[\[figure:[^\]]+\]\]/g, blank).replace(/^>.*$/gm, blank).replace(/^#{1,6}.*$/gm, blank)
    .replace(/^\s*\|.*$/gm, blank).replace(/\$\$[\s\S]*?\$\$/g, blank).replace(/\$[^$\n]+\$/g, blank)
    .replace(/“[^”]{0,800}”|"[^"\n]{0,800}"/g, blank).replace(/\[\d+(?:\s*[-–,]\s*\d+)*\]/g, blank)
    .replace(/https?:\/\/\S+/g, blank);
  return { body, masked };
}

/** Sentences as [first, last] token indices; a boundary is .!? before whitespace, or a blank line. */
export function sentences(text: string, toks: Tok[]) {
  const out: [number, number][] = [];
  let first = 0;
  for (let i = 0; i < toks.length; i++) {
    const gap = i + 1 < toks.length ? text.slice(toks[i].end, toks[i + 1].start) : "";
    if (i + 1 === toks.length || /[.!?]["')\]]*\s/.test(gap) || /\n\s*\n/.test(gap)) { out.push([first, i]); first = i + 1; }
  }
  return out;
}

type Seed = { d0: number; d1: number; s0: number; s1: number; exact: boolean };
type Prepared = { source: CandidateSource; text: string; toks: Tok[]; exact: Map<string, number[]>; fuzzy: Map<string, number[]>; content: number[] };

function contentIndex(toks: Tok[]) { const c: number[] = []; toks.forEach((t, i) => { if (!t.stop) c.push(i); }); return c; }
function index(keys: (i: number) => string | null, n: number) {
  const map = new Map<string, number[]>();
  for (let i = 0; i < n; i++) { const k = keys(i); if (k === null) continue; const l = map.get(k) ?? []; l.push(i); map.set(k, l); }
  // Very common grams (boilerplate, a repeated term) are poor evidence of copying.
  for (const [k, l] of map) if (l.length > MAX_KEY_HITS) map.delete(k);
  return map;
}
function prepare(source: CandidateSource): Prepared {
  const text = source.text.split(END_HEADING)[0].slice(0, 200_000), toks = tokenize(text), content = contentIndex(toks);
  return {
    source, text, toks, content,
    exact: index(i => i + EXACT_N <= toks.length ? toks.slice(i, i + EXACT_N).map(t => t.w).join(" ") : null, toks.length),
    fuzzy: index(i => i + FUZZY_N <= content.length ? content.slice(i, i + FUZZY_N).map(j => toks[j].s).join(" ") : null, content.length),
  };
}

function seeds(draft: Tok[], draftContent: number[], src: Prepared) {
  const out: Seed[] = [];
  for (let i = 0; i + EXACT_N <= draft.length; i++)
    for (const j of src.exact.get(draft.slice(i, i + EXACT_N).map(t => t.w).join(" ")) ?? [])
      out.push({ d0: i, d1: i + EXACT_N - 1, s0: j, s1: j + EXACT_N - 1, exact: true });
  for (let i = 0; i + FUZZY_N <= draftContent.length; i++)
    for (const j of src.fuzzy.get(draftContent.slice(i, i + FUZZY_N).map(k => draft[k].s).join(" ")) ?? [])
      out.push({ d0: draftContent[i], d1: draftContent[i + FUZZY_N - 1], s0: src.content[j], s1: src.content[j + FUZZY_N - 1], exact: false });
  return out.sort((a, b) => a.d0 - b.d0 || a.s0 - b.s0);
}

type Cluster = { d0: number; d1: number; s0: number; s1: number; covered: Set<number> };
/** Merges seeds that sit close together in both texts and in the same order. */
export function extend(list: Seed[]) {
  const done: Cluster[] = [];
  let open: Cluster[] = [];
  for (const seed of list) {
    open = open.filter(c => { const alive = seed.d0 - c.d1 <= GAP_DRAFT; if (!alive) done.push(c); return alive; });
    const fit = open.filter(c => seed.s0 >= c.s0 - 4 && Math.abs(seed.s0 - c.s1) <= GAP_SOURCE)
      .sort((a, b) => Math.abs(seed.s0 - a.s1) - Math.abs(seed.s0 - b.s1))[0];
    const target = fit ?? { d0: seed.d0, d1: seed.d1, s0: seed.s0, s1: seed.s1, covered: new Set<number>() };
    if (!fit) open.push(target);
    target.d1 = Math.max(target.d1, seed.d1); target.s1 = Math.max(target.s1, seed.s1);
    for (let i = seed.d0; i <= seed.d1; i++) target.covered.add(i);
  }
  return [...done, ...open];
}

export function dice(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let shared = 0; for (const x of a) if (b.has(x)) shared++;
  return 2 * shared / (a.size + b.size);
}
const span = (text: string, toks: Tok[], a: number, b: number) => text.slice(toks[a].start, toks[b].end).replace(/\s+/g, " ").trim().slice(0, 900);
const pct = (n: number, d: number) => d ? Math.round(n / d * 1000) / 10 : 0;

export async function alignDraft(content: string, candidates: CandidateSource[], confirm?: Confirm): Promise<AlignmentResult> {
  const notices: string[] = [];
  const { body, masked } = checkedText(content);
  const draft = tokenize(masked), draftContent = contentIndex(draft);
  const excludedWords = Math.max(0, tokenize(content).length - draft.length);
  // Identical copies of one source (e.g. the same abstract from two indexes) count once.
  const seen = new Set<string>();
  const prepared = candidates.filter(c => {
    const key = tokenize(c.text.slice(0, 3000)).map(t => t.w).join(" ");
    if (key.length < 40 || seen.has(key)) return false; seen.add(key); return true;
  }).map(prepare);
  const RANK: Record<MatchType, number> = { Identical: 3, "Minor changes": 2, Paraphrased: 1 };
  const owner: { type: MatchType; src: number }[] = new Array(draft.length);
  const claim = (i: number, type: MatchType, src: number) => { if (!owner[i] || RANK[type] > RANK[owner[i].type]) owner[i] = { type, src }; };
  const passages: Passage[][] = prepared.map(() => []);

  prepared.forEach((src, n) => {
    for (const c of extend(seeds(draft, draftContent, src))) {
      const covered = c.covered.size, length = c.d1 - c.d0 + 1;
      if (covered < MIN_MATCH_WORDS || covered / length < 0.6) continue;
      const a = draft.slice(c.d0, c.d1 + 1).map(t => t.w).join(" "), b = src.toks.slice(c.s0, c.s1 + 1).map(t => t.w).join(" ");
      const type: MatchType = a === b || b.includes(a) ? "Identical" : "Minor changes";
      c.covered.forEach(i => claim(i, type, n));
      passages[n].push({ draft: span(body, draft, c.d0, c.d1), source: span(src.text, src.toks, c.s0, c.s1), type, words: covered });
    }
  });

  // Paraphrase layer: sentences that keep most of a source sentence's content
  // words in new order. Strong lexical overlap counts on its own; weaker
  // overlap must be confirmed by semantic similarity.
  const draftSentences = sentences(masked, draft).filter(([a, b]) => b - a + 1 >= MIN_MATCH_WORDS
    && Array.from({ length: b - a + 1 }, (_, k) => owner[a + k]).filter(Boolean).length / (b - a + 1) < 0.5);
  const sourceSentences = prepared.flatMap((src, n) => sentences(src.text, src.toks).filter(([a, b]) => b - a + 1 >= MIN_MATCH_WORDS)
    .map(([a, b]) => ({ n, a, b, set: new Set(src.toks.slice(a, b + 1).filter(t => !t.stop).map(t => t.s)) })));
  const byStem = new Map<string, number[]>();
  sourceSentences.forEach((s, k) => s.set.forEach(x => { const l = byStem.get(x) ?? []; l.push(k); byStem.set(x, l); }));
  const pairs: { d: [number, number]; k: number; score: number }[] = [];
  for (const d of draftSentences) {
    const set = new Set(draft.slice(d[0], d[1] + 1).filter(t => !t.stop).map(t => t.s));
    if (set.size < 6) continue;
    const hits = new Map<number, number>();
    for (const x of set) for (const k of byStem.get(x) ?? []) hits.set(k, (hits.get(k) ?? 0) + 1);
    const best = [...hits].map(([k, shared]) => ({ k, score: 2 * shared / (set.size + sourceSentences[k].set.size) }))
      .filter(h => h.score >= PARAPHRASE_DICE).sort((x, y) => y.score - x.score).slice(0, 2);
    for (const h of best) pairs.push({ d, ...h });
  }
  pairs.sort((x, y) => y.score - x.score);
  const strong = pairs.filter(p => p.score >= STRONG_DICE), weak = pairs.filter(p => p.score < STRONG_DICE).slice(0, MAX_PAIRS);
  let cosines: number[] | null = null;
  if (weak.length && confirm) {
    cosines = await confirm(weak.map(p => {
      const s = sourceSentences[p.k], src = prepared[s.n];
      return { a: span(body, draft, p.d[0], p.d[1]), b: span(src.text, src.toks, s.a, s.b) };
    }));
    if (!cosines) notices.push("Semantic paraphrase confirmation was unavailable; only paraphrases with strong word overlap were counted.");
  }
  const accepted = [...strong, ...weak.filter((_, i) => (cosines?.[i] ?? 0) >= PARAPHRASE_COSINE)];
  const used = new Set<number>();
  for (const p of accepted) {
    if (used.has(p.d[0])) continue; used.add(p.d[0]);
    const s = sourceSentences[p.k], src = prepared[s.n];
    let words = 0;
    for (let i = p.d[0]; i <= p.d[1]; i++) if (!owner[i]) { claim(i, "Paraphrased", s.n); words++; }
    if (words) passages[s.n].push({ draft: span(body, draft, p.d[0], p.d[1]), source: span(src.text, src.toks, s.a, s.b), type: "Paraphrased", words });
  }

  const counts = { Identical: 0, "Minor changes": 0, Paraphrased: 0 } as Record<MatchType, number>;
  const perSource = prepared.map(() => 0);
  owner.forEach(o => { if (o) { counts[o.type]++; perSource[o.src]++; } });
  const matchedWords = counts.Identical + counts["Minor changes"] + counts.Paraphrased, wordsChecked = draft.length;
  const sources = prepared.map((p, n) => ({
    title: p.source.title, url: p.source.url, origin: p.source.origin, matchedWords: perSource[n], percent: pct(perSource[n], wordsChecked),
    passages: passages[n].sort((a, b) => b.words - a.words).slice(0, 6),
  })).filter(s => s.matchedWords > 0).sort((a, b) => b.matchedWords - a.matchedWords).slice(0, 25);
  const similarityPercent = pct(matchedWords, wordsChecked);
  return {
    wordsChecked, matchedWords, excludedWords, similarityPercent, originalPercent: Math.round((100 - similarityPercent) * 10) / 10,
    breakdown: { identical: pct(counts.Identical, wordsChecked), minorChanges: pct(counts["Minor changes"], wordsChecked), paraphrased: pct(counts.Paraphrased, wordsChecked) },
    sources, notices,
  };
}
