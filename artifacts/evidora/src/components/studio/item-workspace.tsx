import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSaveStudioItem, useDeleteStudioItem, useSyncStudioDocument, useGenerateStudioDocument, useGetUsage, getGetUsageQueryKey,
  StudioGenerationInputKind,
  getListStudioItemsQueryKey, getGetStudioItemQueryKey,
  StudioItemInputKind, type StudioItem, type DocumentDetails, type StudioTemplate,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { Check, ClipboardCheck, SlidersHorizontal, Download, FileText, History, LineChart, PanelRight, RefreshCw, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FigureView, MissingFigure } from "./figure-view";
import { figureNoticesOf, figuresOf, markerOrder, FIGURE_GUARD } from "@/lib/figures";
import { usageLimitMessage } from "@/lib/usage-limits";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AcademicAnswer } from "@/components/academic-answer";
import { GenerationStatus } from "./generation-status";
import { CheckPanel } from "./check-panel";
import { RequirementsCheck, requirementsCheckOf } from "./requirements-check";
import { useToast } from "@/hooks/use-toast";
import { useUnsavedGuard } from "@/lib/unsaved";
import { cleanDetails, DETAIL_KINDS, detailsOf, downloadStudioItem, friendlyError, hasDetails, isWorking, KIND_LABEL, lineageOf, meta, missingRequirements, sameDetails, statusOf } from "@/lib/studio";
import { DocumentDetailsFields } from "./document-details";
import { TemplatePicker } from "./template-picker";
import { savedReviewOf, aiDetectionOf } from "./check-panel";
import { ago } from "@/lib/format";
import { WatchPanel } from "@/components/research/watch-panel";
import { proposeTopic, useWatches } from "@/lib/research-watch";
import { useActiveProject } from "@/lib/active-project";
import { CustomFormatBanner, CustomFormatDialog } from "./custom-format-dialog";

