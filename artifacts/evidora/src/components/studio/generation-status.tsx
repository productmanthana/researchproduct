import { useState } from "react";
import type { StudioItem } from "@workspace/api-client-react";
import { ResearchTrace, traceOf } from "./research-trace";
import { AlertTriangle, RotateCw } from "lucide-react";
import { getGetStudioItemQueryKey, getListStudioItemsQueryKey } from "@workspace/api-client-react";
import { LiveDraft } from "@/components/live-draft";
import { AgentProgressChip, useAgentJob } from "@/components/agent-progress/provider";
import { studioWorkflow } from "@/lib/agent-workflow";

/** Honest progress: reflects only the server-reported status, no simulated steps. Stage detail lives in the shared popup. */
/** `inline`: stream inside the page without registering the shared progress popup. */
export function GenerationStatus({ item, onRetry, inline = false }: { item: StudioItem; onRetry?: () => void; inline?: boolean }) {
  const working = item.status === "queued" || item.status === "running";
  const [section, setSection] = useState<string | null>(null);
  const job = working ? studioWorkflow(item) : null;
  // The inline research trace shows progress on the page, so the shared window stays in the background.
  useAgentJob(inline || !job ? null : { ...job, quiet: true });
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
  const trace = traceOf(item.metadata);
  return (
    <div className="sx-card p-5" data-testid="status-generation-running">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="sx-eyebrow">{queued ? "Waiting in queue" : "Working"} · {job?.workflow}</p>
          <p className="sx-title mt-1 text-lg">{item.title}</p>
        </div>
        {job && !inline && <AgentProgressChip jobKey={job.key} />}
      </div>
      {trace && <div className="mt-4"><ResearchTrace trace={trace} working liveDetail={section} /></div>}
      <div className="mt-4"><LiveDraft kind="studio" id={item.id} working onSection={setSection} invalidate={[getGetStudioItemQueryKey(item.id), getListStudioItemsQueryKey()]} progressKey={inline ? undefined : job?.key} fallback={
        <p className="text-sm text-muted-foreground">
          {queued ? "Your request is saved and waiting for a writer slot." : "The server is drafting from your evidence. Text appears here as soon as it is written."}
          {" "}You can leave this page; the result is saved to your project automatically.
        </p>} /></div>
    </div>
  );
}
