// Citation formatting uses the maintained CSL processor, not hand-written journal styles.
import { Cite, plugins } from "@citation-js/core";
import "@citation-js/plugin-csl";
import ieeeStyle from "./styles/ieee.csl";
import { getPaper } from "./catalogue";
import { comparisonFields } from "./comparison";
import { renderStudioPdf } from "./studio-pdf";
import { renderStudioWord } from "./studio-docx";
import { academicTitle } from "./academic-style";
plugins.config.get("@csl").styles.add("ieee",ieeeStyle);

export async function exportResearch(view:any,style:"apa"|"ieee",format:"md"|"docx"|"pdf") {
  const references=await Promise.all(view.sources.map(async(s:any,index:number)=>{
    let paper;try{paper=await getPaper(s.paperId??s.id);}catch{/* Private evidence has no public bibliography record. */}
    const item:any={id:String(index+1),type:paper?"article-journal":"document",title:paper?.title??s.title,
      ...(paper?.authors.length?{author:paper.authors.map((literal:string)=>({literal}))}:{}),
      ...(paper?.year?{issued:{"date-parts":[[paper.year]]}}:{}),
      ...(paper?.venue?{"container-title":paper.venue}:{}),
      ...(paper?.doi?{DOI:paper.doi}:{}),
      ...(paper?.url?{URL:paper.url}:{}),
      ...(!paper?{note:"Private uploaded evidence; not publicly accessible"}:{})};
    const cite=new Cite([item]);
    const reference=String(cite.format("bibliography",{format:"text",template:style,lang:"en-US"})).trim().replace(/^\[\d+\]\s*/,"");
    // Let CSL format the in-text author/date as well, using literal names when providers offer no structured names.
    const inline=style==="apa"?String(cite.format("citation",{format:"text",template:"apa",lang:"en-US"})).trim():`[${index+1}]`;
    return {id:s.id,reference,inline};
  }));
  const unique:typeof references=[],numbers=new Map<number,number>();
  references.forEach((r,i)=>{
    let index=unique.findIndex(other=>other.reference===r.reference);
    if(index<0){index=unique.length;unique.push(r);}
    numbers.set(i+1,index+1);
  });
  const inline=(text:string)=>text.replace(/\[(\d+)\]/g,(match,n)=>style==="apa"?references[Number(n)-1]?.inline??match:numbers.has(Number(n))?`[${numbers.get(Number(n))}]`:match)
    .replace(/(\[\d+\])(?:\s+\1)+/g,"$1");
  const content=inline(view.content);
  const rows=view.comparisonRows??[];
  const mark=(cell:any)=>`${cell.text}${cell.status==="edited"?" [USER EDIT — NOT VERIFIED]":""}${(cell.evidence??[]).map((e:any)=>{const i=references.findIndex(r=>r.id===e.sourceId);return i<0?"":` ${style==="apa"?references[i].inline:`[${numbers.get(i+1)}]`}`;}).join("")}`;
  const bibliography=style==="apa"?[...unique].sort((a,b)=>a.reference.localeCompare(b.reference)).map(r=>r.reference):unique.map((r,i)=>`[${i+1}] ${r.reference}`);
  const disclosure=view.responseMode==="guidance"||!view.sources.length
    ?"AI-assisted guidance. This response is not a verified literature review. Check sources and conclusions before academic use."
    :"AI-assisted draft based on selected evidence. The researcher is responsible for checking sources, quotations, figures and conclusions. Automated verification is not a guarantee of accuracy.";
  const table=rows.length?`\n\n## Literature comparison\n\n| Paper | ${comparisonFields.join(" | ")} |\n| --- | ${comparisonFields.map(()=>"---").join(" | ")} |\n${rows.map((r:any)=>`| ${[r.title,...comparisonFields.map(f=>mark(r[f]))].map(c=>String(c).replace(/\|/g,"\\|").replace(/\n/g," ")).join(" | ")} |`).join("\n")}`:"";
  const cleaned=content.replace(/^# (?:Research synthesis|Literature synthesis|Visual evidence analysis)\s*\n+/,"")
    .replace(/^Evidence currency \([^\n]+\n+/m,"");
  const text=`${cleaned}${table}${bibliography.length?`\n\n## References (${style.toUpperCase()})\n\n${bibliography.join("\n\n")}`:""}\n\n## AI-use disclosure\n\n${disclosure}`;
  if(format==="md") return text;
  const report={title:view.reportTitle||academicTitle(view.question||"Research answer"),kind:"answer",content:text,metadata:{figures:view.figures??[],templateId:"academic-report"}};
  if(format==="pdf") return renderStudioPdf(report);
  return renderStudioWord(report);
}
