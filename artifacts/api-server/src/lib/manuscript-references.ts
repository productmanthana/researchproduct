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
  if (!s.url || s.title.split(/\s+/).length > 4) return s.title;
  try { return `${s.title.replace(/[.\s]+$/, "")} (${new URL(s.url).hostname.replace(/^www\./, "")})`; } catch { return s.title; }
}

/**
 * DOIs that encode a publication year (World Scientific "10.1142/S0219455428500988" → 2028) should not
 * point years past the recorded publication; such a reference needs checking before submission.
 */
export function implausibleDoiYear(doi: string | undefined, year: number | undefined) {
  const yy = doi?.match(/^(?:https?:\/\/doi\.org\/)?10\.1142\/s\d{4}-?\d{3}[\dx](\d{2})\d/i)?.[1];
  return !!yy && !!year && 2000 + Number(yy) > year + 1;
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
