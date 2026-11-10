import { useMemo, useState, type KeyboardEvent } from "react";
import { Link } from "wouter";
import {
  useGetPaper, getGetPaperQueryKey, useGetRelatedPapers, getGetRelatedPapersQueryKey,
  useSearchStudioPatents, getSearchStudioPatentsQueryKey, type Paper,
} from "@workspace/api-client-react";
import { AlertTriangle, ExternalLink, FileText, Network, RotateCw, Unlock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaperRow, SavePaperButton, SelectToggle, useSavedIds } from "@/components/paper-row";
import { errMessage } from "@/lib/format";
import {
  GRAPH_LIMIT, RELATION_KINDS, RELATION_META, layoutGraph, mergeRelations, passesFilters, sharedTitleTerms,
  timelineBuckets, yearOf, type GraphFilters, type RelationKind,
} from "@/lib/related-graph";
import "./related-explorer.css";

type View = "map" | "list" | "timeline" | "patents";
const color = (k: RelationKind | "root") => (k === "root" ? "hsl(var(--turmeric))" : `hsl(var(${RELATION_META[k].colorVar}))`);

/** Deep-link param: /papers/:id?view=related opens the explorer that sets syncUrl. */
export const RELATED_VIEW_PARAM = "view", RELATED_VIEW_VALUE = "related";
export function relatedDeepLink(paperId: string) { return `/papers/${encodeURIComponent(paperId)}?${RELATED_VIEW_PARAM}=${RELATED_VIEW_VALUE}`; }

export function RelatedPapersExplorer({ paperId, rootTitle, label = "Explore related papers", compact, defaultOpen = false, syncUrl = false }: { paperId: string; rootTitle?: string; label?: string; compact?: boolean; defaultOpen?: boolean; syncUrl?: boolean }) {
  const [open, setOpenState] = useState(defaultOpen);
  const setOpen = (v: boolean) => {
    setOpenState(v);
    if (!syncUrl) return;
    // Keep every other query param; only add/remove view=related, without adding history entries.
    const u = new URL(window.location.href);
    if (v) u.searchParams.set(RELATED_VIEW_PARAM, RELATED_VIEW_VALUE); else if (u.searchParams.get(RELATED_VIEW_PARAM) === RELATED_VIEW_VALUE) u.searchParams.delete(RELATED_VIEW_PARAM);
    window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
  };
  if (!paperId) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={compact ? "rx-trigger rx-trigger-compact" : "rx-trigger"} data-testid={`button-related-explorer-${paperId}`}>
        <Network aria-hidden="true" /> {label}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rx-dialog">{open && <ExplorerBody paperId={paperId} rootTitle={rootTitle} />}</DialogContent>
      </Dialog>
    </>
  );
}

function useRelation(id: string, kind: RelationKind, enabled: boolean) {
  const params = { kind };
  return useGetRelatedPapers(id, params, { query: { enabled: enabled && !!id, queryKey: getGetRelatedPapersQueryKey(id, params) } });
}

