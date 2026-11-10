import { RelatedPapersExplorer } from "@/components/related-explorer";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateProject, getListProjectsQueryKey, useListLibrary, getListLibraryQueryKey, useSaveStudioItem, getListStudioItemsQueryKey, type Project } from "@workspace/api-client-react";
import { ArrowLeft, BookOpen, Folder, FolderOpen, NotebookPen, Plus } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { ErrorState, RowSkeleton } from "@/components/states";
import { NewProjectDialog } from "@/components/studio/project-switcher";
import { ItemList } from "@/components/studio/item-list";
import { StudioDiscussion } from "@/components/studio/studio-discussion";
import { AttachDocuments } from "@/components/studio/attach-documents";
import { useProjectItems, useStudioItem } from "@/components/studio/use-studio";
import { useItemParam } from "@/components/studio/use-item-param";
import { ProjectAttachMenu } from "@/components/studio/project-attach";
import { WorkspaceIntro } from "@/components/studio/workspace-shell";
import { WatchPanel } from "@/components/research/watch-panel";
import { proposeTopic, useWatches } from "@/lib/research-watch";
import { useActiveProject } from "@/lib/active-project";
import { useUnsavedGuard } from "@/lib/unsaved";
import { useToast } from "@/hooks/use-toast";
import { authorsShort, errMessage, PROJECT_COLORS } from "@/lib/format";
import { friendlyError, KIND_LABEL } from "@/lib/studio";

const ALL_KINDS = Object.keys(KIND_LABEL);

function ProjectInfo({ project }: { project: Project }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const update = useUpdateProject();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [color, setColor] = useState(project.color);
  useEffect(() => { setName(project.name); setDescription(project.description); setColor(project.color); }, [project.id, project.name, project.description, project.color]);
  const dirty = name !== project.name || description !== project.description || color !== project.color;
  useUnsavedGuard(`project-info-${project.id}`, dirty, "Project details have unsaved edits.");
  const submit = async () => {
    try {
      await update.mutateAsync({ id: project.id, data: { name: name.trim(), description, color } });
      await qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      toast({ title: "Project updated" });
    } catch (e) { toast({ title: "Couldn't update project", description: errMessage(e), variant: "destructive" }); }
  };
  return (
    <section className="sx-card p-5" data-testid="panel-project-info">
      <div className="flex items-center gap-3">
        <span className="h-10 w-2 rounded-full" style={{ background: color }} />
        <input className="sx-title min-w-0 flex-1 border-0 bg-transparent text-3xl outline-none" value={name} maxLength={120} onChange={e => setName(e.target.value)} aria-label="Project name" data-testid="input-edit-project-name" />
      </div>
      <textarea className="sx-input mt-3 min-h-[70px]" value={description} maxLength={2000} placeholder="What is this project about? Your aims, your setting, your guide's requirements..." onChange={e => setDescription(e.target.value)} data-testid="input-edit-project-description" />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {PROJECT_COLORS.map(c => <button key={c} aria-label={`Colour ${c}`} onClick={() => setColor(c)} className={`h-6 w-6 rounded-full border-2 ${color === c ? "border-[hsl(var(--ink-teal))]" : "border-transparent"}`} style={{ background: c }} data-testid={`button-color-${c}`} />)}
        <span className="ml-2 font-mono text-[11px] text-muted-foreground">{project.paperCount} papers</span>
        <button className="sx-btn sx-primary ml-auto" disabled={!dirty || !name.trim() || update.isPending} onClick={() => void submit()} data-testid="button-save-project">{update.isPending ? "Saving..." : "Save details"}</button>
      </div>
    </section>
  );
}

