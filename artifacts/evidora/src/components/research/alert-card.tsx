import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useSaveResearchAlert, useUpdateResearchAlert, type ResearchAlert } from "@workspace/api-client-react";
import { BookOpenText, BookmarkPlus, Check, Columns2, ExternalLink, EyeOff } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useActiveProject } from "@/lib/active-project";
import { friendlyError } from "@/lib/studio";
import { fmtDate, invalidateWatchData, type AlertExtras } from "@/lib/research-watch";

export function AlertCard({ alert, currentTopic }: { alert: ResearchAlert; currentTopic?: string }) {
  const extras = alert as ResearchAlert & AlertExtras;
  const watchedTopic = extras.watchedTopic || undefined;
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { select } = useActiveProject();
  const update = useUpdateResearchAlert();
  const saveAlert = useSaveResearchAlert();
  const [compare, setCompare] = useState(false);
  const [confirmLit, setConfirmLit] = useState(false);
  const [gone, setGone] = useState(false);

  const patch = async (data: { read?: boolean; dismissed?: boolean }, msg?: string) => {
    if (data.dismissed) setGone(true);
    try { await update.mutateAsync({ id: alert.id, data }); await invalidateWatchData(qc); if (msg) toast({ title: msg }); }
    catch (e) { setGone(false); toast({ title: "Couldn't update this update", description: friendlyError(e), variant: "destructive" }); }
  };
  const saveSource = async () => {
    const item = await saveAlert.mutateAsync({ id: alert.id });
    await invalidateWatchData(qc, { itemId: item.id });
    return item;
  };
  const onSave = async () => {
    try { await saveSource(); toast({ title: "Saved to project", description: `Source note added to ${alert.projectName}.` }); }
    catch (e) { toast({ title: "Couldn't save the source", description: friendlyError(e), variant: "destructive" }); }
  };
  const toLiterature = async () => {
    try {
      const item = await saveSource();
      if (!select(alert.projectId, { preserveItem: true })) return;
      const id = encodeURIComponent(item.id);
      setLocation(`/literature?item=${id}&source=${id}`);
    } catch (e) { toast({ title: "Couldn't save the source", description: friendlyError(e), variant: "destructive" }); }
  };

  return (
    <article className={`sx-card overflow-hidden transition-[opacity,transform] duration-300 ${gone ? "pointer-events-none -translate-y-1 opacity-0" : "opacity-100"} ${alert.read ? "" : "border-l-4 border-l-[hsl(var(--teal))]"}`} data-testid={`card-alert-${alert.id}`}>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`sx-chip ${alert.kind === "patent" ? "warn" : ""}`}>{alert.kind}</span>
          {alert.category && <span className="sx-chip">{alert.category}</span>}
          {!alert.read && <span className="sx-chip ok" data-testid={`status-unread-${alert.id}`}>unread</span>}
          {extras.ageLabel && <span className="sx-chip warn" title="Newly found by your watch, but published some time ago" data-testid={`status-age-${alert.id}`}>{extras.ageLabel}</span>}
          <span className="ml-auto font-mono text-[11px] text-muted-foreground" data-testid={`text-alert-dates-${alert.id}`}>Published {fmtDate(alert.publishedAt, false, "Date unavailable")} &middot; found by watch {fmtDate(alert.foundAt)}</span>
        </div>
        <h3 className="sx-title mt-2.5 text-xl leading-snug" data-testid={`text-alert-title-${alert.id}`}>{alert.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">For {alert.projectName}</p>
        {alert.reason && <p className="mt-3 text-[14px]"><span className="font-medium">Why it surfaced: </span>{alert.reason}</p>}
        {alert.abstract && <p className="mt-2 line-clamp-3 text-[13.5px] text-muted-foreground">{alert.abstract}</p>}
        {compare && (
          <div className="rise mt-4 grid gap-3 md:grid-cols-2" data-testid={`panel-compare-${alert.id}`}>
            <div className="rounded-lg border bg-[hsl(66_20%_93%)] p-3"><p className="sx-eyebrow">Topic when this was found</p><p className="mt-1 text-[13.5px]">{watchedTopic || "The topic used for this match was not recorded."}</p>
              {currentTopic && watchedTopic && currentTopic.trim() !== watchedTopic.trim() && <p className="mt-2 text-[11.5px] text-muted-foreground">Your watch topic has changed since; the comparison refers to the topic above.</p>}</div>
            <div className="rounded-lg border p-3"><p className="sx-eyebrow">How this source compares</p><p className="mt-1 whitespace-pre-line text-[13.5px]">{alert.comparison || "No comparison was produced for this source."}</p>
              {alert.evidence && <blockquote className="mt-2 border-l-2 border-[hsl(var(--turmeric))] pl-2 text-[12.5px] italic text-muted-foreground">{alert.evidence}</blockquote>}</div>
            <p className="text-[11.5px] text-muted-foreground md:col-span-2">An overlap summary to help you read; it does not judge novelty or copying. Open the original before relying on it.</p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t bg-[hsl(66_20%_95%)] px-4 py-3">
        <a className="sx-btn" href={alert.url} target="_blank" rel="noreferrer" onClick={() => { if (!alert.read) void patch({ read: true }); }} data-testid={`link-alert-source-${alert.id}`}><ExternalLink />Original source</a>
        <button className="sx-btn" aria-expanded={compare} onClick={() => setCompare(c => !c)} data-testid={`button-compare-${alert.id}`}><Columns2 />{compare ? "Hide compare" : "Compare"}</button>
        {alert.savedItemId
          ? <Link href={`/my-library?item=${encodeURIComponent(alert.savedItemId)}`} onClick={e => { if (!select(alert.projectId, { preserveItem: true })) e.preventDefault(); }} className="sx-btn" data-testid={`link-saved-${alert.id}`}><Check />Saved in project</Link>
          : <button className="sx-btn" disabled={saveAlert.isPending} onClick={() => void onSave()} data-testid={`button-save-alert-${alert.id}`}><BookmarkPlus />{saveAlert.isPending ? "Saving..." : "Save to project"}</button>}
        <button className="sx-btn" disabled={saveAlert.isPending} onClick={() => setConfirmLit(true)} data-testid={`button-literature-${alert.id}`}><BookOpenText />Update literature survey</button>
        <span className="ml-auto flex gap-1">
          {!alert.read && <button className="sx-btn border-0 bg-transparent" disabled={update.isPending} onClick={() => void patch({ read: true }, "Marked as read")} data-testid={`button-read-${alert.id}`}><Check />Mark read</button>}
          <button className="sx-btn border-0 bg-transparent" disabled={update.isPending} onClick={() => void patch({ dismissed: true }, "Dismissed")} data-testid={`button-dismiss-${alert.id}`}><EyeOff />Dismiss</button>
        </span>
      </div>
      <AlertDialog open={confirmLit} onOpenChange={setConfirmLit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Take this source to your literature review?</AlertDialogTitle>
            <AlertDialogDescription>We save it as a source note in {alert.projectName}, switch to that project and open Literature review with the note. The note is placed into the literature review composer as context, so you can review the prompt and write a new review document. No existing review is rewritten; nothing is generated until you press write.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-literature">Not now</AlertDialogCancel>
            <AlertDialogAction onClick={() => void toLiterature()} data-testid="button-confirm-literature">Save and open</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
