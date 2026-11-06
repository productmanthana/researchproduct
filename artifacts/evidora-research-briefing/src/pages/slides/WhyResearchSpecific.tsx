export default function WhyResearchSpecific() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <div className="absolute left-[6vw] right-[6vw] top-[7vh]">
      <div className="flex items-center gap-[1.2vw]">
        <span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.6vh] rounded-[0.4vw] bg-primary text-[#fcfbf7]">Available now</span>
        <span className="font-body text-[1.5vw] text-muted">Evidora research briefing</span>
      </div>
      <h1 className="font-display font-semibold text-[4.2vw] leading-[1.05] tracking-tight text-text mt-[2vh]" style={{textWrap:"balance"}}>Why a research-specific assistant?</h1>
      </div>
      <div className="absolute left-[6vw] right-[6vw] top-[30vh] grid grid-cols-[5fr_7fr] gap-[2.4vw]">
        <div className="pr-[2vw]">
          <div className="font-display text-[2.6vw] text-muted">General chat assistants</div>
          <p className="font-body text-[2vw] leading-snug mt-[2vh]">Useful for brainstorming and summarising text you provide.</p>
          <p className="font-body text-[2vw] leading-snug mt-[2vh]">Without connected scholarly evidence, a fluent answer is not proof.</p>
          <p className="font-body text-[2vw] leading-snug mt-[2vh]">Any citation it offers still needs checking by the researcher.</p>
        </div>
        <div className="bg-[#eef1e8] rounded-[0.6vw] px-[2.4vw] py-[3vh]">
          <div className="font-display text-[2.6vw] text-primary">Evidora</div>
          <p className="font-body text-[2vw] leading-snug mt-[2vh]"><span className="font-semibold">Searches real indexes</span> after clarifying the question.</p>
          <p className="font-body text-[2vw] leading-snug mt-[1.6vh]"><span className="font-semibold">Ties claims to retrieved records</span>, with page or quote when accessible.</p>
          <p className="font-body text-[2vw] leading-snug mt-[1.6vh]"><span className="font-semibold">Labels abstract-only and paywalled</span> sources and shows limitations.</p>
          <p className="font-body text-[1.5vw] leading-snug mt-[2.4vh] text-muted">Publisher labels on records do not mean endorsement by, or licensed access to, IEEE, Springer Nature or Elsevier.</p>
        </div>
      </div>
      <p className="absolute left-[6vw] bottom-[5vh] font-body text-[1.5vw] text-muted">Authors stay accountable for AI-assisted work: <a href="https://publicationethics.org/guidance/cope-position/authorship-and-ai-tools" target="_blank" rel="noopener noreferrer" className="underline text-primary">COPE position on authorship and AI tools</a></p>
    </div>
  );
}
