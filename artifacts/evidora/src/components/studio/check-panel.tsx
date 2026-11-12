import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCheckStudioDocument, useSaveStudioItem, getListStudioItemsQueryKey, getGetStudioItemQueryKey, type StudioCheck, type StudioItem } from "@workspace/api-client-react";
import { CheckCircle2, CircleAlert, ExternalLink, NotebookPen, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { friendlyError } from "@/lib/studio";

/** The result the backend stored on this exact revision (metadata.review), if any. */
export function savedReviewOf(item: StudioItem): StudioCheck | null {
  const r = (item.metadata as Record<string, unknown> | null)?.review as Partial<StudioCheck> | undefined;
  if (!r || typeof r !== "object" || !Array.isArray(r.issues) || !Array.isArray(r.matches) || typeof r.scope !== "string") return null;
  const at = (item.metadata as Record<string, unknown>).reviewedAt;
  return { externalAvailable: false, ...r, checkedAt: r.checkedAt ?? (typeof at === "string" ? at : undefined) } as StudioCheck;
}

export type AiDetection = { humanScore?: number; threshold?: number; verdict?: string; signals?: string[]; passes?: number; method?: string; checkedAt?: string };

/** The authorship screen stored on this revision (metadata.aiDetection), if any. */
export function aiDetectionOf(item: StudioItem): AiDetection | null {
  const d = (item.metadata as Record<string, unknown> | null)?.aiDetection as AiDetection | undefined;
  return d && typeof d === "object" && typeof d.humanScore === "number" ? d : null;
}

const n = (v?: number) => (typeof v === "number" ? v.toLocaleString() : "not reported");
const pct = (v?: number) => (typeof v === "number" ? `${v.toFixed(1)}%` : null);

/** Plain-text report with the real numbers, for saving as a project note. */
export function checkReportText(r: StudioCheck, draftTitle: string, missing: string[] = []): string {
  const lines = [
    `# Project check report: ${draftTitle}`,
    "",
    `Checked: ${r.checkedAt ? new Date(r.checkedAt).toLocaleString() : new Date().toLocaleString()}`,
    `Scope: ${r.scope}`,
    `Shared wording within checked project sources: ${pct(r.corpusSimilarityPercent) ?? "not reported"}`,
    `Project sources compared: ${n(r.comparedSources)}`,
    `Words checked: ${n(r.wordsChecked)}; matched words: ${n(r.matchedWords)}; excluded words (quotes, references): ${n(r.excludedWords)}`,
    r.profileName ? `Formatting profile: ${r.profileName}` : "Formatting profile: none",
    "",
    "Free project screening: compares only with sources in this project. It is not a global originality percentage, a web-wide plagiarism check or an AI-authorship verdict.",
  ];
  if (missing.length) lines.push("", "## Missing before export", ...missing.map(m => `- ${m}`));
  if (r.formatIssues?.length) lines.push("", "## Format issues", ...r.formatIssues.map(i => `- ${i}`));
  lines.push("", `## Writing issues (${r.issues.length})`, ...(r.issues.length ? r.issues.map(i => `- ${i}`) : ["- None flagged"]));
  lines.push("", `## Overlapping passages (${r.matches.length})`);
  r.matches.forEach((m, i) => {
    lines.push("", `${i + 1}. ${m.title}${m.matchType ? ` (${m.matchType})` : ""}`, `Your draft: "${m.excerpt}"`);
    if (m.sourceExcerpt) lines.push(`Source: "${m.sourceExcerpt}"`);
    if (m.url) lines.push(`Link: ${m.url}`);
  });
  return lines.join("\n");
}

export function CheckResult({ result, missing = [], save, aiDetection }: { result: StudioCheck; missing?: string[]; save?: { projectId: string; draftTitle: string }; aiDetection?: AiDetection | null }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const saveItem = useSaveStudioItem();
  const [savedId, setSavedId] = useState<string | null>(null);
  const overlap = pct(result.corpusSimilarityPercent);
  const formatIssues = result.formatIssues ?? [];

  const saveNote = async () => {
    if (!save) return;
    try {
      const item = await saveItem.mutateAsync({ data: { projectId: save.projectId, kind: "note", title: `Check report: ${save.draftTitle}`.slice(0, 300), content: checkReportText(result, save.draftTitle, missing) } });
      qc.setQueryData(getGetStudioItemQueryKey(item.id), item);
      await qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
      setSavedId(item.id);
      toast({ title: "Report saved as a note", description: "Find it in My Library under this project." });
    } catch (e) { toast({ title: "Couldn't save report", description: friendlyError(e), variant: "destructive" }); }
  };

  return (
    <div className="space-y-4 text-sm" data-testid="panel-check-result">
      {aiDetection && typeof aiDetection.humanScore === "number" && (
        <div className="rounded-lg border bg-[hsl(var(--turmeric)/0.07)] p-3.5" data-testid="panel-ai-detection">
          <p className="sx-eyebrow">AI-authorship screen · estimated human writing</p>
          <p className="sx-title mt-1 text-3xl" data-testid="text-human-score">{aiDetection.humanScore.toFixed(0)}%</p>
          <p className="mt-1 text-xs text-muted-foreground">Target: {aiDetection.threshold ?? 99}% human. {aiDetection.verdict}</p>
          {aiDetection.signals?.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">{aiDetection.signals.map((s, i) => <li key={i}>{s}</li>)}</ul> : null}
          <p className="mt-2 text-[11px] text-muted-foreground">{aiDetection.method ?? "Language-model estimate, not a certified detector."}{typeof aiDetection.passes === "number" ? ` Humanising rewrites applied: ${aiDetection.passes}.` : ""}</p>
        </div>
      )}
      <div className="rounded-lg border bg-[hsl(var(--teal)/0.05)] p-3.5">
        <p className="sx-eyebrow">Shared wording within checked project sources</p>
        <p className="sx-title mt-1 text-3xl" data-testid="text-overlap-percent">{overlap ?? "Not reported"}</p>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Project sources compared</dt><dd className="font-mono" data-testid="text-compared-sources">{n(result.comparedSources)}</dd>
          <dt className="text-muted-foreground">Words checked</dt><dd className="font-mono">{n(result.wordsChecked)}</dd>
          <dt className="text-muted-foreground">Matched words</dt><dd className="font-mono">{n(result.matchedWords)}</dd>
          <dt className="text-muted-foreground">Excluded (quotes, references)</dt><dd className="font-mono" data-testid="text-excluded-words">{n(result.excludedWords)}</dd>
        </dl>
        <p className="mt-2 text-[11px] text-muted-foreground">Only compares this draft with the papers, notes and drafts in this project. It is not a global originality percentage, a web-wide plagiarism score or an AI-authorship verdict.{result.checkedAt ? ` Checked ${new Date(result.checkedAt).toLocaleString()}.` : ""}</p>
      </div>
      {!result.externalAvailable && <p className="text-xs text-muted-foreground">Free project screening. Web and journal databases are outside its scope; those comparisons are done by licensed similarity providers.</p>}
      <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Scope:</span> {result.scope}</p>

      <div>
        <p className="sx-eyebrow mb-1.5">Before export{result.profileName ? ` · ${result.profileName}` : ""}</p>
        <ul className="space-y-1" data-testid="list-format-checklist">
          {missing.map((m, i) => <li key={`m${i}`} className="flex gap-2"><CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-vermilion" />{m}</li>)}
          {formatIssues.map((m, i) => <li key={`f${i}`} className="flex gap-2"><CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--turmeric))]" />{m}</li>)}
          {!missing.length && !formatIssues.length && <li className="flex gap-2 text-muted-foreground"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--teal))]" />No missing details or format issues found{result.profileName ? " for this profile" : ""}.</li>}
        </ul>
      </div>

      <div>
        <p className="sx-eyebrow mb-1">Writing issues ({result.issues.length})</p>
        {result.issues.length ? <ul className="list-disc space-y-1 pl-5">{result.issues.map((i, k) => <li key={k}>{i}</li>)}</ul> : <p className="text-muted-foreground">No issues flagged.</p>}
      </div>

      <div>
        <p className="sx-eyebrow mb-1">Overlapping passages ({result.matches.length})</p>
        {result.matches.length ? result.matches.map((m, k) => (
          <div key={k} className="mt-2 rounded-md border bg-[hsl(var(--turmeric)/0.07)] p-3" data-testid={`match-${k}`}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{m.title}</p>
              {m.matchType && <span className="sx-chip">{m.matchType}</span>}
              {m.url && <a href={m.url} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs underline"><ExternalLink className="h-3 w-3" />Open source</a>}
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <blockquote className="border-l-2 border-[hsl(var(--teal)/0.5)] pl-2.5 text-[13px]"><span className="sx-eyebrow block !text-[9.5px]">Your draft</span>&ldquo;{m.excerpt}&rdquo;</blockquote>
              <blockquote className="border-l-2 border-[hsl(var(--turmeric)/0.6)] pl-2.5 text-[13px] text-muted-foreground"><span className="sx-eyebrow block !text-[9.5px]">Source</span>{m.sourceExcerpt ? <>&ldquo;{m.sourceExcerpt}&rdquo;</> : "Source passage not returned."}</blockquote>
            </div>
          </div>
        )) : <p className="text-muted-foreground">No overlapping passages found within this project.</p>}
      </div>

      {save && (
        <button className="sx-btn w-full" disabled={saveItem.isPending || !!savedId} onClick={() => void saveNote()} data-testid="button-save-check-report">
          <NotebookPen />{savedId ? "Saved to project notes" : saveItem.isPending ? "Saving..." : "Save report as project note"}
        </button>
      )}
    </div>
  );
}

/** Mount with key={itemId}: state never leaks between revisions. Shows the stored result for this revision until re-run. */
export function CheckPanel({ itemId, disabled, missing, projectId, draftTitle, saved, aiDetection }: { itemId: string; disabled?: boolean; missing?: string[]; projectId?: string; draftTitle?: string; saved?: StudioCheck | null; aiDetection?: AiDetection | null }) {
  const check = useCheckStudioDocument();
  const shown = check.data ?? saved ?? null;
  return (
    <div className="sx-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="sx-eyebrow">Free project screening</p>
        <button className="sx-btn" disabled={disabled || check.isPending} onClick={() => check.mutate({ id: itemId })} data-testid="button-run-check"><ShieldCheck />{check.isPending ? "Checking..." : shown ? "Run again" : "Run check"}</button>
      </div>
      {disabled && <p className="mt-2 text-xs text-muted-foreground">Save your edits first; the check reads the saved version.</p>}
      {check.isError && <p className="mt-3 text-sm text-vermilion">{friendlyError(check.error)}</p>}
      {!check.data && saved && <p className="mt-2 text-[11px] text-muted-foreground" data-testid="text-saved-review">Last result saved for this revision.</p>}
      {shown && <div className="mt-4"><CheckResult key={`${itemId}:${shown.checkedAt ?? ""}`} result={shown} missing={missing} aiDetection={aiDetection} save={projectId ? { projectId, draftTitle: draftTitle ?? "draft" } : undefined} /></div>}
    </div>
  );
}
