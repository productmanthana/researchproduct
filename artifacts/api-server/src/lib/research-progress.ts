import { pool } from "@workspace/db";

export async function researchProgress(job:any,stage:string) {
  job.input={...job.input,stage};
  await pool.query("UPDATE research_analyses SET input=$3 WHERE id=$1 AND owner_id=$2 AND status='running'",[job.id,job.owner_id,JSON.stringify(job.input)]);
}
