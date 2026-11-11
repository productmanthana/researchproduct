import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { sourceKindCounts, type ProvenancedSource, type SourceKind } from "@/lib/source-provenance";
import "./workbench.css";

type TabDef<T extends string> = { value: T; label: string; count?: number; icon?: ReactNode };

/** Accessible tablist (arrow keys, Home/End, roving tabindex). Panels use `${idBase}-panel-${value}`. */
export function PanelTabs<T extends string>({ tabs, value, onChange, idBase, label }: { tabs: TabDef<T>[]; value: T; onChange: (v: T) => void; idBase: string; label: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex(t => t.value === value);
    let n = -1;
    if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = tabs.length - 1;
    if (n < 0) return;
    e.preventDefault();
    onChange(tabs[n].value);
    refs.current[n]?.focus();
  };
  return <div className="wb-tabs" role="tablist" aria-label={label} onKeyDown={onKey}>
    {tabs.map((t, i) => <button key={t.value} ref={el => { refs.current[i] = el; }} type="button" role="tab" className="wb-tab"
      id={`${idBase}-tab-${t.value}`} aria-controls={`${idBase}-panel-${t.value}`} aria-selected={value === t.value} tabIndex={value === t.value ? 0 : -1}
      onClick={() => onChange(t.value)} data-testid={`tab-${idBase}-${t.value}`}>
      {t.icon}{t.label}{typeof t.count === "number" && <span className="wb-count">{t.count}</span>}
    </button>)}
  </div>;
}

/**
 * Conversation (each question followed by its full response, editor and follow-ups) in the main pane;
 * Sources in a secondary pane. Both stay mounted, so toggling sources on mobile never resets edits or live writing.
 */
export function ResearchWorkbench({ conversation, sources, sourceCount, label = "Research workspace", idBase = "wb" }: {
  conversation: ReactNode; sources: ReactNode; sourceCount?: number; label?: string; idBase?: string;
}) {
  const [mobile, setMobile] = useState<"conversation" | "sources">("conversation");
  return <div className="wb rise" data-mobile={mobile} aria-label={label} data-testid="research-workbench">
    <div className="wb-mobile-switch" role="group" aria-label="Show">
      <button type="button" aria-pressed={mobile === "conversation"} onClick={() => setMobile("conversation")} data-testid="button-mobile-conversation">Conversation</button>
      <button type="button" aria-pressed={mobile === "sources"} onClick={() => setMobile("sources")} data-testid="button-mobile-sources">Sources{typeof sourceCount === "number" ? ` (${sourceCount})` : ""}</button>
    </div>
    <section className="wb-pane wb-left" aria-label="Conversation">{conversation}</section>
    <section className="wb-pane wb-right" aria-label="Sources" id={`${idBase}-sources`}>
      <div className="wb-right-body">{sources}</div>
    </section>
  </div>;
}

const KIND_META: Record<SourceKind, { label: string; tone: string }> = {
  scholarly: { label: "Scholarly", tone: "hsl(208 68% 31%)" },
  patent: { label: "Patent", tone: "hsl(8 64% 44%)" },
  project: { label: "Project material", tone: "hsl(158 45% 30%)" },
  web: { label: "Web", tone: "hsl(36 70% 36%)" },
};

/** Saved sources with provenance and original links. Empty states say exactly what is (not) there. */
export function SourcesList({ sources, pending, retrieved, title = "Sources", note, emptyBody, extra }: {
  sources: ProvenancedSource[]; pending?: boolean; retrieved?: boolean; title?: string; note?: ReactNode; emptyBody?: ReactNode; extra?: ReactNode;
}) {
  const [kind, setKind] = useState<SourceKind | "all">("all");
  const [q, setQ] = useState("");
  const counts = useMemo(() => sourceKindCounts(sources), [sources]);
  const shown = sources.filter(s => (kind === "all" || s.kind === kind) && `${s.title} ${s.excerpt}`.toLowerCase().includes(q.trim().toLowerCase()));
  const abstractOnly = sources.some(s => s.abstractOnly);
  return <div className="wb-src" data-testid="panel-sources">
    <div className="wb-src-head"><h2>{title}</h2><span className="wb-count" data-testid="text-source-count">{sources.length}</span></div>
    <p className="wb-src-note">{note ?? "Sources saved with this work. Type labels are inferred from each link; open the original to confirm."}</p>
    {retrieved && sources.length > 0 && <p className="wb-empty mt-3" role="status" data-testid="status-sources-retrieved"><b>Retrieved evidence</b>Available inputs for this request. Writing and source checks are not complete; the final list replaces this when the response finishes.</p>}
    {extra}
    {sources.length === 0 ? <div className="wb-empty mt-3" data-testid="status-sources-empty">
      <b>{pending ? "Still gathering" : "No sources saved"}</b>
      {emptyBody ?? (pending ? "Sources are attached when writing finishes. You can keep reading the conversation meanwhile." : "This work has no saved scholarly, patent, project or web sources. Nothing has been added here on its behalf.")}
    </div> : <>
      <div className="wb-filter" role="group" aria-label="Filter sources by type">
        <button type="button" className="wb-chip" aria-pressed={kind === "all"} onClick={() => setKind("all")} data-testid="button-source-filter-all">All {sources.length}</button>
        {(Object.keys(KIND_META) as SourceKind[]).filter(k => counts[k] > 0).map(k => <button key={k} type="button" className="wb-chip" aria-pressed={kind === k} onClick={() => setKind(k)} data-testid={`button-source-filter-${k}`}>{KIND_META[k].label} {counts[k]}</button>)}
      </div>
      {sources.length > 6 && <input className="wb-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search source titles and excerpts" aria-label="Search sources" data-testid="input-source-search" />}
      {abstractOnly && <p className="wb-src-note">Some entries rest on abstract metadata only. An abstract is not full-text evidence and does not establish novelty.</p>}
      <ol className="wb-src-list">
        {shown.map((s, i) => <li key={s.key} className="wb-src-card" style={{ ["--wb-tone" as string]: KIND_META[s.kind].tone }} data-testid={`card-source-${i}`}>
          <p className="wb-src-kind">{KIND_META[s.kind].label}{s.abstractOnly ? " · abstract only" : ""}</p>
          <p className="wb-src-title">{s.title}</p>
          {s.excerpt && <p className="wb-src-excerpt">{s.excerpt}</p>}
          <div className="wb-src-meta">
            {s.evidenceLevel && <span>{s.evidenceLevel}</span>}
            <span>From {s.origins.join("; ")}</span>
            {s.url ? <a className="wb-src-link" href={s.url} target="_blank" rel="noopener noreferrer" data-testid={`link-source-original-${i}`}>Open original<ExternalLink /></a> : <span>No public link (project material)</span>}
          </div>
        </li>)}
      </ol>
      {!shown.length && <p className="wb-src-note">No sources match this filter.</p>}
    </>}
  </div>;
}
