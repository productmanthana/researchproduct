import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCustomFormat, getGetCustomFormatQueryKey, useListCustomFormats, getListCustomFormatsQueryKey,
  useSaveCustomFormat, useDeleteCustomFormat, useImportCustomFormat, useApplyCustomFormat,
  useListDocuments, getListDocumentsQueryKey, getListStudioItemsQueryKey, getGetStudioItemQueryKey,
  type CustomFormat, type StudioItem, type PersonalFormat, type HeadingRename,
} from "@workspace/api-client-react";
import { AlertTriangle, ArrowDown, ArrowUp, FileInput, Info, Plus, Save, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DocumentUpload } from "@/components/document-upload";
import { useToast } from "@/hooks/use-toast";
import { friendlyError, meta } from "@/lib/studio";
import { requirementsCheckOf } from "./requirements-check";

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));
const inch = (pt: number) => (pt / 72).toFixed(2);
const mm = (pt: number) => ((pt / 72) * 25.4).toFixed(1);
const rec = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : null);

export const FALLBACK_FORMAT: CustomFormat = {
  size: "A4", fontFamily: "serif", fontSize: 11, lineSpacing: 1.5, columns: 1,
  margins: { top: 72, right: 72, bottom: 72, left: 72 }, citationStyle: "numbered",
  figureWidth: 80, captionPosition: "below", figurePlacement: "inline",
  sectionOrder: [], headingRenames: [], instructions: "",
};

/** Persisted warnings recorded on a customised revision. */
export function customFormatWarningsOf(item: Pick<StudioItem, "metadata">): string[] | null {
  const md = rec(item.metadata);
  if (!md) return null;
  const w = md.customFormatWarnings;
  const has = Array.isArray(w) || !!md.customFormat;
  if (!has) return null;
  return Array.isArray(w) ? w.filter((x): x is string => typeof x === "string") : [];
}

