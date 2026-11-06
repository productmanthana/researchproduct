export default function SearchCatalogue() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <div className="absolute top-0 left-0 w-[6vw] h-[1vh] bg-primary"></div>
      <div className="absolute inset-y-0 right-0 w-[34vw] bg-primary text-[#fcfbf7] px-[3.2vw] py-[8vh] flex flex-col justify-center">
        <div className="font-body text-[1.5vw] uppercase tracking-[0.1em] opacity-80">Scholarly catalogue coverage</div>
        <div className="font-display font-semibold text-[10vw] leading-none mt-[1vh]">320M+</div>
        <p className="font-body text-[2vw] leading-snug mt-[2vh]">scholarly works discoverable: articles, books, preprints and datasets.</p>
        <p className="font-body text-[1.5vw] leading-snug mt-[4vh] opacity-85"><a href="https://help.openalex.org/data/works/corpus/" target="_blank" rel="noopener noreferrer" className="underline text-[#fcfbf7]">Catalogue coverage documentation</a> · checked 6 Nov 2026</p>
      </div>
      <div className="absolute left-[6vw] top-[7vh] w-[52vw]">
      <div className="flex items-center gap-[1.2vw]">
        <span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] bg-primary text-[#fcfbf7]">CURRENT · availability varies</span>
        <span className="font-body text-[1.5vw] text-muted">Evidora research briefing · 01 / 14</span>
      </div>
      <h1 className="font-display font-semibold text-[3.6vw] leading-[1.08] tracking-tight text-text mt-[1.6vh] max-w-[52vw]" style={{textWrap:"balance"}}>Search 320M+ scholarly works</h1>
      <div className="mt-[3.5vh] flex flex-col gap-[2.2vh]">
        <div className="border-t border-[#d3dacd] pt-[1.2vh]"><p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Ask in your own words.</span> <span className="text-text/80">Describe a topic or question naturally; Evidora clarifies vague ideas before searching.</span></p></div>
        <div className="border-t border-[#d3dacd] pt-[1.2vh]"><p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Broad scholarly discovery.</span> <span className="text-text/80">Search across 320M+ scholarly works spanning disciplines, journals and publication types.</span></p></div>
        <div className="border-t border-[#d3dacd] pt-[1.2vh]"><p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Duplicates merged.</span> <span className="text-text/80">The same paper found in several places appears once, so results stay clean and countable.</span></p></div>
        <div className="border-t border-[#d3dacd] pt-[1.2vh]"><p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Relevant evidence you can inspect.</span> <span className="text-text/80">Only relevant papers are analysed, with full-text analysis where accessible and every citation open to checking.</span></p></div>
      </div>
      </div>

    </div>
  );
}
