import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetAnalysis,getGetAnalysisQueryKey,getListAnalysesQueryKey,getGetUsageQueryKey,getGetSummaryQueryKey,type Analysis } from "@workspace/api-client-react";
import { ChevronDown, Copy, Layers, Info } from "lucide-react";
import { ErrorState } from "@/components/states";
import { EvidencePanel } from "./evidence-panel";

const done=(s:string)=>s==="completed"||s==="failed";
const stageText:Record<string,string>={planning:"Research Scout · Planning the search",searching:"Research Scout · Searching scholarly catalogues",indexing:"Research Scout · Indexing and ranking paper records",selecting:"Research Scout · Selecting relevant papers",reading:"Evidence Analyst · Retrieving and reading evidence",writing:"Synthesis Writer · Drafting an evidence-based answer",checking:"Citation Reviewer · Checking claims against evidence"};

export function StudioTurn({initial,onRetry,retryDisabled}:{initial:Analysis;onRetry:(q:string)=>void;retryDisabled:boolean}) {
  const qc=useQueryClient();
  const result=useGetAnalysis(initial.id,{query:{queryKey:getGetAnalysisQueryKey(initial.id),refetchInterval:q=>done(q.state.data?.status??initial.status)?false:2000}});
  const d=result.data??initial;
  const wasActive=useRef(!done(initial.status));
  const [selected,setSelected]=useState<string|null>(null);
  const [revealRequest,setRevealRequest]=useState(0);
  const [copyStatus,setCopyStatus]=useState("");
  useEffect(()=>{if(done(d.status)&&wasActive.current){wasActive.current=false;void qc.invalidateQueries({queryKey:getListAnalysesQueryKey()});void qc.invalidateQueries({queryKey:getGetUsageQueryKey()});void qc.invalidateQueries({queryKey:getGetSummaryQueryKey()});}},[d.status,qc]);
  function select(id:string|null){setSelected(id);setRevealRequest(n=>n+1);}
  const inline=(text:string)=>text.split(/(\[\d+\]|\*\*[^*]+\*\*)/g).map((part,i)=>{
    const match=/^\[(\d+)\]$/.exec(part);
    const source=match?d.sources[Number(match[1])-1]:undefined;
    if(source)return <button key={i} className="ev-cite" aria-label={`Inspect source ${match![1]}`} onClick={()=>select(source.id)}>{match![1]}</button>;
    if(part.startsWith("**")&&part.endsWith("**"))return <strong key={i}>{part.slice(2,-2)}</strong>;
    return part;
  });
  const images=d.warnings.find(w=>w.startsWith("Inspected "))??"No figure-inspection result recorded.";
  const roles=[
    ["Research Scout",d.searchQueries?.length?d.searchQueries.join(" · "):"Follow-up may reuse earlier papers; search details appear when available."],
    ["Evidence Analyst","Retrieves available evidence from selected papers. Found papers are not automatically full-text reviewed."],
    ["Figure Interpreter",images],
    ["Synthesis Writer",d.status==="completed"?"Answer generated from retrieved evidence.":"Drafting follows evidence retrieval."],
    ["Citation Reviewer",d.status==="completed"?"Evidence checks finished; this does not guarantee correctness.":"Claim checking follows drafting."],
  ];
  return <li className="ev-columns ev-live-turn" data-testid={`turn-${d.id}`}>
    <section className="ev-main">
      <div className="ev-question"><div className="ev-section-label"><span className="ev-number">01</span><span className="ev-micro">The question</span></div><h2>{d.question}</h2><p className="ev-question-foot" data-testid={`status-turn-${d.id}`}>{d.status==="running"?(stageText[d.stage??""]??"Processing research evidence"):d.status==="queued"?"Queued · waiting for a research worker":d.status}</p></div>
      <div className="ev-answer">
        <div className="ev-answer-head"><div className="ev-section-label"><span className="ev-number">02</span><span className="ev-micro">The answer</span></div>{d.content&&<button className="ev-quiet" onClick={async()=>{try{await navigator.clipboard.writeText(d.content);setCopyStatus("Answer copied.");}catch{setCopyStatus("Copy unavailable. Select the answer text to copy.");}}}><Copy/>Copy</button>}</div>
        {copyStatus&&<p role="status" className="ev-status">{copyStatus}</p>}
        {result.isError&&!done(d.status)&&<ErrorState error={result.error} onRetry={()=>result.refetch()} title="Could not refresh progress"/>}
        {!done(d.status)&&<div className="ev-takeaway" role="status"><strong>{d.status==="queued"?"Your question is queued":stageText[d.stage??""]??"Research is in progress"}</strong><p>Sources appear as they are found. The answer appears after evidence checks; no extra AI calls are made for these progress labels.</p></div>}
        {d.status==="failed"&&<><ErrorState error={{message:d.error}} title="Research could not complete"/><button className="ev-quiet" disabled={retryDisabled} onClick={()=>onRetry(d.question)}>Put question back in composer</button></>}
        {d.status==="completed"&&<div className="ev-reading" data-testid={`text-answer-${d.id}`}>{d.content.split(/\n+/).filter(Boolean).map((line,i)=>/^#{1,3} /.test(line)?<h2 key={i}>{inline(line.replace(/^#{1,3} /,""))}</h2>:<p key={i}>{inline(line)}</p>)}</div>}
        <details className="ev-disclosure"><summary><Layers/>Research workflow<small>Actual pipeline roles</small><ChevronDown/></summary><div className="ev-detail-body">{roles.map(([name,description],i)=><div className="ev-role" key={name}><span className="ev-role-number">0{i+1}</span><div><strong>{name}</strong><p>{description}</p></div></div>)}</div></details>
        <details className="ev-disclosure ev-scope"><summary><Info/>Evidence scope & limitations <small>{d.warnings.length} notices</small><ChevronDown/></summary><div className="ev-detail-body"><ul>{d.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul></div></details>
        <p className="ev-scope-essential">{d.sources.some(s=>s.evidenceLevel==="Abstract only")?"Includes abstract-only evidence. Full papers were not reviewed for those sources. ":""}AI-assisted; check original evidence before relying on it.</p>
      </div>
    </section>
    <EvidencePanel analysis={d} selected={selected} onSelect={setSelected} revealRequest={revealRequest}/>
  </li>;
}