export function CustomFormatBanner({ item }: { item: StudioItem }) {
  const w = customFormatWarningsOf(item);
  if (!w) return null;
  return (
    <div className="mb-4 rounded-md border border-[hsl(var(--turmeric)/0.6)] bg-[hsl(var(--turmeric)/0.1)] p-3 text-xs" role="note" data-testid="banner-custom-format">
      <p className="flex items-center gap-1.5 font-medium"><AlertTriangle className="h-3.5 w-3.5 text-[hsl(30_60%_32%)]" />Custom format, chosen by you</p>
      <p className="mt-1 text-muted-foreground">This revision uses your own layout. It has not been automatically verified as compliant with any journal or university instructions. Your choices may still match them; confirm against the official instructions before submitting.</p>
      {w.length > 0 && <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[hsl(30_60%_28%)]">{w.map((x, i) => <li key={i} data-testid={`text-custom-warning-${i}`}>{x}</li>)}</ul>}
    </div>
  );
}

/** Official layout, only when a retrieved check matches the item's current template. */
function officialOf(item: StudioItem): { name: string; layout: Record<string, unknown> } | null {
  const rc = requirementsCheckOf(item);
  if (!rc || rc.status !== "retrieved") return null;
  const tpl = meta(item).templateId ?? null;
  if (!tpl || rc.templateId !== tpl) return null;
  const raw = rec(rec(item.metadata)?.requirementsCheck);
  const layout = rec(raw?.officialLayout) ?? rc.appliedLayout ?? null;
  return layout ? { name: rc.templateName ?? "your selected target", layout } : null;
}

function conflicts(f: CustomFormat, official: { name: string; layout: Record<string, unknown> } | null): string[] {
  if (!official) return [];
  const o = official.layout; const out: string[] = [];
  const cmp = (key: string, label: string, mine: unknown, show = (v: unknown) => String(v)) => {
    const v = o[key];
    if (v === undefined || v === null || v === "") return;
    if (String(v).toLowerCase() !== String(mine).toLowerCase()) out.push(`${label}: official setting is ${show(v)}, your choice is ${show(mine)}.`);
  };
  cmp("size", "Page size", f.size); cmp("fontFamily", "Font family", f.fontFamily); cmp("fontSize", "Font size", f.fontSize, v => `${v} pt`);
  cmp("lineSpacing", "Line spacing", f.lineSpacing); cmp("columns", "Columns", f.columns); cmp("citationStyle", "Citation style", f.citationStyle);
  const om = rec(o.margins);
  if (om) (["top", "right", "bottom", "left"] as const).forEach(k => { if (typeof om[k] === "number" && om[k] !== f.margins[k]) out.push(`${k[0].toUpperCase() + k.slice(1)} margin: official ${om[k]} pt, yours ${f.margins[k]} pt.`); });
  return out;
}

function Field({ label, hint, children, id }: { label: string; hint?: string; children: React.ReactNode; id: string }) {
  return <div className="space-y-1"><label htmlFor={id} className="block text-xs font-medium">{label}</label>{children}{hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}</div>;
}
function Seg<T extends string | number>({ value, options, onChange, name }: { value: T; options: [T, string][]; onChange: (v: T) => void; name: string }) {
  return (
    <div role="radiogroup" aria-label={name} className="inline-flex w-full rounded-md border border-[hsl(110_14%_80%)] p-0.5">
      {options.map(([v, l]) => (
        <button key={String(v)} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={`flex-1 rounded px-2 py-1.5 text-xs transition-colors ${value === v ? "bg-[hsl(var(--cyan-ink))] text-[hsl(42_40%_97%)]" : "hover:bg-[hsl(90_20%_90%)]"}`}
          data-testid={`seg-${name.toLowerCase().replace(/\s+/g, "-")}-${v}`}>{l}</button>
      ))}
    </div>
  );
}

function Preview({ f }: { f: CustomFormat }) {
  const W = 200; const ratio = f.size === "A4" ? 297 / 210 : 11 / 8.5; const H = W * ratio;
  const pw = f.size === "A4" ? 595 : 612; const s = W / pw;
  const m = { t: f.margins.top * s, r: f.margins.right * s, b: f.margins.bottom * s, l: f.margins.left * s };
  const lineH = Math.max(2.2, f.fontSize * f.lineSpacing * s * 0.9);
  const cols = f.columns; const gap = 6; const innerW = W - m.l - m.r; const colW = (innerW - (cols - 1) * gap) / cols;
  const avail = H - m.t - m.b - 18; const rows = Math.max(1, Math.floor(avail / lineH));
  const figH = 36 * (f.figureWidth / 100);
  const figW = (cols === 1 ? innerW : colW) * (f.figureWidth / 100);
  return (
    <div className="flex flex-col items-center gap-2" aria-label="Illustrative page preview" data-testid="preview-custom-format">
      <div className="relative bg-[hsl(44_40%_99%)] shadow-[0_10px_26px_-14px_hsl(216_40%_20%/0.45)] ring-1 ring-[hsl(38_20%_84%)] transition-all duration-300" style={{ width: W, height: H }}>
        <div className="absolute border border-dashed border-[hsl(var(--cyan-ink)/0.25)] transition-all duration-300" style={{ left: m.l, top: m.t, right: m.r, bottom: m.b }} />
        <div className="absolute" style={{ left: m.l, top: m.t, width: innerW }}>
          <div className="mx-auto mb-1 h-[5px] w-3/4 rounded-sm bg-[hsl(var(--ink-teal,216_42%_15%))]" style={{ background: "hsl(216 42% 15%)" }} />
          <div className={`mx-auto mb-2 h-[3px] w-1/2 rounded-sm bg-[hsl(216_14%_60%)]`} />
          <div className="flex" style={{ gap }}>
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} style={{ width: colW }}>
                {Array.from({ length: rows }).map((__, r) => {
                  const figAt = f.figurePlacement === "inline" && c === 0 && r === Math.floor(rows / 3);
                  return <div key={r}>
                    {figAt && <div className="my-1 flex flex-col items-center gap-[2px]">
                      {f.captionPosition === "above" && <div className="h-[2px] w-2/3 bg-[hsl(var(--vermilion)/0.6)]" />}
                      <div className="rounded-[1px] bg-[hsl(var(--cyan-ink)/0.18)] ring-1 ring-[hsl(var(--cyan-ink)/0.35)] transition-all duration-300" style={{ width: figW, height: figH }} />
                      {f.captionPosition === "below" && <div className="h-[2px] w-2/3 bg-[hsl(var(--vermilion)/0.6)]" />}
                    </div>}
                    <div className="rounded-full" style={{ height: Math.max(1, f.fontSize * s * 0.35), marginBottom: lineH - Math.max(1, f.fontSize * s * 0.35), width: r % 7 === 6 ? "62%" : "100%", background: f.fontFamily === "serif" ? "hsl(216 30% 35% / .55)" : "hsl(208 40% 40% / .5)" }} />
                  </div>;
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="max-w-[220px] text-center text-[10.5px] text-muted-foreground">Illustrative sketch only. It shows proportions, not the exact pagination of the exported PDF or Word file.{f.figurePlacement === "end" ? " Figures will be placed at the end." : ""}</p>
      <p className="font-mono text-[10px] text-muted-foreground">{f.size === "A4" ? "A4" : "Letter"} &middot; {f.fontFamily} {f.fontSize}pt &middot; {f.lineSpacing}x &middot; {f.columns} col &middot; {f.citationStyle === "numbered" ? "[1]" : "(Author, year)"}</p>
    </div>
  );
}

type Props = { item: StudioItem; open: boolean; onOpenChange: (o: boolean) => void; onOpen: (id: string | null) => void };

export function CustomFormatDialog({ item, open, onOpenChange, onOpen }: Props) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const kind = item.kind === "thesis" ? "thesis" : "journal";
  const base = useGetCustomFormat(item.id, { query: { enabled: open, queryKey: getGetCustomFormatQueryKey(item.id) } });
  const saved = useListCustomFormats({ query: { enabled: open, queryKey: getListCustomFormatsQueryKey() } });
  const docs = useListDocuments({ query: { enabled: open, queryKey: getListDocumentsQueryKey(), refetchInterval: q => ((q.state.data ?? []).some(d => d.status !== "ready" && d.status !== "failed") ? 4000 : false) } });
  const saveFmt = useSaveCustomFormat();
  const delFmt = useDeleteCustomFormat();
  const imp = useImportCustomFormat();
  const apply = useApplyCustomFormat();

  const [f, setF] = useState<CustomFormat>(FALLBACK_FORMAT);
  const [selectedId, setSelectedId] = useState<string>("");
  const [name, setName] = useState("");
  const [docId, setDocId] = useState("");
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [newSection, setNewSection] = useState("");
  const [confirmDel, setConfirmDel] = useState<PersonalFormat | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const init = useRef<string | null>(null);

  useEffect(() => {
    if (!open) { init.current = null; return; }
    if (base.data && init.current !== item.id) {
      init.current = item.id;
      setF({ ...FALLBACK_FORMAT, ...base.data.format });
      setImportWarnings([]); setSelectedId(""); setName("");
    }
  }, [open, base.data, item.id]);

  const set = <K extends keyof CustomFormat>(k: K, v: CustomFormat[K]) => setF(p => ({ ...p, [k]: v }));
  const official = useMemo(() => officialOf(item), [item]);
  const conflictList = conflicts(f, official);
  const words = item.content.trim() ? item.content.trim().split(/\s+/).length : 0;
  const abstractWords = useMemo(() => {
    const m = item.content.match(/^#+\s*abstract\s*\n([\s\S]*?)(?=\n#+\s|$)/im);
    return m ? m[1].trim().split(/\s+/).filter(Boolean).length : null;
  }, [item.content]);
  const headings = useMemo(() => Array.from(item.content.matchAll(/^#{1,3}\s+(.+)$/gm)).map(x => x[1].trim()).filter((v, i, a) => a.indexOf(v) === i).slice(0, 30), [item.content]);
  const fileDocs = (docs.data ?? []).filter(d => d.contentType === "application/pdf" || d.contentType === DOCX);
  const chosenDoc = fileDocs.find(d => d.id === docId);
  const selected = (saved.data ?? []).find(p => p.id === selectedId);

  const pick = (id: string) => {
    setSelectedId(id);
    const p = (saved.data ?? []).find(x => x.id === id);
    if (p) { setF({ ...FALLBACK_FORMAT, ...p.format }); setName(p.name); }
  };
  const doSaveFormat = async (update: boolean) => {
    if (!name.trim()) return;
    try {
      const r = await saveFmt.mutateAsync({ data: { ...(update && selectedId ? { id: selectedId } : {}), name: name.trim().slice(0, 100), kind, format: f } });
      await qc.invalidateQueries({ queryKey: getListCustomFormatsQueryKey() });
      setSelectedId(r.id);
      toast({ title: update ? "Saved format updated" : "Format saved", description: `"${r.name}" can be reused in any project.` });
    } catch (e) { toast({ title: "Couldn't save format", description: friendlyError(e), variant: "destructive" }); }
  };
  const doDelete = async () => {
    if (!confirmDel) return;
    try {
      await delFmt.mutateAsync({ id: confirmDel.id });
      await qc.invalidateQueries({ queryKey: getListCustomFormatsQueryKey() });
      if (selectedId === confirmDel.id) setSelectedId("");
      toast({ title: "Format deleted", description: confirmDel.name });
    } catch (e) { toast({ title: "Couldn't delete", description: friendlyError(e), variant: "destructive" }); }
    setConfirmDel(null);
  };
  const doImport = async () => {
    if (!chosenDoc) return;
    if (chosenDoc.status !== "ready") { toast({ title: "Document is not ready", description: "Wait until processing finishes, then import.", variant: "destructive" }); return; }
    try {
      const r = await imp.mutateAsync({ data: { documentId: chosenDoc.id } });
      setF({ ...FALLBACK_FORMAT, ...r.format, instructionsDocumentId: chosenDoc.id });
      setImportWarnings(r.warnings);
      toast({ title: "Settings imported", description: "Review them before applying." });
    } catch (e) { toast({ title: "Import failed", description: friendlyError(e), variant: "destructive" }); }
  };
  const doApply = async () => {
    try {
      const out = await apply.mutateAsync({ id: item.id, data: { format: f } });
      qc.setQueryData(getGetStudioItemQueryKey(out.id), out);
      await qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
      toast({ title: `Custom format saved as revision ${out.revision}`, description: "Your original revision is unchanged." });
      onOpenChange(false);
      onOpen(out.id);
    } catch (e) { toast({ title: "Couldn't apply format", description: friendlyError(e), variant: "destructive" }); }
  };

  const renames = f.headingRenames;
  const setRename = (i: number, patch: Partial<HeadingRename>) => set("headingRenames", renames.map((r, j) => j === i ? { ...r, ...patch } : r));
  const move = (i: number, d: number) => { const a = [...f.sectionOrder]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; set("sectionOrder", a); };
  const renamesValid = renames.every(r => r.from.trim() && r.to.trim());
  const canApply = !!base.data && renamesValid && f.instructions.length <= 16000 && !apply.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-5xl overflow-hidden bg-[hsl(52_30%_96%)] p-0" data-testid="dialog-custom-format">
          <div className="flex max-h-[92dvh] flex-col">
            <DialogHeader className="border-b px-5 pb-3 pt-5 text-left">
              <p className="sx-eyebrow">Personal manuscript choice</p>
              <DialogTitle className="sx-title text-2xl">Custom format</DialogTitle>
              <DialogDescription className="text-xs">Applies to a new revision of &ldquo;{item.title}&rdquo;. The original stays unchanged, and PDF and Word files change only after you apply. A custom copy is not automatically verified against any official instructions.</DialogDescription>
            </DialogHeader>

            {base.isLoading ? <div className="grid gap-3 p-5" aria-busy="true">{[0, 1, 2].map(i => <div key={i} className="h-16 animate-pulse rounded-md bg-[hsl(40_24%_90%)]" />)}</div>
              : base.isError ? <div className="p-5 text-sm" role="alert"><p className="text-vermilion">Couldn't load the starting format: {friendlyError(base.error)}</p><button className="sx-btn mt-2" onClick={() => void base.refetch()} data-testid="button-retry-format">Try again</button></div>
              : <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_260px] md:overflow-hidden">
                <div className="space-y-5 px-5 py-4 md:overflow-y-auto">
                  {(base.data?.warnings.length ?? 0) > 0 && <ul className="list-disc space-y-0.5 rounded-md border border-dashed p-2.5 pl-6 text-xs text-muted-foreground">{base.data!.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>}

                  <section className="sx-card space-y-2 p-3" aria-label="Saved personal formats">
                    <p className="sx-eyebrow">Saved personal formats</p>
                    {saved.isLoading ? <div className="h-9 animate-pulse rounded bg-[hsl(40_24%_90%)]" />
                      : saved.isError ? <p className="text-xs text-vermilion">Couldn't load saved formats. <button className="underline" onClick={() => void saved.refetch()}>Retry</button></p>
                      : <div className="flex flex-wrap gap-2">
                        <select className="sx-input min-w-0 flex-1" value={selectedId} onChange={e => pick(e.target.value)} aria-label="Choose a saved format" data-testid="select-saved-format">
                          <option value="">{(saved.data ?? []).length ? "Choose a saved format" : "No saved formats yet"}</option>
                          {(saved.data ?? []).map(p => <option key={p.id} value={p.id}>{p.name}{p.kind ? ` (${p.kind})` : ""}</option>)}
                        </select>
                        {selected && <button className="sx-btn sx-danger" onClick={() => setConfirmDel(selected)} aria-label={`Delete ${selected.name}`} data-testid="button-delete-saved-format"><Trash2 /></button>}
                      </div>}
                    <div className="flex flex-wrap gap-2">
                      <input className="sx-input min-w-0 flex-1" value={name} maxLength={100} onChange={e => setName(e.target.value)} placeholder="Name, e.g. Lab report two-column" aria-label="Format name" data-testid="input-format-name" />
                      <button className="sx-btn" disabled={!name.trim() || saveFmt.isPending} onClick={() => void doSaveFormat(false)} data-testid="button-save-new-format"><Plus />Save new</button>
                      {selected && <button className="sx-btn" disabled={!name.trim() || saveFmt.isPending} onClick={() => void doSaveFormat(true)} data-testid="button-update-format"><Save />Update &ldquo;{selected.name}&rdquo;</button>}
                    </div>
                  </section>

                  <section className="space-y-3" aria-label="Page layout">
                    <p className="sx-eyebrow">Page</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field id="cf-size" label="Paper size"><Seg name="Paper size" value={f.size} options={[["A4", "A4"], ["LETTER", "Letter"]]} onChange={v => set("size", v)} /></Field>
                      <Field id="cf-cols" label="Columns"><Seg name="Columns" value={f.columns} options={[[1, "One"], [2, "Two"]]} onChange={v => set("columns", v)} /></Field>
                      <Field id="cf-font" label="Typeface" hint="PDF uses DejaVu Serif or DejaVu Sans; Word uses Times New Roman or Arial. The two files will not render identically."><Seg name="Typeface" value={f.fontFamily} options={[["serif", "Serif"], ["sans", "Sans"]]} onChange={v => set("fontFamily", v)} /></Field>
                      <Field id="cf-fs" label={`Font size: ${f.fontSize} pt`}><input id="cf-fs" type="range" min={8} max={16} step={0.5} value={f.fontSize} onChange={e => set("fontSize", clamp(+e.target.value, 8, 16))} className="w-full accent-[hsl(var(--cyan-ink))]" data-testid="input-font-size" /></Field>
                      <Field id="cf-ls" label={`Line spacing: ${f.lineSpacing.toFixed(2)}`}><input id="cf-ls" type="range" min={1} max={2.5} step={0.05} value={f.lineSpacing} onChange={e => set("lineSpacing", clamp(+e.target.value, 1, 2.5))} className="w-full accent-[hsl(var(--cyan-ink))]" data-testid="input-line-spacing" /></Field>
                    </div>
                    <fieldset className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <legend className="mb-1 text-xs font-medium">Margins (points, 18 to 144; 72 pt = 1 in)</legend>
                      {(["top", "right", "bottom", "left"] as const).map(k => (
                        <label key={k} className="text-[11px]"><span className="capitalize">{k}</span>
                          <input type="number" min={18} max={144} className="sx-input mt-0.5" value={f.margins[k]} onChange={e => set("margins", { ...f.margins, [k]: +e.target.value })} onBlur={e => set("margins", { ...f.margins, [k]: clamp(Math.round(+e.target.value), 18, 144) })} data-testid={`input-margin-${k}`} />
                          <span className="font-mono text-[10px] text-muted-foreground">{inch(f.margins[k])} in &middot; {mm(f.margins[k])} mm</span>
                        </label>
                      ))}
                    </fieldset>
                  </section>

                  <section className="space-y-3" aria-label="Citations and figures">
                    <p className="sx-eyebrow">Citations and figures</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field id="cf-cite" label="Citation style" hint="Author-year is a generic style, not an exact implementation of any named guide."><Seg name="Citation style" value={f.citationStyle} options={[["numbered", "Numbered [1]"], ["author-year", "Author-year"]]} onChange={v => set("citationStyle", v)} /></Field>
                      <Field id="cf-fw" label={`Figure width: ${f.figureWidth}% of text width`}><input id="cf-fw" type="range" min={40} max={100} step={5} value={f.figureWidth} onChange={e => set("figureWidth", clamp(+e.target.value, 40, 100))} className="w-full accent-[hsl(var(--cyan-ink))]" data-testid="input-figure-width" /></Field>
                      <Field id="cf-cap" label="Caption position"><Seg name="Caption position" value={f.captionPosition} options={[["above", "Above"], ["below", "Below"]]} onChange={v => set("captionPosition", v)} /></Field>
                      <Field id="cf-fp" label="Figure placement"><Seg name="Figure placement" value={f.figurePlacement} options={[["inline", "Inline"], ["end", "At end"]]} onChange={v => set("figurePlacement", v)} /></Field>
                    </div>
                    <p className="flex gap-1.5 text-[11px] text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />To change figure colours, use Add or revise a figure on the document. Custom format does not recolour figures.</p>
                  </section>

                  <section className="space-y-3" aria-label="Structure and limits">
                    <p className="sx-eyebrow">Structure and limits</p>
                    <div>
                      <p className="mb-1 text-xs font-medium">Section order</p>
                      {f.sectionOrder.length === 0 && <p className="text-[11px] text-muted-foreground">Empty means the draft order is kept.</p>}
                      <ol className="space-y-1">{f.sectionOrder.map((s, i) => (
                        <li key={`${s}-${i}`} className="flex items-center gap-1 rounded border bg-[hsl(52_40%_98%)] px-2 py-1 text-xs" data-testid={`row-section-${i}`}>
                          <span className="font-mono text-muted-foreground">{i + 1}.</span><span className="flex-1 truncate">{s}</span>
                          <button className="rounded p-1 hover:bg-[hsl(90_20%_90%)]" onClick={() => move(i, -1)} aria-label={`Move ${s} up`}><ArrowUp className="h-3 w-3" /></button>
                          <button className="rounded p-1 hover:bg-[hsl(90_20%_90%)]" onClick={() => move(i, 1)} aria-label={`Move ${s} down`}><ArrowDown className="h-3 w-3" /></button>
                          <button className="rounded p-1 hover:bg-[hsl(90_20%_90%)]" onClick={() => set("sectionOrder", f.sectionOrder.filter((_, j) => j !== i))} aria-label={`Remove ${s}`}><X className="h-3 w-3" /></button>
                        </li>))}</ol>
                      <div className="mt-1.5 flex gap-2">
                        <input className="sx-input" list="cf-headings" value={newSection} maxLength={100} onChange={e => setNewSection(e.target.value)} placeholder="Section heading" aria-label="Add section" data-testid="input-new-section" />
                        <datalist id="cf-headings">{headings.map(h => <option key={h} value={h} />)}</datalist>
                        <button className="sx-btn" disabled={!newSection.trim() || f.sectionOrder.length >= 30} onClick={() => { set("sectionOrder", [...f.sectionOrder, newSection.trim()]); setNewSection(""); }} data-testid="button-add-section"><Plus />Add</button>
                      </div>
                      {headings.length > 0 && f.sectionOrder.length === 0 && <button className="mt-1 text-[11px] underline" onClick={() => set("sectionOrder", headings)} data-testid="button-use-draft-headings">Start from this draft's headings</button>}
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium">Heading renames</p>
                      <div className="space-y-1">{renames.map((r, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <input className="sx-input" value={r.from} maxLength={100} onChange={e => setRename(i, { from: e.target.value })} placeholder="From" aria-label={`Rename ${i + 1} from`} list="cf-headings" data-testid={`input-rename-from-${i}`} />
                          <span className="text-xs text-muted-foreground">to</span>
                          <input className="sx-input" value={r.to} maxLength={100} onChange={e => setRename(i, { to: e.target.value })} placeholder="To" aria-label={`Rename ${i + 1} to`} data-testid={`input-rename-to-${i}`} />
                          <button className="rounded p-1.5 hover:bg-[hsl(90_20%_90%)]" onClick={() => set("headingRenames", renames.filter((_, j) => j !== i))} aria-label={`Remove rename ${i + 1}`}><X className="h-3.5 w-3.5" /></button>
                        </div>))}</div>
                      <button className="sx-btn mt-1.5" disabled={renames.length >= 30} onClick={() => set("headingRenames", [...renames, { from: "", to: "" }])} data-testid="button-add-rename"><Plus />Add rename</button>
                      {!renamesValid && <p className="mt-1 text-[11px] text-vermilion">Fill both sides of each rename, or remove it.</p>}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field id="cf-mw" label="Word limit (optional)" hint={`Draft has about ${words.toLocaleString()} words.`}>
                        <input id="cf-mw" type="number" min={100} max={100000} className="sx-input" value={f.maxWords ?? ""} onChange={e => set("maxWords", e.target.value ? clamp(+e.target.value, 100, 100000) : undefined)} data-testid="input-max-words" />
                      </Field>
                      <Field id="cf-maw" label="Abstract word limit (optional)" hint={abstractWords !== null ? `Abstract has about ${abstractWords} words.` : "No Abstract heading found."}>
                        <input id="cf-maw" type="number" min={50} max={2000} className="sx-input" value={f.maxAbstractWords ?? ""} onChange={e => set("maxAbstractWords", e.target.value ? clamp(+e.target.value, 50, 2000) : undefined)} data-testid="input-max-abstract-words" />
                      </Field>
                    </div>
                    {f.maxWords && words > f.maxWords && <p className="text-[11px] text-[hsl(30_60%_32%)]" role="status">The draft is {(words - f.maxWords).toLocaleString()} words over your limit. Nothing will be cut; this is recorded as a warning.</p>}
                    {f.maxAbstractWords && abstractWords !== null && abstractWords > f.maxAbstractWords && <p className="text-[11px] text-[hsl(30_60%_32%)]" role="status">The abstract is over your limit. It will not be shortened automatically.</p>}
                  </section>

                  <section className="space-y-2" aria-label="Instructions">
                    <p className="sx-eyebrow">Instructions and templates</p>
                    <textarea className="sx-input min-h-[90px]" value={f.instructions} maxLength={16000} onChange={e => set("instructions", e.target.value)} placeholder="Paste any instructions you want kept with this format." aria-label="Instructions" data-testid="input-instructions" />
                    <p className="text-right font-mono text-[10px] text-muted-foreground">{f.instructions.length.toLocaleString()} / 16,000</p>
                    <div className="sx-card space-y-2 p-3">
                      <p className="text-xs">Import from a processed PDF or Word (.docx) file. From Word templates, only supported settings are read (document defaults and the final section's page setup); the full template is not reproduced, and the font family is mapped to the options above. PDF instructions supply text only; page geometry is not inferred from a PDF.</p>
                      <div className="flex flex-wrap gap-2">
                        <select className="sx-input min-w-0 flex-1" value={docId} onChange={e => setDocId(e.target.value)} aria-label="Choose an uploaded document" data-testid="select-import-document">
                          <option value="">{docs.isLoading ? "Loading documents..." : fileDocs.length ? "Choose an uploaded PDF or Word file" : "No PDF or Word uploads yet"}</option>
                          {fileDocs.map(d => <option key={d.id} value={d.id}>{d.name} ({d.status})</option>)}
                        </select>
                        <DocumentUpload label="Upload" open={uploadOpen} onOpenChange={setUploadOpen} onReady={d => setDocId(d.id)} />
                        <button className="sx-btn" disabled={!chosenDoc || chosenDoc.status !== "ready" || imp.isPending} onClick={() => void doImport()} data-testid="button-import-format"><FileInput />{imp.isPending ? "Importing..." : "Import"}</button>
                      </div>
                      {chosenDoc && chosenDoc.status !== "ready" && <p className="text-[11px] text-[hsl(30_60%_32%)]" role="status">{chosenDoc.status === "failed" ? `This file failed processing${chosenDoc.error ? `: ${chosenDoc.error}` : ""}. Choose another.` : "Still processing. Import becomes available when it is ready."}</p>}
                      {importWarnings.length > 0 && <ul className="list-disc space-y-0.5 pl-5 text-[11px] text-[hsl(30_60%_28%)]" data-testid="list-import-warnings">{importWarnings.map((w, i) => <li key={i}>{w}</li>)}</ul>}
                      {f.instructionsDocumentId && <p className="text-[11px] text-muted-foreground">Linked to an uploaded instructions file. Removing the link keeps the instructions text above. <button className="underline" onClick={() => { set("instructionsDocumentId", undefined); setDocId(""); }} data-testid="button-remove-imported-file">Remove imported file</button></p>}
                    </div>
                  </section>
                  <p className="text-[11px] text-muted-foreground">Author name, institution and other first-page details are kept from this revision. Edit them in the document details panel and save before customising.</p>
                </div>

                <aside className="space-y-3 border-t bg-[hsl(66_20%_95%)] px-5 py-4 md:overflow-y-auto md:border-l md:border-t-0">
                  <Preview f={f} />
                  {conflictList.length > 0 && <div className="rounded-md border border-[hsl(var(--vermilion)/0.3)] bg-[hsl(var(--vermilion)/0.05)] p-2.5 text-[11px]" data-testid="panel-format-conflicts">
                    <p className="font-medium">Differs from {official!.name}</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">{conflictList.map((c, i) => <li key={i}>{c}</li>)}</ul>
                    <p className="mt-1">You can still apply your choice.</p>
                  </div>}
                </aside>
              </div>}

            <div className="flex flex-wrap items-center gap-2 border-t bg-[hsl(52_30%_96%)] px-5 py-3">
              <p className="mr-auto text-[11px] text-muted-foreground">Creates a separate revision marked as a custom format. Not automatically verified as compliant.</p>
              <button className="sx-btn" onClick={() => onOpenChange(false)} data-testid="button-cancel-custom-format">Cancel</button>
              <button className="sx-btn sx-primary" disabled={!canApply} onClick={() => void doApply()} data-testid="button-apply-custom-format">{apply.isPending ? "Applying..." : "Apply as new revision"}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDel} onOpenChange={o => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{confirmDel?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>This removes the saved format from all your projects. Revisions already formatted with it are unchanged.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-format">Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={() => void doDelete()} className="bg-[hsl(var(--vermilion))]" data-testid="button-confirm-delete-format">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
