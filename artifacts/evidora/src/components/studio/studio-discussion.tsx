import { useMemo, useState, type ReactNode } from "react";
import { useGenerateStudioDocument, getGetStudioItemQueryKey, getListStudioItemsQueryKey, type StudioItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { friendlyError } from "@/lib/studio";
import { buildConversations, conversationBusy, conversationFor, followUpParent, requestParent, requestPrompt, type Turn } from "@/lib/conversation";
import { Composer } from "./composer";
import { ConversationView } from "./conversation-view";
import { ItemWorkspace } from "./item-workspace";

/** One persisted document/chat ancestry, shared by every project workspace. */
export function StudioDiscussion({ item, allItems, onOpen, hideDocument = false, attachSlot }: {
  item: StudioItem; allItems: StudioItem[]; onOpen: (id: string | null) => void; hideDocument?: boolean; attachSlot?: ReactNode;
}) {
  const [scrollTo, setScrollTo] = useState<string | null>(null);
  const retry = useGenerateStudioDocument();
  const qc = useQueryClient();
  const { toast } = useToast();
  const merged = useMemo(() => [...allItems.filter(i => i.projectId === item.projectId && i.id !== item.id), item], [allItems, item]);
  const conv = useMemo(() => conversationFor(buildConversations(merged, item.projectId), item.id), [merged, item]);
  const parent = conv ? followUpParent(conv) : item.status === "completed" ? item.id : null;
  const busy = conv ? conversationBusy(conv) : item.status === "queued" || item.status === "running";
  const visible = conv && hideDocument ? { ...conv, turns: conv.turns.slice(1) } : conv;
  const retryTurn = async (turn: Turn<StudioItem>) => {
    if (busy || retry.isPending) return;
    const first = turn.revisions[0], prompt = requestPrompt(first);
    if (!prompt || first.kind !== "answer") {
      toast({ title: "Cannot retry this saved draft", description: "Open the draft's page to start a new generation.", variant: "destructive" });
      return;
    }
    const request = (first.metadata as { request?: { evidenceMode?: string; includePatents?: boolean } } | null)?.request ?? {};
    try {
      const created = await retry.mutateAsync({ data: { projectId: item.projectId, kind: "answer", prompt,
        parentId: requestParent(first) ?? first.id,
        evidenceMode: request.evidenceMode === "discover" ? "discover" : request.evidenceMode === "combined" ? "combined" : "project",
        includePatents: request.includePatents !== false } });
      qc.setQueryData(getGetStudioItemQueryKey(created.id), created);
      void qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
      setScrollTo(created.id); onOpen(created.id);
    } catch (error) { toast({ title: "Couldn't retry", description: friendlyError(error), variant: "destructive" }); }
  };
  return (
    <div className="min-w-0 space-y-5" data-testid="studio-discussion">
      {visible && visible.turns.length > (hideDocument ? 0 : 1)
        ? <ConversationView conv={visible} selectedId={item.id} allItems={merged}
            onOpen={onOpen} onOpenSet={onOpen} onRetry={turn => void retryTurn(turn)}
            scrollTo={scrollTo} onScrolled={() => setScrollTo(null)} />
        : !hideDocument && <ItemWorkspace item={item} allItems={merged} onOpen={onOpen} presentation="reading" />}
      {(parent || busy) && <section className="sticky bottom-3 z-10 pt-2" aria-label="Follow up about this work">
        <Composer key={`discussion-${conv?.rootId ?? item.id}`} compact
          parentId={parent ?? undefined} projectId={item.projectId} kind="answer" defaultMode="project"
          label="Ask a follow-up about this work" cta="Ask" attachSlot={attachSlot}
          placeholder="Ask a follow-up. Your draft and earlier questions stay in context."
          disabled={busy || retry.isPending || !parent} disabledNote={busy ? "Wait for the current response to finish" : "No completed context yet"}
          onCreated={created => { setScrollTo(created.id); onOpen(created.id); }} />
      </section>}
    </div>
  );
}
