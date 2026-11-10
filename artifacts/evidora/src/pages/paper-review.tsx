import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useCreatePaperReview, useListStudioTemplates, exportPaperScorecard, getListStudioItemsQueryKey, type StudioItem } from "@workspace/api-client-react";
import { ClipboardCheck, Download, FileSearch, History, Info, Scale, TriangleAlert } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { ErrorState } from "@/components/states";
import { StudioHeader } from "@/components/studio/studio-page";
import { NeedsProject } from "@/components/studio/project-switcher";
import { ProjectAttachMenu } from "@/components/studio/project-attach";
import { HistoryDrawer, WorkspaceBar, WorkspaceIntro } from "@/components/studio/workspace-shell";
import { useProjectItems, useStudioItem } from "@/components/studio/use-studio";
import { DocumentReviewWorkspace } from "@/components/document-review/document-review-workspace";
import { AgentProgressChip, useAgentJob } from "@/components/agent-progress/provider";
import { documentReviewWorkflow } from "@/lib/agent-workflow";
import { useActiveProject } from "@/lib/active-project";
import { useToast } from "@/hooks/use-toast";
import { friendlyError, isWorking, KIND_LABEL, latestItems } from "@/lib/studio";
import { confirmLeave } from "@/lib/unsaved";
import { RequirementsCheck, ResearchCoverage, requirementsCheckOf, researchCoverageOf } from "@/components/studio/requirements-check";
import { ApplyFormatAction } from "@/components/studio/apply-format-action";
import "./paper-review.css";

type DocType = "manuscript" | "proposal" | "thesis" | "literature";
type Severity = "critical" | "revision" | "suggestion" | "strength";
type Scorecard = {
  overall: number | null; assessedCategories: number; checkedAt: string; documentType: string; scope: string;
  reviewers: { role: string; summary: string; categories: { key: string; label: string; score: number | null; rationale: string; location: string; improvement: string }[]; findings: { severity: Severity; location: string; comment: string; recommendation: string; sourceIds: string[] }[] }[];
  categories: { key: string; label: string; score: number | null; assessments: number }[];
  overlaps: { sourceId: string; relationship: string; overlap: string; difference: string; improvement: string }[];
  gaps: { question: string; rationale: string; sourceIds: string[] }[];
};
type RSource = { id: string; title: string; url?: string; text?: string; evidenceLevel?: string };

const DOC_TYPES: { v: DocType; label: string }[] = [
  { v: "manuscript", label: "Journal manuscript" }, { v: "proposal", label: "Research proposal" },
  { v: "thesis", label: "Thesis or dissertation" }, { v: "literature", label: "Literature review" },
];
const SEV: Record<Severity, { label: string; tone: string }> = {
  critical: { label: "Critical", tone: "8 62% 42%" }, revision: { label: "Revision", tone: "32 80% 38%" },
  suggestion: { label: "Suggestion", tone: "190 45% 32%" }, strength: { label: "Strength", tone: "158 45% 30%" },
};
const md = (i?: StudioItem | null) => ((i?.metadata ?? {}) as Record<string, unknown>);
const isPaperReview = (i: StudioItem) => i.kind === "document-review" && md(i).paperReview === true;
const kindToType = (k?: string): DocType => (k === "thesis" ? "thesis" : k === "literature" ? "literature" : k === "synopsis" ? "proposal" : "manuscript");
const scoreText = (s: number | null | undefined) => (typeof s === "number" ? `${Math.round(s * 10) / 10} / 10` : "Not assessed");

function useParams() {
  const search = useSearch();
  const [location, setLocation] = useLocation();
  const p = new URLSearchParams(search);
  const set = (patch: Record<string, string | null>) => {
    const n = new URLSearchParams(search);
    for (const [k, v] of Object.entries(patch)) { if (v) n.set(k, v); else n.delete(k); }
    const qs = n.toString();
    setLocation(`${location}${qs ? `?${qs}` : ""}`);
  };
  return { source: p.get("source") ?? "", item: p.get("item"), set };
}

