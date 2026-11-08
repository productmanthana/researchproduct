import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useSaveStudioItem, getListStudioItemsQueryKey, getGetStudioItemQueryKey, type Analysis } from "@workspace/api-client-react";
import { BookmarkPlus, Check } from "lucide-react";
import { useActiveProject } from "@/lib/active-project";
import { useToast } from "@/hooks/use-toast";
import { friendlyError, meta } from "@/lib/studio";
import { ExportButtons } from "./item-workspace";
import { useProjectItems } from "./use-studio";

/** Save an existing Ask/Research answer into the active project (bibliography imported server-side), then export it.
 *  Saved state is recovered from the server (metadata.analysisId), so it survives sessions and is account-scoped. */
export function SaveAnalysisToProject({ analysis, compact }: { analysis: Analysis; compact?: boolean }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { project } = useActiveProject();
  const items = useProjectItems(project?.id);
  const save = useSaveStudioItem();
  const saved = (items.data ?? []).filter(i => meta(i).analysisId === analysis.id).sort((a, b) => b.revision - a.revision)[0];

  const run = async () => {
    if (!project) return;
    try {
      const item = await save.mutateAsync({ data: { projectId: project.id, kind: "answer", title: analysis.question.slice(0, 300), content: analysis.content, analysisId: analysis.id } });
      qc.setQueryData(getGetStudioItemQueryKey(item.id), item);
      await qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
      toast({ title: "Saved to Library", description: `Added to ${project.name} with its references.` });
    } catch (e) { toast({ title: "Couldn't save to project", description: friendlyError(e), variant: "destructive" }); }
  };

  const cls = compact ? "!min-h-[30px] !px-2.5 !py-1 !text-xs" : "";
  if (saved) return (
    <span className="inline-flex flex-wrap items-center gap-1.5" data-testid={`status-saved-analysis-${analysis.id}`}>
      <Link href={`/my-library?item=${saved.id}`} className={`sx-btn ${cls}`}><Check />In {project?.name ?? "project"}</Link>
      <span className="contents [&_.sx-btn]:!min-h-[30px] [&_.sx-btn]:!px-2.5 [&_.sx-btn]:!py-1 [&_.sx-btn]:!text-xs"><ExportButtons item={saved} /></span>
    </span>
  );
  if (!project) return <Link href="/my-library" className={`sx-btn ${cls}`} title="Choose an active project to save into" data-testid="link-choose-project-to-save"><BookmarkPlus />Choose project to save</Link>;
  return <button className={`sx-btn ${cls}`} disabled={save.isPending || items.isLoading} onClick={() => void run()} data-testid={`button-save-analysis-${analysis.id}`}><BookmarkPlus />{save.isPending ? "Saving..." : `Save to ${project.name}`}</button>;
}
