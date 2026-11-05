import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";
import { HttpError } from "./common";

export const AI_MONTHLY_INR = 18000;
export const TOTAL_MONTHLY_INR = 30000;
// Conservative planning conversion, not a live FX quote. Other allocation:
// ₹5,000 storage/providers/processing + ₹7,000 tax/FX/contingency, excluding Replit.
export const USD_INR = 95;
export const CHAT_MODEL = "gpt-4.1";
export const EMBEDDING_MODEL = "text-embedding-3-large";
export const aiContext = new AsyncLocalStorage<{ owner: string; analysisId: string }>();
export function priceMicros(model: string, input: number, output = 0) {
  if (![CHAT_MODEL, EMBEDDING_MODEL].includes(model)) throw new Error("Unpriced AI model");
  const [inRate, outRate] = model === CHAT_MODEL ? [2, 8] : [0.13, 0];
  return Math.ceil((input * inRate + output * outRate) * USD_INR);
}
export async function paidOpenAI(path: "embeddings" | "chat/completions", body: any, reservedInput: number, reservedOutput = 0) {
  const context = aiContext.getStore();
  if (!context) throw new Error("AI call requires an owner and analysis context");
  if (!process.env.OPENAI_API_KEY) throw new HttpError(503, "OpenAI is not configured.");
  const id = randomUUID(), period = new Date().toISOString().slice(0, 7);
  const reserve = priceMicros(body.model, reservedInput, reservedOutput);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('research-ai-monthly-budget'))");
    const { rows } = await client.query("SELECT coalesce(sum(amount_micros::bigint),0) AS spent FROM research_ai_spend WHERE period=$1", [period]);
    if (Number(rows[0].spent) + reserve > AI_MONTHLY_INR * 1e6)
      throw new HttpError(429, "The service's monthly AI budget limit has been reached. No further OpenAI request was sent. Your run allowance will be restored.");
    await client.query("INSERT INTO research_ai_spend(id,owner_id,analysis_id,period,model,status,amount_micros) VALUES($1,$2,$3,$4,$5,'reserved',$6)", [id, context.owner, context.analysisId, period, body.model, reserve]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
  try {
    const response = await fetch(`https://api.openai.com/v1/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body), signal: AbortSignal.timeout(180000),
    });
    if (!response.ok) {
      // Explicit rejection is unbilled. On ambiguous server/network failures
      // retain the reservation; retrying must never erase possible spend.
      if (response.status >= 400 && response.status < 500 && response.status !== 408)
        await pool.query("UPDATE research_ai_spend SET status='rejected',amount_micros=0 WHERE id=$1", [id]);
      throw new HttpError(503, response.status === 401 ? "OpenAI rejected the configured key. Contact the app administrator." : response.status === 429 ? "OpenAI quota or rate limit reached. Check your OpenAI billing and retry later." : "OpenAI could not complete this request. Please retry later.");
    }
    const result = await response.json() as any;
    const input = result.usage?.prompt_tokens ?? result.usage?.total_tokens;
    const output = result.usage?.completion_tokens ?? 0;
    if (!Number.isSafeInteger(input) || input < 0 || !Number.isSafeInteger(output) || output < 0) throw new Error("Missing OpenAI usage");
    await pool.query("UPDATE research_ai_spend SET status='completed',amount_micros=$2,input_tokens=$3,output_tokens=$4 WHERE id=$1", [id, priceMicros(body.model, input, output), input, output]);
    return result;
  } catch (error) {
    await pool.query("UPDATE research_ai_spend SET status='uncertain' WHERE id=$1 AND status='reserved'", [id]);
    throw error;
  }
}
export async function spending(owner: string, executor: Pick<typeof pool, "query"> = pool) {
  const period = new Date().toISOString().slice(0, 7);
  const { rows } = await executor.query(`SELECT coalesce(sum(amount_micros::bigint) FILTER (WHERE owner_id=$1),0) AS own,
    coalesce(sum(amount_micros::bigint),0) AS total FROM research_ai_spend WHERE period=$2`, [owner, period]);
  return { aiEstimatedInr: Number(rows[0].own) / 1e6, aiMonthlyLimitInr: AI_MONTHLY_INR,
    aiServiceRemainingInr: Math.max(0, AI_MONTHLY_INR - Number(rows[0].total) / 1e6),
    operatingBudgetInr: TOTAL_MONTHLY_INR, costPeriod: period };
}
