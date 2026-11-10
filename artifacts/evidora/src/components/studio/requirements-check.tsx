import { Fragment } from "react";
import type { StudioItem } from "@workspace/api-client-react";
import { CircleCheck, CircleDashed, CircleAlert, ExternalLink, FileSearch, Info, Library, ListChecks } from "lucide-react";

export type RequirementCheckRow = { label: string; status: "met" | "missing" | "manual"; detail: string; quote?: string; action?: string };
export type RequirementsCheckData = {
  templateId?: string; templateName?: string;
  status: "retrieved" | "unavailable" | "not_selected" | "user_supplied";
  sourceUrl?: string; fetchedAt?: string; message: string; coverage: string;
  checks: RequirementCheckRow[]; appliedLayout?: Record<string, unknown>;
};
export type ResearchCoverageData = { papersRetrieved: number; paperEvidenceUnits: number; patentsRetrieved: number; patentMessage: string; scope: string };

const rec = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : null);
const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** Defensive parser: old items have no metadata; malformed values are ignored, never thrown. */
export function requirementsCheckOf(item?: Pick<StudioItem, "metadata"> | null): RequirementsCheckData | null {
  const r = rec(rec(item?.metadata)?.requirementsCheck);
  if (!r) return null;
  const status = (["retrieved", "unavailable", "not_selected", "user_supplied"] as const).find(s => s === r.status) ?? "unavailable";
  const checks = (Array.isArray(r.checks) ? r.checks : []).map(rec).filter(Boolean).map(c => ({
    label: str(c!.label) || "Requirement", detail: str(c!.detail), quote: str(c!.quote) || undefined, action: str(c!.action) || undefined,
    status: (c!.status === "met" || c!.status === "missing" ? c!.status : "manual") as RequirementCheckRow["status"],
  }));
  return { templateId: str(r.templateId) || undefined, templateName: str(r.templateName) || undefined, status,
    sourceUrl: /^https?:\/\//i.test(str(r.sourceUrl)) ? str(r.sourceUrl) : undefined, fetchedAt: str(r.fetchedAt) || undefined,
    message: str(r.message), coverage: str(r.coverage), checks, appliedLayout: rec(r.appliedLayout) ?? undefined };
}
export function researchCoverageOf(item?: Pick<StudioItem, "metadata"> | null): ResearchCoverageData | null {
  const r = rec(rec(item?.metadata)?.researchCoverage);
  if (!r) return null;
  return { papersRetrieved: num(r.papersRetrieved), paperEvidenceUnits: num(r.paperEvidenceUnits), patentsRetrieved: num(r.patentsRetrieved), patentMessage: str(r.patentMessage), scope: str(r.scope) };
}

const STATUS_LINE: Record<RequirementsCheckData["status"], string> = {
  retrieved: "Official instructions retrieved",
  unavailable: "Official instructions could not be retrieved",
  not_selected: "No journal or university selected",
  user_supplied: "Checked against guidelines you supplied",
};
const ROW = {
  missing: { icon: CircleAlert, label: "Needs your action", cls: "text-[hsl(var(--vermilion))]" },
  manual: { icon: CircleDashed, label: "Check by hand", cls: "text-[hsl(30_60%_32%)]" },
  met: { icon: CircleCheck, label: "Check passed", cls: "text-[hsl(var(--leaf))]" },
} as const;
const fmt = (s?: string) => { if (!s) return ""; const d = new Date(s); return Number.isNaN(d.getTime()) ? s : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); };
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
const humanKey = (k: string) => k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, c => c.toUpperCase());
const layoutVal = (v: unknown): string => Array.isArray(v) ? v.map(layoutVal).join(", ") : v && typeof v === "object" ? Object.entries(v as Record<string, unknown>).map(([k, x]) => `${humanKey(k)}: ${layoutVal(x)}`).join("; ") : String(v ?? "");

