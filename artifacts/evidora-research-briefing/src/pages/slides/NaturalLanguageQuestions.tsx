export default function NaturalLanguageQuestions() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <div className="absolute top-0 left-0 w-[6vw] h-[1vh] bg-primary"></div>
      <div className="absolute left-[6vw] right-[6vw] top-[7vh]">
      <div className="flex items-center gap-[1.2vw]">
        <span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] bg-primary text-[#fcfbf7]">CURRENT</span>
        <span className="font-body text-[1.5vw] text-muted">Evidora research briefing · 02 / 14</span>
      </div>
      <h1 className="font-display font-semibold text-[3.6vw] leading-[1.08] tracking-tight text-text mt-[1.6vh] max-w-[88vw]" style={{textWrap:"balance"}}>Ask research questions in natural language</h1>
      <div className="mt-[4vh] flex flex-col gap-[2.6vh]">
        <div className="grid grid-cols-[22vw_1fr] gap-[2.4vw] border-t border-[#d3dacd] pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.2vw] leading-tight text-primary">Vague idea</div>
          <p className="font-body text-[2vw] leading-snug text-text">A broad interest prompts clarifying questions about field, population, method and objective before any search runs.</p>
        </div>
        <div className="grid grid-cols-[22vw_1fr] gap-[2.4vw] border-t border-[#d3dacd] pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.2vw] leading-tight text-primary">Specific question</div>
          <p className="font-body text-[2vw] leading-snug text-text">A focused question goes straight to literature search across the connected scholarly providers.</p>
        </div>
        <div className="grid grid-cols-[22vw_1fr] gap-[2.4vw] border-t border-[#d3dacd] pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.2vw] leading-tight text-primary">Follow-ups</div>
          <p className="font-body text-[2vw] leading-snug text-text">Later questions keep the conversation context and can reuse papers already found when you ask for it.</p>
        </div>
        <div className="grid grid-cols-[22vw_1fr] gap-[2.4vw] border-t border-[#d3dacd] pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.2vw] leading-tight text-primary">Readable progress</div>
          <p className="font-body text-[2vw] leading-snug text-text">Status updates show each stage; answers arrive in plain academic language, though not always instantly.</p>
        </div>
      </div>
      </div>

    </div>
  );
}
