import { useEffect, useRef, useState, type ReactNode } from "react";
import type { StudioItem } from "@workspace/api-client-react";
import { ChevronDown, ChevronUp, Lightbulb, PenLine } from "lucide-react";
import { AcademicAnswer } from "@/components/academic-answer";
import { FigureView, MissingFigure } from "./figure-view";
import { GenerationStatus } from "./generation-status";
import { ItemWorkspace, withoutRepeatedTitle } from "./item-workspace";
import { figuresOf } from "@/lib/figures";
import { isWorking, KIND_LABEL, meta } from "@/lib/studio";
import { ago } from "@/lib/format";
import type { Conversation, Turn } from "@/lib/conversation";

const plain = (t: string): ReactNode => t;

function YouSaid({ text, turnId }: { text: string; turnId: string }) {
  return (
    <div className="flex justify-end" data-testid={`turn-user-${turnId}`}>
      <div className="max-w-[85%] rounded-2xl rounded-br-md border border-[hsl(var(--teal)/0.25)] bg-[hsl(var(--teal)/0.07)] px-4 py-3">
        <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--teal))]">You</p>
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

/** Read-only answer body for an earlier turn; full tools open on demand. */
function PastAnswer({ item, allItems, onOpen, onRetry }: { item: StudioItem; allItems: StudioItem[]; onOpen: (id: string | null) => void; onRetry?: () => void }) {
  const [tools, setTools] = useState(false);
  if (isWorking(item.status) || item.status === "failed") return <GenerationStatus item={item} onRetry={onRetry} />;
  if (tools) return (
    <div className="space-y-2">
      <button className="sx-btn" onClick={() => setTools(false)} data-testid={`button-close-turn-tools-${item.id}`}><ChevronUp />Back to reading</button>
      <ItemWorkspace item={item} allItems={allItems} presentation="reading" onOpen={onOpen} />
    </div>
  );
  const figures = figuresOf(item);
  const renderFigure = (fid: string) => { const f = figures.find(x => x.id === fid); return f ? <FigureView itemId={item.id} figure={f} number={figures.indexOf(f) + 1} /> : <MissingFigure id={fid} />; };
  return (
    <article className="sx-card px-5 py-5 md:px-8" data-testid={`turn-answer-${item.id}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Evidora &middot; {KIND_LABEL[item.kind] ?? item.kind}{item.revision > 1 ? ` · rev ${item.revision}` : ""} &middot; {ago(item.createdAt)}</p>
        <button className="sx-btn ml-auto" onClick={() => setTools(true)} data-testid={`button-open-turn-tools-${item.id}`}><PenLine />Edit, versions, export</button>
      </div>
      <h3 className="sx-title text-2xl leading-tight">{item.title}</h3>
      <div className="mt-4">
        {item.content.trim() ? <AcademicAnswer content={withoutRepeatedTitle(item.content, item.title)} inline={plain} renderFigure={renderFigure} referenceSources={meta(item).sources} linkCitations /> : <p className="text-sm text-muted-foreground">No text.</p>}
      </div>
    </article>
  );
}

type Props = {
  conv: Conversation<StudioItem>;
  selectedId: string;
  allItems: StudioItem[];
  onOpen: (id: string | null) => void;
  onOpenSet: (id: string) => void;
  onRetry: (turn: Turn<StudioItem>) => void;
  /** Turn id to scroll to once (after sending). Cleared via onScrolled. */
  scrollTo: string | null;
  onScrolled: () => void;
};

export function ConversationView({ conv, selectedId, allItems, onOpen, onOpenSet, onRetry, scrollTo, onScrolled }: Props) {
  const refs = useRef(new Map<string, HTMLElement>());
  const onScrolledRef = useRef(onScrolled); onScrolledRef.current = onScrolled;
  useEffect(() => {
    if (!scrollTo) return;
    const el = refs.current.get(scrollTo);
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); onScrolledRef.current(); }
  });
  const last = conv.turns.length - 1;
  return (
    <ol className="space-y-8" data-testid="list-conversation-turns">
      {conv.turns.map((turn, i) => {
        const shown = turn.revisions.find(r => r.id === selectedId) ?? turn.latest;
        const isLast = i === last;
        return (
          <li key={turn.id} ref={el => { if (el) refs.current.set(turn.id, el); else refs.current.delete(turn.id); }} className="scroll-mt-20 space-y-3" data-testid={`turn-${turn.id}`}>
            {turn.seed && shown.kind === "ideas" ? (
              <button onClick={() => onOpenSet(shown.id)} className="sx-card lift ev-focus flex w-full items-center gap-3 p-4 text-left" data-testid={`button-seed-set-${shown.id}`}>
                <Lightbulb className="h-4 w-4 shrink-0 text-[hsl(var(--turmeric))]" />
                <span className="min-w-0 flex-1"><span className="sx-eyebrow block">Started from five ideas</span><span className="sx-title block truncate text-lg">{shown.title}</span></span>
                <ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground" />
              </button>
            ) : (
              <>
                {turn.prompt && !turn.seed && <YouSaid text={turn.prompt} turnId={turn.id} />}
                {turn.seed && <p className="sx-eyebrow">Started from {KIND_LABEL[shown.kind]?.toLowerCase() ?? shown.kind}</p>}
                {isLast || shown.id === selectedId && shown.id !== turn.latest.id
                  ? <ItemWorkspace key={shown.id} item={shown} allItems={allItems} presentation="reading" onOpen={onOpen} onRetry={shown.status === "failed" ? () => onRetry(turn) : undefined} />
                  : <PastAnswer key={shown.id} item={shown} allItems={allItems} onOpen={onOpen} onRetry={shown.status === "failed" ? () => onRetry(turn) : undefined} />}
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}
