export default function KnowledgeBase() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <div className="absolute top-0 left-0 w-[6vw] h-[1vh] bg-primary"></div>
      <div className="absolute left-[6vw] right-[6vw] top-[7vh]">
      <div className="flex items-center gap-[1.2vw]">
        <span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] bg-accent text-[#fcfbf7]">PARTIAL</span>
        <span className="font-body text-[1.5vw] text-muted">Evidora research briefing · 06 / 14</span>
      </div>
      <h1 className="font-display font-semibold text-[3.6vw] leading-[1.08] tracking-tight text-text mt-[1.6vh] max-w-[88vw]" style={{textWrap:"balance"}}>Build a private document knowledge base</h1>
      </div>
      <div className="absolute left-[6vw] top-[30vh] w-[40vw] bottom-[11vh] bg-[#e4ebe3] rounded-[0.6vw] px-[2.4vw] py-[3vh] flex flex-col gap-[2.2vh]">
        <div className="flex items-center gap-[1vw]"><span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] bg-primary text-[#fcfbf7]">CURRENT</span><span className="font-display font-semibold text-[2.4vw] text-text">Library today</span></div>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Private PDF upload.</span> <span className="text-text/80">Add your own PDFs to a personal library only you can access.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Selectable for analysis.</span> <span className="text-text/80">Choose which uploaded PDFs a Research run should read; text is extracted from PDFs.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Saved for later.</span> <span className="text-text/80">Saved papers and past analyses remain available to revisit.</span></p>
      </div>
      <div className="absolute right-[6vw] top-[30vh] w-[42vw] bottom-[11vh] px-[1vw] py-[3vh] flex flex-col gap-[2.2vh] border-l-[0.3vw] border-primary pl-[2.4vw]">
        <div className="flex items-center gap-[1vw]"><span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] border-2 border-primary text-primary">PROPOSED</span><span className="font-display font-semibold text-[2.4vw] text-text">Full knowledge base</span></div>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Project organisation.</span> <span className="text-text/80">Group documents by project and link them to papers found in search.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Automatic indexing.</span> <span className="text-text/80">Every upload indexed once and kept ready for questions.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Wider file types.</span> <span className="text-text/80">DOCX and scanned-image OCR would need to be built and verified.</span></p>
      </div>

    </div>
  );
}