function Meter({ label, score, sub }: { label: string; score: number | null; sub?: string }) {
  const pct = typeof score === "number" ? Math.max(0, Math.min(100, score * 10)) : 0;
  return (
    <div className="py-2" data-testid={`meter-${label}`}>
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="font-medium text-[hsl(var(--ink-teal))]">{label}</span>
        <span className={typeof score === "number" ? "font-mono tabular-nums" : "text-xs italic text-muted-foreground"}>{scoreText(score)}</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-[hsl(90_14%_88%)]" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={10} aria-valuenow={typeof score === "number" ? score : undefined} aria-valuetext={scoreText(score)}>
        {typeof score === "number" && <div className="h-full rounded-full bg-[hsl(var(--teal))]" style={{ width: `${pct}%` }} />}
      </div>
      {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ScorecardPanel({ item }: { item: StudioItem }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const m = md(item);
  const sc = m.scorecard as Scorecard | undefined;
  const sources = (Array.isArray(m.reviewSources) ? m.reviewSources : []) as RSource[];
  const warnings = (Array.isArray(m.reviewWarnings) ? m.reviewWarnings : []).map(String);
  const src = new Map(sources.map(s => [s.id, s]));
  const target = typeof (m.request as {target?:string} | undefined)?.target === "string" ? (m.request as {target:string}).target : "";
  const download = async () => {
    setBusy(true);
    try {
      const blob = await exportPaperScorecard(item.id, { responseType: "blob" } as Parameters<typeof exportPaperScorecard>[1]);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `${(item.title || "paper-review").replace(/[^\w\- ]+/g, "").slice(0, 70).trim() || "paper-review"} - readiness scorecard.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (e) { toast({ title: "Scorecard export failed", description: friendlyError(e), variant: "destructive" }); }
    finally { setBusy(false); }
  };
  const cite = (ids: string[]) => ids.length > 0 && (
    <span className="mt-1 flex flex-wrap gap-1">{ids.map(id => { const s = src.get(id); return s?.url
      ? <a key={id} href={s.url} target="_blank" rel="noreferrer" className="sx-chip underline" data-testid={`link-source-${id}`}>{s.title}</a>
      : <span key={id} className="sx-chip" title={s?.text}>{s?.title ?? id}</span>; })}</span>);

  if (!sc) return (
    <section className="sx-card p-5" data-testid="status-scorecard-missing">
      <p className="sx-eyebrow">Readiness scorecard</p>
      <p className="mt-2 text-[13px] text-muted-foreground">{isWorking(item.status) ? "The reviewer panel scores this document after reading it. The scorecard appears here when ready." : "No scorecard was saved for this review. The document feedback below is still available."}</p>
    </section>
  );
  return (
    <section className="sx-card rise overflow-hidden" aria-label="Readiness scorecard" data-testid="panel-scorecard">
      <div className="flex flex-wrap items-start gap-4 border-b border-[hsl(90_14%_86%)] bg-[hsl(66_22%_95%)] px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="sx-eyebrow">Readiness scorecard · {DOC_TYPES.find(d => d.v === sc.documentType)?.label ?? sc.documentType}</p>
          <p className="mt-1 font-serif text-3xl text-[hsl(var(--ink-teal))]" data-testid="text-overall-score">{sc.overall===null?"Not assessed":`${sc.overall} / 100`}</p>
          <p className="mt-1 text-xs text-muted-foreground">Heuristic reviewer score across {sc.assessedCategories} assessed {sc.assessedCategories === 1 ? "category" : "categories"}{sc.checkedAt ? ` · ${new Date(sc.checkedAt).toLocaleString()}` : ""}. It is not an acceptance probability or a publication guarantee.</p>
        </div>
        <button className="sx-btn sx-primary" onClick={() => void download()} disabled={busy} data-testid="button-export-scorecard"><Download />{busy ? "Preparing..." : "Readiness PDF"}</button>
      </div>
      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div>
          <h3 className="sx-eyebrow">Category scores</h3>
          {sc.categories.map(c => <Meter key={c.key} label={c.label} score={c.score} sub={c.assessments ? `${c.assessments} reviewer ${c.assessments === 1 ? "assessment" : "assessments"}` : "No reviewer assessed this"} />)}
          {target && <div className="mt-4 rounded-md border border-dashed border-[hsl(110_14%_78%)] p-3 text-xs" data-testid="text-target"><p className="font-medium text-[hsl(var(--ink-teal))]">Your target guidelines</p><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{target}</p><p className="mt-1 italic text-muted-foreground">Read as you supplied them; not checked against official journal or institution rules.</p></div>}
          <div className="mt-4 rounded-md bg-[hsl(190_30%_95%)] p-3 text-xs text-[hsl(var(--ink-teal))]" data-testid="text-scope"><p className="flex items-center gap-1.5 font-medium"><Info className="h-3.5 w-3.5" />Scope of this review</p><p className="mt-1 whitespace-pre-wrap">{sc.scope}</p><p className="mt-1 text-muted-foreground">Comparisons cover only the sources listed here, not every published paper, patent or web page. No novelty, patentability or market claim is made.</p></div>
          {warnings.length > 0 && <ul className="mt-3 space-y-1 text-xs text-[hsl(32_70%_32%)]" data-testid="list-review-warnings">{warnings.map((w, i) => <li key={i} className="flex gap-1.5"><TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />{w}</li>)}</ul>}
        </div>
        <div className="space-y-4">
          <h3 className="sx-eyebrow">Reviewer panel</h3>
          {sc.reviewers.map((r, ri) => (
            <details key={ri} className="rounded-md border border-[hsl(90_14%_86%)] p-3" open={ri === 0} data-testid={`reviewer-${ri}`}>
              <summary className="cursor-pointer text-[13px] font-medium text-[hsl(var(--ink-teal))]">{r.role}</summary>
              <p className="mt-2 text-[13px]">{r.summary}</p>
              {r.categories.map(c => <div key={c.key} className="mt-2 border-l-2 border-[hsl(var(--teal)/0.4)] pl-3 text-xs"><p><span className="font-medium">{c.label}</span> · <span className="font-mono">{scoreText(c.score)}</span>{c.location && <span className="text-muted-foreground"> · {c.location}</span>}</p><p className="mt-0.5 text-muted-foreground">{c.rationale}</p>{c.improvement && <p className="mt-0.5">To improve: {c.improvement}</p>}</div>)}
              {r.findings.length > 0 && <ul className="mt-3 space-y-2">{r.findings.map((f, fi) => <li key={fi} className="text-xs"><span className="mr-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[hsl(60_30%_97%)]" style={{ background: `hsl(${SEV[f.severity]?.tone ?? SEV.suggestion.tone})` }}>{SEV[f.severity]?.label ?? f.severity}</span><span className="text-muted-foreground">{f.location}</span><p className="mt-1">{f.comment}</p>{f.recommendation && <p className="mt-0.5 text-[hsl(var(--ink-teal))]">Recommendation: {f.recommendation}</p>}{cite(f.sourceIds)}</li>)}</ul>}
            </details>
          ))}
        </div>
      </div>
      {<div className="grid gap-6 border-t border-[hsl(90_14%_86%)] p-5 lg:grid-cols-2">
        <div>
          <h3 className="sx-eyebrow flex items-center gap-1.5"><Scale className="h-3.5 w-3.5" />Comparison with papers, patents and web</h3>
          {sc.overlaps.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">No evidence-grounded overlap comparison was returned. This does not establish novelty or market availability.</p> : <ul className="mt-2 space-y-3">{sc.overlaps.map((o, i) => { const s = src.get(o.sourceId); return <li key={i} className="text-xs" data-testid={`overlap-${i}`}><p className="font-medium">{s?.url ? <a href={s.url} target="_blank" rel="noreferrer" className="underline">{s.title}</a> : s?.title ?? o.sourceId} <span className="font-normal text-muted-foreground">· {o.relationship}{s?.evidenceLevel ? ` · ${s.evidenceLevel}` : ""}</span></p><p className="mt-0.5"><span className="text-muted-foreground">Overlap:</span> {o.overlap}</p><p><span className="text-muted-foreground">Difference:</span> {o.difference}</p>{o.improvement && <p className="text-[hsl(var(--ink-teal))]">Sharpen: {o.improvement}</p>}</li>; })}</ul>}
        </div>
        <div>
          <h3 className="sx-eyebrow">Open questions and gaps</h3>
          {!sc.gaps.length&&<p className="mt-2 text-xs text-muted-foreground">No defensible candidate gap was identified in the retrieved evidence.</p>}
          <ul className="mt-2 space-y-3">{sc.gaps.map((g, i) => <li key={i} className="text-xs" data-testid={`gap-${i}`}><p className="font-medium">{g.question}</p><p className="text-muted-foreground">{g.rationale}</p>{cite(g.sourceIds)}</li>)}</ul>
        </div>
      </div>}
    </section>
  );
}

function ReviewView({ id, onClose }: { id: string; onClose: () => void }) {
  const [mobileView,setMobileView]=useState<"document"|"feedback">("document");
  const q = useStudioItem(id);
  const item = q.data;
  const job = item && isWorking(item.status) ? documentReviewWorkflow(item) : null;
  useAgentJob(job);
  if (q.isLoading) return <div className="sx-card space-y-3 p-5" data-testid="status-review-loading">{[70, 92, 55].map(w => <div key={w} className="h-3 animate-pulse rounded bg-[hsl(90_14%_88%)]" style={{ width: `${w}%` }} />)}</div>;
  if (q.isError || !item) return <ErrorState error={q.error} title="Couldn't open this review" onRetry={() => void q.refetch()} />;
  return (
    <div className="space-y-5">
      {job && <div className="sx-card p-4" data-testid="status-paper-review-working"><AgentProgressChip jobKey={job.key} /><p className="mt-2 text-xs text-muted-foreground">Your manuscript stays readable below while the review runs. You can leave and return; progress is saved.</p></div>}
      {item.status === "failed" && <ErrorState error={{ message: item.error || "The review did not finish." }} title="Review failed" />}
      {!isWorking(item.status) && <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div>
        <RequirementsCheck formatCopy data={requirementsCheckOf(item)} emptyHint="This review has no saved requirements check. Reviews started before this feature, or without a target, show scores and comparisons only." />
          <ApplyFormatAction review={item} />
        </div>
        {researchCoverageOf(item) ? <ResearchCoverage data={researchCoverageOf(item)} /> : <section className="sx-card p-4 text-xs text-muted-foreground" data-testid="panel-research-coverage-empty"><p className="sx-eyebrow">What was searched</p><p className="mt-2">Search counts were not recorded for this review. The comparisons below list every source that was used.</p></section>}
      </div>}
      <ScorecardPanel item={item} />
      <div className="es-root paper-review-document" data-mobile-view={mobileView}>
        <div className="paper-review-mobile-tabs" role="tablist" aria-label="Manuscript review view">
          <button role="tab" aria-selected={mobileView==="document"} onClick={()=>setMobileView("document")}>Document</button>
          <button role="tab" aria-selected={mobileView==="feedback"} onClick={()=>setMobileView("feedback")}>Feedback</button>
        </div>
        <div className="es-workspace dr-mode"><DocumentReviewWorkspace reviewId={id} onClose={onClose} chatMode /></div>
      </div>
    </div>
  );
}

function Inner() {
  const { project } = useActiveProject();
  const items = useProjectItems(project?.id);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { source, item: reviewId, set } = useParams();
  const [docType, setDocType] = useState<DocType | "">("");
  const [target, setTarget] = useState("");
  const [tplPick, setTplPick] = useState<string | null>(null);
  const templates = useListStudioTemplates();
  const [busy, setBusy] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const create = useCreatePaperReview({ mutation: { onSuccess: () => void qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() }) } });
  const intro = "Three AI-assisted reviewers assess your document, explain category scores and compare it with retrieved papers, patent records and available web evidence. See what needs revision before submission, with review coverage clearly stated.";
  if (!project) return <><StudioHeader kicker="Paper Review" title="Get a careful second read before you submit." intro={intro} /><NeedsProject what="Paper review" /></>;
  const all = items.data ?? [];
  const choices = latestItems(all.filter(i => i.status === "completed" && i.content.trim() && i.kind !== "document-review" && !md(i).paperReview));
  const chosen = choices.find(i => i.id === source);
  const type: DocType = docType || kindToType(chosen?.kind);
  const tplKind = type === "thesis" || type === "proposal" ? "thesis" : "journal";
  const tplOptions = (templates.data ?? []).filter(t => t.kind === tplKind || (type === "proposal" && t.kind === "synopsis"));
  const inherited = typeof md(chosen).templateId === "string" ? md(chosen).templateId as string : "";
  const tplId = tplPick ?? (tplOptions.some(t => t.id === inherited) ? inherited : "");
  const tpl = tplOptions.find(t => t.id === tplId);
  const history = all.filter(isPaperReview).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const run = async () => {
    if (!chosen || create.isPending || busy) return;
    try {
      const r = await create.mutateAsync({ data: { projectId: project.id, sourceItemId: chosen.id, documentType: type, ...(tpl ? { target: tpl.name } : target.trim() ? { target: target.trim() } : {}) } });
      set({ item: r.id, source: chosen.id });
    } catch (e) { toast({ title: "Could not start the review", description: friendlyError(e), variant: "destructive" }); }
  };
  const open = (id: string | null) => { if (!confirmLeave()) return; set({ item: id }); };

  return (
    <div className="mx-auto max-w-[1100px] pb-8">
      {reviewId
        ? <WorkspaceBar newLabel="Start another review" onNew={() => open(null)} label={`Paper Review · ${all.find(i => i.id === reviewId)?.title ?? "Saved review"}`} onHistory={() => setDrawer(true)} projectName={project.name} />
        : <WorkspaceIntro kicker="Paper Review" title="Get a careful second read before you submit." sub={intro} projectName={project.name} onHistory={() => setDrawer(true)} />}

      {!reviewId && <section className="sx-card sx-composer-wide overflow-hidden" aria-label="Document to review" data-testid="composer-paper-review">
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="select-review-source" className="sx-eyebrow">Document to review</label>
            {items.isError && <ErrorState error={items.error} onRetry={() => void items.refetch()} />}
            <select id="select-review-source" className="sx-input mt-1.5" value={source} onChange={e => { set({ source: e.target.value || null }); setDocType(""); setTplPick(null); }} disabled={items.isLoading} data-testid="select-review-source">
              <option value="">{items.isLoading ? "Loading..." : choices.length ? "Choose a saved document" : "No saved documents yet - attach a PDF or Word file below"}</option>
              {choices.map(i => <option key={i.id} value={i.id}>{KIND_LABEL[i.kind] ?? i.kind}: {i.title} (rev {i.revision})</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="select-doc-type" className="sx-eyebrow">Review it as</label>
            <select id="select-doc-type" className="sx-input mt-1.5" value={type} onChange={e => { setDocType(e.target.value as DocType); setTplPick(null); }} data-testid="select-document-type">
              {DOC_TYPES.map(d => <option key={d.v} value={d.v}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="select-target-template" className="sx-eyebrow">{tplKind === "journal" ? "Target journal" : "Target university format"}</label>
            <select id="select-target-template" className="sx-input mt-1.5" value={tplId} onChange={e => setTplPick(e.target.value)} disabled={templates.isLoading} data-testid="select-target-template">
              <option value="">{templates.isLoading ? "Loading..." : templates.isError ? "Couldn't load the list - describe it below" : "None - describe guidelines below"}</option>
              {tplOptions.map(t => <option key={t.id} value={t.id}>{t.name}{t.publisher ? ` (${t.publisher})` : ""}</option>)}
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground" data-testid="text-target-hint">{tpl ? `${tplId === inherited ? "Taken from this document's saved layout. " : ""}We retrieve ${tpl.name}'s official instructions where available and list what still needs your action.` : "Pick one so we can retrieve its official instructions, or describe your own below."}</p>
          </div>
          {!tpl && <div className="md:col-span-2">
            <label htmlFor="input-target" className="sx-eyebrow">Target journal or guidelines (optional)</label>
            <textarea id="input-target" className="sx-input mt-1.5 min-h-[42px]" rows={2} maxLength={2000} value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. Journal name, word limit, required sections" data-testid="input-target" />
            <p className="mt-1 text-[11px] text-muted-foreground">Used as you write it. These are not checked against an official source.</p>
          </div>}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-[hsl(90_14%_86%)] bg-[hsl(66_22%_95%)] px-4 py-3">
          <ProjectAttachMenu projectId={project.id} items={all} onBusyChange={setBusy} />
          <button className="sx-btn sx-primary" disabled={!chosen || create.isPending || busy} onClick={() => void run()} data-testid="button-start-paper-review"><ClipboardCheck />{create.isPending ? "Starting..." : busy ? "Preparing document..." : "Check requirements & research"}</button>
          <span className="min-w-0 flex-1 text-xs text-muted-foreground">Checks the official rules we can retrieve for your target, then compares your draft with relevant papers and patents. Scores are guidance, not acceptance odds; you approve each change.</span>
        </div>
      </section>}

      <div className="mt-5" aria-live="polite">
        {reviewId ? <ReviewView key={reviewId} id={reviewId} onClose={() => open(null)} />
          : <div className="flex items-center gap-4 rounded-lg border border-dashed border-[hsl(110_14%_78%)] px-4 py-3" data-testid="status-paper-review-empty">
              <FileSearch className="h-6 w-6 shrink-0 text-[hsl(var(--teal))]" strokeWidth={1.4} />
              <p className="text-[13px] text-muted-foreground"><span className="font-medium text-[hsl(var(--ink-teal))]">{chosen ? "Ready to review." : "Pick or attach a document to begin."}</span> {history.length ? `${history.length} saved ${history.length === 1 ? "review" : "reviews"} in History.` : "Your reviews are saved to this project."}</p>
            </div>}
      </div>

      <HistoryDrawer open={drawer} onOpenChange={setDrawer} title="Saved paper reviews" description={`Paper reviews in ${project.name}. Each keeps its scorecard, sources and your decisions.`}>
        {history.length === 0 ? <p className="text-sm text-muted-foreground" data-testid="text-history-empty">No paper reviews yet.</p>
          : <ul className="space-y-1.5">{history.map(h => { const s = (md(h).scorecard as Scorecard | undefined); return (
            <li key={h.id}><button className={`w-full rounded-md border px-3 py-2 text-left text-[13px] ${h.id === reviewId ? "border-[hsl(var(--teal))] bg-[hsl(190_30%_95%)]" : "border-[hsl(90_14%_86%)]"}`} onClick={() => { setDrawer(false); open(h.id); }} data-testid={`button-open-review-${h.id}`}>
              <span className="flex items-center gap-1.5 font-medium"><History className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{h.title}</span></span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{isWorking(h.status) ? "In progress" : h.status === "failed" ? "Failed" : s ? `Overall ${s.overall===null?"Not assessed":`${s.overall} / 100`}` : "Feedback only"} · {new Date(h.createdAt).toLocaleDateString()}</span>
            </button></li>); })}</ul>}
      </HistoryDrawer>
    </div>
  );
}

export default function PaperReview() { return <RequireAuth what="paper review"><Inner /></RequireAuth>; }
