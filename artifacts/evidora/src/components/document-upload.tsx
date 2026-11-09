import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRequestDocumentUpload, useCompleteDocumentUpload, getListDocumentsQueryKey, getGetSummaryQueryKey, type UploadInputContentType, type Document } from "@workspace/api-client-react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { bytes, errMessage } from "@/lib/format";
import { buildWorkflowView, uploadWorkflow } from "@/lib/agent-workflow";
import { WorkflowPanel } from "@/components/agent-progress/workflow-panel";

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const TYPES = ["application/pdf", DOCX, "image/png", "image/jpeg", "image/webp"];
const MAX = 15 * 1024 * 1024;

export function DocumentUpload({ label = "Upload document", onReady, className }: { label?: string; onReady?: (doc: Document) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rights, setRights] = useState(false);
  const [stage, setStage] = useState<"idle" | "ticket" | "put" | "complete">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const request = useRequestDocumentUpload();
  const complete = useCompleteDocumentUpload();

  // Some operating systems report a generic MIME type for valid files. The
  // server independently verifies their magic bytes before accepting them.
  const extensionTypes:Record<string,string>={pdf:"application/pdf",docx:DOCX,png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp"};
  const contentType=file?(!file.type||file.type==="application/octet-stream"?extensionTypes[file.name.split(".").pop()?.toLowerCase()??""]??file.type:file.type):"";
  const fileError = file && !TYPES.includes(contentType) ? "Only PDF, Word (.docx), PNG, JPEG or WebP." : file && file.size > MAX ? "File is larger than 15 MB." : null;
  const busy = stage !== "idle";

  const reset = () => {
    setFile(null);
    setRights(false);
    setStage("idle");
  };

  const go = async () => {
    if (!file || fileError || !rights) return;
    try {
      setStage("ticket");
      const ticket = await request.mutateAsync({
        data: { name: file.name, contentType: contentType as UploadInputContentType, size: file.size, rightsConfirmed: true },
      });
      setStage("put");
      const put = await fetch(ticket.uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);
      setStage("complete");
      const doc = await complete.mutateAsync({ id: ticket.document.id });
      qc.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
      toast({ title: "Document ready", description: doc.status === "failed" ? doc.error || "Processing failed" : doc.name });
      setOpen(false);
      reset();
      if (doc.status !== "failed") onReady?.(doc);
    } catch (e) {
      toast({ title: "Upload failed", description: errMessage(e), variant: "destructive" });
      setStage("idle");
    }
  };

  const stageLabel = { idle: "", ticket: "Requesting upload slot", put: "Sending file", complete: "Extracting and checking" }[stage];

  return (
    <>
      <Button onClick={() => setOpen(true)} className={className ?? "gap-2"} data-testid="button-open-upload">
        <Upload className="h-4 w-4" /> {label}
      </Button>
      <Dialog open={open} onOpenChange={(o) => { if (!busy) { setOpen(o); if (!o) reset(); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Add a private document</DialogTitle>
            <DialogDescription>PDFs up to 50 pages and Word (.docx) files are read for their text. Screenshots (PNG, JPEG, WebP) are analysed as the original image. Max 15 MB.</DialogDescription>
          </DialogHeader>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
            className="grid-paper flex w-full flex-col items-center rounded-md border-2 border-dashed px-4 py-8 text-sm transition-colors hover:border-primary"
            data-testid="dropzone-upload"
          >
            <Upload className="h-6 w-6 text-primary" />
            {file ? (
              <span className="mt-2 font-medium">
                {file.name} <span className="font-mono text-xs text-muted-foreground">{bytes(file.size)}</span>
              </span>
            ) : (
              <span className="mt-2 text-muted-foreground">Drop a file or click to choose</span>
            )}
          </button>
          <input ref={inputRef} type="file" accept={[...TYPES, ".docx"].join(",")} className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} data-testid="input-file" />
          {fileError && <p className="text-sm text-vermilion">{fileError}</p>}
          <label className="flex items-start gap-3 rounded-md border bg-muted/40 p-3 text-sm">
            <Checkbox checked={rights} onCheckedChange={(v) => setRights(v === true)} className="mt-0.5" data-testid="checkbox-rights" />
            <span>
              I have the right to upload this file for my own study.
            </span>
          </label>
          {busy && file && (() => { const u = uploadWorkflow(stage, file.name); return <WorkflowPanel compact view={buildWorkflowView(u.input, u.observed)} />; })()}
          <DialogFooter>
            <span className="mr-auto self-center text-xs text-muted-foreground" role="status">{busy ? "Keep this dialog open until the upload finishes." : stageLabel}</span>
            <Button onClick={go} disabled={!file || !!fileError || !rights || busy} data-testid="button-upload">
              {busy ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
