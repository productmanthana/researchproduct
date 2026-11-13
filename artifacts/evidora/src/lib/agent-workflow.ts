/**
 * Pure mapping from server-reported job stages to a five-role workflow view.
 * No timers, no estimated percentages: a role is "active" only when the server reports its stage,
 * "done" only when it was observed earlier, otherwise "unreported", "skipped" or "pending".
 */
export type RoleIcon = "compass" | "search" | "book" | "pen" | "shield" | "chart" | "upload" | "file" | "database" | "bell" | "scan" | "list" | "lightbulb" | "save";
export type RoleDef = { id: string; name: string; task: string; icon: RoleIcon };
export type RoleState = "done" | "active" | "pending" | "skipped" | "unreported";
export type Phase = "queued" | "running" | "unknown";

export type WorkflowInput = {
  key: string;
  workflow: string;          // eyebrow, e.g. "Literature synthesis"
  title: string;             // what is being worked on
  roles: RoleDef[];          // up to eight, in pipeline order
  active: string | null;     // role id from a real stage value, null = indeterminate
  phase: Phase;
  skipped?: Record<string, string>;
  statusLine: string;
  note?: string;
  /** Start in the background (dock button only); the page shows its own inline progress. */
  quiet?: boolean;
};
export type WorkflowTile = { role: RoleDef; state: RoleState; detail: string; index: number };
export type WorkflowView = WorkflowInput & { tiles: WorkflowTile[]; activeIndex: number; indeterminate: boolean };

export const TONES = ["208 68% 34%", "8 70% 48%", "38 86% 44%", "158 45% 32%", "262 30% 46%", "338 42% 44%", "188 50% 34%"];

export const STATE_LABEL: Record<RoleState, string> = {
  done: "Completed", active: "In progress", pending: "Pending", skipped: "Skipped", unreported: "Not reported",
};

export function buildWorkflowView(input: WorkflowInput, observed: readonly string[] = []): WorkflowView {
  const roles = input.roles.slice(0, 8);
  const activeIndex = input.active ? roles.findIndex(r => r.id === input.active) : -1;
  const tiles = roles.map((role, index): WorkflowTile => {
    const skip = input.skipped?.[role.id];
    if (skip) return { role, index, state: "skipped", detail: skip };
    if (index === activeIndex) return { role, index, state: "active", detail: role.task };
    if (observed.includes(role.id) && (activeIndex < 0 || index < activeIndex)) return { role, index, state: "done", detail: "Reported earlier in this run" };
    if (activeIndex >= 0 && index < activeIndex) return { role, index, state: "unreported", detail: "Not reported for this run" };
    return { role, index, state: "pending", detail: "Waiting" };
  });
  return { ...input, roles, tiles, activeIndex, indeterminate: activeIndex < 0 };
}

/** Adds the current active role to the observed list (immutable). */
export function observe(prev: readonly string[], active: string | null): string[] {
  return active && !prev.includes(active) ? [...prev, active] : [...prev];
}

/* ---------------- Research analysis ---------------- */
const RESEARCH_MAP: Record<string, string> = {
  planning: "plan", searching: "survey", indexing: "survey", selecting: "survey", reading: "evidence", writing: "write", checking: "review",
};
const RESEARCH_TASK: Record<string, string> = {
  planning: "Understanding your question", searching: "Searching scholarly catalogues", indexing: "Indexing and ranking paper records",
  selecting: "Selecting relevant research", reading: "Reading available paper evidence", writing: "Drafting an evidence-based answer",
  checking: "Checking claims against their sources",
};
export function researchWorkflow(a: { id: string; status: string; stage?: string | null; question: string; reusedSources: boolean; workflow?: string }): WorkflowInput {
  const queued = a.status === "queued";
  const stage = a.stage ?? "";
  const active = queued ? null : RESEARCH_MAP[stage] ?? null;
  const roles: RoleDef[] = [
    { id: "plan", name: "Research Planning", task: RESEARCH_TASK.planning, icon: "compass" },
    { id: "survey", name: "Literature Survey", task: RESEARCH_TASK[stage] && RESEARCH_MAP[stage] === "survey" ? RESEARCH_TASK[stage] : "Searching, indexing and selecting papers", icon: "search" },
    { id: "evidence", name: "Evidence Analysis", task: RESEARCH_TASK.reading, icon: "book" },
    { id: "write", name: "Research Synthesis", task: RESEARCH_TASK.writing, icon: "pen" },
    { id: "review", name: "Citation Review", task: RESEARCH_TASK.checking, icon: "shield" },
  ];
  return {
    key: `analysis:${a.id}`, workflow: a.workflow ?? "Research answer", title: a.question, roles, active,
    phase: queued ? "queued" : active ? "running" : "unknown",
    skipped: a.reusedSources ? { survey: "Reusing the conversation's selected papers" } : undefined,
    statusLine: queued ? "Queued · waiting for a research worker" : active ? RESEARCH_TASK[stage] : "Preparing your research · stage not reported yet",
    note: a.reusedSources ? "This follow-up reuses earlier papers, so no new source search runs." : "Papers appear on the page as discovery finishes.",
  };
}

