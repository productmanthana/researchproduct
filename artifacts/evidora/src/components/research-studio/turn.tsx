import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetAnalysis,getGetAnalysisQueryKey,getListAnalysesQueryKey,getGetUsageQueryKey,getGetSummaryQueryKey,type Analysis } from "@workspace/api-client-react";
import { ChevronDown, Copy, Layers, Info } from "lucide-react";
import { ErrorState } from "@/components/states";
import { EvidencePanel } from "./evidence-panel";
import { ProcessingProgress, processingLabel } from "./processing-progress";
import { AcademicAnswer } from "@/components/academic-answer";
import { LiveDraft } from "@/components/live-draft";

const done=(s:string)=>s==="completed"||s==="failed";

export function StudioTurn({initial,onRetry,retryDisabled,chatMode=false,onSourceSelect}:{initial:Analysis;onRetry:(q:string)=>void;retryDisabled:boolean;chatMode?:boolean;onSourceSelect?:(analysis:Analysis,sourceId:string)=>void}) {
  const qc=useQueryClient();
  const result=useGetAnalysis(initial.id,{query:{queryKey:getGetAnalysisQueryKey(initial.id),refetchInterval:q=>done(q.state.data?.status??initial.status)?false:2000}});
  const d=result.data??initial;
  const wasActive=useRef(!done(initial.status));
  const [selected,setSelected]=useState<string|null>(null);
  const [revealRequest,setRevealRequest]=useState(0);
  const [copyStatus,setCopyStatus]=useState("");
  useEffect(()=>{if(done(d.status)&&wasActive.current){wasActive.current=false;void qc.invalidateQueries({queryKey:getListAnalysesQueryKey()});void qc.invalidateQueries({queryKey:getGetUsageQueryKey()});void qc.invalidateQueries({queryKey:getGetSummaryQueryKey()});}},[d.status,qc]);
  function select(id:string|null){if(id&&onSourceSelect){onSourceSelect(d,id);return;}setSelected(id);setRevealRequest(n=>n+1);}
  const inline=(text:string)=>text.split(/(\[\d+\]|\*\*[^*]+\*\*)/g).map((part,i)=>{
    const match=/^\[(\d+)\]$/.exec(part);
    const source=match?d.sources[Number(match[1])-1]:undefined;
    if(source)return <button key={i} className="ev-cite" aria-label={`Inspect source ${match![1]}`} onClick={()=>select(source.id)}>{match![1]}</button>;
    if(part.startsWith("**")&&part.endsWith("**"))return <strong key={i}>{part.slice(2,-2)}</strong>;
    return part;
  });
  const images=d.warnings.find(w=>w.startsWith("Inspected "))??"No figure-inspection result recorded.";
  const referenceText=d.sources.map((s,i)=>{
    const paper=d.discoveredPapers?.find(p=>p.id===s.paperId);
    return `[${i+1}] ${paper?.authors.length?paper.authors.join(", ")+". ":""}${s.title}${paper?.year?` (${paper.year})`:""}. ${s.url}`;
  }).join("\n\n");
  const paperCount=new Set(d.sources.map(s=>s.paperId??s.id)).size;
  const roles=[
    ["Research Planning & Literature Survey Agents",d.searchQueries?.length?d.searchQueries.join(" · "):"Follow-up may reuse earlier papers; search details appear when available."],
    ["Knowledge Index & Paper Selection Agents","Index and rank public paper records when a new search runs, then select relevant papers."],
    ["Evidence Analysis Agent","Retrieves available evidence from selected papers. Found papers are not automatically full-text reviewed."],
    ["Figure Interpretation Agent",images],
    ["Research Synthesis Agent",d.status==="completed"?"Answer generated from retrieved evidence.":"Drafting follows evidence retrieval."],
    ["Citation Review Agent",d.status==="completed"?"Evidence checks finished; this does not guarantee correctness.":"Claim checking follows drafting."],
  ];
  return <li className={`ev-columns ev-live-turn ${chatMode?"ev-chat-turn es-chat-turn":""}`} data-testid={`turn-${d.id}`}>
    <section className="ev-main">
      {!chatMode&&<div className="ev-question"><div className="ev-section-label"><span className="ev-number">01</span><span className="ev-micro">The question</span></div><h2>{d.question}</h2><p className="ev-question-foot" data-testid={`status-turn-${d.id}`}>{d.status==="running"?processingLabel(d.stage):d.status==="queued"?"Queued · waiting for a research worker":d.status}</p></div>}
      <div className="ev-answer">
        {!chatMode&&<div className="ev-answer-head"><div className="ev-section-label"><span className="ev-number">02</span><span className="ev-micro">The answer</span></div>{d.content&&<button className="ev-quiet" onClick={async()=>{try{await navigator.clipboard.writeText(d.content+(referenceText?`\n\n## References\n\n${referenceText}`:""));setCopyStatus("Answer and references copied.");}catch{setCopyStatus("Copy unavailable. Select the answer text to copy.");}}}><Copy/>Copy</button>}</div>}
        {copyStatus&&<p role="status" className="ev-status">{copyStatus}</p>}
        {result.isError&&!done(d.status)&&<ErrorState error={result.error} onRetry={()=>result.refetch()} title="Could not refresh progress"/>}
        {!done(d.status)&&<LiveDraft kind="analysis" id={d.id} working invalidate={[getGetAnalysisQueryKey(d.id),getListAnalysesQueryKey()]} fallback={chatMode
          ?<p className="es-progress" role="status">{d.status==="queued"?"Queued · waiting for a research worker":processingLabel(d.stage)}{["reading","writing","checking"].includes(d.stage??"")&&!d.searchQueries?.length?" · Reusing selected papers":""}</p>
          :<ProcessingProgress stage={d.stage} queued={d.status==="queued"} reusedSources={["reading","writing","checking"].includes(d.stage??"")&&!d.searchQueries?.length}/>}/>}
        {d.status==="failed"&&<><ErrorState error={{message:d.error}} title="Research could not complete"/><button className="ev-quiet" disabled={retryDisabled} onClick={()=>onRetry(d.question)}>Put question back in composer</button></>}
        {d.status==="completed"&&<div data-testid={`text-answer-${d.id}`}>
          {d.responseMode!=="guidance"&&<p className="ev-evidence-context">{paperCount} cited {paperCount===1?"paper":"papers"} · Bounded research synthesis{d.sources.some(s=>s.evidenceLevel==="Abstract only")?" · Includes abstract-only evidence":""}</p>}
          <AcademicAnswer content={d.content} inline={inline}/>
          {d.sources.length>0&&<section className="ev-references" aria-label="References"><h3>References</h3><ol>
            {d.sources.map((s,i)=>{
              const paper=d.discoveredPapers?.find(p=>p.id===s.paperId);
              return <li key={s.id}><button className="ev-cite" onClick={()=>select(s.id)} aria-label={`Inspect reference ${i+1}`}>{i+1}</button><div>
                <button className="ev-reference-title" onClick={()=>select(s.id)}>{s.title}</button>
                <p>{paper?.authors.slice(0,4).join(", ")}{paper?.publicationDate?` (${paper.publicationDate})`:paper?.year?` (${paper.year}; year only)`:""}{paper?.publisher?` · ${paper.publisher}`:""}</p>
                {/^https?:\/\//i.test(s.url)&&<a href={s.url} target="_blank" rel="noopener noreferrer">{paper?.doi?`doi:${paper.doi}`:"View original source"}</a>}
              </div></li>;
            })}
          </ol></section>}
        </div>}
        {!chatMode&&<details className="ev-disclosure"><summary><Layers/>Research workflow<small>Agent roles</small><ChevronDown/></summary><div className="ev-detail-body"><p>Agent names describe roles within the research workflow.</p>{roles.map(([name,description],i)=><div className="ev-role" key={name}><span className="ev-role-number">0{i+1}</span><div><strong>{name}</strong><p>{description}</p></div></div>)}</div></details>}
        <details className="ev-disclosure ev-scope"><summary><Info/>{chatMode?"Research notes":"Search &amp; processing details"} <small>{d.warnings.length} notes</small><ChevronDown/></summary><div className="ev-detail-body"><p>Search coverage, retrieval and verification notes are kept separately from the scientific synthesis.</p><ul>{d.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul></div></details>
        {!chatMode&&<p className="ev-scope-essential">{d.sources.some(s=>s.evidenceLevel==="Abstract only")?"Includes abstract-only evidence. Full papers were not reviewed for those sources. ":""}AI-assisted; check original evidence before relying on it.</p>}
      </div>
    </section>
      {!chatMode&&<EvidencePanel analysis={d} selected={selected} onSelect={setSelected} revealRequest={revealRequest}/>}
  </li>;
}
