import { exportStudioDocument, type StudioItem, type DocumentDetails } from "@workspace/api-client-react";

export type IdeaCard = { title: string; problem: string; question: string; method: string; feasibility: string };
export type StudioSource = { id: string; title: string; text: string; url: string };

export const KIND_LABEL: Record<string, string> = {
  ideas: "Idea set", idea: "Chosen idea", literature: "Literature review", synopsis: "Synopsis",
  journal: "Journal draft", thesis: "Thesis draft", note: "Note", document: "Document",
  patent: "Patent search", answer: "Answer",
};

export const isWorking = (s?: string) => s === "queued" || s === "running";

export function meta(item?: StudioItem | null) {
  const m = (item?.metadata ?? {}) as Record<string, unknown>;
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    ideas: arr<IdeaCard>(m.ideas),
    sources: arr<StudioSource>(m.sources),
    warnings: arr<string>(m.warnings),
    templateId: typeof m.templateId === "string" ? m.templateId : undefined,
    analysisId: typeof m.analysisId === "string" ? m.analysisId : undefined,
    documentId: typeof m.documentId === "string" ? m.documentId : undefined,
    stage: typeof m.stage === "string" ? m.stage : undefined,
  };
}

export function statusOf(e: unknown): number | undefined {
  return (e as { status?: number } | null)?.status;
}

export function friendlyError(e: unknown): string {
  const s = statusOf(e);
  const anyE = e as { data?: { error?: string }; message?: string } | null;
  const base = anyE?.data?.error || anyE?.message || "Something went wrong.";
  if (s === 429) return `You have reached a usage or rate limit. ${base} See Plans & usage, or try again shortly.`;
  if (s === 409) return `${base} Your edits on screen are kept.`;
  if (s === 503) return `${base} The service is temporarily unavailable. Part of the action may already have completed; refresh to see the current state, then retry.`;
  return base;
}

export async function downloadStudioItem(item: Pick<StudioItem, "id" | "title">, format: "pdf" | "docx") {
  const blob = await exportStudioDocument(item.id, { format }, { responseType: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(item.title || "evidora").replace(/[^\w\- ]+/g, "").slice(0, 80).trim() || "evidora"}.${format}`;
  document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Groups items into lineages (root -> revisions) using parentId chains. */
export function lineageOf(items: StudioItem[], id: string): StudioItem[] {
  const byId = new Map(items.map(i => [i.id, i]));
  let root = byId.get(id);
  while (root?.parentId && byId.get(root.parentId)) root = byId.get(root.parentId);
  if (!root) return [];
  const out: StudioItem[] = [root];
  const queue = [root.id];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const c of items) if (c.parentId === cur && !out.includes(c)) { out.push(c); queue.push(c.id); }
  }
  return out.sort((a, b) => a.revision - b.revision || a.createdAt.localeCompare(b.createdAt));
}

/** Latest revision in each lineage. */
export function latestItems(items: StudioItem[]): StudioItem[] {
  const parents = new Set(items.map(i => i.parentId).filter(Boolean));
  return items.filter(i => !parents.has(i.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type ProjectIntent = { kind: "ideas" | "literature" | "synopsis" | "journal" | "thesis" | "answer"; route: string };

/** Detects an explicit request to use the user's own project material, and infers the document kind. */
export function projectIntent(text: string): ProjectIntent | null {
  const t = text.toLowerCase();
  if (!/\b(my|our) (own )?(idea|ideas|reference|references|papers|project|notes|documents|uploads|sources|draft)\b/.test(t)) return null;
  if (/\bliterature review\b|\blit(erature)? review\b|\breview of (the )?literature\b/.test(t)) return { kind: "literature", route: "/literature" };
  if (/\bsynopsis\b/.test(t)) return { kind: "synopsis", route: "/synopsis" };
  if (/\bthesis\b|\bdissertation\b/.test(t)) return { kind: "thesis", route: "/thesis" };
  if (/\bjournal\b|\bmanuscript\b|\bresearch (paper|article)\b/.test(t)) return { kind: "journal", route: "/journals" };
  if (/\b(five|5|some|new|research) ideas\b|\bsuggest (some )?ideas\b|\bgenerate ideas\b/.test(t)) return { kind: "ideas", route: "/ideas" };
  return { kind: "answer", route: "/ideas?mode=answer" };
}

/* ---------- Document details (title-page metadata) ---------- */
export type { DocumentDetails };

export const DETAIL_KINDS = new Set(["journal", "thesis", "synopsis"]);
export const DETAIL_FIELDS: { key: keyof DocumentDetails; label: string; max: number; kinds?: string[]; hint?: string }[] = [
  { key: "author", label: "Author(s)", max: 500, hint: "As it should appear on the title page" },
  { key: "affiliation", label: "Affiliation", max: 500 },
  { key: "supervisor", label: "Supervisor / guide", max: 500, kinds: ["thesis", "synopsis"] },
  { key: "degree", label: "Degree", max: 200, kinds: ["thesis", "synopsis"] },
  { key: "department", label: "Department", max: 200 },
  { key: "year", label: "Year", max: 40 },
  { key: "studentId", label: "Student / enrolment ID", max: 100, kinds: ["thesis", "synopsis"] },
];
export const fieldsFor = (kind: string) => DETAIL_FIELDS.filter(f => !f.kinds || f.kinds.includes(kind));

/** Trimmed, empty-free copy suitable for the API. */
export function cleanDetails(d: DocumentDetails): DocumentDetails {
  const out: DocumentDetails = {};
  for (const f of DETAIL_FIELDS) { const v = (d[f.key] ?? "").trim(); if (v) out[f.key] = v.slice(0, f.max); }
  return out;
}
export function detailsOf(item?: StudioItem | null): DocumentDetails {
  const raw = (item?.metadata as Record<string, unknown> | undefined)?.documentDetails;
  if (!raw || typeof raw !== "object") return {};
  const out: DocumentDetails = {};
  for (const f of DETAIL_FIELDS) { const v = (raw as Record<string, unknown>)[f.key]; if (typeof v === "string") out[f.key] = v; }
  return out;
}
export const sameDetails = (a: DocumentDetails, b: DocumentDetails) => JSON.stringify(cleanDetails(a)) === JSON.stringify(cleanDetails(b));
export const hasDetails = (d: DocumentDetails) => Object.keys(cleanDetails(d)).length > 0;

/** Title-page requirements that block a clean export; shown before exporting and in the check. */
export function missingRequirements(kind: string, title: string, d: DocumentDetails): string[] {
  if (!DETAIL_KINDS.has(kind)) return [];
  const c = cleanDetails(d);
  const out: string[] = [];
  if (!title.trim()) out.push("Title is missing");
  if (!c.author) out.push("Author name is missing");
  if (kind !== "journal" && !c.degree) out.push("Degree is missing (shown on the title page)");
  if (kind === "thesis" && !c.supervisor) out.push("Supervisor / guide is missing");
  return out;
}
