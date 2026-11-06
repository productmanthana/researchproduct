export default function SearchCatalogue() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <div className="absolute inset-y-0 right-0 w-[36vw] bg-primary text-[#fcfbf7] px-[3.5vw] py-[8vh] flex flex-col justify-center">
        <div className="font-body text-[1.5vw] uppercase tracking-[0.1em] opacity-80">OpenAlex core catalogue</div>
        <div className="font-display font-semibold text-[11vw] leading-none mt-[1vh]">320M+</div>
        <p className="font-body text-[2vw] leading-snug mt-[2vh]">scholarly works indexed: articles, preprints, books and datasets.</p>
        <p className="font-body text-[1.5vw] leading-snug mt-[3vh] opacity-85">Catalogue coverage, not 320M PDFs stored or analysed in Evidora.</p>
        <p className="font-body text-[1.5vw] mt-[2vh] opacity-85">Source: <a href="https://help.openalex.org/data/works/corpus/" target="_blank" rel="noopener noreferrer" className="underline text-[#fcfbf7]">OpenAlex works corpus</a>, accessed 23 Oct 2026</p>
      </div>
      <div className="absolute left-[6vw] top-[7vh] w-[52vw]">
      <div className="flex items-center gap-[1.2vw]">
        <span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.6vh] rounded-[0.4vw] bg-primary text-[#fcfbf7]">Available now</span>
        <span className="font-body text-[1.5vw] text-muted">Evidora research briefing</span>
      </div>
      <h1 className="font-display font-semibold text-[4.2vw] leading-[1.05] tracking-tight text-text mt-[2vh]" style={{textWrap:"balance"}}>Search 320M+ scholarly works</h1>
      <div className="mt-[3vh] flex flex-col gap-[1.6vh]">
        <div className="grid grid-cols-[3.6vw_1fr] gap-[1.2vw] border-t border-[#dce1d5] pt-[1.2vh]">
          <div className="font-display text-[2.4vw] leading-none text-primary">1</div>
          <p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold">Ask in natural language.</span> <span className="text-muted">Vague topics get a clarifying question first.</span></p>
        </div>
        <div className="grid grid-cols-[3.6vw_1fr] gap-[1.2vw] border-t border-[#dce1d5] pt-[1.2vh]">
          <div className="font-display text-[2.4vw] leading-none text-primary">2</div>
          <p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold">Live catalogue search.</span> <span className="text-muted">OpenAlex, Crossref, arXiv and more, deduplicated.</span></p>
        </div>
        <div className="grid grid-cols-[3.6vw_1fr] gap-[1.2vw] border-t border-[#dce1d5] pt-[1.2vh]">
          <div className="font-display text-[2.4vw] leading-none text-primary">3</div>
          <p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold">Citation-checked synthesis.</span> <span className="text-muted">Uses accessible full text; abstract-only sources are labelled.</span></p>
        </div>
        <div className="grid grid-cols-[3.6vw_1fr] gap-[1.2vw] border-t border-[#dce1d5] pt-[1.2vh]">
          <div className="font-display text-[2.4vw] leading-none text-primary">4</div>
          <p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold">Evidence and limits shown.</span> <span className="text-muted">Claims link to sources; not every paper is read.</span></p>
        </div>
      </div>
      </div>
    </div>
  );
}
