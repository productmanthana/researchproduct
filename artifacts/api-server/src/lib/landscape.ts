import { pool } from "@workspace/db";
import { openAlex } from "./catalogue";
import { HttpError } from "./common";

export async function topicLandscape(query:string) {
  const q=query.trim().slice(0,300);
  if(q.length<2) throw new HttpError(400,"Enter a topic with at least two characters.");
  const key=`landscape-v2:${q}`;
  const cached=await pool.query("SELECT data FROM research_search_cache WHERE key=$1 AND expires_at>now()",[key]);
  if(cached.rows[0]) return cached.rows[0].data;
  const recentYear=new Date().getFullYear()-2;
  const request=(group?:string,filter?:string)=>openAlex(`works?${new URLSearchParams({search:q,"per-page":group?"200":"1",...(group?{group_by:group}:{}),...(filter?{filter}:{})})}`);
  let base:any;
  try {base=await request();} catch {throw new HttpError(503,"OpenAlex topic statistics are unavailable. No sample counts are substituted. Please retry later.");}
  const queries=[
    ["years","publication_year"],["venues","primary_location.source.id"],["authors","authorships.author.id"],
    ["institutions","authorships.institutions.id"],["fields","primary_topic.field.id"],
    ["india",undefined,"authorships.countries:in"],
    ["recent","keywords.id",`from_publication_date:${recentYear}-01-01`],
    ["earlier","keywords.id",`to_publication_date:${recentYear-1}-12-31`],
  ];
  const results=await Promise.allSettled(queries.map(([,group,filter])=>request(group,filter)));
  const data:Record<string,any>={},warnings:string[]=[];
  results.forEach((r,i)=>{if(r.status==="fulfilled")data[queries[i][0]!]=r.value;else warnings.push(`${queries[i][0]} statistics unavailable`);});
  const groups=(name:string)=>(data[name]?.group_by??[]).filter((g:any)=>g.key!=="unknown"&&g.key!==-111&&g.key!=null);
  const ranked=(name:string)=>groups(name).slice(0,10).map((g:any)=>({name:g.key_display_name??g.key,count:g.count}));
  const earlier=new Map<string,any>(groups("earlier").map((g:any)=>[g.key,g]));
  const keywords=groups("recent").slice(0,20).flatMap((g:any)=>{
    // Missing buckets in a truncated top-200 list are unknown, not zero.
    const old=earlier.get(g.key);
    if(!data.earlier || (!old && (data.earlier.group_by?.length??0)>=200)) return [];
    const before=old?.count??0;
    const recentShare=100*g.count/Math.max(1,data.recent.meta.count);
    const earlierShare=100*before/Math.max(1,data.earlier.meta.count);
    return [{name:g.key_display_name,recentCount:g.count,earlierCount:before,recentShare,earlierShare,changePoints:recentShare-earlierShare}];
  }).sort((a:any,b:any)=>b.changePoints-a.changePoints).slice(0,10);
  const totalWorks=base.meta?.count??0;
  const result={query:q,scope:"OpenAlex full-query aggregation",sampleSize:0,totalWorks,
    indiaCount:data.india?.meta?.count??0,indiaShare:data.india&&totalWorks?100*data.india.meta.count/totalWorks:null,
    years:groups("years").map((g:any)=>({year:Number(g.key),count:g.count})).filter((g:any)=>g.year>0).sort((a:any,b:any)=>a.year-b.year),
    venues:ranked("venues"),authors:ranked("authors"),institutions:ranked("institutions"),fields:ranked("fields"),keywords,
    updatedAt:new Date().toISOString(),
    notice:`Counts cover OpenAlex records matching this search, not all research worldwide. India share counts works with at least one Indian affiliation once, divided by all matching works. Author/institution/keyword groups overlap; do not sum them. Keyword shares compare ${recentYear} onward with earlier years, not raw growth rates; only comparable returned keyword buckets are shown. Cached for 24 hours. ${warnings.join("; ")}`
  };
  await pool.query("INSERT INTO research_search_cache(key,data,expires_at) VALUES($1,$2,now()+$3::interval) ON CONFLICT(key) DO UPDATE SET data=$2,expires_at=now()+$3::interval",[key,JSON.stringify(result),warnings.length?"5 minutes":"24 hours"]);
  return result;
}
