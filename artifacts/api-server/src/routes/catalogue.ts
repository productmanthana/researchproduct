import { Router } from "express";
import { getAuth } from "@clerk/express";
import { SearchPapersQueryParams, SearchPapersResponse, GetPaperResponse, GetRelatedPapersQueryParams, GetLandscapeQueryParams, GetSourcesResponse } from "@workspace/api-zod";
import { search, getPaper, openAlex, fromOpenAlex, cachePapers } from "../lib/catalogue";
import { routeId, plans, HttpError } from "../lib/common";
const router = Router();
const rate = new Map<string,{ n:number; until:number }>();
router.use((req,_res,next)=>{
  const key=req.ip ?? "unknown";
  const now=Date.now();
  if(rate.size>10000) for(const [k,v] of rate) if(v.until<now) rate.delete(k);
  const v=rate.get(key);
  if(v && v.until>now) { if(++v.n>100) throw new HttpError(429,"Too many requests. Wait one minute."); }
  else rate.set(key,{n:1,until:now+60000});
  next();
});
router.get("/account",(req,res)=>res.json({signedIn:!!getAuth(req).userId,userId:getAuth(req).userId,role:"student"}));
router.get("/plans",(_req,res)=>res.json(plans));
router.get("/papers/search",async(req,res)=>{
  const input = SearchPapersQueryParams.parse({...req.query,oa:req.query.oa==="true"});
  if(input.year && (input.year<1800 || input.year>new Date().getFullYear()+1)) throw new HttpError(400,"Invalid publication year.");
  res.json(SearchPapersResponse.parse(await search(input)));
});
router.get("/papers/:id",async(req,res)=>res.json(GetPaperResponse.parse(await getPaper(routeId(req)))));
router.get("/papers/:id/related",async(req,res)=>{
  const paper=await getPaper(routeId(req));
  const {kind="similar"}=GetRelatedPapersQueryParams.parse(req.query);
  if(kind==="similar") { res.json(await search({q:paper.title.split(" ").slice(0,7).join(" ")})); return; }
  if(!paper.doi) { res.json({papers:[],total:0,page:1,duplicatesRemoved:0,warnings:["Reference links require a DOI available in OpenAlex."]}); return; }
  try {
    const work=await openAlex(`works/https://doi.org/${encodeURIComponent(paper.doi)}`);
    const ids=(work.referenced_works ?? []).slice(0,25).map((x:string)=>x.split("/").pop());
    if(kind==="references" && !ids.length) { res.json({papers:[],total:0,page:1,duplicatesRemoved:0,warnings:[]}); return; }
    const filter=kind==="references"?`openalex:${ids.join("|")}`:`cites:${work.id.split("/").pop()}`;
    const data=await openAlex(`works?${new URLSearchParams({filter,"per-page":"25"})}`);
    const papers=(data.results??[]).map(fromOpenAlex);
    await cachePapers(papers);
    res.json({papers,total:data.meta?.count??papers.length,page:1,duplicatesRemoved:0,warnings:[]});
  } catch { throw new HttpError(503,"Reference lookup is unavailable from OpenAlex. Try again later."); }
});
router.get("/landscape",async(req,res)=>{
  const {q}=GetLandscapeQueryParams.parse(req.query);
  const result=await search({q});
  const count=(values:string[])=>Object.entries(values.reduce<Record<string,number>>((a,v)=>{if(v)a[v]=(a[v]??0)+1;return a;},{})).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count).slice(0,10);
  res.json({query:q,sampleSize:result.papers.length,years:count(result.papers.filter(p=>p.year).map(p=>String(p.year))).map(x=>({year:Number(x.name),count:x.count})).sort((a,b)=>a.year-b.year),
    venues:count(result.papers.map(p=>p.venue)),authors:count(result.papers.flatMap(p=>p.authors)),fields:count(result.papers.map(p=>p.field)),
    notice:`Counts describe only ${result.papers.length} returned search results, not the entire literature. Institution and India-share statistics are not yet available. ${result.warnings.join(" ")}`});
});
router.get("/sources",(_req,res)=>res.json(GetSourcesResponse.parse([
  {name:"OpenAlex",status:"Connected",description:"Live scholarly metadata discovery and citation links.",url:"https://openalex.org",licenseNote:"CC0 metadata; abstracts and full texts may have separate rights. Availability is subject to upstream API access."},
  {name:"Crossref",status:"Connected",description:"DOI metadata, authors, venues and citation counts.",url:"https://crossref.org",licenseNote:"Metadata discovery; full-text rights are not implied by DOI registration."},
  {name:"arXiv",status:"Connected",description:"Preprint discovery with links to originals.",url:"https://arxiv.org",licenseNote:"Per-paper licences apply; this app does not bulk-copy PDFs."},
  {name:"Semantic Scholar",status:"Permission required",description:"Not queried until commercial-use permission is confirmed.",url:"https://semanticscholar.org",licenseNote:"Commercial API permission must be reviewed before enabling."},
  {name:"CORE / Unpaywall / OpenCitations",status:"Not connected",description:"Planned additional discovery and open-access enrichment.",url:"https://core.ac.uk",licenseNote:"Provider keys and commercial terms must be checked separately."},
  {name:"Publisher full text",status:"Licence required",description:"IEEE, Elsevier, Springer and other paid full-text collections are not imported.",url:"https://www.crossref.org",licenseNote:"An ordinary reading subscription is not an AI processing or redistribution licence."},
  {name:"Large-scale vector index",status:"Not provisioned",description:"No 300-million-paper index or paid vector database has been provisioned.",url:"https://turbopuffer.com",licenseNote:"Bulk ingestion, hosting costs and dataset licences require separate approval."},
])));
export default router;
