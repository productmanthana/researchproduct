// Deterministic stylometric screen for machine-like academic prose. It measures
// properties that separate first-draft human writing from generated text
// (rhythm variation, stock phrasing, templated openers) and names the exact
// sentences responsible, so they can be revised one by one.

export const STOCK_PHRASES = [
  "delve", "delves", "delving", "underscore", "underscores", "underscoring", "pivotal", "tapestry", "landscape of", "realm",
  "it is important to note", "it is worth noting", "it is worth mentioning", "plays a crucial role", "plays a significant role",
  "plays a vital role", "plays a pivotal role", "a testament to", "in today's", "rapidly evolving", "ever-evolving", "not only",
  "shed light", "sheds light", "paving the way", "paves the way", "holistic", "multifaceted", "intricate", "seamless", "seamlessly",
  "robust framework", "navigate the complexities", "the complexities of", "a myriad of", "myriad", "in the realm of",
  "crucial insights", "valuable insights", "serves as a", "highlighting the importance", "harness the power", "unlock",
  "game-changer", "cutting-edge", "groundbreaking", "comprehensive understanding", "foster", "fostering", "nuanced",
];
export const STOCK_OPENERS = [
  "moreover", "furthermore", "additionally", "in addition", "consequently", "overall", "in conclusion", "notably",
  "importantly", "ultimately", "in summary", "to summarize", "in essence", "thus", "hence", "indeed", "interestingly",
];

export type FlaggedSentence = { sentence: string; reasons: string[] };
export type StyleMetrics = {
  score: number;
  words: number;
  sentences: number;
  measures: { label: string; value: string; score: number; note: string }[];
  flagged: FlaggedSentence[];
};

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const wordCount = (s: string) => (s.match(/[A-Za-z][A-Za-z'-]*/g) ?? []).length;
const cv = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
  return mean ? sd / mean : 0;
};

/** Prose paragraphs only: no headings, tables, lists, equations, figures or references. */
export function proseParagraphs(content: string) {
  const body = content.replace(/^#{1,3}\s+(?:References|Bibliography|Works cited)\b[\s\S]*$/im, "")
    .replace(/\$\$[\s\S]*?\$\$/g, " ").replace(/```[\s\S]*?```/g, " ");
  return body.split(/\n\s*\n/).map(p => p.trim())
    .filter(p => p && !/^(#|\||[-*+] |\d+\.\s|>|\[\[figure:|Page \d+$)/.test(p))
    .map(p => p.replace(/\[\[figure:[^\]]+\]\]/g, "").replace(/\s+/g, " ").trim())
    .filter(p => wordCount(p) >= 12);
}

export function splitSentences(paragraph: string) {
  return paragraph.split(/(?<=[.!?])\s+(?=["'(\[]?[A-Z0-9])/).map(s => s.trim()).filter(s => wordCount(s) >= 3);
}

const opener = (s: string) => {
  const lower = s.toLowerCase();
  return STOCK_OPENERS.find(o => lower.startsWith(o + ",") || lower.startsWith(o + " "));
};
const phrasesIn = (s: string) => {
  const lower = ` ${s.toLowerCase()} `;
  return STOCK_PHRASES.filter(p => new RegExp(`[^a-z]${p.replace(/[-']/g, "\\$&")}[^a-z]`).test(lower));
};

export function measureStyle(content: string): StyleMetrics {
  const paragraphs = proseParagraphs(content);
  const sentences = paragraphs.flatMap(splitSentences);
  const lens = sentences.map(wordCount);
  const words = lens.reduce((a, b) => a + b, 0);
  const flags = new Map<string, Set<string>>();
  const flag = (s: string, r: string) => { const set = flags.get(s) ?? new Set(); set.add(r); flags.set(s, set); };

  // 1. Sentence rhythm (burstiness): generated prose keeps sentences a similar length.
  const sentenceCv = cv(lens);
  for (let i = 0; i + 4 <= lens.length; i++) {
    const w = lens.slice(i, i + 4), mean = w.reduce((a, b) => a + b, 0) / 4;
    if (w.every(n => Math.abs(n - mean) <= mean * 0.18)) sentences.slice(i, i + 4).forEach(s => flag(s, "uniform sentence length with its neighbours"));
  }
  // 2. Paragraph rhythm.
  const paragraphCv = cv(paragraphs.map(wordCount));
  // 3. Stock vocabulary density per 1,000 words.
  let stockHits = 0;
  for (const s of sentences) for (const p of phrasesIn(s)) { stockHits++; flag(s, `stock phrase "${p}"`); }
  const stockDensity = words ? stockHits / words * 1000 : 0;
  // 4. Stock transition openers.
  let openerHits = 0;
  for (const s of sentences) { const o = opener(s); if (o) { openerHits++; flag(s, `formulaic opener "${o[0].toUpperCase() + o.slice(1)}"`); } }
  const openerRatio = sentences.length ? openerHits / sentences.length : 0;
  // 5. Repeated paragraph openings (templated sections).
  const firstWords = paragraphs.map(p => p.split(/\s+/).slice(0, 2).join(" ").toLowerCase().replace(/[^a-z ]/g, ""));
  const counts = new Map<string, number>();
  firstWords.forEach(w => counts.set(w, (counts.get(w) ?? 0) + 1));
  const repeated = firstWords.filter(w => (counts.get(w) ?? 0) > 1).length;
  const repeatRatio = paragraphs.length ? repeated / paragraphs.length : 0;
  paragraphs.forEach((p, i) => { if ((counts.get(firstWords[i]) ?? 0) > 2) flag(splitSentences(p)[0] ?? p, "paragraph opens the same way as several others"); });

  const measures = [
    { label: "Sentence rhythm", value: sentenceCv.toFixed(2), score: clamp((sentenceCv - 0.28) / 0.22), weight: 0.3, note: "Variation in sentence length; human drafts usually exceed 0.50." },
    { label: "Paragraph rhythm", value: paragraphCv.toFixed(2), score: clamp((paragraphCv - 0.18) / 0.22), weight: 0.15, note: "Variation in paragraph length; uneven emphasis reads as human." },
    { label: "Stock phrasing", value: `${stockDensity.toFixed(1)}/1k words`, score: clamp(1 - stockDensity / 2.5), weight: 0.25, note: "Phrases common in generated prose (\"delve\", \"plays a crucial role\")." },
    { label: "Formulaic openers", value: `${(openerRatio * 100).toFixed(0)}% of sentences`, score: clamp(1 - (openerRatio - 0.03) / 0.1), weight: 0.2, note: "Sentences opening with \"Moreover\", \"Furthermore\", \"Overall\" and similar." },
    { label: "Templated paragraphs", value: `${(repeatRatio * 100).toFixed(0)}% of paragraphs`, score: clamp(1 - repeatRatio * 2), weight: 0.1, note: "Paragraphs that start with the same words." },
  ];
  const score = sentences.length < 6 ? 100 : Math.round(measures.reduce((a, m) => a + m.score * m.weight, 0) * 1000) / 10;
  return {
    score, words, sentences: sentences.length,
    measures: measures.map(({ weight: _w, ...m }) => ({ ...m, score: Math.round(m.score * 100) })),
    flagged: [...flags].map(([sentence, reasons]) => ({ sentence, reasons: [...reasons] })).slice(0, 60),
  };
}
