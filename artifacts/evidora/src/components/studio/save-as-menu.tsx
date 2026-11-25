import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getListStudioItemsQueryKey, type StudioItem } from "@workspace/api-client-react";
import { ChevronDown, FileCode, FileText, FolderInput, HardDriveDownload, Save } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useActiveProject } from "@/lib/active-project";
import { friendlyError, type StudioExportFormat } from "@/lib/studio";
import { copyStudioItemToProject, saveStudioItemToComputer } from "@/lib/save-as";

/** "Save as…": write the document to a folder on the computer, or save a named copy into a project folder. */
export function SaveAsMenu({ item, disabled, latex }: { item: Pick<StudioItem, "id" | "title" | "kind">; disabled?: boolean; latex: boolean }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { project, projects } = useActiveProject();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");

  const toComputer = async (f: StudioExportFormat) => {
    setBusy(true);
    try { if (await saveStudioItemToComputer(item, f)) toast({ title: "Saved", description: "The file was saved to the folder you chose." }); }
    catch (e) { toast({ title: "Save failed", description: friendlyError(e), variant: "destructive" }); }
    finally { setBusy(false); }
  };
  const openCopy = () => { setTitle(`${item.title} (copy)`.slice(0, 300)); setTarget(project?.id ?? projects[0]?.id ?? ""); setOpen(true); };
  const toProject = async () => {
    setBusy(true);
    try {
      await copyStudioItemToProject(item.id, target, title.trim());
      await qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey({ projectId: target }) });
      toast({ title: "Copy saved", description: `Saved to “${projects.find(p => p.id === target)?.name ?? "project"}”.` });
      setOpen(false);
    } catch (e) { toast({ title: "Could not save copy", description: friendlyError(e), variant: "destructive" }); }
    finally { setBusy(false); }
  };

  return <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="sx-btn" disabled={disabled || busy} data-testid="button-save-as"><Save />{busy ? "Saving..." : "Save as"}<ChevronDown className="h-3.5 w-3.5" /></button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Save to my computer…</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => void toComputer("pdf")} data-testid="menu-save-as-pdf"><HardDriveDownload className="mr-2 h-4 w-4" />PDF (.pdf)</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void toComputer("docx")} data-testid="menu-save-as-docx"><FileText className="mr-2 h-4 w-4" />Word (.docx)</DropdownMenuItem>
        {latex && <DropdownMenuItem onSelect={() => void toComputer("latex")} data-testid="menu-save-as-latex"><FileCode className="mr-2 h-4 w-4" />LaTeX (.zip)</DropdownMenuItem>}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={openCopy} data-testid="menu-save-as-project"><FolderInput className="mr-2 h-4 w-4" />Save copy to project…</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent data-testid="dialog-save-copy">
        <DialogHeader>
          <DialogTitle>Save copy to project</DialogTitle>
          <DialogDescription>Saves a separate copy with its figures and sources. The original stays where it is.</DialogDescription>
        </DialogHeader>
        <label className="grid gap-1.5 text-sm">Name
          <input className="sx-input" value={title} maxLength={300} onChange={e => setTitle(e.target.value)} data-testid="input-save-copy-title" />
        </label>
        <label className="grid gap-1.5 text-sm">Project folder
          <select className="sx-input" value={target} onChange={e => setTarget(e.target.value)} data-testid="select-save-copy-project">
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.id === project?.id ? " (current)" : ""}</option>)}
          </select>
        </label>
        <DialogFooter>
          <button className="sx-btn" onClick={() => setOpen(false)}>Cancel</button>
          <button className="sx-btn sx-primary" disabled={busy || !title.trim() || !target} onClick={() => void toProject()} data-testid="button-save-copy-confirm">{busy ? "Saving..." : "Save copy"}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
