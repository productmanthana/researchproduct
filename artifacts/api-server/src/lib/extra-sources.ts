import { makePaper, clean, type Paper } from "./catalogue";
import { fetchSource } from "./source-registry";
const array=(v:any):any[]=>v==null?[]:Array.isArray(v)?v:[v];
export type SourceResult={papers:Paper[];total:number};
export async function extraSearch(name:string,q:string,page:number):Promise<SourceResult> {
  if(name==="dblp") {
    const data=JSON.parse(await fetchSource(`https://dblp.org/search/publ/api?${new URLSearchParams({q,format:"json",h:"25",f:String((page-1)*25)})}`,name)).result.hits;
    return {total:Number(data["@total"]??0),papers:array(data.hit).map(h=>{
      const w=h.info;
      return makePaper({title:clean(w.title),authors:array(w.authors?.author).map(a=>clean(a.text??a)),doi:clean(w.doi),year:Number(w.year)||0,
        venue:array(w.venue).map(clean).join(", "),url:array(w.ee)[0]??w.url,sources:[name],type:clean(w.type),license:"CC0 bibliographic metadata"});
    })};
  }
  if(name==="DataCite") {
    const d=JSON.parse(await fetchSource(`https://api.datacite.org/dois?${new URLSearchParams({query:`(${q}) AND types.resourceTypeGeneral:Text`,"page[size]":"25","page[number]":String(page)})}`,name));
    return {total:d.meta?.total??0,papers:(d.data??[]).map((item:any)=>{
      const w=item.attributes;
      return makePaper({title:clean(w.titles?.[0]?.title),authors:(w.creators??[]).map((a:any)=>clean(a.name)),year:Number(w.publicationYear)||0,doi:w.doi,
        abstract:clean(w.descriptions?.find((a:any)=>a.descriptionType==="Abstract")?.description),publisher:clean(w.publisher?.name??w.publisher),
        citations:w.citationCount??0,url:w.url||`https://doi.org/${w.doi}`,sources:[name],type:w.types?.resourceTypeGeneral,
        keywords:(w.subjects??[]).map((s:any)=>clean(s.subject)),license:w.rightsList?.[0]?.rights??"CC0 metadata; content licence separate"});
    })};
  }
  if(name==="Europe PMC") {
    const d=JSON.parse(await fetchSource(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?${new URLSearchParams({query:q,format:"json",resultType:"core",pageSize:"25",page:String(page)})}`,name));
    return {total:d.hitCount??0,papers:(d.resultList?.result??[]).map((w:any)=>makePaper({title:clean(w.title),
      authors:(w.authorList?.author??[]).map((a:any)=>clean(a.fullName)),year:Number(w.pubYear)||0,doi:w.doi??"",abstract:clean(w.abstractText),
      venue:clean(w.journalInfo?.journal?.title),citations:w.citedByCount??0,isOa:w.isOpenAccess==="Y",sources:[name],
      url:w.doi?`https://doi.org/${w.doi}`:`https://europepmc.org/article/${w.source}/${w.id}`,license:w.license??"Check original article licence",
      keywords:w.keywordList?.keyword??[],type:(w.pubTypeList?.pubType??[]).join(", ")}))};
  }
  if(name==="DOAJ") {
    const d=JSON.parse(await fetchSource(`https://doaj.org/api/search/articles/${encodeURIComponent(q)}?page=${page}&pageSize=25`,name));
    return {total:d.total??0,papers:(d.results??[]).map((item:any)=>{
      const w=item.bibjson??{},doi=w.identifier?.find((i:any)=>i.type==="doi")?.id??"";
      return makePaper({title:clean(w.title),authors:(w.author??[]).map((a:any)=>clean(a.name)),year:Number(w.year)||0,doi,
        abstract:clean(w.abstract),venue:clean(w.journal?.title),publisher:clean(w.journal?.publisher),isOa:true,
        url:doi?`https://doi.org/${doi}`:w.link?.[0]?.url,sources:[name],license:w.journal?.license?.[0]?.type??"Check article licence",keywords:w.keywords??[]});
    })};
  }
  if(name==="CORE") {
    const d=JSON.parse(await fetchSource(`https://api.core.ac.uk/v3/search/works?${new URLSearchParams({q,limit:"25",offset:String((page-1)*25)})}`,name,{headers:{Authorization:`Bearer ${process.env.CORE_API_KEY}`}}));
    return {total:d.totalHits??0,papers:(d.results??[]).map((w:any)=>makePaper({title:clean(w.title),authors:(w.authors??[]).map((a:any)=>clean(a.name)),
      year:w.yearPublished??0,doi:w.doi??"",abstract:clean(w.abstract),sources:[name],url:w.sourceFulltextUrls?.[0]??`https://core.ac.uk/works/${w.id}`,license:"Check original repository licence"}))};
  }
  if(name==="Semantic Scholar") {
    const d=JSON.parse(await fetchSource(`https://api.semanticscholar.org/graph/v1/paper/search?${new URLSearchParams({query:q,limit:"25",offset:String((page-1)*25),fields:"title,authors,year,externalIds,abstract,venue,citationCount,isOpenAccess,openAccessPdf,url,tldr"})}`,name,{headers:{"x-api-key":process.env.SEMANTIC_SCHOLAR_API_KEY!}}));
    return {total:d.total??0,papers:(d.data??[]).map((w:any)=>makePaper({title:clean(w.title),authors:(w.authors??[]).map((a:any)=>clean(a.name)),
      year:w.year??0,doi:w.externalIds?.DOI??"",abstract:clean(w.abstract),venue:clean(w.venue),citations:w.citationCount??0,isOa:!!w.isOpenAccess,
      pdfUrl:w.openAccessPdf?.url??"",url:w.url,tldr:clean(w.tldr?.text),sources:[name],license:"Data from Semantic Scholar; full-text rights separate"}))};
  }
  throw new Error("Unknown source");
}