/* ---------------- Studio writing ---------------- */
const STUDIO_KIND: Record<string, { workflow: string; write: string; task: string; icon: RoleIcon }> = {
  ideas: { workflow: "Research ideation", write: "Ideation Writing", task: "Shaping five research directions", icon: "lightbulb" },
  literature: { workflow: "Literature synthesis", write: "Literature Synthesis", task: "Synthesising the literature review", icon: "pen" },
  synopsis: { workflow: "Synopsis proposal", write: "Proposal Writing", task: "Developing your synopsis", icon: "pen" },
  journal: { workflow: "Journal manuscript", write: "Manuscript Writing", task: "Drafting your manuscript", icon: "pen" },
  thesis: { workflow: "Thesis chapter", write: "Thesis Writing", task: "Developing your thesis draft", icon: "pen" },
  answer: { workflow: "Project answer", write: "Academic Writing", task: "Answering from your project", icon: "pen" },
};
export function studioStageRole(stage?: string | null): string | null {
  const s = (stage ?? "").trim();
  if (s.startsWith("Literature Survey Agent")) return "survey";
  if (s.startsWith("Evidence Reader")) return "evidence";
  if (s.startsWith("Academic Writing Agent") || s.startsWith("Writing Agent")) return "write";
  if (s.startsWith("Evidence Review Agent")) return "review";
  if (s.startsWith("Authorship Agent")) return "authorship";
  if (s.startsWith("Scientific Figure Agent")) return "figures";
  if (s.startsWith("Originality Agent")) return "originality";
  return null;
}
export function studioWorkflow(item: { id: string; kind: string; status: string; title: string; metadata?: unknown }): WorkflowInput {
  const m = (item.metadata ?? {}) as Record<string, unknown>;
  const req = (m.request ?? {}) as Record<string, unknown>;
  const stage = typeof m.stage === "string" ? m.stage : "";
  const k = STUDIO_KIND[item.kind] ?? { workflow: "Writing", write: "Academic Writing", task: "Developing your draft", icon: "pen" as RoleIcon };
  const queued = item.status === "queued";
  const active = queued ? null : studioStageRole(stage);
  const projectOnly = req.evidenceMode === "project";
  const figureRevision = typeof m.figureRevisionOf === "string";
  // Every stage the worker actually reports, in order. Authorship rewriting and the
  // originality screen run for scholarly kinds only.
  const scholarly = ["journal", "thesis", "literature", "synopsis", "report"].includes(item.kind);
  const roles: RoleDef[] = [
    { id: "survey", name: "Literature Survey", task: "Finding relevant evidence", icon: "search" },
    { id: "evidence", name: "Evidence Reader", task: "Reviewing papers and project documents", icon: "book" },
    { id: "write", name: k.write, task: stage.startsWith("Writing Agent") ? "Drafting with retrieved evidence" : k.task, icon: k.icon },
    { id: "review", name: "Evidence Review", task: "Checking claims and references", icon: "shield" },
    { id: "authorship", name: "Authorship", task: "Rewriting in human academic prose", icon: "pen" },
    { id: "figures", name: "Scientific Figures", task: "Validating data and diagrams", icon: "chart" },
    { id: "originality", name: "Originality", task: "Searching scholarly indexes and the web for matching text", icon: "scan" },
  ];
  const detail = stage.includes("·") ? stage.split("·").slice(1).join("·").trim() : "";
  return {
    key: `studio:${item.id}`, workflow: k.workflow, title: item.title, roles, active,
    phase: queued ? "queued" : active ? "running" : "unknown",
    skipped: {
      ...(projectOnly ? { survey: "Project sources only; no catalogue search" } : {}),
      ...(scholarly ? {} : { authorship: "Authorship rewriting runs on scholarly drafts only" }),
    },
    statusLine: queued ? "Queued · your request is saved and waiting for a writer slot" : active ? (detail ? detail[0].toUpperCase() + detail.slice(1) : roles.find(r => r.id === active)!.task) : "Working · stage not reported yet",
    note: figureRevision ? "Figure revision: the existing text is kept; figures are re-checked." : "You can leave this page; the result is saved to your project automatically.",
  };
}

