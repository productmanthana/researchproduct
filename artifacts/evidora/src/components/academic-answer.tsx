import { Fragment, useId, type ReactNode } from "react";
import { isolateMarkers } from "@/lib/figures";
import { parseReferences, referenceSections, type ReferenceSection, type ReferenceSource } from "@/lib/references";
import { AcademicReferences, referenceInline } from "./academic-references";
import { MathTex, displayMath, inlineMath, splitDisplayMath } from "./math";

/** Small, escaped Markdown subset: no raw HTML or untrusted HTML injection. */
const cells=(row:string)=>row.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(c=>c.trim());
const isDivider=(row:string)=>/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/.test(row.trim());

/** Inline bold on top of the caller's renderer (citations etc.). Text stays escaped by React. */
function withBold(text:string,inline:(text:string)=>ReactNode):ReactNode {
  if(!text.includes("**"))return inline(text);
  return text.split(/(\*\*[^*]+\*\*)/g).map((part,i)=>part.startsWith("**")&&part.endsWith("**")&&part.length>4
    ?<strong key={i}>{inline(part.slice(2,-2))}</strong>
    :<Fragment key={i}>{inline(part)}</Fragment>);
}

export function AcademicAnswer({content,inline:baseInline,className="",renderFigure,referenceSources=[],linkCitations=false}:{content:string;inline:(text:string)=>ReactNode;className?:string;renderFigure?:(id:string)=>ReactNode;referenceSources?:ReferenceSource[];linkCitations?:boolean}) {
  const referenceId=useId();
  const sections=referenceSections(renderFigure?isolateMarkers(content):content);
  const numbers=new Set(sections.flatMap(section=>section.kind==="references"?parseReferences(section.content).map(r=>r.number):[]));
  const citeInline=(text:string)=>!linkCitations?baseInline(text):text.split(/(\[\d+\])/g).map((part,i)=>{
    const number=/^\[(\d+)\]$/.exec(part);
    return number&&numbers.has(Number(number[1]))?<a key={i} className="academic-source-link" href={`#${referenceId}-${number[1]}`} aria-label={`Go to reference ${number[1]}`}>{part}</a>:<Fragment key={i}>{baseInline(part)}</Fragment>;
  });
  const inline=(text:string)=>inlineMath(text,segment=>withBold(segment,part=>referenceInline(part,citeInline)));
  const blocks=sections.flatMap<ReferenceSection>(section=>section.kind==="references"?[section]:section.content.trim().split(/\n\s*\n/).filter(Boolean).map(block=>({kind:"prose" as const,content:block})));
  return <div className={`ev-reading academic-reading ${className}`}>
    {blocks.map((section,i)=>{
      if(section.kind==="references")return <AcademicReferences key={i} entries={parseReferences(section.content,referenceSources)} title={section.title} idPrefix={referenceId}/>;
      const block=section.content;
      const fig=/^\s*\[\[figure:([A-Za-z0-9_-]+)\]\]\s*$/.exec(block);
      if(fig&&renderFigure)return <Fragment key={i}>{renderFigure(fig[1])}</Fragment>;
      const equation=displayMath(block);
      if(equation)return <MathTex key={i} tex={equation} display/>;
      const heading=/^(#{1,3})\s+(.+)$/.exec(block);
      if(heading){
        if(heading[1].length===1)return <h2 className="academic-title mb-5 text-3xl font-semibold leading-tight" key={i}>{inline(heading[2])}</h2>;
        if(heading[1].length===2)return <h3 className="academic-section mb-3 mt-7 text-xl font-semibold leading-snug" key={i}>{inline(heading[2])}</h3>;
        return <h4 className="mb-2 mt-5 text-base font-semibold" key={i}>{inline(heading[2])}</h4>;
      }
      const lines=block.split("\n");
      if(lines.length>=2&&lines[0].includes("|")&&isDivider(lines[1])){
        const head=cells(lines[0]);
        const rows=lines.slice(2).filter(l=>l.trim()).map(cells);
        return <div key={i} className="academic-table my-5 overflow-x-auto rounded-md border" role="region" aria-label="Table" tabIndex={0}>
          <table className="w-full min-w-[520px] border-collapse text-left text-[13.5px] leading-relaxed">
            <thead className="bg-[hsl(var(--muted))]"><tr>{head.map((h,n)=><th key={n} scope="col" className="border-b px-3 py-2 align-bottom font-semibold">{inline(h)}</th>)}</tr></thead>
            <tbody>{rows.map((r,ri)=><tr key={ri} className="border-b last:border-0">{head.map((_,n)=><td key={n} className="px-3 py-2 align-top">{inline(r[n]??"")}</td>)}</tr>)}</tbody>
          </table>
        </div>;
      }
      if(lines.every(line=>/^[-*]\s+/.test(line)))return <ul key={i} className="mb-4 list-disc space-y-2 pl-5">{lines.map((line,n)=><li key={n}>{inline(line.replace(/^[-*]\s+/,""))}</li>)}</ul>;
      if(lines.every(line=>/^\d+[.)]\s+/.test(line)))return <ol key={i} className="mb-4 list-decimal space-y-2 pl-5">{lines.map((line,n)=><li key={n}>{inline(line.replace(/^\d+[.)]\s+/,""))}</li>)}</ol>;
      if(lines.every(line=>/^>\s?/.test(line)))return <blockquote className="my-4 border-l-2 pl-4 italic" key={i}>{inline(lines.map(line=>line.replace(/^>\s?/,"")).join(" "))}</blockquote>;
      const parts=splitDisplayMath(block);
      if(parts.length>1)return <Fragment key={i}>{parts.map((part,j)=>part.tex!==undefined
        ?<MathTex key={j} tex={part.tex} display/>
        :<p className="mb-4 text-[15px] leading-[1.85]" key={j}>{inline((part.text??"").replace(/\n/g," "))}</p>)}</Fragment>;
      return <p className="mb-4 text-[15px] leading-[1.85]" key={i}>{inline(block.replace(/\n/g," "))}</p>;
    })}
  </div>;
}
