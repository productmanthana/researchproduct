import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListProjects, getListProjectsQueryKey, useCreateProject, useUpdateProject, useDeleteProject, getListLibraryQueryKey, getGetSummaryQueryKey, type Project } from "@workspace/api-client-react";
import { FolderKanban, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RequireAuth } from "@/components/require-auth";
import { EmptyState, ErrorState, PageHeader, RowSkeleton } from "@/components/states";
import { LibraryList } from "@/pages/library";
import { useToast } from "@/hooks/use-toast";
import { ago, errMessage, PROJECT_COLORS } from "@/lib/format";

function ProjectDialog({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [color, setColor] = useState(project?.color || PROJECT_COLORS[0]);
  const create = useCreateProject();
  const update = useUpdateProject();
  const qc = useQueryClient();
  const { toast } = useToast();
  const pending = create.isPending || update.isPending;
  const opts = {
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
      toast({ title: project ? "Project updated" : "Project created" });
      onClose();
    },
    onError: (e: unknown) => toast({ title: "Couldn't save project", description: errMessage(e), variant: "destructive" }),
  };
  const submit = () => {
    const data = { name: name.trim(), description: description.trim(), color };
    if (project) update.mutate({ id: project.id, data }, opts);
    else create.mutate({ data }, opts);
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{project ? "Edit project" : "New project"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input className="mt-1.5" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Final-year project: solar dryer" data-testid="input-project-name" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea className="mt-1.5" rows={3} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} data-testid="input-project-description" />
          </div>
          <div>
            <Label>Colour</Label>
            <div className="mt-2 flex gap-2">
              {PROJECT_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${color === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}`} style={{ background: c }} data-testid={`button-color-${c.slice(1)}`} />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!name.trim() || pending} data-testid="button-save-project">
            {pending ? "Saving..." : project ? "Save" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProjectsInner() {
  const projects = useListProjects({ query: { queryKey: getListProjectsQueryKey() } });
  const del = useDeleteProject();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Project | null | "new">(null);
  const [removing, setRemoving] = useState<Project | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const list = projects.data ?? [];
  const active = list.find((p) => p.id === activeId) ?? list[0];

  return (
    <>
      <PageHeader kicker="Organise" title="Projects">
        <Button onClick={() => setEditing("new")} className="gap-2" data-testid="button-new-project">
          <Plus className="h-4 w-4" /> New project
        </Button>
      </PageHeader>
      {projects.isLoading ? (
        <RowSkeleton rows={3} />
      ) : projects.isError ? (
        <ErrorState error={projects.error} onRetry={() => projects.refetch()} />
      ) : !list.length ? (
        <EmptyState icon={<FolderKanban className="h-5 w-5" />} title="No projects yet" body="Group papers by thesis chapter, course, or lab experiment." action={<Button onClick={() => setEditing("new")}>Create your first project</Button>} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <div className="space-y-2">
            {list.map((p) => (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveId(p.id)}
                onKeyDown={(e) => e.key === "Enter" && setActiveId(p.id)}
                className={`lift group relative cursor-pointer overflow-hidden rounded-md border bg-card p-4 pl-5 ${active?.id === p.id ? "border-primary shadow-md" : ""}`}
                data-testid={`card-project-${p.id}`}
              >
                <span className="absolute inset-y-0 left-0 w-1" style={{ background: p.color }} />
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-lg font-medium leading-tight">{p.name}</p>
                  <div className="flex opacity-60 transition-opacity group-hover:opacity-100">
                    <button onClick={(e) => { e.stopPropagation(); setEditing(p); }} className="rounded p-1 hover:bg-muted" data-testid={`button-edit-project-${p.id}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setRemoving(p); }} className="rounded p-1 text-vermilion hover:bg-muted" data-testid={`button-delete-project-${p.id}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                  {p.paperCount} papers &middot; created {ago(p.createdAt)}
                </p>
              </div>
            ))}
          </div>
          {active && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold">
                <span className="h-3 w-3 rounded-full" style={{ background: active.color }} /> {active.name}
              </h2>
              <LibraryList key={active.id} params={{ projectId: active.id }} projects={list} />
            </div>
          )}
        </div>
      )}
      {editing && <ProjectDialog project={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>The project is removed. How saved papers in it are handled is decided by the server; they are not deleted from search.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete-project"
              onClick={() =>
                removing &&
                del.mutate(
                  { id: removing.id },
                  {
                    onSuccess: () => {
                      qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
                      qc.invalidateQueries({ queryKey: getListLibraryQueryKey() });
                      qc.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
                      setActiveId(null);
                      toast({ title: "Project deleted" });
                    },
                    onError: (e) => toast({ title: "Couldn't delete", description: errMessage(e), variant: "destructive" }),
                  },
                )
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function Projects() {
  return (
    <RequireAuth what="projects">
      <ProjectsInner />
    </RequireAuth>
  );
}
