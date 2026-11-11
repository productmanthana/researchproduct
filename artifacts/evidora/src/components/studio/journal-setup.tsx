import { useEffect, useState, type ReactNode } from "react";
import { useListCustomFormats, getListCustomFormatsQueryKey, useListStudioTemplates, type CustomFormat } from "@workspace/api-client-react";
import { AlertTriangle, BookMarked, FileText, Image as ImageIcon, SlidersHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TemplatePicker } from "./template-picker";
import { DocumentDetailsFields } from "./document-details";
import { JOURNAL_DEFAULT_FORMAT, LENGTHS, defaultJournalSetup, journalSetupProblem, type JournalLength, type JournalSetup, type JournalTarget } from "@/lib/journal-setup";

const inch = (pt: number) => (pt / 72).toFixed(2);
const mm = (pt: number) => ((pt / 72) * 25.4).toFixed(1);

function Seg({ value, options, onChange, name }: { value: string; options: [string, string][]; onChange: (v: string) => void; name: string }) {
  return (
    <div role="radiogroup" aria-label={name} className="inline-flex w-full rounded-md border border-[hsl(110_14%_80%)] p-0.5">
      {options.map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={`flex-1 rounded px-2 py-1.5 text-xs transition-colors ${value === v ? "bg-[hsl(var(--cyan-ink))] text-[hsl(42_40%_97%)]" : "hover:bg-[hsl(90_20%_90%)]"}`}
          data-testid={`seg-setup-${name.toLowerCase().replace(/\s+/g, "-")}-${v}`}>{l}</button>
      ))}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return <section className="space-y-2.5" aria-label={title}>
    <p className="flex items-center gap-2 text-sm font-medium"><span className="grid h-5 w-5 place-items-center rounded-full bg-[hsl(var(--teal)/0.12)] font-mono text-[10.5px] text-[hsl(var(--teal))]">{n}</span>{title}</p>
    {children}
  </section>;
}

const TARGETS: { v: JournalTarget; title: string; body: string; icon: ReactNode }[] = [
  { v: "preset", title: "A specific journal", body: "Use a saved layout for the journal you plan to submit to.", icon: <BookMarked /> },
  { v: "general", title: "General academic draft", body: "Standard single-column manuscript. Choose a journal later.", icon: <FileText /> },
  { v: "custom", title: "My own settings", body: "Set page, type, columns, margins and citations yourself.", icon: <SlidersHorizontal /> },
];

