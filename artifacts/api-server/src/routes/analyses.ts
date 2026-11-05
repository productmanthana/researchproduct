import { randomUUID } from "node:crypto";
import { Router } from "express";
import { pool } from "@workspace/db";
import { CreateAnalysisBody, UpdateAnalysisBody, ExportAnalysisQueryParams } from "@workspace/api-zod";
import { Document, Paragraph, Packer } from "docx";
import { requireUser, uid, routeId, usage, HttpError } from "../lib/common";
import { analysisView } from "../lib/analysis-view";
import { ownedDocument } from "../lib/documents";
import { getPaper } from "../lib/catalogue";
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
  const paperIds=[...new Set(b.paperIds??[])],documentIds=[...new Set(b.documentIds??[])];
  if(paperIds.length>(b.kind==="review"?50:10) || documentIds.length>3) throw new HttpError(400,"Select up to 10 papers (50 for a review) and 3 documents.");
  if(b.kind==="review" && paperIds.length<10) throw new HttpError(400,"Select 10–50 papers for a literature review.");
  if(!paperIds.length && !documentIds.length) throw new HttpError(400,"Select papers or upload documents to supply evidence.");
  for(const id of paperIds) await getPaper(id);
  const docs=await Promise.all(documentIds.map(id=>ownedDocument(id,owner)));
  if(docs.some(d=>d.status!=="ready")) throw new HttpError(400,"Wait for your documents to finish processing.");
  if(b.kind==="image" && !docs.length) throw new HttpError(400,"Select a screenshot or PDF for visual analysis.");
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
    const {rows}=await client.query("INSERT INTO research_analyses(id,owner_id,kind,question,input) VALUES($1,$2,$3,$4,$5) RETURNING *",[id,owner,b.kind,b.question,JSON.stringify({paperIds,documentIds})]);
    await client.query("COMMIT");
    res.json(analysisView(rows[0]));
  } catch(e) {await client.query("ROLLBACK");throw e;} finally {client.release();}
});
router.get("/analyses/:id",requireUser,async(req,res)=>res.json(analysisView(await ownedAnalysis(routeId(req),uid(req)))));
router.patch("/analyses/:id",requireUser,async(req,res)=>{
  const row=await ownedAnalysis(routeId(req),uid(req));
  if(row.status!=="completed") throw new HttpError(409,"Only completed analyses can be edited.");
  const {content}=UpdateAnalysisBody.parse(req.body);
  const result={...row.result,content,warnings:[...new Set([...(row.result.warnings??[]),"Edited by the user. Changes have not been checked against source evidence."])]};
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
  const refs=await Promise.all(view.sources.map(async(s:any,i:number)=>{
    let p; try {p=await getPaper(s.id);} catch {/* Uploaded image/page references have no publisher metadata. */}
    if(!p) return `[${i+1}] ${s.title}. Private uploaded evidence.`;
    const authors=p.authors.join(", "),year=p.year||"n.d.";
    return style==="apa"?`[${i+1}] ${authors||"Unknown author"} (${year}). ${p.title}. ${p.venue}. ${p.url}`:`[${i+1}] ${authors||"Unknown author"}, “${p.title},” ${p.venue}, ${year}. ${p.url}`;
  }));
  const text=`${view.content}\n\n## References (${style.toUpperCase()})\n\n${refs.join("\n\n")}\n\n## AI-use disclosure\n\nDraft prepared with OpenAI GPT-4.1 using the selected evidence. Automated checks do not replace human verification. ${view.warnings.join(" ")}`;
  res.setHeader("Cache-Control","private, no-store");
  res.setHeader("Content-Disposition",`attachment; filename="evidora-research.${format}"`);
  if(format==="docx") {
    res.type("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.send(await Packer.toBuffer(new Document({sections:[{children:text.split("\n").map(line=>new Paragraph(line))}]})));
  } else { res.type("text/markdown");res.send(text); }
});
export default router;
