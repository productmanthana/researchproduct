import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useGenerateStudioDocument, getGetStudioItemQueryKey, getListStudioItemsQueryKey, getGetUsageQueryKey, type StudioItem } from "@workspace/api-client-react";
import { MessageSquareText, Sparkles, Wand2 } from "lucide-react";
import { ErrorState } from "@/components/states";
import { AcademicAnswer } from "@/components/academic-answer";
import { useActiveProject } from "@/lib/active-project";
import { Composer } from "./composer";
import { ConversationView } from "./conversation-view";
import { GenerationStatus } from "./generation-status";
import { IdeaPicker } from "./idea-picker";
import { useProjectItems, useStudioItem } from "./use-studio";
import { buildConversations, conversationBusy, conversationFor, followUpParent, requestParent, requestPrompt, type Turn } from "@/lib/conversation";
import { analysisTurnsOf, CHAT_KINDS, confirmedFor, conversationContext, ideaSelection, ideasIntent } from "@/lib/ideas-chat";
import { chatDocumentPrompt } from "@/lib/chat-document";
import { FIGURE_GUARD, ROUTE_FOR_KIND } from "@/lib/figures";
import { useToast } from "@/hooks/use-toast";
import { JournalSetupDialog } from "./journal-setup";
import { journalGenerationExtras, journalPromptWithLength } from "@/lib/journal-setup";
import { friendlyError, isWorking, meta, projectIntent } from "@/lib/studio";

const TONES = ["170 36% 28%", "16 58% 44%", "43 70% 38%", "210 40% 34%", "330 30% 38%"];
const wordCount = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);
const DEVELOP_PROMPT = (title: string) => `Develop this selected research idea, "${title}", into a full idea brief. Use these sections: Rationale; Objectives; Research question or hypothesis; Proposed method; Evaluation plan; Feasibility; Limitations; Related work. Build on the idea text as written and on project and published evidence. Do not invent results, data, numbers or citations; where evidence is missing, say what is needed.`;

type Pick = { setId: string; index: number; n: number } | null;

