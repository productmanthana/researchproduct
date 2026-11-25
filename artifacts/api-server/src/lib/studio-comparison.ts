import { pool } from "@workspace/db";
import type { CandidateSource } from "./plagiarism-align";

export type ComparisonDoc = { title: string; content: string; url?: string };

/** This project's other drafts, library papers and the draft's own source texts, excluding the draft's own revision family. */
export async function projectComparison(row: { id: string; project_id: string; metadata?: any }, owner: string): Promise<ComparisonDoc[]> {
  const { rows } = await pool.query(`WITH RECURSIVE family AS (
    SELECT id,parent_id FROM research_studio_items WHERE id=$3 AND owner_id=$1
    UNION ALL SELECT s.id,s.parent_id FROM research_studio_items s JOIN family f ON f.parent_id=s.id WHERE s.owner_id=$1
  ), descendants AS (
    SELECT id FROM research_studio_items WHERE id=$3 AND owner_id=$1
    UNION ALL SELECT s.id FROM research_studio_items s JOIN descendants d ON s.parent_id=d.id WHERE s.owner_id=$1
  ) SELECT s.title,s.content FROM research_studio_items s WHERE s.owner_id=$1 AND s.project_id=$2
    AND s.id NOT IN(SELECT id FROM family UNION SELECT id FROM descendants) AND s.status='completed'
    AND NOT EXISTS(SELECT 1 FROM research_studio_items c WHERE c.parent_id=s.id) LIMIT 100`, [owner, row.project_id, row.id]);
  const references = await pool.query("SELECT p.data FROM research_library l JOIN research_papers p ON p.id=l.paper_id WHERE l.owner_id=$1 AND l.project_id=$2", [owner, row.project_id]);
  const sourceEvidence = (row.metadata?.sources ?? []).filter((s: any) => s.text).map((s: any) => ({ title: s.title, content: s.text, url: s.url }));
  return [...rows, ...references.rows.map(r => ({ title: r.data.title, content: r.data.abstract ?? "", url: r.data.doi ? `https://doi.org/${r.data.doi}` : undefined })), ...sourceEvidence];
}

export const asCandidates = (docs: ComparisonDoc[]): CandidateSource[] =>
  docs.map(c => ({ title: c.title, text: c.content, url: c.url, origin: "project" as const }));
