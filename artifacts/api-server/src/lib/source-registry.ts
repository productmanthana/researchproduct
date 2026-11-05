import { pool } from "@workspace/db";
import { logger } from "./logger";

export const sourceDefinitions = [
  {name:"OpenAlex",url:"https://openalex.org",description:"Primary scholarly catalogue, citation links and full-query topic statistics.",licenseNote:"CC0 metadata. Linked full texts have separate licences.",interval:100},
  {name:"Crossref",url:"https://crossref.org",description:"DOI metadata, reference lists and citation counts.",licenseNote:"Metadata discovery; publisher abstract and full-text rights vary.",interval:150},
  {name:"arXiv",url:"https://arxiv.org",description:"Engineering, computing and science preprints; originals linked, not copied.",licenseNote:"Per-paper licences apply. Requests spaced at least 3 seconds apart.",interval:3100},
  {name:"dblp",url:"https://dblp.org",description:"Computer-science conference and journal bibliography.",licenseNote:"CC0 bibliographic metadata; full-text access is separate.",interval:1100},
  {name:"DataCite",url:"https://datacite.org",description:"DOI discovery for repository papers, reports and other textual research outputs.",licenseNote:"CC0 metadata; linked content retains its own licence.",interval:300},
  {name:"Europe PMC",url:"https://europepmc.org",description:"Biomedical and interdisciplinary research metadata and abstracts.",licenseNote:"Full-text licences vary. Discovery does not authorize bulk full-text reuse.",interval:300},
  {name:"DOAJ",url:"https://doaj.org",description:"Open-access article discovery and journal provenance.",licenseNote:"DOAJ article metadata is CC0; check each article's full-text licence.",interval:1100},
  {name:"Unpaywall",url:"https://unpaywall.org",description:"Additional legal open-access links for papers with a DOI.",licenseNote:"Metadata lookup requires a real contact email; PDFs remain at the original host.",interval:200,setting:"UNPAYWALL_EMAIL"},
  {name:"CORE",url:"https://core.ac.uk",description:"Additional repository discovery when API access and commercial terms are approved.",licenseNote:"Requires CORE API access and confirmation of applicable commercial terms.",interval:1100,setting:"CORE_API_KEY",permission:"CORE_COMMERCIAL_APPROVED"},
  {name:"Semantic Scholar",url:"https://semanticscholar.org",description:"Additional paper discovery and provider TLDRs when commercial API access is approved.",licenseNote:"Data from Semantic Scholar. Commercial permission must be confirmed.",interval:1100,setting:"SEMANTIC_SCHOLAR_API_KEY",permission:"S2_COMMERCIAL_APPROVED"},
  {name:"OpenCitations",url:"https://opencitations.net",description:"Additional DOI citation links using the provider's access token.",licenseNote:"CC0 citation metadata; API access token required.",interval:1100,setting:"OPENCITATIONS_TOKEN"},
];
export function configured(s:typeof sourceDefinitions[number]) {
  return (!s.setting || !!process.env[s.setting]) && (!s.permission || process.env[s.permission]==="true");
}
export async function initialiseRegistry() {
  for(const s of sourceDefinitions) await pool.query(`INSERT INTO research_sources(name,license,commercial_ok,attribution_text,rate_limit_ms,enabled)
    VALUES($1,$2,$3,$4,$5,true) ON CONFLICT(name) DO UPDATE SET license=$2,commercial_ok=$3,attribution_text=$4,rate_limit_ms=$5`,
    [s.name,s.licenseNote,!s.permission||process.env[s.permission]==="true",s.name==="Semantic Scholar"?"Data from Semantic Scholar":`Data from ${s.name}`,s.interval]);
}
const nextRequest=new Map<string,number>();
export class SourceUnavailable extends Error {
  constructor(public reason:"challenge"|"timeout"|"rate"|"network"|"response",public status=503) {super(reason);}
}
const cooldowns=new Map<string,{until:number;error:SourceUnavailable}>();
export function sourceFailure(error:unknown) {
  if(error instanceof SourceUnavailable) {
    if(error.reason==="challenge")return "The provider returned a bot-check page instead of API data. Waiting before retrying.";
    if(error.reason==="timeout")return "The provider did not respond within the time limit. Waiting before retrying.";
    if(error.reason==="rate")return "The provider rate limit was reached. Waiting before retrying.";
    if(error.reason==="network")return "The provider could not be reached from this server. Waiting before retrying.";
    return `The provider API returned HTTP ${error.status}.`;
  }
  return "The provider response could not be read.";
}
export async function fetchSource(endpoint:string,source:string,options:{headers?:Record<string,string>}={}) {
  const definition=sourceDefinitions.find(s=>s.name===source);
  if(!definition||!configured(definition)) throw new Error(`${source} requires configuration`);
  const {rows}=await pool.query("SELECT enabled,commercial_ok FROM research_sources WHERE name=$1",[source]);
  if(!rows[0]?.enabled||!rows[0].commercial_ok) throw new Error(`${source} is disabled`);
  const cooldown=cooldowns.get(source);
  if(cooldown&&cooldown.until>Date.now())throw cooldown.error;
  for(let attempt=0;attempt<2;attempt++) {
    const wait=Math.max(0,(nextRequest.get(source)??0)-Date.now());
    if(wait>15000) throw new Error(`${source} is busy; retry later`);
    nextRequest.set(source,Date.now()+wait+definition.interval);
    if(wait) await new Promise(r=>setTimeout(r,wait));
    const start=Date.now();
    let status=0;
    try {
      const response=await fetch(endpoint,{headers:{"User-Agent":"EvidoraResearch/1.0 (scholarly discovery)",...options.headers},signal:AbortSignal.timeout(8000)});
      status=response.status;
      await pool.query("UPDATE research_sources SET last_status=$2,last_checked=now() WHERE name=$1",[source,status]);
      if(!response.ok) {
        if(attempt===0&&[429,502,503,504].includes(status)) {
          const retry=Number(response.headers.get("retry-after"));
          // Do not occupy a request worker waiting for a daily budget reset.
          if(retry>5) throw new SourceUnavailable("rate",status);
          await new Promise(r=>setTimeout(r,Math.max(1000,(retry||1)*1000)));
          continue;
        }
        throw new SourceUnavailable(status===429?"rate":"response",status);
      }
      const text=await response.text();
      if(text.length>8_000_000) throw new Error(`${source} response too large`);
      if(status===202||/^\s*(<!doctype\s+html|<html)/i.test(text))throw new SourceUnavailable("challenge",status);
      cooldowns.delete(source);
      return text;
    } catch(error) {
      // A slow optional provider must not hold every healthy provider's results
      // through a second full timeout.
      if(error instanceof SourceUnavailable || (error instanceof Error && ["TimeoutError","AbortError"].includes(error.name)) || attempt===1 || status>=400) {
        const failure=error instanceof SourceUnavailable?error:new SourceUnavailable(error instanceof Error&&["TimeoutError","AbortError"].includes(error.name)?"timeout":"network",status||503);
        cooldowns.set(source,{until:Date.now()+(failure.reason==="challenge"?15*60_000:60_000),error:failure});
        await pool.query("UPDATE research_sources SET last_status=$2,last_checked=now() WHERE name=$1",[source,failure.status]);
        throw failure;
      }
    } finally {
      // Query strings may contain API keys or private research queries; never log them.
      logger.info({source,endpoint:new URL(endpoint).pathname,status,latencyMs:Date.now()-start},"Catalogue request");
    }
  }
  throw new Error(`${source} unavailable`);
}
export async function registryView() {
  const {rows}=await pool.query("SELECT * FROM research_sources");
  return sourceDefinitions.map(s=>{
    const row=rows.find(r=>r.name===s.name);
    const status=!configured(s)?s.permission?"Access / permission required":"Configuration required":!row?.enabled?"Disabled":row.last_status>=400||row.last_status===202?"Temporarily unavailable":row.last_checked?"Connected":"Enabled · not checked yet";
    return {name:s.name,url:s.url,description:s.description,status,licenseNote:s.licenseNote};
  });
}
