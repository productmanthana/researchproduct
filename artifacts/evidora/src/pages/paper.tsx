import { useState } from "react";
import { Link, useParams } from "wouter";
import { useGetPaper, getGetPaperQueryKey, useGetRelatedPapers, getGetRelatedPapersQueryKey, type GetRelatedPapersKind } from "@workspace/api-client-react";
import { ArrowLeft, ExternalLink, FileText, Quote, Unlock } from "lucide-react";
import { PaperRow, SavePaperButton, SelectToggle, useSavedIds } from "@/components/paper-row";
import { EmptyState, ErrorState, RowSkeleton } from "@/components/states";
import { evidenceTone, num } from "@/lib/format";

const TABS: { k: GetRelatedPapersKind; label: string }[] = [
  { k: "references", label: "References" },
  { k: "citedBy", label: "Cited by" },
  { k: "similar", label: "Similar" },
];

export default function PaperPage() {
  const { id = "" } = useParams<{ id: string }>();
  const paperId = decodeURIComponent(id);
  const [kind, setKind] = useState<GetRelatedPapersKind>("references");
  const paper = useGetPaper(paperId, { query: { enabled: !!paperId, queryKey: getGetPaperQueryKey(paperId) } });
  const relParams = { kind };
  const related = useGetRelatedPapers(paperId, relParams, { query: { enabled: !!paperId, queryKey: getGetRelatedPapersQueryKey(paperId, relParams) } });
  const saved = useSavedIds();

  if (paper.isLoading) return <RowSkeleton rows={3} />;
  if (paper.isError || !paper.data) return <ErrorState error={paper.error} onRetry={() => paper.refetch()} title="Paper not found or source unavailable" />;
  const p = paper.data;

  const meta: [string, string][] = [
    ["Year", p.year ? String(p.year) : "-"],
    ["Venue", p.venue || "-"],
    ["Publisher", p.publisher || "-"],
    ["DOI", p.doi || "-"],
    ["Field", p.field || "-"],
    ["Licence", p.license || "Not stated"],
    ["Indexed via", p.sources?.join(", ") || "-"],
  ];

  return (
    <div>
      <button onClick={() => history.back()} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground" data-testid="button-back">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
        <div className="rise">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {p.evidenceLevel && <span className={`rounded border px-2 py-0.5 ${evidenceTone(p.evidenceLevel)}`}>{p.evidenceLevel}</span>}
            {p.isOa && (
              <span className="inline-flex items-center gap-1 rounded border border-[hsl(var(--leaf)/0.35)] px-2 py-0.5 text-leaf">
                <Unlock className="h-3 w-3" /> Open access
              </span>
            )}
            <span className="inline-flex items-center gap-1 font-mono text-muted-foreground">
              <Quote className="h-3 w-3" /> {num(p.citations)} citations
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight md:text-[2.5rem]" data-testid="text-paper-title">
            {p.title}
          </h1>
          <p className="mt-3 text-[15px] text-muted-foreground">{p.authors.join(", ") || "Unknown authors"}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <SelectToggle paper={p} />
            <SavePaperButton paper={p} saved={saved.has(p.id)} />
            {p.pdfUrl && (
              <a href={p.pdfUrl} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs hover:border-foreground/40" data-testid="link-paper-pdf">
                <FileText className="h-3.5 w-3.5" /> PDF
              </a>
            )}
            {p.url && (
              <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs hover:border-foreground/40" data-testid="link-paper-url">
                <ExternalLink className="h-3.5 w-3.5" /> Publisher page
              </a>
            )}
          </div>
          <section className="mt-8">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-vermilion">Abstract</h2>
            <p className="mt-3 max-w-[70ch] text-[15.5px] leading-[1.75]" data-testid="text-abstract">
              {p.abstract || "No abstract was provided by the indexing source."}
            </p>
          </section>
        </div>
        <aside className="rise h-fit rounded-md border bg-card" style={{ animationDelay: "100ms" }}>
          <dl className="divide-y text-sm">
            {meta.map(([k, v]) => (
              <div key={k} className="px-4 py-2.5">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{k}</dt>
                <dd className="mt-0.5 break-words">
                  {k === "DOI" && p.doi ? (
                    <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-primary hover:underline">
                      {p.doi}
                    </a>
                  ) : (
                    v
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>

      <section className="mt-14">
        <div className="mb-4 flex gap-1 border-b">
          {TABS.map((t) => (
            <button
              key={t.k}
              onClick={() => setKind(t.k)}
              className={`relative px-4 py-2.5 text-sm transition-colors ${kind === t.k ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              data-testid={`tab-related-${t.k}`}
            >
              {t.label}
              <span className={`absolute inset-x-2 -bottom-px h-0.5 origin-left bg-vermilion transition-transform ${kind === t.k ? "scale-x-100" : "scale-x-0"}`} />
            </button>
          ))}
        </div>
        {related.isLoading ? (
          <RowSkeleton rows={4} />
        ) : related.isError ? (
          <ErrorState error={related.error} onRetry={() => related.refetch()} />
        ) : !related.data?.papers.length ? (
          <EmptyState icon={<Quote className="h-5 w-5" />} title="No linked papers found" body="The indexing sources returned nothing for this relation. Coverage of references and citations varies by publisher." />
        ) : (
          <>
            {related.data.warnings.map((w) => (
              <p key={w} className="mb-3 rounded border border-[hsl(var(--turmeric)/0.6)] bg-[hsl(var(--turmeric)/0.12)] px-3 py-2 text-sm">{w}</p>
            ))}
            <div className="divide-y overflow-hidden rounded-md border">
              {related.data.papers.map((rp) => <PaperRow key={rp.id} paper={rp} saved={saved.has(rp.id)} compact />)}
            </div>
          </>
        )}
      </section>
      <p className="mt-10 text-xs text-muted-foreground">
        Metadata comes from public indexes and may be incomplete. <Link href="/sources" className="underline">See source status</Link>.
      </p>
    </div>
  );
}
