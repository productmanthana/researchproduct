import type { ReactNode } from "react";
import { Link } from "wouter";
import { FolderOpen, History, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/** Landing header used by every project workspace before a conversation or draft is open. */
export function WorkspaceIntro({ kicker, title, sub, projectName, onHistory, actions }: {
  kicker: string; title: string; sub?: string; projectName?: string; onHistory?: () => void; actions?: ReactNode;
}) {
  return (
    <header className="rise mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0 max-w-2xl">
        <p className="sx-eyebrow">{kicker}</p>
        <h1 className="sx-title mt-0.5 text-[28px] leading-tight md:text-[34px]">{title}</h1>
        {sub && <p className="mt-1.5 text-sm text-muted-foreground">{sub}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {actions}
        {onHistory && <button className="sx-btn" onClick={onHistory} data-testid="button-open-history"><History />History and uploads</button>}
        {projectName && <Link href="/my-library" className="sx-btn shrink-0" data-testid="link-project-library"><FolderOpen /><span className="max-w-[160px] truncate">{projectName}</span></Link>}
      </div>
    </header>
  );
}

/** Sticky reading-mode bar: explicit "new" action, back targets, history drawer and project link. */
export function WorkspaceBar({ newLabel, onNew, label, back, onHistory, projectName }: {
  newLabel: string; onNew: () => void; label?: string; back?: ReactNode; onHistory?: () => void; projectName?: string;
}) {
  return (
    <nav className="rise sticky top-0 z-20 -mx-2 mb-5 flex flex-wrap items-center gap-2 bg-[hsl(var(--background)/0.92)] px-2 py-2 backdrop-blur" aria-label="Workspace navigation">
      <button className="sx-btn sx-primary" onClick={onNew} data-testid="button-new-context"><Plus />{newLabel}</button>
      {back}
      {label && <span className="hidden truncate font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground md:inline">{label}</span>}
      <div className="ml-auto flex gap-2">
        {onHistory && <button className="sx-btn" onClick={onHistory} data-testid="button-open-history"><History /><span className="hidden sm:inline">History and uploads</span><span className="sm:hidden">History</span></button>}
        {projectName && <Link href="/my-library" className="sx-btn hidden shrink-0 sm:inline-flex" data-testid="link-project-library"><FolderOpen /><span className="max-w-[140px] truncate">{projectName}</span></Link>}
      </div>
    </nav>
  );
}

export function HistoryDrawer({ open, onOpenChange, title = "History and uploads", description, children }: {
  open: boolean; onOpenChange: (v: boolean) => void; title?: string; description: string; children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-[hsl(52_30%_96%)] sm:max-w-[400px]" data-testid="drawer-history">
        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="sx-title text-xl">{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="space-y-5">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
