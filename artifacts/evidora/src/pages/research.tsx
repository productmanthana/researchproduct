import { useEffect, useRef, useState } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
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
} from "@workspace/api-client-react";
import { AlertTriangle, BookOpen, Download, ExternalLink, FileImage, FileSearch, FileText, History, Layers, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RequireAuth } from "@/components/require-auth";
import { DocumentUpload } from "@/components/document-upload";
import { UsageMeters } from "@/components/usage-meters";
import { EmptyState, ErrorState, PageHeader, RowSkeleton } from "@/components/states";
import { useToast } from "@/hooks/use-toast";
import { selection, useSelection } from "@/lib/selection";
import { ago, errMessage, evidenceTone } from "@/lib/format";

const KINDS: { k: AnalysisInputKind; label: string; icon: typeof FileSearch; hint: string }[] = [
  { k: "answer", label: "Evidence answer", icon: FileSearch, hint: "Up to 10 papers or PDFs. Reads PDF text only, not figures." },
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

function Composer({ onCreated }: { onCreated: (id: string) => void }) {
  const [kind, setKind] = useState<AnalysisInputKind>("answer");
  const [question, setQuestion] = useState("");
  const [docIds, setDocIds] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
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

  let problem: string | null = null;
  if (question.trim().length < 5) problem = "Write a question of at least 5 characters.";
  else if (kind === "answer" && paperIds.length + chosenDocs.length === 0) problem = "Select at least one paper or PDF.";
  else if (kind === "answer" && paperIds.length > 10) problem = `Answers use at most 10 papers. You have ${paperIds.length}.`;
  else if (kind === "review" && (paperIds.length < 10 || paperIds.length > 50)) problem = `Reviews need 10 to 50 papers. You have ${paperIds.length}.`;
  else if (kind === "image" && chosenDocs.length === 0) problem = "Choose at least one screenshot or PDF.";
  else if (chosenDocs.length > 0 && !consent) problem = "Confirm consent to send your files to OpenAI.";

  const u = usage.data;
  const left = u ? (kind === "answer" ? u.answersLimit - u.answersUsed : kind === "review" ? u.reviewsLimit - u.reviewsUsed : u.imagesLimit - u.imagesUsed) : null;
  if (!problem && left !== null && left <= 0) problem = `No ${kind} runs left this ${u?.period === "starter" ? "trial" : "period"}.`;

  const submit = () => {
    if (problem) return;
    create.mutate(
      { data: { kind, question: question.trim(), paperIds: paperIds.length ? paperIds : undefined, documentIds: chosenDocs.length ? chosenDocs : undefined } },
      {
        onSuccess: (a) => {
          qc.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
          qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
          qc.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
          toast({ title: "Analysis queued" });
          onCreated(a.id);
        },
        onError: (e) => toast({ title: "Couldn't start analysis", description: errMessage(e), variant: "destructive" }),
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
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{kind === "answer" ? "Your PDFs (text only)" : "Screenshots and PDFs"}</p>
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

        {chosenDocs.length > 0 && (
          <label className="flex items-start gap-3 rounded-md border border-[hsl(var(--turmeric)/0.6)] bg-[hsl(var(--turmeric)/0.12)] p-3 text-sm">
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" data-testid="checkbox-ai-consent" />
            <span>I consent to sending the selected files to OpenAI for this analysis. {kind === "image" ? "Original images (and up to 3 page images per PDF) will be sent." : "Extracted PDF text will be sent."}</span>
          </label>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className={`text-xs ${problem ? "text-vermilion" : "text-muted-foreground"}`} data-testid="text-composer-status">
            {problem ?? `Ready. ${left !== null ? `${left} ${kind} run${left === 1 ? "" : "s"} left.` : ""}`}
          </p>
          <Button onClick={submit} disabled={!!problem || create.isPending} className="press bg-vermilion px-6 text-white hover:bg-[hsl(8_74%_44%)]" data-testid="button-run-analysis">
            {create.isPending ? "Queuing..." : "Run analysis"}
          </Button>
        </div>
      </div>
      {picking && <LibraryPicker onClose={() => setPicking(false)} />}
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
  const [view, setView] = useState<"claims" | "compare">("claims");
  const notified = useRef<string | null>(null);

  const status = a.data?.status;
  useEffect(() => {
    if (isDone(status) && notified.current !== id) {
      notified.current = id;
      qc.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
      qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
    }
  }, [status, id, qc]);

  if (a.isLoading) return <RowSkeleton rows={3} />;
  if (a.isError || !a.data) return <ErrorState error={a.error} onRetry={() => a.refetch()} title="Couldn't load analysis" />;
  const d: Analysis = a.data;
  const srcById = new Map(d.sources.map((s, i) => [s.id, { ...s, n: i + 1 }]));

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
        <div className="border-b border-[hsl(var(--vermilion)/0.3)] bg-[hsl(var(--vermilion)/0.06)] px-5 py-4" data-testid="section-warnings">
          <p className="flex items-center gap-2 text-sm font-semibold text-vermilion"><AlertTriangle className="h-4 w-4" /> Read before relying on this</p>
          <ul className="mt-2 space-y-1 text-sm">
            {d.warnings.map((w) => <li key={w} className="flex gap-2"><span className="text-vermilion">&ndash;</span>{w}</li>)}
          </ul>
        </div>
      )}

      {!isDone(d.status) ? (
        <div className="p-8 text-center">
          <div className="relative mx-auto h-1 max-w-xs overflow-hidden rounded bg-muted"><div className="scanline absolute inset-y-0 w-1/3 bg-primary" /></div>
          <p className="mt-4 text-sm text-muted-foreground">Reading sources and checking quotes. This page refreshes every 2 seconds.</p>
        </div>
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
            <div className="max-w-none whitespace-pre-wrap text-[15px] leading-[1.75]" data-testid="text-analysis-content">{d.content || "No content returned."}</div>
          )}

          {d.claims.length > 0 && (
            <section className="mt-8">
              <div className="mb-3 flex items-center gap-1 border-b">
                {(["claims", "compare"] as const).map((v) => (
                  <button key={v} onClick={() => setView(v)} className={`px-3 py-2 text-sm ${view === v ? "border-b-2 border-vermilion font-medium" : "text-muted-foreground"}`} data-testid={`tab-view-${v}`}>
                    {v === "claims" ? `Claims and evidence (${d.claims.length})` : "Claim / source matrix"}
                  </button>
                ))}
              </div>
              {view === "claims" ? (
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
  const activeId = new URLSearchParams(search).get("a");
  const list = useListAnalyses({ query: { queryKey: getListAnalysesQueryKey() } });
  const usage = useGetUsage({ query: { queryKey: getGetUsageQueryKey() } });
  const open = (id: string | null) => setLocation(id ? `/research?a=${id}` : "/research");

  return (
    <>
      <PageHeader kicker="Evidence workbench" title="Research">
        {activeId && <Button variant="outline" onClick={() => open(null)} className="gap-1.5" data-testid="button-new-analysis"><Plus className="h-4 w-4" /> New analysis</Button>}
      </PageHeader>
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div>{activeId ? <AnalysisView key={activeId} id={activeId} onDeleted={() => open(null)} /> : <Composer onCreated={(id) => open(id)} />}</div>
        <aside className="space-y-6">
          {usage.data && (
            <div className="rounded-md border bg-card p-4">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{usage.data.period === "starter" ? "Starter trial (lifetime)" : `${usage.data.plan} \u00B7 ${usage.data.period}`}</p>
              <UsageMeters usage={usage.data} />
              <Link href="/plans" className="mt-3 block text-xs text-primary hover:underline">Plan details</Link>
            </div>
          )}
          <div>
            <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><History className="h-3 w-3" /> History</p>
            {list.isLoading ? (
              <RowSkeleton rows={2} />
            ) : list.isError ? (
              <ErrorState error={list.error} onRetry={() => list.refetch()} />
            ) : !list.data?.length ? (
              <EmptyState icon={<BookOpen className="h-5 w-5" />} title="No analyses yet" body="Your saved answers and reviews will collect here." />
            ) : (
              <div className="space-y-1">
                {list.data.map((a) => (
                  <button key={a.id} onClick={() => open(a.id)} className={`block w-full rounded-md border px-3 py-2 text-left transition-colors ${a.id === activeId ? "border-primary bg-card" : "border-transparent hover:bg-card"}`} data-testid={`button-history-${a.id}`}>
                    <p className="line-clamp-2 text-sm leading-snug">{a.question}</p>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">{a.kind} &middot; {a.status} &middot; {ago(a.createdAt)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

export default function Research() {
  return (
    <RequireAuth what="research workspace">
      <ResearchInner />
    </RequireAuth>
  );
}