/* ---------------- Document review ---------------- */
export function reviewStageRole(stage?: string | null): string | null {
  const s = (stage ?? "").trim();
  if (s.startsWith("Document Review Agent")) return "read";
  if (s.startsWith("Literature Survey Agent")) return "survey";
  if (s.startsWith("Evidence Review Agent")) return "propose";
  if (s.startsWith("Scientific Review Agent")) return "check";
  return null;
}
export function reviewWorkflow(item: { id: string; status: string; title: string; metadata?: unknown }): WorkflowInput {
  const m = (item.metadata ?? {}) as Record<string, unknown>;
  const stage = typeof m.stage === "string" ? m.stage : "";
  const queued = item.status === "queued";
  const active = queued ? null : reviewStageRole(stage);
  const roles: RoleDef[] = [
    { id: "read", name: "Document Review", task: "Reading text and original visuals", icon: "file" },
    { id: "survey", name: "Literature Survey", task: "Finding comparison evidence", icon: "search" },
    { id: "propose", name: "Evidence Review", task: "Proposing text and diagram corrections", icon: "pen" },
    { id: "check", name: "Scientific Review", task: "Checking proposed changes", icon: "shield" },
    { id: "save", name: "Review Record", task: "Saving suggestions for your decisions", icon: "save" },
  ];
  return {
    key: `review:${item.id}`, workflow: "Document review", title: typeof m.originalName === "string" ? m.originalName : item.title, roles, active,
    phase: queued ? "queued" : active ? "running" : "unknown",
    statusLine: queued ? "Queued · waiting for a review worker" : active ? roles.find(r => r.id === active)!.task : "Reading your document · stage not reported yet",
    note: "Scientific Review runs only when changes are proposed. Larger documents can take several minutes.",
  };
}

/** Paper review: document review stages plus a scorecard stage reported by the backend. */
export function documentReviewWorkflow(item: { id: string; status: string; title: string; metadata?: unknown }): WorkflowInput {
  const m = (item.metadata ?? {}) as Record<string, unknown>;
  const stage = typeof m.stage === "string" ? m.stage.trim() : "";
  const queued = item.status === "queued";
  const active = queued ? null : /scorecard|paper review|reviewer panel/i.test(stage) ? "score" : reviewStageRole(stage);
  const roles: RoleDef[] = [
    { id: "read", name: "Document Review", task: "Reading manuscript text and available visuals within review limits", icon: "file" },
    { id: "survey", name: "Literature Survey", task: "Comparing with papers, patents and web sources", icon: "search" },
    { id: "propose", name: "Evidence Review", task: "Linking comments to exact passages and sources", icon: "pen" },
    { id: "check", name: "Scientific Review", task: "Checking proposed changes", icon: "shield" },
    { id: "score", name: "Reviewer Panel", task: "Scoring categories and saving the scorecard", icon: "chart" },
  ];
  return {
    key: `paper-review:${item.id}`, workflow: "Paper review", title: typeof m.originalName === "string" ? m.originalName : item.title, roles, active,
    phase: queued ? "queued" : active ? "running" : "unknown",
    statusLine: queued ? "Queued · waiting for a review worker" : active ? roles.find(r => r.id === active)!.task : "Reading your document · stage not reported yet",
    note: "Stages are reported by the review worker. Longer manuscripts can take several minutes; you can leave and return.",
  };
}

