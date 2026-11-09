import "./_group.css";
import "./_agent-progress.css";
import { useState } from "react";
import { Minimize2 } from "lucide-react";
import { buildWorkflowView, researchWorkflow, studioWorkflow, reviewWorkflow, uploadWorkflow, originalityWorkflow, watchWorkflow, type WorkflowInput } from "./_agent-workflow";
import { WorkflowPanel } from "./_workflow-panel";

// Fixtures only: shape mirrors real server stage values. Popup JSX/CSS copied from evidora agent-progress.
const FIX: { label: string; input: WorkflowInput; observed: string[]; preview?: string }[] = [
  { label: "Literature · writing", input: studioWorkflow({ id: "s1", kind: "literature", status: "running", title: "Explainable control policies for small wind turbines", metadata: { stage: "Writing Agent · drafting with retrieved evidence" } }), observed: ["survey", "evidence", "write"], preview: "Interpretability in turbine pitch control has been approached from two directions [1]. Rule-extraction studies report..." },
  { label: "Research · reused", input: researchWorkflow({ id: "a1", status: "running", stage: "writing", question: "Does mulching reduce soil temperature variance in semi-arid plots?", reusedSources: true }), observed: ["plan", "evidence"] },
  { label: "Queued", input: studioWorkflow({ id: "s2", kind: "thesis", status: "queued", title: "Chapter 2: Groundwater recharge in hard-rock aquifers", metadata: { stage: "Queued" } }), observed: [] },
  { label: "Unknown stage", input: researchWorkflow({ id: "a2", status: "running", stage: "", question: "Microplastic uptake in freshwater mussels", reusedSources: false }), observed: [] },
  { label: "Review · checks", input: reviewWorkflow({ id: "r1", status: "running", title: "Review", metadata: { stage: "Scientific Review Agent · checking proposed changes", originalName: "methods-draft-v3.pdf" } }), observed: ["read", "propose"] },
  { label: "Upload", ...(() => { const u = uploadWorkflow("put", "field-notes-2024.pdf"); return { input: u.input, observed: u.observed }; })() },
  { label: "Originality", input: originalityWorkflow("o1", "Synopsis: Urban heat islands in tier-2 cities"), observed: [] },
  { label: "Watch", input: watchWorkflow({ projectId: "p1", status: "running", patents: false, topic: "Biochar amendments and nitrous oxide emissions" }), observed: [] },
];

export function AgentProgress() {
  const [i, setI] = useState(0);
  const f = FIX[i];
  const view = buildWorkflowView(f.input, f.observed);
  return (
    <div className="rap-root grid-paper">
      <div className="rap-picker">{FIX.map((x, n) => <button key={x.label} aria-pressed={n === i} onClick={() => setI(n)}>{x.label}</button>)}</div>
      <div className="ap-overlay" />
      <div className="rap-modal-static" role="dialog" aria-modal="true">
        {i === 0 && <div className="ap-switch" role="tablist"><button role="tab" aria-selected><span>Literature synthesis</span><small>Explainable control policies</small></button><button role="tab" aria-selected={false}><span>Research chat</span><small>Mulching and soil temperature</small></button></div>}
        <WorkflowPanel key={i} view={view} preview={f.preview} connection={f.preview ? "Live" : undefined} />
        <div className="ap-actions"><p>Closing keeps the work running. Reopen it from the page or the progress button.</p><button className="ap-btn"><Minimize2 />Keep working in background</button></div>
      </div>
    </div>
  );
}
