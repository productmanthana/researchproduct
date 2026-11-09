export type ReferenceSource = {title:string;url?:string};
export type ReferenceEntry = {number:number;citation:string;title?:string;href?:string;evidence?:string};
type AnalysisReferenceSource={title:string;url:string;paperId?:string|null;evidenceLevel?:string|null};
type ReferencePaper={id:string;authors:string[];year?:number|null;publicationDate?:string|null;publisher?:string|null};
export type LinkToken = {start:number;end:number;label:string;href:string;raw:string};

export function safeReferenceUrl(value:string):string|undefined {
  try {
    const url=new URL(value);
    return ["https:","http:"].includes(url.protocol)&&!url.username&&!url.password?url.href:undefined;
  }catch{return undefined;}
}

export function referenceLinkLabel(href:string) {
  const url=new URL(href);
  if(url.hostname.replace(/^www\./,"")!=="doi.org")return "Open original source";
  const path=url.pathname.slice(1);
  try{return `DOI: ${decodeURIComponent(path)}`;}catch{return `DOI: ${path}`;}
}

export function analysisReferenceEntries(sources:AnalysisReferenceSource[],papers:ReferencePaper[]=[]):ReferenceEntry[] {
  return sources.map((source,i)=>{
    const paper=papers.find(p=>p.id===source.paperId);
    const year=paper?.year??paper?.publicationDate?.slice(0,4);
    const authors=paper?.authors.join(", ");
    return {number:i+1,title:source.title,href:safeReferenceUrl(source.url),evidence:source.evidenceLevel??undefined,
      citation:[authors,year?`(${year}).`:undefined,`${source.title}.`,paper?.publisher?`${paper.publisher}.`:undefined].filter(Boolean).join(" ")};
  });
}

/** Remove sentence punctuation, but retain balanced parentheses inside real DOIs. */
function trimUrl(value:string) {
  let result=value.replace(/[.,;:!?]+$/,"");
  for(const [open,close] of [["(",")"],["[","]"]]){
    while(result.endsWith(close)&&result.split(close).length>result.split(open).length)result=result.slice(0,-1);
  }
  return result;
}

export function referenceLinks(text:string):LinkToken[] {
  const tokens:LinkToken[]=[];
  const pattern=/\[([^\]\n]+)\]\((https?:\/\/[^\s]+?)\)(?=\s|$|[.,;])|https?:\/\/[^\s<>"*]+|\bdoi:\s*(10\.\d{4,9}\/[^\s<>"*]+)/gi;
  for(const match of text.matchAll(pattern)){
    const markdown=match[1]!==undefined;
    const raw=markdown?match[0]:trimUrl(match[0]);
    const target=markdown?match[2]:match[3]?`https://doi.org/${trimUrl(match[3])}`:raw;
    const href=safeReferenceUrl(target);
    if(href)tokens.push({start:match.index!,end:match.index!+raw.length,label:markdown?match[1]:raw,href,raw});
  }
  return tokens;
}

export function parseReferences(text:string,sources:ReferenceSource[]=[]):ReferenceEntry[] {
  const starts=[...text.matchAll(/^[ \t]*(?:[-*][ \t]+)?(?:\[(\d+)\]|(\d+)[.)])[ \t]+/gm)];
  const pieces=starts.length
    ?starts.map((match,i)=>({number:Number(match[1]??match[2]),text:text.slice(match.index!+match[0].length,starts[i+1]?.index??text.length).trim()}))
    :text.split(/\n\s*\n/).filter(p=>p.trim()).map((p,i)=>({number:i+1,text:p.trim()}));
  // Preserve any introductory bibliography note, rather than silently dropping user text.
  if(starts.length&&text.slice(0,starts[0].index).trim())pieces[0].text=`${text.slice(0,starts[0].index).trim()} ${pieces[0].text}`;
  return pieces.map(piece=>{
    const evidenceMatch=/\s+Evidence:\s*(.+)$/i.exec(piece.text);
    const body=evidenceMatch?piece.text.slice(0,evidenceMatch.index):piece.text;
    const link=referenceLinks(body)[0];
    const citation=(link?body.slice(0,link.start)+(link.raw.startsWith("[")?link.label:"")+body.slice(link.end):body)
      .replace(/\s+/g," ").replace(/\b(?:doi|url)\s*:\s*$/i,"").trim();
    const source=sources[piece.number-1];
    // Metadata may be stale after editing. Never attach a different paper merely by number.
    const title=source?.title&&citation.includes(source.title)?source.title:undefined;
    return {number:piece.number,citation,title,href:link?.href??(title?safeReferenceUrl(source.url??""):undefined),evidence:evidenceMatch?.[1]};
  });
}

export type ReferenceSection={kind:"prose";content:string}|{kind:"references";title:string;content:string};
/** Presentation only: stored drafts, citation numbers and exported text are never rewritten. */
export function referenceSections(content:string):ReferenceSection[] {
  const lines=content.split("\n"),sections:ReferenceSection[]=[];
  let current:string[]=[];
  const flush=()=>{if(current.join("\n").trim())sections.push({kind:"prose",content:current.join("\n")});current=[];};
  for(let i=0;i<lines.length;i++){
    const heading=/^\s*(?:#{1,6}\s+|\*\*)?(References|Bibliography|Works cited|Reference list)(?:\*\*)?\s*:?\s*$/i.exec(lines[i]);
    if(!heading){current.push(lines[i]);continue;}
    flush();
    const refs:string[]=[];
    while(i+1<lines.length&&!/^\s*(?:#{1,6}\s+|\[\[figure:)/.test(lines[i+1]))refs.push(lines[++i]);
    if(refs.join("\n").trim())sections.push({kind:"references",title:heading[1],content:refs.join("\n")});
    else current.push(lines[i]);
  }
  flush();
  return sections;
}
