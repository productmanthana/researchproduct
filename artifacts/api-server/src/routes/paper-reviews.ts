import { Router } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";
import { CreatePaperReviewBody } from "@workspace/api-zod";
import { requireUser, uid, routeId, usage, allowanceReached, HttpError } from "../lib/common";
import { ownedStudio, ownedStudioProject, studioView } from "../lib/studio-store";
import { renderStudioPdf } from "../lib/studio-pdf";
import { scorecardMarkdown } from "../lib/paper-review";
import { studioTemplates } from "../lib/studio-templates";
import { syncProjectItem } from "../lib/studio-index";
import { logger } from "../lib/logger";
const router=Router();
router.use("/studio",requireUser);
router.post("/studio/paper-reviews",async(req,res)=>{
  const b=CreatePaperReviewBody.parse(req.body),owner=uid(req);
  await ownedStudioProject(b.projectId,owner);
  const source=await ownedStudio(b.sourceItemId,owner);
  if(source.project_id!==b.projectId||source.status!=="completed"||!source.content.trim())throw new HttpError(400,"Choose a completed document in this project with readable text.");
  if(source.metadata?.paperReview||source.kind==="document-review")throw new HttpError(400,"Choose the manuscript or revised draft, not a review report.");
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))",[owner]);
    const u=await usage(owner,client);
    if(u.aiServiceRemainingInr<=0||allowanceReached(u.reviewsUsed,u.reviewsLimit))throw new HttpError(429,"Review allowance or service budget reached. See Plans & usage.");
    if((await client.query("SELECT id FROM research_studio_items WHERE owner_id=$1 AND status IN('queued','running') UNION ALL SELECT id FROM research_analyses WHERE owner_id=$1 AND status IN('queued','running')",[owner])).rowCount)throw new HttpError(409,"Wait for your current research request to finish.");
    const id=randomUUID();
    await client.query("INSERT INTO research_usage(id,owner_id,period,kind) VALUES($1,$2,$3,'review')",[id,owner,u.period]);
    const request={...b,prompt:`Assess submission readiness as a ${b.documentType}. ${b.target?`User supplied target requirements: ${b.target}`:"General academic review; no official target guidelines supplied."}`,includePatents:true};
    const {rows}=await client.query("INSERT INTO research_studio_items(id,owner_id,project_id,kind,title,status,metadata) VALUES($1,$2,$3,'document-review',$4,'queued',$5) RETURNING *",[id,owner,b.projectId,`Paper review: ${source.title}`,JSON.stringify({paperReview:true,sourceItemId:source.id,sourceRevision:source.revision,request,stage:"Queued"})]);
    await client.query("COMMIT");res.json(studioView(rows[0]));
  }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
});
router.post("/studio/items/:id/apply-format",async(req,res)=>{
  const owner=uid(req),id=routeId(req),client=await pool.connect();
  let created:any;
  try{
    await client.query("BEGIN");
    const review=(await client.query("SELECT * FROM research_studio_items WHERE id=$1 AND owner_id=$2 FOR UPDATE",[id,owner])).rows[0];
    if(!review?.metadata?.paperReview||review.status!=="completed")throw new HttpError(409,"Complete the requirements and research check first.");
    const check=review.metadata.requirementsCheck,template=studioTemplates.find(t=>t.id===check?.templateId);
    if(check?.status!=="retrieved"||!template||!Object.keys(check.appliedLayout??{}).length)throw new HttpError(409,"No supported format settings were confirmed from readable official instructions. Review the source and unresolved requirements first.");
    const sourceId=review.metadata.currentDraftId??review.metadata.sourceItemId;
    const parent=(await client.query("SELECT * FROM research_studio_items WHERE id=$1 AND owner_id=$2 AND project_id=$3 FOR UPDATE",[sourceId,owner,review.project_id])).rows[0];
    if(!parent||parent.status!=="completed")throw new HttpError(409,"The source draft is no longer available.");
    if(review.metadata.formattedDraftId){
      await client.query("COMMIT");res.json(studioView(parent));return;
    }
    if((await client.query("SELECT id FROM research_studio_items WHERE parent_id=$1",[parent.id])).rowCount)throw new HttpError(409,"Your document has a newer version. Run this check on the latest version before applying its format.");
    const uploaded=parent.kind==="document",content=uploaded?review.content:parent.content;
    const metadata={...parent.metadata,templateId:template.id,requirementsCheck:check,
      documentDetails:review.metadata.documentDetails??parent.metadata.documentDetails??{},
      ...(uploaded?{figures:review.metadata.figures??[]}:{}),formatReviewId:id};
    for(const key of ["pdfExport","docxExport","review","reviewedAt","request","scorecard","paperReview","similarity","customFormat","customFormatWarnings","customFormatStatus"])delete metadata[key];
    if(parent.metadata?.customFormat)metadata.requirementsCheck={...check,checks:[{label:"Official layout applied to a new copy",status:"manual",detail:"The personal layout was replaced by the supported official settings. Inspect the exported file and rerun content checks before submitting."}],coverage:"Earlier checks described the custom source. This new copy needs confirmation after its format change."};
    const nextId=randomUUID(),kind=template.kind==="thesis"?"thesis":template.kind==="synopsis"?"synopsis":"journal";
    created=(await client.query("INSERT INTO research_studio_items(id,owner_id,project_id,kind,title,content,status,parent_id,revision,metadata) VALUES($1,$2,$3,$4,$5,$6,'completed',$7,$8,$9) RETURNING *",
      [nextId,owner,parent.project_id,kind,`Formatted draft: ${review.metadata.originalName??parent.title}`.slice(0,300),content,parent.id,parent.revision+1,JSON.stringify(metadata)])).rows[0];
    review.metadata.currentDraftId=nextId;review.metadata.formattedDraftId=nextId;
    await client.query("UPDATE research_studio_items SET metadata=$3 WHERE id=$1 AND owner_id=$2",[id,owner,JSON.stringify(review.metadata)]);
    await client.query("COMMIT");
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}
  void syncProjectItem(created.id,owner).catch(()=>logger.warn({itemId:created.id},"Formatted draft indexing unavailable"));
  res.json(studioView(created));
});
router.get("/studio/items/:id/scorecard",async(req,res)=>{
  const row=await ownedStudio(routeId(req),uid(req));
  if(row.status!=="completed"||!row.metadata?.scorecard)throw new HttpError(409,"A completed Paper Review is required.");
  const bytes=await renderStudioPdf({title:`Manuscript Readiness Report: ${row.metadata.originalName??row.title}`,content:scorecardMarkdown(row.metadata),metadata:{templateId:"academic-report"}});
  res.setHeader("Cache-Control","private, no-store");
  res.setHeader("Content-Disposition",'attachment; filename="evidora-readiness-report.pdf"');
  res.type("application/pdf").send(bytes);
});
export default router;
