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
    <header className="rise mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[hsl(90_14%_84%)] pb-4">
      <div className="min-w-0 max-w-2xl">
        <p className="sx-eyebrow">{kicker}</p>
        <h1 className="sx-title mt-1 text-2xl leading-tight md:text-[28px]">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{intro}</p>
      </div>
      {project && <Link href="/my-library" className="sx-btn min-w-0 max-w-full" data-testid="link-project-library"><FolderOpen /><span className="truncate">{project.name}</span></Link>}
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
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_284px] xl:grid-cols-[minmax(0,1fr)_312px]">
        <section className="min-w-0 space-y-4 lg:col-start-1 lg:row-start-1" aria-label="Start a new draft">
          {source && <div className="sx-card rise border-l-4 border-l-[hsl(var(--turmeric))] p-3 text-[13px]" data-testid="notice-source-context">
            <p className="font-medium">Source note added to the prompt below</p>
            <p className="mt-0.5 text-muted-foreground">Review or edit it, then write a new document. Your existing drafts are kept.</p>
          </div>}
          {sourceId && sourceQ.isLoading && <div className="sx-card h-16 animate-pulse" />}
          <Composer key={`${project.id}:${source?.id ?? ""}`} variant="wide" label={`Describe your ${cfg.kicker.toLowerCase()} topic`} initialPrompt={sourcePrompt.slice(0, 5000)} projectId={project.id} kind={cfg.kind} saveKind={cfg.saveKind} placeholder={cfg.placeholder} cta={cfg.cta}
            templateId={templateId}
            templateSlot={cfg.templateKind ? (
              <details className="rounded-lg border bg-[hsl(52_40%_98%)]" data-testid="panel-formatting-profile">
                <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium">
                  {cfg.templateLabel ?? "Formatting profile"}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">{templateId ? "Profile selected" : "General academic layout"}</span>
                </summary>
                <div className="border-t p-3">
                  <TemplatePicker kind={cfg.templateKind} value={templateId} onChange={t => setTemplateId(t?.id ?? null)} label={cfg.templateLabel ?? "Formatting profile"} />
                </div>
              </details>
            ) : undefined}
            onCreated={it => setId(it.id, { guard: true })} />
        </section>
        <div className="min-w-0 lg:col-start-2 lg:row-start-1">
          <AttachDocuments projectId={project.id} items={items.data ?? []} variant="compact" />
        </div>
        <section className="min-w-0 lg:col-start-1 lg:row-start-2" aria-label="Working draft" aria-live="polite">
          {id && open.isLoading && <div className="sx-card h-96 animate-pulse" />}
          {id && open.isError && <ErrorState error={open.error} onRetry={() => void open.refetch()} title="Couldn't open this item" />}
          {id && open.data && !item && <p className="sx-card p-5 text-sm">This item belongs to a different project. Switch projects to open it.</p>}
          {item && <ItemWorkspace item={item} allItems={items.data ?? []} onOpen={x => setId(x)} />}
          {!id && (
            <div className="rounded-lg border border-dashed border-[hsl(110_14%_78%)] px-4 py-3 text-[13px] text-muted-foreground" data-testid="status-studio-empty">
              <span className="font-medium text-[hsl(var(--ink-teal))]">Your draft will open here.</span>{" "}
              Describe your topic above and generate, or open an earlier draft to keep working on it.
            </div>
          )}
        </section>
        <aside className="sx-card min-w-0 p-3.5 lg:col-start-2 lg:row-start-2" aria-label="Saved project drafts">
          <p className="sx-eyebrow mb-2">In this project</p>
          <div className="max-h-[340px] overflow-y-auto pr-0.5">
            {items.isError ? <ErrorState error={items.error} onRetry={() => void items.refetch()} title="Couldn't load items" />
              : <ItemList items={items.data ?? []} kinds={kinds} activeId={id} loading={items.isLoading} onOpen={x => setId(x, { guard: true })} emptyText="Nothing here yet. Your first draft will appear here and in My Library." />}
          </div>
        </aside>
      </div>
    </>
  );
}

export function StudioPage({ cfg }: { cfg: StudioPageConfig }) {
  return <RequireAuth what={cfg.kicker.toLowerCase()}><Inner cfg={cfg} /></RequireAuth>;
}
