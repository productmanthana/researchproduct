type Dated = {year?:number|null;publicationDate?:string};
const DAY=86400000;
export function publicationDate(value:unknown):string|undefined {
  if(typeof value!=="string")return;
  const date=value.slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
  const time=Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===date?date:undefined;
}
export function dateParts(parts:unknown):string|undefined {
  if(!Array.isArray(parts)||parts.length<3)return;
  return publicationDate(`${parts[0]}-${String(parts[1]).padStart(2,"0")}-${String(parts[2]).padStart(2,"0")}`);
}
export function freshness(p:Dated,now=new Date()):"recent"|"older"|"unknown"|"forthcoming" {
  const date=publicationDate(p.publicationDate);
  const today=Date.parse(`${now.toISOString().slice(0,10)}T00:00:00Z`);
  if(date){const age=today-Date.parse(`${date}T00:00:00Z`);return age<0?"forthcoming":age<=60*DAY?"recent":"older";}
  if(p.year&&p.year>now.getUTCFullYear())return "forthcoming";
  if(p.year&&Date.UTC(p.year,11,31)<today-60*DAY)return "older";
  return "unknown";
}
export function recentFirst<T extends Dated>(papers:T[],now=new Date()):T[] {
  const key=(p:T)=>{
    if(freshness(p,now)==="forthcoming")return -1;
    const date=publicationDate(p.publicationDate);
    return date?Number(date.replace(/-/g,"")):(p.year??0)*10000;
  };
  return [...papers].sort((a,b)=>key(b)-key(a));
}
export function researchCurrency(papers:Dated[],now=new Date()):string {
  const counts={recent:0,older:0,unknown:0,forthcoming:0};
  papers.forEach(p=>counts[freshness(p,now)]++);
  return `Evidence currency (${now.toISOString().slice(0,10)} UTC): ${counts.recent} cited source(s) have a reported publication date within the preceding 60 days; ${counts.older} are older; ${counts.unknown} lack a precise date establishing recency${counts.forthcoming?`; ${counts.forthcoming} have future publication dates`:""}. ${counts.recent?"The synthesis distinguishes recent evidence from older background where present.":"This evidence base should not be described as a latest-research report."} Catalogue indexing can lag publication.`;
}
