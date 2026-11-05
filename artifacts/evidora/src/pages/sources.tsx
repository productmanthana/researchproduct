import { useGetSources, getGetSourcesQueryKey } from "@workspace/api-client-react";
import { ExternalLink } from "lucide-react";
import { ErrorState, PageHeader, RowSkeleton } from "@/components/states";

function tone(status: string) {
  const s = status.toLowerCase();
  if (s === "connected" || s.includes("operational") || s === "active") return { dot: "bg-leaf", text: "text-leaf" };
  if (s.includes("partial") || s.includes("degrad") || s.includes("limited") || s.includes("not checked")) return { dot: "bg-turmeric pulse-dot", text: "text-[hsl(30_70%_35%)]" };
  return { dot: "bg-vermilion", text: "text-vermilion" };
}

export default function Sources() {
  const s = useGetSources({ query: { queryKey: getGetSourcesQueryKey() } });
  return (
    <>
      <PageHeader kicker="Transparency" title="Sources and licences" />
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Evidora queries these public scholarly services live. We do not hold a full local copy of the literature. When a connector is degraded, searches still run but may return fewer results, and you will see a warning.
      </p>
      {s.isLoading ? <RowSkeleton rows={4} /> : s.isError ? <ErrorState error={s.error} onRetry={() => s.refetch()} /> : (
        <div className="divide-y overflow-hidden rounded-md border bg-card">
          {(s.data ?? []).map((src) => {
            const t = tone(src.status);
            return (
              <div key={src.name} className="grid gap-3 p-5 md:grid-cols-[220px_1fr]" data-testid={`row-source-${src.name}`}>
                <div>
                  <p className="font-display text-lg font-medium">{src.name}</p>
                  <p className={`mt-1 inline-flex items-center gap-1.5 text-xs ${t.text}`}><span className={`h-2 w-2 rounded-full ${t.dot}`} /> {src.status}</p>
                </div>
                <div className="text-sm">
                  <p>{src.description}</p>
                  {src.licenseNote && <p className="mt-2 border-l-2 border-turmeric pl-3 text-xs text-muted-foreground">{src.licenseNote}</p>}
                  {src.url && <a href={src.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">{src.url} <ExternalLink className="h-3 w-3" /></a>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
