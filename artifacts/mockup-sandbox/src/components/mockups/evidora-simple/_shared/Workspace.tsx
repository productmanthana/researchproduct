import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { ArrowDownToLine, ArrowRight, ArrowUp, BookOpen, Check, ChevronDown, FileText, Leaf, Menu, MessageCircle, Plus, Search, Wind, X } from "lucide-react";
import { initialContent, sources, type InitialState, type Section } from "./sample";
import "../_group.css";

// Conversation, source inspection and editing adapted from the actual flow
// components; no stage shell, routes, network calls or persistence.
export function Workspace({ initialState }: { initialState: InitialState }) {
  const [evidence, setEvidence] = useState(initialState !== "chat");
  const [panel, setPanel] = useState<"sources" | "draft" | null>(initialState === "chat" ? null : initialState === "writing" ? "draft" : "sources");
  const [hasDraft, setHasDraft] = useState(initialState === "writing");
  const [selected, setSelected] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [reading, setReading] = useState<number[]>([]);
  const [section, setSection] = useState<Section>("Introduction");
  const [content, setContent] = useState(initialContent);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ user: string; reply: string }[]>([]);
  const [topic, setTopic] = useState("Wind energy + AI");
  const [sidebar, setSidebar] = useState(false);
  const [library, setLibrary] = useState(false);
  const [status, setStatus] = useState("");
  const [exploring, setExploring] = useState(false);
  const thread = useRef<HTMLDivElement>(null);
  const answer = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const isWriting = panel === "draft";
  useLayoutEffect(() => {
    if (!evidence || !thread.current) return;
    if (hasDraft) thread.current.scrollTop = thread.current.scrollHeight;
    else if (answer.current) thread.current.scrollTop = answer.current.offsetTop - thread.current.offsetTop - 22;
  }, [evidence, hasDraft]);
  function revealTopic(value: string) {
    setTopic(value); setEvidence(true); setPanel("sources"); setSidebar(false);
  }
  function openSource(id: number) {
    setSearch(""); setSelected(id); setPanel("sources");
    // Never scroll the window: the record expands in place below its own card.
  }
  function send(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    const asksDraft = /\b(draft|write|introduction|manuscript)\b/i.test(text);
    const asksEvidence = /\b(source|evidence|paper|citation)\b/i.test(text);
    const precise = text.includes("?") || text.split(/\s+/).length > 9;
    let reply = "Your thought is added to this local conversation. This preview cannot research a new question, but you can explore the example or keep adding your own notes.";
    if (asksDraft) { setEvidence(true); setHasDraft(true); setPanel("draft"); reply = "I’ve opened an editable example draft beside our conversation. It proposes a simulation study; the Results section is waiting for your data."; }
    else if (asksEvidence || (!evidence && precise)) { setEvidence(true); setPanel("sources"); reply = "You can go straight to a precise question—no topic questionnaire needed. I’ve opened the example answer and fictional source records to show how evidence would appear. They do not answer or verify your new question."; }
    setMessages(current => [...current, { user: text, reply }]); setInput("");
    requestAnimationFrame(() => { if (thread.current) thread.current.scrollTop = thread.current.scrollHeight; });
  }
  function reset() {
    setEvidence(false); setHasDraft(false); setPanel(null); setMessages([]); setInput(""); setExploring(false); setTopic("Wind energy + AI"); setSidebar(false); setLibrary(false); setStatus("");
  }
  function loadSample() { setEvidence(true); setPanel(null); setMessages([]); setTopic("Wind energy + AI"); setSidebar(false); setLibrary(false); }
  function exportSample() {
    const text = `EVIDORA — LOCAL DESIGN SAMPLE\nFictional source records; no verified research or empirical results.\n\n${(Object.keys(content) as Section[]).map(key => `${key.toUpperCase()}\n\n${content[key]}`).join("\n\n")}\n\nEXAMPLE REFERENCES\n${sources.map(source => `[${source.id}] ${source.title} — fictional, unverified sample record`).join("\n")}`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "evidora-local-sample.txt"; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("Sample downloaded");
  }
  const assistantHead = <div className="es-assistant-head"><span><Wind /></span>Evidora</div>;
  const title = evidence ? "Interpretable AI for wind energy" : "A new research conversation";
  const filtered = sources.filter(source => `${source.title} ${source.kind} ${source.note}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="es-root">
    <button className={`es-backdrop ${sidebar ? "es-visible" : ""}`} aria-label="Close navigation" onClick={() => setSidebar(false)} />
    <aside className={`es-sidebar ${sidebar ? "es-sidebar-open" : ""}`} aria-label="Workspace navigation">
      <div className="es-brand"><span className="es-brand-mark"><Leaf /></span><span>evidora<b>.</b></span></div>
      <nav aria-label="Research"><button className="es-button" onClick={reset}><Plus />New chat</button><button className="es-nav-plain" onClick={() => { setLibrary(value => !value); setSidebar(false); }}><BookOpen />My research</button></nav>
      <div className="es-recent"><span className="es-eyebrow">Recent conversation</span><button onClick={loadSample}>Interpretable AI<br />for wind energy<small>Example conversation</small></button></div>
      <div className="es-sidebar-bottom"><span className="es-avatar">YO</span><span>Your workspace<br /><small className="es-small">Local preview</small></span></div>
    </aside>
    <main className="es-main">
      <header className="es-topbar"><div className="es-top-title"><button className="es-icon es-mobile-menu" aria-label="Open navigation" onClick={() => setSidebar(true)}><Menu /></button><h1>{title}</h1></div><div className="es-top-actions"><span className="es-preview">Design sample</span>{evidence && panel !== "sources" && <button className="es-button" onClick={() => setPanel("sources")}><BookOpen />Sources</button>}{evidence && panel !== "draft" && hasDraft && <button className="es-button" onClick={() => setPanel("draft")}><FileText />Draft</button>}</div></header>
      {library && <section className="es-library" aria-label="My research"><div className="es-library-head"><h2>My research</h2><button className="es-icon" aria-label="Close my research" onClick={() => setLibrary(false)}><X /></button></div><p className="es-small">This session only. Nothing is saved to an account.</p><button className="es-button" onClick={loadSample}><MessageCircle />Interpretable AI for wind energy</button><button className="es-button" onClick={reset}><Plus />Begin another conversation</button></section>}
      <div className={`es-workspace ${isWriting ? "es-written" : ""}`}>
        <section className="es-conversation" aria-label="Research conversation">
          <div className="es-thread" ref={thread}><div className="es-thread-inner">
            <div className="es-thread-start"><span /><small>A little curiosity is enough to begin</small><span /></div>
            <div className="es-turn es-user">I’d like to research something current, but I’m not sure where to begin.</div>
            <div className="es-turn">{assistantHead}<div className="es-prose"><h2>Let’s find a question you care about.</h2><p>We can start with a rough idea. What has caught your interest lately?</p>{!evidence && <><div className="es-choices">{["Wind energy + AI", "Interpretable AI", "Simulation studies"].map(choice => <button className="es-button" key={choice} onClick={() => revealTopic(choice)}>{choice}<ArrowRight /></button>)}</div><p className="es-choice-note">Pick an interest, or ask your own question below.</p></>}</div></div>
            {evidence && <>
              <div className="es-turn es-user">{topic === "Wind energy + AI" ? "I’m interested in wind energy and AI. Could I begin with a simulation study?" : `I’m interested in ${topic.toLowerCase()}. Show me how the wind-energy example could work.`}</div>
              <div className="es-turn" ref={answer}>{assistantHead}<div className="es-prose"><p>Yes—a simulation could give you a manageable starting point. I’d keep the question narrow:</p><blockquote className="es-question">How could an interpretable AI policy be compared with conventional wind-turbine pitch control?</blockquote><p>First define the control task and what an explanation should reveal about each decision <button className="es-cite" aria-label="Inspect example source 1" onClick={() => openSource(1)}>[1]</button>. Then choose a reproducible baseline and the same wind conditions for both controllers <button className="es-cite" aria-label="Inspect example source 2" onClick={() => openSource(2)}>[2]</button>.</p><h3>What would make this useful?</h3><p>Look beyond controller performance: decide how you would examine whether its explanations are understandable and consistent <button className="es-cite" aria-label="Inspect example source 3" onClick={() => openSource(3)}>[3]</button>. Treat that as a question to investigate, not an established research gap.</p><div className="es-inline-note"><BookOpen /><span>Example synthesis · fictional references, not verified support.</span></div><div className="es-actions"><button className="es-button" onClick={() => { setExploring(true); composer.current?.focus(); requestAnimationFrame(() => { if (thread.current) thread.current.scrollTop = thread.current.scrollHeight; }); }}><MessageCircle />Explore further</button><button className="es-button es-primary" onClick={() => { setHasDraft(true); setPanel("draft"); setStatus(""); }}><FileText />{hasDraft ? "Continue draft" : "Start a draft"}<ArrowRight /></button></div></div></div>
              {exploring && <div className="es-turn">{assistantHead}<div className="es-prose"><p>What would you like to understand better: choosing a baseline, defining interpretability, or planning the simulation?</p><p className="es-choice-note">Add your thoughts below. This preview keeps notes locally; it does not retrieve new research.</p></div></div>}
              {hasDraft && <><div className="es-turn es-user">Help me turn this into an introduction.</div><div className="es-turn">{assistantHead}<div className="es-prose"><p>I’ve started a working draft. You can edit it directly while we keep talking here. Results are left for your own experiment and data.</p></div></div></>}
            </>}
            {messages.map((message, index) => <div key={index}><div className="es-turn es-user">{message.user}</div><div className="es-turn">{assistantHead}<div className="es-prose"><p>{message.reply}</p>{!evidence && <div className="es-actions"><button className="es-button" onClick={() => revealTopic("Wind energy + AI")}>Explore the example<ArrowRight /></button></div>}</div></div></div>)}
          </div></div>
          <div className="es-composer-wrap"><form className="es-composer" onSubmit={send}><textarea ref={composer} aria-label="Message Evidora" placeholder={isWriting ? "Talk through your draft…" : "A question, an idea, a half-formed thought…"} value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(event); } }} rows={2} maxLength={3000} /><div className="es-composer-bottom"><span>{isWriting ? "Your conversation stays with your draft" : "Start anywhere. You don’t need a perfect question."}</span><button className="es-icon" type="submit" disabled={!input.trim()} aria-label="Send local message"><ArrowUp /></button></div></form><p className="es-local-note">Local interactions only · no AI requests or saved research</p></div>
        </section>
        {panel === "sources" && <aside className="es-panel" aria-label="Sources"><div className="es-panel-header"><h2>Sources <span className="es-small">/ {sources.length}</span></h2><button className="es-icon" aria-label="Close sources and return to chat" onClick={() => setPanel(null)}><X /></button></div><div className="es-source-body"><p className="es-source-note">Fictional records for this design preview. No papers were retrieved or checked.</p><label className="es-search"><Search /><input type="search" aria-label="Search example sources" placeholder="Search these sources" value={search} onChange={event => setSearch(event.target.value)} /></label>
          {filtered.length ? filtered.map(source => <div className="es-source" key={source.id}><button className="es-source-button" aria-expanded={selected === source.id} aria-controls={`es-source-detail-${source.id}`} onClick={() => setSelected(selected === source.id ? null : source.id)}><span className="es-source-number">[{source.id}]</span><span><strong>{source.title}</strong><small>{source.kind}</small><small>{reading.includes(source.id) ? "Marked for reading" : source.scope}</small></span><ChevronDown /></button>{selected === source.id && <section className="es-source-detail" id={`es-source-detail-${source.id}`} aria-label={`Source ${source.id} details`}><span className="es-eyebrow">Reading prompt</span><p>{source.note}</p><strong>{source.question}</strong><p><small>No original paper, DOI or full text is supplied. Citation links illustrate placement, not source support.</small></p><button className="es-button" onClick={() => setReading(current => current.includes(source.id) ? current.filter(id => id !== source.id) : [...current, source.id])}>{reading.includes(source.id) ? <Check /> : <Plus />}{reading.includes(source.id) ? "Marked · undo" : "Mark for reading"}</button></section>}</div>) : <div className="es-empty"><Search /><p>No matching example sources.</p><button className="es-button" onClick={() => setSearch("")}>Clear search</button></div>}
        </div></aside>}
        {isWriting && <aside className="es-panel es-writing" aria-label="Editable draft"><div className="es-panel-header"><div><FileText /><h2>Working draft</h2></div><button className="es-icon" aria-label="Close draft and return to chat" onClick={() => setPanel(null)}><X /></button></div><div className="es-document-toolbar"><select aria-label="Choose draft section" value={section} onChange={event => setSection(event.target.value as Section)}>{(Object.keys(content) as Section[]).map(item => <option key={item}>{item}</option>)}</select><div><button className="es-icon" aria-label="Open draft sources" title="Open sources" onClick={() => setPanel("sources")}><BookOpen /></button><button className="es-icon" aria-label="Download local sample draft" title="Download sample" onClick={exportSample}><ArrowDownToLine /></button></div></div><div className="es-document"><span className="es-eyebrow">Research proposal · example</span><h2 className="es-document-title">Interpretable AI for wind-turbine pitch control</h2><div className="es-document-section"><h3>{section}</h3>{section === "Results" && <span className="es-awaiting">Awaiting your data</span>}</div><textarea className="es-editor" aria-label={`${section} draft text`} value={content[section]} onChange={event => { setContent(current => ({ ...current, [section]: event.target.value })); setStatus("Edited in this session"); }} spellCheck /><div className="es-status" role="status">{status}</div></div><div className="es-document-footer"><span>{content[section].trim() ? content[section].trim().split(/\s+/).length : 0} words</span><span>Local edits only · not saved</span></div></aside>}
      </div>
    </main>
  </div>;
}
