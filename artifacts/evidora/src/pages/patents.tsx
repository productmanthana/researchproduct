import { useState, type FormEvent } from "react";
import { LiveWebEvidence } from "@/components/web-evidence";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchStudioPatents, getSearchStudioPatentsQueryKey, useSaveStudioItem, getListStudioItemsQueryKey, type StudioPatentSearch, type SearchStudioPatentsRegion } from "@workspace/api-client-react";
import { BookmarkPlus, ExternalLink, Lock, Search, Stamp } from "lucide-react";
import { Link } from "wouter";
import { RequireAuth } from "@/components/require-auth";
import { ErrorState, RowSkeleton } from "@/components/states";
import { StudioHeader } from "@/components/studio/studio-page";
import { useActiveProject } from "@/lib/active-project";
import { useToast } from "@/hooks/use-toast";
import { friendlyError } from "@/lib/studio";

function toMarkdown(q: string, region: string, r: StudioPatentSearch) {
  const rows = r.patents.map((p, i) => `## ${i + 1}. ${p.title}\n\n${[p.applicant && `Applicant: ${p.applicant}`, p.country && `Country: ${p.country}`, p.date && `Date: ${p.date}`].filter(Boolean).join(" · ")}\n\n${p.abstract}\n\n${p.url}`);
  return `# Patent search: ${q}\n\nRegion: ${region}. Retrieved ${new Date().toLocaleDateString()}.\n\n${r.message}\n\n${rows.join("\n\n")}`;
}

function Inner() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { project } = useActiveProject();
  const save = useSaveStudioItem();
  const [draft, setDraft] = useState("");
  const [region, setRegion] = useState<SearchStudioPatentsRegion>("world");
  const [query, setQuery] = useState<{ q: string; region: SearchStudioPatentsRegion } | null>(null);
  const res = useSearchStudioPatents(query ?? { q: "" }, { query: { enabled: !!query, queryKey: getSearchStudioPatentsQueryKey(query ?? { q: "" }), retry: false } });
  const submit = (e: FormEvent) => { e.preventDefault(); if (draft.trim().length >= 3) setQuery({ q: draft.trim(), region }); };
  const data = res.data;

  const saveResult = async () => {
    if (!project || !data || !query) return;
    try {
      await save.mutateAsync({ data: { projectId: project.id, kind: "patent", title: `Patent search: ${query.q}`.slice(0, 300), content: toMarkdown(query.q, query.region, data) } });
      await qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
      toast({ title: "Saved to Library", description: `${data.patents.length} patent records saved to ${project.name}.` });
    } catch (e) { toast({ title: "Couldn't save", description: friendlyError(e), variant: "destructive" }); }
  };

  return (
    <>
      <StudioHeader kicker="Patents" title="Has someone already patented it?" intro="Search patent records for your idea. Only real records returned by a configured patent service are shown; when the service is not connected, you get direct links to search official databases yourself." />
      <form onSubmit={submit} className="sx-card flex flex-col gap-2 p-3 md:flex-row" data-testid="form-patent-search">
        <input className="sx-input flex-1" value={draft} onChange={e => setDraft(e.target.value)} placeholder="e.g. low-cost arsenic test strip for groundwater" data-testid="input-patent-query" />
        <select className="sx-input md:w-40" value={region} onChange={e => setRegion(e.target.value as SearchStudioPatentsRegion)} data-testid="select-patent-region">
          <option value="world">Worldwide</option><option value="US">United States</option><option value="IN">India</option>
        </select>
        <button className="sx-btn sx-primary" disabled={draft.trim().length < 3} data-testid="button-patent-search"><Search />Search</button>
      </form>
      <div className="mt-6 space-y-4">
        {!query && <div className="sx-card grid-paper flex flex-col items-center p-12 text-center"><Stamp className="h-10 w-10 text-[hsl(var(--teal))] opacity-70" strokeWidth={1.2} /><p className="sx-title mt-4 text-2xl">Describe the invention in plain words</p><p className="mt-1 text-sm text-muted-foreground">We will not invent or estimate patent results.</p></div>}
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
            {data.available && data.patents.length > 0 && (project
              ? <button className="sx-btn sx-primary" disabled={save.isPending} onClick={() => void saveResult()} data-testid="button-save-patents"><BookmarkPlus />{save.isPending ? "Saving..." : `Save these ${data.patents.length} results to Library`}</button>
              : <Link href="/my-library" className="sx-btn">Choose a project to save results</Link>)}
          </>
        )}
      </div>
    </>
  );
}

export default function Patents() { return <RequireAuth what="patent search"><Inner /></RequireAuth>; }
