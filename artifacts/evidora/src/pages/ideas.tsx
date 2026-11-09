import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGenerateStudioDocument, getGetStudioItemQueryKey, getListStudioItemsQueryKey, getGetUsageQueryKey, type StudioItem } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowLeft, FolderOpen, History, Lightbulb, MessagesSquare, Plus, Sparkles, Wand2 } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { ErrorState } from "@/components/states";
import { useActiveProject } from "@/lib/active-project";
import { NeedsProject } from "@/components/studio/project-switcher";
import { StudioHeader } from "@/components/studio/studio-page";
import { Composer } from "@/components/studio/composer";
import { ConversationList, ItemList } from "@/components/studio/item-list";
import { ConversationView } from "@/components/studio/conversation-view";
import { answerConversations, buildConversations, conversationBusy, conversationFor, followUpParent, questionCount, requestParent, requestPrompt, type Turn } from "@/lib/conversation";
import { ItemWorkspace } from "@/components/studio/item-workspace";
import { GenerationStatus } from "@/components/studio/generation-status";
import { IdeaPicker } from "@/components/studio/idea-picker";
import { AttachDocuments } from "@/components/studio/attach-documents";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useProjectItems, useStudioItem } from "@/components/studio/use-studio";
import { useItemParam } from "@/components/studio/use-item-param";
import { useToast } from "@/hooks/use-toast";
import { friendlyError, isWorking, KIND_LABEL, meta } from "@/lib/studio";

const TONES = ["170 36% 28%", "16 58% 44%", "43 70% 38%", "210 40% 34%", "330 30% 38%"];
const SET_KEY = (ideaId: string) => `evidora-idea-from-set:${ideaId}`;
const rememberSet = (ideaId: string, setId: string) => { try { sessionStorage.setItem(SET_KEY(ideaId), setId); } catch { /* storage unavailable */ } };
const recallSet = (ideaId: string) => { try { return sessionStorage.getItem(SET_KEY(ideaId)); } catch { return null; } };
const wordCount = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

const DEVELOP_PROMPT = (title: string) => `Develop this selected research idea, "${title}", into a full idea brief. Use these sections: Rationale; Objectives; Research question or hypothesis; Proposed method; Evaluation plan; Feasibility; Limitations; Related work. Build on the idea text as written and on project and published evidence. Do not invent results, data, numbers or citations; where evidence is missing, say what is needed.`;

function IdeaSetView({ set, confirmed, onOpenIdea }: { set: StudioItem; confirmed: StudioItem[]; onOpenIdea: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(0);
  const ideas = meta(set).ideas;
  useEffect(() => { if (set.status === "completed" && ideas.length) { setStart(0); setOpen(true); } }, [set.id, set.status, ideas.length]);
  if (isWorking(set.status) || set.status === "failed") return <GenerationStatus item={set} />;
  if (!ideas.length) return <p className="sx-card p-5 text-sm text-muted-foreground">This idea set has no structured ideas. Start a new topic with a little more detail.</p>;
  const isConfirmed = (t: string) => confirmed.some(c => c.title.trim().toLowerCase() === t.trim().toLowerCase());
  const openAt = (i: number) => { setStart(i); setOpen(true); };
  return (
    <div className="rise space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0"><p className="sx-eyebrow">Five directions</p><h2 className="sx-title text-[28px] leading-tight md:text-[34px]">{set.title}</h2></div>
        <button className="sx-btn sx-primary" onClick={() => openAt(0)} data-testid="button-review-ideas"><Sparkles />Review one by one</button>
      </div>
      <ol className="space-y-3">
        {ideas.map((idea, i) => (
          <li key={i}>
            <button onClick={() => openAt(i)} className="sx-card lift ev-focus block w-full p-5 text-left" style={{ borderLeft: `5px solid hsl(${TONES[i % 5]})` }} data-testid={`card-idea-summary-${i}`}>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em]" style={{ color: `hsl(${TONES[i % 5]})` }}>Idea {i + 1}{isConfirmed(idea.title) ? " · confirmed" : ""}</p>
              <p className="sx-title mt-1 text-xl leading-snug">{idea.title}</p>
              <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-muted-foreground">{idea.question}</p>
            </button>
          </li>
        ))}
      </ol>
      <IdeaPicker open={open} onOpenChange={setOpen} set={set} ideas={ideas} confirmed={confirmed} startIndex={start} onOpenIdea={x => { rememberSet(x, set.id); onOpenIdea(x); }} />
    </div>
  );
}

