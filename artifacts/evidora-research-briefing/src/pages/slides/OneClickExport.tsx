export default function OneClickExport() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <div className="absolute top-0 left-0 w-[6vw] h-[1vh] bg-primary"></div>
      <div className="absolute left-[6vw] right-[6vw] top-[7vh]">
      <div className="flex items-center gap-[1.2vw]">
        <span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] bg-accent text-[#fcfbf7]">PARTIAL</span>
        <span className="font-body text-[1.5vw] text-muted">Evidora research briefing · 13 / 14</span>
      </div>
      <h1 className="font-display font-semibold text-[3.6vw] leading-[1.08] tracking-tight text-text mt-[1.6vh] max-w-[88vw]" style={{textWrap:"balance"}}>Export journal and thesis documents in one action</h1>
      </div>
      <div className="absolute left-[6vw] top-[30vh] w-[40vw] bottom-[11vh] bg-[#e4ebe3] rounded-[0.6vw] px-[2.4vw] py-[3vh] flex flex-col gap-[2.2vh]">
        <div className="flex items-center gap-[1vw]"><span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] bg-primary text-[#fcfbf7]">CURRENT</span><span className="font-display font-semibold text-[2.4vw] text-text">Exports today</span></div>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Research exports.</span> <span className="text-text/80">Download research results as Markdown or DOCX.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Working draft.</span> <span className="text-text/80">Export the editable draft as Markdown.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Basic layout.</span> <span className="text-text/80">No journal-specific template applied.</span></p>
      </div>
      <div className="absolute right-[6vw] top-[30vh] w-[42vw] bottom-[11vh] px-[1vw] py-[3vh] flex flex-col gap-[2.2vh] border-l-[0.3vw] border-primary pl-[2.4vw]">
        <div className="flex items-center gap-[1vw]"><span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] border-2 border-primary text-primary">PROPOSED</span><span className="font-display font-semibold text-[2.4vw] text-text">One-action export</span></div>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Pick type and template.</span> <span className="text-text/80">Journal article or thesis, using a validated template.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Structure preserved.</span> <span className="text-text/80">Citations, headings, figure and table numbering kept intact.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Editable files.</span> <span className="text-text/80">Word, LaTeX and PDF as future targets; you check files before submitting.</span></p>
      </div>

    </div>
  );
}
