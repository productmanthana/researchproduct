export default function LiteratureSurvey() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <div className="absolute top-0 left-0 w-[6vw] h-[1vh] bg-primary"></div>
      <div className="absolute left-[6vw] right-[6vw] top-[7vh]">
      <div className="flex items-center gap-[1.2vw]">
        <span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] bg-primary text-[#fcfbf7]">CURRENT</span>
        <span className="font-body text-[1.5vw] text-muted">Evidora research briefing · 03 / 14</span>
      </div>
      <h1 className="font-display font-semibold text-[3.6vw] leading-[1.08] tracking-tight text-text mt-[1.6vh] max-w-[88vw]" style={{textWrap:"balance"}}>Generate an evidence-backed literature survey</h1>
      <div className="mt-[4.5vh] grid grid-cols-2 gap-x-[4vw] gap-y-[4vh]">
        <div className="border-t-[0.4vh] border-accent pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.4vw] leading-tight text-primary">Selects relevant papers</div>
          <p className="font-body text-[2vw] leading-snug text-text mt-[1vh]">Research reviews a bounded set of roughly 10–50 selected papers matched to your question.</p>
        </div>
        <div className="border-t-[0.4vh] border-accent pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.4vw] leading-tight text-primary">Compares the studies</div>
          <p className="font-body text-[2vw] leading-snug text-text mt-[1vh]">Methods, settings, samples and results are set side by side rather than summarised one by one.</p>
        </div>
        <div className="border-t-[0.4vh] border-accent pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.4vw] leading-tight text-primary">Academic structure</div>
          <p className="font-body text-[2vw] leading-snug text-text mt-[1vh]">Output is organised into survey sections with numbered references you can check.</p>
        </div>
        <div className="border-t-[0.4vh] border-accent pt-[1.6vh]">
          <div className="font-display font-semibold text-[2.4vw] leading-tight text-primary">Honest about evidence</div>
          <p className="font-body text-[2vw] leading-snug text-text mt-[1vh]">Abstract-only and full-text sources are distinguished, and scientific limitations are stated. A selected review, not a certified systematic review.</p>
        </div>
      </div>
      </div>

    </div>
  );
}