function DevelopIdea({ item, onCreated }: { item: StudioItem; onCreated: (id: string) => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const gen = useGenerateStudioDocument();
  const run = async () => {
    try {
      const created = await gen.mutateAsync({ data: { projectId: item.projectId, kind: "answer", parentId: item.id, evidenceMode: "combined", prompt: DEVELOP_PROMPT(item.title).slice(0, 4900) } });
      qc.setQueryData(getGetStudioItemQueryKey(created.id), created);
      void qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
      void qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
      toast({ title: "Developing this idea", description: "A new linked brief is being written. Your original idea is unchanged." });
      onCreated(created.id);
    } catch (e) { toast({ title: "Couldn't start", description: friendlyError(e), variant: "destructive" }); }
  };
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-[hsl(var(--teal)/0.3)] bg-[hsl(var(--teal)/0.05)] px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center" data-testid="panel-develop-idea">
      <Wand2 className="hidden h-4 w-4 shrink-0 text-[hsl(var(--teal))] sm:block" aria-hidden />
      <p className="min-w-0 flex-1 text-sm">This idea is a short outline ({wordCount(item.content)} words). Develop it into rationale, objectives, method, evaluation, feasibility, limitations and related work. The original stays as written.</p>
      <button className="sx-btn sx-primary" disabled={gen.isPending} onClick={() => void run()} data-testid="button-develop-idea"><Sparkles />{gen.isPending ? "Starting..." : "Develop this idea"}</button>
    </div>
  );
}

