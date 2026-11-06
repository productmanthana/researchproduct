export default function OriginalityReview() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <div className="absolute left-[6vw] right-[6vw] top-[7vh]">
      <div className="flex items-center gap-[1.2vw]">
        <span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.6vh] rounded-[0.4vw] border-2 border-[#b07a4a] text-[#8a5a32]">Proposed · not yet in Evidora</span>
        <span className="font-body text-[1.5vw] text-muted">Evidora research briefing</span>
      </div>
      <h1 className="font-display font-semibold text-[4.2vw] leading-[1.05] tracking-tight text-text mt-[2vh]" style={{textWrap:"balance"}}>Originality review before submission</h1>
      </div>
      <div className="absolute left-[6vw] right-[6vw] top-[31vh] grid grid-cols-3 gap-[3vw]">
        <div className="border-t-4 border-primary pt-[2vh]">
          <div className="font-body text-[1.5vw] uppercase tracking-[0.1em] text-muted">Check</div>
          <div className="font-display font-semibold text-[2.8vw] leading-tight mt-[1vh]">Similarity</div>
          <p className="font-body text-[2vw] leading-snug mt-[1.6vh]">Flags overlap and missing attribution against a licensed corpus, with sources side by side.</p>
        </div>
        <div className="border-t-4 border-accent pt-[2vh]">
          <div className="font-body text-[1.5vw] uppercase tracking-[0.1em] text-muted">Signal</div>
          <div className="font-display font-semibold text-[2.8vw] leading-tight mt-[1vh]">AI-writing</div>
          <p className="font-body text-[2vw] leading-snug mt-[1.6vh]">A separate, uncertain indicator. Never a plagiarism verdict.</p>
        </div>
        <div className="border-t-4 border-[#b07a4a] pt-[2vh]">
          <div className="font-body text-[1.5vw] uppercase tracking-[0.1em] text-muted">Decision</div>
          <div className="font-display font-semibold text-[2.8vw] leading-tight mt-[1vh]">Human review</div>
          <p className="font-body text-[2vw] leading-snug mt-[1.6vh]">Supervisors judge quotes, paraphrase and disclosures, then export a fix list.</p>
        </div>
      </div>
      <div className="absolute left-[6vw] right-[6vw] bottom-[8vh] border-t border-[#dce1d5] pt-[2vh] flex justify-between items-end gap-[3vw]">
        <p className="font-display text-[2.4vw] leading-snug text-text">No scores promised: false positives happen.</p>
        <p className="font-body text-[1.5vw] text-muted shrink-0">Source: <a href="https://guides.turnitin.com/hc/en-us/articles/22774058814093-Using-the-AI-Writing-Report" target="_blank" rel="noopener noreferrer" className="underline text-primary">Turnitin AI Writing Report guide</a></p>
      </div>
    </div>
  );
}
