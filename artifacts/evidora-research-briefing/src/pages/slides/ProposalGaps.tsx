export default function ProposalGaps() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <div className="absolute top-0 left-0 w-[6vw] h-[1vh] bg-primary"></div>
      <div className="absolute left-[6vw] right-[6vw] top-[7vh]">
      <div className="flex items-center gap-[1.2vw]">
        <span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] bg-accent text-[#fcfbf7]">PARTIAL · gap report proposed</span>
        <span className="font-body text-[1.5vw] text-muted">Evidora research briefing · 08 / 14</span>
      </div>
      <h1 className="font-display font-semibold text-[3.6vw] leading-[1.08] tracking-tight text-text mt-[1.6vh] max-w-[88vw]" style={{textWrap:"balance"}}>Find possible research gaps from a short proposal</h1>
      <div className="mt-[4.5vh] grid grid-cols-2 gap-x-[4vw] gap-y-[4vh]">
        <div className="border-t-[0.4vh] border-accent pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.4vw] leading-tight text-primary">Upload a short proposal</div>
          <p className="font-body text-[2vw] leading-snug text-text mt-[1vh]">A 1–2 page outline of objectives and methods. PDF upload and topic research already exist.</p>
        </div>
        <div className="border-t-[0.4vh] border-accent pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.4vw] leading-tight text-primary">Retrieve closest studies</div>
          <p className="font-body text-[2vw] leading-snug text-text mt-[1vh]">Search for the prior work most similar to your aims, settings and methods.</p>
        </div>
        <div className="border-t-[0.4vh] border-accent pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.4vw] leading-tight text-primary">Map studied vs unresolved</div>
          <p className="font-body text-[2vw] leading-snug text-text mt-[1vh]">A proposed dedicated report would list what is covered and what remains open, with citations.</p>
        </div>
        <div className="border-t-[0.4vh] border-accent pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.4vw] leading-tight text-primary">Human confirms novelty</div>
          <p className="font-body text-[2vw] leading-snug text-text mt-[1vh]">You and your supervisor judge novelty, feasibility and ethics. Global novelty is never guaranteed.</p>
        </div>
      </div>
      </div>

    </div>
  );
}