function ExplorerBody({ paperId, rootTitle }: { paperId: string; rootTitle?: string }) {
  const [enabledKinds, setEnabledKinds] = useState<Record<RelationKind, boolean>>({ references: true, citedBy: true, similar: true });
  const root = useGetPaper(paperId, { query: { enabled: !!paperId, queryKey: getGetPaperQueryKey(paperId) } });
  const q = { references: useRelation(paperId, "references", true), citedBy: useRelation(paperId, "citedBy", true), similar: useRelation(paperId, "similar", true) };
  const [view, setView] = useState<View>("map");
  const [filters, setFilters] = useState<GraphFilters>({ age: "all", oaOnly: false, publisher: "" });
  const [selected, setSelected] = useState<string | null>(null);
  const saved = useSavedIds();
  const title = root.data?.title ?? rootTitle ?? "This paper";

  const refData = q.references.data, citData = q.citedBy.data, simData = q.similar.data;
  const merged = useMemo(() => mergeRelations(paperId, {
    references: enabledKinds.references ? refData?.papers : [],
    citedBy: enabledKinds.citedBy ? citData?.papers : [],
    similar: enabledKinds.similar ? simData?.papers : [],
  }), [paperId, refData, citData, simData, enabledKinds]);
  const all = useMemo(() => mergeRelations(paperId, { references: refData?.papers, citedBy: citData?.papers, similar: simData?.papers }), [paperId, refData, citData, simData]);
  const publishers = useMemo(() => [...new Set(all.map((m) => m.paper.publisher).filter(Boolean))].sort(), [all]);
  const hasOa = all.some((m) => m.paper.isOa);
  const hasYears = all.some((m) => yearOf(m.paper));
  const visible = merged.filter((m) => passesFilters(m.paper, filters));
  const graph = useMemo(() => layoutGraph(visible), [visible]);
  const active = all.find((m) => m.paper.id === selected);
  const warnings = [...new Set(RELATION_KINDS.flatMap((k) => q[k].data?.warnings ?? []))];
  const loadingAny = RELATION_KINDS.some((k) => q[k].isLoading);

  return (
    <div className="rx-body">
      <DialogHeader className="rx-head">
        <p className="rx-kicker">Related papers explorer</p>
        <DialogTitle className="rx-title">{title}</DialogTitle>
        <DialogDescription className="rx-desc">
          Lines connect only this paper to each result. Links between two results are not reported by the sources and are not drawn. Up to {GRAPH_LIMIT} results per relation.
        </DialogDescription>
      </DialogHeader>

      <div className="rx-legend" role="group" aria-label="Relations shown">
        <span className="rx-chip rx-chip-root"><i style={{ background: color("root") }} />Root paper</span>
        {RELATION_KINDS.map((k) => {
          const r = q[k];
          return (
            <button key={k} type="button" aria-pressed={enabledKinds[k]} className="rx-chip" onClick={() => setEnabledKinds((s) => ({ ...s, [k]: !s[k] }))} data-testid={`toggle-relation-${k}`}>
              <i style={{ background: color(k) }} className={k === "similar" ? "rx-dash" : ""} />
              {RELATION_META[k].label}
              <b>{r.isLoading ? "..." : r.isError ? "failed" : `${Math.min(r.data?.papers.length ?? 0, GRAPH_LIMIT)}${(r.data?.total ?? 0) > GRAPH_LIMIT ? ` of ${r.data?.total}` : ""}`}</b>
            </button>
          );
        })}
      </div>

      {RELATION_KINDS.filter((k) => q[k].isError).map((k) => (
        <p key={k} className="rx-alert" role="alert">
          <AlertTriangle aria-hidden="true" /> {RELATION_META[k].label}: {errMessage(q[k].error)}
          <button type="button" onClick={() => q[k].refetch()} data-testid={`button-retry-${k}`}><RotateCw aria-hidden="true" /> Retry</button>
        </p>
      ))}
      {warnings.map((w) => <p key={w} className="rx-warn" role="status">Partial results: {w}</p>)}

      <div className="rx-toolbar">
        <div className="rx-tabs" role="tablist" aria-label="View">
          {(["map", "list", "timeline", "patents"] as View[]).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} type="button" onClick={() => setView(v)} data-testid={`tab-explorer-${v}`}>
              {v === "patents" ? "Patent context" : v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        {view !== "patents" && (
          <div className="rx-filters">
            {hasYears && (
              <select aria-label="Publication age" value={filters.age} onChange={(e) => setFilters((f) => ({ ...f, age: e.target.value as GraphFilters["age"] }))} data-testid="select-age">
                <option value="all">All years</option><option value="recent">Last 5 years</option><option value="older">Older than 5 years</option>
              </select>
            )}
            {publishers.length > 1 && (
              <select aria-label="Publisher" value={filters.publisher} onChange={(e) => setFilters((f) => ({ ...f, publisher: e.target.value }))} data-testid="select-publisher">
                <option value="">All publishers</option>
                {publishers.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
            {hasOa && (
              <label className="rx-check"><input type="checkbox" checked={filters.oaOnly} onChange={(e) => setFilters((f) => ({ ...f, oaOnly: e.target.checked }))} data-testid="checkbox-oa" /> Open access</label>
            )}
          </div>
        )}
      </div>

      <div className="rx-main">
        <div className="rx-stage">
          {view === "patents" ? <PatentContext title={title} /> :
            loadingAny && !all.length ? <div className="rx-skeleton" aria-busy="true"><span /><span /><span /></div> :
            !visible.length ? (
              <div className="rx-empty"><Network aria-hidden="true" /><p>{all.length ? "No results match these filters." : "The indexing sources returned no linked papers for this record."}</p><small>Reference and citation coverage varies by publisher. An empty map is not evidence that no related work exists.</small></div>
            ) : view === "map" ? (
              <GraphMap graph={graph} rootTitle={title} selected={selected} onSelect={setSelected} />
            ) : view === "list" ? (
              <div className="rx-list">
                {RELATION_KINDS.map((k) => {
                  const items = visible.filter((m) => m.kinds.includes(k));
                  if (!items.length) return null;
                  return (
                    <section key={k}>
                      <h3 style={{ borderColor: color(k) }}>{RELATION_META[k].label} <span>{items.length}</span></h3>
                      <div className="rx-rows">{items.map((m) => (
                        <div key={m.paper.id} className={selected === m.paper.id ? "rx-row is-on" : "rx-row"}>
                          <PaperRow paper={m.paper} saved={saved.has(m.paper.id)} compact />
                          <button type="button" className="rx-why" onClick={() => setSelected(m.paper.id)} data-testid={`button-why-${m.paper.id}`}>Why related</button>
                        </div>
                      ))}</div>
                    </section>
                  );
                })}
              </div>
            ) : (
              <ol className="rx-timeline">
                {timelineBuckets(visible).map(([y, items]) => (
                  <li key={String(y)}>
                    <span className="rx-year">{y === "unknown" ? "Year not stated" : y}</span>
                    <div>{items.map((m) => (
                      <button key={m.paper.id} type="button" aria-pressed={selected === m.paper.id} className="rx-tl-item" onClick={() => setSelected(m.paper.id)} data-testid={`button-timeline-${m.paper.id}`}>
                        <span className="rx-dots">{m.kinds.map((k) => <i key={k} style={{ background: color(k) }} title={RELATION_META[k].short} />)}</span>
                        {m.paper.title}
                      </button>
                    ))}</div>
                  </li>
                ))}
              </ol>
            )}
        </div>

        <aside className="rx-panel" aria-live="polite" data-testid="panel-why-related">
          {active ? <WhyPanel paper={active.paper} kinds={active.kinds} rootTitle={title} saved={saved.has(active.paper.id)} onClose={() => setSelected(null)} /> : (
            <div className="rx-panel-empty">
              <p className="rx-kicker">Why related</p>
              <p>Select a node, row or timeline entry to read the exact relationship, the metadata behind it, and its limits.</p>
              <ul>
                {RELATION_KINDS.map((k) => <li key={k}><i style={{ background: color(k) }} /><span><b>{RELATION_META[k].short}.</b> {RELATION_META[k].explain}</span></li>)}
              </ul>
            </div>
          )}
        </aside>
      </div>
      <p className="rx-foot">Results are a bounded sample from public indexes. Gaps in this map do not show that a topic is unstudied or that an idea is novel.</p>
    </div>
  );
}

function GraphMap({ graph, rootTitle, selected, onSelect }: { graph: ReturnType<typeof layoutGraph<Paper>>; rootTitle: string; selected: string | null; onSelect: (id: string) => void }) {
  const pos = new Map(graph.nodes.map((n) => [n.id, n]));
  const pt = (id: string) => (id === "root" ? graph.root : pos.get(id)!);
  const onKey = (e: KeyboardEvent, i: number) => {
    const n = graph.nodes.length;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); (document.getElementById(`rx-node-${(i + 1) % n}`) as HTMLElement | null)?.focus(); }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); (document.getElementById(`rx-node-${(i - 1 + n) % n}`) as HTMLElement | null)?.focus(); }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(graph.nodes[i].id); }
  };
  return (
    <svg viewBox="0 0 800 620" className="rx-svg" role="group" aria-label={`Relationship map for ${rootTitle}. Use arrow keys to move between papers and Enter to select.`}>
      <defs>
        {RELATION_KINDS.map((k) => (
          <marker key={k} id={`rx-arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={color(k)} />
          </marker>
        ))}
      </defs>
      <text x="20" y="30" className="rx-zone">References (cited by root)</text>
      <text x="780" y="30" textAnchor="end" className="rx-zone">Citing (cite root)</text>
      <line x1="20" x2="780" y1="462" y2="462" stroke="hsl(var(--border))" strokeDasharray="2 5" /><text x="20" y="478" className="rx-zone">Title-related (catalogue search on root title, no citation link)</text>
      {graph.edges.map((e) => {
        const a = pt(e.from), b = pt(e.to);
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
        const pad = e.to === "root" ? 30 : 10;
        const on = selected && (e.from === selected || e.to === selected);
        return <line key={`${e.from}-${e.to}-${e.kind}`} x1={a.x} y1={a.y} x2={b.x - (dx / len) * pad} y2={b.y - (dy / len) * pad} stroke={color(e.kind)} strokeOpacity={on ? 0.95 : 0.35} strokeWidth={on ? 2.2 : 1.1} strokeDasharray={e.kind === "similar" ? "4 4" : undefined} markerEnd={e.kind === "similar" ? undefined : `url(#rx-arrow-${e.kind})`} />;
      })}
      <g className="rx-root">
        <circle cx={graph.root.x} cy={graph.root.y} r="24" fill={color("root")} />
        <text x={graph.root.x} y={graph.root.y + 4} textAnchor="middle">ROOT</text>
      </g>
      {graph.nodes.map((n, i) => {
        const on = selected === n.id;
        return (
          <g key={n.id} id={`rx-node-${i}`} tabIndex={0} role="button" aria-pressed={on} className={on ? "rx-node is-on" : "rx-node"}
            aria-label={`${n.paper.title}. ${n.kinds.map((k) => RELATION_META[k].label).join(", ")}${yearOf(n.paper) ? `, ${yearOf(n.paper)}` : ""}`}
            onClick={() => onSelect(n.id)} onKeyDown={(e) => onKey(e, i)} data-testid={`node-related-${n.id}`}>
            <title>{n.paper.title}</title>
            <circle cx={n.x} cy={n.y} r={on ? 11 : 8} fill={color(n.kinds[0])} />
            {n.kinds.length > 1 && <circle cx={n.x} cy={n.y} r={on ? 15 : 12} fill="none" stroke={color(n.kinds[1])} strokeWidth="2" />}
            {on && <text x={n.x} y={n.y - 18} textAnchor="middle" className="rx-node-label">{n.paper.title.length > 46 ? `${n.paper.title.slice(0, 44)}...` : n.paper.title}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function WhyPanel({ paper: p, kinds, rootTitle, saved, onClose }: { paper: Paper; kinds: RelationKind[]; rootTitle: string; saved: boolean; onClose: () => void }) {
  const terms = kinds.includes("similar") ? sharedTitleTerms(rootTitle, p.title) : [];
  const y = yearOf(p);
  return (
    <div className="rx-why-panel">
      <div className="rx-why-top"><p className="rx-kicker">Why related</p><button type="button" onClick={onClose} aria-label="Clear selection" data-testid="button-clear-selection">Clear</button></div>
      <Link href={`/papers/${encodeURIComponent(p.id)}`} className="rx-why-title" data-testid={`link-related-paper-${p.id}`}>{p.title}</Link>
      <p className="rx-meta">{p.authors.slice(0, 4).join(", ") || "Authors not stated"}{y ? ` · ${p.publicationDate ?? y}${p.publicationDate ? "" : " (year only)"}` : " · Year not stated"}</p>
      <p className="rx-meta">{[p.venue, p.publisher].filter(Boolean).join(" · ") || "Venue and publisher not stated"}{p.isOa && <span className="rx-oa"><Unlock aria-hidden="true" /> Open access</span>}</p>
      {kinds.map((k) => (
        <div key={k} className="rx-reason" style={{ borderColor: color(k) }}>
          <b>{RELATION_META[k].label}</b>
          <p>{RELATION_META[k].explain.replace("the root paper", `"${rootTitle}"`).replace("The root paper's", `The reference list of "${rootTitle}"`)}</p>
          {k === "similar" && <p>{terms.length ? `Exact title words shared with the root: ${terms.join(", ")}.` : "No exact title words are shared; the catalogue matched on other fields."}</p>}
          <small>Limit: {RELATION_META[k].limit}</small>
        </div>
      ))}
      <p className="rx-meta">Indexed via {p.sources?.join(", ") || "source not stated"}{p.doi ? ` · DOI ${p.doi}` : ""}</p>
      <div className="rx-actions">
        <SelectToggle paper={p} />
        <SavePaperButton paper={p} saved={saved} />
        {p.url && <a href={p.url} target="_blank" rel="noreferrer" data-testid={`link-related-source-${p.id}`}><ExternalLink aria-hidden="true" /> Source</a>}
        {p.pdfUrl && <a href={p.pdfUrl} target="_blank" rel="noreferrer" data-testid={`link-related-pdf-${p.id}`}><FileText aria-hidden="true" /> PDF</a>}
        {p.doi && <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer">DOI</a>}
        <a href={relatedDeepLink(p.id)} data-testid={`link-related-map-${p.id}`}><Network aria-hidden="true" /> Its own map</a>
      </div>
      <h4>Abstract</h4>
      <p className="rx-abstract">{p.abstract || "No abstract was provided by the indexing source."}</p>
    </div>
  );
}

function PatentContext({ title }: { title: string }) {
  const [run, setRun] = useState(false);
  const params = { q: title.slice(0, 300) };
  const res = useSearchStudioPatents(params, { query: { enabled: run, queryKey: getSearchStudioPatentsQueryKey(params), retry: false } });
  return (
    <div className="rx-patents">
      <p className="rx-kicker">Patent context, kept separate</p>
      <p>A patent search uses this paper's title as a subject query. Matches share technical subject words only. They are not citations, are not linked to the map, and do not establish prior art or novelty.</p>
      {!run ? <button type="button" className="rx-trigger" onClick={() => setRun(true)} data-testid="button-run-patent-search">Search patents by title</button> :
        res.isLoading ? <div className="rx-skeleton" aria-busy="true"><span /><span /></div> :
        res.isError ? <p className="rx-alert" role="alert"><AlertTriangle aria-hidden="true" /> {errMessage(res.error)} <button type="button" onClick={() => res.refetch()}><RotateCw aria-hidden="true" /> Retry</button></p> :
        res.data && (
          <>
            {res.data.message && <p className="rx-warn" role="status">{res.data.message}</p>}
            {!res.data.patents.length && <p className="rx-meta">No patent matches returned for this title.</p>}
            <ul className="rx-patent-list">
              {res.data.patents.slice(0, GRAPH_LIMIT).map((pt) => (
                <li key={pt.id}>
                  <span className="rx-badge">Subject match</span>
                  {/^https?:\/\//i.test(pt.url) ? <a href={pt.url} target="_blank" rel="noreferrer">{pt.title}</a> : <b>{pt.title}</b>}
                  <span className="rx-meta">{[pt.applicant, pt.country, pt.date].filter(Boolean).join(" · ") || "Applicant, office and date not stated"}</span>
                  {pt.abstract && <p>{pt.abstract.slice(0, 320)}{pt.abstract.length > 320 ? "..." : ""}</p>}
                </li>
              ))}
            </ul>
            {!!res.data.links.length && <p className="rx-meta">Search elsewhere: {res.data.links.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="rx-inline">{l.label}</a>)}</p>}
          </>
        )}
    </div>
  );
}
