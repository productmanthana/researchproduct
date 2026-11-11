import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetStudioItem, getGetStudioItemQueryKey, getListStudioItemsQueryKey, useDecideDocumentReview, downloadDocument, type StudioItem,
} from "@workspace/api-client-react";
import { AlertTriangle, ArrowDownToLine, ArrowLeft, Check, ChevronDown, ExternalLink, FileText, Image as ImageIcon, RefreshCw, X } from "lucide-react";
import { FigureView, MissingFigure } from "@/components/studio/figure-view";
import { ExportButtons } from "@/components/studio/item-workspace";
import { AcademicAnswer } from "@/components/academic-answer";
import { RowSkeleton, ErrorState } from "@/components/states";
import { useToast } from "@/hooks/use-toast";
import { figuresOf, markerOrder, isolateMarkers, type StudioFigure } from "@/lib/figures";
import { friendlyError, isWorking, statusOf } from "@/lib/studio";
import { DECISION_LABEL, SEVERITY_LABEL, quoteRanges, reviewOf, type ReviewSource, type ReviewSuggestion } from "./review-model";
import "./document-review.css";
import { LiveDraft } from "@/components/live-draft";
import { AgentProgressChip, useAgentJob } from "@/components/agent-progress/provider";
import { reviewWorkflow } from "@/lib/agent-workflow";
import { PanelTabs, SourcesList } from "@/components/workbench/research-workbench";
import { mergeSources } from "@/lib/source-provenance";

const plain = (t: string): ReactNode => t;
function proposedFigure(s: ReviewSuggestion, figures: StudioFigure[]): StudioFigure | undefined {
  const id = typeof s.figure?.id === "string" ? s.figure.id : null;
  if (!id) return undefined;
  return figures.find(f => f.id === id) ?? (typeof s.figure?.title === "string" ? (s.figure as unknown as StudioFigure) : undefined);
}
const FIG = /^\s*\[\[figure:([A-Za-z0-9_-]+)\]\]\s*$/;
const pct = (a: number, b: number) => (b > 0 ? Math.min(100, Math.round((a / b) * 1000) / 10) : 0);

