import { useContext, useEffect, useId, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListDocuments, getListDocumentsQueryKey, useSaveStudioItem, getListStudioItemsQueryKey, type Document, type StudioItem } from "@workspace/api-client-react";
import { ChatAttachments } from "@/components/chat-attachments";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { friendlyError, meta } from "@/lib/studio";
import { useUnsavedGuard } from "@/lib/unsaved";
import { AttachDocuments } from "./attach-documents";
import { AttachmentBusyContext } from "./attachment-context";

/**
 * Paperclip menu for project composers. Scope is the PROJECT, not the message:
 * a ready upload is saved as a project document item (kind=document, documentId) so later drafts can draw on it.
 * Uploads still processing are attached automatically once ready; nothing is claimed before the save succeeds.
 */
export function ProjectAttachMenu({ projectId, items, disabled, onBusyChange }: { projectId: string; items: StudioItem[]; disabled?: boolean; onBusyChange?: (busy: boolean) => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const save = useSaveStudioItem();
  const composerBusy = useContext(AttachmentBusyContext);
  const [pickOpen, setPickOpen] = useState(false);
  const [pending, setPending] = useState<{ document: Document; projectId: string }[]>([]);
  const scope = useRef(projectId);
  scope.current = projectId;
  const guardId = useId();
  useUnsavedGuard(`project-upload-${guardId}`, pending.length > 0 || save.isPending,
    "A file is still processing or being attached. If you leave now, you may need to attach it later from your uploads.");
  const docs = useListDocuments({ query: { queryKey: getListDocumentsQueryKey(), enabled: pending.length > 0, refetchInterval: pending.length ? 4000 : false } });
  const attachedIds = new Set(items.map(i => meta(i).documentId).filter(Boolean));
  const busy = useRef(new Set<string>());
  const working = pending.length > 0 || save.isPending;
  useEffect(() => {
    composerBusy?.(working); onBusyChange?.(working);
    return () => { composerBusy?.(false); onBusyChange?.(false); };
  }, [working, composerBusy, onBusyChange]);

  const attach = async (doc: Document, targetProjectId: string) => {
    const key = `${targetProjectId}:${doc.id}`;
    if (busy.current.has(key)) return;
    busy.current.add(key);
    try {
      await save.mutateAsync({ data: { projectId: targetProjectId, kind: "document", title: doc.name.slice(0, 300), content: "", documentId: doc.id } });
      await qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
      toast({ title: "Added to project evidence", description: `${doc.name} is attached to ${scope.current === targetProjectId ? "this project" : "the project where you started the upload"}.` });
    } catch (e) { toast({ title: "Couldn't attach", description: friendlyError(e), variant: "destructive" }); }
    finally { busy.current.delete(key); setPending(p => p.filter(x => x.document.id !== doc.id || x.projectId !== targetProjectId)); }
  };

  const onReady = (doc: Document) => {
    if (attachedIds.has(doc.id)) return;
    composerBusy?.(true); onBusyChange?.(true);
    if (doc.status === "ready") void attach(doc, projectId);
    else { setPending(p => [...p.filter(x => x.document.id !== doc.id || x.projectId !== projectId), { document: doc, projectId }]); toast({ title: "Processing upload", description: `Keep this page open while ${doc.name} is processed and added to your project.` }); }
  };

  useEffect(() => {
    if (!docs.data || !pending.length) return;
    for (const p of pending) {
      const d = docs.data.find(x => x.id === p.document.id);
      if (d?.status === "ready") void attach(d, p.projectId);
      else if (d?.status === "failed") { setPending(list => list.filter(x => x.document.id !== p.document.id || x.projectId !== p.projectId)); toast({ title: "Upload failed", description: d.error || d.name, variant: "destructive" }); }
    }
    // attach is recreated each render; pending + docs drive this effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs.data, pending]);

  return (
    <span className="sx-attach inline-flex items-center gap-1.5" data-testid="project-attach">
      <ChatAttachments disabled={disabled || save.isPending} onStartUpload={() => setPickOpen(false)} onChooseExisting={() => setPickOpen(true)} onReady={onReady} />
      {pending.length > 0 && <span className="font-mono text-[10.5px] text-muted-foreground" role="status" data-testid="status-attach-pending">Processing {pending.length}</span>}
      <Sheet open={pickOpen} onOpenChange={setPickOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto bg-[hsl(52_30%_96%)] sm:max-w-[420px]" data-testid="drawer-previous-uploads">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle className="sx-title text-xl">Previously uploaded</SheetTitle>
            <SheetDescription>Attaching adds a file to this project's evidence. It does not change any earlier draft or conversation.</SheetDescription>
          </SheetHeader>
          <AttachDocuments projectId={projectId} items={items} variant="compact" />
        </SheetContent>
      </Sheet>
    </span>
  );
}
