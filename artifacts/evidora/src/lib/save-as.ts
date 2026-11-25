import { customFetch, exportStudioDocument, type StudioItem } from "@workspace/api-client-react";
import type { StudioExportFormat } from "./studio";

const TYPES: Record<StudioExportFormat, { description: string; accept: Record<string, string[]> }> = {
  pdf: { description: "PDF document", accept: { "application/pdf": [".pdf"] } },
  docx: { description: "Word document", accept: { "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] } },
  latex: { description: "LaTeX source (zip)", accept: { "application/zip": [".zip"] } },
};

export const exportFileName = (title: string, format: StudioExportFormat) =>
  `${(title || "document").replace(/[^\w\- ]+/g, "").slice(0, 80).trim() || "document"}${format === "latex" ? "-latex.zip" : `.${format}`}`;

type SavePicker = (o: { suggestedName: string; types: typeof TYPES[StudioExportFormat][] }) => Promise<{ createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }> }>;

/**
 * Opens the system "Save As" dialog so the user picks the folder and file name.
 * Browsers without it (Firefox, Safari, embedded previews) fall back to a normal download,
 * where the browser's own "ask where to save" setting applies. Returns false if the user cancelled.
 */
export async function saveStudioItemToComputer(item: Pick<StudioItem, "id" | "title">, format: StudioExportFormat) {
  const name = exportFileName(item.title, format);
  const picker = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
  let handle: Awaited<ReturnType<SavePicker>> | undefined;
  if (picker) {
    try { handle = await picker({ suggestedName: name, types: [TYPES[format]] }); }
    catch (e) { if ((e as Error).name === "AbortError") return false; /* Blocked in this frame: download instead. */ }
  }
  const blob = await exportStudioDocument(item.id, { format }, { responseType: "blob" });
  if (handle) { const w = await handle.createWritable(); await w.write(blob); await w.close(); return true; }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  return true;
}

/** Saves a named copy of a finished document into one of the user's project folders. */
export const copyStudioItemToProject = (id: string, projectId: string, title: string) =>
  customFetch<StudioItem>(`/api/studio/items/${encodeURIComponent(id)}/copy`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, title }),
  });
