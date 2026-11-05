import { openAlex, type Paper } from "./catalogue";
import { fetchSource } from "./source-registry";
const key=(s:string)=>s.replace(/^https?:\/\/(dx\.)?doi.org\//i,"").toLowerCase();
const words=(s:string)=>new Set(s.toLowerCase().replace(/<[^>]+>/g," ").match(/[\p{L}\p{N}]+/gu)??[]);
export function titlesMatch(a:string,b:string) {
  const x=words(a),y=words(b);
  return x.size>0&&y.size>0&&[...x].filter(w=>y.has(w)).length/Math.max(x.size,y.size)>=0.65;
}
export async function verifyCitations(papers:Paper[]) {
  const results=new Map<string,string>();
  const dois=papers.filter(p=>p.doi);
  let records:any[]=[];
  if(dois.length) {
    try {
      const d=await openAlex(`works?${new URLSearchParams({filter:`doi:${dois.map(p=>`https://doi.org/${p.doi}`).join("|")}`,"per-page":"100"})}`);
      records=d.results??[];
    } catch {/* Fall back to the DOI registration agency below. */}
  }
  for(let start=0;start<papers.length;start+=4) await Promise.all(papers.slice(start,start+4).map(async p=>{
    if(!p.doi) {results.set(p.id,"Provider record retrieved; no DOI available for recheck");return;}
    const found=records.find(w=>key(w.doi??"")===key(p.doi));
    if(found) {results.set(p.id,titlesMatch(p.title,found.display_name??"")?"DOI and title rechecked with OpenAlex":"DOI/title mismatch — excluded");return;}
    try {
      const record=JSON.parse(await fetchSource(`https://api.crossref.org/works/${encodeURIComponent(p.doi)}`,"Crossref")).message;
      results.set(p.id,key(record.DOI??"")===key(p.doi)&&titlesMatch(p.title,record.title?.[0]??"")?"DOI and title rechecked with Crossref":"DOI/title mismatch — excluded");
    } catch {
      results.set(p.id,"DOI recheck unavailable — verify original before use");
    }
  }));
  return results;
}
