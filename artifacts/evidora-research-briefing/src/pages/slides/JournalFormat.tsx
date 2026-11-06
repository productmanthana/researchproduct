export default function JournalFormat() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <div className="absolute top-0 left-0 w-[6vw] h-[1vh] bg-primary"></div>
      <div className="absolute left-[6vw] right-[6vw] top-[7vh]">
      <div className="flex items-center gap-[1.2vw]">
        <span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] border-2 border-primary text-primary">PROPOSED</span>
        <span className="font-body text-[1.5vw] text-muted">Evidora research briefing · 11 / 14</span>
      </div>
      <h1 className="font-display font-semibold text-[3.6vw] leading-[1.08] tracking-tight text-text mt-[1.6vh] max-w-[88vw]" style={{textWrap:"balance"}}>Apply the target journal’s format</h1>
      <div className="mt-[4.5vh] grid grid-cols-2 gap-x-[4vw] gap-y-[4vh]">
        <div className="border-t-[0.4vh] border-accent pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.4vw] leading-tight text-primary">10+ maintained profiles</div>
          <p className="font-body text-[2vw] leading-snug text-text mt-[1vh]">Formatting profiles for named journals, each tied to that journal’s current author instructions.</p>
        </div>
        <div className="border-t-[0.4vh] border-accent pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.4vw] leading-tight text-primary">What gets formatted</div>
          <p className="font-body text-[2vw] leading-snug text-text mt-[1vh]">Headings, abstract and word limits, citation style, figures and required declarations.</p>
        </div>
        <div className="border-t-[0.4vh] border-accent pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.4vw] leading-tight text-primary">Editable output</div>
          <p className="font-body text-[2vw] leading-snug text-text mt-[1vh]">A publication draft you can still edit, plus a compliance checklist. Acceptance is never guaranteed.</p>
        </div>
        <div className="border-t-[0.4vh] border-accent pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.4vw] leading-tight text-primary">Quartiles are not formats</div>
          <p className="font-body text-[2vw] leading-snug text-text mt-[1vh]">Q1/Q2/Q3 rank journals by field and year. IEEE, Springer or Elsevier would be targets, not partnerships.</p>
        </div>
      </div>
      </div>

      <p className="absolute left-[6vw] right-[6vw] bottom-[4vh] font-body text-[1.5vw] text-muted leading-snug">Sources: <a href="https://www.scimagolab.com/scimago-journal-quartiles-evaluation/" target="_blank" rel="noopener noreferrer" className="underline text-primary">SCImago quartiles</a> · <a href="https://www.springernature.com/gp/authors/campaigns/writing-a-manuscript/formatting" target="_blank" rel="noopener noreferrer" className="underline text-primary">Springer Nature formatting</a> · <a href="https://www.ieee.org/conferences/publishing/templates" target="_blank" rel="noopener noreferrer" className="underline text-primary">IEEE templates</a></p>
    </div>
  );
}
