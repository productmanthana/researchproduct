// Stubs only: app shell nav, project, API data. Page JSX in Current/Redesign is copied from evidora source.
import type { ReactNode } from "react";
import { BookmarkPlus, Check, FileText, FolderOpen, Paperclip, Upload } from "lucide-react";
export const TONES = ["170 36% 28%", "16 58% 44%", "43 70% 38%", "210 40% 34%", "330 30% 38%"];
export const PROJECT = { name: "Monsoon water safety" };
export const DOCS = [
  { id: "d1", name: "Bihar_groundwater_arsenic_2019.pdf", size: "2.4 MB", status: "ready", attached: true },
  { id: "d2", name: "Handpump survey notes - Danapur block.docx", size: "318 KB", status: "ready", attached: false },
  { id: "d3", name: "WHO drinking water guidelines ch.7.pdf", size: "5.1 MB", status: "processing", attached: false },
];
export const ITEMS = [
  { id: "i1", title: "Handpump water and post-monsoon illness in school children", meta: "Idea set · rev 1 · 2 days ago" },
  { id: "i2", title: "Seasonal E. coli load in shallow tubewells", meta: "Confirmed idea · rev 1 · 2 days ago" },
  { id: "i3", title: "Notes from headmaster meeting", meta: "Note · rev 2 · 5 days ago" },
];
export const MODES = [
  { value: "project", label: "My project", hint: "Only papers, notes and documents in this project" },
  { value: "discover", label: "Discover", hint: "Search scholarly indexes for new evidence" },
  { value: "combined", label: "Both", hint: "Your project first, plus new papers" },
];
export function Shell({ children }: { children: ReactNode }) {
  const nav = ["Discover", "Ask", "Library", "Projects", "Ideas", "Literature", "Synopsis", "Thesis", "Journals", "Patents", "My Library"];
  return (
    <div className="ilr-root flex min-h-screen">
      <nav className="sx-side hidden w-[232px] shrink-0 p-3 lg:block"><div className="sx-brand px-2 py-3">Evidora</div>{nav.map(n => <span key={n} className="sx-link" aria-current={n === "Ideas" ? "page" : undefined}>{n}</span>)}</nav>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
export function ProjectLink() { return <span className="sx-btn shrink-0"><FolderOpen />{PROJECT.name}</span>; }
export function DocRows() {
  return <>{DOCS.map(d => (
    <li key={d.id} className="flex items-center gap-2 rounded-md border bg-[hsl(52_40%_98%)] px-2.5 py-2 text-sm">
      <span className="min-w-0 flex-1"><span className="block truncate">{d.name}</span><span className="font-mono text-[10.5px] text-muted-foreground">{d.size} &middot; {d.status}</span></span>
      {d.attached ? <span className="sx-chip ok"><Check className="h-3 w-3" />attached</span> : <button className="sx-btn !min-h-[30px] !px-2 !text-xs" disabled={d.status !== "ready"}><Paperclip />Attach</button>}
    </li>))}</>;
}
export function UploadBtn({ label }: { label: string }) { return <button className="sx-btn whitespace-nowrap"><Upload />{label}</button>; }
export function Items() {
  return <ul className="space-y-1.5">{ITEMS.map((i, n) => (
    <li key={i.id}><button className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm ${n === 0 ? "border-[hsl(var(--teal))] bg-[hsl(var(--teal)/0.07)]" : "bg-[hsl(52_40%_98%)]"}`}>
      <span className="flex items-start gap-2"><FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--teal))]" /><span className="line-clamp-2 font-medium">{i.title}</span></span>
      <span className="mt-1 block pl-5 font-mono text-[10.5px] text-muted-foreground">{i.meta}</span></button></li>))}</ul>;
}
export { BookmarkPlus };
