import { Router } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";
import { CreateDocumentReviewBody,DecideDocumentReviewBody } from "@workspace/api-zod";
import { requireUser,uid,routeId,usage,allowanceReached,HttpError } from "../lib/common";
import { ownedStudioProject,ownedStudio,studioView } from "../lib/studio-store";
import { ownedDocument,DOCX } from "../lib/documents";
import { applyTextSuggestion,type ReviewSuggestion } from "../lib/document-review";
import { referencedFigures } from "../lib/scientific-figures";
const router=Router();
router.use("/studio",requireUser);

router.post("/studio/document-reviews",async(req,res)=>{
  const b=CreateDocumentReviewBody.parse(req.body),owner=uid(req);
  await ownedStudioProject(b.projectId,owner);
  const document=await ownedDocument(b.documentId,owner);
  if(document.status!=="ready")throw new HttpError(400,"Wait for the upload to finish processing.");
  if(!["application/pdf",DOCX].includes(document.content_type))throw new HttpError(400,"Choose a PDF or Word (.docx) document.");
  if(document.content_type==="application/pdf"&&b.pageNumbers?.some(n=>n>document.page_count))throw new HttpError(400,"A requested visual page is outside the uploaded PDF.");
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))",[owner]);
    const u=await usage(owner,client);
    if(u.aiServiceRemainingInr<=0)throw new HttpError(429,"Monthly service AI budget reached. No review was started.");
    if(allowanceReached(u.reviewsUsed,u.reviewsLimit))throw new HttpError(429,"Review limit reached. See Plans & usage for your allowance.");
    const active=await client.query("SELECT id FROM research_studio_items WHERE owner_id=$1 AND status IN('queued','running') UNION ALL SELECT id FROM research_analyses WHERE owner_id=$1 AND status IN('queued','running')",[owner]);
    if(active.rowCount)throw new HttpError(409,"Wait for your current research request to finish.");
    const id=randomUUID();
    await client.query("INSERT INTO research_usage(id,owner_id,period,kind) VALUES($1,$2,$3,'review')",[id,owner,u.period]);
    const {rows}=await client.query(`INSERT INTO research_studio_items(id,owner_id,project_id,kind,title,status,metadata) VALUES($1,$2,$3,'document-review',$4,'queued',$5) RETURNING *`,[id,owner,b.projectId,`Review: ${document.name}`,JSON.stringify({request:b,documentId:document.id,originalName:document.name,stage:"Queued"})]);
    await client.query("COMMIT");res.json(studioView(rows[0]));
  }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
});

router.post("/studio/items/:id/review-decisions",async(req,res)=>{
  const owner=uid(req),id=routeId(req),b=DecideDocumentReviewBody.parse(req.body);
  await ownedStudio(id,owner);
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    const row=(await client.query("SELECT * FROM research_studio_items WHERE id=$1 AND owner_id=$2 FOR UPDATE",[id,owner])).rows[0];
    if(!row||row.kind!=="document-review"||row.status!=="completed")throw new HttpError(409,"This document review is not ready.");
    const suggestions:ReviewSuggestion[]=row.metadata.reviewSuggestions??[];
    const suggestion=suggestions.find(s=>s.id===b.suggestionId);
    if(!suggestion)throw new HttpError(404,"Suggestion not found.");
    if(suggestion.decision!=="pending"){
      if(suggestion.decision!==(b.action==="approve"?"approved":"dismissed"))throw new HttpError(409,"This suggestion already has a different decision.");
      await client.query("COMMIT");res.json(studioView(row));return;
    }
    if((row.metadata.currentDraftId??null)!==b.expectedDraftId)throw new HttpError(409,"The working draft changed in another session. Refresh the review before deciding.");
    if(b.action==="dismiss")suggestion.decision="dismissed";
    else{
      if(!suggestion.canApply)throw new HttpError(400,"This suggestion requires author input and cannot be applied automatically.");
      const current=row.metadata.currentDraftId?(await client.query("SELECT * FROM research_studio_items WHERE id=$1 AND owner_id=$2 AND project_id=$3 FOR UPDATE",[row.metadata.currentDraftId,owner,row.project_id])).rows[0]:row;
      if(!current)throw new HttpError(409,"The working draft was removed. Start a new review of the original document.");
      if((await client.query("SELECT id FROM research_studio_items WHERE parent_id=$1",[current.id])).rowCount)throw new HttpError(409,"This draft has a newer revision outside the review. Review the latest saved draft before applying further suggestions.");
      let content=current.content;
      if(suggestion.type==="text"){
        try{content=applyTextSuggestion(content,suggestion);}catch(e){throw new HttpError(409,e instanceof Error?e.message:"The passage changed. Review it again.");}
      }else{
        if(!suggestion.figure||!suggestion.imageId)throw new HttpError(400,"No validated diagram reconstruction is available.");
        const marker=`[[figure:${suggestion.imageId}]]`;
        if(!content.includes(marker))throw new HttpError(409,"This visual has already been replaced. Review the revised diagram before changing it again.");
        content=content.replace(marker,`[[figure:${suggestion.figure.id}]]`);
      }
      const figureSet=[...(row.metadata.figures??[]),...(current.metadata.figures??[])];
      const figures=referencedFigures(content,figureSet);
      const approvedIds=new Set([...suggestions.filter(s=>s.decision==="approved").flatMap(s=>s.sourceIds),...suggestion.sourceIds]);
      const sources=(row.metadata.reviewSources??[]).filter((s:any)=>approvedIds.has(s.id));
      // Keep the original references intact; additional review evidence is explicitly separate.
      content=content.replace(/\n\n## Evidence for approved review changes\n[\s\S]*$/,"");
      if(sources.length)content+=`\n\n## Evidence for approved review changes\n\n${sources.map((s:any)=>`[${s.id}] ${s.title}. ${s.url}\nEvidence: ${s.evidenceLevel}`).join("\n\n")}`;
      const nextId=randomUUID(),metadata={...current.metadata,reviewId:row.id,figures,sources,reviewedWorkingDraft:true};
      for(const key of ["pdfExport","docxExport","review","reviewedAt","reviewSuggestions","currentDraftId","request","figureRevisionOf","paperReview","scorecard","similarity","sourceItemId","sourceRevision"])delete metadata[key];
      metadata.warnings=["Converted working draft with individually approved changes. Original uploaded file and its layout are preserved separately. Recheck citations, numerical values and formatting before publication."];
      await client.query(`INSERT INTO research_studio_items(id,owner_id,project_id,kind,title,content,parent_id,revision,metadata)
        VALUES($1,$2,$3,'answer',$4,$5,$6,$7,$8)`,[nextId,owner,row.project_id,`Reviewed draft: ${row.metadata.originalName}`,content,current.id,current.revision+1,JSON.stringify(metadata)]);
      row.metadata.currentDraftId=nextId;
      suggestion.decision="approved";
    }
    row.metadata.reviewSuggestions=suggestions;
    await client.query("UPDATE research_studio_items SET metadata=$3 WHERE id=$1 AND owner_id=$2",[id,owner,JSON.stringify(row.metadata)]);
    await client.query("COMMIT");res.json(studioView(row));
  }catch(e){await client.query("ROLLBACK");if((e as any)?.code==="23505")throw new HttpError(409,"A newer revision was saved. Refresh before approving.");throw e;}finally{client.release();}
});
export default router;