function CustomFields({ f, onChange }: { f: CustomFormat; onChange: (f: CustomFormat) => void }) {
  const saved = useListCustomFormats({ query: { queryKey: getListCustomFormatsQueryKey() } });
  const [sections, setSections] = useState(f.sectionOrder.join(", "));
  const set = <K extends keyof CustomFormat>(k: K, v: CustomFormat[K]) => onChange({ ...f, [k]: v });
  const savedList = saved.data ?? [];
  return (
    <div className="space-y-3 rounded-lg border bg-[hsl(52_40%_98%)] p-3" data-testid="panel-setup-custom">
      {(saved.isLoading || savedList.length > 0 || saved.isError) && <div>
        <label className="block text-xs font-medium" htmlFor="js-saved">Start from a saved personal format</label>
        {saved.isLoading ? <div className="mt-1 h-9 animate-pulse rounded bg-[hsl(40_24%_90%)]" />
          : saved.isError ? <p className="mt-1 text-xs text-vermilion">Couldn't load saved formats. <button type="button" className="underline" onClick={() => void saved.refetch()}>Retry</button></p>
          : <select id="js-saved" className="sx-input mt-1" defaultValue="" onChange={e => { const p = savedList.find(x => x.id === e.target.value); if (p) { const next = { ...JOURNAL_DEFAULT_FORMAT, ...p.format }; onChange(next); setSections(next.sectionOrder.join(", ")); } }} data-testid="select-setup-saved-format">
            <option value="">Choose one, or set values below</option>
            {savedList.map(p => <option key={p.id} value={p.id}>{p.name}{p.kind ? ` (${p.kind})` : ""}</option>)}
          </select>}
      </div>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><p className="text-xs font-medium">Paper size</p><Seg name="Paper size" value={f.size} options={[["A4", "A4"], ["LETTER", "Letter"]]} onChange={v => set("size", v as CustomFormat["size"])} /></div>
        <div className="space-y-1"><p className="text-xs font-medium">Columns</p><Seg name="Columns" value={String(f.columns)} options={[["1", "One"], ["2", "Two"]]} onChange={v => set("columns", (v === "2" ? 2 : 1) as CustomFormat["columns"])} /></div>
        <div className="space-y-1"><p className="text-xs font-medium">Typeface</p><Seg name="Typeface" value={f.fontFamily} options={[["serif", "Serif"], ["sans", "Sans"]]} onChange={v => set("fontFamily", v as CustomFormat["fontFamily"])} /></div>
        <div className="space-y-1"><p className="text-xs font-medium">Citation style</p><Seg name="Citation style" value={f.citationStyle} options={[["numbered", "Numbered [1]"], ["author-year", "Author-year"]]} onChange={v => set("citationStyle", v as CustomFormat["citationStyle"])} /></div>
        <label className="block space-y-1 text-xs font-medium">Font size: {f.fontSize} pt
          <input type="range" min={8} max={16} step={0.5} value={f.fontSize} onChange={e => set("fontSize", +e.target.value)} className="w-full accent-[hsl(var(--cyan-ink))]" data-testid="input-setup-font-size" /></label>
        <label className="block space-y-1 text-xs font-medium">Line spacing: {f.lineSpacing.toFixed(2)}
          <input type="range" min={1} max={2.5} step={0.05} value={f.lineSpacing} onChange={e => set("lineSpacing", +e.target.value)} className="w-full accent-[hsl(var(--cyan-ink))]" data-testid="input-setup-line-spacing" /></label>
      </div>
      <fieldset className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <legend className="mb-1 text-xs font-medium">Margins in points (18 to 144; 72 pt = 1 in = 25.4 mm)</legend>
        {(["top", "right", "bottom", "left"] as const).map(k => (
          <label key={k} className="text-[11px]"><span className="capitalize">{k}</span>
            <input type="number" min={18} max={144} className="sx-input mt-0.5" value={f.margins[k]} onChange={e => set("margins", { ...f.margins, [k]: +e.target.value })} onBlur={e => set("margins", { ...f.margins, [k]: Math.min(144, Math.max(18, Math.round(+e.target.value) || 72)) })} data-testid={`input-setup-margin-${k}`} />
            <span className="font-mono text-[10px] text-muted-foreground">{inch(f.margins[k])} in &middot; {mm(f.margins[k])} mm</span>
          </label>
        ))}
      </fieldset>
      <label className="block text-xs font-medium">Section order (optional, comma separated)
        <input className="sx-input mt-1 font-normal" value={sections} placeholder="Introduction, Related work, Methodology, Discussion, Conclusion" onChange={e => { setSections(e.target.value); set("sectionOrder", e.target.value.split(",").map(s => s.trim()).filter(Boolean).slice(0, 30)); }} data-testid="input-setup-sections" /></label>
      <label className="block text-xs font-medium">Instructions to keep with this format (optional)
        <textarea className="sx-input mt-1 min-h-[70px] font-normal" maxLength={16000} value={f.instructions} placeholder="e.g. Abstract under 250 words, keywords after the abstract, no footnotes." onChange={e => set("instructions", e.target.value)} data-testid="input-setup-instructions" /></label>
      <p className="flex gap-1.5 rounded-md border border-[hsl(var(--turmeric)/0.6)] bg-[hsl(var(--turmeric)/0.1)] p-2 text-[11px]"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(30_60%_32%)]" />These are your own choices. They are applied to the draft and to PDF and Word exports, but they are not automatically verified as compliant with any journal's official instructions.</p>
    </div>
  );
}

