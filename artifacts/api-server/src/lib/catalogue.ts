import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { pool } from "@workspace/db";
import { GetPaperResponse } from "@workspace/api-zod";
import { z } from "zod";
import { HttpError } from "./common";
import { logger } from "./logger";

export type Paper = z.infer<typeof GetPaperResponse>;
type RecordData = Record<string, any>;
export type SearchInput = { q: string; year?: number; oa?: boolean; page?: number; sort?: string; venue?: string; publisher?: string; field?: string };
const clean = (value: unknown) => String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const url = (value: unknown) => { try { const u = new URL(String(value)); return u.protocol === "https:" || u.protocol === "http:" ? u.href : ""; } catch { return ""; } };
const doiKey = (v: string) => v.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "").trim().toLowerCase();
const normalized = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const fingerprint = (p: Paper) => `${normalized(p.title)}|${normalized(p.authors[0] ?? "")}|${p.year}`;
const paperId = (key: string) => {
  const h = createHash("sha256").update(key).digest("hex");
  return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;
};
function makePaper(p: Partial<Paper>): Paper {
  const base: Paper = { id:"",title:"Untitled work",authors:[],year:0,doi:"",abstract:"",venue:"",publisher:"",citations:0,isOa:false,pdfUrl:"",url:"",sources:[],license:"Not specified — check publisher rights",field:"",evidenceLevel:"Metadata only",...p };
  base.doi = doiKey(base.doi);
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
    year:w.publication_year ?? 0,doi:w.doi ?? "",abstract:invertedAbstract(w.abstract_inverted_index),venue:clean(w.primary_location?.source?.display_name),
    publisher:clean(w.primary_location?.source?.host_organization_name), citations:w.cited_by_count ?? 0,isOa:!!w.open_access?.is_oa,
    pdfUrl:w.best_oa_location?.pdf_url ?? "",url:w.doi || w.primary_location?.landing_page_url || w.id,
    sources:["OpenAlex"], license:w.best_oa_location?.license || "Check the original publisher licence",field:w.primary_topic?.field?.display_name ?? "" });
}
function fromCrossref(w: RecordData): Paper {
  return makePaper({title:clean(w.title?.[0]),authors:(w.author ?? []).map((a: RecordData) => clean(`${a.given ?? ""} ${a.family ?? a.name ?? ""}`)),
    year:w.published?.["date-parts"]?.[0]?.[0] ?? 0,doi:w.DOI ?? "",abstract:clean(w.abstract),venue:clean(w["container-title"]?.[0]),publisher:clean(w.publisher),
    citations:w["is-referenced-by-count"] ?? 0,url:w.URL ?? "",sources:["Crossref"],license:w.license?.[0]?.URL ?? "Metadata; abstract and full-text rights vary" });
}
async function fetchSource(endpoint: string, source: string) {
  const started = Date.now();
  for(let attempt=0; attempt<2; attempt++) {
    try {
      const response = await fetch(endpoint, { headers: { "User-Agent": "EvidoraResearch/1.0 (scholarly discovery)" }, signal: AbortSignal.timeout(10000) });
      logger.info({ source, status:response.status, latencyMs:Date.now()-started }, "Catalogue request");
      if(!response.ok) {
        if(attempt===0 && [429,502,503].includes(response.status)) { await new Promise(r=>setTimeout(r,700)); continue; }
        throw new Error(`${source} returned ${response.status}`);
      }
      return await response.text();
    } catch(e) { if(attempt===1) throw e; }
  }
  throw new Error("Source unavailable");
}
export async function openAlex(path: string) {
  return JSON.parse(await fetchSource(`https://api.openalex.org/${path}`, "OpenAlex"));
}
export async function cachePapers(papers: Paper[]) {
  for(const paper of papers) {
    await pool.query(`INSERT INTO research_papers(id,data) VALUES($1,$2) ON CONFLICT(id) DO UPDATE
      SET data=EXCLUDED.data,updated_at=now()`, [paper.id, JSON.stringify(paper)]);
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
  const q = input.q.trim().slice(0,300);
  if(q.length<2) throw new HttpError(400,"Enter at least two characters.");
  const page = Math.min(20,Math.max(1,input.page ?? 1));
  const key = JSON.stringify({...input,q,page});
  const cached = await pool.query("SELECT data FROM research_search_cache WHERE key=$1 AND expires_at>now()",[key]);
  if(cached.rows[0]) return cached.rows[0].data as {papers:Paper[];total:number;page:number;warnings:string[];duplicatesRemoved:number};
  const filters = [input.year ? `from_publication_date:${input.year}-01-01`:"",input.oa?"is_oa:true":""].filter(Boolean);
  const oaQuery = new URLSearchParams({search:q,"per-page":"25",page:String(page)});
  if(filters.length) oaQuery.set("filter",filters.join(","));
  const crQuery = new URLSearchParams({query:q,rows:"25",offset:String((page-1)*25)});
  if(input.year) crQuery.set("filter",`from-pub-date:${input.year}-01-01`);
  const jobs = await Promise.allSettled([
    openAlex(`works?${oaQuery}`).then(d => (d.results ?? []).map(fromOpenAlex) as Paper[]),
    fetchSource(`https://api.crossref.org/works?${crQuery}`,"Crossref").then(t=>(JSON.parse(t).message.items ?? []).map(fromCrossref) as Paper[]),
    fetchSource(`https://export.arxiv.org/api/query?${new URLSearchParams({search_query:`all:${q.replace(/[^\p{L}\p{N} -]/gu," ")}`,start:String((page-1)*15),max_results:"15"})}`,"arXiv")
      .then(t=>{
        const d = new XMLParser({ignoreAttributes:false}).parse(t).feed;
        const entries = Array.isArray(d?.entry) ? d.entry : d?.entry ? [d.entry] : [];
        return entries.filter((e:RecordData)=>!String(e.id).includes("api/errors")).map((e:RecordData)=>{
          const links = Array.isArray(e.link)?e.link:[e.link];
          const authors = Array.isArray(e.author)?e.author:[e.author];
          return makePaper({title:clean(e.title),abstract:clean(e.summary),authors:authors.filter(Boolean).map((a:RecordData)=>clean(a.name)),
            year:Number(String(e.published).slice(0,4))||0,doi:clean(e["arxiv:doi"]),venue:"arXiv",publisher:"arXiv",isOa:true,
            url:e.id,pdfUrl:links.find((l:RecordData)=>l?.["@_title"]==="pdf")?.["@_href"] ?? "",sources:["arXiv"],license:"Per-paper arXiv licence; link only",field:clean((Array.isArray(e.category)?e.category[0]:e.category)?.["@_term"])});
        }) as Paper[];
      }),
  ]);
  const warnings = jobs.flatMap((r,i)=>r.status==="rejected"?[`${["OpenAlex","Crossref","arXiv"][i]} is currently unavailable; these results are partial.`]:[]);
  if(jobs.every(r=>r.status==="rejected")) throw new HttpError(503,"Research sources are temporarily unavailable. Please try again.");
  const all = jobs.flatMap(r=>r.status==="fulfilled"?r.value:[]);
  const deduped = deduplicate(all);
  const possibleVersions = deduped.papers.some((p,i,items)=>items.some((other,j)=>
    i!==j && normalized(p.title)===normalized(other.title) && p.id!==other.id));
  if(possibleVersions) warnings.push("Possible preprint/published versions or ambiguous title matches were kept separate rather than merged automatically.");
  let papers = deduped.papers.filter(p=>(!input.year||p.year>=input.year)&&(!input.oa||p.isOa));
  for(const field of ["venue","publisher","field"] as const) if(input[field]) papers=papers.filter(p=>p[field].toLowerCase().includes(input[field]!.toLowerCase()));
  if(input.sort==="citations") papers.sort((a,b)=>b.citations-a.citations);
  if(input.sort==="year") papers.sort((a,b)=>b.year-a.year);
  await cachePapers(papers);
  const data = {papers,total:papers.length,page,warnings,duplicatesRemoved:deduped.removed};
  await pool.query("INSERT INTO research_search_cache(key,data,expires_at) VALUES($1,$2,now()+$3::interval) ON CONFLICT(key) DO UPDATE SET data=EXCLUDED.data,expires_at=EXCLUDED.expires_at",[key,JSON.stringify(data),warnings.length?"5 minutes":"7 days"]);
  return data;
}
