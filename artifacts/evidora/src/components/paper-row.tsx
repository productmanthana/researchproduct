import { useState } from "react";
import { Link } from "wouter";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListLibrary,
  getListLibraryQueryKey,
  useListProjects,
  getListProjectsQueryKey,
  useSavePaper,
  getGetSummaryQueryKey,
  type Paper,
} from "@workspace/api-client-react";
import { Bookmark, BookmarkCheck, Check, ExternalLink, FileText, Plus, Quote, Unlock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authorsShort, errMessage, evidenceTone, num } from "@/lib/format";
import { selection, useSelection } from "@/lib/selection";

export function useSavedIds() {
  const { isSignedIn } = useUser();
  const lib = useListLibrary(undefined, { query: { enabled: !!isSignedIn, queryKey: getListLibraryQueryKey() } });
  return new Set((lib.data ?? []).map((i) => i.paper.id));
}

export function SavePaperButton({ paper, saved, size = "sm" }: { paper: Paper; saved: boolean; size?: "sm" | "default" }) {
  const { isSignedIn } = useUser();
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState<string>("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();
  const projects = useListProjects({ query: { enabled: open && !!isSignedIn, queryKey: getListProjectsQueryKey() } });
  const save = useSavePaper();

  if (!isSignedIn)
    return (
      <Link href="/sign-in" className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground" data-testid={`link-signin-save-${paper.id}`}>
        <Bookmark className="h-3.5 w-3.5" /> Sign in to save
      </Link>
    );
  if (saved)
    return (
      <Link href="/library" className="inline-flex items-center gap-1.5 rounded-md border border-[hsl(var(--leaf)/0.4)] bg-[hsl(var(--leaf)/0.08)] px-2.5 py-1 text-xs text-leaf" data-testid={`status-saved-${paper.id}`}>
        <BookmarkCheck className="h-3.5 w-3.5" /> In library
      </Link>
    );

  const submit = () => {
    save.mutate(
      {
        data: {
          paperId: paper.id,
          projectId: projectId || null,
          notes: notes.trim() || undefined,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListLibraryQueryKey() });
          qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
          toast({ title: "Saved to library", description: paper.title });
          setOpen(false);
        },
        onError: (e) => toast({ title: "Couldn't save", description: errMessage(e), variant: "destructive" }),
      },
    );
  };

  return (
    <>
      <Button size={size} variant="outline" className="press h-7 gap-1.5 px-2.5 text-xs" onClick={() => setOpen(true)} data-testid={`button-save-${paper.id}`}>
        <Bookmark className="h-3.5 w-3.5" /> Save
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Save to library</DialogTitle>
            <DialogDescription className="line-clamp-2">{paper.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Project</Label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setProjectId("")}
                  className={`rounded-full border px-3 py-1 text-xs ${projectId === "" ? "border-primary bg-primary text-primary-foreground" : ""}`}
                  data-testid="button-project-none"
                >
                  Unfiled
                </button>
                {(projects.data ?? []).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProjectId(p.id)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${projectId === p.id ? "border-primary bg-primary text-primary-foreground" : ""}`}
                    data-testid={`button-project-${p.id}`}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: p.color || "#1F5A8C" }} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" className="mt-1.5" placeholder="thermal, CFD, baseline" value={tags} onChange={(e) => setTags(e.target.value)} data-testid="input-tags" />
              <p className="mt-1 text-xs text-muted-foreground">Comma-separated</p>
            </div>
            <div>
              <Label htmlFor="notes">Note</Label>
              <Textarea id="notes" className="mt-1.5" rows={3} placeholder="Why does this paper matter to you?" value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="input-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={save.isPending} data-testid="button-confirm-save">
              {save.isPending ? "Saving..." : "Save paper"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SelectToggle({ paper }: { paper: Paper }) {
  const sel = useSelection();
  const on = sel.some((s) => s.id === paper.id);
  return (
    <button
      onClick={() => selection.toggle({ id: paper.id, title: paper.title })}
      className={`press inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors ${
        on ? "border-vermilion bg-vermilion text-white" : "hover:border-foreground/40"
      }`}
      data-testid={`button-select-${paper.id}`}
    >
      {on ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
      {on ? "Selected" : "Select"}
    </button>
  );
}

export function PaperRow({ paper, saved, index, compact }: { paper: Paper; saved: boolean; index?: number; compact?: boolean }) {
  return (
    <article className="group relative bg-card px-5 py-4 transition-colors hover:bg-[hsl(var(--accent)/0.25)]" data-testid={`card-paper-${paper.id}`}>
      <div className="flex gap-4">
        {index !== undefined && <span className="hidden w-6 shrink-0 pt-0.5 text-right font-mono text-xs text-muted-foreground sm:block">{String(index).padStart(2, "0")}</span>}
        <div className="min-w-0 flex-1">
          <Link href={`/papers/${encodeURIComponent(paper.id)}`} className="font-display text-[17px] font-medium leading-snug decoration-turmeric decoration-2 underline-offset-4 hover:underline" data-testid={`link-paper-${paper.id}`}>
            {paper.title}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            {authorsShort(paper.authors)}
            {paper.publicationDate||paper.year ? <span className="font-mono"> &middot; {paper.publicationDate??paper.year}{!paper.publicationDate?" (year only)":""}</span> : null}
            {paper.venue ? <span className="italic"> &middot; {paper.venue}</span> : null}
          </p>
          {!compact && paper.abstract && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/80">{paper.abstract}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-mono text-muted-foreground" title="Citations">
              <Quote className="h-3 w-3" /> {num(paper.citations)}
            </span>
            {paper.isOa && (
              <span className="inline-flex items-center gap-1 rounded border border-[hsl(var(--leaf)/0.35)] px-1.5 py-0.5 text-leaf">
                <Unlock className="h-3 w-3" /> Open access
              </span>
            )}
            {paper.evidenceLevel && <span className={`rounded border px-1.5 py-0.5 ${evidenceTone(paper.evidenceLevel)}`}>{paper.evidenceLevel}</span>}
            {paper.field && <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">{paper.field}</span>}
            {paper.sources?.map((s) => (
              <span key={s} className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                via {s}
              </span>
            ))}
            <span className="ml-auto flex items-center gap-1.5">
              {paper.pdfUrl && (
                <a href={paper.pdfUrl} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-muted-foreground hover:text-foreground" data-testid={`link-pdf-${paper.id}`}>
                  <FileText className="h-3.5 w-3.5" /> PDF
                </a>
              )}
              {paper.url && (
                <a href={paper.url} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-muted-foreground hover:text-foreground" data-testid={`link-source-${paper.id}`}>
                  <ExternalLink className="h-3.5 w-3.5" /> Source
                </a>
              )}
              <SelectToggle paper={paper} />
              <SavePaperButton paper={paper} saved={saved} />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
