import { useState } from "react";
import { useGetLandscape, getGetLandscapeQueryKey } from "@workspace/api-client-react";
import { Info, LineChart } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, PageHeader, RowSkeleton } from "@/components/states";

function Ranked({ title, items }: { title: string; items: { name: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="rounded-md border bg-card p-4">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{title}</p>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">None in sample.</p> : (
        <ul className="space-y-2">
          {items.slice(0, 8).map((i) => (
            <li key={i.name} className="text-sm">
              <div className="flex justify-between gap-2"><span className="truncate">{i.name}</span><span className="font-mono text-xs">{i.count}</span></div>
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
      <PageHeader kicker="Sample summary" title="Topic landscape" />
      <form onSubmit={(e) => { e.preventDefault(); setQ(input.trim()); }} className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. microgrid frequency control" className="h-11 bg-card" data-testid="input-landscape" />
        <Button type="submit" className="h-11 px-6" data-testid="button-landscape">Summarise</Button>
      </form>
      <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Built from a small sample of top search results, not the whole literature. Use it to orient, not to make claims about a field.</p>
      <div className="mt-8">
        {!q ? (
          <EmptyState icon={<LineChart className="h-5 w-5" />} title="Get a quick lay of the land" body="See which years, venues, authors and fields dominate a sample of results for your topic." />
        ) : l.isLoading ? <RowSkeleton rows={3} /> : l.isError || !l.data ? <ErrorState error={l.error} onRetry={() => l.refetch()} /> : (
          <div className="space-y-5 rise">
            <div className="rounded-md border border-[hsl(var(--turmeric)/0.6)] bg-[hsl(var(--turmeric)/0.12)] px-4 py-3 text-sm" data-testid="text-landscape-notice">
              <span className="font-medium">Sample of {l.data.sampleSize} papers for &ldquo;{l.data.query}&rdquo;.</span> {l.data.notice}
            </div>
            <div className="rounded-md border bg-card p-4">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Papers per year (sample)</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...l.data.years].sort((a, b) => a.year - b.year)}>
                    <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} stroke="hsl(216 14% 55%)" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(216 14% 55%)" width={28} />
                    <Tooltip cursor={{ fill: "hsl(43 85% 58% / 0.15)" }} contentStyle={{ borderRadius: 6, fontSize: 12 }} />
                    <Bar dataKey="count" fill="hsl(208 68% 31%)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Ranked title="Venues" items={l.data.venues} />
              <Ranked title="Authors" items={l.data.authors} />
              <Ranked title="Fields" items={l.data.fields} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
