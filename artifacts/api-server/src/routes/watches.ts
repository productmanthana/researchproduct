import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { pool } from "@workspace/db";
import { SaveResearchWatchBody, UpdateResearchAlertBody, ListResearchAlertsQueryParams } from "@workspace/api-zod";
import { requireUser, uid, HttpError, routeId } from "../lib/common";
import { ownedStudioProject, studioView } from "../lib/studio-store";
import { alertList, watchSelect, watchView } from "../lib/watch-store";

const router=Router();
router.use("/watches",requireUser);
router.use("/research-alerts",requireUser);
const projectId=(req:any)=>z.string().uuid().parse(req.params.projectId);
router.get("/watches",async(req,res)=>{
  const {rows}=await pool.query(`${watchSelect} WHERE w.owner_id=$1 ORDER BY w.created_at DESC`,[uid(req)]);
  res.json(rows.map(watchView));
});
router.put("/watches/:projectId",async(req,res)=>{
  const owner=uid(req),pid=projectId(req),b=SaveResearchWatchBody.parse(req.body);
  await ownedStudioProject(pid,owner);
  const topic=b.topic.trim();if(topic.length<5)throw new HttpError(400,"Describe your research topic in at least five characters.");
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))",[`watch-owner:${owner}`]);
    const {rows}=await client.query("SELECT count(*)::int AS n FROM research_watches WHERE owner_id=$1 AND enabled=true AND project_id<>$2",[owner,pid]);
    if(b.enabled&&rows[0].n>=10)throw new HttpError(429,"You can monitor up to 10 active projects. Pause another watch first.");
    await client.query(`INSERT INTO research_watches(project_id,owner_id,topic,enabled,patents,status)
      VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(project_id) DO UPDATE SET topic=EXCLUDED.topic,
      enabled=EXCLUDED.enabled,patents=EXCLUDED.patents,status=CASE WHEN NOT EXCLUDED.enabled THEN 'paused'
        WHEN research_watches.last_checked_at IS NULL THEN 'queued' ELSE 'idle' END,
      version=research_watches.version+CASE WHEN research_watches.topic<>EXCLUDED.topic THEN 1 ELSE 0 END,
      next_check_at=CASE WHEN research_watches.topic<>EXCLUDED.topic OR research_watches.enabled<>EXCLUDED.enabled
        OR research_watches.patents<>EXCLUDED.patents THEN greatest(now(),coalesce(research_watches.last_checked_at+interval '1 hour',now())) ELSE research_watches.next_check_at END,
      locked_at=NULL,run_token=NULL WHERE research_watches.owner_id=$2`,
      [pid,owner,topic,b.enabled,b.patents,b.enabled?"queued":"paused"]);
    const row=(await client.query(`${watchSelect} WHERE w.project_id=$1 AND w.owner_id=$2`,[pid,owner])).rows[0];
    await client.query("COMMIT");res.json(watchView(row));
  }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
});
router.delete("/watches/:projectId",async(req,res)=>{
  const pid=projectId(req),owner=uid(req);
  await ownedStudioProject(pid,owner);
  await pool.query("DELETE FROM research_watches WHERE project_id=$1 AND owner_id=$2",[pid,owner]);
  res.json({status:"deleted"});
});
router.post("/watches/:projectId/check",async(req,res)=>{
  const pid=projectId(req),owner=uid(req);
  await ownedStudioProject(pid,owner);
  const r=await pool.query(`UPDATE research_watches SET next_check_at=now(),status='queued'
    WHERE project_id=$1 AND owner_id=$2 AND enabled=true AND locked_at IS NULL
    AND (last_checked_at IS NULL OR last_checked_at<now()-interval '1 hour')
    RETURNING *`,[pid,owner]);
  if(!r.rowCount)throw new HttpError(409,"Enable this watch and wait for any running check to finish. Manual checks are limited to once per hour.");
  res.json(watchView((await pool.query(`${watchSelect} WHERE w.project_id=$1 AND w.owner_id=$2`,[pid,owner])).rows[0]));
});
router.get("/research-alerts",async(req,res)=>{
  const {projectId:pid}=ListResearchAlertsQueryParams.parse(req.query);
  if(pid)await ownedStudioProject(pid,uid(req));
  res.json(await alertList(uid(req),pid));
});
router.patch("/research-alerts/:id",async(req,res)=>{
  const b=UpdateResearchAlertBody.parse(req.body);
  const r=await pool.query(`UPDATE research_alerts SET read=coalesce($3,read),dismissed=coalesce($4,dismissed)
    WHERE id=$1 AND owner_id=$2 RETURNING id`,[routeId(req),uid(req),b.read??null,b.dismissed??null]);
  if(!r.rowCount)throw new HttpError(404,"Research alert not found.");
  res.json({status:"updated"});
});
router.post("/research-alerts/:id/save",async(req,res)=>{
  const client=await pool.connect(),owner=uid(req);
  try{
    await client.query("BEGIN");
    const {rows}=await client.query(`SELECT a.* FROM research_alerts a JOIN research_projects p ON p.id=a.project_id
      WHERE a.id=$1 AND a.owner_id=$2 AND p.owner_id=$2 FOR UPDATE OF a`,[routeId(req),owner]);
    const a=rows[0];if(!a)throw new HttpError(404,"Research alert not found.");
    let row=a.saved_item_id?(await client.query("SELECT * FROM research_studio_items WHERE id=$1 AND owner_id=$2",[a.saved_item_id,owner])).rows[0]:undefined;
    if(!row){
      const p=a.payload,id=randomUUID();
      const content=`# ${p.title}\n\nSource: ${p.url}\n\nPublication date: ${p.publishedAt||"Not established"}\n\nFound by your watch: ${new Date(a.found_at).toISOString().slice(0,10)}\n\n## Available abstract\n\n${p.abstract||"No abstract available."}\n\n## Relevance to your project\n\n${p.reason}\n\n${p.comparison}\n\nEvidence: ${p.evidence}\n\nSimilarity is not proof of copying or a conclusion about novelty.`;
      row=(await client.query(`INSERT INTO research_studio_items(id,owner_id,project_id,kind,title,content,metadata)
        VALUES($1,$2,$3,'note',$4,$5,$6) RETURNING *`,[id,owner,a.project_id,p.title,content,JSON.stringify({
          researchAlertId:a.id,sources:[{id:p.sourceId,title:p.title,url:p.url,text:p.abstract,evidenceLevel:p.evidence}],
          warnings:["Research Watch source: title/abstract only; full text not reviewed."],
        })])).rows[0];
      await client.query("UPDATE research_alerts SET saved_item_id=$2,read=true WHERE id=$1",[a.id,id]);
    }
    await client.query("COMMIT");res.json(studioView(row));
  }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
});
export default router;
