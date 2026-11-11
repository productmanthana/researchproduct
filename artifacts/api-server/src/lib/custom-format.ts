import { ApplyCustomFormatBody } from "@workspace/api-zod";
import type { z } from "zod";
import type { Layout } from "./studio-formatting";
import { parseExportReference } from "./export-references";

export const customFormatSchema=ApplyCustomFormatBody.shape.format;
export type CustomFormat=z.infer<typeof customFormatSchema>;
export function savedCustomFormat(row:any):CustomFormat|undefined{
  const result=customFormatSchema.safeParse(row.metadata?.customFormat);
  return result.success?result.data:undefined;
}
export function defaultCustomFormat(layout:Layout):CustomFormat{
  return {size:layout.size,fontFamily:"serif",fontSize:layout.fontSize,lineSpacing:layout.lineSpacing,
    columns:layout.columns as 1|2,margins:{...layout.margins},citationStyle:"numbered",figureWidth:100,
    captionPosition:"below",figurePlacement:"inline",sectionOrder:[],headingRenames:[],instructions:""};
}
export function customFormatWarnings(row:any,format:CustomFormat):string[]{
  const warnings=["Custom format — not automatically journal/university-compliant. Check the final PDF/Word file before submitting."];
  warnings.push("Font families are supported rather than exact source fonts: PDF embeds DejaVu Serif/Sans; Word uses Times New Roman/Arial.");
  const check=row.metadata?.requirementsCheck;
  if(check?.status==="retrieved"&&check.templateId===row.metadata?.templateId){
    const official=check.officialLayout??check.appliedLayout??{};
    for(const key of ["size","fontSize","lineSpacing","columns"] as const)
      if(official[key]!==undefined&&official[key]!==format[key])warnings.push(`${key==="size"?"Paper size":key==="fontSize"?"Font size":key==="lineSpacing"?"Line spacing":"Columns"} conflicts with the checked official setting (${official[key]}). Your custom choice will be kept.`);
    for(const side of ["top","right","bottom","left"] as const)
      if(official.margins?.[side]!==undefined&&Math.abs(official.margins[side]-format.margins[side])>0.05)
        warnings.push(`${side[0].toUpperCase()+side.slice(1)} margin conflicts with the checked official setting (${official.margins[side]} pt).`);
  }
  const words=row.content.trim().split(/\s+/).filter(Boolean).length;
  if(format.maxWords&&words>format.maxWords)warnings.push(`This draft has ${words} words, above your ${format.maxWords}-word limit. Text was not truncated.`);
  const abstractNames=["Abstract",...format.headingRenames.filter(r=>normal(r.from)==="abstract"||normal(r.to)==="abstract").flatMap(r=>[r.from,r.to])]
    .map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|");
  const abstract=new RegExp(`^#{1,3}\\s+(?:\\d+[.)]?\\s+)?(?:${abstractNames})\\s*\\n([\\s\\S]*?)(?=^#{1,3}\\s|(?![\\s\\S]))`,"im").exec(row.content)?.[1];
  const abstractWords=abstract?.trim().split(/\s+/).filter(Boolean).length??0;
  if(format.maxAbstractWords&&abstractWords>format.maxAbstractWords)warnings.push(`Abstract has ${abstractWords} words, above your ${format.maxAbstractWords}-word limit. Text was not truncated.`);
  for(const section of format.sectionOrder)
    if(!headings(row.content).some(h=>normal(h)===normal(section)))warnings.push(`Requested section "${section}" was not found; no missing research content was invented.`);
  if(format.citationStyle==="author-year")warnings.push("Author–year citations use available author/year metadata, with title/n.d. fallbacks. This is not a complete APA-style certification.");
  return warnings;
}
const normal=(s:string)=>s.replace(/^\d+[.)]?\s*/,"").trim().toLowerCase();
const headings=(content:string)=>[...content.matchAll(/^#{1,2}\s+(.+)$/gm)].map(m=>m[1]);
/** Change only existing headings/order/figure markers; never invent or truncate research. */
export function customFormatContent(content:string,format:CustomFormat,title?:string):string{
  const renames=new Map(format.headingRenames.map(r=>[normal(r.from),r.to.trim()]));
  let result=content.replace(/^(#{1,3})\s+(.+)$/gm,(_line,level,name)=>`${level} ${renames.get(normal(name))??name}`);
  const effectiveOrder=format.sectionOrder.map(s=>renames.get(normal(s))??s);
  if(effectiveOrder.length){
    // Preserve a level-one document title; reorder level-two sections, or level-one sections if there are no level-two headings.
    const level=/^##\s/m.test(result)?"##":"#";
    const chunks=result.split(new RegExp(`(?=^${level} (?!#))`,"m"));
    const preamble=chunks[0].startsWith(`${level} `)?"":chunks.shift()??"";
    const titleChunk=level==="#"&&title&&normal(chunks[0]?.split("\n")[0].replace(/^#+\s*/,"")??"")===normal(title)?chunks.shift()??"":"";
    const order=new Map(effectiveOrder.map((s,i)=>[normal(s),i]));
    result=preamble+titleChunk+chunks.map((text,i)=>({text,i,title:normal(text.split("\n")[0].replace(/^#+\s*/,""))}))
      .sort((a,b)=>(order.get(a.title)??999)-(order.get(b.title)??999)||a.i-b.i).map(c=>c.text).join("");
  }
  if(format.figurePlacement==="end"){
    const markers=[...result.matchAll(/^\s*(\[\[figure:[a-zA-Z0-9_-]+\]\])\s*$/gm)].map(m=>m[1]);
    if(markers.length){
      result=result.replace(/^\s*\[\[figure:[a-zA-Z0-9_-]+\]\]\s*$/gm,"");
      result=result.replace(/^## Figures\s*(?=^#{1,2}\s|(?![\s\S]))/gm,"");
      const block=`\n\n## Figures\n\n${[...new Set(markers)].join("\n\n")}\n\n`;
      const referenceStart=result.search(/^#{1,3}\s+(?:References|Bibliography|Works cited)\s*$/im);
      result=referenceStart<0?result+block:result.slice(0,referenceStart)+block+result.slice(referenceStart);
    }
  }
  return result;
}
/** Called after reference deduplication; preserve numbered reference identity while changing body labels. */
export function customCitationExport(row:any):any{
  const format=savedCustomFormat(row);
  if(format?.citationStyle!=="author-year")return row;
  const refs=new Map<number,string>();
  const sources=row.metadata?.sources??row.metadata?.reviewSources??[];
  const canonical=(url:string)=>url.replace(/#.*$/,"").replace(/\/$/,"").toLowerCase();
  const parts=row.content.split(/(?=^#{1,3}\s+(?:References|Bibliography|Works cited)\s*$)/im);
  if(parts.length<2)return row;
  const referencePart=parts.slice(1).join("");
  for(const line of referencePart.split("\n")){
    const entry=parseExportReference(line);
    if(!entry)continue;
    const source=sources.find((s:any)=>entry.href&&s.url&&canonical(s.url)===canonical(entry.href))??{};
    const author=Array.isArray(source.authors)&&source.authors.length?String(source.authors[0]).trim().split(/\s+/).pop():undefined;
    const year=source.year??(typeof source.publishedAt==="string"?source.publishedAt.slice(0,4):undefined);
    const title=source.title??entry.citation.split(".")[0];
    refs.set(entry.number,`${author?author+(source.authors.length>1?" et al.":""):String(title).slice(0,60)}, ${/^\d{4}$/.test(String(year))?year:"n.d."}`);
  }
  const body=parts[0].replace(/\[(\d+(?:\s*[,–-]\s*\d+)*)\]/g,(raw:string,numbers:string)=>{
    if(/[–-]/.test(numbers)){
      const [start,end]=numbers.split(/[–-]/).map(Number);
      if(end<start||end-start>100)return raw;
      const labels=Array.from({length:end-start+1},(_,i)=>refs.get(start+i));
      return labels.every(Boolean)?`(${labels.join("; ")})`:raw;
    }
    const labels=numbers.split(",").map(n=>refs.get(Number(n.trim())));
    return labels.every(Boolean)?`(${labels.join("; ")})`:raw;
  });
  return {...row,content:body+referencePart};
}
