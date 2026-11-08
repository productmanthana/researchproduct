import { pool } from "@workspace/db";
import { HttpError } from "./common";
import { GetStudioItemResponse } from "@workspace/api-zod";

export async function initialiseStudio() {
  await pool.query(`CREATE TABLE IF NOT EXISTS research_studio_items(
    id text PRIMARY KEY, owner_id text NOT NULL REFERENCES research_accounts(id),
    project_id text NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    kind text NOT NULL,title text NOT NULL,content text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'completed',error text NOT NULL DEFAULT '',revision integer NOT NULL DEFAULT 1,
    parent_id text,metadata jsonb NOT NULL DEFAULT '{}',index_status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),started_at timestamptz);
    CREATE INDEX IF NOT EXISTS studio_owner_project ON research_studio_items(owner_id,project_id);
    CREATE UNIQUE INDEX IF NOT EXISTS studio_revision_child ON research_studio_items(parent_id) WHERE parent_id IS NOT NULL;`);
}
export function studioView(row:any) {
  return GetStudioItemResponse.parse({id:row.id,projectId:row.project_id,kind:row.kind,title:row.title,content:row.content,
    status:row.status,error:row.error,revision:row.revision,parentId:row.parent_id,metadata:row.metadata,
    indexStatus:row.index_status,createdAt:new Date(row.created_at).toISOString()});
}
export async function ownedStudio(id:string,owner:string) {
  const {rows}=await pool.query("SELECT * FROM research_studio_items WHERE id=$1 AND owner_id=$2",[id,owner]);
  if(!rows[0])throw new HttpError(404,"Project document not found.");
  return rows[0];
}
export async function ownedStudioProject(id:string,owner:string) {
  const {rows}=await pool.query("SELECT * FROM research_projects WHERE id=$1 AND owner_id=$2",[id,owner]);
  if(!rows[0])throw new HttpError(404,"Project not found.");
  return rows[0];
}
export async function saveProjectInformation(project:any) {
  await pool.query(`INSERT INTO research_studio_items(id,owner_id,project_id,kind,title,content,metadata)
    VALUES($1,$2,$1,'note','Project information',$3,'{"projectInformation":true}')
    ON CONFLICT(id) DO UPDATE SET content=EXCLUDED.content,index_status='pending'`,
    [project.id,project.owner_id,`${project.name}\n\n${project.description}`]);
}
