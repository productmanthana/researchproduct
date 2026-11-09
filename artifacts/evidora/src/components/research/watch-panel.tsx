import { useEffect, useId, useRef, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useSaveResearchWatch, useDeleteResearchWatch, useCheckResearchWatch, type ResearchWatch } from "@workspace/api-client-react";
import { BellRing, Info, Pause, Play, RefreshCw, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUnsavedGuard } from "@/lib/unsaved";
import { friendlyError } from "@/lib/studio";
import { AgentProgressChip, useAgentJob } from "@/components/agent-progress/provider";
import { watchWorkflow } from "@/lib/agent-workflow";
import { fmtDate, invalidateWatchData, isActive, STATUS_LABEL } from "@/lib/research-watch";

type Props = {
  projectId: string;
  projectName: string;
  watch: ResearchWatch | undefined;
  /** Proposed topic from the selected saved item or project details. Never saved without the user pressing save. */
  proposal: string;
  proposalSource: string;
  compact?: boolean;
};

export function WatchStatus({ watch }: { watch: ResearchWatch }) {
  const active = isActive(watch);
  const tone = !watch.enabled || watch.status === "paused" ? "" : active || watch.status === "partial" ? "warn" : watch.status === "error" ? "bad" : "ok";
  return <span className={`sx-chip ${tone}`} data-testid={`status-watch-${watch.projectId}`}>
    {active && <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-current" />}
    {!watch.enabled ? "Paused" : STATUS_LABEL[watch.status] ?? watch.status}
  </span>;
}

export function WatchPanel({ projectId, projectName, watch, proposal, proposalSource, compact }: Props) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const save = useSaveResearchWatch();
  const del = useDeleteResearchWatch();
  const check = useCheckResearchWatch();
  const [topic, setTopic] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [patents, setPatents] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [open, setOpen] = useState(!compact);
  const job = watch && isActive(watch) ? watchWorkflow({ projectId, status: watch.status, patents: watch.patents, topic: watch.topic }) : null;
  useAgentJob(job);
  const initFor = useRef<string | null>(null);

  // Initialise once per project + watch existence; never reset in-progress edits on background refetch.
  const key = `${projectId}:${watch ? "w" : "new"}`;
  useEffect(() => {
    if (initFor.current === key) return;
    initFor.current = key;
    setTopic(watch?.topic ?? proposal);
    setEnabled(watch?.enabled ?? true);
    setPatents(watch?.patents ?? false);
  }, [key, watch, proposal]);

  const guardId = useId();
  const dirty = watch ? topic !== watch.topic || enabled !== watch.enabled || patents !== watch.patents : topic.trim() !== proposal.trim() && topic.trim().length > 0;
  // One registration per mounted panel (useId), so two panels on the same project never clear each other's state.
  useUnsavedGuard(`watch-${projectId}-${guardId}`, dirty, "Research watch edits are not saved.");
  const valid = topic.trim().length >= 5 && topic.trim().length <= 2000;
  const busy = save.isPending || del.isPending || check.isPending;

  const persist = async (next?: Partial<{ enabled: boolean }>) => {
    const data = { topic: topic.trim(), enabled: next?.enabled ?? enabled, patents };
    try {
      await save.mutateAsync({ projectId, data });
      if (next?.enabled !== undefined) setEnabled(next.enabled);
      await invalidateWatchData(qc);
      toast({ title: watch ? (next?.enabled === false ? "Watch paused" : next?.enabled ? "Watch resumed" : "Watch updated") : "Watching for new research", description: watch ? undefined : "The first check runs on the server. New matches appear in the bell." });
    } catch (e) { toast({ title: "Couldn't save the watch", description: friendlyError(e), variant: "destructive" }); }
  };
  const runCheck = async () => {
    try { await check.mutateAsync({ projectId }); await invalidateWatchData(qc); toast({ title: "Check started", description: "Results land in Research updates when it finishes." }); }
    catch (e) { toast({ title: "Couldn't start a check", description: friendlyError(e), variant: "destructive" }); }
  };
  const remove = async () => {
    try { await del.mutateAsync({ projectId }); initFor.current = null; setTopic(proposal); await invalidateWatchData(qc); toast({ title: "Watch deleted", description: `${projectName} is no longer watched.` }); }
    catch (e) { toast({ title: "Couldn't delete the watch", description: friendlyError(e), variant: "destructive" }); }
  };

  if (compact && !open) {
    return (
      <div className="sx-card flex flex-wrap items-center gap-3 p-4" data-testid={`panel-watch-compact-${projectId}`}>
        <BellRing className="h-4 w-4 text-[hsl(var(--teal))]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{!watch ? "Watch for new research on this" : watch.enabled ? "This project is watched for new research" : "This project's watch is paused"}</p>
          <p className="truncate text-xs text-muted-foreground">{watch ? watch.topic : "Get an in-app note when new papers related to this appear."}</p>
        </div>
        {watch && <WatchStatus watch={watch} />}
        <button className="sx-btn" onClick={() => setOpen(true)} data-testid={`button-open-watch-${projectId}`}>{watch ? "Manage" : "Set up"}</button>
      </div>
    );
  }

  return (
    <section className="sx-card rise overflow-hidden" data-testid={`panel-watch-${projectId}`}>
      {job && <div className="border-b px-5 py-3"><AgentProgressChip jobKey={job.key} /></div>}
      <div className="flex flex-wrap items-start gap-3 border-b px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="sx-eyebrow">Research watch &middot; {projectName}</p>
          <p className="sx-title mt-1 text-xl">{watch ? "What we look out for" : "Start a watch"}</p>
        </div>
        {watch && <WatchStatus watch={watch} />}
        {compact && <button className="sx-btn" onClick={() => setOpen(false)} data-testid={`button-collapse-watch-${projectId}`}>Close</button>}
      </div>
      <div className="space-y-4 p-5">
        {!watch && <p className="flex gap-2 rounded-md bg-[hsl(var(--turmeric)/0.14)] p-3 text-[13px]" data-testid="text-watch-proposal"><Info className="mt-0.5 h-4 w-4 shrink-0" />Proposed from {proposalSource}. Read it, reword it in plain language, then save. Nothing is watched until you do.</p>}
        {watch && proposal && proposal !== topic && <button className="text-xs text-[hsl(var(--teal))] underline" onClick={() => setTopic(proposal)} data-testid="button-use-proposal">Use a topic drawn from {proposalSource} instead</button>}
        <label className="block">
          <span className="text-[13px] font-medium">Topic, in your own words</span>
          <textarea className="sx-input mt-1.5 min-h-[96px]" value={topic} maxLength={2000} onChange={e => setTopic(e.target.value)} placeholder="e.g. Low-cost arsenic test kits used by village health workers" data-testid={`input-watch-topic-${projectId}`} />
          <span className={`mt-1 block text-right font-mono text-[10.5px] ${valid ? "text-muted-foreground" : "text-vermilion"}`}>{topic.trim().length < 5 ? "at least 5 characters" : `${topic.trim().length}/2000`}</span>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <span><span className="block text-[13px] font-medium">Check daily</span><span className="text-xs text-muted-foreground">Off pauses the watch; nothing is lost.</span></span>
            <Switch checked={enabled} onCheckedChange={setEnabled} data-testid={`switch-watch-enabled-${projectId}`} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <span><span className="block text-[13px] font-medium">Include patents when available</span><span className="text-xs text-muted-foreground">Patent sources may be unavailable; see notices.</span></span>
            <Switch checked={patents} onCheckedChange={setPatents} data-testid={`switch-watch-patents-${projectId}`} />
          </label>
        </div>
        {watch && (
          <dl className="grid gap-px overflow-hidden rounded-lg border bg-[hsl(90_14%_84%)] text-sm sm:grid-cols-3" data-testid={`dates-watch-${projectId}`}>
            {([["Last check", fmtDate(watch.lastCheckedAt, true)], ["Last completed check", fmtDate(watch.lastSuccessfulAt, true)], ["Next check", watch.enabled ? fmtDate(watch.nextCheckAt, true) : "paused"]] as const).map(([k, v]) => (
              <div key={k} className="bg-[hsl(52_40%_98%)] p-3"><dt className="sx-eyebrow">{k}</dt><dd className="mt-0.5 font-mono text-[12.5px]">{v}</dd></div>
            ))}
          </dl>
        )}
        {watch && watch.notices.length > 0 && (
          <ul className="space-y-1.5" data-testid={`list-watch-notices-${projectId}`}>
            {watch.notices.map(n => <li key={n} className="flex gap-2 rounded-md border border-[hsl(var(--turmeric)/0.6)] bg-[hsl(var(--turmeric)/0.1)] p-2.5 text-[13px]"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />{n}</li>)}
          </ul>
        )}
        {watch?.status === "partial" && <p className="text-xs text-muted-foreground">The last completed check had partial coverage: some sources did not respond. See notices above.</p>}
        <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground" data-testid="text-watch-terms">
          <li>Checks run about once a day while the Evidora server is running and catch up after a restart. A manual check is allowed once per hour per project.</li>
          <li>Up to 10 active watches per account. Each check is a bounded search, not an exhaustive one.</li>
          <li>Keywords from your saved topic are sent to scholarly search providers. Your project context is sent to OpenAI to judge how each result relates. Matching uses titles and abstracts only, not full texts.</li>
          <li>Updates appear in the bell inside Evidora only. Email alerts are not enabled.</li>
        </ul>
        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          {watch ? <>
            <button className="sx-btn" disabled={busy || !watch.enabled || isActive(watch)} onClick={() => void runCheck()} data-testid={`button-check-watch-${projectId}`}><RefreshCw className={check.isPending ? "animate-spin" : ""} />{isActive(watch) ? "Checking..." : "Check now"}</button>
            <button className="sx-btn" disabled={busy || dirty || !valid} onClick={() => void persist({ enabled: !watch.enabled })} data-testid={`button-toggle-watch-${projectId}`}>{watch.enabled ? <><Pause />Pause</> : <><Play />Resume</>}</button>
            <button className="sx-btn sx-danger" disabled={busy} onClick={() => setConfirmDelete(true)} data-testid={`button-delete-watch-${projectId}`}><Trash2 />Delete</button>
            <button className="sx-btn sx-primary ml-auto" disabled={busy || !dirty || !valid} onClick={() => void persist()} data-testid={`button-save-watch-${projectId}`}>{save.isPending ? "Saving..." : "Save changes"}</button>
          </> : <>
            <Link href="/research-updates" className="text-xs text-muted-foreground underline" data-testid="link-all-watches">All watches</Link>
            <button className="sx-btn sx-primary ml-auto" disabled={busy || !valid} onClick={() => void persist()} data-testid={`button-create-watch-${projectId}`}><BellRing />{save.isPending ? "Saving..." : "Save and start watching"}</button>
          </>}
        </div>
      </div>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete the watch for {projectName}?</AlertDialogTitle>
            <AlertDialogDescription>Daily checks stop and this project's alert history is deleted, including any updates you have not saved. Source notes you already saved to the project stay in My Library.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-watch">Keep watching</AlertDialogCancel>
            <AlertDialogAction onClick={() => void remove()} className="bg-[hsl(var(--vermilion))]" data-testid="button-confirm-delete-watch">Delete watch</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
