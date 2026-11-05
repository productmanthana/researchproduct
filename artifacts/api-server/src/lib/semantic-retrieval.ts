import { createHash } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { pool } from "@workspace/db";
import { paidOpenAI, EMBEDDING_MODEL } from "./ai-budget";

type Page = { page: number; text: string };
export const retrievalContext = new AsyncLocalStorage<{ query?: Promise<number[]> }>();
export const digest = (text: string) => createHash("sha256").update(text).digest("hex");
export function chunkPages(pages: Page[]) {
  return pages.flatMap(p => {
    const result: Page[] = [];
    for (let offset = 0; offset < p.text.length; offset += 3680) {
      const text = p.text.slice(offset, offset + 4000).trim();
      if (text) result.push({ page: p.page, text });
    }
    return result;
  });
}
async function embed(texts: string[]) {
  const result = await paidOpenAI("embeddings", {
    model: EMBEDDING_MODEL, dimensions: 3072, input: texts, encoding_format: "float",
  }, texts.reduce((n, t) => n + Buffer.byteLength(t), 0) + 64);
  const vectors = [...result.data].sort((a, b) => a.index - b.index).map(d => d.embedding as number[]);
  if (vectors.length !== texts.length || vectors.some(v => v.length !== 3072 || v.some(n => !Number.isFinite(n))))
    throw new Error("Invalid embedding response");
  return vectors;
}
export function rankPages(rows: { page: number; semantic: number; lexical: number }[], limit: number) {
  const ranked = new Map<number, number>();
  const semantic = [...rows].sort((a, b) => a.semantic - b.semantic);
  const lexical = [...rows].filter(r => r.lexical > 0).sort((a, b) => b.lexical - a.lexical);
  for (const ordering of [semantic, lexical]) {
    // A long page must not win just because it contains more chunks.
    const seen = new Set<number>();
    for (const row of ordering) {
      if (seen.has(row.page)) continue;
      seen.add(row.page);
      ranked.set(row.page, (ranked.get(row.page) ?? 0) + 1 / (60 + seen.size));
    }
  }
  return [...ranked].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([page]) => page);
}
export async function selectEvidencePages(scope: string, sourceKey: string, pages: Page[], question: string, limit: number, documentId?: string) {
  const chunks = chunkPages(pages);
  if (!chunks.length) return pages.slice(0, limit);
  const contentHash = digest(JSON.stringify(pages));
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Serialize cache misses across workers/users without duplicate embedding charges.
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`embedding:${scope}:${sourceKey}`]);
    const cached = await client.query("SELECT count(*)::int AS n FROM research_evidence_chunks WHERE scope=$1 AND source_key=$2 AND content_hash=$3 AND model=$4", [scope, sourceKey, contentHash, EMBEDDING_MODEL]);
    if (cached.rows[0].n !== chunks.length) {
      // Each batch is well below model per-input and request-token limits.
      const vectors: number[][] = [];
      for (let i = 0; i < chunks.length; i += 20)
        vectors.push(...await embed(chunks.slice(i, i + 20).map(c => c.text)));
      await client.query("DELETE FROM research_evidence_chunks WHERE scope=$1 AND source_key=$2", [scope, sourceKey]);
      for (let i = 0; i < chunks.length; i++) {
        const c = chunks[i];
        await client.query(`INSERT INTO research_evidence_chunks(id,scope,source_key,document_id,model,content_hash,page,text,embedding)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::vector)`,
          [digest(`${scope}:${sourceKey}:${contentHash}:${i}`), scope, sourceKey, documentId ?? null, EMBEDDING_MODEL, contentHash, c.page, c.text, JSON.stringify(vectors[i])]);
      }
    }
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
  const context = retrievalContext.getStore();
  const query = context ? await (context.query ??= embed([question]).then(v => v[0])) : (await embed([question]))[0];
  // Scope AND source restriction are applied before exact vector ranking. There
  // is no nearest-neighbour search across somebody else's private documents.
  const { rows } = await pool.query(`SELECT page, text, embedding <=> $5::vector AS semantic,
    ts_rank_cd(to_tsvector('english',text),websearch_to_tsquery('english',$6)) AS lexical
    FROM research_evidence_chunks WHERE scope=$1 AND source_key=$2 AND content_hash=$3 AND model=$4`,
    [scope, sourceKey, contentHash, EMBEDDING_MODEL, JSON.stringify(query), question]);
  const selected = rankPages(rows, limit);
  return selected.map(page => {
    const pageRows=rows.filter(r=>r.page===page);
    // Keep the actual matched chunks, not just the start of a long page.
    const semantic=[...pageRows].sort((a,b)=>a.semantic-b.semantic);
    const lexical=[...pageRows].sort((a,b)=>b.lexical-a.lexical);
    const pieces=[semantic[0],...(lexical[0]?.lexical>0?[lexical[0]]:[]),...semantic];
    const text=[...new Set(pieces.map(r=>r.text as string))].slice(0,2).join("\n[Non-contiguous passage]\n");
    return {page,text};
  });
}
