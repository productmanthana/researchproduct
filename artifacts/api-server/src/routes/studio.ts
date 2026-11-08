import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { pool } from "@workspace/db";
import { SaveStudioItemBody, GenerateStudioDocumentBody, ListStudioItemsQueryParams, ExportStudioDocumentQueryParams, SearchStudioPatentsQueryParams } from "@workspace/api-zod";
import { requireUser, uid, routeId, usage, allowanceReached, HttpError } from "../lib/common";
import { studioView, ownedStudio, ownedStudioProject } from "../lib/studio-store";
import { ownedDocument } from "../lib/documents";
import { syncProjectItem, removeProjectVectors } from "../lib/studio-index";
import { exportStudioFile } from "../lib/studio-exports";
import { reviewDocument } from "../lib/studio-checks";
import { studioTemplates } from "../lib/studio-templates";
import { formatIssues } from "../lib/studio-formatting";
import { searchPatents } from "../lib/studio-patents";
import { storage } from "../lib/documents";
const router=Router();
router.use("/studio",requireUser);
router.get("/studio/templates",async(_req,res)=>res.json(studioTemplates));
router.get("/studio/items",async(req,res)=>{
  const {projectId}=ListStudioItemsQueryParams.parse(req.query),owner=uid(req);
  await ownedStudioProject(projectId,owner);
  const {rows}=await pool.query("SELECT * FROM research_studio_items WHERE project_id=$1 AND owner_id=$2 ORDER BY created_at DESC LIMIT 500",[projectId,owner]);
  res.json(rows.map(studioView));
});
router.get("/studio/items/:id",async(req,res)=>res.json(studioView(await ownedStudio(routeId(req),uid(req)))));
router.post("/studio/items",async(req,res)=>{
  const b=SaveStudioItemBody.parse(req.body),owner=uid(req);
  await ownedStudioProject(b.projectId,owner);
  let parent:any,content=b.content,metadata:Record<string,any>={};
  if(b.parentId){
    parent=await ownedStudio(z.string().uuid().parse(b.parentId),owner);
    if(parent.project_id!==b.projectId||parent.status!=="completed")throw new HttpError(400,"Select a completed document in this project to revise.");
    metadata={...parent.metadata,edited:true};
    delete metadata.pdfExport;delete metadata.docxExport;
    delete metadata.review;delete metadata.reviewedAt;
  }
  if(b.templateId){
    if(!studioTemplates.some(t=>t.id===b.templateId&&t.kind===b.kind))throw new HttpError(400,"Choose a profile matching this document type.");
    metadata.templateId=b.templateId;
  }
  if(b.documentDetails)metadata.documentDetails=b.documentDetails;
  if(b.templateId===null)delete metadata.templateId;
  if(!b.title.trim())throw new HttpError(400,"Enter a document title.");
  if(b.documentId){
    const document=await ownedDocument(b.documentId,owner);
    if(document.status!=="ready")throw new HttpError(400,"Wait for document processing to finish.");
    content=document.pages.map((p:any)=>`Page ${p.page}\n${p.text}`).join("\n\n");
    metadata.documentId=document.id;
    if(!content.trim())metadata.warnings=["This document has no extracted text. Original image analysis is available during generation."];
  }
  if(b.analysisId){
    const {rows}=await pool.query("SELECT * FROM research_analyses WHERE id=$1 AND owner_id=$2 AND status='completed'",[b.analysisId,owner]);
    if(!rows[0])throw new HttpError(404,"Completed research answer not found.");
    const result=rows[0].result;
    // User edits are allowed; bibliography and evidence remain preserved separately.
    content=b.content||result.content;
    const sources=result.sources??[];
    if(sources.length&&!/^#{1,3}\s+References/im.test(content))content+=`\n\n## References\n\n${sources.map((s:any,i:number)=>`[${i+1}] ${s.title}. ${s.url??""}`).join("\n\n")}`;
    metadata={...metadata,analysisId:b.analysisId,sources,warnings:result.warnings??[]};
  }
  try{
    const {rows}=await pool.query(`INSERT INTO research_studio_items(id,owner_id,project_id,kind,title,content,parent_id,revision,metadata)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[randomUUID(),owner,b.projectId,b.kind,b.title.trim(),content,parent?.id??null,(parent?.revision??0)+1,JSON.stringify(metadata)]);
    res.json(studioView(rows[0]));
  }catch(e:any){
    if(e.code==="23505")throw new HttpError(409,"A newer revision already exists. Open it before saving again; your current text has not been overwritten.");
    throw e;
  }
});
router.post("/studio/generate",async(req,res)=>{
  const b=GenerateStudioDocumentBody.parse(req.body),owner=uid(req);
  await ownedStudioProject(b.projectId,owner);
  if(b.parentId){
    const parent=await ownedStudio(b.parentId,owner);
    if(parent.project_id!==b.projectId||parent.status!=="completed")throw new HttpError(400,"The context document must be completed and belong to this project.");
  }
  if(b.templateId&&!studioTemplates.some(t=>t.id===b.templateId&&t.kind===b.kind))throw new HttpError(400,"Choose a profile matching this document type.");
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))",[owner]);
    const u=await usage(owner,client),kind=b.kind==="literature"?"review":"answer";
    if(u.aiServiceRemainingInr<=0)throw new HttpError(429,"Service AI budget limit reached. Please return after the monthly reset.");
    if(allowanceReached(kind==="review"?u.reviewsUsed:u.answersUsed,kind==="review"?u.reviewsLimit:u.answersLimit))throw new HttpError(429,`${kind==="review"?"Literature review":"Answer"} limit reached. See Plans & usage for your allowance.`);
    const active=await client.query(`SELECT id FROM research_studio_items WHERE owner_id=$1 AND status IN('queued','running')
      UNION ALL SELECT id FROM research_analyses WHERE owner_id=$1 AND status IN('queued','running')`,[owner]);
    if(active.rowCount)throw new HttpError(409,"Please wait for your current research request to finish.");
    const id=randomUUID();
    await client.query("INSERT INTO research_usage(id,owner_id,period,kind) VALUES($1,$2,$3,$4)",[id,owner,u.period,kind]);
    const {rows}=await client.query(`INSERT INTO research_studio_items(id,owner_id,project_id,kind,title,status,metadata)
      VALUES($1,$2,$3,$4,$5,'queued',$6) RETURNING *`,[id,owner,b.projectId,b.kind,b.prompt.slice(0,200),JSON.stringify({request:b,stage:"Queued",templateId:b.templateId??null,documentDetails:b.documentDetails??{}})]);
    await client.query("COMMIT");res.json(studioView(rows[0]));
  }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
});
router.get("/studio/items/:id/export",async(req,res)=>{
  const row=await ownedStudio(routeId(req),uid(req)),{format}=ExportStudioDocumentQueryParams.parse(req.query);
  if(row.status!=="completed")throw new HttpError(409,"Wait for the document to finish before exporting.");
  const bytes=await exportStudioFile(row,format);
  res.setHeader("Cache-Control","private, no-store");
  res.setHeader("Content-Disposition",`attachment; filename="evidora-${row.kind}-v${row.revision}.${format}"`);
  res.type(format==="pdf"?"application/pdf":"application/vnd.openxmlformats-officedocument.wordprocessingml.document").send(bytes);
});
router.post("/studio/items/:id/check",async(req,res)=>{
  const row=await ownedStudio(routeId(req),uid(req));
  if(row.status!=="completed")throw new HttpError(409,"Wait for the document to finish.");
  const {rows}=await pool.query(`WITH RECURSIVE family AS (
    SELECT id,parent_id FROM research_studio_items WHERE id=$3 AND owner_id=$1
    UNION ALL SELECT s.id,s.parent_id FROM research_studio_items s JOIN family f ON f.parent_id=s.id WHERE s.owner_id=$1
  ), descendants AS (
    SELECT id FROM research_studio_items WHERE id=$3 AND owner_id=$1
    UNION ALL SELECT s.id FROM research_studio_items s JOIN descendants d ON s.parent_id=d.id WHERE s.owner_id=$1
  ) SELECT s.title,s.content FROM research_studio_items s WHERE s.owner_id=$1 AND s.project_id=$2
    AND s.id NOT IN(SELECT id FROM family UNION SELECT id FROM descendants) AND s.status='completed'
    AND NOT EXISTS(SELECT 1 FROM research_studio_items c WHERE c.parent_id=s.id) LIMIT 100`,[uid(req),row.project_id,row.id]);
  const references=await pool.query("SELECT p.data FROM research_library l JOIN research_papers p ON p.id=l.paper_id WHERE l.owner_id=$1 AND l.project_id=$2",[uid(req),row.project_id]);
  const sourceEvidence=(row.metadata?.sources??[]).filter((s:any)=>s.text).map((s:any)=>({title:s.title,content:s.text,url:s.url}));
  const result={...reviewDocument(row.content,[...rows,...references.rows.map(r=>({title:r.data.title,content:r.data.abstract??"",url:r.data.doi?`https://doi.org/${r.data.doi}`:undefined})),...sourceEvidence]),formatIssues:formatIssues(row),profileName:studioTemplates.find(t=>t.id===row.metadata?.templateId)?.name??"General academic"};
  await pool.query("UPDATE research_studio_items SET metadata=metadata||$3::jsonb WHERE id=$1 AND owner_id=$2",[row.id,uid(req),JSON.stringify({review:result,reviewedAt:new Date().toISOString()})]);
  res.json(result);
});
router.post("/studio/items/:id/sync",async(req,res)=>{
  const row=await ownedStudio(routeId(req),uid(req));
  if(row.index_status==="indexing")throw new HttpError(409,"Indexing is already in progress.");
  await syncProjectItem(row.id,uid(req));
  res.json(studioView(await ownedStudio(row.id,uid(req))));
});
router.delete("/studio/items/:id",async(req,res)=>{
  const row=await ownedStudio(routeId(req),uid(req));
  if(["queued","running"].includes(row.status))throw new HttpError(409,"Wait for processing to finish before deleting.");
  if(row.index_status==="indexing")throw new HttpError(409,"Wait for indexing to finish before deleting.");
  // Remove indexed content before deleting the owner record, so failures can be retried safely.
  if(row.index_status==="indexed"||row.index_status==="indexing"||row.index_status==="unavailable")await removeProjectVectors(row.id,uid(req));
  for(const format of ["pdf","docx"]){
    const path=row.metadata?.[`${format}Export`];
    if(path){try{const file=await storage.getObjectEntityFile(path);await file.delete({ignoreNotFound:true});}catch{throw new HttpError(503,"The exported file could not be removed. Please retry deletion.");}}
  }
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    await client.query("DELETE FROM research_studio_items WHERE id=$1 AND owner_id=$2",[row.id,uid(req)]);
    await client.query("UPDATE research_studio_items SET parent_id=$3 WHERE parent_id=$1 AND owner_id=$2",[row.id,uid(req),row.parent_id]);
    await client.query("COMMIT");
  }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
  res.json({status:"deleted"});
});
router.get("/studio/patents",async(req,res)=>{
  const b=SearchStudioPatentsQueryParams.parse(req.query);
  const q=z.string().trim().min(3).max(500).parse(b.q);
  res.json(await searchPatents(q,b.region));
});
export default router;