export function RequirementsCheck({ data, compact, emptyHint, formatCopy }: { data: RequirementsCheckData | null; compact?: boolean; emptyHint?: string; formatCopy?: boolean }) {
  if (!data) return (
    <section className="sx-card p-4" data-testid="panel-requirements-empty">
      <p className="sx-eyebrow flex items-center gap-1.5"><ListChecks className="h-3.5 w-3.5" />Submission requirements</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{emptyHint ?? "No requirements check was saved with this version. Run Check requirements & research to compare the draft with the official instructions for your chosen journal or university."}</p>
    </section>
  );
  const order = { missing: 0, manual: 1, met: 2 } as const;
  const rows = [...data.checks].sort((a, b) => order[a.status] - order[b.status]);
  const counts = { missing: rows.filter(r => r.status === "missing").length, manual: rows.filter(r => r.status === "manual").length, met: rows.filter(r => r.status === "met").length };
  const layout = data.appliedLayout ? Object.entries(data.appliedLayout).filter(([, v]) => v !== null && v !== undefined && v !== "") : [];
  const tone = data.status === "retrieved" ? "ok" : data.status === "unavailable" ? "warn" : "";
  return (
    <section className="sx-card rise overflow-hidden" aria-label="Submission requirements check" data-testid="panel-requirements-check">
      <div className="border-b border-[hsl(90_14%_86%)] bg-[hsl(66_22%_95%)] px-4 py-3">
        <p className="sx-eyebrow flex items-center gap-1.5"><ListChecks className="h-3.5 w-3.5" />Submission requirements</p>
        <p className="mt-1 font-serif text-lg leading-snug text-[hsl(var(--ink-teal))]" data-testid="text-requirements-target">{data.templateName || (data.status === "not_selected" ? "No target chosen" : "Your target")}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className={`sx-chip ${tone}`} data-testid="status-requirements-source">{STATUS_LINE[data.status]}</span>
          {data.fetchedAt && <span className="text-muted-foreground" data-testid="text-requirements-fetched">Fetched {fmt(data.fetchedAt)}</span>}
        </div>
        {data.sourceUrl && <a href={data.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[hsl(var(--ink-teal))] underline underline-offset-2" data-testid="link-requirements-source"><ExternalLink className="h-3 w-3" />Official instructions at {host(data.sourceUrl)}</a>}
        {data.message && <p className="mt-2 text-xs text-muted-foreground">{data.message}</p>}
      </div>

      <div className="px-4 py-3">
        {rows.length > 0 ? <>
          <p className="text-[11px] text-muted-foreground" data-testid="text-requirements-counts">
            {counts.missing} need your action · {counts.manual} to check by hand · {counts.met} found in draft. Only the rules listed here were compared.
          </p>
          <ul className={`mt-2 space-y-2 ${compact ? "max-h-[420px] overflow-y-auto pr-1" : ""}`}>
            {rows.map((r, i) => { const s = ROW[r.status]; const Icon = s.icon; return (
              <li key={i} className={`rounded-md border p-2.5 text-xs ${r.status === "missing" ? "border-[hsl(var(--vermilion)/0.3)] bg-[hsl(var(--vermilion)/0.04)]" : "border-[hsl(90_14%_86%)]"}`} data-testid={`row-requirement-${i}`}>
                <p className="flex items-start gap-1.5"><Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${s.cls}`} /><span className="font-medium">{r.label}</span><span className={`ml-auto shrink-0 text-[10px] uppercase tracking-wide ${s.cls}`}>{s.label}</span></p>
                {r.detail && <p className="mt-1 pl-5 text-muted-foreground">{r.detail}</p>}
                {r.quote && <blockquote className="ml-5 mt-1 border-l-2 border-[hsl(var(--teal)/0.4)] pl-2 italic text-muted-foreground">&ldquo;{r.quote}&rdquo;</blockquote>}
                {r.action && r.status !== "met" && <p className="mt-1 pl-5 text-[hsl(var(--ink-teal))]">What to do: {r.action}</p>}
              </li>); })}
          </ul>
        </> : <p className="text-xs text-muted-foreground" data-testid="text-requirements-none">No individual rules were compared in this check.</p>}

        {layout.length > 0 && <div className="mt-3 rounded-md border border-dashed border-[hsl(110_14%_78%)] p-2.5 text-xs" data-testid="panel-applied-layout">
          <p className="font-medium text-[hsl(var(--ink-teal))]">{formatCopy ? "Supported page settings ready for a formatted copy" : "Supported format settings used in PDF and Word"}</p>
          {formatCopy && <p className="mt-1 text-muted-foreground">Create a formatted copy below to use these settings. Your original document is unchanged.</p>}
          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">{layout.map(([k, v]) => <Fragment key={k}><dt className="text-muted-foreground">{humanKey(k)}</dt><dd>{layoutVal(v)}</dd></Fragment>)}</dl>
        </div>}

        <p className="mt-3 flex gap-1.5 rounded-md bg-[hsl(190_30%_95%)] p-2.5 text-[11px] leading-relaxed text-[hsl(var(--ink-teal))]" data-testid="text-requirements-limits">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{data.coverage || "Coverage was not recorded."} This is a guided comparison, not an approval or certification. Rules not listed were not checked, and instructions can change; confirm with the official page before submitting.</span>
        </p>
      </div>
    </section>
  );
}

export function ResearchCoverage({ data }: { data: ResearchCoverageData | null }) {
  if (!data) return null;
  return (
    <section className="sx-card p-4" aria-label="Research coverage" data-testid="panel-research-coverage">
      <p className="sx-eyebrow flex items-center gap-1.5"><Library className="h-3.5 w-3.5" />What was searched</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {[["Papers retrieved", data.papersRetrieved, "papers"], ["Evidence passages", data.paperEvidenceUnits, "units"], ["Patents retrieved", data.patentsRetrieved, "patents"]].map(([l, n, id]) => (
          <div key={id as string} className="rounded-md border border-[hsl(90_14%_86%)] p-2"><p className="font-mono text-xl tabular-nums text-[hsl(var(--ink-teal))]" data-testid={`text-coverage-${id}`}>{(n as number).toLocaleString()}</p><p className="text-[11px] text-muted-foreground">{l}</p></div>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">These are the records actually retrieved and compared for this review. The scholarly catalogues searched hold millions of works, but that is catalogue size, not the number of papers read. This is not an exhaustive literature or patent search.</p>
      {data.patentsRetrieved === 0 && data.patentMessage && <p className="mt-2 flex gap-1.5 text-[11px] text-[hsl(32_70%_32%)]" data-testid="text-coverage-patent-message"><FileSearch className="mt-0.5 h-3.5 w-3.5 shrink-0" />{data.patentMessage}</p>}
      {data.patentsRetrieved > 0 && data.patentMessage && <p className="mt-2 text-[11px] text-muted-foreground">{data.patentMessage}</p>}
      {data.scope && <p className="mt-2 whitespace-pre-wrap text-[11px] text-muted-foreground">{data.scope}</p>}
    </section>
  );
}
