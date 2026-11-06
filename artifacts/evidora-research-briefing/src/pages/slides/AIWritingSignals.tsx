export default function AIWritingSignals() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <div className="absolute top-0 left-0 w-[6vw] h-[1vh] bg-primary"></div>
      <div className="absolute left-[6vw] right-[6vw] top-[7vh]">
      <div className="flex items-center gap-[1.2vw]">
        <span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] border-2 border-primary text-primary">PROPOSED</span>
        <span className="font-body text-[1.5vw] text-muted">Evidora research briefing · 10 / 14</span>
      </div>
      <h1 className="font-display font-semibold text-[3.6vw] leading-[1.08] tracking-tight text-text mt-[1.6vh] max-w-[88vw]" style={{textWrap:"balance"}}>Review AI-writing signals responsibly</h1>
      </div>
      <div className="absolute left-[6vw] top-[30vh] w-[41vw] bottom-[11vh] flex flex-col gap-[2.2vh]">
        <div className="flex items-center gap-[1vw] border-b border-[#d3dacd] pb-[1.2vh]"><span className="font-display font-semibold text-[2.4vw] text-text">What a signal means</span></div>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Likelihood, not proof.</span> <span className="text-text/80">AI-writing scores are uncertain; false positives happen and do not establish authorship.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Separate from similarity.</span> <span className="text-text/80">Turnitin treats its AI-writing and Similarity reports as independent checks.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">No evasion promise.</span> <span className="text-text/80">Evidora will not offer a guaranteed 0% AI score.</span></p>
      </div>
      <div className="absolute right-[0] top-[26vh] w-[47vw] bottom-[0] bg-primary px-[3vw] pt-[4vh] pb-[11vh] flex flex-col gap-[2.2vh] text-[#fcfbf7] [&_.text-text]:text-[#fcfbf7] [&_.text-primary]:text-[#d9e4cf] [&_.text-text\/80]:text-[#fcfbf7]/85">
        <div className="flex items-center gap-[1vw] border-b border-[#fcfbf7]/30 pb-[1.2vh]"><span className="font-display font-semibold text-[2.4vw]">Responsible review</span></div>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Reviewer assessment.</span> <span className="text-text/80">A person weighs the signal alongside draft history.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Records and disclosure.</span> <span className="text-text/80">Keep drafts and declare AI assistance where required.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Follow the policy.</span> <span className="text-text/80">Journal and institution rules decide; humans stay responsible.</span></p>
      </div>

      <p className="absolute left-[6vw] right-[53vw] bottom-[4vh] font-body text-[1.5vw] text-muted leading-snug">Source: <a href="https://guides.turnitin.com/hc/en-us/articles/22774058814093-Using-the-AI-Writing-Report" target="_blank" rel="noopener noreferrer" className="underline text-primary">Turnitin, Using the AI Writing Report</a>.</p>
    </div>
  );
}
