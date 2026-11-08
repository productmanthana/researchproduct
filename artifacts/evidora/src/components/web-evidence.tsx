import { useAuth } from "@clerk/react";
import { useGetWebEvidence, getGetWebEvidenceQueryKey, type GetWebEvidence200 } from "@workspace/api-client-react";
import { ChevronDown, ExternalLink, Globe, Info } from "lucide-react";

const SIX_HOURS = 6 * 60 * 60 * 1000;

type WebResult = GetWebEvidence200["results"][number];
type WebEvidence = Pick<GetWebEvidence200, "status" | "message"> & Partial<Pick<GetWebEvidence200, "query" | "retrievedAt" | "cached">> & { results: WebResult[] };

const STATUS_LABEL: Record<string, string> = {
  ready: "Retrieved",
  empty: "No matches",
  unavailable: "Unavailable",
  not_configured: "Not configured",
  restricted: "Not searched",
};

const LIMIT_NOTE = "Internet pages are supplemental. They are not peer-reviewed papers or patent records. Anything they suggest is a candidate gap to check, not proof that an idea is new, and this search did not check every paper or patent that exists.";

function fallbackMessage(status: string) {
  if (status === "not_configured") return "Internet evidence search is not configured. An administrator must add the search provider key; nothing is needed from you. Paper and patent results are unaffected.";
  if (status === "restricted") return "Internet search was not run for this request (for example, project-only or private material). Only the listed papers, patents and project sources were used.";
  if (status === "unavailable") return "The Internet search provider did not respond. Paper and patent results are unaffected.";
  if (status === "empty") return "No Internet pages matched this query.";
  return "";
}

/** Normalise unknown persisted metadata into a WebEvidence shape, or null. */
export function webEvidenceFrom(meta: unknown): WebEvidence | null {
  if (!meta || typeof meta !== "object") return null;
  const w = (meta as Record<string, unknown>).webEvidence;
  if (!w || typeof w !== "object") return null;
  const r = w as Record<string, unknown>;
  if (typeof r.status !== "string") return null;
  const results = Array.isArray(r.results) ? (r.results as unknown[]).filter((x): x is WebResult => !!x && typeof x === "object" && typeof (x as WebResult).title === "string") : [];
  return {
    status: r.status as WebEvidence["status"],
    message: typeof r.message === "string" ? r.message : "",
    query: typeof r.query === "string" ? r.query : undefined,
    retrievedAt: typeof r.retrievedAt === "string" ? r.retrievedAt : null,
    cached: r.cached === true,
    results,
  };
}

const safeUrl = (u: unknown): URL | null => {
  if (typeof u !== "string" || !u) return null;
  try { const parsed = new URL(u); return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed : null; } catch { return null; }
};
const day = (d?: string | null) => { if (!d) return null; const t = new Date(d); return isNaN(t.getTime()) ? null : t.toLocaleDateString(); };

