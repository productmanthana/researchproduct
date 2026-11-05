import "./_group.css";
import "./ResearchStudio.css";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUp, BookOpen, Check, ChevronDown, ChevronRight, Copy, FileText, FlaskConical, Info, Layers3, Leaf, LockKeyhole, MessageSquareText, Search, ShieldCheck, X } from "lucide-react";
import { previewAnalysis } from "./_adapters";

// Redesigned from the extracted Current Ask: the same Analysis fixture, citation
// indexing, source-to-claim mapping, scope disclosure and follow-up relationship.
// All interactions are local. No production hooks, AI calls or network requests.
const analysis = previewAnalysis;
const workflow = [
  ["Research Scout", "Search scope", "Illustrative query: " + analysis.searchQueries.join("; ")],
  ["Evidence Analyst", "Abstract-based sample", "An abstract-only evidence scope is represented here; full-text methods are outside this sample."],
  ["Figure Interpreter", "Not inspected", "Original PDF pages and figures have not been inspected."],
  ["Synthesis Writer", "Illustrative draft", "Organize the sample into an answer with numbered source references."],
  ["Citation Reviewer", "Not independently verified", "Show source-to-claim links for inspection. This preview does not verify evidence."],
];

function MarkdownAnswer({ content, selectSource }: { content: string; selectSource: (id: string) => void }) {
  const inline = (text: string): ReactNode[] => text.split(/(\[\d+\])/g).map((part, i) => {
    const n = /^\[(\d+)\]$/.exec(part);
    const source = n ? analysis.sources[Number(n[1]) - 1] : undefined;
    return source ? <button className="ev-cite" key={i} onClick={() => selectSource(source.id)} aria-label={`Inspect source ${n![1]}: ${source.title}`}>{n![1]}</button> : part;
  });
  return <div className="ev-reading">{content.split(/\n\n+/).map((block, i) => {
    if (block.startsWith("## ")) return <h2 key={i}>{block.slice(3)}</h2>;
    if (block.startsWith("### ")) return <h3 key={i}>{block.slice(4)}</h3>;
    return <p key={i}>{inline(block)}</p>;
  })}</div>;
}

