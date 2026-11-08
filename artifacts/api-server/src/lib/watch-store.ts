import { pool } from "@workspace/db";
import { ListResearchAlertsResponse, SaveResearchWatchResponse } from "@workspace/api-zod";

export async function initialiseWatches() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS research_watches(
      project_id text PRIMARY KEY REFERENCES research_projects(id) ON DELETE CASCADE,
      owner_id text NOT NULL REFERENCES research_accounts(id),
      topic text NOT NULL, enabled boolean NOT NULL DEFAULT true, patents boolean NOT NULL DEFAULT true,
      status text NOT NULL DEFAULT 'queued', notices jsonb NOT NULL DEFAULT '[]',
      last_checked_at timestamptz,last_successful_at timestamptz,next_check_at timestamptz NOT NULL DEFAULT now(),
      locked_at timestamptz,run_token text,version integer NOT NULL DEFAULT 1,created_at timestamptz NOT NULL DEFAULT now());
    CREATE INDEX IF NOT EXISTS watch_due ON research_watches(next_check_at) WHERE enabled=true;
    CREATE TABLE IF NOT EXISTS research_watch_seen(
      project_id text NOT NULL REFERENCES research_watches(project_id) ON DELETE CASCADE,
      source_key text NOT NULL,content_hash text NOT NULL,decision_version integer NOT NULL,
      first_seen_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(project_id,source_key));
    CREATE TABLE IF NOT EXISTS research_alerts(
      id text PRIMARY KEY,project_id text NOT NULL REFERENCES research_watches(project_id) ON DELETE CASCADE,
      owner_id text NOT NULL REFERENCES research_accounts(id),source_key text NOT NULL,
      payload jsonb NOT NULL,read boolean NOT NULL DEFAULT false,dismissed boolean NOT NULL DEFAULT false,
      saved_item_id text,found_at timestamptz NOT NULL DEFAULT now(),UNIQUE(project_id,source_key));
    CREATE INDEX IF NOT EXISTS alerts_owner_date ON research_alerts(owner_id,found_at DESC);
    CREATE TABLE IF NOT EXISTS research_watch_embeddings(
      key text PRIMARY KEY,embedding jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
  `);
}
export function watchView(r:any) {
  return SaveResearchWatchResponse.parse({
    projectId:r.project_id,projectName:r.project_name,topic:r.topic,enabled:r.enabled,patents:r.patents,
    status:r.enabled?r.status:"paused",notices:r.notices,
    lastCheckedAt:r.last_checked_at?new Date(r.last_checked_at).toISOString():null,
    lastSuccessfulAt:r.last_successful_at?new Date(r.last_successful_at).toISOString():null,
    nextCheckAt:new Date(r.next_check_at).toISOString(),
  });
}
export const watchSelect = `SELECT w.*,p.name AS project_name FROM research_watches w
  JOIN research_projects p ON p.id=w.project_id AND p.owner_id=w.owner_id`;
export async function alertList(owner:string,projectId?:string) {
  const {rows}=await pool.query(`SELECT a.*,p.name AS project_name FROM research_alerts a
    JOIN research_projects p ON p.id=a.project_id AND p.owner_id=a.owner_id
    WHERE a.owner_id=$1 AND NOT a.dismissed AND ($2::text IS NULL OR a.project_id=$2)
    ORDER BY a.found_at DESC LIMIT 200`,[owner,projectId??null]);
  const count=await pool.query(`SELECT count(*)::int AS n FROM research_alerts
    WHERE owner_id=$1 AND NOT dismissed AND NOT read AND ($2::text IS NULL OR project_id=$2)`,[owner,projectId??null]);
  return ListResearchAlertsResponse.parse({alerts:rows.map(r=>({
    ...r.payload,id:r.id,projectId:r.project_id,projectName:r.project_name,read:r.read,
    foundAt:new Date(r.found_at).toISOString(),savedItemId:r.saved_item_id,
  })),unread:count.rows[0].n});
}
