import { useState } from "react";
import { useGetLandscape, getGetLandscapeQueryKey } from "@workspace/api-client-react";
import { Info, LineChart } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ago, num } from "@/lib/format";
import { EmptyState, ErrorState, PageHeader, RowSkeleton } from "@/components/states";

function Ranked({ title, items }: { title: string; items: { name: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="rounded-md border bg-card p-4">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{title}</p>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">Not available for this query.</p> : (
        <ul className="space-y-2">
          {items.slice(0, 8).map((i) => (
            <li key={i.name} className="text-sm">
              <div className="flex justify-between gap-2"><span className="truncate">{i.name}</span><span className="font-mono text-xs">{num(i.count)}</span></div>
              <div className="mt-1 h-1 rounded bg-muted"><div className="h-full origin-left rounded bg-primary transition-transform duration-700" style={{ transform: `scaleX(${i.count / max})` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Landscape() {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const params = { q };
  const l = useGetLandscape(params, { query: { enabled: q.length > 1, queryKey: getGetLandscapeQueryKey(params) } });
  return (
    <>
      <PageHeader kicker="OpenAlex aggregate" title="Topic landscape" />
      <form onSubmit={(e) => { e.preventDefault(); setQ(input.trim()); }} className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. microgrid frequency control" className="h-11 bg-card" data-testid="input-landscape" />
        <Button type="submit" className="h-11 px-6" data-testid="button-landscape">Summarise</Button>
      </form>
      <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Counts are aggregated by OpenAlex across every work matching your query, not a sample. Coverage reflects what OpenAlex indexes, so treat figures as orientation, not a census of the field.</p>
      <div className="mt-8">
        {!q ? (
          <EmptyState icon={<LineChart className="h-5 w-5" />} title="Get a quick lay of the land" body="See which years, venues, authors and fields dominate all OpenAlex works matching your topic, and how India contributes." />
        ) : l.isLoading ? <RowSkeleton rows={3} /> : l.isError || !l.data ? <ErrorState error={l.error} onRetry={() => l.refetch()} /> : (
          <div className="space-y-5 rise">
            <div className="rounded-md border border-[hsl(var(--turmeric)/0.6)] bg-[hsl(var(--turmeric)/0.12)] px-4 py-3 text-sm" data-testid="text-landscape-notice">
              <span className="font-medium">&ldquo;{l.data.query}&rdquo;{l.data.scope ? ` \u00B7 ${l.data.scope}` : ""}.</span> {l.data.notice}
              {l.data.updatedAt && <span className="ml-1 font-mono text-[11px] text-muted-foreground">Updated {ago(l.data.updatedAt)}</span>}
            </div>
            <div className="grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-3" data-testid="section-landscape-stats">
              <div className="bg-card p-4"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Matching works</p><p className="mt-1 font-display text-3xl font-semibold" data-testid="text-total-works">{l.data.totalWorks != null ? num(l.data.totalWorks) : <span className="text-base text-muted-foreground">Unavailable</span>}</p></div>
              <div className="bg-card p-4"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">With an India-affiliated author</p><p className="mt-1 font-display text-3xl font-semibold" data-testid="text-india-count">{l.data.indiaCount != null ? num(l.data.indiaCount) : <span className="text-base text-muted-foreground">Unavailable</span>}</p></div>
              <div className="bg-card p-4"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">India share</p><p className="mt-1 font-display text-3xl font-semibold text-vermilion" data-testid="text-india-share">{l.data.indiaShare != null ? `${l.data.indiaShare.toFixed(1)}%` : <span className="text-base text-muted-foreground">Unavailable</span>}</p></div>
            </div>
            <div className="rounded-md border bg-card p-4">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Works per year</p>
              {l.data.years.length === 0 ? <p className="text-sm text-muted-foreground">Year breakdown unavailable.</p> : <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...l.data.years].sort((a, b) => a.year - b.year)}>
                    <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} stroke="hsl(216 14% 55%)" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(216 14% 55%)" width={48} tickFormatter={(v: number) => num(v)} />
                    <Tooltip cursor={{ fill: "hsl(43 85% 58% / 0.15)" }} contentStyle={{ borderRadius: 6, fontSize: 12 }} />
                    <Bar dataKey="count" fill="hsl(208 68% 31%)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Ranked title="Venues" items={l.data.venues} />
              <Ranked title="Authors" items={l.data.authors} />
              <Ranked title="Fields" items={l.data.fields} />
              <Ranked title="Institutions" items={l.data.institutions ?? []} />
            </div>
            <div className="rounded-md border bg-card" data-testid="section-keywords">
              <p className="border-b px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Keyword shift: recent vs earlier works</p>
              {!l.data.keywords?.length ? <p className="p-4 text-sm text-muted-foreground">Keyword trends unavailable for this query.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><tr><th className="px-4 py-2">Keyword</th><th className="px-4 py-2 text-right">Recent</th><th className="px-4 py-2 text-right">Earlier</th><th className="px-4 py-2 text-right">Change</th></tr></thead>
                    <tbody className="divide-y">
                      {l.data.keywords.map((k) => (
                        <tr key={k.name} data-testid={`row-keyword-${k.name}`}>
                          <td className="px-4 py-2">{k.name}</td>
                          <td className="px-4 py-2 text-right font-mono text-xs">{num(k.recentCount)} <span className="text-muted-foreground">({k.recentShare.toFixed(1)}%)</span></td>
                          <td className="px-4 py-2 text-right font-mono text-xs">{num(k.earlierCount)} <span className="text-muted-foreground">({k.earlierShare.toFixed(1)}%)</span></td>
                          <td className={`px-4 py-2 text-right font-mono text-xs ${k.changePoints > 0 ? "text-leaf" : k.changePoints < 0 ? "text-vermilion" : ""}`}>{k.changePoints > 0 ? "+" : ""}{k.changePoints.toFixed(1)} pts</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="border-t px-4 py-2 text-xs text-muted-foreground">Shares are percent of works in each period. Change is in percentage points.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
