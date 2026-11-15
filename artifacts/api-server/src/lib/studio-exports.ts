import { objectStorageClient } from "./objectStorage";
import { storage } from "./documents";
import { pool } from "@workspace/db";
import { renderStudioWord } from "./studio-docx";
import { renderStudioPdf } from "./studio-pdf";
import { renderStudioLatex } from "./studio-latex";
export const EXPORT_TYPES={pdf:{ext:"pdf",mime:"application/pdf"},docx:{ext:"docx",mime:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},latex:{ext:"zip",mime:"application/zip"}} as const;
export async function exportStudioFile(row:any,format:keyof typeof EXPORT_TYPES){
  // The LaTeX bundle is rendered on demand and not archived.
  if(format==="latex")return renderStudioLatex(row);
  const bytes=await (format==="docx"?renderStudioWord(row):renderStudioPdf(row));
  const relative=`studio/${row.owner_id}/${row.id}.${format}`;
  const objectPath=`${storage.getPrivateObjectDir().replace(/\/$/,"")}/${relative}`;
  const [bucket,...parts]=objectPath.replace(/^\//,"").split("/");
  await objectStorageClient.bucket(bucket).file(parts.join("/")).save(bytes,{resumable:false,contentType:EXPORT_TYPES[format].mime});
  await pool.query("UPDATE research_studio_items SET metadata=jsonb_set(metadata,$2::text[],$3::jsonb) WHERE id=$1 AND owner_id=$4",[row.id,[`${format}Export`],JSON.stringify(`/objects/${relative}`),row.owner_id]);
  return bytes;
}
