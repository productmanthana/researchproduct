import { pool } from "@workspace/db";
import { storage } from "./documents";
import { objectStorageClient } from "./objectStorage";
import { retrieveFullText, reusableLicense } from "./open-full-text";
import { digest } from "./semantic-retrieval";
import type { Paper } from "./catalogue";

export async function saveEvidenceAsset(key: string, bytes: Buffer, contentType: string) {
  if (!/^[a-z0-9/-]+$/.test(key)) throw new Error("Invalid evidence asset key");
  const full = `${storage.getPrivateObjectDir().replace(/\/$/, "")}/evidence/${key}`;
  const [, bucket, ...parts] = full.split("/");
  await objectStorageClient.bucket(bucket).file(parts.join("/")).save(bytes, {
    resumable: false, contentType, metadata: { cacheControl: "private, no-store" },
  });
  return `/objects/evidence/${key}`;
}
export async function cachedFullText(paper: Paper) {
  const { rows } = await pool.query("SELECT * FROM research_paper_assets WHERE paper_id=$1 AND created_at>now()-interval '30 days'", [paper.id]);
  const cached = rows[0];
  if (cached && reusableLicense(cached.license)) {
    const file = await storage.getObjectEntityFile(cached.object_path);
    const [bytes] = await file.download();
    return { pages: cached.pages as { page: number; text: string }[], bytes, url: cached.source_url as string, license: cached.license as string,
      notice: "Reused a retained licensed PDF and its extracted text; figure inspection depends on your run settings." };
  }
  const full = await retrieveFullText(paper);
  if (!full.pages || !full.bytes) return full;
  const hash = digest(full.bytes.toString("base64"));
  const path = await saveEvidenceAsset(`pdf/${hash}`, full.bytes, "application/pdf");
  await pool.query(`INSERT INTO research_paper_assets(paper_id,object_path,source_url,license,pages,content_hash)
    VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(paper_id) DO UPDATE SET object_path=excluded.object_path,
    source_url=excluded.source_url,license=excluded.license,pages=excluded.pages,content_hash=excluded.content_hash,created_at=now()`,
    [paper.id, path, full.url, full.license, JSON.stringify(full.pages), hash]);
  return full;
}
export async function retainPageImage(key: string, image: string, documentId?: string) {
  const id = digest(key);
  const cached = await pool.query("SELECT object_path FROM research_page_assets WHERE id=$1", [id]);
  if (cached.rowCount) {
    const file = await storage.getObjectEntityFile(cached.rows[0].object_path);
    const [bytes] = await file.download();
    return `data:image/png;base64,${bytes.toString("base64")}`;
  }
  const path = await saveEvidenceAsset(`page/${id}`, Buffer.from(image.split(",")[1], "base64"), "image/png");
  await pool.query("INSERT INTO research_page_assets(id,document_id,object_path) VALUES($1,$2,$3) ON CONFLICT DO NOTHING", [id, documentId ?? null, path]);
  return image;
}
