import { useMemo, useState } from "react";
import { useListStudioTemplates, type StudioTemplate } from "@workspace/api-client-react";
import { BookMarked, ExternalLink } from "lucide-react";
import { RowSkeleton, ErrorState } from "@/components/states";

type RankFilter = "" | "Q1" | "Q2" | "Q3" | "unverified";
const isVerified = (t: StudioTemplate) => t.status.toLowerCase() === "verified";
const quartile = (t: StudioTemplate) => (t.ranking?.quartile ?? "").toUpperCase().trim();
const fmtDate = (s?: string) => { if (!s) return ""; const d = new Date(s); return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); };

/** Ranking as published by its named source; never presented as a universal "Q" grade. */
export function RankingLine({ t }: { t: StudioTemplate }) {
  const r = t.ranking;
  if (!r?.quartile) return null;
  return (
    <p className="mt-1 text-[11px] leading-snug" data-testid={`text-ranking-${t.id}`}>
      <span className="font-semibold text-[hsl(var(--ink-teal))]">{r.quartile}</span>
      {r.category && <> in {r.category}</>}
      {r.year ? <> ({r.year})</> : null}
      {r.sourceUrl && <> &middot; source: <a className="underline" href={r.sourceUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>{hostOf(r.sourceUrl)}</a></>}
    </p>
  );
}
const hostOf = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

export function TemplatePicker({ kind, value, onChange, label, compact }: { kind: "journal" | "thesis" | "synopsis"; value: string | null; onChange: (t: StudioTemplate | null) => void; label: string; compact?: boolean }) {
  const q = useListStudioTemplates();
  const [publisher, setPublisher] = useState("");
  const [country, setCountry] = useState("");
  const [rank, setRank] = useState<RankFilter>("");
  const all = useMemo(() => (q.data ?? []).filter(t => t.kind === kind), [q.data, kind]);
  const publishers = [...new Set(all.map(t => t.publisher).filter(Boolean))].sort();
  const countries = [...new Set(all.map(t => t.country).filter(Boolean))].sort();
  const hasRankings = all.some(t => t.ranking?.quartile);
  const shown = all.filter(t => (!publisher || t.publisher === publisher) && (!country || t.country === country)
    && (!rank || (rank === "unverified" ? !isVerified(t) : quartile(t) === rank)));
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
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by ranking or verification">
        {(["", "Q1", "Q2", "Q3", "unverified"] as RankFilter[]).map(r => (
          <button key={r || "all"} type="button" aria-pressed={rank === r} onClick={() => setRank(r)}
            disabled={r !== "" && r !== "unverified" && !hasRankings}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${rank === r ? "border-[hsl(var(--teal))] bg-[hsl(var(--teal))] text-[hsl(52_30%_97%)]" : "bg-[hsl(52_40%_98%)] hover:bg-[hsl(90_20%_93%)] disabled:opacity-40"}`}
            data-testid={`filter-rank-${r || "all"}`}>{r === "" ? "Any" : r === "unverified" ? "Not verified" : r}</button>
        ))}
      </div>
      {!compact && <p className="text-[11px] text-muted-foreground">Quartiles are category- and year-specific, quoted from the named source. A journal can be Q1 in one subject and Q3 in another.</p>}
      {q.isLoading && <RowSkeleton rows={2} />}
      {q.isError && <ErrorState error={q.error} onRetry={() => void q.refetch()} title="Couldn't load formatting profiles" />}
      {!q.isLoading && !q.isError && !shown.length && <p className="text-sm text-muted-foreground">No profiles match. Clear a filter, or use a general academic layout.</p>}
      <div className={`${compact ? "max-h-56" : "max-h-72"} space-y-1.5 overflow-y-auto pr-1`}>
        {shown.map(t => {
          const on = t.id === value;
          const verified = isVerified(t);
          return (
            <button key={t.id} type="button" onClick={() => onChange(on ? null : t)} aria-pressed={on}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${on ? "border-[hsl(var(--teal))] bg-[hsl(var(--teal)/0.08)]" : "bg-[hsl(52_40%_98%)] hover:bg-[hsl(90_20%_93%)]"}`}
              data-testid={`button-template-${t.id}`}>
              <div className="flex items-start gap-2">
                <BookMarked className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--teal))]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{[t.publisher, t.country].filter(Boolean).join(" · ")}</p>
                  <RankingLine t={t} />
                </div>
                <span className={`sx-chip shrink-0 ${verified ? "ok" : "warn"}`}>{verified ? `guidelines checked${t.verifiedAt ? ` ${fmtDate(t.verifiedAt)}` : ""}` : "not verified"}</span>
              </div>
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="rounded-lg border border-dashed p-3 text-xs" data-testid="panel-template-detail">
          <p className="font-medium">{selected.name}</p>
          <RankingLine t={selected} />
          {selected.layoutDescription && <p className="mt-2"><span className="font-medium">Layout used in exports:</span> <span className="text-muted-foreground">{selected.layoutDescription}</span></p>}
          {selected.guidelines && <p className="mt-1 text-muted-foreground">{selected.guidelines}</p>}
          {selected.requirements.length > 0 && <ul className="mt-2 list-disc space-y-0.5 pl-4">{selected.requirements.map((r, i) => <li key={i}>{r}</li>)}</ul>}
          <p className="mt-2 text-muted-foreground">{isVerified(selected) ? `Guidelines last checked ${fmtDate(selected.verifiedAt) || "(date not recorded)"}.` : "These guidelines have not been verified."}</p>
          {selected.officialTemplateUrl && <a className="mt-1 inline-flex items-center gap-1 font-medium text-[hsl(var(--ink-teal))] underline" href={selected.officialTemplateUrl} target="_blank" rel="noreferrer" data-testid="link-official-template"><ExternalLink className="h-3 w-3" />Official author template</a>}
          <p className="mt-2 text-muted-foreground">Exports use a basic layout derived from these guidelines. It is not the publisher's official template and not a certification of compliance; check the venue's current instructions before submitting.</p>
        </div>
      )}
    </div>
  );
}