export function WebEvidencePanel({ data, saved, testId = "panel-web-evidence", onRefresh, refreshing }: { data: WebEvidence; saved?: boolean; testId?: string; onRefresh?: () => void; refreshing?: boolean }) {
  const message = data.message || fallbackMessage(data.status);
  const ok = data.results.length > 0;
  return (
    <section className="rounded-md border border-[hsl(var(--turmeric)/0.55)] bg-[hsl(var(--turmeric)/0.06)] p-4 text-sm" aria-label="Internet evidence" data-testid={testId}>
      <div className="flex flex-wrap items-center gap-2">
        <Globe className="h-4 w-4 text-[hsl(var(--turmeric))]" />
        <p className="font-mono text-[10px] uppercase tracking-widest">Internet evidence {saved ? "(saved with this item)" : "(same query)"}</p>
        <span className="rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase" data-testid="status-web-evidence">{STATUS_LABEL[data.status] ?? data.status}</span>
        {data.retrievedAt && day(data.retrievedAt) && <span className="font-mono text-[10px] text-muted-foreground">retrieved {day(data.retrievedAt)}{data.cached ? " · cached" : ""}</span>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Separate from papers and patents. {data.query ? <>Query: <span className="font-medium text-foreground">{data.query}</span></> : null}</p>
      {message && <p className="mt-2 text-xs" role="status" data-testid="text-web-evidence-message">{message}</p>}
      {onRefresh && <button type="button" className="mt-2 text-xs underline disabled:opacity-60" disabled={refreshing} onClick={onRefresh} data-testid="button-refresh-web-evidence">{refreshing ? "Checking again..." : "Check Internet evidence again"}</button>}
      {ok && <details className="group mt-3" data-testid="details-web-evidence">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium" data-testid="button-toggle-web-evidence">
          {data.results.length} Internet source{data.results.length === 1 ? "" : "s"}<ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
        </summary>
        <ol className="mt-2 space-y-2">{data.results.map((r, i) => {
          const url = safeUrl(r.url);
          return <li key={r.id || i} className="rounded border bg-card p-2" data-testid={`card-web-evidence-${i}`}>
            <p className="text-xs font-medium">{url ? <a href={url.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">{r.title}<ExternalLink className="h-3 w-3" /></a> : r.title}</p>
            <p className="font-mono text-[10px] text-muted-foreground">{[r.evidenceLevel || "Internet page", day(r.publishedAt)].filter(Boolean).join(" · ")}{url ? ` · ${url.hostname}` : ""}</p>
            {r.text && <p className="mt-1 line-clamp-3 text-xs">{r.text}</p>}
          </li>;
        })}</ol>
      </details>}
      <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground"><Info className="mt-0.5 h-3 w-3 shrink-0" />{LIMIT_NOTE}</p>
    </section>
  );
}

/** Live lookup for a submitted query. Pass "" to stay idle (never fetches on typing or empty mount). */
export function LiveWebEvidence({ q }: { q: string }) {
  const { userId, isLoaded } = useAuth();
  const query = q.trim();
  const validQ = query.length >= 3 && query.length <= 2000;
  const enabled = validQ && isLoaded && !!userId;
  const params = { q: query };
  const res = useGetWebEvidence(params, { query: {
    queryKey: [...getGetWebEvidenceQueryKey(params), { user: userId ?? null }] as unknown as ReturnType<typeof getGetWebEvidenceQueryKey>,
    enabled, staleTime: SIX_HOURS, gcTime: SIX_HOURS, retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false, refetchOnMount: false,
  } });
  if (!validQ || !isLoaded) return null;
  if (!userId) return <div className="rounded-md border p-4 text-xs" role="status" data-testid="status-web-evidence-signin"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Internet evidence</p><p className="mt-1">Sign in for Internet evidence. Paper and patent results do not depend on it.</p></div>;
  if (res.isLoading) return <div className="rounded-md border p-4" data-testid="status-web-evidence-loading"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Internet evidence</p><div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-muted" /><div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-muted" /></div>;
  if (res.isError || !res.data) return <div className="rounded-md border p-4 text-xs" role="status" data-testid="status-web-evidence-error">Internet evidence could not be loaded. Paper and patent results are unaffected. <button className="underline" onClick={() => void res.refetch()} data-testid="button-retry-web-evidence">Try again</button></div>;
  const canRefresh = res.data.status === "not_configured" || res.data.status === "unavailable" || res.data.status === "empty";
  return <WebEvidencePanel data={res.data} onRefresh={canRefresh ? () => void res.refetch() : undefined} refreshing={res.isFetching} />;
}

/** For saved items: renders persisted metadata.webEvidence only; never runs a new search. */
export function SavedWebEvidence({ metadata }: { metadata: unknown }) {
  const data = webEvidenceFrom(metadata);
  return data ? <WebEvidencePanel data={data} saved testId="panel-web-evidence-saved" /> : null;
}

/** For analyses: shows a label and limits note when sources include Internet-level evidence. Citations stay as-is. */
export function InternetSourcesNote({ sources, warnings = [] }: { sources: { evidenceLevel?: string | null }[]; warnings?: string[] }) {
  const n = sources.filter(s => /^internet/i.test(s.evidenceLevel ?? "")).length;
  // Surface Internet-search status warnings (e.g. missing key, provider failure) even when no web source was cited.
  const webWarnings = warnings.filter(w => /internet|web (evidence|search)|search provider/i.test(w));
  if (!n && !webWarnings.length) return null;
  if (!n) return <div className="mt-2 rounded border border-[hsl(var(--turmeric)/0.55)] bg-[hsl(var(--turmeric)/0.06)] px-3 py-2 text-[11px]" role="status" data-testid="text-internet-status-note">
    <p className="flex items-center gap-1.5 font-medium"><Globe className="h-3 w-3" />Internet evidence: none cited</p>
    <ul className="mt-1 list-disc pl-4">{webWarnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
  </div>;
  return <p className="mt-2 flex items-start gap-1.5 rounded border border-[hsl(var(--turmeric)/0.55)] bg-[hsl(var(--turmeric)/0.06)] px-3 py-2 text-[11px]" role="note" data-testid="text-internet-sources-note">
    <Globe className="mt-0.5 h-3 w-3 shrink-0" />{n} of {sources.length} cited source{sources.length === 1 ? " is" : "s are"} labelled Internet evidence, not papers or patents. {webWarnings.join(" ")} {LIMIT_NOTE}
  </p>;
}
