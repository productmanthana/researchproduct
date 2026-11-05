import { randomUUID } from "node:crypto";
import { Router } from "express";
import { pool } from "@workspace/db";
import { RequestDocumentUploadBody } from "@workspace/api-zod";
import { requireUser, uid, routeId, HttpError } from "../lib/common";
import { storage, documentView, ownedDocument, readDocument, extractPages } from "../lib/documents";
const router=Router();
router.get("/documents",requireUser,async(req,res)=>{
  const {rows}=await pool.query("SELECT * FROM research_documents WHERE owner_id=$1 ORDER BY created_at DESC",[uid(req)]);
  res.json(rows.map(documentView));
});
router.post("/documents/upload",requireUser,async(req,res)=>{
  const b=RequestDocumentUploadBody.parse(req.body),owner=uid(req);
  const total=await pool.query("SELECT coalesce(sum(size),0)::bigint AS bytes,count(*)::int AS n FROM research_documents WHERE owner_id=$1",[owner]);
  if(Number(total.rows[0].bytes)+b.size>250*1024*1024 || total.rows[0].n>=100) throw new HttpError(429,"Your private library limit is 100 files or 250 MB.");
  const uploadUrl=await storage.getObjectEntityUploadURL();
  const objectPath=storage.normalizeObjectEntityPath(uploadUrl);
  const {rows}=await pool.query("INSERT INTO research_documents(id,owner_id,name,content_type,size,object_path) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",[randomUUID(),owner,b.name.slice(0,255),b.contentType,b.size,objectPath]);
  res.json({document:documentView(rows[0]),uploadUrl});
});
router.post("/documents/:id/complete",requireUser,async(req,res)=>{
  const row=await ownedDocument(routeId(req),uid(req));
  if(row.status==="ready") { res.json(documentView(row)); return; }
  const claim=await pool.query("UPDATE research_documents SET status='processing',error='' WHERE id=$1 AND status IN ('uploading','failed') RETURNING id",[row.id]);
  if(!claim.rowCount) throw new HttpError(409,"The document is already being processed.");
  try {
    const bytes=await readDocument(row);
    await storage.trySetObjectEntityAclPolicy(row.object_path,{owner:uid(req),visibility:"private"});
    const pages=row.content_type==="application/pdf"?await extractPages(bytes):[];
    const {rows}=await pool.query("UPDATE research_documents SET status='ready',pages=$2,page_count=$3,error=$4 WHERE id=$1 RETURNING *",[row.id,JSON.stringify(pages),pages.length||1,pages.length && !pages.some(p=>p.text.trim().length>20)?"No readable text layer. Use image analysis for visual evidence.":""]);
    res.json(documentView(rows[0]));
  } catch(e) {
    await pool.query("UPDATE research_documents SET status='failed',error=$2 WHERE id=$1",[row.id,e instanceof HttpError?e.message:"Could not read this document. Try an unlocked PDF or a PNG/JPEG screenshot."]);
    throw e instanceof HttpError?e:new HttpError(400,"Could not read this file. Try an unlocked PDF or a screenshot.");
  }
});
router.get("/documents/:id/file",requireUser,async(req,res)=>{
  const row=await ownedDocument(routeId(req),uid(req));
  if(row.status!=="ready") throw new HttpError(409,"Document is not ready.");
  const bytes=await readDocument(row);
  res.setHeader("Content-Type",row.content_type);
  res.setHeader("Cache-Control","private, no-store");
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("Content-Disposition",`inline; filename*=UTF-8''${encodeURIComponent(row.name)}`);
  res.send(bytes);
});
router.delete("/documents/:id",requireUser,async(req,res)=>{
  const row=await ownedDocument(routeId(req),uid(req));
  if(row.status==="processing") throw new HttpError(409,"Wait for document processing to finish before deleting.");
  const active=await pool.query("SELECT id FROM research_analyses WHERE owner_id=$1 AND status IN ('queued','running') AND input->'documentIds' ? $2",[uid(req),row.id]);
  if(active.rowCount) throw new HttpError(409,"Wait for the analysis using this document to finish.");
  try { const file=await storage.getObjectEntityFile(row.object_path); await file.delete({ignoreNotFound:true}); } catch(e) { if(row.status==="ready") throw e; }
  await pool.query("DELETE FROM research_documents WHERE id=$1 AND owner_id=$2",[row.id,uid(req)]);
  res.json({status:"deleted"});
});
export default router;
