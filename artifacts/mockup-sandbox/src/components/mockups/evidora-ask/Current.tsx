// @ts-nocheck -- Extracted production UI with isolated preview-only adapters.
import "./_group.css";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useLocation, useSearch } from "./_adapters";
import { useQueryClient } from "./_adapters";
import {
  useCreateAnalysis,
  useGetAnalysis,
  getGetAnalysisQueryKey,
  useListAnalyses,
  getListAnalysesQueryKey,
  useGetUsage,
  getGetUsageQueryKey,
  getGetSummaryQueryKey,
  type Analysis,
} from "./_adapters";
import { AlertTriangle, ArrowUp, ExternalLink, History, MessageSquareText, RotateCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RequireAuth } from "./_adapters";
import { EmptyState, ErrorState, PageHeader, RowSkeleton } from "./_states";
import { useToast } from "./_adapters";
import { ago, errMessage, evidenceTone } from "./_format";

const isDone = (s?: string) => s === "completed" || s === "failed";

type Thread = { id: string; turns: Analysis[]; updatedAt: string };

function groupThreads(list: Analysis[]): Thread[] {
  const map = new Map<string, Analysis[]>();
  for (const a of list) {
    if (a.mode !== "ask") continue;
    const key = a.conversationId || a.id;
    const arr = map.get(key) ?? [];
    arr.push(a);
    map.set(key, arr);
  }
  return [...map.entries()]
    .map(([id, turns]) => {
      const sorted = [...turns].sort((x, y) => x.createdAt.localeCompare(y.createdAt));
      return { id, turns: sorted, updatedAt: sorted[sorted.length - 1].createdAt };
    })
    .sort((x, y) => y.updatedAt.localeCompare(x.updatedAt));
}

function Content({ d }: { d: Analysis }) {
  return (
    <div className="whitespace-pre-wrap text-[15px] leading-[1.75]" data-testid={`text-answer-${d.id}`}>
      {(d.content || "No content returned.").split(/(\[\d+\])/g).map((part, i) => {
        const m = part.match(/^\[(\d+)\]$/);
        const s = m ? d.sources[Number(m[1]) - 1] : undefined;
        return s?.url ? (
          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" title={s.title} className="font-semibold text-primary underline">{part}</a>
        ) : (
          part
        );
      })}
    </div>
  );
}

