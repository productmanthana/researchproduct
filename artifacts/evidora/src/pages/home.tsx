import { useState } from "react";
import { Link } from "wouter";
import { useSearchPapers, getSearchPapersQueryKey } from "@workspace/api-client-react";
import { ArrowRight, FileSearch, Image as ImageIcon, Layers, Search, ShieldCheck, TriangleAlert } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { PaperRow, useSavedIds } from "@/components/paper-row";
import { ErrorState, RowSkeleton } from "@/components/states";
import { num } from "@/lib/format";

const EXAMPLES = ["perovskite solar cell stability", "graph neural networks for power grids", "low-cost water desalination membranes", "LoRa mesh agricultural sensing"];

export default function Home() {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const params = { q };
  const search = useSearchPapers(params, { query: { enabled: q.length > 1, queryKey: getSearchPapersQueryKey(params) } });
  const saved = useSavedIds();

  const run = (v: string) => {
    setInput(v);
    setQ(v.trim());
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      <section className="blueprint relative overflow-hidden text-[hsl(40_30%_93%)]">
        <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
          <Wordmark light />
          <div className="flex items-center gap-1 text-sm md:gap-3">
            <Link href="/sources" className="hidden px-2 py-1 text-[hsl(40_20%_80%)] hover:text-white sm:block" data-testid="link-home-sources">
              Sources
            </Link>
            <Link href="/plans" className="hidden px-2 py-1 text-[hsl(40_20%_80%)] hover:text-white sm:block" data-testid="link-home-plans">
              Plans
            </Link>
            <Link href="/sign-in" className="px-3 py-1.5 text-[hsl(40_20%_85%)] hover:text-white" data-testid="link-home-signin">
              Sign in
            </Link>
            <Link href="/sign-up" className="press rounded-md bg-turmeric px-3.5 py-1.5 font-medium text-[hsl(216_42%_13%)]" data-testid="link-home-signup">
              Start free
            </Link>
          </div>
        </nav>
        <div className="relative z-10 mx-auto max-w-6xl px-5 pb-20 pt-12 md:px-8 md:pb-28 md:pt-20">
          <p className="rise font-mono text-xs uppercase tracking-[0.22em] text-turmeric">Research companion &middot; for engineering students and scholars in India</p>
          <h1 className="rise mt-5 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-7xl" style={{ animationDelay: "80ms" }}>
            Every claim should
            <br />
            point to a <span className="italic text-turmeric">page</span>.
          </h1>
          <p className="rise mt-6 max-w-2xl text-base leading-relaxed text-[hsl(40_20%_80%)] md:text-lg" style={{ animationDelay: "160ms" }}>
            Evidora searches open scholarly indexes, keeps your papers and PDFs in one private desk, and writes answers that quote the source they came from. When the evidence is thin, it says so.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(input);
            }}
            className="rise mt-10 flex max-w-3xl items-center gap-2 rounded-lg bg-[hsl(42_33%_96%)] p-2 shadow-2xl"
            style={{ animationDelay: "240ms" }}
          >
            <Search className="ml-3 h-5 w-5 shrink-0 text-[hsl(216_14%_45%)]" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search papers by topic, method or DOI"
              className="min-w-0 flex-1 bg-transparent px-2 py-3 text-base text-[hsl(216_42%_15%)] outline-none placeholder:text-[hsl(216_14%_55%)]"
              data-testid="input-home-search"
            />
            <button type="submit" className="press rounded-md bg-vermilion px-5 py-3 text-sm font-medium text-white" data-testid="button-home-search">
              Search
            </button>
          </form>
          <div className="rise mt-4 flex flex-wrap gap-2 text-xs" style={{ animationDelay: "300ms" }}>
            <span className="text-[hsl(40_20%_70%)]">Try</span>
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => run(ex)} className="rounded-full border border-[hsl(40_30%_90%/0.25)] px-3 py-1 text-[hsl(40_20%_85%)] transition-colors hover:border-turmeric hover:text-turmeric" data-testid={`button-example-${ex.split(" ")[0]}`}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      </section>

      {q && (
        <section className="mx-auto max-w-6xl px-5 py-12 md:px-8" data-testid="section-home-results">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-semibold">
              Results for <span className="mark">{q}</span>
            </h2>
            {search.data && (
              <p className="font-mono text-xs text-muted-foreground">
                {num(search.data.total)} unique papers on this page &middot; {search.data.duplicatesRemoved} duplicates merged
              </p>
            )}
          </div>
          {search.data?.warnings?.map((w) => (
            <p key={w} className="mb-3 flex items-center gap-2 rounded border border-[hsl(var(--turmeric)/0.6)] bg-[hsl(var(--turmeric)/0.12)] px-3 py-2 text-sm">
              <TriangleAlert className="h-4 w-4 text-[hsl(30_70%_35%)]" /> {w}
            </p>
          ))}
          {search.isLoading ? (
            <RowSkeleton rows={4} />
          ) : search.isError ? (
            <ErrorState error={search.error} onRetry={() => search.refetch()} title="Search failed" />
          ) : search.data && search.data.papers.length === 0 ? (
            <p className="rounded-md border border-dashed p-8 text-center text-muted-foreground">No papers matched. Try broader terms or a different phrasing.</p>
          ) : (
            <div className="divide-y overflow-hidden rounded-md border">
              {search.data?.papers.slice(0, 8).map((p, i) => <PaperRow key={p.id} paper={p} saved={saved.has(p.id)} index={i + 1} />)}
            </div>
          )}
          <Link href={`/discover?q=${encodeURIComponent(q)}`} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline" data-testid="link-open-discover">
            Open in Discover with filters <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <div className="grid gap-12 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-vermilion">How an answer is built</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">A claim is only as good as the quote behind it.</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              You choose the papers or upload your own PDFs. Evidora reads only those, then returns each claim with the exact passage and page it rests on. Unsupported statements are flagged rather than smoothed over.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-lg">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Claim 02</p>
            <p className="mt-2 font-display text-lg leading-snug">Your answer appears here as a short, checkable statement.</p>
            <div className="mt-4 border-l-2 border-turmeric pl-4">
              <p className="text-sm italic text-foreground/80">The supporting passage is quoted directly from the paper you selected, not paraphrased from memory.</p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">source &rarr; page number when available</p>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded bg-[hsl(var(--vermilion)/0.07)] p-3 text-xs text-vermilion">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Warnings surface gaps: missing full text, too few sources, or conflicting results.
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-6xl gap-px bg-border md:grid-cols-[1.3fr_1fr_1fr]">
          {[
            { icon: FileSearch, k: "Evidence answer", t: "Ask a focused question against up to 10 selected papers or your PDFs. Each claim carries its quote." },
            { icon: Layers, k: "Literature review", t: "Pick 10 to 50 papers and get a structured synthesis you can edit and export as Markdown or DOCX, IEEE or APA." },
            { icon: ImageIcon, k: "Figure reading", t: "Upload a screenshot of a plot, table or circuit and ask what it shows. The original image is analysed, not a description of it." },
          ].map((f) => (
            <div key={f.k} className="bg-card p-8">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-xl font-semibold">{f.k}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.t}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <ShieldCheck className="h-7 w-7 text-leaf" />
            <h2 className="mt-4 text-3xl font-semibold">What we will not pretend</h2>
          </div>
          <ul className="space-y-4 text-sm leading-relaxed">
            {[
              "Search queries live scholarly indexes. We do not host a private copy of the world's literature.",
              "AI output can be wrong. Quotes and page numbers are there so you can check every line.",
              "Uploaded files stay private to your account. Research uses the files you select and PDFs you link to the selected papers.",
              "When a source is partially down, you will see a warning on the results, not silently fewer papers.",
            ].map((t, i) => (
              <li key={i} className="flex gap-4 border-b pb-4">
                <span className="font-mono text-xs text-vermilion">0{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid-paper border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-16 md:flex-row md:items-center md:px-8">
          <div>
            <h2 className="text-3xl font-semibold">Start with a free trial allowance.</h2>
            <p className="mt-2 text-muted-foreground">New accounts get 3 answers, 1 review and 2 figure readings. Monthly plans from {"\u20B9"}499.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/sign-up" className="press rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground" data-testid="link-cta-signup">
              Create account
            </Link>
            <Link href="/plans" className="rounded-md border bg-card px-5 py-2.5 text-sm font-medium" data-testid="link-cta-plans">
              See plans
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm md:flex-row md:items-center md:justify-between md:px-8">
          <Wordmark light />
          <div className="flex flex-wrap gap-5 text-sidebar-foreground/70">
            <Link href="/discover" className="hover:text-white">Discover</Link>
            <Link href="/landscape" className="hover:text-white">Landscape</Link>
            <Link href="/sources" className="hover:text-white">Sources and licences</Link>
            <Link href="/plans" className="hover:text-white">Plans</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
