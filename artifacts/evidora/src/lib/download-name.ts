/** Blob downloads need their own filename; the server's header is not inherited. */
export function studioDownloadName(title: string, format: "pdf" | "docx"): string {
  const stem = Array.from(title.replace(/[^\p{L}\p{M}\p{N}_ -]+/gu, "").trim()).slice(0,80).join("");
  return `litvo-${stem || "document"}.${format}`;
}
