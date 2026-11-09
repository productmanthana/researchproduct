import { SaveAnalysisToProject } from "@/components/studio/save-analysis";
import { useEffect, useRef, useState } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { usageLimitMessage } from "@/lib/usage-limits";
import { AcademicAnswer } from "@/components/academic-answer";
import { AcademicReferences } from "@/components/academic-references";
import { analysisReferenceEntries, referenceSections } from "@/lib/references";
import { LiveDraft } from "@/components/live-draft";
import { AgentProgressChip, useAgentJob } from "@/components/agent-progress/provider";
import { researchWorkflow } from "@/lib/agent-workflow";
import {
  useCreateAnalysis,
  useGetAnalysis,
  getGetAnalysisQueryKey,
  useListAnalyses,
  getListAnalysesQueryKey,
  useUpdateAnalysis,
  useDeleteAnalysis,
  useListDocuments,
  getListDocumentsQueryKey,
  useListLibrary,
  getListLibraryQueryKey,
  useGetUsage,
  getGetUsageQueryKey,
  getGetSummaryQueryKey,
  getExportAnalysisUrl,
  type Analysis,
  type AnalysisInputKind,
  type AnalysisInput,
  type ComparisonRow,
  type ComparisonCell,
} from "@workspace/api-client-react";
import { AlertTriangle, BookOpen, Download, ExternalLink, FileImage, FileSearch, FileText, History, Layers, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RequireAuth } from "@/components/require-auth";
import { DocumentUpload } from "@/components/document-upload";
import { UsageMeters } from "@/components/usage-meters";
import { EmptyState, ErrorState, RowSkeleton } from "@/components/states";
import { HistoryDrawer, WorkspaceBar, WorkspaceIntro } from "@/components/studio/workspace-shell";
import { useToast } from "@/hooks/use-toast";
import { selection, useSelection } from "@/lib/selection";
import { ago, errMessage, evidenceTone } from "@/lib/format";

const KINDS: { k: AnalysisInputKind; label: string; icon: typeof FileSearch; hint: string }[] = [
  { k: "answer", label: "Evidence answer", icon: FileSearch, hint: "Up to 10 papers or PDFs. Answers grounded in the available evidence." },
  { k: "review", label: "Literature review", icon: Layers, hint: "Select 10 to 50 papers. Structured synthesis with citations." },
  { k: "image", label: "Figure reading", icon: FileImage, hint: "Needs a screenshot or PDF. Up to 3 relevant original page images per PDF are analysed." },
];

const isDone = (s?: string) => s === "completed" || s === "failed";