export function DocumentReviewWorkspace({ reviewId, onClose, chatMode=false, reportSlot }: { reviewId: string; onClose: () => void; chatMode?: boolean;
  /** Generated review report (e.g. paper-review scorecard), shown at the top of the right Document tab. */
  reportSlot?: ReactNode }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const q = useGetStudioItem(reviewId, { query: { queryKey: getGetStudioItemQueryKey(reviewId), refetchInterval: x => (isWorking(x.state.data?.status) ? 3000 : false) } });
  const item = q.data;
  const review = useMemo(() => reviewOf(item), [item]);
  const draftId = review.currentDraftId;
  const draft = useGetStudioItem(draftId ?? "", { query: { queryKey: getGetStudioItemQueryKey(draftId ?? ""), enabled: !!draftId } });
  const decide = useDecideDocumentReview();
  const [view, setView] = useState<"original" | "draft">("original");
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);
  const [origBusy, setOrigBusy] = useState(false);
  const [side, setSide] = useState<"document" | "sources">("document");
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => { setView("original"); setOpenId(null); setConfirmId(null); setConflict(null); }, [reviewId]);
  useEffect(() => {
    if (item?.status === "completed" || item?.status === "failed") void qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
  }, [item?.status, qc]);

  const figures = figuresOf(item);
  const sourceById = new Map(review.sources.map(s => [s.id, s]));
  const pending = review.suggestions.filter(s => s.decision === "pending");
  const shown = filter === "open" ? pending : review.suggestions;
  const counts = { approved: review.suggestions.filter(s => s.decision === "approved").length, dismissed: review.suggestions.filter(s => s.decision === "dismissed").length };

  const focusCard = (id: string) => {
    setSide("document");
    setFilter(f => (review.suggestions.find(s => s.id === id)?.decision === "pending" ? f : "all"));
    setOpenId(id);
    requestAnimationFrame(() => { const el = cardRefs.current[id]; el?.scrollIntoView({ block: "nearest", behavior: "smooth" }); el?.querySelector<HTMLButtonElement>(".dr-card-head")?.focus(); });
  };

  const run = async (s: ReviewSuggestion, action: "approve" | "dismiss") => {
    if (!item || busyId) return;
    setBusyId(s.id); setConflict(null);
    try {
      const updated = await decide.mutateAsync({ id: item.id, data: { suggestionId: s.id, action, expectedDraftId: draftId } });
      qc.setQueryData(getGetStudioItemQueryKey(updated.id), updated);
      const next = reviewOf(updated).currentDraftId;
      if (next) void qc.invalidateQueries({ queryKey: getGetStudioItemQueryKey(next) });
      void qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
      setConfirmId(null);
      if (action === "approve") { toast({ title: "Change approved", description: "A new working draft was written. Your original file is unchanged." }); if (next) setView("draft"); }
      else toast({ title: "Suggestion dismissed", description: "Nothing was changed." });
    } catch (e) {
      if (statusOf(e) === 409) {
        setConflict("This review changed in another tab or window, so nothing was applied. The latest state has been loaded. Check the suggestion and decide again.");
        await q.refetch();
        if (draftId) void qc.invalidateQueries({ queryKey: getGetStudioItemQueryKey(draftId) });
      } else toast({ title: action === "approve" ? "Couldn't apply the change" : "Couldn't dismiss", description: friendlyError(e), variant: "destructive" });
    } finally { setBusyId(null); }
  };

  const downloadOriginal = async () => {
    if (!review.documentId) return;
    setOrigBusy(true);
    try {
      const blob = await downloadDocument(review.documentId, { responseType: "blob" });
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = u; a.download = review.originalName || "original"; document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(() => URL.revokeObjectURL(u), 1500);
    } catch (e) { toast({ title: "Original download failed", description: friendlyError(e), variant: "destructive" }); }
    finally { setOrigBusy(false); }
  };

  const reviewJob = item && item.kind === "document-review" && isWorking(item.status) ? reviewWorkflow(item) : null;
  useAgentJob(chatMode?null:reviewJob);

  if (q.isLoading) return <section className="es-conversation dr-doc"><div className="dr-doc-scroll"><RowSkeleton rows={4} /></div></section>;
  if (q.isError || !item) return <section className="es-conversation dr-doc"><div className="dr-doc-scroll"><ErrorState error={q.error} onRetry={() => q.refetch()} title="Couldn't open this review" /><button className="es-button" onClick={onClose} data-testid="button-review-back-error"><ArrowLeft />Back to chat</button></div></section>;
  if (item.kind !== "document-review") return <section className="es-conversation dr-doc"><div className="dr-doc-scroll"><p className="dr-note">This item is not a document review.</p><button className="es-button" onClick={onClose}><ArrowLeft />Back to chat</button></div></section>;

  const working = isWorking(item.status);
  const order = markerOrder(item.content);
  const renderOriginalFigure = (fid: string) => {
    const f = figures.find(x => x.id === fid);
    if (!f) return <MissingFigure id={fid} />;
    const flagged = review.suggestions.filter(s => s.imageId === fid && s.decision === "pending");
    return <div className="dr-fig-wrap">
      {flagged.length > 0 && <div className="dr-fig-flags">{flagged.map(s => <button key={s.id} className={`dr-pill dr-${s.severity}`} onClick={() => focusCard(s.id)} data-testid={`button-figure-flag-${s.id}`}>{SEVERITY_LABEL[s.severity]}: {s.title}</button>)}</div>}
      <FigureView itemId={item.id} figure={f} number={order.indexOf(fid) + 1} />
    </div>;
  };

  return <>
    <section className="es-conversation dr-doc" aria-label="Reviewed document">
      <div className="dr-doc-bar">
        <button className="es-button dr-small" onClick={onClose} data-testid="button-review-back"><ArrowLeft />{(item.metadata as Record<string,unknown>)?.paperReview ? "Paper Review" : "Chat"}</button>
        <div className="dr-toggle" role="tablist" aria-label="Document version">
          <button role="tab" aria-selected={view === "original"} onClick={() => setView("original")} data-testid="tab-review-original">Original text</button>
          <button role="tab" aria-selected={view === "draft"} disabled={!draftId} title={draftId ? undefined : "Approve a change to create a working draft"} onClick={() => setView("draft")} data-testid="tab-review-draft">Approved working draft</button>
        </div>
        <div className="dr-doc-actions">
          <button className="es-button dr-small" disabled={!review.documentId || origBusy} onClick={() => void downloadOriginal()} data-testid="button-download-original"><ArrowDownToLine />{origBusy ? "Preparing..." : "Original file"}</button>
          {draftId && draft.data && view === "draft" && <span className="dr-export"><ExportButtons item={draft.data} /></span>}
        </div>
      </div>
      <div className="dr-doc-scroll">
        <div className="dr-paper">
          <p className="dr-eyebrow"><FileText />{review.originalName}</p>
          {working && reviewJob && !chatMode && <div className="mb-4" data-testid="status-review-working"><AgentProgressChip jobKey={reviewJob.key} /><p className="dr-note mt-2">Larger documents and source retrieval can take several minutes. You can return to this saved review later.</p></div>}
          {working && <LiveDraft kind="studio" id={item.id} working invalidate={[getGetStudioItemQueryKey(item.id)]} fallback={null} progressKey={chatMode?undefined:reviewJob?.key} presentation={chatMode?"chat":"panel"} />}
          {item.status === "failed" && <div className="dr-alert" role="alert">{item.error || "This review could not be completed."}</div>}
          {view === "original" && !working && <>
            <p className="dr-note">Extracted text from your file, shown for review. Highlights mark exact quotes with a suggestion; select one to open it. Layout and formatting of the original file are not reproduced here.</p>
            <OriginalText content={item.content} suggestions={pending} onPick={focusCard} renderFigure={renderOriginalFigure} />
          </>}
          {view === "draft" && <DraftView draft={draft.data} loading={draft.isLoading} error={draft.isError ? draft.error : null} retry={() => void draft.refetch()} />}
        </div>
      </div>
    </section>

    <aside className={`es-panel dr-panel ${reportSlot ? "dr-panel-wide" : ""}`} aria-label="Review document and sources">
      <div className="es-panel-header"><PanelTabs idBase={`review-${item.id}`} label="Review document and sources" value={side} onChange={value => { if (value === "document" || value === "sources") setSide(value); }}
        tabs={[{ value: "document" as const, label: "Document", count: pending.length }, { value: "sources" as const, label: "Sources", count: review.sources.length }]} /><button className="es-icon" aria-label={(item.metadata as Record<string,unknown>)?.paperReview ? "Close review" : "Close review and return to chat"} onClick={onClose}><X /></button></div>
      {side === "sources" && <div className="dr-panel-scroll" role="tabpanel" id={`review-${item.id}-panel-sources`} aria-labelledby={`review-${item.id}-tab-sources`}>
        <SourcesList sources={mergeSources([{ origin: "This review", sources: review.sources }])} pending={working}
          note="Papers, patent records and web pages retrieved for this review. Suggestions compare your document only with these, not the whole literature."
          emptyBody={working ? "Sources are listed when the review finishes." : "No sources were returned with this review."} />
      </div>}
      <div className="dr-panel-scroll" role="tabpanel" id={`review-${item.id}-panel-document`} aria-labelledby={`review-${item.id}-tab-document`} style={side === "document" ? undefined : { display: "none" }}>
        {reportSlot}
        {!reportSlot && <p className="dr-eyebrow" data-testid="text-review-report-heading">Review report</p>}
        <Coverage review={review} working={working} metadata={item.metadata} />
        {conflict && <div className="dr-alert" role="alert" data-testid="status-review-conflict"><AlertTriangle />{conflict}</div>}
        {!working && item.status === "completed" && <>
          <div className="dr-filter" role="group" aria-label="Filter suggestions">
            <button aria-pressed={filter === "open"} onClick={() => setFilter("open")} data-testid="button-filter-open">Open ({pending.length})</button>
            <button aria-pressed={filter === "all"} onClick={() => setFilter("all")} data-testid="button-filter-all">All ({review.suggestions.length})</button>
            <span>{counts.approved} approved · {counts.dismissed} dismissed</span>
          </div>
          <div className="dr-legend" aria-label="Colour legend">{(["issue", "evidence", "style", "visual"] as const).map(k => <span key={k} className={`dr-pill dr-${k}`}>{SEVERITY_LABEL[k]}</span>)}</div>
          {shown.length === 0 && <div className="dr-empty" data-testid="status-review-empty"><Check /><p>{review.suggestions.length ? "Every suggestion has a decision. Switch to All to see them." : "No changes were suggested for the reviewed portion. That is not a guarantee the paper is error-free."}</p></div>}
          <ol className="dr-cards">{shown.map(s => <li key={s.id}>
            <SuggestionCard s={s} open={openId === s.id} onToggle={() => { setOpenId(openId === s.id ? null : s.id); setConfirmId(null); }}
              sources={s.sourceIds.map(id => sourceById.get(id)).filter((x): x is ReviewSource => !!x)}
              figure={s.imageId ? figures.find(f => f.id === s.imageId) : undefined} proposed={proposedFigure(s, figures)} itemId={item.id}
              confirming={confirmId === s.id} setConfirming={v => setConfirmId(v ? s.id : null)}
              busy={busyId === s.id} locked={!!busyId} onDecide={a => void run(s, a)}
              refEl={el => { cardRefs.current[s.id] = el; }} />
          </li>)}</ol>
        </>}
      </div>
    </aside>
  </>;
}

