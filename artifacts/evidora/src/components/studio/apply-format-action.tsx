import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useApplyReviewedFormat, getListStudioItemsQueryKey, getGetStudioItemQueryKey, type StudioItem } from "@workspace/api-client-react";
import { FileOutput } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { friendlyError, isWorking } from "@/lib/studio";
import { requirementsCheckOf } from "./requirements-check";

const routeFor = (kind: string) => (kind === "thesis" ? "/thesis" : "/journals");

/** Creates (or reopens) a separate draft with the supported layout from the retrieved official instructions. */
export function ApplyFormatAction({ review, sourceKind }: { review: StudioItem; sourceKind?: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [err, setErr] = useState<string | null>(null);
  const apply = useApplyReviewedFormat();
  const rc = requirementsCheckOf(review);
  const m = (review.metadata ?? {}) as Record<string, unknown>;
  const existing = typeof m.currentDraftId === "string" ? m.currentDraftId : typeof m.formattedDraftId === "string" ? m.formattedDraftId : "";
  const eligible = review.status === "completed" && !isWorking(review.status) && rc?.status === "retrieved" && !!rc.appliedLayout && Object.keys(rc.appliedLayout).length > 0;
  if (!rc) return null;

  const run = async () => {
    setErr(null);
    try {
      const d = await apply.mutateAsync({ id: review.id });
      qc.setQueryData(getGetStudioItemQueryKey(d.id), d);
      void qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
      void qc.invalidateQueries({ queryKey: getGetStudioItemQueryKey(review.id) });
      toast({ title: existing ? "Opening formatted draft" : "Formatted copy created", description: "Your original document is unchanged." });
      setLocation(`${routeFor(d.kind || sourceKind || "journal")}?item=${d.id}`);
    } catch (e) {
      const msg = friendlyError(e); setErr(msg);
      toast({ title: "Couldn't create the formatted copy", description: msg, variant: "destructive" });
    }
  };

  const reason = review.status !== "completed" ? "Available once the review finishes."
    : rc.status !== "retrieved" ? "Needs official instructions retrieved from the source; none were available for this review."
    : "No supported layout settings were found in the official instructions.";

  return (
    <div className="mt-3 rounded-md border border-[hsl(90_14%_86%)] bg-[hsl(66_22%_96%)] p-3 text-xs" data-testid="panel-apply-format">
      <button className="sx-btn sx-primary" disabled={!eligible || apply.isPending} onClick={() => void run()} data-testid="button-apply-format">
        <FileOutput />{apply.isPending ? "Preparing copy..." : existing ? "Open formatted draft" : "Create formatted copy"}
      </button>
      <p className="mt-2 leading-relaxed text-muted-foreground">
        {eligible
          ? "Saves a separate draft with only the supported page layout listed above. Your original stays untouched. Requirements marked as needing your action or checking by hand still need your edits."
          : reason}
      </p>
      {err && <p className="mt-1 text-[hsl(var(--vermilion))]" role="alert" data-testid="text-apply-format-error">{err}</p>}
    </div>
  );
}
