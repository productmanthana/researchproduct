// Citation formatting uses the maintained CSL processor, not hand-written journal styles.
import { Cite, plugins } from "@citation-js/core";
import "@citation-js/plugin-csl";
import ieeeStyle from "./styles/ieee.csl";
import { Document, Paragraph, Packer, HeadingLevel, Table, TableRow, TableCell, WidthType, PageOrientation } from "docx";
import { getPaper } from "./catalogue";
import { comparisonFields } from "./comparison";
import { renderStudioPdf } from "./studio-pdf";
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
  const inline=(text:string)=>style==="apa"?text.replace(/\[(\d+)\]/g,(match,n)=>references[Number(n)-1]?.inline??match):text;
  const content=inline(view.content);
  const rows=view.comparisonRows??[];
  const mark=(cell:any)=>`${cell.text}${cell.status==="edited"?" [USER EDIT — NOT VERIFIED]":""}${(cell.evidence??[]).map((e:any)=>{const i=references.findIndex(r=>r.id===e.sourceId);return i<0?"":` ${style==="apa"?references[i].inline:`[${i+1}]`}`;}).join("")}`;
  const bibliography=style==="apa"?[...references].sort((a,b)=>a.reference.localeCompare(b.reference)).map(r=>r.reference):references.map((r,i)=>`[${i+1}] ${r.reference}`);
  const disclosure="AI-assisted draft generated using OpenAI GPT-4.1 from selected evidence. The researcher is the author and is responsible for checking sources, quotations, figures and conclusions. Automated verification is not a guarantee of accuracy.";
  const table=rows.length?`\n\n## Literature comparison\n\n| Paper | ${comparisonFields.join(" | ")} |\n| --- | ${comparisonFields.map(()=>"---").join(" | ")} |\n${rows.map((r:any)=>`| ${[r.title,...comparisonFields.map(f=>mark(r[f]))].map(c=>String(c).replace(/\|/g,"\\|").replace(/\n/g," ")).join(" | ")} |`).join("\n")}`:"";
  const text=`${content}${table}\n\n## References (${style.toUpperCase()})\n\n${bibliography.join("\n\n")}\n\n## AI-use disclosure\n\n${disclosure}\n\n## Appendix: Search and processing notes\n\n${view.warnings.join("\n\n")}`;
  if(format==="md") return text;
  if(format==="pdf") return renderStudioPdf({title:view.question||"Research answer",kind:"answer",content:text,metadata:{}});
  const children:(Paragraph|Table)[]=content.split("\n").map((line:string)=>{
    const heading=line.match(/^(#{1,3}) (.*)$/);
    return new Paragraph(heading?{text:heading[2],heading:heading[1].length===1?HeadingLevel.HEADING_1:heading[1].length===2?HeadingLevel.HEADING_2:HeadingLevel.HEADING_3}:{text:line});
  });
  if(rows.length) {
    children.push(new Paragraph({text:"Literature comparison",heading:HeadingLevel.HEADING_2}));
    const cell=(value:string)=>new TableCell({children:[new Paragraph(value)]});
    children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({tableHeader:true,children:["Paper",...comparisonFields].map(cell)}),
      ...rows.map((r:any)=>new TableRow({children:[r.title,...comparisonFields.map(f=>mark(r[f]))].map(cell)})),
    ]}));
  }
  children.push(new Paragraph({text:`References (${style.toUpperCase()})`,heading:HeadingLevel.HEADING_2}),
    ...bibliography.map(text=>new Paragraph(text)),new Paragraph({text:"AI-use disclosure",heading:HeadingLevel.HEADING_2}),new Paragraph(disclosure));
  if(view.warnings.length)children.push(new Paragraph({text:"Appendix: Search and processing notes",heading:HeadingLevel.HEADING_2}),...view.warnings.map((text:string)=>new Paragraph(inline(text))));
  return Packer.toBuffer(new Document({sections:[{properties:rows.length?{page:{size:{orientation:PageOrientation.LANDSCAPE}}}:{},children}]}));
}
