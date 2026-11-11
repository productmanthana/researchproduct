/** Pure helpers for the shared Sources tab. Nothing here invents records; it only labels what was saved. */
export type SourceKind = "scholarly" | "patent" | "project" | "web";
export type RawSource = { id?: string; paperId?: string; title?: string; url?: string; text?: string; evidenceLevel?: string; verification?: string };
export type ProvenancedSource = {
  key: string; title: string; url: string; excerpt: string; kind: SourceKind;
  evidenceLevel: string; abstractOnly: boolean; origins: string[];
};
type ItemLike = { id: string; title: string; kind: string; revision: number; metadata: unknown };

const PATENT = /(patents\.google|patentscope|wipo\.int|espacenet|epo\.org|uspto\.gov|ipindia|freepatentsonline|lens\.org\/lens\/patent)/i;
const SCHOLARLY = /(doi\.org|arxiv\.org|openalex\.org|semanticscholar\.org|pubmed|ncbi\.nlm\.nih\.gov|europepmc|core\.ac\.uk|crossref\.org|springer|sciencedirect|wiley\.com|ieeexplore|jstor|tandfonline|mdpi\.com|nature\.com|plos|frontiersin|biorxiv|medrxiv|ssrn|acm\.org|sagepub|cambridge\.org|oup\.com|elsevier|hindawi|iop\.org|scielo|researchsquare|zenodo)/i;

export function classifySource(s: RawSource): SourceKind {
  const url = (s.url ?? "").trim();
  const level = `${s.evidenceLevel ?? ""} ${s.id ?? ""}`;
  // A search summary pointing at a DOI/patent is still web evidence, not proof
  // that the original scholarly paper or official patent record was read.
  if (s.id?.startsWith("web-") || /\binternet\b|\bweb search\b/i.test(s.evidenceLevel ?? "")) return "web";
  if (PATENT.test(url) || /\bpatent/i.test(level)) return "patent";
  if (!/^https?:\/\//i.test(url)) return "project";
  if (SCHOLARLY.test(url) || /\b(abstract|full[- ]text|peer|paper|scholarly|open access)\b/i.test(level)) return "scholarly";
  return "web";
}

export const isAbstractOnly = (s: RawSource) => /abstract/i.test(s.evidenceLevel ?? "") && !/full/i.test(s.evidenceLevel ?? "");

const keyOf = (s: RawSource) => s.paperId ? `paper:${s.paperId}`
  : ((s.url ?? "").trim().toLowerCase().replace(/#page=\d+$/i, "").replace(/\/+$/, "") || (s.title ?? "").trim().toLowerCase());

export function mergeSources(groups: { origin: string; sources: RawSource[] }[]): ProvenancedSource[] {
  const map = new Map<string, ProvenancedSource>();
  for (const g of groups) for (const s of g.sources) {
    const key = keyOf(s);
    if (!key) continue;
    const prev = map.get(key);
    if (prev) { if (!prev.origins.includes(g.origin)) prev.origins.push(g.origin); if (!prev.excerpt && s.text) prev.excerpt = s.text; continue; }
    map.set(key, {
      key, title: (s.title ?? "").trim() || "Untitled source", url: /^https?:\/\//i.test(s.url ?? "") ? s.url!.trim() : "",
      excerpt: (s.text ?? "").trim(), kind: classifySource(s), evidenceLevel: [s.evidenceLevel, s.verification].filter(Boolean).join(" · "),
      abstractOnly: isAbstractOnly(s), origins: [g.origin],
    });
  }
  return [...map.values()];
}

const arr = (v: unknown): RawSource[] => (Array.isArray(v) ? v.filter((x): x is RawSource => !!x && typeof x === "object") : []);

/** Saved sources of studio items (`metadata.sources`) and reviews (`metadata.reviewSources`), with provenance per revision. */
export function studioItemSources(items: ItemLike[], label: (kind: string) => string = k => k): ProvenancedSource[] {
  return mergeSources(items.flatMap(i => {
    const m = (i.metadata ?? {}) as Record<string, unknown>;
    const origin = `${label(i.kind)} · rev ${i.revision}`;
    const web = m.webEvidence as unknown;
    const webList = Array.isArray(web) ? arr(web) : web && typeof web === "object" ? arr((web as { results?: unknown }).results) : [];
    return [{ origin, sources: arr(m.sources) }, { origin: `${origin} review`, sources: arr(m.reviewSources) }, { origin: `${origin} web search`, sources: webList }];
  }));
}

export function sourceKindCounts(list: ProvenancedSource[]): Record<SourceKind, number> {
  const out: Record<SourceKind, number> = { scholarly: 0, patent: 0, project: 0, web: 0 };
  for (const s of list) out[s.kind] += 1;
  return out;
}

/** True while an item is still writing but its gathered inputs are already saved (retrieved, not yet checked). */
export function sourcesRetrievedOnly(item: { status: string; metadata: unknown }): boolean {
  const m = (item.metadata ?? {}) as Record<string, unknown>;
  return (item.status === "queued" || item.status === "running") && (m.sourcesStatus === "retrieved" || Array.isArray(m.sources));
}
