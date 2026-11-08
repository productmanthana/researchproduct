import { useMemo, useState } from "react";
import { useListStudioTemplates, type StudioTemplate } from "@workspace/api-client-react";
import { BookMarked } from "lucide-react";
import { RowSkeleton, ErrorState } from "@/components/states";

export function TemplatePicker({ kind, value, onChange, label }: { kind: "journal" | "thesis" | "synopsis"; value: string | null; onChange: (t: StudioTemplate | null) => void; label: string }) {
  const q = useListStudioTemplates();
  const [publisher, setPublisher] = useState("");
  const [country, setCountry] = useState("");
  const all = useMemo(() => (q.data ?? []).filter(t => t.kind === kind), [q.data, kind]);
  const publishers = [...new Set(all.map(t => t.publisher).filter(Boolean))].sort();
  const countries = [...new Set(all.map(t => t.country).filter(Boolean))].sort();
  const shown = all.filter(t => (!publisher || t.publisher === publisher) && (!country || t.country === country));
  const selected = all.find(t => t.id === value);

  return (
    <div className="space-y-3" data-testid={`picker-template-${kind}`}>
      <p className="sx-eyebrow">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <select className="sx-input" value={publisher} onChange={e => setPublisher(e.target.value)} aria-label="Filter by publisher" data-testid="select-template-publisher">
          <option value="">All publishers</option>{publishers.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="sx-input" value={country} onChange={e => setCountry(e.target.value)} aria-label="Filter by country" data-testid="select-template-country">
          <option value="">All countries</option>{countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {q.isLoading && <RowSkeleton rows={2} />}
      {q.isError && <ErrorState error={q.error} onRetry={() => void q.refetch()} title="Couldn't load formatting profiles" />}
      {!q.isLoading && !q.isError && !shown.length && <p className="text-sm text-muted-foreground">No profiles match. Clear a filter, or generate with a general academic layout.</p>}
      <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
        {shown.map(t => {
          const on = t.id === value;
          const verified = t.status.toLowerCase() === "verified";
          return (
            <button key={t.id} type="button" onClick={() => onChange(on ? null : t)} aria-pressed={on}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${on ? "border-[hsl(var(--teal))] bg-[hsl(var(--teal)/0.08)]" : "bg-[hsl(52_40%_98%)] hover:bg-[hsl(90_20%_93%)]"}`}
              data-testid={`button-template-${t.id}`}>
              <div className="flex items-start gap-2">
                <BookMarked className="mt-0.5 h-4 w-4 text-[hsl(var(--teal))]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{[t.publisher, t.country].filter(Boolean).join(" · ")}</p>
                </div>
                <span className={`sx-chip ${verified ? "ok" : "warn"}`}>{verified ? "verified guidelines" : "not verified"}</span>
              </div>
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="rounded-lg border border-dashed p-3 text-xs" data-testid="panel-template-detail">
          <p className="font-medium">{selected.name}</p>
          {selected.guidelines && <p className="mt-1 text-muted-foreground">{selected.guidelines}</p>}
          {selected.requirements.length > 0 && <ul className="mt-2 list-disc space-y-0.5 pl-4">{selected.requirements.map((r, i) => <li key={i}>{r}</li>)}</ul>}
          <p className="mt-2 text-muted-foreground">A draft formatting profile only. Check the venue's current author guidelines before submitting; this is not a guarantee of acceptance or journal-readiness. Rankings and indexing are not shown because we have not verified them.</p>
        </div>
      )}
    </div>
  );
}