function OriginalText({ content, suggestions, onPick, renderFigure }: { content: string; suggestions: ReviewSuggestion[]; onPick: (id: string) => void; renderFigure: (id: string) => ReactNode }) {
  const taken = new Set<string>();
  const blocks = isolateMarkers(content).trim().split(/\n\s*\n/).filter(Boolean);
  if (!blocks.length) return <p className="dr-note">No text could be extracted from this file.</p>;
  return <div className="dr-text">{blocks.map((block, i) => {
    const fig = FIG.exec(block);
    if (fig) return <Fragment key={i}>{renderFigure(fig[1])}</Fragment>;
    const ranges = quoteRanges(block, suggestions, taken);
    const parts: ReactNode[] = []; let at = 0;
    ranges.forEach(r => {
      if (r.start > at) parts.push(block.slice(at, r.start));
      parts.push(<mark key={r.s.id} className={`dr-mark dr-${r.s.severity}`}><button type="button" onClick={() => onPick(r.s.id)} aria-label={`${SEVERITY_LABEL[r.s.severity]} suggestion: ${r.s.title}. Open details.`} data-testid={`button-highlight-${r.s.id}`}>{block.slice(r.start, r.end)}</button></mark>);
      at = r.end;
    });
    if (at < block.length) parts.push(block.slice(at));
    return /^#{1,3}\s/.test(block) && !ranges.length ? <h3 key={i} className="dr-h">{block.replace(/^#{1,3}\s+/, "")}</h3> : <p key={i}>{parts}</p>;
  })}</div>;
}

