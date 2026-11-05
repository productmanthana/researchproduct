import { randomUUID } from "node:crypto";
import { Router } from "express";
import { pool } from "@workspace/db";
import { CreateAnalysisBody, UpdateAnalysisBody, ExportAnalysisQueryParams } from "@workspace/api-zod";
import { exportResearch } from "../lib/exports";
import { requireUser, uid, routeId, usage, HttpError } from "../lib/common";
import { analysisView } from "../lib/analysis-view";
import { ownedDocument } from "../lib/documents";
import { getPaper } from "../lib/catalogue";
import { comparisonFields } from "../lib/comparison";
import { analysisSnapshot } from "../lib/analysis-input";
const router=Router();
async function ownedAnalysis(id:string,owner:string) {
  const {rows}=await pool.query("SELECT * FROM research_analyses WHERE id=$1 AND owner_id=$2",[id,owner]);
  if(!rows[0]) throw new HttpError(404,"Analysis not found.");
  return rows[0];
}
router.get("/analyses",requireUser,async(req,res)=>{
  const {rows}=await pool.query("SELECT * FROM research_analyses WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 100",[uid(req)]);
  res.json(rows.map(analysisView));
});
router.post("/analyses",requireUser,async(req,res)=>{
  const b=CreateAnalysisBody.parse(req.body),owner=uid(req);
  const paperIds=[...new Set(b.paperIds??[])];
  let documentIds=[...new Set(b.documentIds??[])];
  if(paperIds.length>(b.kind==="review"?50:10) || documentIds.length>3) throw new HttpError(400,"Select up to 10 papers (50 for a review) and 3 documents.");
  if(b.kind==="review" && paperIds.length<10) throw new HttpError(400,"Select 10–50 papers for a literature review.");
  if(!paperIds.length && !documentIds.length) throw new HttpError(400,"Select papers or upload documents to supply evidence.");
  for(const id of paperIds) await getPaper(id);
  if(b.includeLinkedDocuments && paperIds.length) {
    const linked=await pool.query("SELECT DISTINCT ON (paper_id) id FROM research_documents WHERE owner_id=$1 AND paper_id=ANY($2::text[]) AND status='ready' AND content_type='application/pdf' ORDER BY paper_id,created_at DESC",[owner,paperIds]);
    documentIds=[...new Set([...documentIds,...linked.rows.map(r=>r.id as string)])];
  }
  const docs=await Promise.all(documentIds.map(id=>ownedDocument(id,owner)));
  if(docs.some(d=>d.status!=="ready")) throw new HttpError(400,"Wait for your documents to finish processing.");
  if(b.kind==="image" && !docs.length) throw new HttpError(400,"Select a screenshot or PDF for visual analysis.");
  if(b.kind==="image" && docs.length>3) throw new HttpError(400,"Visual analysis accepts at most 3 files. Disable linked PDFs or reduce your selection.");
  if(b.pageNumbers?.length && b.kind!=="image") throw new HttpError(400,"Page selection applies to visual analysis only.");
  if(b.pageNumbers?.length && docs.some(d=>d.content_type==="application/pdf"&&b.pageNumbers!.some(n=>n>d.page_count))) throw new HttpError(400,"A selected page is outside one of your PDFs. Select valid pages or analyse the files separately.");
  // Readability is checked by the worker after lawful full-text retrieval.
  const client=await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))",[owner]);
    const u=await usage(owner,client),key=b.kind==="answer"?"answers":b.kind==="review"?"reviews":"images";
    if(u[`${key}Used`]>=u[`${key}Limit`]) throw new HttpError(429,"You have reached your allowance. Paid upgrades are not connected yet.");
    const active=await client.query("SELECT id FROM research_analyses WHERE owner_id=$1 AND status IN ('queued','running')",[owner]);
    if(active.rowCount) throw new HttpError(409,"Wait for your current analysis to finish before starting another.");
    const id=randomUUID();
    await client.query("INSERT INTO research_usage(id,owner_id,period,kind) VALUES($1,$2,$3,$4)",[id,owner,u.period,b.kind]);
    const {rows}=await client.query("INSERT INTO research_analyses(id,owner_id,kind,question,input) VALUES($1,$2,$3,$4,$5) RETURNING *",[id,owner,b.kind,b.question,JSON.stringify(analysisSnapshot(b,paperIds,documentIds))]);
    await client.query("COMMIT");
    res.json(analysisView(rows[0]));
  } catch(e) {await client.query("ROLLBACK");throw e;} finally {client.release();}
});
router.get("/analyses/:id",requireUser,async(req,res)=>res.json(analysisView(await ownedAnalysis(routeId(req),uid(req)))));
router.patch("/analyses/:id",requireUser,async(req,res)=>{
  const row=await ownedAnalysis(routeId(req),uid(req));
  if(row.status!=="completed") throw new HttpError(409,"Only completed analyses can be edited.");
  const {content,comparisonRows}=UpdateAnalysisBody.parse(req.body);
  if(content===undefined&&comparisonRows===undefined) throw new HttpError(400,"Provide draft content or comparison edits.");
  let editedRows=row.result.comparisonRows??[];
  if(comparisonRows) {
    if(comparisonRows.length!==editedRows.length||new Set(comparisonRows.map(r=>r.paperId)).size!==editedRows.length) throw new HttpError(400,"Comparison edits must keep the original papers.");
    editedRows=editedRows.map((original:any)=>{
      const edit=comparisonRows.find(r=>r.paperId===original.paperId);
      if(!edit) throw new HttpError(400,"Comparison paper does not belong to this analysis.");
      return {...original,...Object.fromEntries(comparisonFields.map(field=>[field,edit[field].text===original[field].text?original[field]:{...original[field],text:edit[field].text,status:"edited"}]))};
    });
  }
  const result={...row.result,content:content??row.result.content,comparisonRows:editedRows,warnings:[...new Set([...(row.result.warnings??[]),"Edited by the user. Changes have not been checked against source evidence."])]};
  const {rows}=await pool.query("UPDATE research_analyses SET result=$3 WHERE id=$1 AND owner_id=$2 RETURNING *",[row.id,uid(req),JSON.stringify(result)]);
  res.json(analysisView(rows[0]));
});
router.delete("/analyses/:id",requireUser,async(req,res)=>{
  const row=await ownedAnalysis(routeId(req),uid(req));
  if(["queued","running"].includes(row.status)) throw new HttpError(409,"Wait for the analysis to finish before deleting.");
  await pool.query("DELETE FROM research_analyses WHERE id=$1 AND owner_id=$2",[row.id,uid(req)]);
  // Usage is intentionally retained to prevent deleting an answer to reset limits.
  res.json({status:"deleted"});
});
router.get("/analyses/:id/export",requireUser,async(req,res)=>{
  const row=await ownedAnalysis(routeId(req),uid(req));
  if(row.status!=="completed") throw new HttpError(409,"Only completed analyses can be exported.");
  const {format="md",style="ieee"}=ExportAnalysisQueryParams.parse(req.query);
  const view=analysisView(row);
  const output=await exportResearch(view,style,format);
  res.setHeader("Cache-Control","private, no-store");
  res.setHeader("Content-Disposition",`attachment; filename="evidora-research.${format}"`);
  if(format==="docx") {
    res.type("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.send(output);
  } else { res.type("text/markdown");res.send(output); }
});
export default router;
