import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  useGenerateStudioDocument, useSaveStudioItem, getListStudioItemsQueryKey, getGetStudioItemQueryKey, getGetUsageQueryKey,
  type DocumentDetails, type StudioGenerationInputKind, type StudioGenerationInputEvidenceMode, type StudioItemInputKind, type StudioItem,
} from "@workspace/api-client-react";
import { BookmarkPlus, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cleanDetails, DETAIL_KINDS, detailsOf, friendlyError, hasDetails, statusOf } from "@/lib/studio";
import { DocumentDetailsFields } from "./document-details";
import { useUnsavedGuard } from "@/lib/unsaved";
import { useProjectItems } from "./use-studio";

const MODES: { value: StudioGenerationInputEvidenceMode; label: string; hint: string }[] = [
  { value: "project", label: "My project", hint: "Only papers, notes and documents in this project" },
  { value: "discover", label: "Discover", hint: "Search scholarly indexes for new evidence" },
  { value: "combined", label: "Both", hint: "Your project first, plus new papers" },
];

type Props = {
  projectId: string;
  kind: StudioGenerationInputKind;
  saveKind?: StudioItemInputKind;
  placeholder: string;
  cta: string;
  templateId?: string | null;
  templateSlot?: ReactNode;
  defaultMode?: StudioGenerationInputEvidenceMode;
  initialPrompt?: string;
  onCreated: (item: StudioItem) => void;
  /** Presentation only. "stacked" (default) is the original sidebar layout; "wide" gives the prompt priority. */
  variant?: "stacked" | "wide";
  label?: string;
  /** Links generated items to an existing item (follow-ups). */
  parentId?: string;
  /** Presentation only: "compact" renders a single-line follow-up bar. Defaults unchanged. */
  compact?: boolean;
};

