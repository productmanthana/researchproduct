import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { pool } from "@workspace/db";
import { GetPaperResponse } from "@workspace/api-zod";
import { z } from "zod";
import { HttpError } from "./common";
import { fetchSource, sourceDefinitions, configured } from "./source-registry";
import { extraSearch, type SourceResult } from "./extra-sources";
import { scholarlyTerms } from "./search-query";
import { sourceFailure } from "./source-registry";
import { publicationDate, dateParts, recentFirst } from "./publication-currency";
import { matchesSearchFocus } from "./search-focus";

export type Paper = z.infer<typeof GetPaperResponse>;
type RecordData = Record<string, any>;
export type SearchInput = { q: string; year?: number; yearTo?:number; oa?: boolean; page?: number; sort?: string; venue?: string; publisher?: string; field?: string; minCitations?:number; sources?:string; doiPrefix?:string };
export const clean = (value: unknown) => String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const url = (value: unknown) => { try { const u = new URL(String(value)); return u.protocol === "https:" || u.protocol === "http:" ? u.href : ""; } catch { return ""; } };
const doiKey = (v: string) => v.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "").trim().toLowerCase();
const normalized = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const fingerprint = (p: Paper) => `${normalized(p.title)}|${normalized(p.authors[0] ?? "")}|${p.year}`;
const paperId = (key: string) => {
  const h = createHash("sha256").update(key).digest("hex");
  return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;
};
export function makePaper(p: Partial<Paper>): Paper {
  const base: Paper = { id:"",title:"Untitled work",authors:[],year:0,doi:"",abstract:"",venue:"",publisher:"",citations:0,isOa:false,pdfUrl:"",url:"",sources:[],license:"Not specified — check publisher rights",field:"",evidenceLevel:"Metadata only",...p };
  base.doi = doiKey(base.doi);
  const date=publicationDate(base.publicationDate);
  if(date){base.publicationDate=date;base.year=Number(date.slice(0,4));}else delete base.publicationDate;
  base.url = url(base.url); base.pdfUrl = url(base.pdfUrl);
  base.id = paperId(base.doi ? `doi:${base.doi}` : base.sources.includes("arXiv") ? `preprint:${base.url}` : `metadata:${fingerprint(base)}`);
  base.evidenceLevel = base.abstract ? "Abstract only" : "Metadata only";
  return base;
}
function invertedAbstract(index: Record<string, number[]> | null): string {
  if (!index) return "";
  const words: string[] = [];
  for (const [word, positions] of Object.entries(index)) for (const pos of positions) if(pos < 30000) words[pos] = word;
  return words.join(" ");
}
export function fromOpenAlex(w: RecordData): Paper {
  return makePaper({ title: clean(w.display_name), authors: (w.authorships ?? []).map((a: RecordData) => clean(a.author?.display_name)),
    year:w.publication_year ?? 0,publicationDate:publicationDate(w.publication_date),doi:w.doi ?? "",abstract:invertedAbstract(w.abstract_inverted_index),venue:clean(w.primary_location?.source?.display_name),
    publisher:clean(w.primary_location?.source?.host_organization_name), citations:w.cited_by_count ?? 0,isOa:!!w.open_access?.is_oa,
    pdfUrl:w.best_oa_location?.pdf_url ?? "",url:w.doi || w.primary_location?.landing_page_url || w.id,
    sources:["OpenAlex"], license:w.best_oa_location?.license || "Check the original publisher licence",field:w.primary_topic?.field?.display_name ?? "",
    type:w.type??"",institutions:[...new Set<string>((w.authorships??[]).flatMap((a:RecordData)=>(a.institutions??[]).map((i:RecordData)=>clean(i.display_name))))],
    keywords:(w.keywords??[]).map((k:RecordData)=>clean(k.display_name)) });
}
export function fromCrossref(w: RecordData): Paper {
  return makePaper({title:clean(w.title?.[0]),authors:(w.author ?? []).map((a: RecordData) => clean(`${a.given ?? ""} ${a.family ?? a.name ?? ""}`)),
    year:w.published?.["date-parts"]?.[0]?.[0] ?? 0,publicationDate:[w["published-online"],w.published,w["published-print"]].map(d=>dateParts(d?.["date-parts"]?.[0])).filter((d):d is string=>!!d).sort()[0],doi:w.DOI ?? "",abstract:clean(w.abstract),venue:clean(w["container-title"]?.[0]),publisher:clean(w.publisher),
    citations:w["is-referenced-by-count"] ?? 0,url:w.URL ?? "",sources:["Crossref"],license:w.license?.[0]?.URL ?? "Metadata; abstract and full-text rights vary" });
}
export async function openAlex(path: string) {
  return JSON.parse(await fetchSource(`https://api.openalex.org/${path}`, "OpenAlex",
    process.env.OPENALEX_API_KEY?{headers:{Authorization:`Bearer ${process.env.OPENALEX_API_KEY}`}}:{}));
}
export async function cachePapers(papers: Paper[]) {
  for(const paper of papers) {
    const {rows}=await pool.query(`INSERT INTO research_papers(id,data) VALUES($1,$2) ON CONFLICT(id) DO UPDATE
      SET data=research_papers.data || EXCLUDED.data || jsonb_build_object(
        'abstract',coalesce(nullif(EXCLUDED.data->>'abstract',''),research_papers.data->>'abstract',''),
        'pdfUrl',coalesce(nullif(EXCLUDED.data->>'pdfUrl',''),research_papers.data->>'pdfUrl',''),
        'sources',(SELECT jsonb_agg(DISTINCT v) FROM jsonb_array_elements((research_papers.data->'sources')||(EXCLUDED.data->'sources')) AS v),
        'isOa',coalesce((EXCLUDED.data->>'isOa')::boolean,false) OR coalesce((research_papers.data->>'isOa')::boolean,false)
      ),updated_at=now() RETURNING data`, [paper.id, JSON.stringify(paper)]);
    Object.assign(paper,rows[0].data);
    paper.evidenceLevel=paper.abstract?"Abstract only":"Metadata only";
  }
}
export async function getPaper(id: string): Promise<Paper> {
  const {rows} = await pool.query("SELECT data FROM research_papers WHERE id=$1", [id]);
  if(!rows[0]) throw new HttpError(404,"Paper not found. Search for it again.");
  return GetPaperResponse.parse(rows[0].data);
}
export function deduplicate(papers: Paper[]) {
  const result: Paper[] = [];
  for(const p of papers) {
    const existing = result.find(x => (p.doi && x.doi && p.doi === x.doi) ||
      ((!p.doi || !x.doi) && !p.sources.includes("arXiv") && !x.sources.includes("arXiv") &&
        p.title.length>20 && p.authors.length>0 && p.year>0 && fingerprint(x)===fingerprint(p)));
    if(!existing) { result.push(p); continue; }
    existing.sources = [...new Set([...existing.sources,...p.sources])];
    for (const field of ["abstract","doi","pdfUrl","venue","publisher","field"] as const) if(!existing[field]) existing[field] = p[field];
    existing.isOa ||= p.isOa;
    existing.citations = Math.max(existing.citations,p.citations);
    if(existing.doi) existing.id = paperId(`doi:${existing.doi}`);
    existing.evidenceLevel = existing.abstract ? "Abstract only" : "Metadata only";
  }
  return { papers:result, removed:papers.length-result.length };
}
export async function search(input: SearchInput) {
  input={...input,sort:input.sort??"recent"};
  const q = scholarlyTerms(input.q);
  if(q.length<2) throw new HttpError(400,"Enter at least two characters.");
  const page = Math.min(400,Math.max(1,input.page ?? 1));
  const key = "federated-v5:"+JSON.stringify({...input,q,page,date:new Date().toISOString().slice(0,10)});
  const cached = await pool.query("SELECT data FROM research_search_cache WHERE key=$1 AND expires_at>now()",[key]);
  if(cached.rows[0]) return cached.rows[0].data;
  const until=input.yearTo?`${input.yearTo}-12-31`:input.sort==="recent"||input.sort==="year"?new Date().toISOString().slice(0,10):"";
  const filters = [input.year ? `from_publication_date:${input.year}-01-01`:"",until?`to_publication_date:${until}`:"",input.oa?"is_oa:true":"",input.minCitations?`cited_by_count:>${input.minCitations-1}`:""].filter(Boolean);
  const oaQuery = new URLSearchParams({search:q,"per-page":"25",page:String(page)});
  if(filters.length) oaQuery.set("filter",filters.join(","));
  if(input.sort==="citations") oaQuery.set("sort","cited_by_count:desc");
  if(input.sort==="year"||input.sort==="recent") oaQuery.set("sort","publication_date:desc");
  const crQuery = new URLSearchParams({query:q,rows:"25",offset:String((page-1)*25)});
  const crFilters=[input.year?`from-pub-date:${input.year}-01-01`:"",until?`until-pub-date:${until}`:"",input.doiPrefix?`prefix:${input.doiPrefix}`:""].filter(Boolean);
  if(crFilters.length) crQuery.set("filter",crFilters.join(","));
  if(process.env.CROSSREF_MAILTO) crQuery.set("mailto",process.env.CROSSREF_MAILTO);
  if(input.sort==="citations") crQuery.set("sort","is-referenced-by-count");
  if(input.sort==="year"||input.sort==="recent"){crQuery.set("sort","published");crQuery.set("order","desc");}
  const connectors:Record<string,()=>Promise<SourceResult>>={
    OpenAlex:()=>openAlex(`works?${oaQuery}`).then(d => ({papers:(d.results ?? []).map(fromOpenAlex),total:d.meta?.count??0})),
    Crossref:()=>fetchSource(`https://api.crossref.org/works?${crQuery}`,"Crossref").then(t=>{const d=JSON.parse(t).message;return {papers:(d.items??[]).map(fromCrossref),total:d["total-results"]??0};}),
    arXiv:()=>fetchSource(`https://export.arxiv.org/api/query?${new URLSearchParams({search_query:q.split(/\s+/).map(t=>`all:"${t}"`).join(" AND "),start:String((page-1)*15),max_results:"15",sortBy:input.sort==="year"||input.sort==="recent"?"submittedDate":"relevance",sortOrder:"descending"})}`,"arXiv")
      .then(t=>{
        const d = new XMLParser({ignoreAttributes:false}).parse(t).feed;
        const entries = Array.isArray(d?.entry) ? d.entry : d?.entry ? [d.entry] : [];
        return {total:Number(d?.["opensearch:totalResults"]??0),papers:entries.filter((e:RecordData)=>!String(e.id).includes("api/errors")).map((e:RecordData)=>{
          const links = Array.isArray(e.link)?e.link:[e.link];
          const authors = Array.isArray(e.author)?e.author:[e.author];
          return makePaper({title:clean(e.title),abstract:clean(e.summary),authors:authors.filter(Boolean).map((a:RecordData)=>clean(a.name)),
            year:Number(String(e.published).slice(0,4))||0,publicationDate:publicationDate(String(e.published)),doi:clean(e["arxiv:doi"]),venue:"arXiv",publisher:"arXiv",isOa:true,
            url:e.id,pdfUrl:links.find((l:RecordData)=>l?.["@_title"]==="pdf")?.["@_href"] ?? "",sources:["arXiv"],license:"Per-paper arXiv licence; link only",field:clean((Array.isArray(e.category)?e.category[0]:e.category)?.["@_term"])});
        }) as Paper[]};
      }),
  };
  for(const name of ["dblp","DataCite","Europe PMC","DOAJ","CORE","Semantic Scholar"]) {
    if(configured(sourceDefinitions.find(s=>s.name===name)!)) connectors[name]=()=>extraSearch(name,q,page);
  }
  const recentWarnings:string[]=[];
  if(input.sort==="recent"||input.sort==="year"){
    for(const name of ["OpenAlex","Crossref"]){
      const query=new URLSearchParams(name==="OpenAlex"?oaQuery:crQuery);
      query.delete("sort");query.delete("order");
      const load:(params:URLSearchParams)=>Promise<SourceResult>=name==="OpenAlex"
        ?params=>openAlex(`works?${params}`).then(d=>({papers:(d.results??[]).map(fromOpenAlex),total:d.meta?.count??0}))
        :params=>fetchSource(`https://api.crossref.org/works?${params}`,"Crossref").then(t=>{const d=JSON.parse(t).message;return {papers:(d.items??[]).map(fromCrossref),total:d["total-results"]??0};});
      const recentQuery=new URLSearchParams(query);
      const start=[new Date(Date.now()-60*86400000).toISOString().slice(0,10),input.year?`${input.year}-01-01`:""].sort().at(-1)!;
      const end=[new Date().toISOString().slice(0,10),until||"9999-12-31"].sort()[0];
      const dateKeys=name==="OpenAlex"?["from_publication_date","to_publication_date"]:["from-pub-date","until-pub-date"];
      const recentFilters=(recentQuery.get("filter")??"").split(",").filter(f=>f&&!dateKeys.some(k=>f.startsWith(`${k}:`)));
      recentQuery.set("filter",[...recentFilters,`${dateKeys[0]}:${start}`,`${dateKeys[1]}:${end}`].join(","));
      // Rank by relevance *within* the recent date window, not by timestamp
      // across loosely matching records from the entire provider catalogue.
      const newest=()=>start<=end?load(recentQuery):Promise.resolve({papers:[] as Paper[],total:0});
      const relevant=()=>load(query);
      connectors[name]=async()=>{
        const batches=await Promise.allSettled([newest(),relevant()]);
        if(batches.every(r=>r.status==="rejected"))throw (batches[0] as PromiseRejectedResult).reason;
        if(batches.some(r=>r.status==="rejected"))recentWarnings.push(`${name}: One recent/relevance retrieval batch was unavailable; these results are partial.`);
        return {total:Math.max(...batches.map(r=>r.status==="fulfilled"?r.value.total:0)),papers:batches.flatMap((r,i)=>r.status==="fulfilled"?i===0?r.value.papers.filter(p=>matchesSearchFocus(q,p)):r.value.papers:[])};
      };
    }
  }
  const names=input.sources?input.sources.split(",").map(n=>n.trim()).filter((n,i,a)=>a.indexOf(n)===i):Object.keys(connectors);
  if(!names.length||names.some(n=>!connectors[n])) throw new HttpError(400,"Select an enabled discovery source.");
  const jobs = await Promise.allSettled(names.map(name=>connectors[name]()));
  const warnings = [...recentWarnings,...jobs.flatMap((r,i)=>r.status==="rejected"?[`${names[i]}: ${sourceFailure(r.reason)} Results are partial; this provider is not included.`]:[])];
  // A provider can return HTTP 200/202 containing an HTML challenge rather than usable API data.
  await Promise.all(jobs.map((r,i)=>r.status==="rejected"?pool.query("UPDATE research_sources SET last_status=CASE WHEN last_status IN (0,200) THEN 502 ELSE last_status END,last_checked=now() WHERE name=$1",[names[i]]):Promise.resolve()));
  if(jobs.every(r=>r.status==="rejected")) throw new HttpError(503,"Research sources are temporarily unavailable. Please try again.");
  const all = jobs.flatMap(r=>r.status==="fulfilled"?r.value.papers:[]);
  const deduped = deduplicate(all);
  const possibleVersions = deduped.papers.some((p,i,items)=>items.some((other,j)=>
    i!==j && normalized(p.title)===normalized(other.title) && p.id!==other.id));
  if(possibleVersions) warnings.push("Possible preprint/published versions or ambiguous title matches were kept separate rather than merged automatically.");
  let papers = deduped.papers.filter(p=>(!input.year||p.year>=input.year)&&(!input.oa||p.isOa)&&(!input.minCitations||p.citations>=input.minCitations));
  for(const field of ["venue","publisher","field"] as const) if(input[field]) papers=papers.filter(p=>p[field].toLowerCase().includes(input[field]!.toLowerCase()));
  if(input.sort==="citations") papers.sort((a,b)=>b.citations-a.citations);
  if(input.sort==="year"||input.sort==="recent")papers=recentFirst(papers);
  await cachePapers(papers);
  const sourceCounts=jobs.map((r,i)=>({name:names[i],total:r.status==="fulfilled"?r.value.total:0,status:r.status==="fulfilled"?"ok":"error"}));
  const hasMore=page<400&&jobs.some((r,i)=>r.status==="fulfilled"&&r.value.total>page*(names[i]==="arXiv"?15:25));
  const data = {papers,total:papers.length,page,warnings,duplicatesRemoved:deduped.removed,sourceCounts,hasMore,
    scopeNotice:`Live provider catalogues, not a hosted full-text collection. Search terms used: "${q}". Provider totals overlap and are not added together. Deduplication and ranking apply to each retrieved batch; venue, publisher and field filters narrow that batch. Citation counts vary by provider.`};
  await pool.query("INSERT INTO research_search_cache(key,data,expires_at) VALUES($1,$2,now()+$3::interval) ON CONFLICT(key) DO UPDATE SET data=EXCLUDED.data,expires_at=EXCLUDED.expires_at",[key,JSON.stringify(data),warnings.length?"1 minute":input.sort==="recent"||input.sort==="year"?"15 minutes":"7 days"]);
  return data;
}
