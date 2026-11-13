import { useQueryClient } from "@tanstack/react-query";
import { useFixStudioWording, getGetStudioItemQueryKey, getListStudioItemsQueryKey, type StudioItem } from "@workspace/api-client-react";
import { Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { friendlyError } from "@/lib/studio";
import { plagiarismOf } from "./plagiarism-report";

/** Shown only when this revision's plagiarism report is over the limit: rewrites just the matched sentences into a new revision. */
export function FixWordingButton({ item, disabled, onOpen }: { item: StudioItem; disabled?: boolean; onOpen: (id: string) => void }) {
  const report = plagiarismOf(item);
  const qc = useQueryClient();
  const { toast } = useToast();
  const fix = useFixStudioWording();
  if (item.status !== "completed" || !report || report.originalPercent >= report.target || !report.sources.length) return null;

  const run = async () => {
    try {
      const next = await fix.mutateAsync({ id: item.id });
      qc.setQueryData(getGetStudioItemQueryKey(next.id), next);
      void qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
      const r = plagiarismOf(next);
      const passed = !!r && r.originalPercent >= r.target;
      toast({
        title: `Saved revision ${next.revision}`,
        description: r ? `${r.similarityPercent.toFixed(1)}% shared wording after the rewrite${passed ? ". Export is unlocked." : ". Some wording still matches; see the plagiarism report."}` : "Matched wording rewritten.",
        variant: passed ? undefined : "destructive",
      });
      onOpen(next.id);
    } catch (e) { toast({ title: "Couldn't fix the matched wording", description: friendlyError(e), variant: "destructive" }); }
  };

  return (
    <button className="sx-btn sx-primary" disabled={disabled || fix.isPending} onClick={() => void run()}
      title={disabled ? "Save or discard your edits first" : "Rewrites only the sentences that match other sources, saves a new revision and checks it again. This revision stays unchanged."}
      data-testid="button-fix-wording">
      <Wand2 />{fix.isPending ? "Rewriting and re-checking…" : "Fix matched wording"}
    </button>
  );
}