/* ---------------- Upload (ticket / put / complete) ---------------- */
export type UploadStage = "idle" | "ticket" | "put" | "complete";
export function uploadWorkflow(stage: UploadStage, fileName: string): { input: WorkflowInput; observed: string[] } {
  const order: UploadStage[] = ["ticket", "put", "complete"];
  const roles: RoleDef[] = [
    { id: "local", name: "File Check", task: "Type and size checked in your browser", icon: "scan" },
    { id: "ticket", name: "Upload Slot", task: "Requesting a private upload slot", icon: "database" },
    { id: "put", name: "Secure Transfer", task: "Sending your file", icon: "upload" },
    { id: "complete", name: "Server Processing", task: "Verifying the file and extracting its content", icon: "file" },
    { id: "library", name: "Project Library", task: "Adding the ready document", icon: "save" },
  ];
  const idx = order.indexOf(stage);
  const observed = ["local", ...order.slice(0, Math.max(0, idx))];
  return {
    observed,
    input: {
      key: `upload:${fileName}`, workflow: "Private document upload", title: fileName, roles,
      active: idx >= 0 ? stage : null, phase: idx >= 0 ? "running" : "unknown",
      statusLine: idx >= 0 ? roles.find(r => r.id === stage)!.task : "Ready to upload",
      note: "Server processing finishes in one step; the dialog closes when your document is ready.",
    },
  };
}

/* ---------------- Originality (local project screening) ---------------- */
export function originalityWorkflow(id: string, title: string): WorkflowInput {
  return {
    key: `originality:${id}`, workflow: "Originality check", title, active: null, phase: "unknown",
    roles: [
      { id: "corpus", name: "Project Material", task: "Collecting other drafts and notes in this project", icon: "database" },
      { id: "refs", name: "Saved References", task: "Including saved paper abstracts and draft sources", icon: "book" },
      { id: "overlap", name: "Shared Wording", task: "Comparing phrases with project material, scholarly abstracts, open full texts and the Internet", icon: "scan" },
      { id: "format", name: "Writing & Format", task: "Checking structure and stated requirements", icon: "list" },
      { id: "save", name: "Saved Result", task: "Storing the check with this draft", icon: "save" },
    ],
    statusLine: "Running the originality check · steps are not reported individually",
    note: "Compares the draft with this project's material, the scholarly index, open-access full texts and the Internet, then re-runs the AI-writing screen. Paywalled full texts and pages the search does not return cannot be compared.",
  };
}

/* ---------------- Research watch ---------------- */
export function watchWorkflow(w: { projectId: string; status: string; patents: boolean; topic: string }): WorkflowInput {
  const queued = w.status === "queued";
  return {
    key: `watch:${w.projectId}`, workflow: "Research watch check", title: w.topic, active: null, phase: queued ? "queued" : "unknown",
    roles: [
      { id: "plan", name: "Query Planning", task: "Turning your topic into search queries", icon: "compass" },
      { id: "search", name: "Catalogue Search", task: "Searching recent scholarly records", icon: "search" },
      { id: "patents", name: "Patent Records", task: "Searching patent publications", icon: "file" },
      { id: "screen", name: "Relevance Screening", task: "Comparing new records with your topic", icon: "shield" },
      { id: "alerts", name: "Research Updates", task: "Recording relevant new items", icon: "bell" },
    ],
    skipped: w.patents ? undefined : { patents: "Patent search is not enabled for this watch" },
    statusLine: queued ? "Queued · waiting for a watch worker" : "Checking for new research · steps are not reported individually",
    note: "Results land in Research updates when the check finishes.",
  };
}
