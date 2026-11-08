import { useState } from "react";
import { useCheckStudioDocument } from "@workspace/api-client-react";
import { ScanSearch, ShieldCheck } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { ErrorState } from "@/components/states";
import { StudioHeader } from "@/components/studio/studio-page";
import { NeedsProject } from "@/components/studio/project-switcher";
import { CheckResult } from "@/components/studio/check-panel";
import { useProjectItems } from "@/components/studio/use-studio";
import { useActiveProject } from "@/lib/active-project";
import { friendlyError, KIND_LABEL, latestItems } from "@/lib/studio";

function Inner() {
  const { project } = useActiveProject();
  const items = useProjectItems(project?.id);
  const check = useCheckStudioDocument();
  const [id, setId] = useState("");
  const header = <StudioHeader kicker="Originality" title="Check your draft against your own project." intro="A limited similarity check: it compares a saved draft with the other papers, notes and drafts in this project and flags writing issues. It does not search the web or journal databases, and it is not an AI-authorship detector." />;
  if (!project) return <>{header}<NeedsProject what="Originality checking" /></>;
  const choices = latestItems((items.data ?? []).filter(i => i.status === "completed" && i.content.trim()));
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
          <p className="text-xs text-muted-foreground">No percentage score is shown, because a project-only comparison cannot support one.</p>
        </div>
        <div className="min-w-0">
          {check.isError && <ErrorState error={{ message: friendlyError(check.error) }} title="Check failed" onRetry={() => check.mutate({ id })} />}
          {check.data ? <div className="sx-card rise p-6"><CheckResult result={check.data} /></div>
            : !check.isError && <div className="sx-card grid-paper flex min-h-[340px] flex-col items-center justify-center p-10 text-center"><ScanSearch className="h-11 w-11 text-[hsl(var(--teal))] opacity-70" strokeWidth={1.2} /><p className="sx-title mt-4 text-2xl">{check.isPending ? "Reading your project..." : "Pick a draft to begin"}</p>{check.isPending && <div className="sx-progress mt-4 w-48" />}</div>}
        </div>
      </div>
    </>
  );
}

export default function Originality() { return <RequireAuth what="originality checks"><Inner /></RequireAuth>; }
