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
