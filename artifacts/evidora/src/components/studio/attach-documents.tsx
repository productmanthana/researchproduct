import { useQueryClient } from "@tanstack/react-query";
import { useListDocuments, getListDocumentsQueryKey, useSaveStudioItem, getListStudioItemsQueryKey, type StudioItem } from "@workspace/api-client-react";
import { Check, Paperclip } from "lucide-react";
import { DocumentUpload } from "@/components/document-upload";
import { RowSkeleton, ErrorState } from "@/components/states";
import { useToast } from "@/hooks/use-toast";
import { bytes } from "@/lib/format";
import { friendlyError, meta } from "@/lib/studio";

/** Upload via the existing pipeline, then attach ready documents to the active project. */
export function AttachDocuments({ projectId, items, onOpen, variant = "stacked" }: { projectId: string; items: StudioItem[]; onOpen?: (id: string) => void; variant?: "stacked" | "compact" }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const docs = useListDocuments({ query: { queryKey: getListDocumentsQueryKey(), refetchInterval: q => ((q.state.data ?? []).some(d => d.status !== "ready" && d.status !== "failed") ? 4000 : false) } });
  const save = useSaveStudioItem();
  const attachedIds = new Set(items.map(i => meta(i).documentId).filter(Boolean));

  const attach = async (doc: { id: string; name: string }) => {
    try {
      const item = await save.mutateAsync({ data: { projectId, kind: "document", title: doc.name.slice(0, 300), content: "", documentId: doc.id } });
      await qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
      toast({ title: "Attached", description: `${doc.name} is now part of this project.` });
      onOpen?.(item.id);
    } catch (e) { toast({ title: "Couldn't attach", description: friendlyError(e), variant: "destructive" }); }
  };

  return (
    <div className={`sx-card space-y-3 ${variant === "compact" ? "p-3.5" : "p-4"}`} data-testid="panel-attach-documents">
      <div className="flex items-center justify-between gap-2">
        <p className="sx-eyebrow">{variant === "compact" ? "Reference documents" : "Your uploaded documents"}</p>
        <DocumentUpload label={variant === "compact" ? "Upload file" : "Upload"} />
      </div>
      <p className="text-xs text-muted-foreground">Files stay private to your account. Attach a ready file so drafts can draw on it.</p>
      {docs.isLoading && <RowSkeleton rows={1} />}
      {docs.isError && <ErrorState error={docs.error} onRetry={() => void docs.refetch()} title="Couldn't load documents" />}
      {docs.data && !docs.data.length && <p className="text-xs text-muted-foreground">No uploads yet.</p>}
      <ul className={`${variant === "compact" ? "max-h-44" : "max-h-56"} space-y-1 overflow-y-auto`}>
        {(docs.data ?? []).map(d => {
          const attached = attachedIds.has(d.id);
          const ready = d.status === "ready";
          return (
            <li key={d.id} className="flex items-center gap-2 rounded-md border bg-[hsl(52_40%_98%)] px-2.5 py-2 text-sm" data-testid={`row-document-${d.id}`}>
              <span className="min-w-0 flex-1"><span className="block truncate">{d.name}</span><span className="font-mono text-[10.5px] text-muted-foreground">{bytes(d.size)} &middot; {d.status}{d.error ? ` · ${d.error}` : ""}</span></span>
              {attached ? <span className="sx-chip ok"><Check className="h-3 w-3" />attached</span>
                : <button className="sx-btn !min-h-[30px] !px-2 !text-xs" disabled={!ready || save.isPending} title={ready ? "Attach to project" : "Wait until processing is ready"} onClick={() => void attach(d)} data-testid={`button-attach-${d.id}`}><Paperclip />Attach</button>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
