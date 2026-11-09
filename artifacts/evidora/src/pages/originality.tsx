import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCheckStudioDocument, getListStudioItemsQueryKey } from "@workspace/api-client-react";
import { StudioDiscussion } from "@/components/studio/studio-discussion";
import { confirmLeave } from "@/lib/unsaved";
import { useItemParam } from "@/components/studio/use-item-param";
import { FolderOpen, ScanSearch, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { ProjectAttachMenu } from "@/components/studio/project-attach";
import { HistoryDrawer, WorkspaceBar, WorkspaceIntro } from "@/components/studio/workspace-shell";
import { ItemList } from "@/components/studio/item-list";
import { AttachDocuments } from "@/components/studio/attach-documents";
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
  const qc = useQueryClient();
  const { id: selectedId, setId } = useItemParam();
  const id = selectedId ?? "";
  const [discussionId, setDiscussionId] = useState<string | null>(null);
  const pendingItem = check.isPending ? (items.data ?? []).find(i => i.id === check.variables?.id) : undefined;
  const job = check.isPending ? originalityWorkflow(check.variables?.id ?? id, pendingItem?.title ?? "Selected draft") : null;
  useAgentJob(job);
  const [drawer, setDrawer] = useState(false);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const intro = "Free, bounded screening: compares a saved draft with the other papers, notes and drafts in this project and flags writing issues. It does not search the web or journal databases and is not an AI-authorship detector.";
  if (!project) return <><StudioHeader kicker="Originality" title="Check your draft against your own project." intro={intro} /><NeedsProject what="Originality checking" /></>;
  const all = items.data ?? [];
  const choices = latestItems(all.filter(i => i.status === "completed" && i.content.trim()));
  const chosen = choices.find(i => i.id === id);
  const result = chosen ? check.data ?? savedReviewOf(chosen) : null;
  const pick = (next: string) => { if (!confirmLeave()) return; setId(next); setDiscussionId(null); check.reset(); };
  const run = () => {
    if (!id || check.isPending || attachmentBusy) return;
    check.mutate({ id }, { onSuccess: () => void qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() }) });
  };
  return (
    <div className="mx-auto max-w-[900px] pb-6">
      {chosen
        ? <WorkspaceBar newLabel="Check another draft" onNew={() => pick("")} label={`Originality · ${chosen.title}`} onHistory={() => setDrawer(true)} projectName={project.name} />
        : <WorkspaceIntro kicker="Originality" title="Check a draft against your own project." sub={intro} projectName={project.name} onHistory={() => setDrawer(true)} />}
      <section className="sx-card sx-composer-wide overflow-hidden" aria-label="Draft to check" data-testid="composer-originality">
        <div className="p-4">
          <label htmlFor="select-check-item" className="sx-eyebrow">Draft to check</label>
          {items.isError && <ErrorState error={items.error} onRetry={() => void items.refetch()} />}
          <select id="select-check-item" className="sx-input mt-1.5" value={id} onChange={e => pick(e.target.value)} disabled={items.isLoading} data-testid="select-check-item">
            <option value="">{items.isLoading ? "Loading..." : choices.length ? "Choose a saved item" : "No saved drafts yet"}</option>
            {choices.map(i => <option key={i.id} value={i.id}>{KIND_LABEL[i.kind] ?? i.kind}: {i.title} (rev {i.revision})</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-[hsl(90_14%_86%)] bg-[hsl(66_22%_95%)] px-4 py-3">
          <ProjectAttachMenu projectId={project.id} items={all} onBusyChange={setAttachmentBusy} />
          <button className="sx-btn sx-primary" disabled={!id || check.isPending || attachmentBusy} onClick={run} data-testid="button-check-originality"><ShieldCheck />{check.isPending ? "Checking..." : attachmentBusy ? "Preparing document..." : "Run project check"}</button>
          <span className="min-w-0 flex-1 text-xs text-muted-foreground">Project scope only. Attached files join the comparison set. The shared-wording figure is not a global originality percentage, web-wide plagiarism score or AI-authorship verdict.</span>
        </div>
      </section>
      <div className="mt-5 min-w-0 space-y-5" aria-live="polite">
        {check.isError && <ErrorState error={{ message: friendlyError(check.error) }} title="Check failed" onRetry={run} />}
        {result ? <div className="sx-card rise p-6"><CheckResult key={`${id}:${result.checkedAt ?? ""}`} result={result} missing={chosen ? missingRequirements(chosen.kind, chosen.title, detailsOf(chosen)) : []} save={chosen ? { projectId: project.id, draftTitle: chosen.title } : undefined} /></div>
          : !check.isError && <div className="flex items-center gap-4 rounded-lg border border-dashed border-[hsl(110_14%_78%)] px-4 py-3" data-testid="status-originality-empty"><ScanSearch className="h-6 w-6 shrink-0 text-[hsl(var(--teal))]" strokeWidth={1.4} /><div className="min-w-0 flex-1"><p className="text-[13px] text-muted-foreground"><span className="font-medium text-[hsl(var(--ink-teal))]">{check.isPending ? "Reading your project..." : chosen ? "Ready to check." : "Pick a draft to begin."}</span> Results open here; you can then discuss them in follow-ups.</p>{job && <div className="mt-3"><AgentProgressChip jobKey={job.key} /></div>}</div></div>}
        {chosen && chosen.status === "completed" && <StudioDiscussion item={all.find(i => i.id === discussionId) ?? chosen} allItems={all} onOpen={setDiscussionId} hideDocument />}
      </div>
      <HistoryDrawer open={drawer} onOpenChange={setDrawer} description={`Saved drafts in ${project.name}. Opening one selects it for checking.`}>
        <ItemList items={choices} kinds={Object.keys(KIND_LABEL)} activeId={id || null} loading={items.isLoading} onOpen={x => { setDrawer(false); pick(x); }} emptyText="No saved drafts yet." />
        <AttachDocuments projectId={project.id} items={all} variant="compact" />
        <Link href="/my-library" className="sx-btn w-full" data-testid="link-project-library-drawer"><FolderOpen />Open {project.name} library</Link>
      </HistoryDrawer>
    </div>
  );
}

export default function Originality() { return <RequireAuth what="originality checks"><Inner /></RequireAuth>; }
