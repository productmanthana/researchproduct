import { useEffect, useMemo, useState } from "react";
import type { StudioItem } from "@workspace/api-client-react";
import { Lightbulb, MessagesSquare, Sparkles } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { ErrorState } from "@/components/states";
import { useActiveProject } from "@/lib/active-project";
import { NeedsProject } from "@/components/studio/project-switcher";
import { StudioHeader } from "@/components/studio/studio-page";
import { Composer } from "@/components/studio/composer";
import { ItemList } from "@/components/studio/item-list";
import { ItemWorkspace } from "@/components/studio/item-workspace";
import { GenerationStatus } from "@/components/studio/generation-status";
import { IdeaPicker } from "@/components/studio/idea-picker";
import { AttachDocuments } from "@/components/studio/attach-documents";
import { useProjectItems, useStudioItem } from "@/components/studio/use-studio";
import { useItemParam } from "@/components/studio/use-item-param";
import { isWorking, meta } from "@/lib/studio";

const TONES = ["170 36% 28%", "16 58% 44%", "43 70% 38%", "210 40% 34%", "330 30% 38%"];

function IdeaSetView({ set, confirmed, onOpenIdea }: { set: StudioItem; confirmed: StudioItem[]; onOpenIdea: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ideas = meta(set).ideas;
  useEffect(() => { if (set.status === "completed" && ideas.length) setOpen(true); }, [set.id, set.status, ideas.length]);
  if (isWorking(set.status) || set.status === "failed") return <GenerationStatus item={set} />;
  if (!ideas.length) return <p className="sx-card p-5 text-sm text-muted-foreground">This idea set has no structured ideas. Try generating again with more detail.</p>;
  const isConfirmed = (t: string) => confirmed.some(c => c.title.trim().toLowerCase() === t.trim().toLowerCase());
  return (
    <div className="rise space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><p className="sx-eyebrow">Five directions</p><h2 className="sx-title text-2xl">{set.title}</h2></div>
        <button className="sx-btn sx-primary" onClick={() => setOpen(true)} data-testid="button-review-ideas"><Sparkles />Review one by one</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {ideas.map((idea, i) => (
          <button key={i} onClick={() => setOpen(true)} className="sx-card lift p-4 text-left" style={{ borderTop: `5px solid hsl(${TONES[i % 5]})` }} data-testid={`card-idea-summary-${i}`}>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em]" style={{ color: `hsl(${TONES[i % 5]})` }}>Idea {i + 1}{isConfirmed(idea.title) ? " · confirmed" : ""}</p>
            <p className="sx-title mt-1 text-lg leading-snug">{idea.title}</p>
            <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{idea.question}</p>
          </button>
        ))}
      </div>
      <IdeaPicker open={open} onOpenChange={setOpen} set={set} ideas={ideas} confirmed={confirmed} onOpenIdea={onOpenIdea} />
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
  useEffect(() => setTab(tab), [tab]);

  const header = <StudioHeader kicker="Ideas" title="Five directions from your own thinking." intro="Describe what you are curious about, in your own words. Evidora proposes five researchable ideas grounded in your project; confirm the ones worth keeping. Or ask a direct question about your ideas and references." />;
  if (!project) return <>{header}<NeedsProject what="Your ideas" /></>;
  const item = open.data && open.data.projectId === project.id ? open.data : undefined;

  return (
    <>
      {header}
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-5">
          <div className="sx-card grid grid-cols-2 gap-1 p-1" role="tablist">
            <button role="tab" aria-selected={tabState === "ideas"} onClick={() => setTab("ideas")} className={`sx-btn border-0 ${tabState === "ideas" ? "sx-primary" : ""}`} data-testid="tab-ideas"><Lightbulb />Five ideas</button>
            <button role="tab" aria-selected={tabState === "answer"} onClick={() => setTab("answer")} className={`sx-btn border-0 ${tabState === "answer" ? "sx-primary" : ""}`} data-testid="tab-answer"><MessagesSquare />Ask my project</button>
          </div>
          {tabState === "ideas"
            ? <Composer key={`ideas-${project.id}`} projectId={project.id} kind="ideas" saveKind="note" placeholder="e.g. I teach in a village school near Patna. Many children fall sick after monsoon and I wonder whether our handpump water is safe..." cta="Suggest five ideas" defaultMode="combined" onCreated={it => setId(it.id, { guard: true })} />
            : <Composer key={`answer-${project.id}-${q}`} projectId={project.id} kind="answer" saveKind="answer" initialPrompt={q} placeholder="e.g. Using my references, which of my ideas has the strongest evidence?" cta="Answer from my project" defaultMode="project" onCreated={it => setId(it.id, { guard: true })} />}
          <AttachDocuments projectId={project.id} items={all} />
          <div>
            <p className="sx-eyebrow mb-2">{tabState === "ideas" ? "Idea sets and confirmed ideas" : "Project answers"}</p>
            {items.isError ? <ErrorState error={items.error} onRetry={() => void items.refetch()} title="Couldn't load items" />
              : <ItemList items={all} kinds={tabState === "ideas" ? ["ideas", "idea", "note"] : ["answer"]} activeId={id} loading={items.isLoading} onOpen={x => setId(x, { guard: true })} emptyText="Nothing here yet." />}
          </div>
        </div>
        <div className="min-w-0">
          {id && open.isLoading && <div className="sx-card h-96 animate-pulse" />}
          {id && open.isError && <ErrorState error={open.error} onRetry={() => void open.refetch()} title="Couldn't open this item" />}
          {item?.kind === "ideas" && <IdeaSetView set={item} confirmed={confirmed} onOpenIdea={x => setId(x)} />}
          {item && item.kind !== "ideas" && <ItemWorkspace item={item} allItems={all} onOpen={x => setId(x)} />}
          {!id && (
            <div className="sx-card grid-paper flex min-h-[420px] flex-col items-center justify-center p-10 text-center" data-testid="status-ideas-empty">
              <div className="flex -space-x-3">{TONES.map((t, i) => <span key={i} className="h-12 w-9 rounded-md border-2 border-[hsl(52_40%_98%)] shadow-sm" style={{ background: `hsl(${t})`, transform: `rotate(${(i - 2) * 7}deg)` }} />)}</div>
              <p className="sx-title mt-6 text-2xl">Five cards, one decision at a time</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">Nothing is forced. Read each idea, confirm the ones you like, and come back any time; your choices are remembered.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Ideas() { return <RequireAuth what="ideas"><Inner /></RequireAuth>; }