function AddNote({ projectId, onCreated }: { projectId: string; onCreated: (id: string) => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const save = useSaveStudioItem();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  useUnsavedGuard("new-note", !!(title || content), "A new note is not saved yet.");
  const submit = async () => {
    try {
      const item = await save.mutateAsync({ data: { projectId, kind: "note", title: title.trim(), content } });
      await qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
      setTitle(""); setContent("");
      toast({ title: "Note saved to Library" });
      onCreated(item.id);
    } catch (e) { toast({ title: "Couldn't save note", description: friendlyError(e), variant: "destructive" }); }
  };
  return (
    <div className="sx-card space-y-2 p-4" data-testid="panel-add-note">
      <p className="sx-eyebrow flex items-center gap-1.5"><NotebookPen className="h-3.5 w-3.5" />Add a note</p>
      <input className="sx-input" placeholder="Title" value={title} maxLength={300} onChange={e => setTitle(e.target.value)} data-testid="input-note-title" />
      <textarea className="sx-input min-h-[90px]" placeholder="Field observations, a conversation with your guide, a half-idea..." value={content} onChange={e => setContent(e.target.value)} data-testid="input-note-content" />
      <button className="sx-btn sx-primary w-full" disabled={!title.trim() || save.isPending} onClick={() => void submit()} data-testid="button-save-note">{save.isPending ? "Saving..." : "Save to Library"}</button>
    </div>
  );
}

function Papers({ projectId }: { projectId: string }) {
  const lib = useListLibrary({ projectId }, { query: { queryKey: getListLibraryQueryKey({ projectId }) } });
  if (lib.isLoading) return <RowSkeleton rows={2} />;
  if (lib.isError) return <ErrorState error={lib.error} onRetry={() => void lib.refetch()} title="Couldn't load papers" />;
  if (!lib.data?.length) return <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">No papers saved to this project. <Link href="/discover" className="font-medium text-[hsl(var(--teal))] underline">Discover papers</Link> and save them here.</p>;
  return (
    <ul className="divide-y rounded-lg border bg-[hsl(52_40%_98%)]" data-testid="list-project-papers">
      {lib.data.map(it => (
        <li key={it.id} className="p-3.5">
          <Link href={`/papers/${encodeURIComponent(it.paper.id)}`} className="font-medium hover:underline" data-testid={`link-paper-${it.id}`}>{it.paper.title}</Link>
          <p className="text-xs text-muted-foreground">{authorsShort(it.paper.authors)} &middot; {it.paper.year || "n.d."}{it.paper.venue ? ` · ${it.paper.venue}` : ""}</p>
          {it.paper.id && <div className="mt-1.5"><RelatedPapersExplorer paperId={it.paper.id} rootTitle={it.paper.title} label="Related papers" compact /></div>}
          {it.notes && <p className="mt-1 text-sm italic text-muted-foreground">{it.notes}</p>}
        </li>
      ))}
    </ul>
  );
}

function Inner() {
  const { project, projects, loading, error, refetch, select } = useActiveProject();
  const { id, setId } = useItemParam();
  const items = useProjectItems(project?.id);
  const open = useStudioItem(id);
  const [creating, setCreating] = useState(false);
  const watches = useWatches();
  const [tab, setTab] = useState<"items" | "papers" | "files">("items");
  const all = useMemo(() => items.data ?? [], [items.data]);
  const item = open.data && project && open.data.projectId === project.id ? open.data : undefined;

  // One-time alignment per newly opened item id: a deep link to an item in another owned project (or with no
  // active project) switches to that folder once. Later explicit switches clear ?item= and are never overridden.
  const alignedFor = useRef<string | null>(null);
  const openProjectId = open.data?.projectId;
  const openId = open.data?.id;
  useEffect(() => {
    if (!openId || !openProjectId || alignedFor.current === openId || !projects.length) return;
    alignedFor.current = openId;
    if (openProjectId !== project?.id && projects.some(p => p.id === openProjectId)) select(openProjectId, { preserveItem: true });
  }, [openId, openProjectId, project?.id, projects, select]);

  return (
    <>
      {!(id && project) && <WorkspaceIntro kicker="My Library" title="Every project, every version." sub="Each folder is a project: ideas, drafts, notes, uploaded files, saved papers and follow-up discussions. Private to your account."
        actions={<button className="sx-btn sx-primary" onClick={() => setCreating(true)} data-testid="button-new-folder"><Plus />New project</button>} />}
      <div className={id && project ? "mx-auto max-w-[960px]" : "grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]"}>
        <nav aria-label="Project folders" className={id && project ? "hidden" : "space-y-1"}>
          {loading && <RowSkeleton rows={3} />}
          {!!error && <ErrorState error={error} onRetry={refetch} />}
          {projects.map(p => (
            <button key={p.id} onClick={() => { select(p.id); }} aria-current={p.id === project?.id || undefined}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${p.id === project?.id ? "bg-[hsl(var(--teal))] text-[hsl(52_30%_97%)]" : "hover:bg-[hsl(90_18%_88%)]"}`} data-testid={`button-folder-${p.id}`}>
              {p.id === project?.id ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" style={{ color: p.color }} />}
              <span className="truncate">{p.name}</span>
            </button>
          ))}
          {!loading && !projects.length && <p className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">No projects yet. Create one to start.</p>}
          <Link href="/projects" className="block px-3 pt-2 text-xs text-muted-foreground underline" data-testid="link-manage-projects">Manage or delete projects</Link>
        </nav>
        <div className="min-w-0 space-y-5">
          {!project ? (
            <div className="sx-card grid-paper flex min-h-[320px] flex-col items-center justify-center p-10 text-center"><FolderOpen className="h-10 w-10 text-[hsl(var(--teal))]" strokeWidth={1.2} /><p className="sx-title mt-4 text-2xl">Open a folder</p><p className="mt-1 text-sm text-muted-foreground">Choose a project on the left, or create a new one.</p></div>
          ) : item ? (
            <>
              <nav className="sticky top-0 z-20 -mx-2 flex flex-wrap items-center gap-2 bg-[hsl(var(--background)/0.92)] px-2 py-2 backdrop-blur" aria-label="Library navigation">
                <button className="sx-btn" onClick={() => setId(null, { guard: true })} data-testid="button-back-to-folder"><ArrowLeft />Back to {project.name}</button>
                <span className="hidden truncate font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground md:inline">{KIND_LABEL[item.kind] ?? item.kind}</span>
              </nav>
              {item.kind === "document-review"
                ? <div className="sx-card space-y-3 p-6" data-testid={`panel-review-record-${item.id}`}>
                    <span className="sx-chip">Document review</span>
                    <h2 className="sx-title text-2xl">{item.title}</h2>
                    <p className="text-sm text-muted-foreground">Review records are read-only. Suggestions are approved or dismissed one at a time in AI Chat; each approval writes a new working-draft revision and your original file stays unchanged.</p>
                    <Link href={`/ask?review=${encodeURIComponent(item.id)}`} className="sx-btn sx-primary inline-flex" data-testid={`link-open-review-${item.id}`}>Open review</Link>
                  </div>
                : <StudioDiscussion item={item} allItems={all} onOpen={x => setId(x)} attachSlot={<ProjectAttachMenu projectId={project.id} items={all} />} />}
            </>
          ) : (
            <>
              {id && open.isLoading && <div className="sx-card h-40 animate-pulse" />}
              {id && open.isError && <ErrorState error={open.error} onRetry={() => void open.refetch()} title="Couldn't open this item" />}
              <ProjectInfo project={project} />
              {watches.data && <WatchPanel key={project.id} compact projectId={project.id} projectName={project.name} watch={watches.data.find(w => w.projectId === project.id)}
                proposal={proposeTopic({ name: project.name, description: project.description })} proposalSource="your project details" />}
              <div className="sx-card inline-grid grid-cols-3 gap-1 p-1" role="tablist">
                {([["items", "Drafts and notes"], ["papers", "Papers"], ["files", "Files"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={`sx-btn border-0 ${tab === k ? "sx-primary" : ""}`} onClick={() => setTab(k)} data-testid={`tab-library-${k}`}>{l}</button>)}
              </div>
              {tab === "items" && <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_300px]">
                {items.isError ? <ErrorState error={items.error} onRetry={() => void items.refetch()} /> : <ItemList items={all} kinds={ALL_KINDS} activeId={id} loading={items.isLoading} onOpen={x => setId(x, { guard: true })} emptyText="This folder is empty. Generate an idea or draft, add a note, or attach a file." />}
                <AddNote projectId={project.id} onCreated={x => setId(x)} />
              </div>}
              {tab === "papers" && <><p className="flex items-center gap-1.5 text-sm text-muted-foreground"><BookOpen className="h-4 w-4" />Paper references saved to this project from Discover and your Library.</p><Papers projectId={project.id} /></>}
              {tab === "files" && <AttachDocuments projectId={project.id} items={all} onOpen={x => setId(x)} />}
            </>
          )}
        </div>
      </div>
      <NewProjectDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}

export default function MyLibrary() { return <RequireAuth what="library"><Inner /></RequireAuth>; }