const GENERATABLE = new Set<string>(Object.values(StudioGenerationInputKind));
const SAVABLE = new Set<string>(Object.values(StudioItemInputKind));
const plainInline = (t: string): ReactNode => t;
const norm = (t: string) => t.replace(/[*_`#]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
/** Display-only: drops a leading "# Title" line when it merely repeats the outer title. Saved content is untouched. */
export function withoutRepeatedTitle(content: string, title: string): string {
  const m = content.match(/^\s*#\s+([^\n]+)\n?/);
  return m && norm(m[1]) === norm(title) ? content.slice(m[0].length).replace(/^\s+/, "") : content;
}

function IndexChip({ status }: { status: string }) {
  const tone = status === "indexed" || status === "ready" || status === "completed" ? "ok" : status === "failed" || status === "unavailable" ? "bad" : "warn";
  const label = status === "unavailable" ? "search index unavailable" : `search index: ${status || "unknown"}`;
  return <span className={`sx-chip ${tone}`} data-testid="status-index">{label}</span>;
}

export function ExportButtons({ item, disabled }: { item: Pick<StudioItem, "id" | "title">; disabled?: boolean }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<"pdf" | "docx" | null>(null);
  const run = async (f: "pdf" | "docx") => {
    setBusy(f);
    try { await downloadStudioItem(item, f); }
    catch (e) { toast({ title: "Export failed", description: friendlyError(e), variant: "destructive" }); }
    finally { setBusy(null); }
  };
  return (
    <>
      <button className="sx-btn" disabled={disabled || !!busy} onClick={() => void run("pdf")} data-testid="button-export-pdf"><Download />{busy === "pdf" ? "Preparing..." : "PDF"}</button>
      <button className="sx-btn" disabled={disabled || !!busy} onClick={() => void run("docx")} data-testid="button-export-docx"><FileText />{busy === "docx" ? "Preparing..." : "Word"}</button>
    </>
  );
}

type Props = {
  item: StudioItem;
  allItems: StudioItem[];
  onOpen: (id: string | null) => void;
  onRetry?: () => void;
  extra?: ReactNode;
  /** "default" keeps the two-column layout. "reading" gives the document full width and moves tools into a drawer. */
  presentation?: "default" | "reading";
  /** Stream generation inline without the progress popup. */
  inlineProgress?: boolean;
};

export function ItemWorkspace({ item, allItems, onOpen, onRetry, extra, presentation = "default", inlineProgress = false }: Props) {
  const reading = presentation === "reading";
  const [toolsOpen, setToolsOpen] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();
  const save = useSaveStudioItem();
  const del = useDeleteStudioItem();
  const sync = useSyncStudioDocument();
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);
  const [mode, setMode] = useState<"read" | "edit">("read");
  const savedDetails = detailsOf(item);
  const savedTemplate = meta(item).templateId ?? null;
  const [details, setDetails] = useState<DocumentDetails>(savedDetails);
  const [templateId, setTemplateId] = useState<string | null>(savedTemplate);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const initFor = useRef<string | null>(null);
  const working = isWorking(item.status);

  useEffect(() => {
    // Initialise once per item id, and once more when a running item completes.
    const key = `${item.id}:${working ? "w" : item.status}`;
    if (initFor.current === key) return;
    initFor.current = key;
    setTitle(item.title); setContent(item.content); setConflict(null);
    setDetails(detailsOf(item)); setTemplateId(meta(item).templateId ?? null); setProfileName(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, item.status, item.title, item.content, working]);

  const watches = useWatches();
  const { projects } = useActiveProject();
  const watchProject = projects.find(p => p.id === item.projectId);
  const isProjectInfo = (item.metadata as Record<string, unknown> | null)?.projectInformation === true;
  const canSave = SAVABLE.has(item.kind) && !isProjectInfo;
  const docKind = DETAIL_KINDS.has(item.kind) && canSave;
  const textDirty = title !== item.title || content !== item.content;
  const detailsDirty = docKind && !sameDetails(details, savedDetails);
  const profileDirty = docKind && templateId !== savedTemplate;
  const dirty = canSave && !working && (textDirty || detailsDirty || profileDirty);
  const missing = missingRequirements(item.kind, title, details);
  useUnsavedGuard(`studio-item-${item.id}`, dirty, `"${item.title}" has unsaved edits.`);
  const lineage = lineageOf(allItems.length ? allItems : [item], item.id);
  const m = meta(item);
  const figures = figuresOf(item);
  const figNotices = figureNoticesOf(item);
  const order = markerOrder(content);
  const renderFigure = (fid: string) => {
    const f = figures.find(x => x.id === fid);
    return f ? <FigureView itemId={item.id} figure={f} number={order.indexOf(fid) + 1} /> : <MissingFigure id={fid} />;
  };
  const gen = useGenerateStudioDocument();
  const usage = useGetUsage({ query: { queryKey: getGetUsageQueryKey() } });
  const genKind = GENERATABLE.has(item.kind) ? item.kind as StudioGenerationInputKind : null;
  const figLimit = usageLimitMessage(usage.data, genKind === "literature" ? "review" : "answer");
  const [figOpen, setFigOpen] = useState(false);
  const [fmtOpen, setFmtOpen] = useState(false);
  const canCustomFormat = (item.kind === "journal" || item.kind === "thesis") && item.status === "completed" && canSave;
  const [figPrompt, setFigPrompt] = useState("");
  const canFigure = !!genKind && canSave && item.status === "completed" && !isProjectInfo;
  const doFigure = async (prompt = figPrompt) => {
    if (!genKind || dirty || prompt.trim().length < 5 || gen.isPending) return;
    if (figLimit) { toast({ title: "Limit reached", description: figLimit, variant: "destructive" }); return; }
    try {
      const created = await gen.mutateAsync({ data: { projectId: item.projectId, kind: genKind, parentId: item.id, evidenceMode: "project",
        prompt: `Add or revise a figure in "${item.title}". ${prompt.trim()}`.slice(0, 4700) + FIGURE_GUARD } });
      qc.setQueryData(getGetStudioItemQueryKey(created.id), created);
      void qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
      void qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
      setFigOpen(false); setFigPrompt("");
      toast({ title: "Figure revision started", description: "A new document is being written. This revision stays unchanged." });
      onOpen(created.id);
    } catch (e) {
      toast({ title: "Couldn't start the figure revision", description: friendlyError(e), variant: "destructive" });
      void qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
    }
  };
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  const doSave = async () => {
    if (!dirty || !title.trim() || save.isPending) return;
    setConflict(null);
    try {
      const saved = await save.mutateAsync({ data: {
        projectId: item.projectId, kind: item.kind as StudioItemInputKind, title: title.trim(), content,
        parentId: item.id,
        // Explicit profile choice (or the inherited one); details always carried forward so revisions never drop them.
        // docKind: always explicit (null clears the profile). Other kinds omit it, which means inherit.
        ...(docKind ? { templateId: templateId || null } : {}),
        ...(docKind ? { documentDetails: cleanDetails(details) } : {}),
      } });
      setConflict(null);
      qc.setQueryData(getGetStudioItemQueryKey(saved.id), saved);
      await qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
      toast({ title: `Saved revision ${saved.revision}`, description: profileDirty ? "Your chosen format is saved with this version. Earlier versions are unchanged." : "Earlier versions are kept in history." });
      setToolsOpen(false);
      onOpen(saved.id);
    } catch (e) {
      setConflict(friendlyError(e));
      if (statusOf(e) !== 409) toast({ title: "Couldn't save", description: friendlyError(e), variant: "destructive" });
    }
  };

  const doDelete = async () => {
    try {
      await del.mutateAsync({ id: item.id });
      await qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
      qc.removeQueries({ queryKey: getGetStudioItemQueryKey(item.id) });
      toast({ title: "Deleted", description: item.title });
      onOpen(null);
    } catch (e) { toast({ title: "Couldn't delete", description: friendlyError(e), variant: "destructive" }); }
  };

  const doSync = async () => {
    try {
      const s = await sync.mutateAsync({ id: item.id });
      qc.setQueryData(getGetStudioItemQueryKey(s.id), s);
      void qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
    } catch (e) { toast({ title: "Sync failed", description: friendlyError(e), variant: "destructive" }); }
  };

  const switchVersion = (id: string) => {
    if (dirty && !window.confirm("Switch versions and discard your unsaved edits?")) return;
    onOpen(id);
  };

  if (working || item.status === "failed") return <GenerationStatus item={item} onRetry={onRetry} inline={inlineProgress} />;

  return (
    <div className={reading ? "rise" : "rise grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]"} data-testid={`workspace-item-${item.id}`}>
      <article className="sx-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b bg-[hsl(66_20%_95%)] px-4 py-2.5">
          <span className="sx-chip">{KIND_LABEL[item.kind] ?? item.kind}</span>
          <span className="sx-chip" data-testid="text-revision">rev {item.revision}</span>
          <IndexChip status={item.indexStatus} />
          <div className="ml-auto flex flex-wrap gap-1.5">
            {canSave && <button className="sx-btn" onClick={() => setMode(mode === "edit" ? "read" : "edit")} data-testid="button-toggle-edit">{mode === "edit" ? "Preview" : "Edit"}</button>}
            {reading && <button className="sx-btn" onClick={() => setToolsOpen(true)} aria-haspopup="dialog" data-testid="button-open-tools"><PanelRight />Versions and checks</button>}
            {canSave && dirty && <button className="sx-btn sx-primary" disabled={save.isPending || !title.trim()} onClick={() => void doSave()} data-testid="button-save-version-toolbar"><Check />{save.isPending ? "Saving…" : "Save new version"}</button>}
            {item.status === "completed" && item.kind !== "document-review" && !(item.metadata as Record<string, unknown> | null | undefined)?.paperReview && <Link href={`/paper-review?source=${item.id}`} className="sx-btn" data-testid="link-review-this-document"><ClipboardCheck />Check requirements &amp; research</Link>}
            {canCustomFormat && <button className="sx-btn" disabled={dirty} title={dirty ? "Save your edits first, then customise the format" : "Choose your own layout for a new revision"} onClick={() => setFmtOpen(true)} aria-haspopup="dialog" data-testid="button-open-custom-format"><SlidersHorizontal />Custom format</button>}
            <span title={dirty ? "Save this revision before exporting" : undefined} className="inline-flex gap-1.5"><ExportButtons item={item} disabled={dirty} /></span>
          </div>
        </div>
        <div className={reading ? "mx-auto max-w-[760px] px-5 py-6 md:px-10 md:py-10" : "px-5 py-5 md:px-9 md:py-8"}>
          {(item.kind === "journal" || item.kind === "thesis") && <CustomFormatBanner item={item} />}
          {dirty && canCustomFormat && <p className="mb-1 text-xs text-vermilion" data-testid="text-custom-format-blocked">Save your edits first to use Custom format.</p>}
          {dirty && <p className="mb-3 text-xs text-vermilion" role="status" data-testid="text-export-blocked">Save your changes before downloading. PDF and Word files use the last saved version{detailsDirty || profileDirty ? ", including your name, institution and chosen format" : ""}.</p>}
          {!dirty && missing.length > 0 && <p className="mb-3 text-xs text-[hsl(var(--turmeric))]" role="status" data-testid="text-export-missing">Before export: {missing.join("; ")}. You can still export.</p>}
          {mode === "edit" && canSave
            ? <input className="sx-title w-full border-0 bg-transparent text-3xl outline-none" value={title} maxLength={300} onChange={e => setTitle(e.target.value)} aria-label="Title" data-testid="input-item-title" />
            : <h2 className={`sx-title leading-tight ${reading ? "text-[32px] md:text-[38px]" : "text-3xl"}`} data-testid="text-item-title">{title}</h2>}
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">created {ago(item.createdAt)} &middot; {words} words</p>
          <div className="mt-6">
            {mode === "edit" && canSave
              ? <>{(order.length > 0 || figures.length > 0) && <p className="mb-2 rounded-md border border-[hsl(var(--turmeric)/0.5)] bg-[hsl(var(--turmeric)/0.08)] px-3 py-2 text-xs" data-testid="text-figure-marker-help">Lines like <span className="font-mono">[[figure:fig-1]]</span> place a figure. Keep each on its own line. Moving a marker moves the figure; deleting the line removes the figure. A marker without saved figure data blocks saving and export.</p>}
                <textarea className="sx-editor" value={content} onChange={e => setContent(e.target.value)} spellCheck aria-label="Document text" data-testid="input-item-content" /></>
              : content.trim() ? <AcademicAnswer content={reading ? withoutRepeatedTitle(content, title) : content} inline={plainInline} renderFigure={renderFigure} referenceSources={m.sources} linkCitations /> : <p className="text-sm text-muted-foreground">This item has no text yet. </p>}
          </div>
        </div>
        {canFigure && <div className="mx-5 mb-4 rounded-md border bg-[hsl(66_20%_97%)] p-3" data-testid="panel-add-figure">
          {!figOpen ? <div className="flex flex-wrap items-center gap-2">
            <LineChart className="h-4 w-4 text-[hsl(var(--cyan-ink))]" />
            <span className="text-sm">{figures.length ? `${figures.length} figure${figures.length === 1 ? "" : "s"} in this revision.` : "No figures yet."}</span>
            {!figures.length && <button className="sx-btn sx-primary" disabled={dirty || gen.isPending} onClick={() => void doFigure("Create a coloured conceptual illustration of the methodology or research themes explicitly described in this saved manuscript. Follow this manuscript's scope and exact section names, not unrelated project drafts. Label it conceptual/proposed and do not invent measurements or results.")} data-testid="button-create-missing-figure">{gen.isPending ? "Starting…" : "Generate suggested diagram"}</button>}
            <button className="sx-btn ml-auto" disabled={dirty} title={dirty ? "Save or discard your edits first" : undefined} onClick={() => setFigOpen(true)} data-testid="button-open-add-figure"><LineChart />Add or revise a figure</button>
          </div> : <div className="space-y-2">
            <p className="sx-eyebrow">Add or revise a figure</p>
            <p className="text-xs text-muted-foreground">Describe the figure. Paste table data or an equation, or point to a project source. Without data, Evidora will say what is needed rather than invent values. A new revision is created; this one is never overwritten.</p>
            <textarea className="sx-input min-h-[90px]" value={figPrompt} maxLength={4000} onChange={e => setFigPrompt(e.target.value)} placeholder={"e.g. Line graph of yield vs. nitrogen dose:\n0, 2.1\n40, 3.4\n80, 4.0"} aria-label="Figure instructions" data-testid="input-figure-prompt" />
            {figLimit && <p className="text-xs text-vermilion" role="status">{figLimit}</p>}
            <div className="flex gap-2">
              <button className="sx-btn sx-primary" disabled={dirty || gen.isPending || figPrompt.trim().length < 5 || !!figLimit} onClick={() => void doFigure()} data-testid="button-generate-figure">{gen.isPending ? "Starting..." : "Write new revision"}</button>
              <button className="sx-btn" disabled={gen.isPending} onClick={() => setFigOpen(false)} data-testid="button-cancel-figure">Cancel</button>
            </div>
          </div>}
        </div>}
        {conflict && <div className="mx-5 mb-4 rounded-md border border-[hsl(var(--vermilion)/0.35)] bg-[hsl(var(--vermilion)/0.06)] p-3 text-sm" role="alert" data-testid="status-conflict">{conflict}</div>}
        <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3">
          <span className="text-xs text-muted-foreground" role="status">{dirty ? `Unsaved ${[textDirty && "text", detailsDirty && "details", profileDirty && "profile"].filter(Boolean).join(", ")} edits` : "All changes saved"}</span>
          {isProjectInfo
            ? <span className="text-xs text-muted-foreground" data-testid="text-project-info-note">This mirrors your project details. Edit them in <Link href="/my-library" className="underline">the project information form</Link>; it updates here automatically.</span>
            : !canSave && <span className="text-xs text-muted-foreground">This item type is read-only. Confirm an idea to get an editable copy.</span>}
          {extra}
          {canSave && <button className="sx-btn sx-primary ml-auto" disabled={!canSave || !dirty || save.isPending || !title.trim()} onClick={() => void doSave()} data-testid="button-save-version"><Check />{save.isPending ? "Saving..." : "Save new version"}</button>}
        </div>
        {!working && item.status !== "failed" && !isProjectInfo && watchProject && watches.data && (
          <div className="border-t p-4">
            <WatchPanel key={`${item.projectId}:${item.id}`} compact projectId={item.projectId} projectName={watchProject.name} watch={watches.data.find(w => w.projectId === item.projectId)}
              proposal={proposeTopic({ title: item.title, content: item.content })} proposalSource={`"${item.title}"`} />
          </div>
        )}
      </article>

      {(() => { const tools = (<div className="space-y-4">
        <div className="sx-card p-4">
          <p className="sx-eyebrow mb-2 flex items-center gap-1.5"><History className="h-3.5 w-3.5" />Version history</p>
          <select className="sx-input" value={item.id} onChange={e => switchVersion(e.target.value)} data-testid="select-version">
            {lineage.map(v => <option key={v.id} value={v.id}>Revision {v.revision} &middot; {new Date(v.createdAt).toLocaleString()}</option>)}
          </select>
          <p className="mt-2 text-xs text-muted-foreground">{isProjectInfo ? "Kept in step with the project details form." : "Each save creates a new revision. Older ones are never overwritten."}</p>
        </div>
        <div className="sx-card p-4">
          <p className="sx-eyebrow mb-2">Project search index</p>
          <p className="text-xs text-muted-foreground">Indexed items can be used as evidence for project-aware answers. Syncing does not count as an answer, but it does use AI service budget.{item.indexStatus === "unavailable" ? " The search index is currently unavailable on the server; the item is still saved." : ""}</p>
          <button className="sx-btn mt-3 w-full" disabled={sync.isPending} onClick={() => void doSync()} data-testid="button-sync"><RefreshCw />{sync.isPending ? "Syncing..." : item.indexStatus === "failed" ? "Retry sync" : "Re-sync"}</button>
        </div>
        {docKind && (
          <div className="sx-card space-y-3 p-4" data-testid="panel-item-settings">
            <DocumentDetailsFields kind={item.kind} value={details} onChange={setDetails} defaultOpen={missing.length > 0}
              note="Click Save new version to include these details on the first page of your PDF and Word files." />
            <TemplatePicker compact kind={item.kind as "journal" | "thesis" | "synopsis"} value={templateId}
              onChange={(t: StudioTemplate | null) => { setTemplateId(t?.id ?? null); setProfileName(t?.name ?? null); }} label={item.kind === "journal" ? "Choose a journal" : "Choose a format"} />
            {profileDirty && <p className="text-xs text-vermilion" data-testid="text-profile-dirty">{templateId ? `Switching to ${profileName ?? "your chosen format"}` : "Switching to the standard format"}. Save a new version to apply this; earlier versions stay unchanged.</p>}
          </div>
        )}
        {docKind && <RequirementsCheck compact data={requirementsCheckOf(item)} emptyHint={item.status === "completed" ? "No requirements check is saved with this version yet. Use Check requirements & research to compare this draft with the official instructions for your journal or university, and with relevant papers and patents." : undefined} />}
        <CheckPanel key={item.id} saved={savedReviewOf(item)} aiDetection={aiDetectionOf(item)} itemId={item.id} disabled={dirty} missing={missing} projectId={item.projectId} draftTitle={item.title} />
        {figNotices.length > 0 && <div className="sx-card p-4 text-sm" data-testid="panel-figure-notices"><p className="sx-eyebrow mb-1">Figure notes</p><ul className="list-disc space-y-1 pl-5 text-muted-foreground">{figNotices.map((w, i) => <li key={i}>{w}</li>)}</ul></div>}
        {(m.sources.length > 0 || m.warnings.length > 0) && (
          <div className="sx-card p-4 text-sm">
            {m.warnings.length > 0 && <><p className="sx-eyebrow mb-1">Notes from the writer</p><ul className="mb-3 list-disc space-y-1 pl-5 text-muted-foreground">{m.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></>}
            {m.sources.length > 0 && <><p className="sx-eyebrow mb-1">Sources reviewed ({m.sources.length})</p>
              <ol className="list-decimal space-y-1.5 pl-5">{m.sources.map(s => <li key={s.id}>{s.url ? <a className="underline decoration-[hsl(var(--teal)/0.4)] underline-offset-2" href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title}</li>)}</ol></>}
          </div>
        )}
        <button className="sx-btn sx-danger w-full" onClick={() => { setToolsOpen(false); setConfirmDelete(true); }} data-testid="button-delete-item"><Trash2 />Delete this revision</button>
      </div>);
        return reading
          ? <Sheet open={toolsOpen} onOpenChange={setToolsOpen}>
              <SheetContent side="right" className="flex w-full flex-col overflow-hidden bg-[hsl(52_30%_96%)] p-0 sm:max-w-[400px]" data-testid="drawer-item-tools">
                <SheetHeader className="shrink-0 px-6 pb-4 pt-6 text-left"><SheetTitle className="sx-title text-xl">Versions, checks and sources</SheetTitle>
                  <SheetDescription>Revision {item.revision} of &ldquo;{item.title}&rdquo;</SheetDescription></SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{tools}</div>
                {canSave && <div className="shrink-0 border-t bg-[hsl(52_30%_96%)] px-6 py-4" data-testid="panel-tools-save">
                  {conflict && <p className="mb-2 text-xs text-vermilion" role="alert">{conflict}</p>}
                  <p className="mb-2 text-xs text-muted-foreground" role="status">{dirty ? "Unsaved changes. Save a new version to apply them to exports." : "All changes saved."}</p>
                  <button className="sx-btn sx-primary w-full" disabled={!dirty || save.isPending || !title.trim()} onClick={() => void doSave()} data-testid="button-save-version-drawer"><Check />{save.isPending ? "Saving…" : "Save new version"}</button>
                </div>}
              </SheetContent>
            </Sheet>
          : <aside>{tools}</aside>; })()}

      {canCustomFormat && <CustomFormatDialog item={item} open={fmtOpen && !dirty} onOpenChange={setFmtOpen} onOpen={onOpen} />}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{item.title}&rdquo; (rev {item.revision})?</AlertDialogTitle>
            <AlertDialogDescription>This removes the revision from your project. It cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={() => void doDelete()} className="bg-[hsl(var(--vermilion))]" data-testid="button-confirm-delete">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
