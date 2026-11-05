import { Router } from "express";
import { getAuth } from "@clerk/express";
import { SearchPapersQueryParams, SearchPapersResponse, GetPaperResponse, GetRelatedPapersQueryParams, GetLandscapeQueryParams, GetSourcesResponse } from "@workspace/api-zod";
import { search, getPaper, openAlex, fromOpenAlex, cachePapers } from "../lib/catalogue";
import { routeId, plans, HttpError } from "../lib/common";
import { topicLandscape } from "../lib/landscape";
import { registryView, fetchSource } from "../lib/source-registry";
import { fromCrossref } from "../lib/catalogue";
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
router.get("/papers/:id",async(req,res)=>{
  const paper=await getPaper(routeId(req));
  if(paper.doi && !paper.pdfUrl && process.env.UNPAYWALL_EMAIL) {
    try {
      const data=JSON.parse(await fetchSource(`https://api.unpaywall.org/v2/${encodeURIComponent(paper.doi)}?email=${encodeURIComponent(process.env.UNPAYWALL_EMAIL)}`,"Unpaywall"));
      if(data.best_oa_location) {
        paper.pdfUrl=data.best_oa_location.url_for_pdf??"";
        paper.isOa=!!data.is_oa;
        paper.license=data.best_oa_location.license??paper.license;
        await cachePapers([paper]);
      }
    } catch {/* The existing metadata is still valid; optional enrichment is unavailable. */}
  }
  res.json(GetPaperResponse.parse(paper));
});
router.get("/papers/:id/related",async(req,res)=>{
  const paper=await getPaper(routeId(req));
  const {kind="similar"}=GetRelatedPapersQueryParams.parse(req.query);
  if(kind==="similar") { const result=await search({q:paper.title.split(" ").slice(0,7).join(" "),sources:"OpenAlex,Crossref"});res.json({...result,papers:result.papers.filter((p:any)=>p.id!==paper.id)}); return; }
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
  } catch {
    if(kind==="references") {
      try {
        const data=JSON.parse(await fetchSource(`https://api.crossref.org/works/${encodeURIComponent(paper.doi)}`,"Crossref")).message;
        const dois=(data.reference??[]).filter((r:any)=>r.DOI).slice(0,10).map((r:any)=>r.DOI);
        const records=await Promise.allSettled(dois.map((doi:string)=>fetchSource(`https://api.crossref.org/works/${encodeURIComponent(doi)}`,"Crossref").then(t=>fromCrossref(JSON.parse(t).message))));
        const papers=records.flatMap(r=>r.status==="fulfilled"?[r.value]:[]);
        await cachePapers(papers);
        res.json({papers,total:papers.length,page:1,duplicatesRemoved:0,warnings:["OpenAlex unavailable. Showing up to 10 Crossref references with resolvable DOIs."]});return;
      } catch {/* Explicit failure below. */}
    }
    throw new HttpError(503,"Reference lookup is unavailable from OpenAlex. Try again later.");
  }
});
router.get("/landscape",async(req,res)=>{
  const {q}=GetLandscapeQueryParams.parse(req.query);
  res.json(await topicLandscape(q));
});
router.get("/sources",async(_req,res)=>res.json(GetSourcesResponse.parse(await registryView())));
export default router;
