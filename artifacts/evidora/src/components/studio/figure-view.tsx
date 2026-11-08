import { useEffect, useState } from "react";
import { useDownloadStudioFigure, getDownloadStudioFigureQueryKey, downloadStudioFigure } from "@workspace/api-client-react";
import { useAuth } from "@clerk/react";
import { Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { friendlyError } from "@/lib/studio";
import { FIGURE_KIND_LABEL, isNumericFigure, isOriginalFigure, type StudioFigure } from "@/lib/figures";

type Fmt = "png" | "svg" | "csv" | "json";
const FMT_LABEL: Record<Fmt, string> = { png: "PNG", svg: "SVG (editable)", csv: "CSV data", json: "JSON source" };

export function FigureView({ itemId, figure, number }: { itemId: string; figure: StudioFigure; number: number }) {
  const { toast } = useToast();
  const { userId } = useAuth();
  const params = { format: "png" as const };
  const q = useDownloadStudioFigure(itemId, figure.id, params, {
    request: { responseType: "blob" },
    query: { queryKey: [...getDownloadStudioFigureQueryKey(itemId, figure.id, params), { user: userId ?? null }], enabled: !!userId, staleTime: Infinity, retry: 1 },
  });
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<Fmt | null>(null);
  useEffect(() => {
    if (!(q.data instanceof Blob)) { setUrl(null); return; }
    const u = URL.createObjectURL(q.data);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [q.data]);

  const formats: Fmt[] = isOriginalFigure(figure) ? ["png"] : ["png", "svg", ...(isNumericFigure(figure) ? ["csv" as const] : []), "json"];
  const download = async (format: Fmt) => {
    setBusy(format);
    try {
      const blob = await downloadStudioFigure(itemId, figure.id, { format }, { responseType: "blob" });
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u;
      a.download = `figure-${number}-${(figure.title || "figure").replace(/[^\w\- ]+/g, "").slice(0, 60).trim() || "figure"}.${format}`;
      document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(() => URL.revokeObjectURL(u), 1500);
    } catch (e) { toast({ title: "Figure download failed", description: friendlyError(e), variant: "destructive" }); }
    finally { setBusy(null); }
  };

  return (
    <figure className="my-7 overflow-hidden rounded-md border bg-[hsl(var(--card))]" data-testid={`figure-${figure.id}`} aria-labelledby={`figcap-${figure.id}`}>
      <div className="flex items-center gap-2 border-b bg-[hsl(66_20%_95%)] px-3 py-1.5">
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-muted-foreground">Fig. {number} &middot; {FIGURE_KIND_LABEL[figure.kind] ?? figure.kind}</span>
        <div className="ml-auto flex flex-wrap gap-1">
          {formats.map(f => <button key={f} type="button" className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-[hsl(var(--muted))] hover:text-foreground disabled:opacity-50" disabled={!!busy} onClick={() => void download(f)} data-testid={`button-figure-${f}-${figure.id}`}><Download className="h-3 w-3" />{busy === f ? "..." : FMT_LABEL[f]}</button>)}
        </div>
      </div>
      <div className="grid-paper flex min-h-[220px] items-center justify-center bg-[hsl(44_40%_99%)] p-4">
        {q.isLoading && <div className="h-[220px] w-full animate-pulse rounded bg-[hsl(var(--muted)/0.7)]" data-testid={`status-figure-loading-${figure.id}`} />}
        {q.isError && <div className="text-center text-sm" role="alert">
          <p className="text-vermilion">Couldn't load the preview for this figure.</p>
          <p className="mt-1 text-xs text-muted-foreground">{friendlyError(q.error)}</p>
          <button type="button" className="sx-btn mt-3" onClick={() => void q.refetch()} data-testid={`button-figure-retry-${figure.id}`}><RefreshCw />Retry</button>
        </div>}
        {url && <img src={url} alt={`Figure ${number}: ${figure.title}. ${figure.caption}`} className="max-h-[520px] w-auto max-w-full" />}
      </div>
      <figcaption id={`figcap-${figure.id}`} className="border-t px-4 py-3 text-[13.5px] leading-relaxed">
        <p><b className="font-semibold">Figure {number}.</b> <span className="font-medium">{figure.title || "Untitled figure"}.</span> {figure.caption}</p>
        <p className="mt-1.5 text-xs text-muted-foreground" data-testid={`text-figure-provenance-${figure.id}`}>
          <span className="font-mono uppercase tracking-wider text-[10px]">Provenance</span> {figure.provenance || (isOriginalFigure(figure) ? "Extracted from your uploaded file, unchanged." : "")}
          {figure.expression && <> &middot; <span className="font-mono">{figure.expression}</span>{figure.range && typeof figure.range.min === "number" && typeof figure.range.max === "number" && ` over [${figure.range.min}, ${figure.range.max}]`}</>}
        </p>
        {figure.sourceQuote && <blockquote className="mt-2 border-l-2 border-[hsl(var(--turmeric))] pl-3 text-xs italic text-muted-foreground">&ldquo;{figure.sourceQuote}&rdquo;</blockquote>}
      </figcaption>
    </figure>
  );
}

export function MissingFigure({ id }: { id: string }) {
  return <p className="my-5 rounded-md border border-dashed px-3 py-2 font-mono text-xs text-muted-foreground" data-testid={`status-figure-missing-${id}`}>[[figure:{id}]] has no saved figure data. Export and saving will be blocked until you remove this marker line or regenerate the figure with "Add or revise a figure".</p>;
}
