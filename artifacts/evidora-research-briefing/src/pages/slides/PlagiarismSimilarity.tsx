export default function PlagiarismSimilarity() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <div className="absolute top-0 left-0 w-[6vw] h-[1vh] bg-primary"></div>
      <div className="absolute left-[6vw] right-[6vw] top-[7vh]">
      <div className="flex items-center gap-[1.2vw]">
        <span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] border-2 border-primary text-primary">PROPOSED · not implemented</span>
        <span className="font-body text-[1.5vw] text-muted">Evidora research briefing · 09 / 14</span>
      </div>
      <h1 className="font-display font-semibold text-[3.6vw] leading-[1.08] tracking-tight text-text mt-[1.6vh] max-w-[88vw]" style={{textWrap:"balance"}}>Check plagiarism and source similarity</h1>
      <div className="mt-[4vh] flex flex-col gap-[2.6vh]">
        <div className="grid grid-cols-[22vw_1fr] gap-[2.4vw] border-t border-[#d3dacd] pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.2vw] leading-tight text-primary">Compare against sources</div>
          <p className="font-body text-[2vw] leading-snug text-text">Match your draft against a licensed reference corpus to find overlap and missing attribution.</p>
        </div>
        <div className="grid grid-cols-[22vw_1fr] gap-[2.4vw] border-t border-[#d3dacd] pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.2vw] leading-tight text-primary">Review each match</div>
          <p className="font-body text-[2vw] leading-snug text-text">See matched passages beside their sources rather than relying on a single score.</p>
        </div>
        <div className="grid grid-cols-[22vw_1fr] gap-[2.4vw] border-t border-[#d3dacd] pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.2vw] leading-tight text-primary">Human judgment</div>
          <p className="font-body text-[2vw] leading-snug text-text">Quotations, paraphrases and permitted self-reuse are judged by you; similarity is not proof of plagiarism.</p>
        </div>
        <div className="grid grid-cols-[22vw_1fr] gap-[2.4vw] border-t border-[#d3dacd] pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.2vw] leading-tight text-primary">Pre-submission checklist</div>
          <p className="font-body text-[2vw] leading-snug text-text">Resolve flagged passages before thesis or journal submission. No Turnitin integration exists today.</p>
        </div>
      </div>
      </div>

    </div>
  );
}
