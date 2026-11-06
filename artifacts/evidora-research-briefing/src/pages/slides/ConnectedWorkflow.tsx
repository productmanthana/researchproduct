export default function ConnectedWorkflow() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <div className="absolute top-0 left-0 w-[6vw] h-[1vh] bg-primary"></div>
      <div className="absolute left-[6vw] right-[6vw] top-[7vh]">
      <div className="flex items-center gap-[1.2vw]">
        <span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] bg-accent text-[#fcfbf7]">SUMMARY</span>
        <span className="font-body text-[1.5vw] text-muted">Evidora research briefing · 14 / 14</span>
      </div>
      <h1 className="font-display font-semibold text-[3.6vw] leading-[1.08] tracking-tight text-text mt-[1.6vh] max-w-[88vw]" style={{textWrap:"balance"}}>A connected research-to-publication workflow</h1>
      </div>
      <div className="absolute left-[6vw] top-[30vh] w-[41vw] bottom-[11vh] flex flex-col gap-[2.2vh]">
        <div className="flex items-center gap-[1vw] border-b border-[#d3dacd] pb-[1.2vh]"><span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] bg-primary text-[#fcfbf7]">CURRENT</span> <span className="font-display font-semibold text-[2.4vw] text-text">Available now</span></div>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Search and clarify.</span> <span className="text-text/80">Catalogue search with clarifying questions.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Source-linked answers.</span> <span className="text-text/80">Claims traced to retrieved evidence.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Private PDFs and drafts.</span> <span className="text-text/80">PDF analysis, editable draft, Markdown and DOCX export.</span></p>
      </div>
      <div className="absolute right-[0] top-[26vh] w-[47vw] bottom-[0] bg-primary px-[3vw] pt-[4vh] pb-[11vh] flex flex-col gap-[2.2vh] text-[#fcfbf7] [&_.text-text]:text-[#fcfbf7] [&_.text-primary]:text-[#d9e4cf] [&_.text-text\/80]:text-[#fcfbf7]/85">
        <div className="flex items-center gap-[1vw] border-b border-[#fcfbf7]/30 pb-[1.2vh]"><span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] border-2 border-primary text-primary">PROPOSED</span> <span className="font-display font-semibold text-[2.4vw]">Proposed next</span></div>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Knowledge base Copilot.</span> <span className="text-text/80">Unified chat over saved documents.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Gap reports and integrity.</span> <span className="text-text/80">Automated gaps, similarity and AI-signal review.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Format, thesis, export.</span> <span className="text-text/80">10+ journal profiles, thesis workflow, one-action export.</span></p>
      </div>

      <p className="absolute left-[6vw] right-[53vw] bottom-[4vh] font-body text-[1.5vw] text-muted leading-snug">Conversation → discovery → your documents → drafting → integrity, formatting and export. Start at any step; value is reviewable research and less tool switching.</p>
    </div>
  );
}