function Turn({ initial, onRetry, retryDisabled }: { initial: Analysis; onRetry: (q: string) => void; retryDisabled: boolean }) {
  const qc = useQueryClient();
  const id = initial.id;
  const q = useGetAnalysis(id, {
    query: { queryKey: getGetAnalysisQueryKey(id), enabled: !!id, refetchInterval: (x) => (isDone(x.state.data?.status ?? initial.status) ? false : 2000) },
  });
  const d = q.data ?? initial;
  const notified = useRef(false);
  const wasActive = useRef(!isDone(initial.status));
  useEffect(() => {
    if (isDone(d.status) && wasActive.current && !notified.current) {
      notified.current = true;
      qc.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
      qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
      qc.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
    }
  }, [d.status, qc]);
  const srcById = new Map(d.sources.map((s, i) => [s.id, { ...s, n: i + 1 }]));

  return (
    <li className="rise space-y-3" data-testid={`turn-${id}`}>
      <div className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-sidebar px-4 py-3 text-sidebar-foreground">
        <p className="font-display text-[16px] leading-snug">{d.question}</p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest opacity-60">{ago(d.createdAt)}</p>
      </div>
      <article className="rounded-lg border bg-card">
        <header className="flex items-center gap-2 border-b px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest">
          <span className="text-vermilion">Evidora</span>
          <span className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 normal-case tracking-normal ${d.status === "failed" ? "border-vermilion text-vermilion" : d.status === "completed" ? "border-[hsl(var(--leaf)/0.5)] text-leaf" : ""}`} data-testid={`status-turn-${id}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${d.status === "failed" ? "bg-vermilion" : d.status === "completed" ? "bg-leaf" : "bg-turmeric pulse-dot"}`} />
            {d.status === "queued" ? "queued" : d.status === "running" ? "finding papers, retrieving and verifying evidence" : d.status}
          </span>
        </header>

        {!!d.searchQueries?.length && (
          <div className="flex flex-wrap items-center gap-1.5 border-b px-4 py-2 text-xs" data-testid={`section-queries-${id}`}>
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Searched</span>
            {d.searchQueries.map((s) => <span key={s} className="rounded border bg-background px-2 py-0.5 font-mono">{s}</span>)}
          </div>
        )}

        {d.warnings.length > 0 && (
          <details className="border-b border-[hsl(var(--vermilion)/0.3)] bg-[hsl(var(--vermilion)/0.06)] px-4 py-3" data-testid={`section-warnings-${id}`}>
            <summary className="cursor-pointer text-sm font-semibold text-vermilion"><AlertTriangle className="mr-2 inline h-4 w-4" />{d.warnings.some(w=>w.includes("not included"))?"Partial provider coverage · ":""}Evidence limitations ({d.warnings.length}) — review before relying on this</summary>
            <ul className="mt-1.5 space-y-1 text-sm">{d.warnings.map((w) => <li key={w} className="flex gap-2"><span className="text-vermilion">&ndash;</span>{w}</li>)}</ul>
          </details>
        )}

        <div className="p-4">
          {q.isError && !isDone(d.status) ? (
            <ErrorState error={q.error} onRetry={() => q.refetch()} title="Couldn't refresh this answer" />
          ) : !isDone(d.status) ? (
            <div className="py-4">
              <div className="relative h-1 max-w-xs overflow-hidden rounded bg-muted"><div className="scanline absolute inset-y-0 w-1/3 bg-primary" /></div>
              <p className="mt-3 text-sm text-muted-foreground">
                {d.status === "queued" ? "Waiting for a worker." : "Finding papers, retrieving evidence and verifying quotes."} Refreshes every 2 seconds.
              </p>
            </div>
          ) : d.status === "failed" ? (
            <div className="space-y-3">
              <ErrorState error={{ message: d.error || "This answer failed." }} title="Answer failed" />
              <Button size="sm" variant="outline" className="gap-1.5" disabled={retryDisabled} onClick={() => onRetry(d.question)} data-testid={`button-retry-turn-${id}`}>
                <RotateCw className="h-3.5 w-3.5" /> Put question back in the composer
              </Button>
            </div>
          ) : (
            <>
              <Content d={d} />
              {d.claims.length > 0 && (
                <details className="mt-5 rounded-md border" data-testid={`section-claims-${id}`}>
                  <summary className="cursor-pointer px-3 py-2 text-sm font-medium">Claims and evidence ({d.claims.length})</summary>
                  <ol className="space-y-3 border-t p-3">
                    {d.claims.map((c, i) => (
                      <li key={i}>
                        <p className="flex gap-3"><span className="font-mono text-xs text-vermilion">{String(i + 1).padStart(2, "0")}</span><span className="font-display leading-snug">{c.text}</span></p>
                        {c.evidence.length === 0 ? (
                          <p className="mt-1 pl-8 text-xs text-vermilion">No supporting quote returned for this claim.</p>
                        ) : (
                          <div className="mt-2 space-y-2 pl-8">
                            {c.evidence.map((e, j) => {
                              const s = srcById.get(e.sourceId);
                              return (
                                <div key={j} className="border-l-2 border-turmeric pl-3">
                                  <p className="text-sm italic text-foreground/85">&ldquo;{e.quote}&rdquo;</p>
                                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">[{s?.n ?? "?"}] {s?.title ?? e.sourceId}{e.page !== null ? ` \u00B7 p. ${e.page}` : " \u00B7 page not available"}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
              {d.sources.length > 0 && (
                <ol className="mt-4 space-y-1.5" data-testid={`section-sources-${id}`}>
                  {d.sources.map((s, i) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-mono text-xs text-muted-foreground">[{i + 1}]</span>
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline" data-testid={`link-source-${id}-${i}`}>{s.title} <ExternalLink className="h-3 w-3" /></a>
                      ) : <span>{s.title}</span>}
                      {s.evidenceLevel && <span className={`rounded border px-1.5 py-0.5 text-[10px] ${evidenceTone(s.evidenceLevel)}`}>{s.evidenceLevel}</span>}
                      {s.verification && <span className="font-mono text-[10px] text-muted-foreground">{s.verification}</span>}
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-4 text-xs text-muted-foreground">Machine-generated. Check each claim against its quote before use.</p>
            </>
          )}
        </div>
      </article>
    </li>
  );
}

function AskInner() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  const threadId = params.get("t");
  const prefill = params.get("q") ?? "";
  const qc = useQueryClient();
  const { toast } = useToast();
  const list = useListAnalyses({
    query: {
      queryKey: getListAnalysesQueryKey(),
      refetchInterval: (q) => ((q.state.data ?? []).some((a) => a.mode === "ask" && !isDone(a.status)) ? 4000 : false),
    },
  });
  const usage = useGetUsage({ query: { queryKey: getGetUsageQueryKey() } });
  const create = useCreateAnalysis();
  const threads = useMemo(() => groupThreads(list.data ?? []), [list.data]);
  const thread = threadId ? threads.find((t) => t.id === threadId || t.turns.some((x) => x.id === threadId)) : undefined;

  const [question, setQuestion] = useState(prefill);
  const [inspectFigures, setInspectFigures] = useState(true);
  const [consent, setConsent] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  useEffect(() => setConsent(false), [question, threadId]);
  useEffect(() => { setQuestion(prefill); }, [threadId, prefill]);

  const active = thread?.turns.some((t) => !isDone(t.status)) || (!!pendingId && !(list.data ?? []).some((a) => a.id === pendingId && isDone(a.status)) && !threadId);
  const ownActive = (list.data ?? []).some((a) => !isDone(a.status)) || active;
  const parent = thread ? [...thread.turns].reverse().find((t) => t.status === "completed") : undefined;

  const u = usage.data;
  const left = u ? u.answersLimit - u.answersUsed : null;
  let problem: string | null = null;
  if (question.trim().length < 5) problem = "Write a question of at least 5 characters.";
  else if (question.length > 2000) problem = "Keep the question under 2000 characters.";
  else if (ownActive) problem = "Wait for the current answer to finish.";
  else if (left !== null && left <= 0) problem = `No answers left this ${u?.period === "starter" ? "trial" : "period"}.`;
  else if (!consent) problem = "Confirm consent to send this question.";

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (problem || create.isPending) return;
    try {
      const a = await create.mutateAsync({
        data: { kind: "answer", question: question.trim(), autoDiscover: true, parentAnalysisId: parent?.id, inspectFigures, aiConsent: true },
      });
      setConsent(false);
      setQuestion("");
      setPendingId(a.id);
      qc.setQueryData<Analysis[]>(getListAnalysesQueryKey(), (old) => (old ? [a, ...old.filter((x) => x.id !== a.id)] : [a]));
      qc.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
      qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
      setLocation(`/ask?t=${encodeURIComponent(a.conversationId || a.id)}`);
    } catch (err) {
      toast({ title: "Couldn't send question", description: errMessage(err), variant: "destructive" });
    }
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {e.preventDefault();void submit();}
  };

  return (
    <>
      <PageHeader kicker="Direct question" title="Ask">
        <Button variant="outline" size="sm" onClick={() => setLocation("/ask")} disabled={!threadId} data-testid="button-new-thread">New question</Button>
      </PageHeader>
      <div className="grid gap-8 lg:grid-cols-[1fr_250px]">
        <section className="min-w-0">
          {threadId && list.isLoading ? (
            <RowSkeleton rows={2} />
          ) : list.isError ? (
            <ErrorState error={list.error} onRetry={() => list.refetch()} title="Couldn't load your threads" />
          ) : threadId && !thread ? (
            <EmptyState icon={<MessageSquareText className="h-5 w-5" />} title="Thread not found" body="It may belong to another account. Start a new question instead." action={<Link href="/ask" className="text-sm text-primary underline">New question</Link>} />
          ) : thread ? (
            <ol className="mb-6 space-y-6" data-testid="list-turns">
              {thread.turns.map((t) => <Turn key={t.id} initial={t} onRetry={setQuestion} retryDisabled={!!ownActive} />)}
            </ol>
          ) : (
            <div className="mb-6">
              <EmptyState icon={<MessageSquareText className="h-5 w-5" />} title="Ask the literature directly" body="Evidora searches scholarly indexes for you, reads the open papers it can legally reuse, and answers with quotes you can check. Ask follow-ups in the same thread." />
            </div>
          )}

          <form onSubmit={submit} className="rounded-lg border bg-card shadow-sm" aria-label="Ask a research question" data-testid="form-ask">
            <div className="space-y-4 p-4">
              <label htmlFor="input-ask" className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{thread ? "Follow-up question" : "Your research question"}</label>
              <Textarea id="input-ask" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={onKey} maxLength={2000} rows={3} className="resize-none font-display text-lg" placeholder={thread ? "What about at higher temperatures?" : "Does fly ash content above 30% reduce long-term compressive strength of concrete?"} data-testid="input-ask-question" />
              <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
                <Checkbox checked={inspectFigures} onCheckedChange={(v) => { setInspectFigures(v === true); setConsent(false); }} className="mt-0.5" data-testid="checkbox-ask-inspect-figures" />
                <span>Inspect original PDF pages with vision.<span className="block text-xs text-muted-foreground">Up to 3 relevant page images across this answer.</span></span>
              </label>
              <label className="flex items-start gap-3 rounded-md border border-[hsl(var(--turmeric)/0.6)] bg-[hsl(var(--turmeric)/0.12)] p-3 text-sm">
                <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" data-testid="checkbox-ask-consent" />
                <span>
                  I consent to sending this question to scholarly search providers, and to OpenAI processing the question and paper text for embeddings and evidence analysis, including text of legally reusable PDFs{inspectFigures ? " and up to 3 original PDF page images" : ""}. My private uploads are not included.
                  <span className="block text-xs text-muted-foreground">Required for every message. Uses one answer from your allowance. Output can be wrong.</span>
                </span>
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
              <p className={`text-xs ${problem ? "text-vermilion" : "text-muted-foreground"}`} role="status" aria-live="polite" data-testid="text-ask-status">
                {problem ?? `Ready.${left !== null ? ` ${left} answer${left === 1 ? "" : "s"} left.` : ""}`}
              </p>
              <Button type="submit" disabled={!!problem || create.isPending} className="press gap-1.5 bg-vermilion px-5 text-white hover:bg-[hsl(8_74%_44%)]" data-testid="button-ask-send">
                <ArrowUp className="h-4 w-4" /> {create.isPending ? "Sending..." : thread ? "Ask follow-up" : "Ask"}
              </Button>
            </div>
          </form>
        </section>

        <aside>
          <p className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground"><History className="h-3.5 w-3.5" /> Threads</p>
          {list.isLoading ? (
            <RowSkeleton rows={3} />
          ) : threads.length === 0 ? (
            <p className="rounded border border-dashed px-3 py-4 text-sm text-muted-foreground">No threads yet.</p>
          ) : (
            <nav className="divide-y rounded-md border bg-card" aria-label="Ask threads">
              {threads.map((t) => {
                const on = thread?.id === t.id;
                return (
                  <Link key={t.id} href={`/ask?t=${encodeURIComponent(t.id)}`} aria-current={on ? "page" : undefined} className={`block px-3 py-2.5 text-sm transition-colors ${on ? "bg-[hsl(var(--accent)/0.4)]" : "hover:bg-muted/50"}`} data-testid={`link-thread-${t.id}`}>
                    <span className="line-clamp-2 leading-snug">{t.turns[0].question}</span>
                    <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">{t.turns.length} turn{t.turns.length === 1 ? "" : "s"} &middot; {ago(t.updatedAt)}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </aside>
      </div>
    </>
  );
}

export default function Current() {
  return (
    <RequireAuth what="research conversation">
      <AskInner />
    </RequireAuth>
  );
}
