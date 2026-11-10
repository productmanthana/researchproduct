import { XMLParser } from "fast-xml-parser";
import { SearchStudioPatentsResponse } from "@workspace/api-zod";
const arr=(x:any):any[]=>x==null?[]:Array.isArray(x)?x:[x];
const text=(x:any):string=>typeof x==="string"?x:typeof x==="number"?String(x):x?.["#text"]??"";
export function epoCredentials(env:Record<string,string|undefined>){
  // Select a complete pair; never mix credentials from two registered clients.
  return env.EPO_CLIENT_ID&&env.EPO_CLIENT_SECRET
    ?{key:env.EPO_CLIENT_ID,secret:env.EPO_CLIENT_SECRET}
    :{key:env.EPO_Consumerkey,secret:env.EPO_Consumersecret_key};
}
export async function searchPatents(q:string,region="world") {
  const links=[
    {label:"Worldwide · Espacenet",url:`https://worldwide.espacenet.com/patent/search?q=${encodeURIComponent(q)}`},
    {label:"India · official public search",url:"https://iprsearch.ipindia.gov.in/PublicSearch"},
    {label:"International · WIPO PATENTSCOPE",url:"https://patentscope.wipo.int/search/en/search.jsf"},
    {label:"USA · USPTO",url:"https://ppubs.uspto.gov/pubwebapp/"},
  ];
  const {key,secret}=epoCredentials(process.env);
  if(!key||!secret)return SearchStudioPatentsResponse.parse({available:false,message:"Live patent API requires EPO access credentials. Official patent search links are available; no patent search has been performed.",patents:[],links});
  let failureMessage="Patent API is unavailable or access was rejected. No patent conclusions were generated. Use official search links or retry.";
  try{
    const auth=await fetch("https://ops.epo.org/3.2/auth/accesstoken",{method:"POST",headers:{Authorization:`Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=client_credentials",signal:AbortSignal.timeout(15000)});
    if(!auth.ok){
      failureMessage=`EPO authentication was rejected (HTTP ${auth.status}). Check that your OPS application is approved and the consumer credentials are active. No patent search was completed.`;
      throw new Error("Patent authentication failed");
    }
    const token=await auth.json() as {access_token:string};
    const terms=q.replace(/[^\p{L}\p{N}\s-]/gu," ").trim().split(/\s+/).slice(0,12).join(" ");
    const cql=`ta="${terms}"${region==="world"?"":` and pn=${region}`}`;
    const response=await fetch(`https://ops.epo.org/3.2/rest-services/published-data/search/biblio?q=${encodeURIComponent(cql)}`,{headers:{Authorization:`Bearer ${token.access_token}`,Accept:"application/xml",Range:"1-20"},signal:AbortSignal.timeout(25000)});
    if(response.status===404)return {available:true,message:"No matching patent records returned.",patents:[],links};
    if(!response.ok)throw new Error("Patent search unavailable");
    const parsed=new XMLParser({ignoreAttributes:false,removeNSPrefix:true}).parse(await response.text());
    const results=parsed?.["world-patent-data"]?.["biblio-search"]?.["search-result"];
    const docs=arr(results?.["exchange-documents"]).flatMap(v=>arr(v["exchange-document"]));
    const patents=docs.map(d=>{
      const b=d["bibliographic-data"]??{},identifier=arr(b["publication-reference"]?.["document-id"]).find(v=>v["@_document-id-type"]==="docdb")??{};
      const country=text(identifier.country)||String(d["@_country"]??""),number=text(identifier["doc-number"])||String(d["@_doc-number"]??"");
      const id=country+number+text(identifier.kind);
      return {id,title:text(arr(b["invention-title"]).find(t=>t["@_lang"]==="en")??arr(b["invention-title"])[0])||id,
        abstract:arr(d.abstract).map(a=>arr(a.p).map(text).join(" ")).join(" "),url:`https://worldwide.espacenet.com/publicationDetails/biblio?CC=${country}&NR=${number}`,country,
        date:text(identifier.date),applicant:arr(b.parties?.applicants?.applicant).map(a=>text(a["applicant-name"]?.name)).filter(Boolean).join("; ")};
    }).filter(p=>p.id);
    return SearchStudioPatentsResponse.parse({available:true,message:"Retrieved EPO publication records. Verify family membership and current legal status at the official source; not a patentability opinion.",patents:[...new Map(patents.map(p=>[p.id,p])).values()],links});
  }catch{
    return SearchStudioPatentsResponse.parse({available:false,message:failureMessage,patents:[],links});
  }
}
