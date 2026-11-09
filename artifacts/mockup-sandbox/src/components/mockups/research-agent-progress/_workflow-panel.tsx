import { useId, useState } from "react";
import { BarChart3, Bell, BookOpen, Check, ChevronDown, Compass, Database, FileText, Lightbulb, ListChecks, Minus, PenLine, Save, ScanSearch, Search, ShieldCheck, Upload, type LucideIcon } from "lucide-react";
import { STATE_LABEL, TONES, type RoleIcon, type WorkflowView } from "./_agent-workflow";
import "./_agent-progress.css";

export const ICONS: Record<RoleIcon, LucideIcon> = {
  compass: Compass, search: Search, book: BookOpen, pen: PenLine, shield: ShieldCheck, chart: BarChart3, upload: Upload,
  file: FileText, database: Database, bell: Bell, scan: ScanSearch, list: ListChecks, lightbulb: Lightbulb, save: Save,
};

/** Presentational five-role workflow. Used by the shared popup and inline in the upload dialog. */
export function WorkflowPanel({ view, preview, connection, compact, titleId }: { view: WorkflowView; preview?: string; connection?: string; compact?: boolean; titleId?: string }) {
  const active = view.activeIndex >= 0 ? view.tiles[view.activeIndex] : null;
  const tone = active ? TONES[active.index] : "208 68% 34%";
  const HeroIcon = active ? ICONS[active.role.icon] : view.phase === "queued" ? ListChecks : ScanSearch;
  const [showPreview, setShowPreview] = useState(false);
  const previewId = useId();
  const counter = active ? `Role ${active.index + 1} of ${view.tiles.length}` : view.phase === "queued" ? "Queued" : "Stage not reported";
  return (
    <div className={`ap-panel ${compact ? "is-compact" : ""}`} style={{ ["--ap-tone" as string]: tone }} data-testid="panel-agent-workflow">
      <div className="ap-hero">
        <div className={`ap-hero-icon ${active ? "is-live" : "is-wait"}`} aria-hidden><HeroIcon /></div>
        <p className="ap-eyebrow">{view.workflow} <span>·</span> {counter}</p>
        <h2 className="ap-agent" id={titleId}>{active ? `${active.role.name} Agent` : view.phase === "queued" ? "Waiting in queue" : "Working"}</h2>
        <p className="ap-task" role="status" aria-live="polite" aria-atomic="true" data-testid="text-agent-status">{view.statusLine}</p>
        <p className="ap-subject" title={view.title}>{view.title}</p>
      </div>

      <div className={`ap-bar ${view.indeterminate ? "is-indeterminate" : ""}`} role="progressbar" aria-label={`${view.workflow} progress`}
        aria-valuemin={0} aria-valuemax={view.tiles.length} aria-valuenow={view.indeterminate ? undefined : view.activeIndex + 1}
        aria-valuetext={active ? `${active.role.name}: ${view.statusLine}` : view.statusLine}>
        {view.indeterminate ? <span className="ap-bar-scan" /> : view.tiles.map(t => <span key={t.role.id} className={`is-${t.state}`} style={{ ["--ap-tone" as string]: TONES[t.index] }} />)}
      </div>

      <ol className="ap-tiles" aria-label="Workflow roles">
        {view.tiles.map(t => {
          const Icon = ICONS[t.role.icon];
          return (
            <li key={t.role.id} className={`ap-tile is-${t.state}`} style={{ ["--ap-tone" as string]: TONES[t.index] }} aria-current={t.state === "active" ? "step" : undefined} data-testid={`tile-role-${t.role.id}`}>
              <span className="ap-tile-icon" aria-hidden><Icon /></span>
              <strong>{t.role.name} Agent</strong>
              <span className="ap-tile-state">
                {t.state === "done" ? <Check aria-hidden /> : t.state === "skipped" || t.state === "unreported" ? <Minus aria-hidden /> : t.state === "active" ? <i className="ap-dot" aria-hidden /> : null}
                {STATE_LABEL[t.state]}
              </span>
              {!compact && <small>{t.detail}</small>}
            </li>
          );
        })}
      </ol>

      <p className="ap-helper">Workflow roles are steps in one pipeline, not separate agents running at once. Progress follows server-reported stages, not a timer.{view.note ? ` ${view.note}` : ""}</p>

      {preview !== undefined && (
        <div className="ap-preview">
          <button type="button" className="ap-preview-toggle" aria-expanded={showPreview} aria-controls={previewId} onClick={() => setShowPreview(v => !v)} data-testid="button-toggle-preview">
            <span>Live draft preview <em>unverified</em>{connection ? <small> · {connection}</small> : null}</span><ChevronDown aria-hidden />
          </button>
          {showPreview && <div id={previewId} className="ap-preview-text" aria-live="off" data-testid="text-preview">{preview.trim() ? preview : "No draft text has streamed yet."}</div>}
        </div>
      )}
    </div>
  );
}
