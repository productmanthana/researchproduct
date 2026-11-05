import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {useCreateAnalysis,useListAnalyses,getListAnalysesQueryKey,useGetUsage,getGetUsageQueryKey,type Analysis} from "@workspace/api-client-react";
import { ArrowUp, History, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RequireAuth } from "@/components/require-auth";
import { EmptyState, ErrorState, RowSkeleton } from "@/components/states";
import { useToast } from "@/hooks/use-toast";
import { errMessage } from "@/lib/format";
import { StudioTurn } from "@/components/research-studio/turn";
import "@/components/research-studio/studio.css";
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  useEffect(() => { setQuestion(prefill); }, [threadId, prefill]);

  const active = thread?.turns.some((t) => !isDone(t.status)) || (!!pendingId && !(list.data ?? []).some((a) => a.id === pendingId && isDone(a.status)) && !threadId);
  const ownActive = (list.data ?? []).some((a) => !isDone(a.status)) || active;
  const parent = thread ? [...thread.turns].reverse().find((t) => t.status === "completed") : undefined;

  const u = usage.data;
  const left = u ? u.answersLimit < 0 ? Infinity : u.answersLimit - u.answersUsed : null;
  let problem: string | null = null;
  if (question.trim().length < 5) problem = "Write a question of at least 5 characters.";
  else if (question.length > 2000) problem = "Keep the question under 2000 characters.";
  else if (ownActive) problem = "Wait for the current answer to finish.";
  else if (left !== null && left <= 0) problem = `No answers left this ${u?.period === "starter" ? "trial" : "period"}.`;

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (problem || create.isPending) return;
    try {
      const a = await create.mutateAsync({
        data: { kind: "answer", question: question.trim(), autoDiscover: true, parentAnalysisId: parent?.id, inspectFigures: true, aiConsent: true },
      });
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

  return <div className="ev-studio"><div className="ev-workspace">
    <header className="ev-pagehead">
      <h1>Research Studio</h1>
      <div className="ev-header-actions">
        <Popover open={historyOpen} onOpenChange={setHistoryOpen}>
          <PopoverTrigger asChild><Button variant="ghost" size="sm" aria-label="Conversation history" title="Conversation history" data-testid="button-conversation-history"><History className="h-4 w-4"/><span className="ev-history-label">History</span></Button></PopoverTrigger>
          <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] bg-[#fcfbf7] text-[#263d3b]">
            <h2 className="mb-3 text-sm font-semibold">Conversations ({threads.length})</h2>
            <nav aria-label="Ask threads" className="max-h-[60vh] overflow-y-auto">
              {threads.map(t=><Link key={t.id} href={"/ask?t="+encodeURIComponent(t.id)} onClick={()=>setHistoryOpen(false)} aria-current={thread?.id===t.id?"page":undefined} className={`block rounded px-3 py-2 text-sm hover:bg-[#e8eee6] ${thread?.id===t.id?"bg-[#e8eee6]":""}`}><span className="block break-words">{t.turns[0].question}</span><small className="text-[#67736c]">{t.turns.length} turns</small></Link>)}
              {!threads.length&&<p className="text-sm text-[#67736c]">{list.isLoading?"Loading conversations…":"No conversations yet."}</p>}
            </nav>
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="sm" onClick={()=>{setQuestion("");setLocation("/ask");}} disabled={!!ownActive} data-testid="button-new-thread">New question</Button>
      </div>
    </header>
    {list.isLoading?<RowSkeleton rows={2}/>:list.isError?<ErrorState error={list.error} onRetry={()=>list.refetch()} title="Couldn't load your conversations"/>:threadId&&!thread?<EmptyState icon={<MessageSquareText/>} title="Conversation not found" body="It may belong to another account. Start a new question."/>:thread?<ol className="ev-turn-list">{thread.turns.map(t=><StudioTurn key={t.id} initial={t} retryDisabled={!!ownActive} onRetry={q=>{setQuestion(q);document.getElementById("studio-question")?.focus();}}/>)}</ol>:<div className="ev-welcome"><p className="ev-micro">A clearer path through the literature</p><h2>What would you like to understand?</h2><p>Ask a research question. We find relevant papers and bring the answer and its evidence together.</p><div className="ev-suggestions">{["What methods improve wind turbine efficiency?","What does recent research say about sustainable textiles?"].map(q=><button key={q} onClick={()=>setQuestion(q)}>{q}</button>)}</div><p className="ev-evidence-note">New answers include a browsable collection of retrieved papers. Only selected evidence is analyzed.</p></div>}
    <section className="ev-follow" aria-label="Ask a question"><div className="ev-follow-top"><span className="ev-number">03</span><p>{thread?"Keep the question moving.":"Start with your question."}</p></div>
    <form className="ev-composer" onSubmit={submit}><label className="ev-micro" htmlFor="studio-question">{thread?"Follow-up question":"Research question"}</label>
    <Textarea id="studio-question" value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={onKey} maxLength={2000} placeholder={thread?"Compare these methods using the same papers…":"Ask about a topic, method or research finding…"} data-testid="input-ask-question"/>
    <div className="ev-composer-bottom"><p className="ev-status" role="status" data-testid="text-ask-status">{problem??"Ready. "+(left===null?"":left+" answers left.")}</p><button type="submit" className="ev-send" disabled={!!problem||create.isPending||list.isLoading||usage.isLoading} data-testid="button-ask-send"><ArrowUp/>{create.isPending?"Sending…":thread?"Ask follow-up":"Ask"}</button></div>
    </form><p className="ev-composer-note">Ctrl / ⌘ + Enter to send · AI-assisted answers need original-source review.</p></section>
  </div></div>;
}
export default function Ask(){return <RequireAuth what="research conversation"><AskInner/></RequireAuth>;}
