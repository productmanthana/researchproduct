import "./_group.css";
import { useState, type FormEvent } from "react";
import { ArrowRight, ArrowUp, Check, MessageCircle, Wind } from "lucide-react";
import { FlowShell, NextStage } from "./_shared/FlowShell";

const choices = ["Wind energy", "Artificial intelligence", "Simulation"];

export function ResearchChat() {
  const [chosen, setChosen] = useState<string[]>(["Wind energy", "Artificial intelligence", "Simulation"]);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState("");
  const [topicPrompt, setTopicPrompt] = useState(false);
  const toggle = (value: string) => setChosen(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  const submit = (event: FormEvent) => { event.preventDefault(); if (draft.trim()) { setSent(draft.trim()); setDraft(""); } };
  return <FlowShell active="chat" title="Start with the rough idea" subtitle="A short conversation to find a useful direction — not a form to fill in." action={<span className="ef-tag"><MessageCircle /> Gentle start</span>}>
    <div className="chat-grid">
      <section className="chat-thread ef-panel" aria-label="Sample research conversation">
        <div className="chat-thread-top"><span className="ef-card-label">A first conversation</span><span className="ef-sample-note">Illustrative sample</span></div>
        <div className="chat-turn assistant"><span className="chat-avatar"><Wind /></span><div><span className="chat-speaker">Evidora <i>guide</i></span><p>Let’s make the idea more concrete, one choice at a time. When you say “a latest topic,” what kind of area has your attention?</p><div className="chat-question-note">You can change direction at any point.</div></div></div>
        <div className="chat-turn user"><div><span className="chat-speaker">You <i>sample response</i></span><p>I want to make research on a latest topic.</p></div></div>
        <div className="chat-turn assistant"><span className="chat-avatar"><Wind /></span><div><span className="chat-speaker">Evidora <i>guide</i></span><p>That’s a good place to begin. Which ingredients would you like to bring together?</p>
          <div className="choice-row">{choices.map(item => <button key={item} className={`choice-chip ${chosen.includes(item) ? "selected" : ""}`} aria-pressed={chosen.includes(item)} onClick={() => toggle(item)}>{chosen.includes(item) && <Check />}{item}</button>)}</div>
          <div className="chat-followup">And should the first study be something you can test in simulation, without needing access to a turbine?</div>
          <div className="choice-row"><button className={`choice-chip ${chosen.includes("Simulation") ? "selected" : ""}`} onClick={() => toggle("Simulation")} aria-pressed={chosen.includes("Simulation")}>Yes, simulation first</button><button className={`choice-chip ${chosen.includes("Field data") ? "selected" : ""}`} onClick={() => toggle("Field data")} aria-pressed={chosen.includes("Field data")}>I may have field data</button></div>
        </div></div>
        {sent && <div className="chat-turn user"><div><span className="chat-speaker">You <i>local reply</i></span><p>{sent}</p></div></div>}
        {topicPrompt && <div className="chat-turn assistant"><span className="chat-avatar"><Wind /></span><div><span className="chat-speaker">Evidora <i>next step</i></span><p>We have enough to explore a few directions. We’ll keep them as candidates, not claims of novelty.</p><a className="ef-btn ef-btn-primary chat-inline-link" href="/__mockup/preview/evidora-flow/TopicExplorer">Explore candidate topics <ArrowRight /></a></div></div>}
        <form className="chat-composer" onSubmit={submit}>
          <label className="ef-mono" htmlFor="chat-reply">Anything you want to add?</label>
          <div className="chat-input-row"><input id="chat-reply" value={draft} onChange={event => setDraft(event.target.value)} placeholder="A constraint, curiosity, or half-formed thought…" maxLength={300} /><button className="ef-btn ef-btn-primary" type="submit" disabled={!draft.trim()} aria-label="Add local reply"><ArrowUp /></button></div>
          <span className="ef-sample-note">Replies stay in this browser preview and are not saved.</span>
        </form>
      </section>
      <aside className="chat-side">
        <section className="chat-context ef-panel"><span className="ef-card-label">What we’ve heard</span><h2>A practical first boundary</h2><p>Wind energy + interpretable AI + simulation as a possible starting scope.</p><div className="chat-context-line"><span>Access assumption</span><b>Simulation available</b></div><div className="chat-context-line"><span>Still open</span><b>Control approach, measures</b></div></section>
        <div className="chat-notice"><span className="ef-mono">A good question can start small</span><p>No novelty is assumed here. The next screen compares feasibility and what evidence would still be needed.</p></div>
        <div className="chat-advance"><p className="ef-mono">When it feels useful</p><button className="ef-btn ef-btn-primary" onClick={() => setTopicPrompt(true)}>Explore directions<ArrowRight /></button><div style={{ marginTop: 8 }}><NextStage current="chat" label="See topic options" /></div></div>
      </aside>
    </div>
    <style>{`
      .chat-grid{display:grid;grid-template-columns:minmax(0,1fr) 275px;gap:18px;align-items:start}
      .chat-thread{padding:20px 22px 16px}.chat-thread-top{display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:1px solid var(--line)}
      .chat-turn{display:flex;gap:11px;margin-top:18px;max-width:750px}.chat-turn.user{justify-content:flex-end;margin-left:auto}.chat-turn.user>div{max-width:78%;padding:12px 15px;background:#edf0e8;border:1px solid #e1e6dc;border-radius:8px 8px 2px 8px}
      .chat-avatar{width:27px;height:27px;display:grid;place-items:center;flex:0 0 auto;border-radius:50%;background:#e4ece5;color:var(--teal)}.chat-avatar svg{width:14px;height:14px}
      .chat-speaker{display:block;margin-bottom:5px;color:var(--teal);font:9px 'JetBrains Mono',monospace;letter-spacing:.05em;text-transform:uppercase}.chat-speaker i{margin-left:5px;color:#929b8f;font-style:normal}
      .chat-turn p{font:400 15px/1.72 'Fraunces',serif;color:#344a45}.chat-question-note,.chat-followup{margin-top:10px;color:var(--muted);font-size:11px}
      .choice-row{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.choice-chip{display:inline-flex;align-items:center;gap:5px;padding:7px 10px;background:var(--surface);border:1px solid var(--line);border-radius:20px;font-size:10px}.choice-chip svg{width:12px;height:12px}.choice-chip.selected{background:#e6ede5;border-color:#b7c8b9;color:var(--teal-dark)}
      .chat-composer{margin-top:20px;padding-top:15px;border-top:1px solid var(--line);display:grid;gap:8px}.chat-input-row{display:flex;gap:8px}.chat-input-row input{flex:1;min-width:0;padding:10px 12px;border:1px solid var(--line);border-radius:4px;background:#fffdf8;font-size:12px}.chat-input-row .ef-btn{min-width:37px}
      .chat-inline-link{margin-top:12px}.chat-side{display:flex;flex-direction:column;gap:12px}.chat-context{padding:18px}.chat-context h2{margin:15px 0 7px;font:400 19px/1.3 'Fraunces',serif}.chat-context>p{color:var(--muted);font-size:11px;line-height:1.7}.chat-context-line{display:flex;justify-content:space-between;gap:10px;padding-top:11px;margin-top:11px;border-top:1px solid var(--line);font-size:10px;color:var(--muted)}.chat-context-line b{color:var(--ink);font-weight:500;text-align:right}
      .chat-notice{padding:15px 16px;border-left:2px solid var(--sage);background:#edf0e8}.chat-notice p{margin-top:7px;color:#586750;font-size:11px;line-height:1.7}.chat-advance{padding:14px 0 0;display:grid;gap:9px}.chat-advance .ef-btn{width:100%}
      @media(max-width:900px){.chat-grid{grid-template-columns:1fr}.chat-side{display:grid;grid-template-columns:1fr 1fr}.chat-advance{grid-column:1/-1;grid-template-columns:1fr 1fr;align-items:center}.chat-advance>p{grid-column:1/-1}}
      @media(max-width:600px){.chat-side{display:flex}.chat-turn.user>div{max-width:94%}.chat-thread{padding:16px}}
    `}</style>
  </FlowShell>;
}
export default ResearchChat;
