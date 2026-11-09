import { Fragment, type ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { referenceLinkLabel, referenceLinks, safeReferenceUrl, type ReferenceEntry } from "@/lib/references";
import "./academic-references.css";

/** Keep citation controls from the caller; only recognised, safe URLs become links. */
export function referenceInline(text:string,inline:(text:string)=>ReactNode):ReactNode {
  const links=referenceLinks(text);
  if(!links.length)return inline(text);
  const nodes:ReactNode[]=[];
  let cursor=0;
  for(const link of links){
    nodes.push(<Fragment key={`${link.start}-text`}>{inline(text.slice(cursor,link.start))}</Fragment>);
    nodes.push(<a className="academic-source-link" key={link.start} href={link.href} target="_blank" rel="noopener noreferrer" title="Open source in a new tab">{link.label}</a>);
    cursor=link.end;
  }
  nodes.push(<Fragment key="tail">{inline(text.slice(cursor))}</Fragment>);
  return nodes;
}

export function AcademicReferences({entries,title="References",idPrefix,onInspect}:{entries:ReferenceEntry[];title?:string;idPrefix?:string;onInspect?:(number:number)=>void}) {
  if(!entries.length)return null;
  return <section className="academic-bibliography" aria-label={title}>
    <h3 className="academic-bibliography-heading">{title}</h3>
    <ol className="academic-bibliography-list">
      {entries.map((entry,index)=>{
        const pos=entry.title?entry.citation.indexOf(entry.title):-1;
        const href=safeReferenceUrl(entry.href??"");
        const text=(value:string)=>referenceInline(value,t=>t);
        return <li key={`${entry.number}-${index}`} id={idPrefix?`${idPrefix}-${entry.number}`:undefined} className="academic-bibliography-entry">
          {onInspect?<button className="academic-reference-number" onClick={()=>onInspect(entry.number)} aria-label={`Inspect reference ${entry.number}`}>[{entry.number}]</button>
            :<span className="academic-reference-number">[{entry.number}]</span>}
          <div className="academic-reference-detail">
            <div className="academic-reference-citation">
              {pos>=0?<>{text(entry.citation.slice(0,pos))}<cite>{href?<a href={href} target="_blank" rel="noopener noreferrer">{entry.title}</a>:entry.title}</cite>{text(entry.citation.slice(pos+entry.title!.length))}</>:text(entry.citation)}
            </div>
            <div className="academic-reference-actions">
              {href?<a className="academic-reference-open" href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open reference ${entry.number} in a new tab`}><ExternalLink aria-hidden="true"/><span>{referenceLinkLabel(href)}</span></a>:<span className="academic-reference-unavailable">Source link unavailable</span>}
              {entry.evidence&&<span className="academic-reference-evidence">{entry.evidence}</span>}
            </div>
          </div>
        </li>;
      })}
    </ol>
  </section>;
}
