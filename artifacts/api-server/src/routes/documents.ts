import { randomUUID } from "node:crypto";
import { Router } from "express";
import { pool } from "@workspace/db";
import { RequestDocumentUploadBody, LinkDocumentBody } from "@workspace/api-zod";
import { getPaper } from "../lib/catalogue";
import { requireUser, uid, routeId, HttpError } from "../lib/common";
import { storage, documentView, ownedDocument, readDocument, extractPages, extractWord, DOCX } from "../lib/documents";
import { ObjectNotFoundError } from "../lib/objectStorage";
const router=Router();
router.get("/documents",requireUser,async(req,res)=>{
  const {rows}=await pool.query("SELECT * FROM research_documents WHERE owner_id=$1 ORDER BY created_at DESC",[uid(req)]);
  res.json(rows.map(documentView));
});
router.post("/documents/upload",requireUser,async(req,res)=>{
  const b=RequestDocumentUploadBody.parse(req.body),owner=uid(req);
  const uploadUrl=await storage.getObjectEntityUploadURL();
  const objectPath=storage.normalizeObjectEntityPath(uploadUrl);
  const client=await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))",[`uploads:${owner}`]);
    const total=await client.query("SELECT coalesce(sum(size),0)::bigint AS bytes,count(*)::int AS n FROM research_documents WHERE owner_id=$1",[owner]);
    if(Number(total.rows[0].bytes)+b.size>250*1024*1024||total.rows[0].n>=100) throw new HttpError(429,"Your private library limit is 100 files or 250 MB.");
    const {rows}=await client.query("INSERT INTO research_documents(id,owner_id,name,content_type,size,object_path) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",[randomUUID(),owner,b.name.slice(0,255),b.contentType,b.size,objectPath]);
    await client.query("COMMIT");
    res.json({document:documentView(rows[0]),uploadUrl});
  } catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}
});
router.post("/documents/:id/complete",requireUser,async(req,res)=>{
  const row=await ownedDocument(routeId(req),uid(req));
  if(row.status==="ready") { res.json(documentView(row)); return; }
  const claim=await pool.query("UPDATE research_documents SET status='processing',error='' WHERE id=$1 AND status IN ('uploading','failed') RETURNING id",[row.id]);
  if(!claim.rowCount) throw new HttpError(409,"The document is already being processed.");
  try {
    const bytes=await readDocument(row);
    await storage.trySetObjectEntityAclPolicy(row.object_path,{owner:uid(req),visibility:"private"});
    const pages=row.content_type==="application/pdf"?await extractPages(bytes):row.content_type===DOCX?await extractWord(bytes):[];
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
router.patch("/documents/:id",requireUser,async(req,res)=>{
  const row=await ownedDocument(routeId(req),uid(req));
  const {paperId}=LinkDocumentBody.parse(req.body);
  if(paperId) {
    await getPaper(paperId);
    if(row.content_type!=="application/pdf") throw new HttpError(400,"Only PDFs can be linked as full-text paper evidence.");
  }
  const active=await pool.query("SELECT id FROM research_analyses WHERE owner_id=$1 AND status IN ('queued','running') AND input->'documentIds' ? $2",[uid(req),row.id]);
  if(active.rowCount) throw new HttpError(409,"Wait until the current analysis completes before changing its document links.");
  const {rows}=await pool.query("UPDATE research_documents SET paper_id=$3 WHERE id=$1 AND owner_id=$2 RETURNING *",[row.id,uid(req),paperId]);
  res.json(documentView(rows[0]));
});
router.delete("/documents/:id",requireUser,async(req,res)=>{
  const row=await ownedDocument(routeId(req),uid(req));
  const linked=await pool.query("SELECT id FROM research_studio_items WHERE owner_id=$1 AND metadata->>'documentId'=$2 LIMIT 1",[uid(req),row.id]);
  if(linked.rowCount)throw new HttpError(409,"Remove this document's saved project items from My Library before deleting the original upload.");
  if(row.status==="processing") throw new HttpError(409,"Wait for document processing to finish before deleting.");
  const active=await pool.query("SELECT id FROM research_analyses WHERE owner_id=$1 AND status IN ('queued','running') AND input->'documentIds' ? $2",[uid(req),row.id]);
  if(active.rowCount) throw new HttpError(409,"Wait for the analysis using this document to finish.");
  const assets=await pool.query("SELECT object_path FROM research_page_assets WHERE document_id=$1",[row.id]);
  for(const asset of assets.rows) {
    try {const file=await storage.getObjectEntityFile(asset.object_path);await file.delete({ignoreNotFound:true});}
    catch(e) {if(!(e instanceof ObjectNotFoundError))throw e;}
  }
  try { const file=await storage.getObjectEntityFile(row.object_path); await file.delete({ignoreNotFound:true}); } catch(e) { if(row.status==="ready"&&!(e instanceof ObjectNotFoundError)) throw e; }
  await pool.query("DELETE FROM research_documents WHERE id=$1 AND owner_id=$2",[row.id,uid(req)]);
  res.json({status:"deleted"});
});
export default router;
