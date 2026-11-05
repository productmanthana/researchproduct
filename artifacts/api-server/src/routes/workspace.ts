import { randomUUID } from "node:crypto";
import { Router } from "express";
import { pool } from "@workspace/db";
import { CreateProjectBody, UpdateProjectBody, SavePaperBody, UpdateLibraryItemBody, ListLibraryQueryParams } from "@workspace/api-zod";
import { uid, requireUser, routeId, iso, usage, HttpError } from "../lib/common";
import { getPaper } from "../lib/catalogue";
import { analysisView } from "../lib/analysis-view";
const router=Router();
export const projectView=(r:any)=>({id:r.id,name:r.name,description:r.description,color:r.color,paperCount:Number(r.paper_count??0),createdAt:iso(r.created_at)});
const libraryView=(r:any)=>({id:r.id,paper:r.data,projectId:r.project_id,notes:r.notes,tags:r.tags,createdAt:iso(r.created_at)});
async function ownedProject(id:string|null|undefined,owner:string) {
  if(id && !(await pool.query("SELECT id FROM research_projects WHERE id=$1 AND owner_id=$2",[id,owner])).rowCount) throw new HttpError(404,"Project not found.");
}
router.get("/usage",requireUser,async(req,res)=>res.json(await usage(uid(req))));
router.get("/summary",requireUser,async(req,res)=>{
  const owner=uid(req);
  const [counts,projects,analyses]=await Promise.all([
    pool.query(`SELECT (SELECT count(*)::int FROM research_library WHERE owner_id=$1) AS "savedPapers",
      (SELECT count(*)::int FROM research_projects WHERE owner_id=$1) AS projects,
      (SELECT count(*)::int FROM research_documents WHERE owner_id=$1 AND status<>'uploading') AS documents,
      (SELECT count(*)::int FROM research_analyses WHERE owner_id=$1) AS analyses`,[owner]),
    pool.query("SELECT p.*, (SELECT count(*) FROM research_library l WHERE l.project_id=p.id AND l.owner_id=$1) AS paper_count FROM research_projects p WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 3",[owner]),
    pool.query("SELECT * FROM research_analyses WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 3",[owner]),
  ]);
  res.json({...counts.rows[0],recentProjects:projects.rows.map(projectView),recentAnalyses:analyses.rows.map(analysisView)});
});
router.get("/projects",requireUser,async(req,res)=>{
  const {rows}=await pool.query("SELECT p.*, (SELECT count(*) FROM research_library l WHERE l.project_id=p.id AND l.owner_id=$1) AS paper_count FROM research_projects p WHERE owner_id=$1 ORDER BY created_at DESC",[uid(req)]);
  res.json(rows.map(projectView));
});
router.post("/projects",requireUser,async(req,res)=>{
  const b=CreateProjectBody.parse(req.body);
  if(!b.name.trim()) throw new HttpError(400,"A project name is required.");
  const {rows}=await pool.query("INSERT INTO research_projects(id,owner_id,name,description,color) VALUES($1,$2,$3,$4,$5) RETURNING *",[randomUUID(),uid(req),b.name.trim(),b.description??"",b.color??"teal"]);
  res.json(projectView(rows[0]));
});
router.patch("/projects/:id",requireUser,async(req,res)=>{
  const b=UpdateProjectBody.parse(req.body);
  if(!b.name.trim()) throw new HttpError(400,"A project name is required.");
  const {rows}=await pool.query("UPDATE research_projects SET name=$3,description=coalesce($4,description),color=coalesce($5,color) WHERE id=$1 AND owner_id=$2 RETURNING *, (SELECT count(*) FROM research_library WHERE project_id=$1 AND owner_id=$2) AS paper_count",[routeId(req),uid(req),b.name.trim(),b.description,b.color]);
  if(!rows[0]) throw new HttpError(404,"Project not found.");
  res.json(projectView(rows[0]));
});
router.delete("/projects/:id",requireUser,async(req,res)=>{
  const result=await pool.query("DELETE FROM research_projects WHERE id=$1 AND owner_id=$2",[routeId(req),uid(req)]);
  if(!result.rowCount) throw new HttpError(404,"Project not found.");
  res.json({status:"deleted"});
});
router.get("/library",requireUser,async(req,res)=>{
  const {projectId,q}=ListLibraryQueryParams.parse(req.query);
  const {rows}=await pool.query(`SELECT l.*,p.data FROM research_library l JOIN research_papers p ON p.id=l.paper_id
    WHERE l.owner_id=$1 AND ($2::text IS NULL OR l.project_id=$2) AND ($3::text IS NULL OR p.data->>'title' ILIKE '%'||$3||'%' OR l.notes ILIKE '%'||$3||'%') ORDER BY l.created_at DESC`,[uid(req),projectId??null,q??null]);
  res.json(rows.map(libraryView));
});
router.post("/library",requireUser,async(req,res)=>{
  const b=SavePaperBody.parse(req.body),owner=uid(req);
  const paper=await getPaper(b.paperId);
  await ownedProject(b.projectId,owner);
  const {rows}=await pool.query(`INSERT INTO research_library(id,owner_id,paper_id,project_id,notes,tags) VALUES($1,$2,$3,$4,$5,$6)
    ON CONFLICT(owner_id,paper_id) DO UPDATE SET paper_id=EXCLUDED.paper_id RETURNING *`,[randomUUID(),owner,b.paperId,b.projectId??null,(b.notes??"").slice(0,10000),JSON.stringify((b.tags??[]).slice(0,20))]);
  res.json(libraryView({...rows[0],data:paper}));
});
router.patch("/library/:id",requireUser,async(req,res)=>{
  const b=UpdateLibraryItemBody.parse(req.body),owner=uid(req);
  await ownedProject(b.projectId,owner);
  const {rows}=await pool.query(`UPDATE research_library SET notes=coalesce($3,notes),tags=coalesce($4,tags),project_id=CASE WHEN $5 THEN $6 ELSE project_id END WHERE id=$1 AND owner_id=$2 RETURNING *`,
    [routeId(req),owner,b.notes,b.tags?JSON.stringify(b.tags.slice(0,20)):null,Object.hasOwn(b,"projectId"),b.projectId??null]);
  if(!rows[0]) throw new HttpError(404,"Saved paper not found.");
  res.json(libraryView({...rows[0],data:await getPaper(rows[0].paper_id)}));
});
router.delete("/library/:id",requireUser,async(req,res)=>{
  const result=await pool.query("DELETE FROM research_library WHERE id=$1 AND owner_id=$2",[routeId(req),uid(req)]);
  if(!result.rowCount) throw new HttpError(404,"Saved paper not found.");
  res.json({status:"deleted"});
});
export default router;
