import type { StudioItem } from "@workspace/api-client-react";

export type SuggestionSeverity = "issue" | "evidence" | "style" | "visual";
export type SuggestionDecision = "pending" | "approved" | "dismissed";
export type ReviewSuggestion = {
  id: string; type: "text" | "diagram"; severity: SuggestionSeverity; title: string; explanation: string;
  originalText: string; proposedText: string; sourceIds: string[]; imageId?: string; canApply: boolean;
  decision: SuggestionDecision; start?: number; end?: number; figure?: Record<string, unknown>;
};
export type ReviewSource = { id: string; title: string; url: string; text: string; evidenceLevel: string };
export type ReviewCoverage = { textCharacters: number; totalTextCharacters: number; visualsReviewed: number; visualsAvailable: number; visualLabels: string[]; scope: string };
export type PatentStatus = { available: boolean; message: string; links: { label: string; url: string }[] };

export const SEVERITY_LABEL: Record<SuggestionSeverity, string> = { issue: "Issue", evidence: "Evidence", style: "Style", visual: "Visual" };
export const DECISION_LABEL: Record<SuggestionDecision, string> = { pending: "Awaiting your decision", approved: "Approved", dismissed: "Dismissed" };
export const REVIEW_KIND = "document-review";

const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const SEV = new Set(["issue", "evidence", "style", "visual"]);
const DEC = new Set(["pending", "approved", "dismissed"]);

export function reviewOf(item?: StudioItem | null) {
  const m = obj(item?.metadata);
  const cov = obj(m.reviewCoverage);
  const pat = obj(m.patentStatus);
  const suggestions: ReviewSuggestion[] = arr(m.reviewSuggestions).map(obj).filter(s => typeof s.id === "string").map(s => ({
    id: s.id as string,
    type: s.type === "diagram" ? "diagram" : "text",
    severity: (SEV.has(str(s.severity)) ? s.severity : "issue") as SuggestionSeverity,
    title: str(s.title, "Suggested change"), explanation: str(s.explanation), originalText: str(s.originalText), proposedText: str(s.proposedText),
    sourceIds: arr(s.sourceIds).filter((x): x is string => typeof x === "string"),
    imageId: typeof s.imageId === "string" ? s.imageId : undefined,
    canApply: s.canApply === true,
    decision: (DEC.has(str(s.decision)) ? s.decision : "pending") as SuggestionDecision,
    start: typeof s.start === "number" ? s.start : undefined, end: typeof s.end === "number" ? s.end : undefined,
    figure: s.figure && typeof s.figure === "object" ? obj(s.figure) : undefined,
  }));
  return {
    documentId: str(m.documentId), originalName: str(m.originalName, item?.title ?? "Document"),
    currentDraftId: typeof m.currentDraftId === "string" && m.currentDraftId ? m.currentDraftId : null,
    coverage: {
      textCharacters: num(cov.textCharacters), totalTextCharacters: num(cov.totalTextCharacters),
      visualsReviewed: num(cov.visualsReviewed), visualsAvailable: num(cov.visualsAvailable),
      visualLabels: arr(cov.visualLabels).filter((x): x is string => typeof x === "string"), scope: str(cov.scope),
    } as ReviewCoverage,
    warnings: arr(m.reviewWarnings).filter((x): x is string => typeof x === "string"),
    patent: { available: pat.available === true, message: str(pat.message), links: arr(pat.links).map(obj).filter(l => typeof l.url === "string").map(l => ({ label: str(l.label, str(l.url)), url: str(l.url) })) } as PatentStatus,
    sources: arr(m.reviewSources).map(obj).filter(s => typeof s.id === "string").map(s => ({ id: s.id as string, title: str(s.title, "Untitled source"), url: str(s.url), text: str(s.text), evidenceLevel: str(s.evidenceLevel) })) as ReviewSource[],
    suggestions,
  };
}

/** Parses "1, 3, 5-7" into unique page numbers (1-50). Returns an error string when invalid. */
export function parsePages(input: string): { pages?: number[]; error?: string } {
  const t = input.trim();
  if (!t) return {};
  const out = new Set<number>();
  for (const part of t.split(/[,\s]+/).filter(Boolean)) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!m) return { error: `"${part}" is not a page number or range.` };
    const a = Number(m[1]); const b = m[2] ? Number(m[2]) : a;
    if (a < 1 || b > 50 || b < a) return { error: "Pages must be between 1 and 50." };
    for (let p = a; p <= b; p++) out.add(p);
  }
  if (out.size > 12) return { error: "Choose at most 12 pages per review." };
  return { pages: [...out].sort((x, y) => x - y) };
}

export type Range = { start: number; end: number; s: ReviewSuggestion };
/** Exact-match quote ranges within one text block; never overlapping. */
export function quoteRanges(text: string, suggestions: ReviewSuggestion[], taken: Set<string>): Range[] {
  const out: Range[] = [];
  for (const s of suggestions) {
    if (s.type !== "text" || taken.has(s.id)) continue;
    const q = s.originalText.trim();
    if (q.length < 6) continue;
    const at = text.indexOf(q);
    if (at < 0) continue;
    const r = { start: at, end: at + q.length, s };
    if (out.some(o => r.start < o.end && o.start < r.end)) continue;
    out.push(r); taken.add(s.id);
  }
  return out.sort((a, b) => a.start - b.start);
}
