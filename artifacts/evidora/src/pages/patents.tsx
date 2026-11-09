import { useState, type FormEvent } from "react";
import { LiveWebEvidence } from "@/components/web-evidence";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchStudioPatents, getSearchStudioPatentsQueryKey, useSaveStudioItem, getListStudioItemsQueryKey, getGetStudioItemQueryKey, type StudioPatentSearch, type SearchStudioPatentsRegion } from "@workspace/api-client-react";
import { StudioDiscussion } from "@/components/studio/studio-discussion";
import { useProjectItems, useStudioItem } from "@/components/studio/use-studio";
import { useItemParam } from "@/components/studio/use-item-param";
import { BookmarkPlus, ExternalLink, FolderOpen, Lock, Search, Stamp } from "lucide-react";
import { ProjectAttachMenu } from "@/components/studio/project-attach";
import { HistoryDrawer, WorkspaceBar, WorkspaceIntro } from "@/components/studio/workspace-shell";
import { ItemList } from "@/components/studio/item-list";
import { Link } from "wouter";
import { RequireAuth } from "@/components/require-auth";
import { ErrorState, RowSkeleton } from "@/components/states";
import { useActiveProject } from "@/lib/active-project";
import { useToast } from "@/hooks/use-toast";
import { friendlyError } from "@/lib/studio";
import { confirmLeave, useUnsavedGuard } from "@/lib/unsaved";

function toMarkdown(q: string, region: string, r: StudioPatentSearch) {
  const rows = r.patents.map((p, i) => `## ${i + 1}. ${p.title}\n\n${[p.applicant && `Applicant: ${p.applicant}`, p.country && `Country: ${p.country}`, p.date && `Date: ${p.date}`].filter(Boolean).join(" · ")}\n\n${p.abstract}\n\n${p.url}`);
  return `# Patent search: ${q}\n\nRegion: ${region}. Retrieved ${new Date().toLocaleDateString()}.\n\n${r.message}\n\n${rows.join("\n\n")}\n\n${r.links.map(l => `[${l.label}](${l.url})`).join("\n\n")}`;
}

