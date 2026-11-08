import { createHash } from "node:crypto";
import { dataType, Filters } from "@weaviate/node";
import { pool } from "@workspace/db";
import { ownedStudio } from "./studio-store";
import { initializePaperIndex, PAPER_COLLECTION } from "./weaviate-paper-index";
import { aiContext, EMBEDDING_MODEL } from "./ai-budget";
import { embed } from "./semantic-retrieval";
const PRIVATE_MODEL=`${EMBEDDING_MODEL}:private-project-v1`;
let schemaReady:Promise<void>|undefined;
async function collection() {
  const client=await initializePaperIndex(),c=client.collections.use(PAPER_COLLECTION);
  if(!schemaReady)schemaReady=(async()=>{
    const config=await c.config.get();
    for(const name of ["ownerKey","projectKey","itemKey"])if(!config.properties.some(p=>p.name===name))
      await c.config.addProperty({name,dataType:dataType.TEXT,tokenization:"field",indexSearchable:false});
  })().catch(e=>{schemaReady=undefined;throw e;});
  await schemaReady;
  return c;
}
const key=(s:string)=>createHash("sha256").update(s).digest("hex");
function chunkId(id:string,n:number) {
  const h=createHash("sha256").update(`evidora-private:${id}:${n}`).digest("hex");
  return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;
}
export async function syncProjectItem(id:string,owner:string) {
  const row=await ownedStudio(id,owner);
  if(row.status!=="completed")return;
  const claim=await pool.query("UPDATE research_studio_items SET index_status='indexing',started_at=now() WHERE id=$1 AND owner_id=$2 AND index_status<>'indexing' RETURNING id",[id,owner]);
  if(!claim.rowCount)return;
  try{
    await aiContext.run({owner,analysisId:id},async()=>{
      const c=await collection();
      // Re-indexing mutable project information must not leave old chunks behind.
      await c.data.deleteMany(Filters.and(c.filter.byProperty("ownerKey").equal(key(owner)),c.filter.byProperty("itemKey").equal(id),c.filter.byProperty("embeddingModel").equal(PRIVATE_MODEL)));
      const content=`${row.title}\n${row.content}`;
      const chunks=content.match(/[\s\S]{1,6000}/g)??[row.title];
      const count=(await c.aggregate.overAll()).totalCount;
      if(count+chunks.length>95000)throw new Error("Index capacity reached");
      for(let start=0;start<chunks.length;start+=16){
        const batch=chunks.slice(start,start+16);
        const embeddings=await embed(batch);
        for(let i=0;i<batch.length;i++){
          const uuid=chunkId(id,start+i);
          const object={id:uuid,properties:{ownerKey:key(owner),projectKey:row.project_id,itemKey:id,
            embeddingModel:PRIVATE_MODEL,title:row.title,abstract:batch[i],record:JSON.stringify({id,title:row.title,text:batch[i]})},vectors:{paper:embeddings[i]}};
          if(await c.data.exists(uuid))await c.data.replace(object);else await c.data.insert(object);
        }
      }
    });
    await pool.query("UPDATE research_studio_items SET index_status='indexed' WHERE id=$1 AND owner_id=$2",[id,owner]);
  }catch{
    await pool.query("UPDATE research_studio_items SET index_status='unavailable' WHERE id=$1 AND owner_id=$2",[id,owner]);
  }
}
export async function projectMatches(owner:string,project:string,question:string) {
  const c=await collection(),vector=(await embed([question]))[0];
  const response=await c.query.hybrid(question,{vector,targetVector:"paper",queryProperties:["title^2","abstract"],limit:12,
    filters:Filters.and(c.filter.byProperty("ownerKey").equal(key(owner)),c.filter.byProperty("projectKey").equal(project),c.filter.byProperty("embeddingModel").equal(PRIVATE_MODEL)),
    returnProperties:["record","itemKey"]});
  // PostgreSQL ownership/existence is authoritative, even if a deletion left stale vectors.
  const ids=response.objects.map(o=>String(o.properties.itemKey));
  if(!ids.length)return [];
  const {rows}=await pool.query(`SELECT s.id FROM research_studio_items s WHERE s.owner_id=$1 AND s.project_id=$2 AND s.id=ANY($3::text[])
    AND NOT EXISTS (SELECT 1 FROM research_studio_items child WHERE child.parent_id=s.id)`,[owner,project,ids]);
  const allowed=new Set(rows.map(r=>r.id));
  return response.objects.filter(o=>allowed.has(o.properties.itemKey)).map(o=>JSON.parse(String(o.properties.record)));
}
export async function removeProjectVectors(id:string,owner:string) {
  const c=await collection();
  await c.data.deleteMany(Filters.and(c.filter.byProperty("ownerKey").equal(key(owner)),c.filter.byProperty("itemKey").equal(id),c.filter.byProperty("embeddingModel").equal(PRIVATE_MODEL)));
}
let syncing=false;
export async function syncPendingProjectItem() {
  if(syncing)return;syncing=true;
  try{
    await pool.query("UPDATE research_studio_items SET index_status='unavailable' WHERE index_status='indexing' AND started_at<now()-interval '15 minutes'");
    const {rows}=await pool.query("SELECT id,owner_id FROM research_studio_items WHERE status='completed' AND index_status='pending' ORDER BY created_at LIMIT 1");
    if(rows[0])await syncProjectItem(rows[0].id,rows[0].owner_id);
  }finally{syncing=false;}
}
