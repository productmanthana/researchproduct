import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { ChevronDown, FolderOpen, Plus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useActiveProject } from "@/lib/active-project";
import { confirmLeave } from "@/lib/unsaved";
import { useToast } from "@/hooks/use-toast";
import { errMessage, PROJECT_COLORS } from "@/lib/format";

export function NewProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const qc = useQueryClient();
  const create = useCreateProject();
  const { select } = useActiveProject();
  const { toast } = useToast();
  const submit = async () => {
    if (!name.trim() || create.isPending) return;
    // Guard unsaved edits before creating, so a cancelled leave never leaves an orphan switch half-done.
    if (!confirmLeave()) return;
    try {
      const p = await create.mutateAsync({ data: { name: name.trim(), description: description.trim(), color: PROJECT_COLORS[0] } });
      await qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      select(p.id, { skipGuard: true }); // clears the old ?item=
      setName(""); setDescription(""); onOpenChange(false);
      toast({ title: "Project created", description: `${p.name} is now your active project.` });
    } catch (e) { toast({ title: "Couldn't create project", description: errMessage(e), variant: "destructive" }); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sx-title text-2xl">Start a project folder</DialogTitle>
          <DialogDescription>Everything you generate, save or attach will live here, privately.</DialogDescription>
        </DialogHeader>
        <label className="text-sm font-medium">Name<input className="sx-input mt-1" value={name} maxLength={120} onChange={e => setName(e.target.value)} placeholder="e.g. Groundwater arsenic in Bihar" data-testid="input-project-name" /></label>
        <label className="text-sm font-medium">What is it about? <span className="font-normal text-muted-foreground">(optional)</span><textarea className="sx-input mt-1 min-h-[90px]" maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} data-testid="input-project-description" /></label>
        <DialogFooter><button className="sx-btn sx-primary" disabled={!name.trim() || create.isPending} onClick={() => void submit()} data-testid="button-create-project">{create.isPending ? "Creating..." : "Create and select"}</button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const { project, projects, loading, select } = useActiveProject();
  const [creating, setCreating] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="sx-card flex w-full items-center gap-2.5 px-3 py-2.5 text-left" data-testid="button-project-switcher">
          <span className="h-7 w-1.5 shrink-0 rounded-full" style={{ background: project?.color || "hsl(var(--sage))" }} />
          <span className="min-w-0 flex-1">
            <span className="sx-eyebrow block !text-[9.5px]">Active project</span>
            <span className="block truncate text-sm font-medium" data-testid="text-active-project">{loading ? "Loading..." : project?.name ?? "None selected"}</span>
          </span>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Switch project</DropdownMenuLabel>
          {projects.map(p => (
            <DropdownMenuItem key={p.id} onSelect={() => select(p.id)} data-testid={`item-project-${p.id}`}>
              <span className="mr-2 h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
              <span className="truncate">{p.name}</span>
              {p.id === project?.id && <span className="ml-auto text-[10px] text-muted-foreground">active</span>}
            </DropdownMenuItem>
          ))}
          {!projects.length && !loading && <p className="px-2 py-1.5 text-xs text-muted-foreground">No projects yet.</p>}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCreating(true)} data-testid="item-project-new"><Plus className="mr-2 h-4 w-4" />New project</DropdownMenuItem>
          {project && <DropdownMenuItem onSelect={() => select(null)}>Clear selection</DropdownMenuItem>}
          <DropdownMenuItem asChild><Link href="/my-library" onClick={onNavigate}><FolderOpen className="mr-2 h-4 w-4" />Open My Library</Link></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <NewProjectDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}

/** Inline gate shown on project-scoped pages when no project is active. */
export function NeedsProject({ what }: { what: string }) {
  const { projects, select } = useActiveProject();
  const [creating, setCreating] = useState(false);
  return (
    <div className="sx-card grid-paper rise mx-auto max-w-xl p-8 text-center" data-testid="panel-needs-project">
      <FolderOpen className="mx-auto h-8 w-8 text-[hsl(var(--teal))]" />
      <h2 className="sx-title mt-3 text-2xl">Choose a project folder first</h2>
      <p className="mt-2 text-sm text-muted-foreground">{what} is saved inside a project so your drafts, notes and papers stay together.</p>
      {projects.length > 0 && <div className="mt-5 flex flex-wrap justify-center gap-2">{projects.slice(0, 6).map(p => <button key={p.id} className="sx-btn" onClick={() => select(p.id)} data-testid={`button-pick-project-${p.id}`}><span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{p.name}</button>)}</div>}
      <button className="sx-btn sx-primary mt-4" onClick={() => setCreating(true)} data-testid="button-needs-new-project"><Plus />New project</button>
      <NewProjectDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
