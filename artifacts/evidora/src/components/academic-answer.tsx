import type { ReactNode } from "react";

/** Small, escaped Markdown subset: no raw HTML or untrusted HTML injection. */
export function AcademicAnswer({content,inline,className=""}:{content:string;inline:(text:string)=>ReactNode;className?:string}) {
  const blocks=content.trim().split(/\n\s*\n/).filter(Boolean);
  return <div className={`ev-reading academic-reading ${className}`}>
    {blocks.map((block,i)=>{
      const heading=/^(#{1,3})\s+(.+)$/.exec(block);
      if(heading){
        if(heading[1].length===1)return <h2 className="academic-title mb-5 text-3xl font-semibold leading-tight" key={i}>{inline(heading[2])}</h2>;
        if(heading[1].length===2)return <h3 className="academic-section mb-3 mt-7 text-xl font-semibold leading-snug" key={i}>{inline(heading[2])}</h3>;
        return <h4 className="mb-2 mt-5 text-base font-semibold" key={i}>{inline(heading[2])}</h4>;
      }
      const lines=block.split("\n");
      if(lines.every(line=>/^[-*]\s+/.test(line)))return <ul key={i} className="mb-4 list-disc space-y-2 pl-5">{lines.map((line,n)=><li key={n}>{inline(line.replace(/^[-*]\s+/,""))}</li>)}</ul>;
      if(lines.every(line=>/^\d+[.)]\s+/.test(line)))return <ol key={i} className="mb-4 list-decimal space-y-2 pl-5">{lines.map((line,n)=><li key={n}>{inline(line.replace(/^\d+[.)]\s+/,""))}</li>)}</ol>;
      if(lines.every(line=>/^>\s?/.test(line)))return <blockquote className="my-4 border-l-2 pl-4 italic" key={i}>{inline(lines.map(line=>line.replace(/^>\s?/,"")).join(" "))}</blockquote>;
      return <p className="mb-4 text-[15px] leading-[1.85]" key={i}>{inline(block.replace(/\n/g," "))}</p>;
    })}
  </div>;
}
