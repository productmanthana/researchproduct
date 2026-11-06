export default function DocumentCopilot() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <div className="absolute top-0 left-0 w-[6vw] h-[1vh] bg-primary"></div>
      <div className="absolute left-[6vw] right-[6vw] top-[7vh]">
      <div className="flex items-center gap-[1.2vw]">
        <span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] bg-accent text-[#fcfbf7]">PARTIAL</span>
        <span className="font-body text-[1.5vw] text-muted">Evidora research briefing · 07 / 14</span>
      </div>
      <h1 className="font-display font-semibold text-[3.6vw] leading-[1.08] tracking-tight text-text mt-[1.6vh] max-w-[88vw]" style={{textWrap:"balance"}}>Ask Copilot questions about your documents</h1>
      </div>
      <div className="absolute left-[6vw] top-[30vh] w-[40vw] bottom-[11vh] bg-[#e4ebe3] rounded-[0.6vw] px-[2.4vw] py-[3vh] flex flex-col gap-[2.2vh]">
        <div className="flex items-center gap-[1vw]"><span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] bg-primary text-[#fcfbf7]">CURRENT</span><span className="font-display font-semibold text-[2.4vw] text-text">Research over PDFs</span></div>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Pick a document set.</span> <span className="text-text/80">Select uploaded PDFs for a Research run.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Ask natural questions.</span> <span className="text-text/80">Summarise, compare or extract methods across the chosen files.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Attributed answers.</span> <span className="text-text/80">Responses cite the document and passage used.</span></p>
      </div>
      <div className="absolute right-[6vw] top-[30vh] w-[42vw] bottom-[11vh] px-[1vw] py-[3vh] flex flex-col gap-[2.2vh] border-l-[0.3vw] border-primary pl-[2.4vw]">
        <div className="flex items-center gap-[1vw]"><span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] border-2 border-primary text-primary">PROPOSED</span><span className="font-display font-semibold text-[2.4vw] text-text">Unified Copilot</span></div>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Conversational in Ask.</span> <span className="text-text/80">Multi-document chat inside the main Ask experience.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Knowledge-base chat.</span> <span className="text-text/80">Return to a saved collection and keep questioning it.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Gaps disclosed.</span> <span className="text-text/80">Unreadable or unavailable passages are named, not guessed.</span></p>
      </div>

      <p className="absolute left-[6vw] right-[6vw] bottom-[4vh] font-body text-[1.5vw] text-muted leading-snug">Example: Which methods differ across these studies?</p>
    </div>
  );
}
