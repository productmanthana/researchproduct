import https from "node:https";
import dns from "node:dns";
import { BlockList, isIP } from "node:net";
import { openAlex, type Paper } from "./catalogue";
import { extractPages } from "./documents";
import { logger } from "./logger";

const blocked=new BlockList();
for(const [address,prefix] of [["0.0.0.0",8],["10.0.0.0",8],["100.64.0.0",10],["127.0.0.0",8],["169.254.0.0",16],["172.16.0.0",12],["192.168.0.0",16],["192.0.0.0",24],["192.0.2.0",24],["198.18.0.0",15],["198.51.100.0",24],["203.0.113.0",24],["224.0.0.0",4],["240.0.0.0",4]] as const) blocked.addSubnet(address,prefix,"ipv4");
export const reusableLicense=(value:unknown)=>/^(cc0|cc-by|cc-by-sa)(-\d\.\d)?$/.test(String(value??"").toLowerCase());
export const publicIPv4=(address:string)=>/^\d+\.\d+\.\d+\.\d+$/.test(address)&&!blocked.check(address,"ipv4");

// DNS is resolved and checked inside the connection lookup, not in an earlier
// preflight vulnerable to DNS rebinding. Every redirect gets the same checks.
export async function downloadPublicPdf(address:string,redirects=0,deadline=Date.now()+15000):Promise<Buffer> {
  const url=new URL(address);
  if(Date.now()>=deadline)throw new Error("Full-text download timed out");
  if(url.protocol!=="https:"||url.username||url.password||(url.port&&url.port!=="443")||redirects>3) throw new Error("Unsupported full-text URL");
  if(url.hostname.includes(":") || (isIP(url.hostname)&&!publicIPv4(url.hostname))) throw new Error("Private network destination rejected");
  return new Promise((resolve,reject)=>{
    const request=https.get(url,{
      family:4,
      headers:{"User-Agent":"EvidoraResearch/1.0 (open-access evidence)","Accept":"application/pdf"},
      lookup:(hostname,options,callback)=>{
        dns.lookup(hostname,{family:4,all:true},(error,addresses)=>{
          if(error)return callback(error,"",4);
          if(!addresses.length||addresses.some(a=>!publicIPv4(a.address)))return callback(new Error("Private network destination rejected"),"",4);
          if(typeof options==="object"&&options.all) (callback as any)(null,addresses);
          else callback(null,addresses[0].address,4);
        });
      },
    },response=>{
      response.on("error",reject);
      if([301,302,303,307,308].includes(response.statusCode??0)&&response.headers.location){
        response.resume();void downloadPublicPdf(new URL(response.headers.location,url).href,redirects+1,deadline).then(resolve,reject);return;
      }
      if(response.statusCode!==200){response.resume();reject(new Error("Full text unavailable"));return;}
      if(Number(response.headers["content-length"]??0)>15*1024*1024){response.destroy();reject(new Error("PDF exceeds 15 MB"));return;}
      let size=0;const chunks:Buffer[]=[];
      response.on("data",(chunk:Buffer)=>{size+=chunk.length;if(size>15*1024*1024){response.destroy(new Error("PDF exceeds 15 MB"));return;}chunks.push(chunk);});
      response.on("end",()=>{const bytes=Buffer.concat(chunks);if(bytes.subarray(0,5).toString()!=="%PDF-")reject(new Error("Not a PDF"));else resolve(bytes);});
    });
    const timer=setTimeout(()=>request.destroy(new Error("Full-text download timed out")),Math.max(1,deadline-Date.now()));
    request.on("close",()=>clearTimeout(timer));
    request.on("error",reject);
  });
}
export async function retrieveFullText(paper:Paper) {
  const started=Date.now();
  try {
    const identifier=paper.doi?`https://doi.org/${encodeURIComponent(paper.doi)}`:paper.url.match(/^https:\/\/openalex.org\/(W\d+)$/)?.[1];
    if(!identifier)return {notice:"No resolvable OpenAlex identifier; using abstract if available."};
    const work=await openAlex(`works/${identifier}`);
    const candidates=[work.best_oa_location,...(work.locations??[])].filter((l:any)=>l?.is_oa&&reusableLicense(l.license)).map((l:any)=>{
      // PLOS exposes a documented PDF route even when the index omits pdf_url.
      if(!l.pdf_url&&paper.doi.toLowerCase().startsWith("10.1371/journal.pone."))return {...l,pdf_url:`https://journals.plos.org/plosone/article/file?id=${encodeURIComponent(paper.doi)}&type=printable`};
      return l;
    }).filter((l:any)=>l.pdf_url);
    const urls=new Set<string>();
    for(const location of candidates.slice(0,3)){
      if(urls.has(location.pdf_url))continue;urls.add(location.pdf_url);
      try {
        const pages=await extractPages(await downloadPublicPdf(location.pdf_url));
        if(!pages.some(p=>p.text.trim().length>40))continue;
        return {pages,url:location.pdf_url,license:String(location.license),notice:"Automatically retrieved licensed PDF; selected text pages only. Figures were not visually inspected."};
      }catch{/* Try another licensed location; never bypass access controls. */}
    }
    return {notice:candidates.length?"Licensed PDF could not be read (access, size, scan or page limit). Using abstract if available; upload your copy for further analysis.":"No PDF with a supported reuse licence was found. Using abstract if available; upload a copy you have rights to analyse."};
  }catch{return {notice:"Full-text lookup unavailable. Using abstract if available; upload your copy if needed."};}
  finally{logger.info({source:"Open-access full text",paperId:paper.id,latencyMs:Date.now()-started},"Full-text retrieval attempted");}
}
