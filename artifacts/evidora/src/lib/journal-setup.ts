import type { CustomFormat, DocumentDetails } from "@workspace/api-client-react";

/** One-step journal setup collected before a new journal draft is generated. Pure helpers; no React. */
export type JournalTarget = "preset" | "general" | "custom";
export type JournalLength = "short" | "standard" | "extended";

export type JournalSetup = {
  target: JournalTarget;
  templateId: string | null;
  customFormat: CustomFormat;
  details: DocumentDetails;
  length: JournalLength;
  includeFigures: boolean;
};

export type JournalGenerationExtras = {
  templateId?: string;
  documentDetails?: DocumentDetails;
  customFormat?: CustomFormat;
  includeFigures: boolean;
};

export const JOURNAL_DEFAULT_FORMAT: CustomFormat = {
  size: "A4", fontFamily: "serif", fontSize: 11, lineSpacing: 1.5, columns: 1,
  margins: { top: 72, right: 72, bottom: 72, left: 72 }, citationStyle: "numbered",
  figureWidth: 80, captionPosition: "below", figurePlacement: "inline",
  sectionOrder: [], headingRenames: [], instructions: "",
};

export const LENGTHS: Record<JournalLength, { label: string; words: string; hint: string }> = {
  short: { label: "Short", words: "about 3,000 words", hint: "Letter or short communication" },
  standard: { label: "Standard", words: "about 5,000 to 6,500 words", hint: "Typical full research article" },
  extended: { label: "Extended", words: "about 8,000 words", hint: "Long article or review" },
};

const DETAIL_MAX: Record<string, number> = { author: 500, affiliation: 500, supervisor: 500, degree: 200, department: 200, year: 40, studentId: 100 };

export function defaultJournalSetup(question = ""): JournalSetup {
  // A named venue in the request is only a suggestion; the user still reviews it in the setup step.
  const ieee = /\bieee\s+access\b/i.test(question);
  return { target: ieee ? "preset" : "general", templateId: ieee ? "ieee-access" : null, customFormat: { ...JOURNAL_DEFAULT_FORMAT, margins: { ...JOURNAL_DEFAULT_FORMAT.margins } }, details: {}, length: "standard", includeFigures: true };
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));

export function cleanJournalDetails(d: DocumentDetails): DocumentDetails {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(d)) {
    const t = typeof v === "string" ? v.trim() : "";
    if (t && DETAIL_MAX[k]) out[k] = t.slice(0, DETAIL_MAX[k]);
  }
  return out as DocumentDetails;
}

/** Brings any edited format back inside the API ranges. */
export function sanitizeFormat(f: CustomFormat): CustomFormat {
  const m = (v: number) => clamp(Math.round(v), 18, 144);
  const out: CustomFormat = {
    ...f,
    fontSize: clamp(f.fontSize, 8, 16), lineSpacing: clamp(f.lineSpacing, 1, 2.5), figureWidth: clamp(f.figureWidth, 40, 100),
    margins: { top: m(f.margins.top), right: m(f.margins.right), bottom: m(f.margins.bottom), left: m(f.margins.left) },
    sectionOrder: f.sectionOrder.map(s => s.trim().slice(0, 100)).filter(Boolean).slice(0, 30),
    headingRenames: f.headingRenames.filter(r => r.from.trim() && r.to.trim()).slice(0, 30),
    instructions: f.instructions.slice(0, 16000),
  };
  if (out.maxWords !== undefined) out.maxWords = clamp(out.maxWords, 100, 100000);
  if (out.maxAbstractWords !== undefined) out.maxAbstractWords = clamp(out.maxAbstractWords, 50, 2000);
  return out;
}

export function journalSetupProblem(s: JournalSetup): string | null {
  if (s.target === "preset" && !s.templateId) return "Choose a journal, or switch to a general academic draft.";
  if (s.target === "custom" && s.customFormat.instructions.length > 16000) return "Keep instructions under 16,000 characters.";
  return null;
}

export function journalGenerationExtras(s: JournalSetup): JournalGenerationExtras {
  const details = cleanJournalDetails(s.details);
  return {
    ...(s.target === "preset" && s.templateId ? { templateId: s.templateId } : {}),
    ...(s.target === "custom" ? { customFormat: sanitizeFormat(s.customFormat) } : {}),
    ...(Object.keys(details).length ? { documentDetails: details } : {}),
    includeFigures: s.includeFigures,
  };
}

/** Adds the requested target length without loosening any evidence rule; stays within the 5,000 character API limit. */
export function journalPromptWithLength(prompt: string, length: JournalLength): string {
  const line = `\n\nTarget length: ${LENGTHS[length].words} of body text. Treat this as a target, not a reason to add unsupported claims, invented data or citations; if the evidence is thinner, write less and say what is missing.`;
  return prompt.slice(0, 5000 - line.length) + line;
}

export function journalSetupSummary(s: JournalSetup, templateName?: string): string {
  const fmt = s.target === "preset" ? templateName ?? "Journal preset" : s.target === "custom" ? `Your settings (${s.customFormat.size === "A4" ? "A4" : "Letter"}, ${s.customFormat.columns} col, ${s.customFormat.fontSize} pt)` : "General academic draft";
  return `${fmt} · ${LENGTHS[s.length].label.toLowerCase()} length · diagrams ${s.includeFigures ? "on" : "off"}`;
}