function Inner() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { project } = useActiveProject();
  const save = useSaveStudioItem();
  const { id, setId } = useItemParam();
  const items = useProjectItems(project?.id);
  const open = useStudioItem(id);
  const selected = open.data?.projectId === project?.id ? open.data : undefined;
  const [draft, setDraft] = useState("");
  const [region, setRegion] = useState<SearchStudioPatentsRegion>("world");
  const [query, setQuery] = useState<{ q: string; region: SearchStudioPatentsRegion } | null>(null);
  const res = useSearchStudioPatents(query ?? { q: "" }, { query: { enabled: !!query, queryKey: getSearchStudioPatentsQueryKey(query ?? { q: "" }), retry: false } });
  const submit = (e: FormEvent) => { e.preventDefault(); if (draft.trim().length >= 3 && confirmLeave()) { setId(null); setQuery({ q: draft.trim(), region }); } };
  const data = res.data;
  useUnsavedGuard("patent-query", draft.trim().length > 0 && draft.trim() !== query?.q, "Your patent search has not been run.");

  const saveResult = async () => {
    if (!project || !data || !query) return;
    try {
      const item = await save.mutateAsync({ data: { projectId: project.id, kind: "patent", title: `Patent search: ${query.q}`.slice(0, 300), content: toMarkdown(query.q, query.region, data) } });
      qc.setQueryData(getGetStudioItemQueryKey(item.id), item);
      await qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
      setId(item.id, { guard: true });
      toast({ title: "Search saved to Library", description: `The search summary and ${data.patents.length} returned patent records are saved in ${project.name}.` });
    } catch (e) { toast({ title: "Couldn't save", description: friendlyError(e), variant: "destructive" }); }
  };

  const [drawer, setDrawer] = useState(false);
  const all = items.data ?? [];
  const newSearch = () => { if (!confirmLeave()) return; setQuery(null); setDraft(""); setId(null); };
  const showingResults = !!query || !!id;
  return (
    <div className="mx-auto max-w-[900px] pb-6">
      {showingResults
        ? <WorkspaceBar newLabel="New search" onNew={newSearch} label={query ? `Patents · ${query.q}` : selected ? `Patents · ${selected.title}` : "Patents"} onHistory={project ? () => setDrawer(true) : undefined} projectName={project?.name} />
        : <WorkspaceIntro kicker="Patents" title="Has someone already patented it?" sub="Searches real patent records through the configured patent service. When it is unavailable you get direct links to official databases; nothing is estimated or invented." projectName={project?.name} onHistory={project ? () => setDrawer(true) : undefined} />}
      <form onSubmit={submit} className="sx-card sx-composer-wide overflow-hidden" data-testid="form-patent-search">
        <label htmlFor="input-patent-query" className="sr-only">Describe the invention</label>
        <textarea id="input-patent-query" rows={2} className="sx-wide-input !min-h-[72px]" value={draft} onChange={e => setDraft(e.target.value)} maxLength={500}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
          placeholder="Describe the invention in plain words, e.g. low-cost arsenic test strip for groundwater" data-testid="input-patent-query" />
        <div className="flex flex-wrap items-center gap-2 border-t border-[hsl(90_14%_86%)] bg-[hsl(66_22%_95%)] px-4 py-3">
          <label htmlFor="select-patent-region" className="sx-eyebrow">Region</label>
          <select id="select-patent-region" className="sx-input !w-auto" value={region} onChange={e => setRegion(e.target.value as SearchStudioPatentsRegion)} data-testid="select-patent-region">
            <option value="world">Worldwide</option><option value="US">United States</option><option value="IN">India</option>
          </select>
          <span className="ml-auto hidden font-mono text-[10.5px] text-muted-foreground sm:inline">Enter to search</span>
          <button className="sx-btn sx-primary" disabled={draft.trim().length < 3} data-testid="button-patent-search"><Search />Search patents</button>
        </div>
      </form>
      <div className="mt-6 space-y-4" aria-live="polite">
        {!query && !id && <div className="flex items-center gap-4 rounded-lg border border-dashed border-[hsl(110_14%_78%)] px-4 py-3" data-testid="status-patents-empty"><Stamp className="h-6 w-6 shrink-0 text-[hsl(var(--teal))]" strokeWidth={1.4} /><p className="text-[13px] text-muted-foreground"><span className="font-medium text-[hsl(var(--ink-teal))]">Results open here.</span> Save a search to your project to discuss it in follow-ups; saved searches reopen from History.</p></div>}
        {query && <LiveWebEvidence q={query.q} />}
        {res.isLoading && <RowSkeleton rows={3} />}
        {res.isError && <ErrorState error={{ message: friendlyError(res.error) }} onRetry={() => void res.refetch()} title="Patent search failed" />}
        {data && (
          <>
            {!data.available && (
              <div className="sx-card border-[hsl(var(--turmeric)/0.7)] bg-[hsl(var(--turmeric)/0.08)] p-5" role="status" data-testid="status-patents-unavailable">
                <p className="flex items-center gap-2 font-medium"><Lock className="h-4 w-4" />Patent search is not connected yet</p>
                <p className="mt-1 text-sm">{data.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">No patent records are shown because none were retrieved. Use the official databases below.</p>
              </div>
            )}
            {data.available && <p className="text-sm text-muted-foreground" data-testid="text-patent-message">{data.message}</p>}
            {data.links.length > 0 && <div className="flex flex-wrap gap-2">{data.links.map(l => <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="sx-btn" data-testid={`link-patent-db-${l.label}`}><ExternalLink />{l.label}</a>)}</div>}
            {data.patents.map(p => (
              <article key={p.id} className="sx-card p-5" data-testid={`card-patent-${p.id}`}>
                <p className="font-mono text-[11px] text-muted-foreground">{[p.id, p.country, p.date].filter(Boolean).join(" · ")}</p>
                <h3 className="sx-title mt-1 text-xl">{p.url ? <a href={p.url} target="_blank" rel="noreferrer" className="hover:underline">{p.title}</a> : p.title}</h3>
                {p.applicant && <p className="text-sm text-muted-foreground">{p.applicant}</p>}
                <p className="mt-2 line-clamp-4 text-sm leading-relaxed">{p.abstract}</p>
              </article>
            ))}
            {data.available && !data.patents.length && <p className="sx-card p-5 text-sm">No matching patent records were returned. Try broader words.</p>}
            {project
              ? <button className="sx-btn sx-primary" disabled={save.isPending} onClick={() => void saveResult()} data-testid="button-save-patents"><BookmarkPlus />{save.isPending ? "Saving..." : data.patents.length ? "Save and discuss these results" : "Save and discuss this search"}</button>
              : <Link href="/my-library" className="sx-btn">Choose a project to save results</Link>}
          </>
        )}
      </div>
      {id && open.isLoading && <div className="sx-card mt-5 h-32 animate-pulse" />}
      {id && open.isError && <ErrorState error={open.error} onRetry={() => void open.refetch()} title="Couldn't open saved patent discussion" />}
      {selected && <div className="mt-6"><StudioDiscussion item={selected} allItems={items.data ?? []} onOpen={x => setId(x)} hideDocument={!!data} attachSlot={project ? <ProjectAttachMenu projectId={project.id} items={all} /> : undefined} /></div>}
      {project && <HistoryDrawer open={drawer} onOpenChange={setDrawer} description={`Saved patent searches and their discussions in ${project.name}.`}>
        {items.isError ? <ErrorState error={items.error} onRetry={() => void items.refetch()} title="Couldn't load items" />
          : <ItemList items={all} kinds={["patent"]} activeId={id} loading={items.isLoading} onOpen={x => { setDrawer(false); if (!confirmLeave()) return; setQuery(null); setId(x); }} emptyText="No saved patent searches yet." />}
        <Link href="/my-library" className="sx-btn w-full" data-testid="link-project-library-drawer"><FolderOpen />Open {project.name} library</Link>
      </HistoryDrawer>}
    </div>
  );
}


export default function Patents() { return <RequireAuth what="patent search"><Inner /></RequireAuth>; }