/** The whole setup as one form. `showDetails` is off where the host composer already collects title-page details. */
export function JournalSetupForm({ value, onChange, showDetails = true }: { value: JournalSetup; onChange: (s: JournalSetup) => void; showDetails?: boolean }) {
  const set = <K extends keyof JournalSetup>(k: K, v: JournalSetup[K]) => onChange({ ...value, [k]: v });
  let n = 0;
  return (
    <div className="space-y-5" data-testid="form-journal-setup">
      <Step n={++n} title="Format">
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Format">
          {TARGETS.map(t => {
            const on = value.target === t.v;
            return <button key={t.v} type="button" role="radio" aria-checked={on} onClick={() => set("target", t.v)}
              className={`rounded-lg border p-3 text-left transition-colors [&_svg]:h-4 [&_svg]:w-4 ${on ? "border-[hsl(var(--teal))] bg-[hsl(var(--teal)/0.08)]" : "bg-[hsl(52_40%_98%)] hover:bg-[hsl(90_20%_93%)]"}`} data-testid={`button-setup-target-${t.v}`}>
              <span className="flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--ink-teal))]"><span className="text-[hsl(var(--teal))]">{t.icon}</span>{t.title}</span>
              <span className="mt-1 block text-[11.5px] leading-snug text-muted-foreground">{t.body}</span>
            </button>;
          })}
        </div>
        {value.target === "preset" && <div className="rounded-lg border bg-[hsl(52_40%_98%)] p-3"><TemplatePicker kind="journal" compact value={value.templateId} onChange={t => set("templateId", t?.id ?? null)} label="Choose a journal" /></div>}
        {value.target === "custom" && <CustomFields f={value.customFormat} onChange={f => set("customFormat", f)} />}
      </Step>
      {showDetails && <Step n={++n} title="Title page (optional)">
        <DocumentDetailsFields kind="journal" value={value.details} onChange={d => set("details", d)} note="Leave blank to add later. Evidora never invents author names or affiliations." />
      </Step>}
      <Step n={++n} title="Target length">
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Target length">
          {(Object.keys(LENGTHS) as JournalLength[]).map(k => {
            const on = value.length === k;
            return <button key={k} type="button" role="radio" aria-checked={on} onClick={() => set("length", k)} className={`rounded-lg border px-3 py-2 text-left ${on ? "border-[hsl(var(--teal))] bg-[hsl(var(--teal)/0.08)]" : "bg-[hsl(52_40%_98%)] hover:bg-[hsl(90_20%_93%)]"}`} data-testid={`button-setup-length-${k}`}>
              <span className="block text-sm font-medium">{LENGTHS[k].label}</span>
              <span className="block font-mono text-[10.5px] text-muted-foreground">{LENGTHS[k].words}</span>
              <span className="block text-[11px] text-muted-foreground">{LENGTHS[k].hint}</span>
            </button>;
          })}
        </div>
        <p className="text-[11px] text-muted-foreground">A target, not a guarantee. Page counts depend on layout, and Evidora writes less rather than padding with unsupported claims.</p>
      </Step>
      <Step n={++n} title="Diagrams">
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-[hsl(52_40%_98%)] p-3" data-testid="toggle-setup-figures">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[hsl(var(--teal))]" checked={value.includeFigures} onChange={e => set("includeFigures", e.target.checked)} data-testid="input-setup-include-figures" />
          <span className="text-sm"><span className="flex items-center gap-1.5 font-medium"><ImageIcon className="h-4 w-4 text-[hsl(var(--teal))]" />Include scientific diagrams</span>
            <span className="mt-0.5 block text-[11.5px] text-muted-foreground">Conceptual illustrations grounded in the cited sources, such as method or system overviews. Quantitative charts are only drawn from real data you or the sources provide; none are made up.</span></span>
        </label>
      </Step>
    </div>
  );
}

type DialogProps = { open: boolean; topic: string; initial?: JournalSetup; pending?: boolean; onCancel: () => void; onConfirm: (s: JournalSetup) => void };

export function JournalSetupDialog({ open, topic, initial, pending, onCancel, onConfirm }: DialogProps) {
  const [s, setS] = useState(() => initial ?? defaultJournalSetup(topic));
  useEffect(() => { if (open) setS(initial ?? defaultJournalSetup(topic)); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const templates = useListStudioTemplates();
  const problem = journalSetupProblem(s);
  const tplName = (templates.data ?? []).find(t => t.id === s.templateId)?.name;
  return (
    <Dialog open={open} onOpenChange={o => { if (!o && !pending) onCancel(); }}>
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-3xl overflow-hidden bg-[hsl(52_30%_96%)] p-0" data-testid="dialog-journal-setup">
        <div className="flex max-h-[92dvh] flex-col">
          <DialogHeader className="border-b px-5 pb-3 pt-5 text-left">
            <p className="sx-eyebrow">Before writing</p>
            <DialogTitle className="sx-title text-2xl">Set up your journal draft</DialogTitle>
            <DialogDescription className="text-xs">One step, then Evidora writes an evidence-grounded draft for review. It is a working manuscript, not a submission-ready paper; you can change the format again after it is written.</DialogDescription>
            {topic && <p className="mt-2 line-clamp-2 rounded-md border-l-4 border-l-[hsl(var(--teal))] bg-[hsl(52_40%_98%)] px-3 py-2 text-[13px]" data-testid="text-setup-topic">{topic}</p>}
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4"><JournalSetupForm value={s} onChange={setS} /></div>
          <div className="flex flex-col gap-2 border-t px-5 py-3 sm:flex-row sm:items-center">
            <p className="min-w-0 flex-1 text-[11.5px] text-muted-foreground" role="status" data-testid="text-setup-status">{problem ?? (s.target === "preset" && tplName ? `${tplName} layout · ${LENGTHS[s.length].label.toLowerCase()} · diagrams ${s.includeFigures ? "on" : "off"}` : `${LENGTHS[s.length].label} length · diagrams ${s.includeFigures ? "on" : "off"}`)}</p>
            <button type="button" className="sx-btn" onClick={onCancel} disabled={pending} data-testid="button-setup-cancel">Cancel</button>
            <button type="button" className="sx-btn sx-primary" disabled={!!problem || pending} onClick={() => onConfirm(s)} data-testid="button-setup-create">{pending ? "Starting..." : "Create journal draft"}</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
