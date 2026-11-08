import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSaveStudioItem, getListStudioItemsQueryKey, getGetStudioItemQueryKey, type StudioItem } from "@workspace/api-client-react";
import { Check, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { friendlyError, type IdeaCard } from "@/lib/studio";

export function ideaProse(idea: IdeaCard) {
  return `## Research problem\n\n${idea.problem}\n\n## Research question\n\n${idea.question}\n\n## Proposed method\n\n${idea.method}\n\n## Feasibility\n\n${idea.feasibility}`;
}

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  set: StudioItem;
  ideas: IdeaCard[];
  confirmed: StudioItem[];
  onOpenIdea: (id: string) => void;
};

export function IdeaPicker({ open, onOpenChange, set, ideas, confirmed, onOpenIdea }: Props) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const save = useSaveStudioItem();
  const [index, setIndex] = useState(0);
  useEffect(() => { if (open) setIndex(0); }, [open, set.id]);
  const idea = ideas[index];
  if (!idea) return null;
  const saved = confirmed.find(c => c.title.trim().toLowerCase() === idea.title.trim().toLowerCase());

  const confirm = async () => {
    try {
      const item = await save.mutateAsync({ data: { projectId: set.projectId, kind: "idea", title: idea.title.slice(0, 300), content: `# ${idea.title}\n\n${ideaProse(idea)}` } });
      qc.setQueryData(getGetStudioItemQueryKey(item.id), item);
      await qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
      toast({ title: "Idea confirmed", description: `"${idea.title}" is saved to your project.` });
    } catch (e) { toast({ title: "Couldn't save idea", description: friendlyError(e), variant: "destructive" }); }
  };

  const rows: [string, string][] = [["Problem", idea.problem], ["Question", idea.question], ["Method", idea.method], ["Feasibility", idea.feasibility]];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden border-0 p-0 sm:rounded-2xl">
        <div className={`sx-idea sx-idea-${index % 5} p-7`} data-testid={`card-idea-${index}`}>
          <DialogHeader className="text-left">
            <p className="tone font-mono text-[11px] uppercase tracking-[0.16em]">Idea {index + 1} of {ideas.length}</p>
            <DialogTitle className="sx-title text-3xl leading-tight">{idea.title}</DialogTitle>
            <DialogDescription className="sr-only">Review this research idea and confirm it if you want to keep it.</DialogDescription>
          </DialogHeader>
          <dl className="mt-5 space-y-3.5">
            {rows.map(([k, v]) => <div key={k}><dt className="tone font-mono text-[10.5px] uppercase tracking-[0.14em]">{k}</dt><dd className="mt-0.5 text-[15px] leading-relaxed">{v}</dd></div>)}
          </dl>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t bg-[hsl(66_20%_95%)] px-5 py-3.5">
          <button className="sx-btn" disabled={index === 0} onClick={() => setIndex(i => i - 1)} data-testid="button-idea-prev"><ChevronLeft />Prev</button>
          <div className="flex gap-1.5 px-1" aria-hidden>{ideas.map((_, i) => <span key={i} className={`h-2 w-2 rounded-full transition-transform ${i === index ? "scale-125 bg-[hsl(var(--teal))]" : "bg-[hsl(var(--teal)/0.25)]"}`} />)}</div>
          <button className="sx-btn" disabled={index >= ideas.length - 1} onClick={() => setIndex(i => i + 1)} data-testid="button-idea-next">Next<ChevronRight /></button>
          <div className="ml-auto flex gap-2">
            {saved
              ? <><span className="sx-chip ok" data-testid="status-idea-confirmed"><Check className="h-3 w-3" />Confirmed</span><button className="sx-btn" onClick={() => { onOpenChange(false); onOpenIdea(saved.id); }} data-testid="button-idea-open"><ExternalLink />Open</button></>
              : <button className="sx-btn sx-primary" disabled={save.isPending} onClick={() => void confirm()} data-testid="button-idea-confirm"><Check />{save.isPending ? "Saving..." : "Confirm this idea"}</button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
