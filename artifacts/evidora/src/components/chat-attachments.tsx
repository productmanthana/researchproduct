import { useState } from "react";
import "./chat-attachments.css";
import type { Document } from "@workspace/api-client-react";
import { FileText, Files, Paperclip } from "lucide-react";
import { DocumentUpload } from "./document-upload";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

/** Keep the upload dialog mounted outside the menu so closing the menu cannot cancel an upload. */
export function ChatAttachments({ onReady, onChooseExisting, onStartUpload, disabled }: {
  onReady: (doc: Document) => void; onChooseExisting: () => void; onStartUpload: () => void; disabled?: boolean;
}) {
  const [kind, setKind] = useState<"pdf" | "word">("pdf");
  const [uploadOpen, setUploadOpen] = useState(false);
  const choose = (next: "pdf" | "word") => {
    setKind(next); onStartUpload(); setUploadOpen(true);
  };
  return <>
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button type="button" className="es-attachment-trigger" aria-label="Attach a document" title="Attach a document" disabled={disabled} data-testid="button-chat-attachments">
          <Paperclip aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={10}
        className="w-[276px] max-w-[calc(100vw-24px)] rounded-xl border-[#d6ded3] bg-[#fdfdf8] p-1.5 shadow-xl"
        onCloseAutoFocus={event => { if (uploadOpen) event.preventDefault(); }}>
        <DropdownMenuLabel className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Add to your conversation</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => choose("pdf")} className="cursor-pointer gap-3 rounded-lg p-3" data-testid="menu-upload-pdf">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700"><FileText aria-hidden="true" /></span>
          <span className="flex-1"><span className="block font-medium">Upload PDF</span><span className="block text-xs text-muted-foreground">Research papers and documents</span></span>
          <span className="text-[10px] text-muted-foreground">.pdf</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => choose("word")} className="cursor-pointer gap-3 rounded-lg p-3" data-testid="menu-upload-word">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><FileText aria-hidden="true" /></span>
          <span className="flex-1"><span className="block font-medium">Upload Word</span><span className="block text-xs text-muted-foreground">Drafts, proposals and notes</span></span>
          <span className="text-[10px] text-muted-foreground">.docx</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onChooseExisting} className="cursor-pointer gap-3 rounded-lg p-3" data-testid="button-pick-document">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e9eee5] text-[#2e6259]"><Files aria-hidden="true" /></span>
          <span><span className="block font-medium">Previously uploaded</span><span className="block text-xs text-muted-foreground">Choose a file from your documents</span></span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <DocumentUpload fileKind={kind} open={uploadOpen} onOpenChange={setUploadOpen} hideTrigger onReady={onReady} />
  </>;
}