function LibraryPicker({ onClose }: { onClose: () => void }) {
  const lib = useListLibrary(undefined, { query: { queryKey: getListLibraryQueryKey() } });
  const sel = useSelection();
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[80dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add from library</DialogTitle>
          <DialogDescription>{sel.length} selected</DialogDescription>
        </DialogHeader>
        {lib.isLoading ? (
          <RowSkeleton rows={3} />
        ) : !lib.data?.length ? (
          <p className="text-sm text-muted-foreground">Your library is empty. <Link href="/discover" className="underline">Find papers</Link>.</p>
        ) : (
          <div className="divide-y rounded border">
            {lib.data.map((i) => {
              const on = sel.some((s) => s.id === i.paper.id);
              return (
                <label key={i.id} className="flex cursor-pointer items-start gap-3 px-3 py-2.5 text-sm hover:bg-muted/50">
                  <Checkbox checked={on} onCheckedChange={() => selection.toggle({ id: i.paper.id, title: i.paper.title })} className="mt-0.5" data-testid={`checkbox-pick-${i.paper.id}`} />
                  <span className="leading-snug">{i.paper.title}</span>
                </label>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Composer({ onCreated, initialQuestion = "" }: { onCreated: (id: string) => void; initialQuestion?: string }) {
  const [kind, setKind] = useState<AnalysisInputKind>("answer");
  const [question, setQuestion] = useState(initialQuestion);
  const [pagesText, setPagesText] = useState("");
  const [docIds, setDocIds] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);
  const sel = useSelection();
  const docs = useListDocuments({ query: { queryKey: getListDocumentsQueryKey() } });
  const usage = useGetUsage({ query: { queryKey: getGetUsageQueryKey() } });
  const create = useCreateAnalysis();
  const qc = useQueryClient();
  const { toast } = useToast();

  const readyDocs = (docs.data ?? []).filter((d) => d.status !== "failed" && (kind !== "review" ? true : d.contentType === "application/pdf"));
  const visibleDocs = kind === "answer" ? readyDocs.filter((d) => d.contentType === "application/pdf") : kind === "image" ? readyDocs : [];
  const chosenDocs = docIds.filter((id) => visibleDocs.some((d) => d.id === id));
  const paperIds = kind === "image" ? [] : sel.map((s) => s.id);

  const pageTokens = pagesText.split(/[\s,]+/).filter(Boolean);
  const pageNumbers = [...new Set(pageTokens.map(Number))];
  const pagesBad = kind === "image" && pageTokens.length > 0 && (pageNumbers.length > 3 || pageNumbers.some((n) => !Number.isInteger(n) || n < 1 || n > 50));
  const linked = kind !== "image";

  let problem: string | null = null;
  if (question.trim().length < 5) problem = "Write a question of at least 5 characters.";
  else if (kind === "answer" && paperIds.length + chosenDocs.length === 0) problem = "Select at least one paper or PDF.";
  else if (kind === "answer" && paperIds.length > 10) problem = `Answers use at most 10 papers. You have ${paperIds.length}.`;
  else if (kind === "review" && (paperIds.length < 10 || paperIds.length > 50)) problem = `Reviews need 10 to 50 papers. You have ${paperIds.length}.`;
  else if (kind === "image" && chosenDocs.length === 0) problem = "Choose at least one screenshot or PDF.";
  else if (pagesBad) problem = "Page numbers: up to 3 whole numbers between 1 and 50.";

  const u = usage.data;
  const allowance = u ? kind === "answer" ? [u.answersUsed,u.answersLimit] : kind === "review" ? [u.reviewsUsed,u.reviewsLimit] : [u.imagesUsed,u.imagesLimit] : null;
  const left = allowance ? allowance[1] < 0 ? Infinity : allowance[1]-allowance[0] : null;
  const limitMessage = usageLimitMessage(u, kind);
  if (limitMessage) problem = limitMessage;

  const submit = () => {
    if (limitMessage) {
      toast({ title: "Limit reached", description: limitMessage, variant: "destructive" });
      void qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
      return;
    }
    if (problem) return;
    create.mutate(
      {
        data: {
          kind,
          question: question.trim(),
          paperIds: paperIds.length ? paperIds : undefined,
          documentIds: chosenDocs.length ? chosenDocs : undefined,
          pageNumbers: kind === "image" && pageNumbers.length ? pageNumbers : undefined,
          includeLinkedDocuments: linked,
          inspectFigures: kind !== "image",
          aiConsent: true,
        },
      },
      {
        onSuccess: (a) => {
          qc.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
          qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
          qc.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
          toast({ title: "Analysis queued" });
          onCreated(a.id);
        },
        onError: (e) => {
          toast({ title: "Couldn't start analysis", description: errMessage(e), variant: "destructive" });
          void qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
        },
      },
    );
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="grid grid-cols-3 border-b">
        {KINDS.map((k) => (
          <button key={k.k} onClick={() => setKind(k.k)} className={`relative flex flex-col items-center gap-1 px-2 py-3 text-xs transition-colors sm:flex-row sm:justify-center sm:gap-2 sm:text-sm ${kind === k.k ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`} data-testid={`tab-kind-${k.k}`}>
            <k.icon className={`h-4 w-4 ${kind === k.k ? "text-vermilion" : ""}`} /> {k.label}
            <span className={`absolute inset-x-0 -bottom-px h-0.5 bg-vermilion transition-transform ${kind === k.k ? "scale-x-100" : "scale-x-0"}`} />
          </button>
        ))}
      </div>
      <div className="space-y-5 p-5">
        <p className="text-xs text-muted-foreground">{KINDS.find((k) => k.k === kind)?.hint}</p>
        <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={2000} rows={3} className="resize-none font-display text-lg" placeholder={kind === "image" ? "What does this plot show about efficiency at high load?" : "What evidence exists that ... ?"} data-testid="input-question" />

        {kind !== "image" && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Papers <span className={kind === "review" && (sel.length < 10 || sel.length > 50) ? "text-vermilion" : ""}>{sel.length}</span>
                {kind === "answer" ? "/10" : " (10-50)"}
              </p>
              <div className="flex gap-3 text-xs">
                <button onClick={() => setPicking(true)} className="inline-flex items-center gap-1 text-primary hover:underline" data-testid="button-pick-library"><Plus className="h-3 w-3" /> From library</button>
                <Link href="/discover" className="text-primary hover:underline">Search more</Link>
                {sel.length > 0 && <button onClick={() => selection.clear()} className="text-muted-foreground hover:underline" data-testid="button-clear-papers">Clear</button>}
              </div>
            </div>
            {sel.length === 0 ? (
              <p className="rounded border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">No papers selected. Use Select on search results or add from library.</p>
            ) : (
              <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                {sel.map((s) => (
                  <span key={s.id} className="inline-flex max-w-full items-center gap-1 rounded border bg-background py-0.5 pl-2 pr-1 text-xs animate-in fade-in zoom-in-95">
                    <span className="truncate">{s.title}</span>
                    <button onClick={() => selection.remove(s.id)} className="rounded p-0.5 hover:bg-muted" data-testid={`button-unselect-${s.id}`}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {kind !== "review" && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{kind === "answer" ? "Your PDFs" : "Screenshots and PDFs"}</p>
              <DocumentUpload label="Upload" />
            </div>
            {docs.isLoading ? (
              <div className="h-10 rounded bg-muted" />
            ) : visibleDocs.length === 0 ? (
              <p className="rounded border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">No suitable documents yet.</p>
            ) : (
              <div className="grid gap-1.5 sm:grid-cols-2">
                {visibleDocs.map((d) => {
                  const on = docIds.includes(d.id);
                  return (
                    <label key={d.id} className={`flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm transition-colors ${on ? "border-primary bg-[hsl(var(--cyan-ink)/0.06)]" : "hover:bg-muted/50"}`}>
                      <Checkbox checked={on} onCheckedChange={() => setDocIds((ids) => (on ? ids.filter((x) => x !== d.id) : [...ids, d.id]))} data-testid={`checkbox-doc-${d.id}`} />
                      {d.contentType.startsWith("image/") ? <FileImage className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                      <span className="truncate">{d.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {kind === "image" && (
          <div>
            <label htmlFor="input-pages" className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">PDF pages to read (optional, up to 3)</label>
            <input id="input-pages" value={pagesText} onChange={(e) => setPagesText(e.target.value)} placeholder="e.g. 4, 7" className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 font-mono text-sm sm:w-56" data-testid="input-page-numbers" />
            <p className="mt-1 text-xs text-muted-foreground">Leave blank to let Evidora pick up to 3 relevant pages. Ignored for screenshots.</p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className={`text-xs ${problem ? "text-vermilion" : "text-muted-foreground"}`} data-testid="text-composer-status">
            {problem ?? `Ready. ${left===Infinity ? "Unlimited analyses." : left !== null ? `${left} ${kind} run${left === 1 ? "" : "s"} left.` : ""}`}
          </p>
          <Button onClick={submit} title={limitMessage??undefined} disabled={(!!problem&&!limitMessage) || create.isPending || usage.isLoading} className="press bg-vermilion px-6 text-white hover:bg-[hsl(8_74%_44%)]" data-testid="button-run-analysis">
            {create.isPending ? "Queuing..." : limitMessage ? "Limit reached" : "Run analysis"}
          </Button>
        </div>
      </div>
      {picking && <LibraryPicker onClose={() => setPicking(false)} />}
    </div>
  );
}

type CellKey = "problem" | "method" | "dataset" | "metrics" | "results" | "limitations";
const CELLS: CellKey[] = ["problem", "method", "dataset", "metrics", "results", "limitations"];

function ComparisonTable({ rows, srcById, onEdit, dirty, saving, onSave, onReset }: {
  rows: ComparisonRow[];
  srcById: Map<string, { n: number; title: string }>;
  onEdit: (ri: number, field: CellKey, text: string) => void;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div data-testid="section-comparison">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Edit any cell. Edited cells are marked unverified; their original quotes stay attached but no longer prove your wording.</p>
        <div className="flex gap-2">
          {dirty && <Button size="sm" variant="ghost" onClick={onReset} data-testid="button-reset-comparison">Discard</Button>}
          <Button size="sm" onClick={onSave} disabled={!dirty || saving} data-testid="button-save-comparison">{saving ? "Saving..." : "Save comparison"}</Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-muted/60 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr><th className="w-56 px-3 py-2">Paper</th>{CELLS.map((c) => <th key={c} className="px-3 py-2">{c}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r, ri) => (
              <tr key={r.paperId} data-testid={`row-comparison-${ri}`}>
                <td className="px-3 py-2 align-top">
                  <p className="font-medium leading-snug">{r.title}</p>
                  {r.evidenceLevel && <span className={`mt-1 inline-block rounded border px-1.5 py-0.5 text-[10px] ${evidenceTone(r.evidenceLevel)}`}>{r.evidenceLevel}</span>}
                </td>
                {CELLS.map((c) => {
                  const cell = r[c];
                  return (
                    <td key={c} className="px-2 py-2 align-top">
                      <textarea value={cell.text} maxLength={2000} rows={4} onChange={(e) => onEdit(ri, c, e.target.value)} placeholder={cell.status === "not_reported" ? "Not reported" : ""} className="w-full resize-y rounded border bg-background p-1.5 text-xs leading-snug" data-testid={`input-cell-${ri}-${c}`} />
                      <span className={`mt-1 inline-block font-mono text-[10px] ${cell.status === "verified" ? "text-leaf" : cell.status === "edited" ? "text-vermilion" : "text-muted-foreground"}`} data-testid={`status-cell-${ri}-${c}`}>
                        {cell.status === "verified" ? "verified quote" : cell.status === "edited" ? "edited, unverified" : "not reported"}
                      </span>
                      {cell.evidence.map((e, j) => (
                        <p key={j} className="mt-1 border-l-2 border-turmeric pl-1.5 text-[11px] italic text-muted-foreground" title={e.quote}>
                          &ldquo;{e.quote.length > 120 ? `${e.quote.slice(0, 120)}...` : e.quote}&rdquo; <span className="not-italic font-mono">[{srcById.get(e.sourceId)?.n ?? "?"}]{e.page !== null ? ` p.${e.page}` : ""}</span>
                        </p>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalysisView({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const a = useGetAnalysis(id, {
    query: { enabled: !!id, queryKey: getGetAnalysisQueryKey(id), refetchInterval: (q) => (isDone(q.state.data?.status) ? false : 2000) },
  });
  const update = useUpdateAnalysis();
  const del = useDeleteAnalysis();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [view, setView] = useState<"claims" | "compare" | "papers">("claims");
  const [rows, setRows] = useState<ComparisonRow[] | null>(null);
  const initFor = useRef<string | null>(null);
  const serverRows = a.data?.comparisonRows;
  const loadedStatus = a.data?.status;
  useEffect(() => {
    if (serverRows && initFor.current !== id && isDone(loadedStatus)) {
      initFor.current = id;
      setRows(serverRows);
    }
  }, [serverRows, loadedStatus, id]);
  const notified = useRef<string | null>(null);

  const status = a.data?.status;
  useEffect(() => {
    if (isDone(status) && notified.current !== id) {
      notified.current = id;
      qc.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
      qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
    }
  }, [status, id, qc]);

  const job = a.data && !isDone(a.data.status)
    ? researchWorkflow({ id, status: a.data.status, stage: a.data.stage, question: a.data.question, reusedSources: false, workflow: "Evidence analysis" })
    : null;
  useAgentJob(job);

  if (a.isLoading) return <RowSkeleton rows={3} />;
  if (a.isError || !a.data) return <ErrorState error={a.error} onRetry={() => a.refetch()} title="Couldn't load analysis" />;
  const d: Analysis = a.data;
  const srcById = new Map(d.sources.map((s, i) => [s.id, { ...s, n: i + 1 }]));

  const rowsDirty = !!rows && JSON.stringify(rows) !== JSON.stringify(d.comparisonRows ?? []);
  const saveRows = () =>
    rows &&
    update.mutate(
      { id, data: { comparisonRows: rows } },
      {
        onSuccess: (res) => {
          qc.setQueryData(getGetAnalysisQueryKey(id), res);
          setRows(res.comparisonRows ?? rows);
          toast({ title: "Comparison saved" });
        },
        onError: (e) => toast({ title: "Couldn't save comparison", description: errMessage(e), variant: "destructive" }),
      },
    );
  const editCell = (ri: number, field: CellKey, text: string) =>
    setRows((rs) => rs && rs.map((r, i) => (i === ri ? { ...r, [field]: { text, evidence: r[field].evidence, status: "edited" } as ComparisonCell } : r)));

  const saveDraft = () =>
    update.mutate(
      { id, data: { content: draft } },
      {
        onSuccess: (res) => {
          qc.setQueryData(getGetAnalysisQueryKey(id), res);
          qc.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
          setEditing(false);
          toast({ title: "Draft saved" });
        },
        onError: (e) => toast({ title: "Couldn't save", description: errMessage(e), variant: "destructive" }),
      },
    );

  const compareDraft = () =>
    d.claims
      .map((c, i) => {
        const refs = c.evidence.map((e) => `[${srcById.get(e.sourceId)?.n ?? "?"}] ${srcById.get(e.sourceId)?.title ?? e.sourceId}`).join("; ");
        return `${i + 1}. ${c.text}\n   Cited: ${refs || "none"}`;
      })
      .join("\n\n");

  return (
    <article className="rise rounded-lg border bg-card" data-testid={`panel-analysis-${id}`}>
      <header className="border-b p-5">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-widest">
          <span className="text-vermilion">{d.kind}</span>
          <span className="text-muted-foreground">&middot; {ago(d.createdAt)}</span>
          <span className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 normal-case tracking-normal ${d.status === "failed" ? "border-vermilion text-vermilion" : d.status === "completed" ? "border-[hsl(var(--leaf)/0.5)] text-leaf" : ""}`} data-testid="status-analysis">
            <span className={`h-1.5 w-1.5 rounded-full ${d.status === "failed" ? "bg-vermilion" : d.status === "completed" ? "bg-leaf" : "bg-turmeric pulse-dot"}`} />
            {d.status}
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-semibold leading-snug">{d.question}</h2>
      </header>

      {d.warnings.length > 0 && (
        <details className="border-b px-5 py-4" data-testid="section-warnings">
          <summary className="cursor-pointer text-sm font-semibold text-muted-foreground">Search, retrieval &amp; verification details</summary>
          <ul className="mt-2 space-y-1 text-sm">
            {d.warnings.map((w) => <li key={w} className="flex gap-2"><span className="text-vermilion">&ndash;</span>{w}</li>)}
          </ul>
        </details>
      )}

      {!isDone(d.status) ? (
        <div className="space-y-4 p-5">{job && <AgentProgressChip jobKey={job.key} />}<LiveDraft kind="analysis" id={id} working invalidate={[getGetAnalysisQueryKey(id)]} fallback={<p className="text-sm text-muted-foreground">Reading sources and checking quotes. This page refreshes every 2 seconds.</p>} progressKey={job?.key} /></div>
      ) : d.status === "failed" ? (
        <div className="p-5"><ErrorState error={{ message: d.error || "The analysis failed." }} title="Analysis failed" /></div>
      ) : (
        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Draft (editable)</p>
            {!editing ? (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setDraft(d.content); setEditing(true); }} data-testid="button-edit-draft"><Pencil className="h-3.5 w-3.5" /> Edit</Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                <Button size="sm" onClick={saveDraft} disabled={update.isPending} data-testid="button-save-draft">{update.isPending ? "Saving..." : "Save draft"}</Button>
              </div>
            )}
          </div>
          {editing ? (
            <>
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={100000} className="min-h-[320px] font-mono text-sm leading-relaxed" data-testid="input-draft" />
              {d.claims.length > 0 && (
                <button onClick={() => setDraft((x) => `${x}\n\n## Claims and cited sources\n\n${compareDraft()}`)} className="mt-2 text-xs text-primary hover:underline" data-testid="button-append-compare">
                  Append claim and citation list to draft
                </button>
              )}
            </>
          ) : (
            <div data-testid="text-analysis-content"><AcademicAnswer content={d.content || "No content returned."} inline={text=>text.split(/(\[\d+\])/g).map((part,i)=>{
              const match=part.match(/^\[(\d+)\]$/),source=match?d.sources[Number(match[1])-1]:undefined;
              return source?.url?<a key={i} href={source.url} target="_blank" rel="noreferrer" title={source.title} className="font-semibold text-primary underline">{part}</a>:part;
            })} referenceSources={d.sources}/>{!referenceSections(d.content??"").some(section=>section.kind==="references")&&<AcademicReferences entries={analysisReferenceEntries(d.sources,d.discoveredPapers)}/>}<p className="mt-5 text-xs text-muted-foreground">{d.sources.some(s=>s.evidenceLevel==="Abstract only")?"Includes abstract-only evidence. ":""}AI-assisted synthesis; verify original sources before academic use.</p></div>
          )}

          {(d.claims.length > 0 || (rows?.length ?? 0) > 0) && (
            <section className="mt-8">
              <div className="mb-3 flex items-center gap-1 border-b">
                {(["claims", "compare", "papers"] as const).filter((v) => (v === "papers" ? (rows?.length ?? 0) > 0 : d.claims.length > 0)).map((v) => (
                  <button key={v} onClick={() => setView(v)} className={`px-3 py-2 text-sm ${view === v ? "border-b-2 border-vermilion font-medium" : "text-muted-foreground"}`} data-testid={`tab-view-${v}`}>
                    {v === "claims" ? `Claims and evidence (${d.claims.length})` : v === "compare" ? "Claim / source matrix" : `Paper comparison (${rows?.length ?? 0})`}
                  </button>
                ))}
              </div>
              {view === "papers" && rows ? (
                <ComparisonTable rows={rows} srcById={srcById} onEdit={editCell} dirty={rowsDirty} saving={update.isPending} onSave={saveRows} onReset={() => setRows(d.comparisonRows ?? [])} />
              ) : view === "claims" ? (
                <ol className="space-y-4">
                  {d.claims.map((c, i) => (
                    <li key={i} className="rounded-md border p-4" data-testid={`card-claim-${i}`}>
                      <p className="flex gap-3"><span className="font-mono text-xs text-vermilion">{String(i + 1).padStart(2, "0")}</span><span className="font-display text-[16px] leading-snug">{c.text}</span></p>
                      {c.evidence.length === 0 ? (
                        <p className="mt-2 pl-8 text-xs text-vermilion">No supporting quote returned for this claim.</p>
                      ) : (
                        <div className="mt-3 space-y-2 pl-8">
                          {c.evidence.map((e, j) => {
                            const s = srcById.get(e.sourceId);
                            return (
                              <div key={j} className="border-l-2 border-turmeric pl-3">
                                <p className="text-sm italic text-foreground/85">&ldquo;{e.quote}&rdquo;</p>
                                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                                  [{s?.n ?? "?"}] {s?.title ?? e.sourceId}
                                  {e.page !== null ? ` \u00B7 p. ${e.page}` : " \u00B7 page not available"}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60 text-left font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                      <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Claim (generated)</th><th className="px-3 py-2">Cited sources</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {d.claims.map((c, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 align-top font-mono text-xs">{i + 1}</td>
                          <td className="px-3 py-2 align-top">{c.text}</td>
                          <td className="px-3 py-2 align-top font-mono text-xs">{[...new Set(c.evidence.map((e) => srcById.get(e.sourceId)?.n ?? "?"))].map((n) => `[${n}]`).join(" ") || "none"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="border-t px-3 py-2 text-xs text-muted-foreground">Claims are model-generated summaries. Check each against its quoted evidence.</p>
                </div>
              )}
            </section>
          )}

          {d.sources.length > 0 && (
            <section className="mt-8">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Sources</p>
              <ol className="space-y-1.5 text-sm">
                {d.sources.map((s, i) => (
                  <li key={s.id} className="flex items-start gap-2">
                    <span className="font-mono text-xs text-muted-foreground">[{i + 1}]</span>
                    <span className="flex-1">
                      {s.url ? <a href={s.url} target="_blank" rel="noreferrer" className="hover:underline">{s.title} <ExternalLink className="inline h-3 w-3" /></a> : s.title}
                    </span>
                    {s.verification && <span className={`rounded border px-1.5 py-0.5 text-[11px] ${s.verification.toLowerCase().includes("verified") && !s.verification.toLowerCase().includes("un") ? "border-[hsl(var(--leaf)/0.35)] text-leaf" : "text-muted-foreground"}`} data-testid={`status-source-verification-${i}`}>{s.verification}</span>}
                    {s.evidenceLevel && <span className={`rounded border px-1.5 py-0.5 text-[11px] ${evidenceTone(s.evidenceLevel)}`}>{s.evidenceLevel}</span>}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}

      <footer className="flex flex-wrap items-center gap-2 border-t bg-muted/30 px-5 py-3">
        {d.status === "completed" && (
          <>
            <span className="mr-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><Download className="h-3.5 w-3.5" /> Export</span>
            {(["docx", "md"] as const).flatMap((f) =>
              (["ieee", "apa"] as const).map((s) => (
                <a key={f + s} href={getExportAnalysisUrl(id, { format: f, style: s })} className="rounded border bg-card px-2 py-1 font-mono text-[11px] uppercase hover:border-primary" data-testid={`link-export-${f}-${s}`}>
                  {f} &middot; {s}
                </a>
              )),
            )}
          </>
        )}
        {d.status === "completed" && <div className="p-5"><SaveAnalysisToProject analysis={d} compact discussion /></div>}
        <button
          onClick={() => {
            if (!confirm("Delete this analysis permanently?")) return;
            del.mutate({ id }, {
              onSuccess: () => {
                qc.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
                qc.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
                toast({ title: "Analysis deleted" });
                onDeleted();
              },
              onError: (e) => toast({ title: "Couldn't delete", description: errMessage(e), variant: "destructive" }),
            });
          }}
          className="ml-auto inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-vermilion hover:bg-[hsl(var(--vermilion)/0.08)]"
          data-testid="button-delete-analysis"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </footer>
    </article>
  );
}

function ResearchInner() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const sp = new URLSearchParams(search);
  const activeId = sp.get("a");
  const explain = sp.get("explain");
  const initialQuestion = explain ? "Explain this paper: the problem it addresses, method, data, key results, and stated limitations." : "";
  const list = useListAnalyses({ query: { queryKey: getListAnalysesQueryKey() } });
  const usage = useGetUsage({ query: { queryKey: getGetUsageQueryKey() } });
  const open = (id: string | null) => setLocation(id ? `/research?a=${id}` : "/research");

  const [drawer, setDrawer] = useState(false);
  const activeQ = list.data?.find((a) => a.id === activeId)?.question;
  return (
    <div className="mx-auto max-w-[1180px] pb-6">
      {activeId
        ? <WorkspaceBar newLabel="New analysis" onNew={() => open(null)} label={activeQ ? `Research · ${activeQ}` : "Research"} onHistory={() => setDrawer(true)} />
        : <WorkspaceIntro kicker="Evidence workbench" title="Research with selected evidence." sub="Pick papers, ask a precise question, and get claims tied to quotes. Comparison tables stay editable; everything here is saved to your history." onHistory={() => setDrawer(true)} />}
      <div className="min-w-0">{activeId ? <AnalysisView key={activeId} id={activeId} onDeleted={() => open(null)} /> : <Composer key={explain ?? "new"} initialQuestion={initialQuestion} onCreated={(id) => open(id)} />}</div>
      <HistoryDrawer open={drawer} onOpenChange={setDrawer} title="History and usage" description="Saved answers and reviews, your allowance, and how evidence is used.">
        <div>
          <p className="sx-eyebrow mb-2">History</p>
          {list.isLoading ? (
            <RowSkeleton rows={2} />
          ) : list.isError ? (
            <ErrorState error={list.error} onRetry={() => list.refetch()} />
          ) : !list.data?.length ? (
            <EmptyState icon={<BookOpen className="h-5 w-5" />} title="No analyses yet" body="Your saved answers and reviews will collect here." />
          ) : (
            <div className="space-y-1.5">
              {list.data.map((a) => (
                <button key={a.id} onClick={() => { setDrawer(false); open(a.id); }} aria-current={a.id === activeId || undefined} className={`block w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${a.id === activeId ? "border-[hsl(var(--teal))] bg-[hsl(var(--teal)/0.07)]" : "bg-[hsl(52_40%_98%)] hover:bg-[hsl(90_20%_93%)]"}`} data-testid={`button-history-${a.id}`}>
                  <p className="line-clamp-2 text-sm font-medium leading-snug">{a.question}</p>
                  <p className="mt-1 font-mono text-[10.5px] text-muted-foreground">{a.kind} &middot; {a.status} &middot; {ago(a.createdAt)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        {usage.data && (
          <div className="sx-card p-4">
            <p className="sx-eyebrow mb-3">{usage.data.period === "starter" ? "Starter trial (lifetime)" : `${usage.data.plan} \u00B7 ${usage.data.period}`}</p>
            <UsageMeters usage={usage.data} />
            <Link href="/plans" className="mt-3 block text-xs text-primary hover:underline">Plan details</Link>
          </div>
        )}
        <div className="sx-card p-4 text-xs leading-relaxed text-muted-foreground" data-testid="text-ai-disclosure">
          <p className="sx-eyebrow mb-1">AI and privacy</p>
          Answers use available source evidence. Paper-linked PDFs and selected uploads are used for the research you request; unrelated private files are not included. Evidence coverage varies by source. Check citations and limitations before relying on an answer.
        </div>
      </HistoryDrawer>
    </div>
  );
}

export default function Research() {
  return (
    <RequireAuth what="research workspace">
      <ResearchInner />
    </RequireAuth>
  );
}
