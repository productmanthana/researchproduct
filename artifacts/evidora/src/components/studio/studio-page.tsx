import { useState, type ReactNode } from "react";
import { Link } from "wouter";
import type { StudioGenerationInputKind, StudioItemInputKind, StudioItem } from "@workspace/api-client-react";
import { FolderOpen } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { ErrorState } from "@/components/states";
import { useActiveProject } from "@/lib/active-project";
import { isTemporaryRequestFailure, itemLoadFailure } from "@/lib/request-errors";
import { NeedsProject } from "./project-switcher";
import { Composer } from "./composer";
import { ItemList } from "./item-list";
import { StudioDiscussion } from "./studio-discussion";
import { TemplatePicker } from "./template-picker";
import { useToast } from "@/hooks/use-toast";
import { JournalSetupForm } from "./journal-setup";
import { defaultJournalSetup, journalGenerationExtras, journalPromptWithLength, journalSetupProblem } from "@/lib/journal-setup";
import { AttachDocuments } from "./attach-documents";
import { useProjectItems, useStudioItem } from "./use-studio";
import { useItemParam } from "./use-item-param";
import { ProjectAttachMenu } from "./project-attach";
import { HistoryDrawer, WorkspaceBar, WorkspaceIntro } from "./workspace-shell";
import { ResearchWorkbench, SourcesList } from "@/components/workbench/research-workbench";
import { buildConversations, conversationFor } from "@/lib/conversation";
import { studioItemSources } from "@/lib/source-provenance";
import { isWorking, KIND_LABEL } from "@/lib/studio";

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
  const [drawer, setDrawer] = useState(false);
  const { toast } = useToast();
  const [setup, setSetup] = useState(() => defaultJournalSetup());
  const isJournal = cfg.templateKind === "journal";
  const kinds = [cfg.kind as string, cfg.saveKind as string];
  const all = items.data ?? [];

  if (!project) return <><StudioHeader {...cfg} /><NeedsProject what={`Your ${cfg.kicker.toLowerCase()}`} /></>;
  const inaccessible = open.isError && !isTemporaryRequestFailure(open.error);
  const candidate = open.data ?? (isTemporaryRequestFailure(open.error) ? all.find(i => i.id === id) : undefined);
  const item: StudioItem | undefined = !inaccessible && candidate?.projectId === project.id ? candidate : undefined;
  const loadFailure = itemLoadFailure(!!item);
  const attach = <ProjectAttachMenu projectId={project.id} items={all} />;

  const drawerEl = (
    <HistoryDrawer open={drawer} onOpenChange={setDrawer} description={`Earlier ${cfg.kicker.toLowerCase()} drafts in ${project.name}, and the files attached to this project.`}>
      <div>
        <p className="sx-eyebrow mb-2">In this project</p>
        {items.isError ? <ErrorState error={items.error} onRetry={() => void items.refetch()} title="Couldn't load items" />
          : <ItemList items={all} kinds={kinds} activeId={id} loading={items.isLoading} onOpen={x => { setDrawer(false); setId(x, { guard: true }); }} emptyText="Nothing here yet. Your first draft will appear here and in My Library." />}
      </div>
      <AttachDocuments projectId={project.id} items={all} variant="compact" />
      <Link href="/my-library" className="sx-btn w-full" data-testid="link-project-library-drawer"><FolderOpen />Open {project.name} library</Link>
    </HistoryDrawer>
  );

  if (!id) {
    return (
      <div className="mx-auto max-w-[860px]">
        <WorkspaceIntro kicker={cfg.kicker} title={cfg.title} sub={cfg.intro} projectName={project.name} onHistory={() => setDrawer(true)} />
        <section className="space-y-4" aria-label="Start a new draft">
          {source && <div className="sx-card rise border-l-4 border-l-[hsl(var(--turmeric))] p-3 text-[13px]" data-testid="notice-source-context">
            <p className="font-medium">Source note added to the prompt below</p>
            <p className="mt-0.5 text-muted-foreground">Review or edit it, then write a new document. Your existing drafts are kept.</p>
          </div>}
          {sourceId && sourceQ.isLoading && <div className="sx-card h-16 animate-pulse" />}
          <Composer key={`${project.id}:${source?.id ?? ""}`} variant="wide" label={`Describe your ${cfg.kicker.toLowerCase()} topic`} initialPrompt={sourcePrompt.slice(0, 5000)} projectId={project.id} kind={cfg.kind} saveKind={cfg.saveKind} placeholder={cfg.placeholder} cta={cfg.cta}
            templateId={isJournal ? null : templateId} attachSlot={attach}
            extra={isJournal ? (({ documentDetails: _d, ...rest }) => rest)(journalGenerationExtras(setup)) : undefined}
            prepare={isJournal ? async req => {
              const problem = journalSetupProblem(setup);
              if (problem) { toast({ title: "Finish the journal setup", description: problem, variant: "destructive" }); return null; }
              return { prompt: journalPromptWithLength(req.prompt, setup.length) };
            } : undefined}
            templateSlot={isJournal ? (
              <details open className="rounded-lg border bg-[hsl(52_40%_98%)]" data-testid="panel-journal-setup">
                <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium">
                  Journal setup
                  <span className="ml-2 text-xs font-normal text-muted-foreground">Format, length and diagrams · change the format again after writing</span>
                </summary>
                <div className="border-t p-3"><JournalSetupForm value={setup} onChange={setSetup} showDetails={false} /></div>
              </details>
            ) : cfg.templateKind ? (
              <details className="rounded-lg border bg-[hsl(52_40%_98%)]" data-testid="panel-formatting-profile">
                <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium">
                  {cfg.templateLabel ?? "Choose a format"}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">{templateId ? "Selected" : "Optional · standard format if skipped"}</span>
                </summary>
                <div className="border-t p-3">
                  <TemplatePicker kind={cfg.templateKind} value={templateId} onChange={t => setTemplateId(t?.id ?? null)} label={cfg.templateLabel ?? "Choose a format"} />
                </div>
              </details>
            ) : undefined}
            onCreated={it => setId(it.id, { guard: true })} />
          <div className="flex items-center gap-4 rounded-lg border border-dashed border-[hsl(110_14%_78%)] px-4 py-3" data-testid="status-studio-empty">
            <span className="shrink-0 text-[hsl(var(--teal))] [&_svg]:h-7 [&_svg]:w-7" aria-hidden>{cfg.emptyArt}</span>
            <p className="text-[13px] text-muted-foreground"><span className="font-medium text-[hsl(var(--ink-teal))]">Your draft opens as a reading page.</span> Keep asking follow-ups beneath it; each revision is saved and your original stays untouched. Files added with the paperclip become project evidence.</p>
          </div>
        </section>
        {drawerEl}
      </div>
    );
  }

  // Each request is followed by its full document/answer in the conversation; Sources sit in the secondary pane.
  const merged = item ? [...all.filter(i => i.projectId === item.projectId && i.id !== item.id), item] : all;
  const conv = item ? conversationFor(buildConversations(merged, project.id), item.id) : undefined;
  const shownItems = item ? (conv ? conv.turns.map(t => t.revisions.find(r => r.id === item.id) ?? t.latest) : [item]) : [];
  const sources = studioItemSources(shownItems, k => KIND_LABEL[k] ?? k);
  const writing = shownItems.some(i => isWorking(i.status));

  return (
    <div className="mx-auto max-w-[1520px] pb-6">
      <WorkspaceBar newLabel="New draft" onNew={() => setId(null, { guard: true })} label={cfg.kicker} onHistory={() => setDrawer(true)} projectName={project.name} />
      <section className="min-w-0 space-y-5" aria-label="Working draft" aria-live="polite">
        {open.isLoading && <div className="space-y-3" data-testid="status-item-loading"><div className="h-10 w-2/3 animate-pulse rounded-md bg-[hsl(90_14%_88%)]" /><div className="sx-card h-80 animate-pulse" /></div>}
        {open.isError && <ErrorState variant={item ? "warning" : "error"} error={loadFailure.message ? { message: `${loadFailure.message} Reconnecting automatically.` } : open.error} onRetry={() => void open.refetch()} title={loadFailure.title} />}
        {open.data && open.data.projectId !== project.id && <p className="sx-card p-5 text-sm">This item belongs to a different project. Switch projects to open it, or start a new draft.</p>}
        {item && <ResearchWorkbench idBase="studio" label={`${cfg.kicker} workspace`} sourceCount={sources.length}
          conversation={<div className="mx-auto w-full max-w-[860px] pb-3"><StudioDiscussion item={item} allItems={all} onOpen={x => setId(x)} attachSlot={attach} /></div>}
          sources={<SourcesList sources={sources} pending={writing} />} />}
      </section>
      {drawerEl}
    </div>
  );
}

export function StudioPage({ cfg }: { cfg: StudioPageConfig }) {
  return <RequireAuth what={cfg.kicker.toLowerCase()}><Inner cfg={cfg} /></RequireAuth>;
}
