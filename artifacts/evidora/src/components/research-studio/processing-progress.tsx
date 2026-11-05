import { Check, LoaderCircle } from "lucide-react";

export const researchStages = [
  { id: "planning", agent: "Research Planning Agent", task: "Understanding your question", short: "Plan" },
  { id: "searching", agent: "Literature Survey Agent", task: "Searching scholarly catalogues", short: "Survey" },
  { id: "indexing", agent: "Knowledge Index Agent", task: "Indexing and ranking paper records", short: "Index" },
  { id: "selecting", agent: "Paper Selection Agent", task: "Selecting relevant research", short: "Select" },
  { id: "reading", agent: "Evidence Analysis Agent", task: "Reading available paper evidence", short: "Analyse" },
  { id: "writing", agent: "Research Synthesis Agent", task: "Drafting an evidence-based answer", short: "Synthesise" },
  { id: "checking", agent: "Citation Review Agent", task: "Checking claims against their sources", short: "Verify" },
];

export function processingLabel(stage?: string) {
  const current = researchStages.find(step => step.id === stage);
  return current ? `${current.agent} · ${current.task}` : "Research Coordinator Agent · Preparing your research";
}

export function ProcessingProgress({ stage, queued, reusedSources }: { stage?: string; queued: boolean; reusedSources: boolean }) {
  // Same-papers follow-ups bypass discovery; don't show those agents as completed.
  const steps = reusedSources
    ? researchStages.filter(step => !["searching", "indexing", "selecting"].includes(step.id))
    : researchStages;
  const index = queued ? -1 : steps.findIndex(step => step.id === stage);
  const current = steps[index];
  const status = queued ? "Waiting for a research worker" : current?.task ?? "Preparing your research";
  return <div className="ev-processing" data-testid="research-agent-progress">
    <div className="ev-processing-heading">
      <div><p className="ev-micro">Live research workflow</p>
        <strong>{current?.agent ?? "Research Coordinator Agent"}</strong>
        <p className="ev-processing-task" role="status" aria-live="polite" aria-atomic="true">{status}</p>
      </div>
      <span className="ev-processing-count">{index < 0 ? queued ? "Queued" : "Preparing" : `Stage ${index + 1} / ${steps.length}`}</span>
    </div>
    <div className="ev-processing-track" role="progressbar" aria-label="Research workflow progress"
      aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={index < 0 ? undefined : index}
      aria-valuetext={index < 0 ? status : `Stage ${index + 1} of ${steps.length}: ${current.agent}. ${status}`}>
      {steps.map((step, i) => <span key={step.id} className={i < index ? "is-passed" : i === index ? "is-active" : ""}/>)}
    </div>
    <ol className="ev-agent-steps" aria-label="Research workflow roles">
      {steps.map((step, i) => <li key={step.id} className={i === index ? "is-active" : i < index ? "is-passed" : ""} aria-current={i === index ? "step" : undefined}>
        <span className="ev-agent-marker" aria-hidden="true">{i === index ? <LoaderCircle/> : i < index ? <Check/> : String(i + 1).padStart(2, "0")}</span>
        <div><strong>{step.agent}</strong><span>{i === index ? step.task : i < index ? "Earlier workflow stage" : "Upcoming stage"}</span></div>
      </li>)}
    </ol>
    <p className="ev-processing-note">{reusedSources ? "Reusing the conversation’s selected papers. " : "Papers appear on the right as discovery finishes. "}Stage progress follows the research workflow, not an estimated timer.</p>
  </div>;
}