export function ResearchStudio() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(analysis.sources[0].id);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const evidenceRef = useRef<HTMLElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const selectedSource = analysis.sources.find(source => source.id === selected);
  const selectedNumber = analysis.sources.findIndex(source => source.id === selected) + 1;
  const sourceClaims = analysis.claims.filter(claim => claim.evidence.some(evidence => evidence.sourceId === selected));
  const visibleSources = analysis.sources.filter(source => `${source.title} ${source.evidenceLevel} ${source.verification}`.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || (filter === "abstract" && source.evidenceLevel === "Abstract only") || (filter === "fulltext" && (source.evidenceLevel as string) === "Full text")));

  const selectSource = (id: string) => {
    setSelected(id); setSearch(""); setFilter("all");
    window.requestAnimationFrame(() => {
      evidenceRef.current?.focus({ preventScroll: true });
      if (window.innerWidth < 768) evidenceRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
    });
  };
  const copyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(`DESIGN PREVIEW — Illustrative evidence, not a research finding.\n\n${analysis.question}\n\n${analysis.content}\n\n${analysis.sources.map((source, i) => `[${i + 1}] ${source.title} · ${source.evidenceLevel} · ${source.verification}`).join("\n")}\n\n${analysis.warnings.join("\n")}`);
      setCopyStatus("Answer and illustrative references copied.");
    } catch { setCopyStatus("Copy was unavailable. Select the answer text to copy it manually."); }
  };
  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (question.trim().length < 5) return;
    setResponse(question.trim()); setQuestion("");
  };
  const prefill = (value: string) => { setQuestion(value); composerRef.current?.focus(); };

  return <div className="ev-studio">
    <header className="ev-top">
      <div className="ev-brand"><span className="ev-logo"><Leaf aria-hidden="true" /></span>evidora<span style={{ color: "#9ca38a" }}>.</span></div>
      <div className="ev-breadcrumb"><span>Workspace</span><ChevronRight /><span style={{ color: "var(--ev-ink)" }}>Research Studio</span></div>
      <span className="ev-preview">Design preview · illustrative evidence</span>
      <span className="ev-avatar" aria-label="Preview workspace">ED</span>
    </header>
    <div className="ev-layout">
      <aside className="ev-nav" aria-label="Workspace context">
        <div><p className="ev-micro ev-nav-title">Your workspace</p><a href="#research-studio" className="ev-nav-link" aria-current="page"><BookOpen />Research Studio</a></div>
        <div><p className="ev-micro ev-nav-title">This conversation</p><div className="ev-notebook"><p>Wind turbine<br />efficiency</p><small>Illustrative question</small></div></div>
        <div className="ev-nav-bottom"><FlaskConical /><p>A little less searching.<br />A little more understanding.</p><p style={{ marginTop: 12 }}>Local design prototype.<br />No live research is running.</p></div>
      </aside>
      <main className="ev-workspace" id="research-studio">
        <div className="ev-pagehead"><div><h1>Research Studio</h1><p>From a direct question to evidence you can inspect.</p></div><button className="ev-quiet" onClick={() => prefill("")}><MessageSquareText />Ask a follow-up<ArrowDown /></button></div>
        <div className="ev-columns">
          <section className="ev-main" aria-label="Research answer">
            <div className="ev-question"><div className="ev-section-label"><span className="ev-number">01</span><span className="ev-micro">The question</span></div><h2>{analysis.question}</h2><div className="ev-question-foot"><BookOpen />Sample conversation<span aria-hidden="true">·</span>Scholarly research</div></div>
            <article className="ev-answer">
              <div className="ev-answer-head"><div className="ev-section-label"><span className="ev-number">02</span><span className="ev-micro">The answer</span></div><button className="ev-quiet" onClick={copyAnswer}>{copyStatus.startsWith("Answer") ? <Check /> : <Copy />}Copy</button></div>
              <MarkdownAnswer content={analysis.content} selectSource={selectSource} />
              <div className="ev-takeaway"><span className="ev-micro">A useful next step</span><p>Compare methods against the same operating conditions before drawing a conclusion. The abstract-only sample is not enough to rank their effectiveness.</p></div>
              <details className="ev-disclosure">
                <summary><Layers3 />Research workflow<small>Illustrative roles</small><ChevronDown /></summary>
                <div className="ev-detail-body"><p style={{ marginBottom: 8 }}>A preview of workflow roles, not a record of live agent activity.</p>{workflow.map(([role, status, description], i) => <div className="ev-role" key={role}><span className="ev-role-number">{String(i + 1).padStart(2, "0")}</span><div><strong>{role}</strong><p>{description}</p><em>{status}</em></div></div>)}</div>
              </details>
              <details className="ev-disclosure ev-scope">
                <summary><Info />Evidence scope & limitations<ChevronDown /></summary>
                <div className="ev-detail-body"><ul>{analysis.warnings.map(warning => <li key={warning}>{warning}</li>)}<li>Sources and quotes are illustrative. No external evidence has been retrieved or independently verified.</li><li>The sample claim-to-source link is not proof that the claim is supported.</li></ul></div>
              </details>
              <p className="ev-scope-essential">Abstract-only sample. Full texts and figures not inspected.<br />Illustrative content, not a research finding.</p>
              <p className="ev-status" aria-live="polite">{copyStatus}</p>
            </article>
          </section>
          <aside className="ev-evidence" ref={evidenceRef} tabIndex={-1} aria-label="Source evidence">
            <div className="ev-evidence-head"><h2>The evidence</h2><span className="ev-count">{analysis.sources.length.toString().padStart(2, "0")}</span></div>
            <p className="ev-evidence-sub">Illustrative source collection.<br />Select a number to follow the evidence.</p>
            <label className="ev-search"><Search /><input aria-label="Search sources" type="search" placeholder="Search this collection" value={search} onChange={event => setSearch(event.target.value)} /></label>
            <select className="ev-filter" aria-label="Filter sources by evidence scope" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All evidence scopes</option><option value="abstract">Abstract only</option><option value="fulltext">Full text</option></select>
            {visibleSources.length ? visibleSources.map(source => <button key={source.id} className="ev-source" aria-pressed={selected === source.id} onClick={() => setSelected(selected === source.id ? null : source.id)}>
              <span className="ev-source-top"><span className="ev-number">[{analysis.sources.indexOf(source) + 1}]</span><span className="ev-micro">Illustrative source</span></span><span className="ev-source-title">{source.title}</span><span className="ev-source-meta"><FileText style={{ width: 11, height: 11, display: "inline", verticalAlign: -2, marginRight: 5 }} />{source.evidenceLevel}</span><span className="ev-source-hint">{selected === source.id ? "Evidence open below" : "Inspect evidence"}<ArrowRight /></span>
            </button>) : <div className="ev-empty"><Search /><p>No sources match this view.<br />Try a broader term or evidence scope.</p><button className="ev-quiet" onClick={() => { setSearch(""); setFilter("all"); }}>Reset filters</button></div>}
            {selectedSource && <section className="ev-inspector" aria-label={`Source ${selectedNumber} details`}>
              <div className="ev-inspector-head"><span className="ev-micro">Inside source [{selectedNumber}]</span><button aria-label="Close source details" onClick={() => setSelected(null)}><X style={{ width: 13, height: 13 }} /></button></div>
              <h3>Evidence excerpt</h3>
              {sourceClaims.map((claim, index) => <div key={index}>{claim.evidence.filter(evidence => evidence.sourceId === selected).map((evidence, i) => <div key={i}><blockquote>“{evidence.quote}”</blockquote><p>{evidence.page === null ? "Page not available" : `Page ${evidence.page}`} · Abstract-based sample</p></div>)}<div className="ev-claim"><span className="ev-micro">Linked claim {index + 1}</span><p>{claim.text} <button className="ev-cite" aria-label={`Inspect linked source ${selectedNumber}`} onClick={() => selectSource(selectedSource.id)}>{selectedNumber}</button></p><p>Illustrative relationship only; support has not been verified.</p></div></div>)}
              <div className="ev-figure"><FileText /><span>Figures</span><span>Not inspected</span></div>
              <p>{selectedSource.verification}. No source URL is supplied for this illustrative record.</p>
            </section>}
            <p className="ev-evidence-note"><ShieldCheck style={{ width: 13, height: 13, display: "inline", verticalAlign: -3, marginRight: 5 }} />A citation is a starting point, not a guarantee.<br />Check original evidence before relying on it.</p>
          </aside>
        </div>
        <section className="ev-follow" aria-labelledby="ev-follow-label">
          <div className="ev-follow-top"><span className="ev-number">03</span><p id="ev-follow-label">Keep the question moving.</p></div>
          <div className="ev-suggestions"><button onClick={() => prefill("How do operating conditions affect the comparison?")}>Compare operating conditions<ArrowRight style={{ display: "inline", width: 12, height: 12, marginLeft: 8, verticalAlign: -2 }} /></button><button onClick={() => prefill("What evidence would we need to compare these methods?")}>Identify evidence gaps<ArrowRight style={{ display: "inline", width: 12, height: 12, marginLeft: 8, verticalAlign: -2 }} /></button></div>
          <form className="ev-composer" onSubmit={submit}><label htmlFor="ev-followup" className="ev-micro" style={{ display: "block", marginBottom: 9 }}>Follow-up question</label><textarea ref={composerRef} id="ev-followup" maxLength={2000} value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask a follow-up, narrow the scope, or challenge an assumption…" onKeyDown={event => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); submit(); } }} /><div className="ev-composer-bottom"><span><LockKeyhole style={{ width: 12, height: 12 }} />Local demo · nothing is sent</span><button type="submit" className="ev-send" disabled={question.trim().length < 5}>Preview follow-up<ArrowUp style={{ width: 14, height: 14 }} /></button></div></form>
          <p className="ev-composer-note">No AI generation or external processing. Enter at least 5 characters. Ctrl / ⌘ + Enter to preview.</p>
          <div aria-live="polite">{response && <article className="ev-demo-response"><span className="ev-micro">Local preview · not AI-generated</span><h3>{response}</h3><p>This is a fixed interaction preview, not a research answer. Your follow-up would remain attached to the original question and evidence scope. No search was run, no new sources were retrieved, and no claims were generated.</p><button className="ev-quiet" style={{ marginTop: 13 }} onClick={() => prefill(response)}>Revise question</button><button className="ev-quiet" style={{ marginTop: 13, marginLeft: 7 }} onClick={() => setResponse("")}>Dismiss</button></article>}</div>
        </section>
      </main>
    </div>
  </div>;
}

export default ResearchStudio;
