import { useEffect, useMemo, useRef, useState } from "react";
import type { Analysis } from "@workspace/api-client-react";
import { ExternalLink, Search, X } from "lucide-react";

export function EvidencePanel({analysis:d,selected,onSelect,revealRequest=0}:{analysis:Analysis;selected:string|null;onSelect:(id:string|null)=>void;revealRequest?:number}) {
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("all");
  const [limit,setLimit]=useState(20);
  const papers=useMemo(()=>{
    const found=(d.discoveredPapers??[]).map(p=>({...p,refs:d.sources.map((s,i)=>({...s,n:i+1})).filter(s=>s.paperId===p.id||s.id===p.id||s.id.startsWith(`${p.id}-oa-p`))}));
    const known=new Set(found.flatMap(p=>p.refs.map(s=>s.id)));
    const all=[...found,...d.sources.filter(s=>!known.has(s.id)).map(s=>({id:s.id,title:s.title,abstract:"",authors:[] as string[],year:null,url:s.url,publisher:"",doi:"",selected:true,refs:[{...s,n:d.sources.indexOf(s)+1}]}))];
    return [...new Map(all.map(p=>[p.id,p])).values()];
  },[d.discoveredPapers,d.sources]);
  const filtered=papers.filter(p=>(filter==="all"||filter==="selected"&&p.selected||filter==="cited"&&p.refs.length>0)&&`${p.title} ${p.abstract} ${p.authors.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const active=selected?papers.find(p=>p.id===selected||p.refs.some(s=>s.id===selected)):undefined;
  const lastReveal=useRef(0);
  useEffect(()=>{
    if(revealRequest===lastReveal.current)return;
    lastReveal.current=revealRequest;
    if(!active)return;
    // Only citation clicks reveal/scroll; opening a paper in the sidebar stays in place.
    setQuery("");setFilter("all");
    setLimit(n=>Math.max(n,papers.indexOf(active)+1));
    const frame=requestAnimationFrame(()=>document.getElementById(`evidence-${d.id}`)?.scrollIntoView({block:"nearest",behavior:"auto"}));
    return ()=>cancelAnimationFrame(frame);
  },[revealRequest,active,papers,d.id]);
  const excerpts=active?d.claims.flatMap(c=>c.evidence.filter(e=>active.refs.some(s=>s.id===e.sourceId)).map(e=>({...e,claim:c.text,n:active.refs.find(s=>s.id===e.sourceId)?.n}))):[];
  return <aside className="ev-evidence" aria-label="Research papers" data-testid={`section-sources-${d.id}`}>
    <div className="ev-evidence-head"><h2>The evidence</h2><span className="ev-count" data-testid="paper-count">{papers.length} papers</span></div>
    <p className="ev-evidence-sub">{papers.filter(p=>p.selected).length} selected · {papers.filter(p=>p.refs.length).length} cited<br/>Found papers are not necessarily read or used. Numbers in brackets refer to answer citations.</p>
    {d.warnings.filter(w=>w.startsWith("Search scope:")||w.startsWith("Earlier answer scope:")).map(w=><p key={w} className="ev-scope-banner" role="status">{w}</p>)}
    {!d.discoveredPapers?.length&&d.status==="completed"&&<p className="ev-evidence-sub">This older answer contains cited evidence only; its original search results were not saved.</p>}
    <label className="ev-search"><Search/><input aria-label="Search research papers" value={query} placeholder="Search titles, authors, abstracts…" onChange={e=>{setQuery(e.target.value);setLimit(20);}}/></label>
    <select className="ev-filter" aria-label="Filter research papers" value={filter} onChange={e=>{setFilter(e.target.value);setLimit(20);}}><option value="all">All found papers</option><option value="selected">Selected for analysis</option><option value="cited">Cited in this answer</option></select>
    <div className="ev-paper-list">
      {filtered.slice(0,limit).map(p=><article key={p.id} className="ev-paper-row">
        <button className="ev-source" aria-pressed={active?.id===p.id} aria-expanded={active?.id===p.id} aria-controls={`evidence-${d.id}`} onClick={()=>onSelect(active?.id===p.id?null:p.id)}>
          <span className="ev-source-top"><span className="ev-number">{String(papers.indexOf(p)+1).padStart(2,"0")}</span><span className="ev-micro">{p.refs.length?"Cited":p.selected?"Selected for analysis":"Found · not analyzed"}</span><span>{p.refs.map(s=>`[${s.n}]`).join(" ")}</span></span>
          <span className="ev-source-title">{p.title}</span><span className="ev-source-meta">{p.authors.slice(0,3).join(", ")}{"publicationDate" in p&&p.publicationDate?` · ${p.publicationDate}`:p.year?` · ${p.year} (year only)`:" · Publication date unconfirmed"}</span>
          {(p.publisher||p.doi)&&<span className="ev-source-meta">{p.publisher||"Publisher not confirmed"}{p.doi?` · DOI ${p.doi}`:""}</span>}
          {p.abstract&&<span className="ev-abstract">{p.abstract}</span>}
          {p.refs.length>0&&<span className="ev-source-meta">{[...new Set(p.refs.map(s=>s.evidenceLevel))].join(" · ")}</span>}
          <span className="ev-source-hint">{active?.id===p.id?"Close paper details":"Inspect paper and evidence"} <span>{active?.id===p.id?"−":"↓"}</span></span>
        </button>
    {active?.id===p.id&&<section className="ev-inspector" tabIndex={-1} id={`evidence-${d.id}`} aria-label="Selected evidence">
      <div className="ev-inspector-head"><strong>{active.title}</strong><button aria-label="Close evidence details" onClick={()=>onSelect(null)}><X/></button></div>
      {active.refs.map(s=><p key={s.id}>[{s.n}] {s.evidenceLevel}{s.verification?` · ${s.verification}`:""}</p>)}
      {excerpts.length?excerpts.map((e,i)=><div key={i} className="ev-claim"><blockquote>“{e.quote}”</blockquote><p>[{e.n}] {e.page==null?"Page not available":`Page ${e.page}`}</p><p>{e.claim}</p></div>):<p>No supporting quote from this paper is cited in the answer. {active.abstract||"No abstract available."}</p>}
      {/^https?:\/\//i.test(active.url)&&<a className="ev-quiet" href={active.url} target="_blank" rel="noopener noreferrer">Open original source <ExternalLink/></a>}
    </section>}
      </article>)}
      {!filtered.length&&<p className="ev-empty">{papers.length?"No papers match these filters.":"Papers will appear here as discovery completes."}</p>}
    </div>
    {filtered.length>limit&&<button className="ev-quiet" style={{marginTop:12}} data-testid="button-more-papers" onClick={()=>setLimit(n=>n+20)}>Show 20 more ({filtered.length-limit} remaining)</button>}
    <p className="ev-evidence-note">Showing {Math.min(limit,filtered.length)} of {filtered.length} matching papers. This is the retrieved batch, not an exhaustive catalogue search.</p>
  </aside>;
}
