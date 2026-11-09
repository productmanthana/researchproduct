import type { StudioItem } from "@workspace/api-client-react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { getGetStudioItemQueryKey, getListStudioItemsQueryKey } from "@workspace/api-client-react";
import { LiveDraft } from "@/components/live-draft";
import { AgentProgressChip, useAgentJob } from "@/components/agent-progress/provider";
import { studioWorkflow } from "@/lib/agent-workflow";

/** Honest progress: reflects only the server-reported status, no simulated steps. Stage detail lives in the shared popup. */
export function GenerationStatus({ item, onRetry }: { item: StudioItem; onRetry?: () => void }) {
  const working = item.status === "queued" || item.status === "running";
  const job = working ? studioWorkflow(item) : null;
  useAgentJob(job);
  if (item.status === "failed")
    return (
      <div className="sx-card border-[hsl(var(--vermilion)/0.35)] p-5" data-testid="status-generation-failed">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-vermilion" />
          <div className="flex-1">
            <p className="font-medium">Generation did not finish</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.error || "The server reported a failure without details."}</p>
          </div>
          {onRetry && <button className="sx-btn" onClick={onRetry} data-testid="button-generation-retry"><RotateCw />Try again</button>}
        </div>
      </div>
    );
  const queued = item.status === "queued";
  return (
    <div className="sx-card p-6" data-testid="status-generation-running">
      <p className="sx-eyebrow">{queued ? "Waiting in queue" : "Working"} · {job?.workflow}</p>
      <p className="sx-title mt-1 text-xl">{item.title}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {queued ? "Your request is saved and waiting for a writer slot." : "The server is drafting from your evidence. This usually takes under a minute or two."}
        {" "}You can leave this page; the result is saved to your project automatically.
      </p>
      {job && <div className="mt-4"><AgentProgressChip jobKey={job.key} /></div>}
      <div className="mt-4"><LiveDraft kind="studio" id={item.id} working invalidate={[getGetStudioItemQueryKey(item.id), getListStudioItemsQueryKey()]} fallback={null} progressKey={job?.key} /></div>
    </div>
  );
}
