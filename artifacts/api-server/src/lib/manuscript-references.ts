import type { EvidenceSource } from "./evidence";

/**
 * Reference-list hygiene for exported manuscripts: one entry per work, only works the text cites,
 * numbered in order of first citation, and no traces of the author's own project drafts.
 */

/** Same work under web-page and catalogue titles ("Title | Journal | Springer Nature Link", "Title - ScienceDirect"). */
export function titleKey(title: string) {
  let t = title.split(/\s+\|\s+/)[0];
  const site = t.match(/^(.*\S)\s+[-–]\s+[^-–]{2,70}$/);
  if (site && site[1].split(/\s+/).length >= 6) t = site[1];
  return t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function mergeSameTitle(list: EvidenceSource[]): EvidenceSource[] {
  const out: EvidenceSource[] = [];
  for (const s of list) {
    const same = out.find(o => titleKey(o.title) === titleKey(s.title));
    if (!same) { out.push(s); continue; }
    if (s.text && !same.text.includes(s.text.slice(0, 200))) same.text = `${same.text}\n\n${s.text}`.slice(0, 9000);
    if (!same.url && s.url) same.url = s.url;
  }
  return out;
}

const GROUP = /\[(\d+(?:\s*[,–-]\s*\d+)*)\]/g;
const expand = (group: string) => group.split(/\s*,\s*/).flatMap(part => {
  const [a, b] = part.split(/\s*[–-]\s*/).map(Number);
  return b && b > a && b - a < 30 ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [a];
});

/** Original reference numbers in order of first citation across the given texts. */
export function citationOrder(texts: string[], total: number) {
  const order: number[] = [];
  for (const text of texts) for (const m of text.matchAll(GROUP))
    for (const n of expand(m[1])) if (n >= 1 && n <= total && !order.includes(n)) order.push(n);
  return order;
}

/** Rewrites citation groups to the new numbering; numbers outside `order` are dropped. */
export function renumberCitations(text: string, order: number[]) {
  return text.replace(GROUP, (whole, group: string) => {
    const mapped = [...new Set(expand(group).map(n => order.indexOf(n) + 1).filter(n => n > 0))].sort((a, b) => a - b);
    return mapped.length ? `[${mapped.join(", ")}]` : whole;
  });
}

/** Web pages titled only "News" or "Findings from the Pilot Project" need their site to be identifiable. */
export function referenceTitle(s: { title: string; url: string }) {
  const title = cleanReferenceTitle(s.title);
  if (!s.url || title.split(/\s+/).length > 4) return title;
  try { return `${title} (${new URL(s.url).hostname.replace(/^www\./, "")})`; } catch { return title; }
}

/**
 * DOIs that encode a publication year (World Scientific "10.1142/S0219455428500988" → 2028) should not
 * point years past the recorded publication; such a reference needs checking before submission.
 */
/** Publication year a DOI encodes (World Scientific "s…yy…", or a ".2026." / "preprints2026…" segment), if any. */
export function doiYear(doi: string | undefined) {
  const yy = doi?.match(/^(?:https?:\/\/doi\.org\/)?10\.1142\/s\d{4}-?\d{3}[\dx](\d{2})\d/i)?.[1];
  if (yy) return 2000 + Number(yy);
  const full = doi?.match(/^(?:https?:\/\/doi\.org\/)?10\.\d+\/(?:[a-z]+\.)*?(?:[a-z]+\.|preprints)(20\d{2})(?=[.\d])/i)?.[1];
  return full ? Number(full) : undefined;
}
export function implausibleDoiYear(doi: string | undefined, year: number | undefined) {
  const y = doiYear(doi);
  return !!y && !!year && y > year + 1;
}

const SMALL = new Set(["a","an","and","as","at","by","for","from","in","into","of","on","or","the","to","under","using","via","with","without"]);

/** Catalogue titles arrive as "R$^2$Energy", "FRAMEWORK FOR …" or "Framework.." — print them as a journal would. */
export function cleanReferenceTitle(title: string) {
  const sup: Record<string, string> = { "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹" };
  let t = title
    .replace(/\$\^\{?(\d)\}?\$/g, (_, d: string) => sup[d])
    .replace(/\$_\{?(\d)\}?\$/g, (_, d: string) => "₀₁₂₃₄₅₆₇₈₉"[Number(d)])
    .replace(/\$([^$]*)\$/g, "$1")
    .replace(/[.\s]+$/, "").trim();
  // All-capitals titles: sentence case, keeping acronyms without vowels (CNN, PV, LSTM) in capitals.
  if (t.length > 20 && !/[a-z]/.test(t)) {
    t = t.replace(/[A-Z]+/g, w => (w.length <= 2 && !SMALL.has(w.toLowerCase())) || !/[AEIOUY]/.test(w) ? w : w.toLowerCase());
    t = t.charAt(0).toUpperCase() + t.slice(1);
  }
  return t;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The author's other drafts are unpublished: remove parenthetical or quoted mentions of their titles. */
export function stripProjectTitles(content: string, titles: string[]) {
  let out = content;
  for (const title of titles.map(t => t.trim()).filter(t => t.split(/\s+/).length >= 4)) {
    const t = escape(title);
    out = out
      .replace(new RegExp(`\\s*\\((?:[^()]{0,40}:\\s*)?[“"]?${t}[”"]?\\)`, "gi"), "")
      .replace(new RegExp(`[“"]${t}[”"]`, "gi"), "the proposed study");
  }
  return out;
}
