/** Layout values are export settings, not a claim of publisher certification. */
export type Layout = {
  size:"LETTER"|"A4"; fontSize:number; lineSpacing:number; columns:number;
  margins:{top:number;bottom:number;left:number;right:number}; thesis:boolean;
};
const inch=72,mm=72/25.4;
export function documentLayout(id?:string):Layout {
  const base:Layout={size:"LETTER",fontSize:12,lineSpacing:1.5,columns:1,margins:{top:inch,bottom:inch,left:inch,right:inch},thesis:false};
  if(id==="academic-report")return {...base,size:"A4",fontSize:11,lineSpacing:1.16,margins:{top:45,bottom:45,left:50,right:50}};
  if(id?.startsWith("ieee-"))return {...base,fontSize:10,lineSpacing:1,columns:2,margins:{top:54,bottom:54,left:45,right:45}};
  if(id==="harvard")return {...base,thesis:true,lineSpacing:2};
  if(id==="stanford")return {...base,thesis:true,margins:{...base.margins,left:108}};
  if(id==="iit-bombay")return {...base,size:"A4",thesis:true,margins:{top:30*mm,bottom:22*mm,left:30*mm,right:20*mm}};
  if(id==="sadhana")return {...base,size:"A4",lineSpacing:2};
  if(["jisc","jiei","pramana"].includes(id??""))return {...base,size:"A4",fontSize:10,lineSpacing:1.5};
  return base;
}
/** Apply only bounded settings extracted from this exact selected official source. */
export function documentLayoutFor(row:any):Layout {
  const base=documentLayout(row.metadata?.templateId),check=row.metadata?.requirementsCheck;
  if(check?.status!=="retrieved"||check.templateId!==row.metadata?.templateId)return base;
  const supplied=check.appliedLayout??{},layout={...base,margins:{...base.margins}};
  if(["A4","LETTER"].includes(supplied.size))layout.size=supplied.size;
  if(Number.isFinite(supplied.fontSize)&&supplied.fontSize>=8&&supplied.fontSize<=16)layout.fontSize=supplied.fontSize;
  if(Number.isFinite(supplied.lineSpacing)&&supplied.lineSpacing>=1&&supplied.lineSpacing<=2.5)layout.lineSpacing=supplied.lineSpacing;
  if(supplied.columns===1||supplied.columns===2)layout.columns=supplied.columns;
  for(const side of ["top","right","bottom","left"] as const){
    const value=supplied.margins?.[side];
    if(Number.isFinite(value)&&value>=18&&value<=144)layout.margins[side]=value;
  }
  return layout;
}
export function layoutDescription(id:string){
  const l=documentLayout(id);
  return `${l.size==="LETTER"?"US Letter":"A4"} · ${l.fontSize} pt · ${l.columns} column${l.columns===1?"":"s"} · ${l.lineSpacing}× line spacing · margins T/R/B/L ${[l.margins.top,l.margins.right,l.margins.bottom,l.margins.left].map(n=>(n/72).toFixed(2)).join("/")} in${l.thesis?" · title page, contents and separate preliminary/body pagination":""}.`;
}
export function sectionText(content:string,name:string){
  const lines=content.split("\n");const start=lines.findIndex(s=>new RegExp(`^#{1,3}\\s+(?:\\d+[.)]?\\s+)?${name}\\s*$`,"i").test(s));
  if(start<0)return "";
  let end=start+1;while(end<lines.length&&!/^#{1,3}\s/.test(lines[end]))end++;
  return lines.slice(start+1,end).join("\n").trim();
}
export function formatIssues(row:any):string[]{
  const id=row.metadata?.templateId,d=row.metadata?.documentDetails??{},issues:string[]=[];
  if(!id)return ["No journal or institution profile is selected; a general academic layout will be exported."];
  if(!d.author?.trim())issues.push("Author name is missing from document details.");
  if(!d.affiliation?.trim())issues.push("Author affiliation is missing from document details.");
  const thesis=documentLayout(id).thesis;
  if(thesis){
    for(const key of ["degree","department","year"])if(!d[key]?.trim())issues.push(`Thesis ${key} is missing from document details.`);
    if(!d.supervisor?.trim())issues.push("Supervisor/advisor has not been entered.");
    if(!/introduction/i.test(row.content))issues.push("An Introduction chapter is missing.");
    if(!/conclusion/i.test(row.content))issues.push("A Conclusions chapter is missing.");
    if(id==="stanford"&&/^#{1,3}\s+(?:copyright|signature)(?: page)?\s*$/im.test(row.content))issues.push("Remove standalone copyright/signature pages from the Stanford submission; its system inserts them.");
    if(id==="harvard")issues.push("Author must supply the actual Thesis Acceptance Certificate for final Harvard submission; it is not fabricated or inserted by this exporter.");
    if(id==="iit-bombay")issues.push("Review the July 2025 academic-integrity declaration and disclose AI assistance. Actual approval signatures must not be generated.");
  }
  const abstract=sectionText(row.content,"Abstract");
  if(!abstract)issues.push("A separate Abstract heading and abstract are missing.");
  const words=abstract.trim().split(/\s+/).filter(Boolean).length;
  if(["jisc","jiei"].includes(id)&&abstract&&(words<150||words>250))issues.push(`Abstract is ${words} words; this journal requests 150–250.`);
  if(id==="iit-bombay"&&words>500)issues.push(`Abstract is ${words} words; review IIT Bombay's 500-word abstract guidance.`);
  if(id==="jiei"&&row.content.split(/\s+/).length>3000)issues.push("Manuscript exceeds the 3,000-word research-paper limit; reviews have a different limit.");
  if(!thesis&&!/keywords|index terms/i.test(row.content))issues.push("Keywords/index terms are missing.");
  if(id.startsWith("ieee-"))issues.push("Check the supplied IEEE official template, author biographies, ORCID and AI-use disclosure before submission. This is a two-column draft, not an IEEE-certified file.");
  if(id==="sadhana")issues.push("Verify the 20-page research/review limit, running title ≤60 characters and no more than six keywords.");
  if(["applied-energy","renewable-energy"].includes(id))issues.push("Prepare highlights and any required graphical abstract as separate submission files; review the journal's author guide.");
  if(!/funding/i.test(row.content)&&!thesis)issues.push("Funding declaration is missing; do not invent funding information.");
  if(!/competing|conflict of interest/i.test(row.content)&&!thesis)issues.push("Competing-interest declaration is missing.");
  return issues;
}
export type MarkdownBlock={kind:"heading";level:number;text:string}|{kind:"paragraph";text:string}|{kind:"table";rows:string[][]}|{kind:"figure";id:string};
export const plainText=(s:string)=>s.replace(/\*\*(.*?)\*\*/g,"$1").replace(/\[([^\][\n]+)\]\(([^)\n]+)\)/g,"$1 ($2)").replace(/`([^`]+)`/g,"$1");
export function documentBlocks(content:string):MarkdownBlock[]{
  const lines=content.split("\n"),blocks:MarkdownBlock[]=[];let paragraph:string[]=[];
  const flush=()=>{if(paragraph.length){blocks.push({kind:"paragraph",text:plainText(paragraph.join(" "))});paragraph=[];}};
  for(let i=0;i<lines.length;i++){
    const line=lines[i],heading=/^(#{1,3})\s+(.+)$/.exec(line);
    const figure=/^\s*\[\[figure:([a-zA-Z0-9_-]+)\]\]\s*$/.exec(line);
    if(figure){flush();blocks.push({kind:"figure",id:figure[1]});}
    else if(heading){flush();blocks.push({kind:"heading",level:heading[1].length,text:plainText(heading[2])});}
    else if(line.trim().startsWith("|")){
      flush();const rows:string[][]=[];
      while(i<lines.length&&lines[i].trim().startsWith("|")){
        const cells=lines[i].trim().replace(/^\||\|$/g,"").split("|").map(s=>plainText(s.trim()));
        if(!cells.every(c=>/^:?-+:?$/.test(c)))rows.push(cells);
        i++;
      }
      i--;if(rows.length)blocks.push({kind:"table",rows});
    }else if(!line.trim())flush();
    else paragraph.push(line);
  }
  flush();return blocks;
}
