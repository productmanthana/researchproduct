import type { ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { errMessage } from "@/lib/format";

export function RowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border rounded-md border bg-card" data-testid="status-loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="relative overflow-hidden p-5">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="mt-3 h-3 w-1/2 rounded bg-muted" />
          <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
          <div className="scanline absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[hsl(var(--card)/0.7)] to-transparent" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = "Couldn't load this", variant = "error" }: { error: unknown; onRetry?: () => void; title?: string; variant?: "error" | "warning" }) {
  return (
    <div role={variant === "warning" ? "status" : "alert"} className={`rounded-md border p-5 ${variant === "warning" ? "border-amber-300 bg-amber-50" : "border-[hsl(var(--vermilion)/0.35)] bg-[hsl(var(--vermilion)/0.05)]"}`} data-testid={variant === "warning" ? "status-refresh-warning" : "status-error"}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${variant === "warning" ? "text-amber-700" : "text-vermilion"}`} />
        <div className="flex-1">
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{errMessage(error)}</p>
        </div>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} data-testid="button-retry">
            <RotateCw className="mr-1.5 h-3.5 w-3.5" /> Retry
          </Button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="grid-paper flex flex-col items-center rounded-md border border-dashed px-6 py-14 text-center" data-testid="status-empty">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border bg-card text-primary shadow-sm">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <header className="rise mb-8 flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-vermilion">{kicker}</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}
