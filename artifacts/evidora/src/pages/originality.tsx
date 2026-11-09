import { useState } from "react";
import { useCheckStudioDocument } from "@workspace/api-client-react";
import { ScanSearch, ShieldCheck } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { ErrorState } from "@/components/states";
import { StudioHeader } from "@/components/studio/studio-page";
import { NeedsProject } from "@/components/studio/project-switcher";
import { CheckResult, savedReviewOf } from "@/components/studio/check-panel";
import { useProjectItems } from "@/components/studio/use-studio";
import { useActiveProject } from "@/lib/active-project";
import { AgentProgressChip, useAgentJob } from "@/components/agent-progress/provider";
import { originalityWorkflow } from "@/lib/agent-workflow";
import { detailsOf, friendlyError, KIND_LABEL, latestItems, missingRequirements } from "@/lib/studio";

function Inner() {
  const { project } = useActiveProject();
  const items = useProjectItems(project?.id);
  const check = useCheckStudioDocument();
  const [id, setId] = useState("");
  const pendingItem = check.isPending ? (items.data ?? []).find(i => i.id === check.variables?.id) : undefined;
  const job = check.isPending ? originalityWorkflow(check.variables?.id ?? id, pendingItem?.title ?? "Selected draft") : null;
  useAgentJob(job);
  const header = <StudioHeader kicker="Originality" title="Check your draft against your own project." intro="A limited similarity check: it compares a saved draft with the other papers, notes and drafts in this project and flags writing issues. It does not search the web or journal databases, and it is not an AI-authorship detector. This is free project screening; web-wide comparison is done by licensed similarity providers and is outside its scope." />;
  if (!project) return <>{header}<NeedsProject what="Originality checking" /></>;
  const choices = latestItems((items.data ?? []).filter(i => i.status === "completed" && i.content.trim()));
  const chosen = choices.find(i => i.id === id);
  const result = check.data ?? (chosen ? savedReviewOf(chosen) : null);
  return (
    <>
      {header}
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="sx-card h-fit space-y-3 p-4">
          <p className="sx-eyebrow">Draft to check</p>
          {items.isError && <ErrorState error={items.error} onRetry={() => void items.refetch()} />}
          <select className="sx-input" value={id} onChange={e => { setId(e.target.value); check.reset(); }} disabled={items.isLoading} data-testid="select-check-item">
            <option value="">{items.isLoading ? "Loading..." : choices.length ? "Choose a saved item" : "No saved drafts yet"}</option>
            {choices.map(i => <option key={i.id} value={i.id}>{KIND_LABEL[i.kind] ?? i.kind}: {i.title} (rev {i.revision})</option>)}
          </select>
          <button className="sx-btn sx-primary w-full" disabled={!id || check.isPending} onClick={() => check.mutate({ id })} data-testid="button-check-originality"><ShieldCheck />{check.isPending ? "Checking..." : "Run project check"}</button>
          <p className="text-xs text-muted-foreground">The shared-wording figure only covers sources inside this project. It is not a global originality percentage, a web-wide plagiarism score or an AI-authorship verdict.</p>
        </div>
        <div className="min-w-0">
          {check.isError && <ErrorState error={{ message: friendlyError(check.error) }} title="Check failed" onRetry={() => check.mutate({ id })} />}
          {result ? <div className="sx-card rise p-6"><CheckResult key={`${id}:${result.checkedAt ?? ""}`} result={result} missing={chosen ? missingRequirements(chosen.kind, chosen.title, detailsOf(chosen)) : []} save={chosen ? { projectId: project.id, draftTitle: chosen.title } : undefined} /></div>
            : !check.isError && <div className="sx-card grid-paper flex min-h-[340px] flex-col items-center justify-center p-10 text-center"><ScanSearch className="h-11 w-11 text-[hsl(var(--teal))] opacity-70" strokeWidth={1.2} /><p className="sx-title mt-4 text-2xl">{check.isPending ? "Reading your project..." : "Pick a draft to begin"}</p>{job && <div className="mt-5 w-full max-w-md"><AgentProgressChip jobKey={job.key} /></div>}</div>}
        </div>
      </div>
    </>
  );
}

export default function Originality() { return <RequireAuth what="originality checks"><Inner /></RequireAuth>; }
