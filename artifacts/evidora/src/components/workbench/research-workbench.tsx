import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { StudioItem } from "@workspace/api-client-react";
import { BookOpen, ExternalLink, FileText, MessagesSquare } from "lucide-react";
import { AcademicAnswer } from "@/components/academic-answer";
import { FigureView, MissingFigure } from "@/components/studio/figure-view";
import { ExportButtons, withoutRepeatedTitle } from "@/components/studio/item-workspace";
import { figuresOf, markerOrder } from "@/lib/figures";
import { isWorking, KIND_LABEL, meta } from "@/lib/studio";
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

export type WorkbenchTab = "document" | "sources";

/**
 * Conversation on the left; persistent Document and Sources tabs on the right.
 * Every pane stays mounted, so switching tabs never resets edits or live writing.
 */
export function ResearchWorkbench({ conversation, document, sources, sourceCount, tab: controlled, onTab, label = "Research workspace", idBase = "wb" }: {
  conversation: ReactNode; document: ReactNode; sources: ReactNode; sourceCount?: number;
  tab?: WorkbenchTab; onTab?: (t: WorkbenchTab) => void; label?: string; idBase?: string;
}) {
  const [own, setOwn] = useState<WorkbenchTab>("document");
  const tab = controlled ?? own;
  const setTab = (t: WorkbenchTab) => { setOwn(t); onTab?.(t); };
  const [mobile, setMobile] = useState<"conversation" | WorkbenchTab>("conversation");
  const pickMobile = (v: "conversation" | WorkbenchTab) => { setMobile(v); if (v !== "conversation") setTab(v); };
  return <div className="wb rise" data-mobile={mobile} aria-label={label} data-testid="research-workbench">
    <div className="wb-mobile-switch" role="group" aria-label="Show">
      <button type="button" aria-pressed={mobile === "conversation"} onClick={() => pickMobile("conversation")} data-testid="button-mobile-conversation">Conversation</button>
      <button type="button" aria-pressed={mobile === "document"} onClick={() => pickMobile("document")} data-testid="button-mobile-document">Document</button>
      <button type="button" aria-pressed={mobile === "sources"} onClick={() => pickMobile("sources")} data-testid="button-mobile-sources">Sources{typeof sourceCount === "number" ? ` (${sourceCount})` : ""}</button>
    </div>
    <section className="wb-pane wb-left" aria-label="Conversation and follow-ups">{conversation}</section>
    <section className="wb-pane wb-right" aria-label="Document and sources">
      <div className="wb-right-head">
        <PanelTabs idBase={idBase} label="Document and sources" value={tab} onChange={setTab}
          tabs={[{ value: "document", label: "Document", icon: <FileText /> }, { value: "sources", label: "Sources", count: sourceCount, icon: <BookOpen /> }]} />
      </div>
      <div className="wb-right-body">
        <div className="wb-tabpanel" role="tabpanel" id={`${idBase}-panel-document`} aria-labelledby={`${idBase}-tab-document`} hidden={tab !== "document"}>{document}</div>
        <div className="wb-tabpanel" role="tabpanel" id={`${idBase}-panel-sources`} aria-labelledby={`${idBase}-tab-sources`} hidden={tab !== "sources"}>{sources}</div>
      </div>
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

/** Read-only checked document view for surfaces whose editor lives in the conversation (ideas chat). */
export function StudioReadPane({ item, onFocusConversation }: { item?: StudioItem; onFocusConversation?: () => void }) {
  if (!item) return <div className="wb-doc-pad"><div className="wb-empty"><b>No document open</b>Open an idea, answer or draft from the conversation to read it here.</div></div>;
  if (isWorking(item.status)) return <div className="wb-doc-pad"><div className="wb-empty" data-testid="status-doc-writing"><b>Being written</b>The live text is shown in the conversation turn so it is streamed only once. The checked version opens here when it finishes.</div></div>;
  if (item.status === "failed") return <div className="wb-doc-pad"><div className="wb-empty"><b>Did not finish</b>{item.error || "The server reported a failure."} Use Try again on the turn in the conversation.</div></div>;
  if (item.kind === "ideas") return <div className="wb-doc-pad"><div className="wb-empty"><b>{item.title}</b>Five idea cards are reviewed one by one in the conversation. Confirm one to get an editable document you can read and export here.</div></div>;
  const figures = figuresOf(item);
  const order = markerOrder(item.content);
  const renderFigure = (fid: string) => { const f = figures.find(x => x.id === fid); return f ? <FigureView itemId={item.id} figure={f} number={order.indexOf(fid) + 1} /> : <MissingFigure id={fid} />; };
  return <article className="mx-auto w-full max-w-[760px] px-5 py-6 md:px-9" data-testid={`doc-read-${item.id}`}>
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="sx-chip">{KIND_LABEL[item.kind] ?? item.kind}</span><span className="sx-chip">rev {item.revision}</span>
      <span className="ml-auto inline-flex gap-1.5"><ExportButtons item={item} /></span>
    </div>
    <h2 className="sx-title text-[28px] leading-tight md:text-[32px]">{item.title}</h2>
    <div className="mt-5">{item.content.trim() ? <AcademicAnswer content={withoutRepeatedTitle(item.content, item.title)} inline={t => t} renderFigure={renderFigure} referenceSources={meta(item).sources} linkCitations /> : <p className="text-sm text-muted-foreground">No text.</p>}</div>
    {onFocusConversation && <button type="button" className="sx-btn mt-6" onClick={onFocusConversation} data-testid="button-edit-in-conversation"><MessagesSquare />Edit, versions and checks are on this turn in the conversation</button>}
  </article>;
}
