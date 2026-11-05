import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListLibrary,
  getListLibraryQueryKey,
  useListProjects,
  getListProjectsQueryKey,
  useUpdateLibraryItem,
  useDeleteLibraryItem,
  useListDocuments,
  getListDocumentsQueryKey,
  useDeleteDocument,
  useLinkDocument,
  getGetSummaryQueryKey,
  getDownloadDocumentUrl,
  type LibraryItem,
  type ListLibraryParams,
  type Project,
} from "@workspace/api-client-react";
import { BookMarked, Download, FileImage, FileText, Pencil, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RequireAuth } from "@/components/require-auth";
import { DocumentUpload } from "@/components/document-upload";
import { SelectToggle } from "@/components/paper-row";
import { EmptyState, ErrorState, PageHeader, RowSkeleton } from "@/components/states";
import { useToast } from "@/hooks/use-toast";
import { ago, authorsShort, bytes, errMessage } from "@/lib/format";

function EditItemDialog({ item, projects, onClose }: { item: LibraryItem; projects: Project[]; onClose: () => void }) {
  const [notes, setNotes] = useState(item.notes);
  const [tags, setTags] = useState(item.tags.join(", "));
  const [projectId, setProjectId] = useState(item.projectId ?? "none");
  const update = useUpdateLibraryItem();
  const qc = useQueryClient();
  const { toast } = useToast();
  const save = () =>
    update.mutate(
      { id: item.id, data: { notes, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), projectId: projectId === "none" ? null : projectId } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListLibraryQueryKey() });
          qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          toast({ title: "Saved" });
          onClose();
        },
        onError: (e) => toast({ title: "Couldn't update", description: errMessage(e), variant: "destructive" }),
      },
    );
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Notes and filing</DialogTitle>
          <DialogDescription className="line-clamp-2">{item.paper.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="mt-1.5" data-testid="select-item-project">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unfiled</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tags</Label>
            <Input className="mt-1.5" value={tags} onChange={(e) => setTags(e.target.value)} data-testid="input-item-tags" />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea className="mt-1.5 min-h-[160px]" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={10000} data-testid="input-item-notes" />
            <p className="mt-1 text-right font-mono text-[10px] text-muted-foreground">{notes.length}/10000</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={update.isPending} data-testid="button-save-item">
            {update.isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LibraryList({ params, projects }: { params?: ListLibraryParams; projects: Project[] }) {
  const lib = useListLibrary(params, { query: { queryKey: getListLibraryQueryKey(params) } });
  const del = useDeleteLibraryItem();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<LibraryItem | null>(null);
  const [removing, setRemoving] = useState<LibraryItem | null>(null);
  const projectById = new Map(projects.map((p) => [p.id, p]));

  if (lib.isLoading) return <RowSkeleton rows={4} />;
  if (lib.isError) return <ErrorState error={lib.error} onRetry={() => lib.refetch()} />;
  if (!lib.data?.length)
    return (
      <EmptyState
        icon={<BookMarked className="h-5 w-5" />}
        title={params?.q ? "No saved papers match" : "Nothing filed here yet"}
        body="Save papers from Discover or any paper page. Notes and tags stay with them."
        action={<Link href="/discover" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground" data-testid="link-empty-discover">Go to Discover</Link>}
      />
    );

  return (
    <>
      <div className="divide-y overflow-hidden rounded-md border bg-card">
        {lib.data.map((item) => {
          const proj = item.projectId ? projectById.get(item.projectId) : undefined;
          return (
            <div key={item.id} className="group grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto]" data-testid={`row-library-${item.id}`}>
              <div className="min-w-0">
                <Link href={`/papers/${encodeURIComponent(item.paper.id)}`} className="font-display text-[17px] font-medium leading-snug hover:underline decoration-turmeric decoration-2 underline-offset-4">
                  {item.paper.title}
                </Link>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {authorsShort(item.paper.authors)} <span className="font-mono">&middot; {item.paper.year}</span>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                  {proj && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: proj.color }} />
                      {proj.name}
                    </span>
                  )}
                  {item.tags.map((t) => (
                    <span key={t} className="rounded bg-accent px-1.5 py-0.5 font-mono text-[11px] text-accent-foreground">#{t}</span>
                  ))}
                  <span className="text-muted-foreground">saved {ago(item.createdAt)}</span>
                </div>
                {item.notes && <p className="mt-2 border-l-2 border-turmeric pl-3 text-sm text-foreground/80 line-clamp-3 whitespace-pre-wrap">{item.notes}</p>}
              </div>
              <div className="flex items-start gap-1.5">
                <SelectToggle paper={item.paper} />
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditing(item)} data-testid={`button-edit-item-${item.id}`}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-vermilion" onClick={() => setRemoving(item)} data-testid={`button-delete-item-${item.id}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      {editing && <EditItemDialog item={editing} projects={projects} onClose={() => setEditing(null)} />}
      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from library?</AlertDialogTitle>
            <AlertDialogDescription>Your notes and tags for this paper will be deleted. The paper itself stays searchable.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete-item"
              onClick={() =>
                removing &&
                del.mutate(
                  { id: removing.id },
                  {
                    onSuccess: () => {
                      qc.invalidateQueries({ queryKey: getListLibraryQueryKey() });
                      qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
                      qc.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
                      toast({ title: "Removed from library" });
                    },
                    onError: (e) => toast({ title: "Couldn't remove", description: errMessage(e), variant: "destructive" }),
                  },
                )
              }
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DocLink({ docId, paperId }: { docId: string; paperId: string | null | undefined }) {
  const lib = useListLibrary(undefined, { query: { queryKey: getListLibraryQueryKey() } });
  const link = useLinkDocument();
  const qc = useQueryClient();
  const { toast } = useToast();
  const items = lib.data ?? [];
  const current = items.find((i) => i.paper.id === paperId);
  return (
    <div className="mt-2">
      <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground" htmlFor={`link-${docId}`}>Linked paper</label>
      <select
        id={`link-${docId}`}
        value={paperId ?? ""}
        disabled={link.isPending || lib.isLoading}
        onChange={(e) =>
          link.mutate(
            { id: docId, data: { paperId: e.target.value || null } },
            {
              onSuccess: () => {
                qc.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
                toast({ title: e.target.value ? "Document linked to paper" : "Document unlinked" });
              },
              onError: (err) => toast({ title: "Couldn't update link", description: errMessage(err), variant: "destructive" }),
            },
          )
        }
        className="mt-1 block w-full truncate rounded border bg-background px-2 py-1 text-xs"
        data-testid={`select-link-${docId}`}
      >
        <option value="">{lib.isLoading ? "Loading library..." : "Not linked"}</option>
        {paperId && !current && <option value={paperId}>Saved paper (not in library list)</option>}
        {items.map((i) => <option key={i.id} value={i.paper.id}>{i.paper.title.slice(0, 90)}</option>)}
      </select>
      {lib.isError && <p className="mt-1 text-[11px] text-vermilion">Couldn't load library papers.</p>}
    </div>
  );
}

function Documents() {
  const docs = useListDocuments({ query: { queryKey: getListDocumentsQueryKey() } });
  const del = useDeleteDocument();
  const qc = useQueryClient();
  const { toast } = useToast();
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">Private to you. Research uses selected files and PDFs linked to the selected papers automatically. Upload only files you have the right to use; delete them here at any time.</p>
        <DocumentUpload />
      </div>
      {docs.isLoading ? (
        <RowSkeleton rows={3} />
      ) : docs.isError ? (
        <ErrorState error={docs.error} onRetry={() => docs.refetch()} />
      ) : !docs.data?.length ? (
        <EmptyState icon={<FileText className="h-5 w-5" />} title="No documents yet" body="Upload lab manuals, papers you already own, or screenshots of figures you want explained." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {docs.data.map((d) => {
            const isImg = d.contentType.startsWith("image/");
            const Icon = isImg ? FileImage : FileText;
            const ok = d.status === "ready" || d.status === "completed";
            return (
              <div key={d.id} className="lift flex gap-3 rounded-md border bg-card p-4" data-testid={`card-document-${d.id}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded ${isImg ? "bg-accent text-accent-foreground" : "bg-[hsl(var(--cyan-ink)/0.1)] text-primary"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{d.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {bytes(d.size)}
                    {d.pageCount ? ` \u00B7 ${d.pageCount} pp` : ""} &middot; {ago(d.createdAt)}
                  </p>
                  <p className={`mt-1 inline-flex items-center gap-1.5 text-xs ${d.status === "failed" ? "text-vermilion" : ok ? "text-leaf" : "text-muted-foreground"}`} data-testid={`status-document-${d.id}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${d.status === "failed" ? "bg-vermilion" : ok ? "bg-leaf" : "bg-turmeric pulse-dot"}`} />
                    {d.status}
                    {d.error ? ` \u2014 ${d.error}` : ""}
                  </p>
                  <DocLink docId={d.id} paperId={d.paperId} />
                </div>
                <div className="flex flex-col gap-1">
                  <a href={getDownloadDocumentUrl(d.id)} target="_blank" rel="noreferrer" className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Open original" data-testid={`link-download-${d.id}`}>
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => {
                      if (!confirm(`Delete ${d.name}? This cannot be undone.`)) return;
                      del.mutate(
                        { id: d.id },
                        {
                          onSuccess: () => {
                            qc.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
                            qc.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
                            toast({ title: "Document deleted" });
                          },
                          onError: (e) => toast({ title: "Couldn't delete", description: errMessage(e), variant: "destructive" }),
                        },
                      );
                    }}
                    className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-vermilion"
                    title="Delete"
                    data-testid={`button-delete-document-${d.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LibraryInner() {
  const [tab, setTab] = useState<"papers" | "documents">("papers");
  const [q, setQ] = useState("");
  const [projectId, setProjectId] = useState("all");
  const projects = useListProjects({ query: { queryKey: getListProjectsQueryKey() } });
  const params: ListLibraryParams = {};
  if (q.trim()) params.q = q.trim();
  if (projectId !== "all") params.projectId = projectId;

  return (
    <>
      <PageHeader kicker="Your desk" title="Library">
        <div className="flex rounded-md border bg-card p-0.5">
          {(["papers", "documents"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded px-3 py-1.5 text-sm capitalize transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`} data-testid={`tab-library-${t}`}>
              {t}
            </button>
          ))}
        </div>
      </PageHeader>
      {tab === "papers" ? (
        <>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by title, note or tag" className="bg-card pl-9" data-testid="input-library-search" />
            </div>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="bg-card sm:w-56" data-testid="select-library-project">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {(projects.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <LibraryList params={Object.keys(params).length ? params : undefined} projects={projects.data ?? []} />
        </>
      ) : (
        <Documents />
      )}
    </>
  );
}

export default function Library() {
  return (
    <RequireAuth what="library">
      <LibraryInner />
    </RequireAuth>
  );
}
