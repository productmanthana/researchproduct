export default function GeneralAssistantsComparison() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <div className="absolute top-0 left-0 w-[6vw] h-[1vh] bg-primary"></div>
      <div className="absolute left-[6vw] right-[6vw] top-[7vh]">
      <div className="flex items-center gap-[1.2vw]">
        <span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] bg-accent text-[#fcfbf7]">FAIR COMPARISON</span>
        <span className="font-body text-[1.5vw] text-muted">Evidora research briefing · 04 / 14</span>
      </div>
      <h1 className="font-display font-semibold text-[3.6vw] leading-[1.08] tracking-tight text-text mt-[1.6vh] max-w-[88vw]" style={{textWrap:"balance"}}>ChatGPT and Claude: research limitations</h1>
      </div>
      <div className="absolute left-[6vw] top-[30vh] w-[41vw] bottom-[11vh] flex flex-col gap-[2.2vh]">
        <div className="flex items-center gap-[1vw] border-b border-[#d3dacd] pb-[1.2vh]"><span className="font-display font-semibold text-[2.4vw] text-text">General assistants</span></div>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Real strengths.</span> <span className="text-text/80">Excellent for brainstorming, explaining concepts, outlining and polishing writing.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Fluency is not proof.</span> <span className="text-text/80">A well-written citation still needs a retrieved source that actually supports the claim.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Depends on setup.</span> <span className="text-text/80">Recency, paywalled content and citation accuracy vary with web tools, permissions and context provided.</span></p>
      </div>
      <div className="absolute right-[0] top-[26vh] w-[47vw] bottom-[0] bg-primary px-[3vw] pt-[4vh] pb-[11vh] flex flex-col gap-[2.2vh] text-[#fcfbf7] [&_.text-text]:text-[#fcfbf7] [&_.text-primary]:text-[#d9e4cf] [&_.text-text\/80]:text-[#fcfbf7]/85">
        <div className="flex items-center gap-[1vw] border-b border-[#fcfbf7]/30 pb-[1.2vh]"><span className="font-display font-semibold text-[2.4vw]">Evidora’s difference</span></div>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Research-specific workflow.</span> <span className="text-text/80">Clarify, search scholarly catalogues, select papers, then synthesise.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Traceable claims.</span> <span className="text-text/80">Each statement links to the retrieved record and passage it relies on.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Same model family.</span> <span className="text-text/80">Evidora itself uses OpenAI models; the gain is the evidence workflow, not a better chatbot.</span></p>
      </div>

      <p className="absolute left-[6vw] right-[53vw] bottom-[4vh] font-body text-[1.5vw] text-muted leading-snug">No benchmark or accuracy comparison is claimed. ChatGPT and Claude can browse and cite when tools are enabled.</p>
    </div>
  );
}
