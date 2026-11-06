import "./_group.css";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Compass, Scale, SlidersHorizontal } from "lucide-react";
import { FlowShell, NextStage } from "./_shared/FlowShell";

type Direction = { id: string; title: string; question: string; gap: string; feasibility: string; resources: string; evidence: string; fit: number; };
const directions: Direction[] = [
  { id:"pitch",title:"Interpretable AI for wind turbine pitch control",question:"How do interpretable policies compare with a conventional controller in a defined simulation?",gap:"Clarify how policy explanations are evaluated alongside control behavior.",feasibility:"High for simulation-only scope.",resources:"Open simulator, turbine model, Python control stack.",evidence:"Concept-stage; literature needs review.",fit:4 },
  { id:"wake",title:"Wake-aware turbine coordination",question:"What coordination strategies merit comparison under a chosen wake model?",gap:"Model assumptions and farm layout may shape any comparison.",feasibility:"Moderate; scope depends on simulator.",resources:"Wake model, multi-turbine simulation, compute.",evidence:"Concept-stage; dense related literature likely.",fit:3 },
  { id:"fault",title:"Fault-aware control under sensor drift",question:"How might control policies respond to simulated sensor degradation?",gap:"A defined fault model and transparent baselines are essential.",feasibility:"Moderate; careful fault scenarios needed.",resources:"Turbine dynamics model, fault injection, evaluation harness.",evidence:"Concept-stage; search needed.",fit:3 },
  { id:"forecast",title:"Forecast-informed blade pitch scheduling",question:"What is the role of forecast horizon in a controlled scheduling study?",gap:"Forecast uncertainty can be separated from controller effects.",feasibility:"Moderate; synthetic inputs can bound the scope.",resources:"Wind time series or synthetic scenarios, simulator.",evidence:"Concept-stage; evidence not assessed.",fit:2 },
  { id:"transfer",title:"Transfer between simulated turbine models",question:"How robust is a policy when the simulation model changes?",gap:"Model mismatch and transfer protocol require explicit definitions.",feasibility:"Lower; multiple models and careful validation.",resources:"Two or more compatible models, compute, validation protocol.",evidence:"Concept-stage; no novelty claim.",fit:2 },
];

