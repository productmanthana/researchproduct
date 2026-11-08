import { useCheckStudioDocument, type StudioCheck } from "@workspace/api-client-react";
import { ShieldCheck } from "lucide-react";
import { friendlyError } from "@/lib/studio";

export function CheckResult({ result }: { result: StudioCheck }) {
  return (
    <div className="space-y-3 text-sm" data-testid="panel-check-result">
      <p className="text-muted-foreground"><span className="font-medium text-foreground">Scope:</span> {result.scope}</p>
      {!result.externalAvailable && <p className="sx-chip warn">External web and journal databases were not checked</p>}
      <div>
        <p className="sx-eyebrow mb-1">Writing issues ({result.issues.length})</p>
        {result.issues.length ? <ul className="list-disc space-y-1 pl-5">{result.issues.map((i, n) => <li key={n}>{i}</li>)}</ul> : <p className="text-muted-foreground">No issues flagged.</p>}
      </div>
      <div>
        <p className="sx-eyebrow mb-1">Overlapping passages in your project ({result.matches.length})</p>
        {result.matches.length ? result.matches.map((m, n) => (
          <div key={n} className="mt-2 rounded-md border bg-[hsl(var(--turmeric)/0.08)] p-3">
            <p className="font-medium">{m.title}</p>
            <p className="mt-1 italic text-muted-foreground">&ldquo;{m.excerpt}&rdquo;</p>
          </div>
        )) : <p className="text-muted-foreground">No overlapping passages found within this project.</p>}
      </div>
      <p className="text-xs text-muted-foreground">This is a limited, project-only similarity check. It is not an AI-authorship detector and gives no percentage score.</p>
    </div>
  );
}

export function CheckPanel({ itemId, disabled }: { itemId: string; disabled?: boolean }) {
  const check = useCheckStudioDocument();
  return (
    <div className="sx-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="sx-eyebrow">Originality and quality check</p>
        <button className="sx-btn" disabled={disabled || check.isPending} onClick={() => check.mutate({ id: itemId })} data-testid="button-run-check"><ShieldCheck />{check.isPending ? "Checking..." : "Run check"}</button>
      </div>
      {disabled && <p className="mt-2 text-xs text-muted-foreground">Save your edits first; the check reads the saved version.</p>}
      {check.isError && <p className="mt-3 text-sm text-vermilion">{friendlyError(check.error)}</p>}
      {check.data && <div className="mt-4"><CheckResult result={check.data} /></div>}
    </div>
  );
}
