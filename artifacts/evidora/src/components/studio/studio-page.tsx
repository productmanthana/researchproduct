import { useState, type ReactNode } from "react";
import { Link } from "wouter";
import type { StudioGenerationInputKind, StudioItemInputKind, StudioItem } from "@workspace/api-client-react";
import { FolderOpen } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { ErrorState } from "@/components/states";
import { useActiveProject } from "@/lib/active-project";
import { NeedsProject } from "./project-switcher";
import { Composer } from "./composer";
import { ItemList } from "./item-list";
import { ItemWorkspace } from "./item-workspace";
import { TemplatePicker } from "./template-picker";
import { AttachDocuments } from "./attach-documents";
import { useProjectItems, useStudioItem } from "./use-studio";
import { useItemParam } from "./use-item-param";

export type StudioPageConfig = {
  kind: Exclude<StudioGenerationInputKind, "ideas" | "answer">;
  saveKind: StudioItemInputKind;
  kicker: string;
  title: string;
  intro: string;
  placeholder: string;
  cta: string;
  templateKind?: "journal" | "thesis" | "synopsis";
  templateLabel?: string;
  emptyArt: ReactNode;
};

export function StudioHeader({ kicker, title, intro }: { kicker: string; title: string; intro: string }) {
  const { project } = useActiveProject();
  return (
    <header className="rise mb-7 flex flex-col gap-3 border-b border-[hsl(90_14%_84%)] pb-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="sx-eyebrow">{kicker}</p>
        <h1 className="sx-title mt-1.5 text-4xl leading-[1.05] md:text-5xl">{title}</h1>
        <p className="mt-3 text-[15px] text-muted-foreground">{intro}</p>
      </div>
      {project && <Link href="/my-library" className="sx-btn shrink-0" data-testid="link-project-library"><FolderOpen />{project.name}</Link>}
    </header>
  );
}

function Inner({ cfg }: { cfg: StudioPageConfig }) {
  const { project } = useActiveProject();
  const { id, setId, params } = useItemParam();
  const items = useProjectItems(project?.id);
  const open = useStudioItem(id);
  const sourceId = params.get("source");
  const sourceQ = useStudioItem(sourceId);
  const source = sourceQ.data && project && sourceQ.data.projectId === project.id ? sourceQ.data : undefined;
  const sourcePrompt = source ? `Update the ${cfg.kicker.toLowerCase()} for this project, taking into account the newly found source "${source.title}":\n\n${source.content.slice(0, 3000)}` : "";
  const [templateId, setTemplateId] = useState<string | null>(null);
  const kinds = [cfg.kind as string, cfg.saveKind as string];

  if (!project) return <><StudioHeader {...cfg} /><NeedsProject what={`Your ${cfg.kicker.toLowerCase()}`} /></>;
  const item: StudioItem | undefined = open.data && open.data.projectId === project.id ? open.data : undefined;

  return (
    <>
      <StudioHeader {...cfg} />
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-5">
          {source && <div className="sx-card rise border-l-4 border-l-[hsl(var(--turmeric))] p-3 text-[13px]" data-testid="notice-source-context">
            <p className="font-medium">Source note added to the prompt below</p>
            <p className="mt-0.5 text-muted-foreground">Review or edit it, then write a new document. Your existing drafts are kept.</p>
          </div>}
          {sourceId && sourceQ.isLoading && <div className="sx-card h-16 animate-pulse" />}
          <Composer key={`${project.id}:${source?.id ?? ""}`} initialPrompt={sourcePrompt.slice(0, 5000)} projectId={project.id} kind={cfg.kind} saveKind={cfg.saveKind} placeholder={cfg.placeholder} cta={cfg.cta}
            templateId={templateId}
            templateSlot={cfg.templateKind ? <TemplatePicker kind={cfg.templateKind} value={templateId} onChange={t => setTemplateId(t?.id ?? null)} label={cfg.templateLabel ?? "Formatting profile"} /> : undefined}
            onCreated={it => setId(it.id, { guard: true })} />
          <AttachDocuments projectId={project.id} items={items.data ?? []} />
          <div>
            <p className="sx-eyebrow mb-2">In this project</p>
            {items.isError ? <ErrorState error={items.error} onRetry={() => void items.refetch()} title="Couldn't load items" />
              : <ItemList items={items.data ?? []} kinds={kinds} activeId={id} loading={items.isLoading} onOpen={x => setId(x, { guard: true })} emptyText="Nothing here yet. Your first draft will appear here and in My Library." />}
          </div>
        </div>
        <div className="min-w-0">
          {id && open.isLoading && <div className="sx-card h-96 animate-pulse" />}
          {id && open.isError && <ErrorState error={open.error} onRetry={() => void open.refetch()} title="Couldn't open this item" />}
          {id && open.data && !item && <p className="sx-card p-5 text-sm">This item belongs to a different project. Switch projects to open it.</p>}
          {item && <ItemWorkspace item={item} allItems={items.data ?? []} onOpen={x => setId(x)} />}
          {!id && (
            <div className="sx-card grid-paper flex min-h-[420px] flex-col items-center justify-center p-10 text-center" data-testid="status-studio-empty">
              {cfg.emptyArt}
              <p className="sx-title mt-5 text-2xl">Your draft will open here</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">Describe your topic on the left and generate, or open an earlier draft to keep working on it.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function StudioPage({ cfg }: { cfg: StudioPageConfig }) {
  return <RequireAuth what={cfg.kicker.toLowerCase()}><Inner cfg={cfg} /></RequireAuth>;
}