export function TopicExplorer() {
  const [selected, setSelected] = useState("pitch");
  const [compared, setCompared] = useState<string[]>(["pitch", "wake"]);
  const [showCompare, setShowCompare] = useState(false);
  const chosen = directions.find(item => item.id === selected)!;
  const compareItems = useMemo(() => directions.filter(item => compared.includes(item.id)), [compared]);
  const select = (id: string) => setSelected(id);
  const toggleCompare = (id: string) => setCompared(items => items.includes(id) ? items.filter(item => item !== id) : items.length < 3 ? [...items, id] : items);
  return <FlowShell active="topics" title="Find a direction worth pursuing" subtitle="Compare plausible research directions by scope, effort and evidence still to gather." action={<button className="ef-btn" onClick={() => setShowCompare(value => !value)}><Scale />{showCompare ? "Close comparison" : `Compare ${compared.length}`}</button>}>
    <div className="topic-intro"><div><span className="ef-card-label"><Compass /> Exploration, not a novelty verdict</span><p>These are illustrative candidate topics. A literature search can map what is known; it cannot guarantee a gap or prove originality.</p></div><span className="ef-tag warm">All topics are samples</span></div>
    <div className="topic-layout">
      <section className="topic-list" aria-label="Candidate directions">
        {directions.map((item, index) => <article key={item.id} className={`topic-card ef-panel ${selected === item.id ? "active" : ""}`}>
          <button className="topic-select" onClick={() => select(item.id)} aria-pressed={selected === item.id}>
            <span className="topic-index">{String(index + 1).padStart(2,"0")}</span>
            <span className="topic-text"><strong>{item.title}</strong><small>{item.question}</small></span>
            <span className="topic-radio">{selected === item.id && <Check />}</span>
          </button>
          <div className="topic-meta"><span><i className="topic-dot high" />{item.feasibility.split(";")[0]}</span><span className="ef-tag">{item.evidence}</span></div>
          <div className="topic-actions"><button className="ef-btn ef-btn-quiet" onClick={() => toggleCompare(item.id)} aria-pressed={compared.includes(item.id)}>{compared.includes(item.id) ? "✓ In comparison" : "+ Compare"}</button><button className="ef-btn ef-btn-quiet" onClick={() => select(item.id)}>View rationale <ArrowRight /></button></div>
        </article>)}
      </section>
      <aside className="topic-detail ef-panel">
        <div className="topic-detail-head"><span className="ef-card-label">Selected direction</span><span className="ef-mono">Candidate 01</span></div>
        <h2>{chosen.title}</h2><p className="topic-question">{chosen.question}</p>
        <div className="topic-detail-block"><span className="ef-mono">Potential gap to investigate</span><p>{chosen.gap}</p><small>Question to test during evidence review — not an established gap.</small></div>
        <div className="topic-detail-block"><span className="ef-mono">Feasibility & resources</span><p>{chosen.feasibility}</p><div className="topic-resource">{chosen.resources}</div></div>
        <div className="topic-readiness"><span className="ef-mono">Evidence status</span><strong>Not yet reviewed</strong><p>Candidate labels are not findings. Confirm with scholarly sources before committing.</p></div>
        {showCompare && <div className="topic-compare">
          <div className="topic-detail-head"><span className="ef-card-label"><SlidersHorizontal /> Side-by-side</span><span className="ef-sample-note">{compareItems.length} of 3 selected</span></div>
          {compareItems.length ? compareItems.map(item => <div key={item.id} className="compare-row"><strong>{item.title}</strong><span>{item.feasibility}</span><small>{item.resources}</small></div>) : <div className="ef-empty">Select up to three directions to compare.</div>}
          <p className="ef-sample-note" style={{marginTop:10}}>Readiness is a planning cue, not a score of scientific merit.</p>
        </div>}
        <div className="topic-recommend"><span className="ef-mono">Suggested starting point</span><p><b>Interpretable AI + pitch control + simulation</b> keeps access assumptions explicit and gives the first study a bounded scope.</p><button className="ef-btn ef-btn-primary" onClick={() => setSelected("pitch")}>Use this direction <Check /></button></div>
        <NextStage current="topics" label="Review illustrative evidence" />
      </aside>
    </div>
    <style>{`
      .topic-intro{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:14px 16px;margin-bottom:14px;border:1px solid #dce2d7;background:#eff2e9;border-radius:5px}.topic-intro p{margin-top:7px;color:#5f6d62;font-size:11px;line-height:1.7;max-width:760px}
      .topic-layout{display:grid;grid-template-columns:minmax(0,1fr) 370px;gap:15px;align-items:start}.topic-list{display:grid;gap:8px}.topic-card{padding:0;transition:border-color .18s,box-shadow .18s}.topic-card.active{border-color:#aabca9;box-shadow:inset 3px 0 var(--teal),0 3px 14px rgba(38,61,59,.025)}
      .topic-select{display:flex;width:100%;align-items:flex-start;gap:12px;padding:15px 16px 10px;background:transparent;border:0;text-align:left}.topic-index{padding-top:2px;color:var(--teal);font:10px 'JetBrains Mono',monospace}.topic-text{flex:1}.topic-text strong{display:block;font:500 16px/1.35 'Fraunces',serif}.topic-text small{display:block;margin-top:5px;color:var(--muted);font-size:10px;line-height:1.55}.topic-radio{width:17px;height:17px;display:grid;place-items:center;border:1px solid #cbd4c8;border-radius:50%;color:var(--teal)}.topic-radio svg{width:11px;height:11px}
      .topic-meta{display:flex;align-items:center;gap:12px;padding:0 16px 10px 40px;color:var(--muted);font-size:9px}.topic-meta>span:first-child{display:flex;align-items:center;gap:6px}.topic-dot{width:6px;height:6px;border-radius:50%;background:#8b9d80}.topic-actions{display:flex;justify-content:space-between;border-top:1px solid #edf0e9;padding:5px 10px}.topic-actions .ef-btn{min-height:27px;padding:5px 7px;font-size:9px}
      .topic-detail{position:sticky;top:12px;padding:19px}.topic-detail-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.topic-detail h2{margin:16px 0 7px;font:400 23px/1.25 'Fraunces',serif;letter-spacing:-.025em}.topic-question{color:#4e5e55;font-size:11px;line-height:1.7}.topic-detail-block{padding:14px 0;border-top:1px solid var(--line);margin-top:14px}.topic-detail-block p{margin-top:7px;font-size:11px;line-height:1.7}.topic-detail-block small{display:block;margin-top:5px;color:var(--rust);font-size:9px}.topic-resource{margin-top:8px;padding:9px;background:#f2f3ec;color:var(--muted);font-size:10px;line-height:1.6}
      .topic-readiness{display:flex;flex-direction:column;gap:6px;padding:12px;background:#f5efe5;border:1px solid #ece0cf;border-radius:4px}.topic-readiness strong{font-size:11px;font-weight:500;color:#805d3c}.topic-readiness p{color:#806c56;font-size:9px;line-height:1.6}
      .topic-recommend{margin:13px 0;padding-top:13px;border-top:1px solid var(--line)}.topic-recommend p{margin:7px 0 11px;font-size:10px;line-height:1.7;color:#586750}.topic-recommend b{color:var(--ink);font-weight:500}.topic-detail>.ef-btn-primary{width:100%;margin-top:12px}
      .topic-compare{margin-top:15px;padding-top:13px;border-top:1px solid var(--line)}.compare-row{padding:11px 0;border-bottom:1px solid var(--line)}.compare-row strong,.compare-row span,.compare-row small{display:block}.compare-row strong{font:500 12px 'Fraunces',serif}.compare-row span{margin-top:4px;color:var(--teal);font-size:9px}.compare-row small{margin-top:4px;color:var(--muted);font-size:9px}
      @media(max-width:1000px){.topic-layout{grid-template-columns:minmax(0,1fr) 320px}}@media(max-width:800px){.topic-layout{grid-template-columns:1fr}.topic-detail{position:static}}@media(max-width:560px){.topic-intro{align-items:flex-start;flex-direction:column}.topic-meta{padding-left:16px;flex-wrap:wrap}}
    `}</style>
  </FlowShell>;
}
export default TopicExplorer;
