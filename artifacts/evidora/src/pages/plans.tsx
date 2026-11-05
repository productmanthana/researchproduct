import { useUser } from "@clerk/react";
import { useGetPlans, getGetPlansQueryKey, useGetUsage, getGetUsageQueryKey } from "@workspace/api-client-react";
import { Info } from "lucide-react";
import { UsageMeters } from "@/components/usage-meters";
import { ErrorState, PageHeader, RowSkeleton } from "@/components/states";
import { inr } from "@/lib/format";

export default function Plans() {
  const { isSignedIn } = useUser();
  const plans = useGetPlans({ query: { queryKey: getGetPlansQueryKey() } });
  const usage = useGetUsage({ query: { enabled: !!isSignedIn, queryKey: getGetUsageQueryKey() } });
  const u = usage.data;

  return (
    <>
      <PageHeader kicker="Pricing in INR" title="Plans and usage" />
      {u && (
        <section className="mb-10 grid gap-6 rounded-lg border bg-card p-6 md:grid-cols-[1fr_320px]" data-testid="section-usage">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-vermilion">Your allowance</p>
            <h2 className="mt-1 text-2xl font-semibold capitalize">{u.plan}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {u.period === "starter" ? "Starter trial. A one-time lifetime allowance; it does not reset monthly." : `Current monthly period: ${u.period}.`}
            </p>
          </div>
          <UsageMeters usage={u} />
        </section>
      )}
      {plans.isLoading ? <RowSkeleton rows={2} /> : plans.isError ? <ErrorState error={plans.error} onRetry={() => plans.refetch()} /> : (
        <div className="grid gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-3">
          {(plans.data ?? []).map((p, i) => {
            const current = u && u.plan.toLowerCase() === p.name.toLowerCase();
            return (
              <div key={p.id} className={`relative bg-card p-7 ${i === 1 ? "md:bg-[hsl(var(--accent)/0.35)]" : ""}`} data-testid={`card-plan-${p.id}`}>
                {current && <span className="absolute right-4 top-4 rounded bg-leaf px-2 py-0.5 text-[11px] text-white">Current</span>}
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{p.name}</p>
                <p className="mt-3 font-display text-4xl font-semibold">{inr(p.priceInr)}<span className="text-base font-normal text-muted-foreground"> / month</span></p>
                <dl className="mt-6 space-y-2 text-sm">
                  {[["Evidence answers", p.answers], ["Literature reviews", p.reviews], ["Figure readings", p.images]].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between border-b pb-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-mono">{v}</dd></div>
                  ))}
                </dl>
                <button disabled className="mt-6 w-full cursor-not-allowed rounded-md border py-2 text-sm text-muted-foreground" data-testid={`button-plan-${p.id}`}>
                  Upgrades not yet available
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-6 space-y-2 text-sm text-muted-foreground">
        <p className="flex gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0" /> Online payments are not enabled yet, so plans cannot be purchased or switched from here. Usage shown above comes directly from your account.</p>
        <p className="pl-6">Every plan uses the same model (GPT-4.1). Higher plans give more runs, not a different quality of answer.</p>
        <p className="pl-6">New accounts start with a lifetime trial of 3 answers, 1 review and 2 figure readings.</p>
      </div>
    </>
  );
}