function Inner() {
  const { project } = useActiveProject();
  const { id, setId, params } = useItemParam();
  const tab = params.get("mode") === "answer" ? "answer" : "ideas";
  const q = params.get("q") ?? "";
  const items = useProjectItems(project?.id);
  const open = useStudioItem(id);
  const all = useMemo(() => items.data ?? [], [items.data]);
  const confirmed = all.filter(i => i.kind === "idea");
  const [tabState, setTab] = useState(tab);
  const [drawer, setDrawer] = useState(false);
  const [drawerKinds, setDrawerKinds] = useState<"ideas" | "answer">(tab);
  const [scrollTo, setScrollTo] = useState<string | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const regen = useGenerateStudioDocument();
  useEffect(() => setTab(tab), [tab]);
  // Include the open item even before the list refetches (just-created follow-ups).
  const merged = useMemo(() => (open.data && !all.some(x => x.id === open.data!.id) ? [...all, open.data] : all), [all, open.data]);
  const convs = useMemo(() => (project ? buildConversations(merged, project.id) : []), [merged, project]);
  const answerConvs = useMemo(() => answerConversations(convs), [convs]);

  const header = <StudioHeader kicker="Ideas" title="Five directions from your own thinking." intro="Describe what you are curious about, in your own words. Evidora proposes five researchable ideas grounded in your project; confirm the ones worth keeping. Or ask a direct question about your ideas and references." />;
  if (!project) return <>{header}<NeedsProject what="Your ideas" /></>;
  const item = open.data && open.data.projectId === project.id ? open.data : undefined;
  const fromSet = item?.kind === "idea" ? recallSet(item.id) : null;
  const conv = item && item.kind !== "ideas" ? conversationFor(convs, item.id) : undefined;
  const seed = conv?.turns[0].seed ? conv.turns[0].latest : undefined;
  const chatView = !!conv && conv.turns.length > 1;
  const backTarget = fromSet ?? (chatView && seed?.kind === "idea" ? seed.id : null);
  const parentForFollowUp = conv ? followUpParent(conv) : item?.status === "completed" ? item.id : null;
  const busy = conv ? conversationBusy(conv) : !!item && isWorking(item.status);
  const retry = async (turn: Turn<StudioItem>) => {
    const first = turn.revisions[0];
    const prompt = requestPrompt(first);
    if (!project || !prompt || regen.isPending) return;
    const req = (first.metadata as { request?: { evidenceMode?: string } } | null)?.request;
    const mode = req?.evidenceMode === "discover" || req?.evidenceMode === "combined" ? req.evidenceMode : "project";
    const parentId = requestParent(first) ?? (first.status === "failed" ? first.id : null);
    try {
      const created = await regen.mutateAsync({ data: { projectId: project.id, kind: "answer", prompt: prompt.slice(0, 5000), evidenceMode: mode, ...(parentId && merged.some(x => x.id === parentId && x.projectId === project.id) ? { parentId } : {}) } });
      qc.setQueryData(getGetStudioItemQueryKey(created.id), created);
      void qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
      void qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
      setScrollTo(created.id);
      setId(created.id);
    } catch (e) { toast({ title: "Couldn't retry", description: friendlyError(e), variant: "destructive" }); }
  };
  const backLabel = fromSet ? "Back to five ideas" : "Back to the idea";
  const needsDevelop = item?.kind === "idea" && item.status === "completed" && wordCount(item.content) < 400;

  const drawerEl = (
    <Sheet open={drawer} onOpenChange={setDrawer}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-[hsl(52_30%_96%)] sm:max-w-[400px]" data-testid="drawer-history">
        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="sx-title text-xl">History and uploads</SheetTitle>
          <SheetDescription>Earlier idea sets, confirmed ideas, answers and your project documents.</SheetDescription>
        </SheetHeader>
        <div className="space-y-5">
          <div>
            <div className="sx-seg mb-3" role="radiogroup" aria-label="Show">
              <label className={drawerKinds === "ideas" ? "on" : ""}><input type="radio" className="sr-only" checked={drawerKinds === "ideas"} onChange={() => setDrawerKinds("ideas")} data-testid="radio-history-ideas" />Ideas</label>
              <label className={drawerKinds === "answer" ? "on" : ""}><input type="radio" className="sr-only" checked={drawerKinds === "answer"} onChange={() => setDrawerKinds("answer")} data-testid="radio-history-answers" />Answers</label>
            </div>
            {items.isError ? <ErrorState error={items.error} onRetry={() => void items.refetch()} title="Couldn't load items" />
              : drawerKinds === "ideas"
                ? <ItemList items={all} kinds={["ideas", "idea", "note"]} activeId={id} loading={items.isLoading} onOpen={x => { setDrawer(false); setId(x, { guard: true }); }} emptyText="Nothing here yet." />
                : <ConversationList convs={answerConvs} activeRootId={conv?.rootId ?? null} loading={items.isLoading} onOpen={x => { setDrawer(false); setId(x, { guard: true }); }} emptyText="No conversations yet." />}
          </div>
          <AttachDocuments projectId={project.id} items={all} variant="compact" />
          <Link href="/my-library" className="sx-btn w-full" data-testid="link-project-library-drawer"><FolderOpen />Open {project.name} library</Link>
        </div>
      </SheetContent>
    </Sheet>
  );

  if (!id) {
    return (
      <div className="mx-auto max-w-[860px]">
        <header className="rise mb-5 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="sx-eyebrow">Ideas</p>
            <h1 className="sx-title mt-0.5 text-[28px] leading-tight md:text-[34px]">What are you curious about?</h1>
          </div>
          <div className="flex gap-2">
            <button className="sx-btn" onClick={() => setDrawer(true)} data-testid="button-open-history"><History />History and uploads</button>
            <Link href="/my-library" className="sx-btn shrink-0" data-testid="link-project-library"><FolderOpen /><span className="max-w-[160px] truncate">{project.name}</span></Link>
          </div>
        </header>
        <section className="space-y-4" aria-label="Write your topic">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-[hsl(90_14%_84%)]">
            <div className="flex gap-5" role="tablist" aria-label="What would you like to do?">
              <button role="tab" aria-selected={tabState === "ideas"} onClick={() => setTab("ideas")} className="sx-tab" data-testid="tab-ideas"><Lightbulb />Suggest five ideas</button>
              <button role="tab" aria-selected={tabState === "answer"} onClick={() => setTab("answer")} className="sx-tab" data-testid="tab-answer"><MessagesSquare />Ask my project</button>
            </div>
            <p className="hidden pb-2 text-xs text-muted-foreground md:block">{tabState === "ideas" ? "In your own words. Plain language is fine." : "Answers draw on your ideas and references."}</p>
          </div>
          {tabState === "ideas"
            ? <Composer key={`ideas-${project.id}`} variant="wide" label="Describe what you are curious about" projectId={project.id} kind="ideas" saveKind="note" placeholder="Describe what you are curious about. e.g. I teach in a village school near Patna. Many children fall sick after monsoon and I wonder whether our handpump water is safe..." cta="Suggest five ideas" defaultMode="combined" onCreated={it => setId(it.id)} />
            : <Composer key={`answer-${project.id}-${q}`} variant="wide" label="Ask a question about your project" projectId={project.id} kind="answer" saveKind="answer" initialPrompt={q} placeholder="e.g. Using my references, which of my ideas has the strongest evidence?" cta="Answer from my project" defaultMode="project" onCreated={it => setId(it.id)} />}
          <div className="flex items-center gap-4 rounded-lg border border-dashed border-[hsl(110_14%_78%)] px-4 py-3" data-testid="status-ideas-empty">
            <div className="flex shrink-0 -space-x-2" aria-hidden>{TONES.map((t, i) => <span key={i} className="h-7 w-5 rounded-[3px] border border-[hsl(52_40%_98%)]" style={{ background: `hsl(${t})`, transform: `rotate(${(i - 2) * 7}deg)` }} />)}</div>
            <p className="text-[13px] text-muted-foreground"><span className="font-medium text-[hsl(var(--ink-teal))]">Five ideas open one by one.</span> Confirm one and it opens as a full page you can develop, edit and export.</p>
          </div>
        </section>
        {drawerEl}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[960px] pb-6">
      <nav className="rise sticky top-0 z-20 -mx-2 mb-5 flex flex-wrap items-center gap-2 bg-[hsl(var(--background)/0.92)] px-2 py-2 backdrop-blur" aria-label="Ideas navigation">
        <button className="sx-btn sx-primary" onClick={() => setId(null, { guard: true })} data-testid="button-new-topic"><Plus />New topic</button>
        {backTarget && <button className="sx-btn" onClick={() => setId(backTarget, { guard: true })} data-testid="button-back-ideas"><ArrowLeft />{backLabel}</button>}
        {item && <span className="hidden truncate font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground md:inline">{KIND_LABEL[item.kind] ?? item.kind}</span>}
        <div className="ml-auto flex gap-2">
          <button className="sx-btn" onClick={() => { setDrawerKinds(item?.kind === "answer" ? "answer" : "ideas"); setDrawer(true); }} data-testid="button-open-history"><History /><span className="hidden sm:inline">History and uploads</span><span className="sm:hidden">History</span></button>
          <Link href="/my-library" className="sx-btn hidden shrink-0 sm:inline-flex" data-testid="link-project-library"><FolderOpen /><span className="max-w-[140px] truncate">{project.name}</span></Link>
        </div>
      </nav>

      <div className="min-w-0 space-y-5" aria-live="polite">
        {open.isLoading && <div className="space-y-3" data-testid="status-item-loading"><div className="h-10 w-2/3 animate-pulse rounded-md bg-[hsl(90_14%_88%)]" /><div className="sx-card h-80 animate-pulse" /></div>}
        {open.isError && <ErrorState error={open.error} onRetry={() => void open.refetch()} title="Couldn't open this item" />}
        {!open.isLoading && !open.isError && open.data && !item && <ErrorState error={new Error("This item belongs to another project. Switch project or start a new topic.")} onRetry={() => setId(null)} title="Not in this project" />}
        {needsDevelop && item && <DevelopIdea item={item} onCreated={x => setId(x, { guard: true })} />}
        {item?.kind === "ideas" && <IdeaSetView set={item} confirmed={confirmed} onOpenIdea={x => setId(x)} />}
        {chatView && conv && item && (
          <>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground" data-testid="text-conversation-count">Conversation &middot; {questionCount(conv)} question{questionCount(conv) === 1 ? "" : "s"}</p>
            <ConversationView conv={conv} selectedId={item.id} allItems={merged} onOpen={x => setId(x)} onOpenSet={x => setId(x, { guard: true })}
              onRetry={t => void retry(t)} scrollTo={scrollTo} onScrolled={() => setScrollTo(null)} />
          </>
        )}
        {!chatView && item && item.kind !== "ideas" && (() => {
          const only = conv?.turns[0];
          const p = only && !only.seed ? only.prompt : null;
          return <>
            {p && <div className="flex justify-end" data-testid={`turn-user-${item.id}`}><div className="max-w-[85%] rounded-2xl rounded-br-md border border-[hsl(var(--teal)/0.25)] bg-[hsl(var(--teal)/0.07)] px-4 py-3"><p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--teal))]">You</p><p className="whitespace-pre-wrap text-[15px] leading-relaxed">{p}</p></div></div>}
            <ItemWorkspace item={item} allItems={all} presentation="reading" onOpen={x => setId(x)} onRetry={item.status === "failed" && only ? () => void retry(only) : undefined} />
          </>;
        })()}

        {item && (item.kind !== "ideas" || !isWorking(item.status)) && (parentForFollowUp || busy) && (
          <section aria-label="Follow up" className="sticky bottom-3 z-10 pt-2">
            <Composer key={`follow-${conv?.rootId ?? item.id}`} compact parentId={parentForFollowUp ?? undefined} label="Ask a follow-up in this conversation"
              projectId={project.id} kind="answer" defaultMode="project" cta="Ask"
              disabled={busy || regen.isPending || !parentForFollowUp} disabledNote={busy ? "Wait for the current answer to finish" : "Nothing completed to follow up yet"}
              placeholder={item.kind === "ideas" ? "Ask about these five ideas, or compare two of them..." : "Ask a follow-up. Earlier questions and answers stay above."}
              onCreated={it => { setScrollTo(it.id); setId(it.id); }} />
          </section>
        )}
      </div>
      {drawerEl}
    </div>
  );
}

export default function Ideas() { return <RequireAuth what="ideas"><Inner /></RequireAuth>; }