function DraftView({ draft, loading, error, retry }: { draft?: StudioItem; loading: boolean; error: unknown; retry: () => void }) {
  if (loading) return <RowSkeleton rows={3} />;
  if (error) return <ErrorState error={error} onRetry={retry} title="Couldn't load the working draft" />;
  if (!draft) return <p className="dr-note">No working draft yet. Approving a suggestion creates one.</p>;
  const figs = figuresOf(draft); const order = markerOrder(draft.content);
  const render = (fid: string) => { const f = figs.find(x => x.id === fid); return f ? <FigureView itemId={draft.id} figure={f} number={order.indexOf(fid) + 1} /> : <MissingFigure id={fid} />; };
  return <>
    <p className="dr-note dr-note-draft">Working draft, revision {draft.revision}. Built from the extracted text plus only the changes you approved. It is a converted text draft, not an edit of your original file layout. Export uses this draft; your uploaded file stays unchanged.</p>
    <AcademicAnswer content={draft.content} inline={plain} renderFigure={render} />
  </>;
}

function Coverage({ review, working, metadata }: { review: ReturnType<typeof reviewOf>; working: boolean; metadata: unknown }) {
  const c = review.coverage;
  const textPct = pct(c.textCharacters, c.totalTextCharacters);
  return <section className="dr-coverage" aria-label="What was reviewed" data-testid="panel-review-coverage">
    <p className="dr-eyebrow">What was reviewed</p>
    {working ? <p className="dr-note">Coverage appears when the review finishes.</p> : <>
      <dl className="dr-meters">
        <div><dt>Text</dt><dd>{c.textCharacters.toLocaleString()} of {c.totalTextCharacters.toLocaleString()} characters <b>({textPct}%)</b></dd><span className="dr-bar"><i style={{ transform: `scaleX(${textPct / 100})` }} /></span></div>
        <div><dt>Visuals</dt><dd>{c.visualsReviewed} of {c.visualsAvailable} reviewed{c.visualLabels.length ? `: ${c.visualLabels.join(", ")}` : ""}</dd><span className="dr-bar"><i style={{ transform: `scaleX(${pct(c.visualsReviewed, c.visualsAvailable) / 100})` }} /></span></div>
      </dl>
      {c.scope && <p className="dr-note">{c.scope}</p>}
      <p className="dr-note">Compared against {review.sources.length} retrieved source{review.sources.length === 1 ? "" : "s"} only, not the whole literature. Suggestions are AI-assisted and need your judgement; this is not a plagiarism, accuracy or patentability check.</p>
      <p className="dr-note" data-testid="text-review-privacy">Privacy: your request and the document's text and images were sent to our AI processing service for this review. Only short topic queries, not the uploaded file, went to scholarly and patent search providers.</p>
      <div className={`dr-patent ${review.patent.available ? "ok" : "off"}`} data-testid="status-patent">
        <span className="dr-status-tag">{review.patent.available ? "Patents searched" : "Patents not searched"}</span>
        <p>{review.patent.message || (review.patent.available ? "Patent results were included where relevant." : "Patent search was unavailable for this review.")}</p>
        {review.patent.links.length > 0 && <ul>{review.patent.links.map(l => <li key={l.url}><a href={l.url} target="_blank" rel="noreferrer">{l.label}<ExternalLink /></a></li>)}</ul>}
      </div>
      {review.warnings.length > 0 && <div className="dr-warnings" role="status" data-testid="list-review-warnings"><p><AlertTriangle />Limits of this review</p><ul>{review.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></div>}
      {review.sources.length > 0 && <details className="dr-sources"><summary>Retrieved sources ({review.sources.length})<ChevronDown /></summary><ol>{review.sources.map(s => <li key={s.id}>{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title}{s.evidenceLevel && <small> · {s.evidenceLevel}</small>}</li>)}</ol></details>}
    </>}
  </section>;
}

type CardProps = {
  s: ReviewSuggestion; open: boolean; onToggle: () => void; sources: ReviewSource[]; figure?: StudioFigure; proposed?: StudioFigure; itemId: string;
  confirming: boolean; setConfirming: (v: boolean) => void; busy: boolean; locked: boolean; onDecide: (a: "approve" | "dismiss") => void;
  refEl: (el: HTMLDivElement | null) => void;
};

function SuggestionCard({ s, open, onToggle, sources, figure, proposed, itemId, confirming, setConfirming, busy, locked, onDecide, refEl }: CardProps) {
  const pending = s.decision === "pending";
  const panelId = `dr-body-${s.id}`;
  return <div ref={refEl} className={`dr-card dr-${s.severity} ${open ? "is-open" : ""} is-${s.decision}`} data-testid={`card-suggestion-${s.id}`}>
    <button type="button" className="dr-card-head" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
      <span className="dr-card-tags">
        <span className={`dr-pill dr-${s.severity}`}>{SEVERITY_LABEL[s.severity]}</span>
        {s.type === "diagram" && <span className="dr-tag"><ImageIcon />Figure</span>}
        <span className={`dr-tag dr-decision-${s.decision}`} data-testid={`status-suggestion-${s.id}`}>{DECISION_LABEL[s.decision]}</span>
      </span>
      <span className="dr-card-title">{s.title}</span>
      <ChevronDown className="dr-chev" />
    </button>
    {!open && <div className="dr-peek" aria-hidden="true">
      <p><b>Why:</b> {s.explanation || "No explanation provided."}</p>
      {s.proposedText && <p><b>Change to:</b> {s.proposedText.length > 160 ? `${s.proposedText.slice(0, 160)}...` : s.proposedText}</p>}
      <p className="dr-peek-hint">Click or press Enter for the full comparison</p>
    </div>}
    {open && <div className="dr-card-body" id={panelId}>
      <p className="dr-why"><b>Why this was flagged.</b> {s.explanation || "No explanation provided."}</p>
      {s.type === "diagram" && <div className="dr-figure-note">
        <p className="dr-label">Original figure{figure?.title ? `: ${figure.title}` : ""}</p>
        {figure ? <FigureView itemId={itemId} figure={figure} number={1} /> : <p className="dr-note">{s.imageId ? "The original image preview is not available for this suggestion." : "This suggestion refers to a page image, not an exact figure crop."}</p>}
        {proposed ? <><p className="dr-label">Proposed figure (preview, not yet applied)</p><FigureView itemId={itemId} figure={proposed} number={2} /></>
          : <p className="dr-note">No corrected figure was drawn for this suggestion. Below is the structured change to make.</p>}
      </div>}
      <div className="dr-compare">
        <div className="dr-before"><p className="dr-label">Before</p><p>{s.originalText || <i>No exact text quoted.</i>}</p></div>
        <div className="dr-after"><p className="dr-label">After (proposed)</p><p>{s.proposedText || <i>No replacement text proposed.</i>}</p></div>
      </div>
      {sources.length > 0 && <div className="dr-cites"><p className="dr-label">Evidence cited</p><ol>{sources.map(src => <li key={src.id}>
        {src.url ? <a href={src.url} target="_blank" rel="noreferrer">{src.title}<ExternalLink /></a> : <span>{src.title}</span>}
        {src.evidenceLevel && <span className="dr-tag">{src.evidenceLevel}</span>}
        {src.text && <blockquote>{src.text.length > 320 ? `${src.text.slice(0, 320)}...` : src.text}</blockquote>}
      </li>)}</ol></div>}
      {s.sourceIds.length > 0 && sources.length === 0 && <p className="dr-note">The cited sources were not returned with this review.</p>}
      {pending && !s.canApply && <p className="dr-action-needed" role="note"><AlertTriangle />Action needed: Evidora cannot apply this change automatically. If you agree, edit your paper yourself and check it against the cited evidence, then dismiss this card. Following the guidance does not make the result scientifically guaranteed.</p>}
      {pending && <div className="dr-actions">
        {!confirming ? <>
          <button className="es-button es-primary dr-small" disabled={!s.canApply || locked} onClick={() => setConfirming(true)} data-testid={`button-approve-${s.id}`}><Check />Approve this change</button>
          <button className="es-button dr-small" disabled={locked} onClick={() => onDecide("dismiss")} data-testid={`button-dismiss-${s.id}`}>{busy ? "Saving..." : "Dismiss"}</button>
        </> : <div className="dr-confirm" role="group" aria-label="Confirm approval">
          <p>Apply only this change to a new working-draft revision? Your original file and earlier revisions are not modified. Approval records your choice; it does not verify that the change is scientifically correct.</p>
          <div><button className="es-button es-primary dr-small" disabled={locked} onClick={() => onDecide("approve")} data-testid={`button-confirm-approve-${s.id}`}>{busy ? <><RefreshCw className="dr-spin" />Applying...</> : "Yes, write new draft"}</button>
          <button className="es-button dr-small" disabled={busy} onClick={() => setConfirming(false)} data-testid={`button-cancel-approve-${s.id}`}>Cancel</button></div>
        </div>}
      </div>}
    </div>}
  </div>;
}
