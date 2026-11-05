import weaviate, { vectors, dataType, type WeaviateClient } from "@weaviate/node";
import { GetPaperResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";
import { type Paper, cachePapers } from "./catalogue";
import { embed, digest, retrievalContext } from "./semantic-retrieval";
import { EMBEDDING_MODEL } from "./ai-budget";
import { HttpError } from "./common";

export const PAPER_COLLECTION="EvidoraPaper";
const DESCRIPTION=`Evidora public scholarly metadata only; schema=1; ${EMBEDDING_MODEL}; dimensions=3072`;
const MAX_OBJECTS=95000; // Leave headroom below the selected free cluster's 100k limit.
let connection:Promise<WeaviateClient>|undefined;

export function paperIndexDocument(p:Paper) {
  const text=`${p.title}\n${p.abstract}`.slice(0,24000);
  return {id:p.id,text,properties:{
    paperId:p.id,title:p.title,abstract:p.abstract,doi:p.doi,year:p.year,
    authors:p.authors,publisher:p.publisher,venue:p.venue,sourceUrl:p.url,pdfUrl:p.pdfUrl,
    license:p.license,embeddingModel:EMBEDDING_MODEL,contentHash:digest(`${EMBEDDING_MODEL}:3072:${text}`),
    // Validated public catalogue record; no owner, conversation, private text or upload paths.
    record:JSON.stringify(GetPaperResponse.parse(p)),
  }};
}

export async function initializePaperIndex() {
  if(!connection)connection=(async()=>{
    const raw=process.env.WEAVIATE_URL,key=process.env.WEAVIATE_API_KEY;
    if(!raw||!key)throw new HttpError(503,"The paper index is not configured.");
    const url=new URL(raw);
    if(url.protocol!=="https:"||url.username||url.password)throw new Error("Invalid paper index endpoint");
    const response=await fetch(new URL("/v1/schema",url.origin),{
      headers:{Authorization:`Bearer ${key}`},redirect:"error",signal:AbortSignal.timeout(15000),
    });
    if(!response.ok)throw new Error("Paper index connection rejected");
    const schema=await response.json() as {classes?:{class:string;description?:string}[]};
    const classes=schema.classes??[];
    if(classes.some(c=>c.class!==PAPER_COLLECTION))
      throw new Error("Refusing shared cluster: unrelated collections detected");
    const existing=classes.find(c=>c.class===PAPER_COLLECTION);
    if(existing&&existing.description!==DESCRIPTION)throw new Error("Paper index configuration mismatch");
    const client=await weaviate.connectToWeaviateCloud(url.origin,{
      authCredentials:new weaviate.ApiKey(key),timeout:{init:15,query:25,insert:60},
    });
    try {
      if(!existing)await client.collections.create({
        name:PAPER_COLLECTION,description:DESCRIPTION,
        vectorizers:vectors.selfProvided({name:"paper"}),
        properties:[
          ...["paperId","doi","embeddingModel","contentHash"].map(name=>({name,dataType:dataType.TEXT,tokenization:"field" as const,indexSearchable:false})),
          ...["title","abstract"].map(name=>({name,dataType:dataType.TEXT})),
          ...["publisher","venue","sourceUrl","pdfUrl","license","record"].map(name=>({name,dataType:dataType.TEXT,indexSearchable:false})),
          {name:"authors",dataType:dataType.TEXT_ARRAY},
          {name:"year",dataType:dataType.INT},
        ],
      });
      return client;
    }catch(error){await client.close();throw error;}
  })().catch(()=>{connection=undefined;throw new HttpError(503,"The isolated Weaviate paper index is unavailable or has an incompatible configuration. No other collections were changed.");});
  return connection;
}

export async function closePaperIndex() {
  const active=connection;connection=undefined;
  if(active)await (await active).close();
}

export async function searchPaperIndex(question:string):Promise<Paper[]> {
  const client=await initializePaperIndex(),collection=client.collections.use(PAPER_COLLECTION);
  if((await collection.aggregate.overAll()).totalCount===0)return [];
  const context=retrievalContext.getStore();
  const queries=context?(context.paperQueries??=new Map()):new Map<string,Promise<number[]>>();
  if(!queries.has(question))queries.set(question,embed([question]).then(v=>v[0]));
  const vector=await queries.get(question)!;
  const result=await collection.query.hybrid(question,{
    vector,targetVector:"paper",queryProperties:["title^2","abstract"],alpha:0.65,limit:70,
    filters:collection.filter.byProperty("embeddingModel").equal(EMBEDDING_MODEL),
    returnProperties:["record"],
  });
  const papers=result.objects.map(o=>GetPaperResponse.parse(JSON.parse(String(o.properties.record))));
  await cachePapers(papers); // Keeps the same public IDs available for PDF retrieval/citations.
  return papers;
}

export async function indexPublicPapers(papers:Paper[]) {
  const client=await initializePaperIndex(),collection=client.collections.use(PAPER_COLLECTION);
  const lock=await pool.connect();
  let locked=false;
  try{
    // Recheck hashes under one service-wide lock to avoid duplicate embedding charges.
    await lock.query("SELECT pg_advisory_lock(hashtext('evidora-public-paper-index'))");locked=true;
    const docs=[...new Map(papers.map(p=>[p.id,paperIndexDocument(p)])).values()].slice(0,200);
    if(!docs.length)return {inserted:0,cached:0,capacityReached:false};
    const existing=await collection.query.fetchObjects({
      filters:collection.filter.byId().containsAny(docs.map(p=>p.id)),limit:docs.length,
      returnProperties:["contentHash","record"],
    });
    const hashes=new Map(existing.objects.map(o=>[o.uuid,String(o.properties.contentHash)]));
    const records=new Map(existing.objects.map(o=>[o.uuid,String(o.properties.record)]));
    const count=(await collection.aggregate.overAll()).totalCount;
    let slots=Math.max(0,MAX_OBJECTS-count),capacityReached=false;
    const pending=docs.filter(d=>{
      if(hashes.get(d.id)===d.properties.contentHash)return false;
      if(hashes.has(d.id))return true;
      if(slots>0){slots--;return true;}
      capacityReached=true;return false;
    });
    let inserted=0;
    for(const doc of docs)if(hashes.get(doc.id)===doc.properties.contentHash&&records.get(doc.id)!==doc.properties.record)
      await collection.data.update({id:doc.id,properties:doc.properties});
    for(let offset=0;offset<pending.length;offset+=20){
      const batch=pending.slice(offset,offset+20),embeddings=await embed(batch.map(p=>p.text));
      const newRows=batch.flatMap((p,i)=>hashes.has(p.id)?[]:[{id:p.id,properties:p.properties,vectors:{paper:embeddings[i]}}]);
      if(newRows.length){
        const result=await collection.data.insertMany(newRows);
        if(result.hasErrors)throw new Error("Some paper index records could not be saved");
      }
      for(let i=0;i<batch.length;i++)if(hashes.has(batch[i].id))
        await collection.data.replace({id:batch[i].id,properties:batch[i].properties,vectors:{paper:embeddings[i]}});
      inserted+=batch.length;
    }
    return {inserted,cached:docs.filter(d=>hashes.get(d.id)===d.properties.contentHash).length,capacityReached};
  }finally{
    if(locked)await lock.query("SELECT pg_advisory_unlock(hashtext('evidora-public-paper-index'))");
    lock.release();
  }
}
