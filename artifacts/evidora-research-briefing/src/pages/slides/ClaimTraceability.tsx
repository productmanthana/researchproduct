export default function ClaimTraceability() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <div className="absolute top-0 left-0 w-[6vw] h-[1vh] bg-primary"></div>
      <div className="absolute left-[6vw] right-[6vw] top-[7vh]">
      <div className="flex items-center gap-[1.2vw]">
        <span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] bg-primary text-[#fcfbf7]">CURRENT</span>
        <span className="font-body text-[1.5vw] text-muted">Evidora research briefing · 05 / 14</span>
      </div>
      <h1 className="font-display font-semibold text-[3.6vw] leading-[1.08] tracking-tight text-text mt-[1.6vh] max-w-[88vw]" style={{textWrap:"balance"}}>Trace every research claim to its evidence</h1>
      <div className="mt-[4vh] flex flex-col gap-[2.6vh]">
        <div className="grid grid-cols-[22vw_1fr] gap-[2.4vw] border-t border-[#d3dacd] pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.2vw] leading-tight text-primary">Source identity</div>
          <p className="font-body text-[2vw] leading-snug text-text">DOI, authors, journal and year are shown for each cited work so it can be located independently.</p>
        </div>
        <div className="grid grid-cols-[22vw_1fr] gap-[2.4vw] border-t border-[#d3dacd] pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.2vw] leading-tight text-primary">Exact support</div>
          <p className="font-body text-[2vw] leading-snug text-text">The supporting excerpt, and page where available, sits next to the claim; abstract-only sources and licence limits are labelled.</p>
        </div>
        <div className="grid grid-cols-[22vw_1fr] gap-[2.4vw] border-t border-[#d3dacd] pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.2vw] leading-tight text-primary">Citation checks</div>
          <p className="font-body text-[2vw] leading-snug text-text">Claims without retrieved support are omitted, which reduces but cannot guarantee errors. The scholar keeps final judgment.</p>
        </div>
        <div className="grid grid-cols-[22vw_1fr] gap-[2.4vw] border-t border-[#d3dacd] pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.2vw] leading-tight text-primary">Publisher records</div>
          <p className="font-body text-[2vw] leading-snug text-text">IEEE, Springer or Elsevier papers appear via public indexes, not licensed publisher integrations or partnerships.</p>
        </div>
      </div>
      </div>

      <p className="absolute left-[6vw] right-[6vw] bottom-[4vh] font-body text-[1.5vw] text-muted leading-snug">Responsibility for AI-assisted work stays with authors: <a href="https://publicationethics.org/guidance/cope-position/authorship-and-ai-tools" target="_blank" rel="noopener noreferrer" className="underline text-primary">COPE position on authorship and AI tools</a>.</p>
    </div>
  );
}
