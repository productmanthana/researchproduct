/**
 * Pure helpers for the Related papers explorer.
 * Only root-to-result edges are produced; the API never reports links between two
 * candidates, so none are drawn or implied.
 */
export type RelationKind = "references" | "citedBy" | "similar";
export const RELATION_KINDS: RelationKind[] = ["references", "citedBy", "similar"];
export const GRAPH_LIMIT = 25;

export type GraphPaper = { id: string; title: string; year?: number | null; isOa?: boolean; publisher?: string; publicationDate?: string };
export type GraphNode<P extends GraphPaper = GraphPaper> = { id: string; paper: P; kinds: RelationKind[]; x: number; y: number };
export type GraphEdge = { from: string; to: string; kind: RelationKind };

export const RELATION_META: Record<RelationKind, { label: string; short: string; colorVar: string; explain: string; limit: string }> = {
  references: {
    label: "Referenced by this paper",
    short: "Reference",
    colorVar: "--primary",
    explain: "The root paper's reference list includes this work, as reported by the indexing source.",
    limit: "Reference lists depend on what the publisher deposited with the index. Missing items do not mean the root paper did not cite them.",
  },
  citedBy: {
    label: "Cites this paper",
    short: "Citing",
    colorVar: "--vermilion",
    explain: "This work's reference list includes the root paper, as reported by the indexing source.",
    limit: "Citation coverage lags publication and varies by publisher; recent citing work may be absent.",
  },
  similar: {
    label: "Title-related",
    short: "Title query",
    colorVar: "--leaf",
    explain: "Returned by a catalogue search using the root paper's title as the query. Ranking reflects the catalogue's relevance order, not a measured semantic similarity.",
    limit: "No citation link is established. Shared words in titles can produce matches on different topics.",
  },
};

export function yearOf(p: GraphPaper): number | null {
  const y = p.year ?? (p.publicationDate ? Number(p.publicationDate.slice(0, 4)) : null);
  return y && Number.isFinite(y) && y > 0 ? y : null;
}

export type GraphFilters = { age: "all" | "recent" | "older"; oaOnly: boolean; publisher: string; recentYears?: number; now?: number };

export function passesFilters(p: GraphPaper, f: GraphFilters): boolean {
  const now = f.now ?? new Date().getFullYear();
  const cutoff = now - (f.recentYears ?? 5);
  const y = yearOf(p);
  if (f.age === "recent" && (y == null || y < cutoff)) return false;
  if (f.age === "older" && (y == null || y >= cutoff)) return false;
  if (f.oaOnly && !p.isOa) return false;
  if (f.publisher && (p.publisher || "") !== f.publisher) return false;
  return true;
}

/** Merge results per relation, capped at GRAPH_LIMIT each, deduplicating by id and dropping the root. */
export function mergeRelations<P extends GraphPaper>(rootId: string, results: Partial<Record<RelationKind, P[]>>) {
  const map = new Map<string, { paper: P; kinds: RelationKind[] }>();
  for (const kind of RELATION_KINDS) {
    for (const p of (results[kind] ?? []).slice(0, GRAPH_LIMIT)) {
      if (!p.id || p.id === rootId) continue;
      const e = map.get(p.id);
      if (e) { if (!e.kinds.includes(kind)) e.kinds.push(kind); } else map.set(p.id, { paper: p, kinds: [kind] });
    }
  }
  return [...map.values()];
}

/**
 * Layout (viewBox 800x620): references occupy a left arc and citing papers a right arc, both
 * kept above y=430; title-related results sit in separate rows below (y 490-570). Root at (400,250).
 * With 25 per relation the three zones never overlap.
 */
export const GRAPH_W = 800, GRAPH_H = 620, ROOT = { x: 400, y: 250 };
export function layoutGraph<P extends GraphPaper>(items: { paper: P; kinds: RelationKind[] }[]) {
  const groups: Record<RelationKind, typeof items> = { references: [], citedBy: [], similar: [] };
  for (const it of items) groups[it.kinds[0]].push(it);
  const nodes: GraphNode<P>[] = [];
  for (const kind of ["references", "citedBy"] as const) {
    const g = groups[kind], side = kind === "references" ? -1 : 1;
    const rings = g.length > 13 ? 2 : 1, per = Math.ceil(g.length / rings);
    g.forEach((it, i) => {
      const ring = Math.floor(i / per), n = Math.min(per, g.length - ring * per);
      const t = n === 1 ? 0.5 : (i % per) / (n - 1);
      const ang = ((-58 + 116 * t) * Math.PI) / 180;
      const f = ring === 0 ? 1 : 0.66;
      nodes.push({ id: it.paper.id, paper: it.paper, kinds: it.kinds, x: Math.round(ROOT.x + side * Math.cos(ang) * 330 * f), y: Math.round(ROOT.y + Math.sin(ang) * 195 * f) });
    });
  }
  const s = groups.similar, rows = s.length > 13 ? 2 : 1, per = Math.ceil(s.length / rows);
  s.forEach((it, i) => {
    const row = Math.floor(i / per), n = Math.min(per, s.length - row * per);
    const t = n === 1 ? 0.5 : (i % per) / (n - 1);
    nodes.push({ id: it.paper.id, paper: it.paper, kinds: it.kinds, x: Math.round(70 + 660 * t + (row ? 25 : 0) * (n > 1 ? 1 : 0)), y: 495 + row * 55 });
  });
  const edges: GraphEdge[] = nodes.flatMap((n) =>
    n.kinds.map((kind) => (kind === "citedBy" ? { from: n.id, to: "root", kind } : { from: "root", to: n.id, kind })),
  );
  return { nodes, edges, root: ROOT };
}

export function explainRelation(kinds: RelationKind[], rootTitle: string) {
  return kinds.map((k) => ({ kind: k, text: RELATION_META[k].explain.replace("the root paper", `"${rootTitle}"`), limit: RELATION_META[k].limit }));
}

export function timelineBuckets<P extends GraphPaper>(items: { paper: P; kinds: RelationKind[] }[]) {
  const m = new Map<number | "unknown", typeof items>();
  for (const it of items) { const y = yearOf(it.paper) ?? "unknown"; m.set(y, [...(m.get(y) ?? []), it]); }
  return [...m.entries()].sort((a, b) => (a[0] === "unknown" ? 1 : b[0] === "unknown" ? -1 : (b[0] as number) - (a[0] as number)));
}

const STOP = new Set("a an and are as at by for from in into is of on or the to with via using based its their this that over under between toward towards".split(" "));
/** Exact title words shared with the root (after lowercasing and removing common stop words). Descriptive only, not a score. */
export function sharedTitleTerms(a: string, b: string): string[] {
  const words = (s: string) => new Set(s.toLowerCase().split(/[^a-z0-9-]+/).filter((w) => w.length > 2 && !STOP.has(w)));
  const wb = words(b);
  return [...words(a)].filter((w) => wb.has(w));
}
