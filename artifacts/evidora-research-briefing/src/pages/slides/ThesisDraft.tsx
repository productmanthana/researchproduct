export default function ThesisDraft() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <div className="absolute top-0 left-0 w-[6vw] h-[1vh] bg-primary"></div>
      <div className="absolute left-[6vw] right-[6vw] top-[7vh]">
      <div className="flex items-center gap-[1.2vw]">
        <span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] bg-accent text-[#fcfbf7]">PARTIAL</span>
        <span className="font-body text-[1.5vw] text-muted">Evidora research briefing · 12 / 14</span>
      </div>
      <h1 className="font-display font-semibold text-[3.6vw] leading-[1.08] tracking-tight text-text mt-[1.6vh] max-w-[88vw]" style={{textWrap:"balance"}}>Prepare a structured thesis draft</h1>
      </div>
      <div className="absolute left-[6vw] top-[30vh] w-[40vw] bottom-[11vh] bg-[#e4ebe3] rounded-[0.6vw] px-[2.4vw] py-[3vh] flex flex-col gap-[2.2vh]">
        <div className="flex items-center gap-[1vw]"><span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] bg-primary text-[#fcfbf7]">CURRENT</span><span className="font-display font-semibold text-[2.4vw] text-text">Working draft today</span></div>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Editable draft.</span> <span className="text-text/80">Research output can become a working draft you edit manually.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Literature foundation.</span> <span className="text-text/80">Survey sections can seed a literature review chapter.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">No one-click thesis.</span> <span className="text-text/80">Full thesis generation does not exist.</span></p>
      </div>
      <div className="absolute right-[6vw] top-[30vh] w-[42vw] bottom-[11vh] px-[1vw] py-[3vh] flex flex-col gap-[2.2vh] border-l-[0.3vw] border-primary pl-[2.4vw]">
        <div className="flex items-center gap-[1vw]"><span className="font-body font-semibold text-[1.5vw] uppercase tracking-[0.1em] px-[1.2vw] py-[0.5vh] rounded-[0.4vw] border-2 border-primary text-primary">PROPOSED</span><span className="font-display font-semibold text-[2.4vw] text-text">Thesis workflow</span></div>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">University structure.</span> <span className="text-text/80">Chapters, front matter and reference style per institution.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">No invented results.</span> <span className="text-text/80">You supply real methods, data, results and ethics approvals.</span></p>
<p className="font-body text-[2vw] leading-snug text-text"><span className="font-semibold text-primary">Supervisor sign-off.</span> <span className="text-text/80">Final approval stays with your supervisor; no plagiarism-free promise.</span></p>
      </div>

    </div>
  );
}