function IdeaSetView({ set, confirmed, onOpenIdea, pick, autoOpen, onRetry }: { set: StudioItem; confirmed: StudioItem[]; onOpenIdea: (id: string) => void; pick: Pick; autoOpen: boolean; onRetry?: () => void }) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(0);
  const ideas = meta(set).ideas;
  const prevStatus = useRef(set.status);
  useEffect(() => {
    // Open the picker once when a set finishes while it is on screen; not on every revisit.
    if (autoOpen && set.status === "completed" && prevStatus.current !== "completed" && ideas.length) { setStart(0); setOpen(true); }
    prevStatus.current = set.status;
  }, [set.status, ideas.length, autoOpen]);
  useEffect(() => { if (pick && pick.setId === set.id && ideas[pick.index]) { setStart(pick.index); setOpen(true); } }, [pick, set.id, ideas]);
  if (isWorking(set.status) || set.status === "failed") return <GenerationStatus item={set} onRetry={onRetry} />;
  if (!ideas.length) return <p className="sx-card p-5 text-sm text-muted-foreground">This idea set has no structured ideas. Ask again with a little more detail about the topic.</p>;
  const isConfirmed = (t: string) => confirmed.some(c => c.title.trim().toLowerCase() === t.trim().toLowerCase());
  const openAt = (i: number) => { setStart(i); setOpen(true); };
  return (
    <div className="rise space-y-4" data-testid={`ideaset-${set.id}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0"><p className="sx-eyebrow">Five directions</p><h2 className="sx-title text-[24px] leading-tight md:text-[28px]">{set.title}</h2></div>
        <button className="sx-btn sx-primary" onClick={() => openAt(0)} data-testid="button-review-ideas"><Sparkles />Review one by one</button>
      </div>
      <ol className="space-y-2.5">
        {ideas.map((idea, i) => (
          <li key={i}>
            <button onClick={() => openAt(i)} className="sx-card lift ev-focus block w-full p-4 text-left" style={{ borderLeft: `5px solid hsl(${TONES[i % 5]})` }} data-testid={`card-idea-summary-${i}`}>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em]" style={{ color: `hsl(${TONES[i % 5]})` }}>Idea {i + 1}{isConfirmed(idea.title) ? " · confirmed" : ""}</p>
              <p className="sx-title mt-1 text-lg leading-snug">{idea.title}</p>
              <p className="mt-1.5 line-clamp-2 text-[14.5px] leading-relaxed text-muted-foreground">{idea.question}</p>
            </button>
          </li>
        ))}
      </ol>
      <p className="text-[13px] text-muted-foreground">Ask below to compare them, say <i>select idea 2</i> to open one, or ask for more ideas.</p>
      <IdeaPicker open={open} onOpenChange={setOpen} set={set} ideas={ideas} confirmed={confirmed} startIndex={start} onOpenIdea={onOpenIdea} />
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
      toast({ title: "Developing this idea", description: "A linked brief is being written below. Your original idea is unchanged." });
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

function Bubble({ who, children, testId }: { who: string; children: ReactNode; testId: string }) {
  const you = who === "You";
  return <div className={you ? "flex justify-end" : ""} data-testid={testId}>
    <div className={you ? "max-w-[85%] rounded-2xl rounded-br-md border border-[hsl(var(--teal)/0.25)] bg-[hsl(var(--teal)/0.07)] px-4 py-3" : "sx-card px-4 py-3"}>
      <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--teal))]">{who}</p>{children}
    </div>
  </div>;
}

/** Earlier AI Chat turns carried into this project conversation (saved server context, not session state). */
/** Saved AI Chat turns, de-duplicated; the final turn falls back to the saved source answer. */
function priorChatTurns(root: StudioItem) {
  const out: { question: string; answer: string }[] = [];
  for (const t of analysisTurnsOf(root)) {
    const prev = out.at(-1);
    if (prev && prev.question.trim() === t.question.trim()) { if (!prev.answer) prev.answer = t.answer; continue; }
    out.push({ ...t });
  }
  if (!out.length) out.push({ question: root.title, answer: root.content });
  const last = out[out.length - 1];
  if (!last.answer) last.answer = root.content;
  return out;
}

function PriorChat({ root }: { root: StudioItem }) {
  const [all, setAll] = useState(false);
  const m = root.metadata as Record<string, unknown> | null;
  const analysisId = typeof m?.analysisId === "string" ? m.analysisId : null;
  const list = priorChatTurns(root);
  const shown = all ? list : list.slice(-3);
  return <section className="space-y-3" aria-label="Earlier in this chat" data-testid="section-prior-chat">
    <div className="flex flex-wrap items-center gap-2">
      <p className="sx-eyebrow">Earlier in this chat</p>
      {list.length > shown.length && <button className="sx-btn" onClick={() => setAll(true)} data-testid="button-show-earlier">Show {list.length - shown.length} earlier</button>}
      {analysisId && <Link href={`/ask?t=${encodeURIComponent(analysisId)}`} className="sx-btn ml-auto" data-testid="link-source-analysis"><MessageSquareText />Open evidence thread</Link>}
    </div>
    {shown.map((t, i) => <div key={i} className="space-y-2">
      {t.question && <Bubble who="You" testId={`prior-q-${i}`}><p className="whitespace-pre-wrap text-[15px] leading-relaxed">{t.question}</p></Bubble>}
      {t.answer && <Bubble who="Evidora" testId={`prior-a-${i}`}><div className="max-h-[360px] overflow-y-auto text-[15px] leading-relaxed"><AcademicAnswer content={t.answer} inline={x => x} /></div></Bubble>}
    </div>)}
  </section>;
}

type Props = { itemId: string; onOpen: (id: string, opts?: { guard?: boolean }) => void; onNewTopic: () => void; onNavigate: (url: string) => void };

/** Ideas, selected ideas and project answers as one AI Chat conversation at /ask?item=ID. */
export function IdeasChat({ itemId, onOpen, onNewTopic, onNavigate }: Props) {
  const { project, select, loading: projectsLoading, error: projectsError, refetch: refetchProjects } = useActiveProject();
  const open = useStudioItem(itemId);
  const aligned = useRef<string | null>(null);
  const [alignBlocked, setAlignBlocked] = useState(false);
  useEffect(() => {
    const it = open.data;
    if (!it || projectsLoading || project?.id === it.projectId || aligned.current === it.id) return;
    aligned.current = it.id;
    setAlignBlocked(!select(it.projectId, { skipGuard: true, preserveItem: true }));
  }, [open.data, project?.id, projectsLoading, select]);
  const items = useProjectItems(project?.id);
  const all = useMemo(() => items.data ?? [], [items.data]);
  const merged = useMemo(() => (open.data && !all.some(x => x.id === open.data!.id) ? [...all, open.data] : all), [all, open.data]);
  const convs = useMemo(() => (project ? buildConversations(merged, project.id) : []), [merged, project]);
  const [scrollTo, setScrollTo] = useState<string | null>(null);
  const [pick, setPick] = useState<Pick>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const regen = useGenerateStudioDocument();
  const [setupReq, setSetupReq] = useState<{ prompt: string; resolve: (v: { prompt: string; extra: Record<string, unknown> } | null) => void } | null>(null);

  if (!open.isLoading && open.data && !project && projectsError) return <ErrorState error={projectsError} onRetry={() => { aligned.current = null; refetchProjects(); }} title="Couldn't load your projects" />;
  if (open.isLoading || (open.data && !project && !alignBlocked)) return <div className="space-y-3" data-testid="status-item-loading"><div className="h-10 w-2/3 animate-pulse rounded-md bg-[hsl(90_14%_88%)]" /><div className="sx-card h-72 animate-pulse" /></div>;
  if (open.isError) return <ErrorState error={open.error} onRetry={() => void open.refetch()} title="Couldn't open this conversation" />;
  const item = open.data && project && open.data.projectId === project.id ? open.data : undefined;
  if (!item) {
    if (open.data && !alignBlocked) return <div className="sx-card h-40 animate-pulse" data-testid="status-switching-project" />;
    return <ErrorState error={new Error("This conversation belongs to a project that is not selected. Switch project or start a new chat.")} onRetry={onNewTopic} title="Not in this project" />;
  }

  const conv = conversationFor(convs, item.id);
  const root = conv?.turns[0].latest;
  const bridged = !!root && root.kind === "answer" && !!(root.metadata as Record<string, unknown> | null)?.analysisId;
  const parentForFollowUp = conv ? followUpParent(conv) : item.status === "completed" ? item.id : null;
  const busy = conv ? conversationBusy(conv) : isWorking(item.status);
  const sets = conv?.turns.map(t => t.latest).filter(x => x.kind === "ideas") ?? (item.kind === "ideas" ? [item] : []);
  const latestSet = [...sets].reverse().find(s => s.status === "completed" && meta(s).ideas.length);
  // Chronological real context: carried AI Chat turns, then each project turn with its saved content (selected idea included).
  const priorTurns = bridged && root ? priorChatTurns(root) : [];
  const ctx = [
    ...priorTurns,
    ...conversationContext((conv?.turns ?? [{ prompt: null, latest: item }]).filter(t => !(bridged && root && t.latest.id === root.id)), p => ideaSelection(p) !== null),
  ];

  const retry = async (turn: Turn<StudioItem>) => {
    const first = turn.revisions[0];
    const prompt = requestPrompt(first);
    if (!prompt || regen.isPending) return;
    const req = (first.metadata as { request?: { evidenceMode?: string } } | null)?.request;
    const mode = req?.evidenceMode === "discover" || req?.evidenceMode === "combined" ? req.evidenceMode : "project";
    const parentId = requestParent(first) ?? (first.status === "failed" ? first.id : null);
    try {
      const created = await regen.mutateAsync({ data: { projectId: item.projectId, kind: first.kind === "ideas" ? "ideas" : "answer", prompt: prompt.slice(0, 5000), evidenceMode: mode, ...(parentId && merged.some(x => x.id === parentId) ? { parentId } : {}) } });
      qc.setQueryData(getGetStudioItemQueryKey(created.id), created);
      void qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
      void qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
      setScrollTo(created.id);
      onOpen(created.id);
    } catch (e) { toast({ title: "Couldn't retry", description: friendlyError(e), variant: "destructive" }); }
  };

  const needsDevelop = item.kind === "idea" && item.status === "completed" && wordCount(item.content) < 400;
  const renderItem = (shown: StudioItem, turn?: Turn<StudioItem>) => {
    if (shown.kind === "ideas") return <IdeaSetView set={shown} onRetry={shown.status === "failed" ? () => void retry(turn ?? { id: shown.id, prompt: requestPrompt(shown), revisions: [shown], latest: shown, seed: true, createdAt: shown.createdAt }) : undefined} confirmed={confirmedFor(shown, merged)} pick={pick} autoOpen={shown.id === item.id} onOpenIdea={x => { setScrollTo(x); onOpen(x); }} />;
    if (bridged && root && shown.id === root.id) return null; // shown once, in "Earlier in this chat"
    return undefined;
  };

  return (
    <div className="space-y-6 pb-4" aria-live="polite" data-testid="ideas-chat">
      {bridged && root && <PriorChat root={root} />}
      {bridged && <p className="sx-eyebrow" data-testid="text-bridge-note">Continued in project {project?.name}</p>}
      {conv
        ? <ConversationView conv={conv} selectedId={item.id} allItems={merged} onOpen={x => { if (x) onOpen(x); }} onOpenSet={x => onOpen(x, { guard: true })}
            onRetry={t => void retry(t)} scrollTo={scrollTo} onScrolled={() => setScrollTo(null)} renderItem={renderItem} />
        : renderItem(item) ?? null}
      {needsDevelop && <DevelopIdea item={item} onCreated={x => { setScrollTo(x); onOpen(x); }} />}
      <JournalSetupDialog open={!!setupReq} topic={setupReq?.prompt.split("\n")[0].slice(0, 300) ?? ""}
        onCancel={() => { setupReq?.resolve(null); setSetupReq(null); }}
        onConfirm={s => { if (!setupReq) return; setupReq.resolve({ prompt: journalPromptWithLength(setupReq.prompt, s.length), extra: journalGenerationExtras(s) as Record<string, unknown> }); setSetupReq(null); }} />
      {(parentForFollowUp || busy) && (
        <section aria-label="Follow up" className="sticky bottom-3 z-10 pt-2">
          <Composer key={`follow-${conv?.rootId ?? item.id}`} compact parentId={parentForFollowUp ?? undefined} label="Continue this conversation"
            projectId={item.projectId} kind="answer" defaultMode="combined" cta="Send"
            disabled={busy || regen.isPending || !parentForFollowUp} disabledNote={busy ? "Wait for the current answer to finish" : "Nothing completed to follow up yet"}
            placeholder={latestSet ? "Compare ideas, say select idea 2, refine one, or ask for more ideas..." : "Ask a follow-up, or ask for five research ideas. Earlier turns stay above."}
            intercept={p => {
              const idx = latestSet ? ideaSelection(p, meta(latestSet).ideas.length) : null;
              if (idx === null || !latestSet) return false;
              setPick({ setId: latestSet.id, index: idx, n: Date.now() });
              return true;
            }}
            resolve={p => {
              const doc = projectIntent(p, ctx);
              if (doc?.document) return { kind: doc.kind, prompt: chatDocumentPrompt(p, ctx).slice(0, 5000), evidenceMode: doc.evidenceMode ?? "combined" };
              if (doc?.figure) return { kind: doc.kind, prompt: p.slice(0, 4700) + FIGURE_GUARD, evidenceMode: "project" };
              const r = ideasIntent(p, ctx);
              if (r) return { kind: "ideas", prompt: r.prompt, evidenceMode: r.own ? "project" : "combined" };
              return doc && doc.kind !== "answer" ? { kind: doc.kind, prompt: chatDocumentPrompt(p, ctx).slice(0, 5000), evidenceMode: "project" } : null;
            }}
            prepare={async req => {
              if (req.kind !== "journal") return {};
              // Revising an existing journal: the backend inherits its saved settings; the latest request governs length.
              const parentKind = merged.find(x => x.id === parentForFollowUp)?.kind;
              if (parentKind === "journal") return {};
              return new Promise(res => setSetupReq({ prompt: req.prompt, resolve: v => res(v) }));
            }}
            onCreated={it => {
              const route = ROUTE_FOR_KIND[it.kind];
              if (route && !CHAT_KINDS.has(it.kind)) { onNavigate(`${route}${route.includes("?") ? "&" : "?"}item=${encodeURIComponent(it.id)}`); return; }
              setScrollTo(it.id); onOpen(it.id);
            }} />
        </section>
      )}
    </div>
  );
}
