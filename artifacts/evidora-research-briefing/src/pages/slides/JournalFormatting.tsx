export default function JournalFormatting() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <div className="absolute left-[6vw] right-[6vw] top-[7vh]">
      <div className="flex items-center gap-[1.2vw]">
        <span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.6vh] rounded-[0.4vw] border-2 border-[#b07a4a] text-[#8a5a32]">Proposed · design target</span>
        <span className="font-body text-[1.5vw] text-muted">Evidora research briefing</span>
      </div>
      <h1 className="font-display font-semibold text-[4.2vw] leading-[1.05] tracking-tight text-text mt-[2vh]" style={{textWrap:"balance"}}>Journal-ready formatting</h1>
      </div>
      <div className="absolute left-[6vw] right-[6vw] top-[29vh] grid grid-cols-2 gap-x-[4vw] gap-y-[4vh]">
        <div className="border-t-2 border-primary pt-[1.6vh]"><div className="font-body font-semibold text-[2vw]">Pick the actual target journal</div><p className="font-body text-[2vw] leading-snug text-muted mt-[0.8vh]">Formatting follows that journal's author instructions, not a ranking tier.</p></div>
        <div className="border-t-2 border-primary pt-[1.6vh]"><div className="font-body font-semibold text-[2vw]">Target: 10+ maintained profiles</div><p className="font-body text-[2vw] leading-snug text-muted mt-[0.8vh]">References, abstract length, headings, figures, tables and declarations.</p></div>
        <div className="border-t-2 border-primary pt-[1.6vh]"><div className="font-body font-semibold text-[2vw]">One action, editable output</div><p className="font-body text-[2vw] leading-snug text-muted mt-[0.8vh]">A Word or LaTeX draft plus a compliance checklist.</p></div>
        <div className="border-t-2 border-primary pt-[1.6vh]"><div className="font-body font-semibold text-[2vw]">Author confirms and submits</div><p className="font-body text-[2vw] leading-snug text-muted mt-[0.8vh]">Publisher policies change; no acceptance is implied or guaranteed.</p></div>
      </div>
      <div className="absolute left-[6vw] right-[6vw] bottom-[6vh] bg-primary text-[#fcfbf7] rounded-[0.6vw] px-[2.4vw] py-[2.4vh] flex items-center justify-between gap-[2vw]">
        <p className="font-display text-[2.2vw] leading-snug">Q1/Q2/Q3 rank journals by field and year. They are not manuscript templates.</p>
        <p className="font-body text-[1.5vw] leading-snug shrink-0 w-[24vw] opacity-90">Sources: <a href="https://www.scimagolab.com/scimago-journal-quartiles-evaluation/" target="_blank" rel="noopener noreferrer" className="underline text-[#fcfbf7]">SCImago quartiles</a> · <a href="https://www.springernature.com/gp/authors/campaigns/writing-a-manuscript/formatting" target="_blank" rel="noopener noreferrer" className="underline text-[#fcfbf7]">Springer Nature</a> · <a href="https://www.ieee.org/conferences/publishing/templates" target="_blank" rel="noopener noreferrer" className="underline text-[#fcfbf7]">IEEE templates</a></p>
      </div>
    </div>
  );
}
