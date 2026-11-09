import { WorkspaceIntro } from "@/components/studio/workspace-shell";
import { useState, type FormEvent } from "react";
import { LiveWebEvidence } from "@/components/web-evidence";
import { Link, useLocation, useSearch } from "wouter";
import { useUser } from "@clerk/react";
import { useSearchPapers, getSearchPapersQueryKey, useGetSummary, getGetSummaryQueryKey, type SearchPapersParams } from "@workspace/api-client-react";
import { ArrowRight, ChevronLeft, ChevronRight, Compass, Info, Search, SlidersHorizontal, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaperRow, useSavedIds } from "@/components/paper-row";
import { EmptyState, ErrorState, RowSkeleton } from "@/components/states";
import { selection, useSelection } from "@/lib/selection";
import { num } from "@/lib/format";

const SOURCES = ["OpenAlex", "Crossref", "arXiv", "dblp", "DataCite", "Europe PMC", "DOAJ"];

function DeskStrip() {
  const { isSignedIn } = useUser();
  const s = useGetSummary({ query: { enabled: !!isSignedIn, queryKey: getGetSummaryQueryKey() } });
  if (!isSignedIn || !s.data) return null;
  const items = [
    { k: "Saved papers", v: s.data.savedPapers, href: "/library" },
    { k: "Projects", v: s.data.projects, href: "/projects" },
    { k: "Documents", v: s.data.documents, href: "/library" },
    { k: "Analyses", v: s.data.analyses, href: "/research" },
  ];
  return (
    <div className="rise mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border md:grid-cols-4" data-testid="section-summary">
      {items.map((i) => (
        <Link key={i.k} href={i.href} className="group bg-card px-4 py-3 transition-colors hover:bg-[hsl(var(--accent)/0.3)]" data-testid={`link-summary-${i.k.split(" ")[0].toLowerCase()}`}>
          <p className="font-display text-2xl font-semibold">{num(i.v)}</p>
          <p className="flex items-center justify-between text-xs text-muted-foreground">
            {i.k} <ArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
          </p>
        </Link>
      ))}
      {s.data.recentAnalyses.length > 0 && (
        <div className="col-span-2 bg-card px-4 py-3 md:col-span-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Recent analyses</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {s.data.recentAnalyses.slice(0, 4).map((a) => (
              <Link key={a.id} href={`/research?a=${a.id}`} className="max-w-xs truncate rounded border px-2 py-1 text-xs hover:border-primary" data-testid={`link-recent-analysis-${a.id}`}>
                {a.question}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Discover() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const urlQ = new URLSearchParams(search).get("q") ?? "";
  const [input, setInput] = useState(urlQ);
  const [showFilters, setShowFilters] = useState(false);
  const [year, setYear] = useState("");
  const [venue, setVenue] = useState("");
  const [field, setField] = useState("");
  const [publisher, setPublisher] = useState("");
  const [oa, setOa] = useState(false);
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [srcs, setSrcs] = useState<string[]>([]);
  const [minCit, setMinCit] = useState("");
  const saved = useSavedIds();
  const sel = useSelection();

  const params: SearchPapersParams = { q: urlQ, page };
  if (year) params.year = Number(year);
  if (venue) params.venue = venue;
  if (field) params.field = field;
  if (publisher) params.publisher = publisher;
  if (oa) params.oa = true;
  params.sort = sort;
  if (srcs.length) params.sources = srcs.join(",");
  if (minCit && Number(minCit) > 0) params.minCitations = Math.floor(Number(minCit));

  const res = useSearchPapers(params, { query: { enabled: urlQ.length > 1, queryKey: getSearchPapersQueryKey(params) } });
  const activeFilters = [year && `Year ${year}`, venue && venue, field && field, publisher && publisher, oa && "Open access", minCit && Number(minCit) > 0 && `>= ${minCit} citations`, srcs.length > 0 && `Sources: ${srcs.join(", ")}`].filter(Boolean) as string[];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() === urlQ && page === 1) {
      void res.refetch();
      return;
    }
    setPage(1);
    setLocation(`/discover?q=${encodeURIComponent(input.trim())}`);
  };
  const clearFilters = () => {
    setYear("");
    setVenue("");
    setField("");
    setPublisher("");
    setOa(false);
    setSrcs([]);
    setMinCit("");
    setPage(1);
  };

  return (
    <>
      <WorkspaceIntro kicker="Scholarly search" title="Discover papers worth reading." sub="Search open scholarly catalogues by topic, method, material or DOI. Save what matters to a project; filters narrow the catalogue, nothing is generated." />
      <form onSubmit={submit} className="sx-card sx-composer-wide mb-2 overflow-hidden" data-testid="form-discover-search">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <label htmlFor="input-discover-search" className="sr-only">Search papers</label>
          <input id="input-discover-search" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Topic, method, material, or DOI" className="h-14 w-full bg-transparent pl-11 pr-4 text-base outline-none placeholder:text-muted-foreground" data-testid="input-discover-search" />
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-[hsl(90_14%_86%)] bg-[hsl(66_22%_95%)] px-3 py-2">
          <button type="button" className="sx-btn" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters} data-testid="button-toggle-filters">
            <SlidersHorizontal /> Filters
            {activeFilters.length > 0 && <span className="rounded bg-vermilion px-1.5 font-mono text-[10px] text-white">{activeFilters.length}</span>}
          </button>
          <span className="hidden min-w-0 flex-1 truncate text-xs text-muted-foreground sm:inline">Catalogue search only. For a cited answer, ask the question in AI Chat.</span>
          <button type="submit" className="sx-btn sx-primary ml-auto" data-testid="button-discover-search"><Search />Search</button>
        </div>
      </form>
      <p className="mt-2 text-xs text-muted-foreground" data-testid="text-ask-hint">
        Have a full research question?{" "}
        <Link href={`/ask${input.trim() ? `?q=${encodeURIComponent(input.trim())}` : ""}`} className="font-medium text-primary underline" data-testid="link-ask-question">Ask it directly</Link>
        {" "}and get a cited answer without picking papers.
      </p>
      {!urlQ && <div className="mt-6"><DeskStrip /></div>}

      {urlQ&&sort==="recent"&&<p className="mt-3 text-xs text-muted-foreground">Recent publications first; older research remains included. Exact dates are shown where available. Source catalogues may take time to index new papers.</p>}
      {showFilters && (
        <div className="mt-3 grid gap-3 rounded-md border bg-card p-4 animate-in fade-in slide-in-from-top-1 sm:grid-cols-2 lg:grid-cols-6" data-testid="panel-filters">
          <Input type="number" placeholder="Year" value={year} onChange={(e) => { setYear(e.target.value); setPage(1); }} data-testid="input-filter-year" />
          <Input placeholder="Venue" value={venue} onChange={(e) => { setVenue(e.target.value); setPage(1); }} data-testid="input-filter-venue" />
          <Input placeholder="Field" value={field} onChange={(e) => { setField(e.target.value); setPage(1); }} data-testid="input-filter-field" />
          <Input placeholder="Publisher" value={publisher} onChange={(e) => { setPublisher(e.target.value); setPage(1); }} data-testid="input-filter-publisher" />
          <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
            <SelectTrigger data-testid="select-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent first · older included</SelectItem>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="citations">Most cited</SelectItem>
              <SelectItem value="year">Most recent</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center justify-between gap-2 rounded-md border px-3 text-sm">
            Open access only
            <Switch checked={oa} onCheckedChange={(v) => { setOa(v); setPage(1); }} data-testid="switch-filter-oa" />
          </label>
          <Input type="number" min={0} placeholder="Min. citations" value={minCit} onChange={(e) => { setMinCit(e.target.value); setPage(1); }} data-testid="input-filter-min-citations" />
          <div className="sm:col-span-2 lg:col-span-5">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Sources {srcs.length === 0 && <span className="normal-case tracking-normal">(all available)</span>}</p>
            <div className="flex flex-wrap gap-1.5">
              {SOURCES.map((sname) => {
                const on = srcs.includes(sname);
                return (
                  <button key={sname} type="button" onClick={() => { setSrcs((x) => (on ? x.filter((y) => y !== sname) : [...x, sname])); setPage(1); }} className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${on ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-foreground/40"}`} aria-pressed={on} data-testid={`toggle-source-${sname}`}>
                    {sname}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {activeFilters.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {activeFilters.map((f) => (
            <span key={f} className="rounded-full border bg-card px-2.5 py-1">{f}</span>
          ))}
          <button onClick={clearFilters} className="text-muted-foreground underline hover:text-foreground" data-testid="button-clear-filters">Clear</button>
        </div>
      )}

      {urlQ && <div className="mt-6"><LiveWebEvidence q={urlQ} /></div>}
      <div className="mt-8">
        {!urlQ ? (
          <EmptyState icon={<Compass className="h-5 w-5" />} title="Start with a question you actually have" body="Search across open scholarly indexes. Select papers as you go, then send them to Research for a cited answer or review." />
        ) : res.isLoading ? (
          <RowSkeleton rows={6} />
        ) : res.isError ? (
          <ErrorState error={res.error} onRetry={() => res.refetch()} title="Search failed" />
        ) : res.data ? (
          <>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm">
                <span className="font-mono">{num(res.data.total)}</span> <span className="text-muted-foreground">unique papers on this page for</span> <span className="mark font-medium">{urlQ}</span>
              </p>
              <p className="font-mono text-xs text-muted-foreground" data-testid="text-duplicates">
                page {res.data.page} &middot; {res.data.duplicatesRemoved} duplicates merged
              </p>
            </div>
            {res.data.scopeNotice && (
              <p className="mb-3 flex items-start gap-2 rounded border bg-card px-3 py-2 text-xs text-muted-foreground" data-testid="text-scope-notice"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {res.data.scopeNotice}</p>
            )}
            {!!res.data.sourceCounts?.length && (
              <div className="mb-3 rounded border bg-card px-3 py-2" data-testid="section-source-counts">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Matches reported by each provider (indexes overlap, so these are not added together)</p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {res.data.sourceCounts.map((c) => (
                    <span key={c.name} className="inline-flex items-center gap-1.5" data-testid={`text-source-count-${c.name}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${c.status === "ok" || c.status === "live" ? "bg-leaf" : c.status === "error" || c.status === "failed" ? "bg-vermilion" : "bg-turmeric"}`} />
                      {c.name} <span className="font-mono">{c.status === "ok" || c.status === "live" || c.total > 0 ? num(c.total) : c.status}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {res.data.warnings.map((w) => (
              <p key={w} className="mb-3 flex items-center gap-2 rounded border border-[hsl(var(--turmeric)/0.6)] bg-[hsl(var(--turmeric)/0.12)] px-3 py-2 text-sm" data-testid="text-search-warning">
                <TriangleAlert className="h-4 w-4 shrink-0 text-[hsl(30_70%_35%)]" /> {w}
              </p>
            ))}
            {res.data.papers.length === 0 ? (
              <EmptyState icon={<Search className="h-5 w-5" />} title="Nothing matched" body="Loosen filters or try synonyms. Engineering terms vary a lot between communities." />
            ) : (
              <>
                <div className="mb-2 flex justify-end">
                  <button onClick={() => selection.addMany(res.data!.papers.map((p) => ({ id: p.id, title: p.title })))} className="text-xs text-primary hover:underline" data-testid="button-select-page">
                    Select all on this page
                  </button>
                </div>
                <div className="divide-y overflow-hidden rounded-md border">
                  {res.data.papers.map((p, i) => <PaperRow key={p.id} paper={p} saved={saved.has(p.id)} index={(page - 1) * res.data!.papers.length + i + 1} />)}
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} data-testid="button-prev-page">
                    <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                  </Button>
                  <span className="font-mono text-xs text-muted-foreground">Page {page}</span>
                  <Button variant="outline" size="sm" disabled={res.data.hasMore === false || res.data.papers.length === 0} onClick={() => setPage((p) => p + 1)} data-testid="button-next-page">
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </>
        ) : null}
      </div>

      {sel.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 flex w-[min(640px,calc(100%-2rem))] -translate-x-1/2 items-center gap-3 rounded-lg bg-sidebar px-4 py-3 text-sidebar-foreground shadow-2xl animate-in slide-in-from-bottom-4 lg:ml-30" data-testid="tray-selection">
          <span className="flex h-7 min-w-7 items-center justify-center rounded bg-vermilion px-1.5 font-mono text-sm text-white">{sel.length}</span>
          <span className="flex-1 text-sm">papers selected across pages{sel.length < 10 ? <span className="opacity-70"> &middot; reviews need 10-50</span> : sel.length > 50 ? <span className="text-turmeric"> &middot; over the 50 review limit</span> : <span className="opacity-70"> &middot; ready for a review</span>}</span>
          <button onClick={() => selection.clear()} className="rounded p-1.5 hover:bg-sidebar-accent" title="Clear selection" data-testid="button-clear-selection">
            <X className="h-4 w-4" />
          </button>
          <Link href="/research" className="press rounded-md bg-turmeric px-3 py-1.5 text-sm font-medium text-[hsl(216_42%_13%)]" data-testid="link-analyse-selection">
            Analyse
          </Link>
        </div>
      )}
    </>
  );
}