export function Composer({ projectId, kind, saveKind, placeholder, cta, templateId, templateSlot, defaultMode = "combined", initialPrompt = "", onCreated, variant = "stacked", label, parentId, compact }: Props) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const gen = useGenerateStudioDocument();
  const save = useSaveStudioItem();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [mode, setMode] = useState<StudioGenerationInputEvidenceMode>(defaultMode);
  const [patents, setPatents] = useState(true);
  const [limitError, setLimitError] = useState<string | null>(null);
  const withDetails = DETAIL_KINDS.has(kind);
  const [details, setDetails] = useState<DocumentDetails>({});
  const [inherited, setInherited] = useState<string | null>(null);
  const touched = useRef(false);
  const projectItems = useProjectItems(withDetails ? projectId : null);
  useEffect(() => {
    // Inherit title-page details once from the newest item in this project that has them; never overwrite typing.
    if (!withDetails || touched.current || !projectItems.data) return;
    const src = [...projectItems.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).find(i => hasDetails(detailsOf(i)));
    if (src) { setDetails(detailsOf(src)); setInherited(src.title); }
    touched.current = true;
  }, [withDetails, projectItems.data]);
  const detailPayload = withDetails && hasDetails(details) ? { documentDetails: cleanDetails(details) } : {};
  const trimmed = prompt.trim();
  const problem = trimmed.length < 5 ? "Write at least 5 characters." : trimmed.length > 5000 ? "Keep it under 5,000 characters." : null;

  useUnsavedGuard(`composer-followup-${kind}-${parentId ?? "none"}`, !!compact && trimmed.length > 0 && !gen.isPending, "Your follow-up message has not been sent.");
  const finish = (item: StudioItem) => {
    if (compact) setPrompt("");
    qc.setQueryData(getGetStudioItemQueryKey(item.id), item);
    void qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
    onCreated(item);
  };

  const generate = async () => {
    if (problem || gen.isPending) return;
    setLimitError(null);
    try {
      const item = await gen.mutateAsync({ data: { projectId, kind, prompt: trimmed, ...(parentId ? { parentId } : {}), evidenceMode: mode, includePatents: patents, ...(templateId ? { templateId } : {}), ...detailPayload } });
      void qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
      finish(item);
    } catch (e) {
      if (statusOf(e) === 429) setLimitError(friendlyError(e));
      else toast({ title: "Couldn't start", description: friendlyError(e), variant: "destructive" });
    }
  };

  const saveBlank = async () => {
    if (!saveKind || problem) return;
    try {
      const item = await save.mutateAsync({ data: { projectId, kind: saveKind, title: trimmed.split("\n")[0].slice(0, 300), content: trimmed, ...(templateId ? { templateId } : {}), ...detailPayload } });
      toast({ title: "Saved to Library", description: "Open it to write and export." });
      finish(item);
    } catch (e) { toast({ title: "Couldn't save", description: friendlyError(e), variant: "destructive" }); }
  };

  if (compact) {
    const promptId = `prompt-compact-${kind}`;
    return (
      <div className="sx-card sx-composer-wide overflow-hidden" data-testid={`composer-${kind}`}>
        {label && <label htmlFor={promptId} className="sr-only">{label}</label>}
        <div className="flex items-end gap-2 p-2">
          <textarea id={promptId} rows={2} className="min-h-[44px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground" placeholder={placeholder} value={prompt} maxLength={5000} onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void generate(); } }} data-testid="input-studio-prompt" />
          <button className="sx-btn sx-primary shrink-0" disabled={!!problem || gen.isPending} onClick={() => void generate()} data-testid="button-generate"><Sparkles />{gen.isPending ? "Sending..." : cta}</button>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-[hsl(90_14%_88%)] bg-[hsl(66_22%_96%)] px-3 py-2">
          <div className="sx-seg" role="radiogroup" aria-label="Evidence to use">
            {MODES.map(m => (
              <label key={m.value} title={m.hint} className={mode === m.value ? "on" : ""}>
                <input type="radio" name={`mode-c-${kind}`} className="sr-only" checked={mode === m.value} onChange={() => setMode(m.value)} data-testid={`radio-mode-${m.value}`} />{m.label}
              </label>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" className="accent-[hsl(var(--teal))]" checked={patents} onChange={e => setPatents(e.target.checked)} data-testid="checkbox-include-patents" />Patents</label>
          <span className="ml-auto font-mono text-[10.5px] text-muted-foreground" role="status">{problem && trimmed.length > 0 ? problem : "Ctrl + Enter to send"}</span>
        </div>
        {limitError && <div className="m-2 rounded-md border border-[hsl(var(--vermilion)/0.35)] bg-[hsl(var(--vermilion)/0.05)] p-3 text-sm" role="alert" data-testid="status-limit">{limitError} <Link href="/plans" className="font-medium underline">Plans &amp; usage</Link></div>}
      </div>
    );
  }

  if (variant === "wide") {
    const active = MODES.find(m => m.value === mode);
    const promptId = `prompt-${kind}`;
    return (
      <div className="sx-card sx-composer-wide overflow-hidden" data-testid={`composer-${kind}`}>
        {label && <label htmlFor={promptId} className="sr-only">{label}</label>}
        <textarea id={promptId} className="sx-wide-input" placeholder={placeholder} value={prompt} maxLength={5000} onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void generate(); } }} data-testid="input-studio-prompt" />
        <div className="flex items-center justify-between gap-3 px-4 pb-2 font-mono text-[10.5px] text-muted-foreground">
          <span role="status">{problem && trimmed.length > 0 ? problem : "AI drafts need your review against the original sources."}</span>
          <span aria-hidden className="shrink-0 whitespace-nowrap">{trimmed.length.toLocaleString()} / 5,000</span>
        </div>
        <div className="space-y-3 border-t border-[hsl(90_14%_86%)] bg-[hsl(66_22%_95%)] px-4 py-3">
          <fieldset className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <legend className="sr-only">Evidence to use</legend>
            <span className="sx-eyebrow" aria-hidden>Evidence</span>
            <div className="sx-seg" role="presentation">
              {MODES.map(m => (
                <label key={m.value} title={m.hint} className={mode === m.value ? "on" : ""}>
                  <input type="radio" name={`mode-${kind}`} className="sr-only" checked={mode === m.value} onChange={() => setMode(m.value)} data-testid={`radio-mode-${m.value}`} />
                  {m.label}
                </label>
              ))}
            </div>
            <span className="hidden text-xs text-muted-foreground xl:inline">{active?.hint}</span>
            <label className="ml-auto flex items-center gap-2 text-[13px]"><input type="checkbox" className="accent-[hsl(var(--teal))]" checked={patents} onChange={e => setPatents(e.target.checked)} data-testid="checkbox-include-patents" />Include patents</label>
          </fieldset>
          {templateSlot}
          {withDetails && <DocumentDetailsFields kind={kind} value={details} onChange={d => { touched.current = true; setInherited(null); setDetails(d); }}
            note={inherited ? `Filled from "${inherited}". Edit freely; leave blank to skip.` : undefined} />}
          {limitError && <div className="rounded-md border border-[hsl(var(--vermilion)/0.35)] bg-[hsl(var(--vermilion)/0.05)] p-3 text-sm" role="alert" data-testid="status-limit">{limitError} <Link href="/plans" className="font-medium underline">Plans &amp; usage</Link></div>}
          <div className="flex flex-wrap items-center gap-2">
            <button className="sx-btn sx-primary min-w-[200px] flex-1 sm:flex-none" disabled={!!problem || gen.isPending} onClick={() => void generate()} data-testid="button-generate"><Sparkles />{gen.isPending ? "Sending..." : cta}</button>
            {saveKind && <button className="sx-btn" disabled={!!problem || save.isPending} onClick={() => void saveBlank()} title="Save your text as a new item without AI" data-testid="button-save-to-library"><BookmarkPlus />Save to Library</button>}
            <span className="ml-auto hidden font-mono text-[10.5px] text-muted-foreground sm:inline">Ctrl + Enter to send</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sx-card space-y-4 p-4" data-testid={`composer-${kind}`}>
      <textarea className="sx-input min-h-[130px] resize-y leading-relaxed" placeholder={placeholder} value={prompt} maxLength={5000} onChange={e => setPrompt(e.target.value)} data-testid="input-studio-prompt" />
      <fieldset>
        <legend className="sx-eyebrow mb-2">Evidence to use</legend>
        <div className="grid gap-1.5">
          {MODES.map(m => (
            <label key={m.value} className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-sm ${mode === m.value ? "border-[hsl(var(--teal))] bg-[hsl(var(--teal)/0.06)]" : ""}`}>
              <input type="radio" name={`mode-${kind}`} className="mt-1 accent-[hsl(var(--teal))]" checked={mode === m.value} onChange={() => setMode(m.value)} data-testid={`radio-mode-${m.value}`} />
              <span><span className="font-medium">{m.label}</span><span className="block text-xs text-muted-foreground">{m.hint}</span></span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[hsl(var(--teal))]" checked={patents} onChange={e => setPatents(e.target.checked)} data-testid="checkbox-include-patents" />Include patent records when available</label>
      {templateSlot}
      {withDetails && <DocumentDetailsFields kind={kind} value={details} onChange={d => { touched.current = true; setInherited(null); setDetails(d); }}
        note={inherited ? `Filled from "${inherited}". Edit freely; leave blank to skip.` : undefined} />}
      {limitError && <div className="rounded-md border border-[hsl(var(--vermilion)/0.35)] bg-[hsl(var(--vermilion)/0.05)] p-3 text-sm" role="alert" data-testid="status-limit">{limitError} <Link href="/plans" className="font-medium underline">Plans &amp; usage</Link></div>}
      <div className="flex flex-wrap gap-2">
        <button className="sx-btn sx-primary flex-1" disabled={!!problem || gen.isPending} onClick={() => void generate()} data-testid="button-generate"><Sparkles />{gen.isPending ? "Sending..." : cta}</button>
        {saveKind && <button className="sx-btn" disabled={!!problem || save.isPending} onClick={() => void saveBlank()} title="Save your text as a new item without AI" data-testid="button-save-to-library"><BookmarkPlus />Save to Library</button>}
      </div>
      <p className="text-xs text-muted-foreground" role="status">{problem ?? "Generated drafts are saved to your project automatically. AI drafts need your review against the original sources."}</p>
    </div>
  );
}
