export default function ResearchGaps() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <div className="absolute left-[6vw] top-[7vh] w-[54vw]">
      <div className="flex items-center gap-[1.2vw]">
        <span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.6vh] rounded-[0.4vw] border-2 border-[#b07a4a] text-[#8a5a32]">Proposed dedicated workflow</span>
        <span className="font-body text-[1.5vw] text-muted">Evidora research briefing</span>
      </div>
      <h1 className="font-display font-semibold text-[4.2vw] leading-[1.05] tracking-tight text-text mt-[2vh]" style={{textWrap:"balance"}}>Find gaps from a two-page idea</h1>
      <div className="mt-[3vh] flex flex-col gap-[1.6vh]">
        <div className="grid grid-cols-[3.6vw_1fr] gap-[1.2vw] border-t border-[#dce1d5] pt-[1.2vh]">
          <div className="font-display text-[2.4vw] leading-none text-primary">1</div>
          <p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold">Upload a 1–2 page proposal.</span> <span className="text-muted">Aims, methods, population, contribution.</span></p>
        </div>
        <div className="grid grid-cols-[3.6vw_1fr] gap-[1.2vw] border-t border-[#dce1d5] pt-[1.2vh]">
          <div className="font-display text-[2.4vw] leading-none text-primary">2</div>
          <p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold">Map closest prior studies.</span> <span className="text-muted">Cited similarities and differences.</span></p>
        </div>
        <div className="grid grid-cols-[3.6vw_1fr] gap-[1.2vw] border-t border-[#dce1d5] pt-[1.2vh]">
          <div className="font-display text-[2.4vw] leading-none text-primary">3</div>
          <p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold">Suggest open questions.</span> <span className="text-muted">Testable gaps with uncertainty and evidence links.</span></p>
        </div>
        <div className="grid grid-cols-[3.6vw_1fr] gap-[1.2vw] border-t border-[#dce1d5] pt-[1.2vh]">
          <div className="font-display text-[2.4vw] leading-none text-primary">4</div>
          <p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold">Researcher validates.</span> <span className="text-muted">You judge novelty, ethics and feasibility.</span></p>
        </div>
      </div>
      </div>
      <div className="absolute right-[6vw] top-[30vh] w-[26vw] bg-[#eef1e8] rounded-[0.6vw] px-[2vw] py-[3vh]">
        <div className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] text-primary">Available now</div>
        <p className="font-body text-[2vw] leading-snug mt-[1.2vh]">Private-PDF upload, evidence analysis and manual topic research.</p>
        <div className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] text-[#8a5a32] mt-[3vh]">Not yet built</div>
        <p className="font-body text-[2vw] leading-snug mt-[1.2vh]">Automated gap report and novelty check. Novelty is never guaranteed.</p>
      </div>
    </div>
  );
}
