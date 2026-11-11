import { HttpError } from "./common";

/** Confirmation is a conversation turn, not a new revision of the idea set. */
export function selectedIdeaContext(
  source: { id: string; project_id: string; kind: string; status: string; metadata?: Record<string, any> },
  input: { projectId: string; kind: string; title: string; parentId?: string; documentId?: string; analysisId?: string },
) {
  if (input.kind !== "idea" || input.parentId || input.documentId || input.analysisId)
    throw new HttpError(400, "Confirm an idea separately from document revisions or imported answers.");
  if (source.project_id !== input.projectId || source.kind !== "ideas" || source.status !== "completed")
    throw new HttpError(400, "Choose a completed idea set in this project.");
  const normalize = (text: string) => text.trim().toLowerCase();
  const ideas = source.metadata?.ideas;
  if (!Array.isArray(ideas) || !ideas.some(idea => typeof idea?.title === "string" && normalize(idea.title.slice(0, 300)) === normalize(input.title)))
    throw new HttpError(400, "Choose an idea from this saved set.");
  return {
    ideaSetId: source.id,
    request: { parentId: source.id, prompt: `Selected research idea: ${input.title.trim()}` },
    sources: Array.isArray(source.metadata?.sources) ? source.metadata.sources : [],
    warnings: Array.isArray(source.metadata?.warnings) ? source.metadata.warnings : [],
  };
}
