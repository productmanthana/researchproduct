import { Router } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";
import { CreatePaperReviewBody } from "@workspace/api-zod";
import { requireUser, uid, routeId, usage, allowanceReached, HttpError } from "../lib/common";
import { ownedStudio, ownedStudioProject, studioView } from "../lib/studio-store";
import { renderStudioPdf } from "../lib/studio-pdf";
import { scorecardMarkdown } from "../lib/paper-review";
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
router.get("/studio/items/:id/scorecard",async(req,res)=>{
  const row=await ownedStudio(routeId(req),uid(req));
  if(row.status!=="completed"||!row.metadata?.scorecard)throw new HttpError(409,"A completed Paper Review is required.");
  const bytes=await renderStudioPdf({title:`Manuscript Readiness Report: ${row.metadata.originalName??row.title}`,content:scorecardMarkdown(row.metadata),metadata:{templateId:"academic-report"}});
  res.setHeader("Cache-Control","private, no-store");
  res.setHeader("Content-Disposition",'attachment; filename="evidora-readiness-report.pdf"');
  res.type("application/pdf").send(bytes);
});
export default router;
