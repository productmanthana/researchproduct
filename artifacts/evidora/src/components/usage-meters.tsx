import type { Usage } from "@workspace/api-client-react";

function Meter({ label, used, limit, dark }: { label: string; used: number; limit: number; dark?: boolean }) {
  const unlimited = limit < 0;
  const pct = unlimited ? 0 : limit > 0 ? Math.min(100, (used / limit) * 100) : 100;
  const out = !unlimited && used >= limit;
  return (
    <div data-testid={`meter-${label.toLowerCase()}`}>
      <div className="flex items-baseline justify-between text-xs">
        <span className={dark ? "text-[hsl(40_30%_80%)]" : "text-muted-foreground"}>{label}</span>
        <span className={`font-mono ${out ? "text-vermilion" : ""}`}>
          {unlimited ? `${used} · Unlimited` : `${used}/${limit}`}
        </span>
      </div>
      <div className={`mt-1 h-1.5 overflow-hidden rounded-full ${dark ? "bg-[hsl(214_35%_28%)]" : "bg-muted"}`}>
        <div
          className={`h-full origin-left rounded-full transition-transform duration-700 ${out ? "bg-vermilion" : dark ? "bg-turmeric" : "bg-primary"}`}
          style={{ width: "100%", transform: `scaleX(${pct / 100})` }}
        />
      </div>
      {out && <p className="mt-1 text-xs text-vermilion">Limit reached</p>}
    </div>
  );
}

export function UsageMeters({ usage, dark }: { usage: Usage; dark?: boolean }) {
  return (
    <div className="space-y-2.5">
      <Meter label="Answers" used={usage.answersUsed} limit={usage.answersLimit} dark={dark} />
      <Meter label="Reviews" used={usage.reviewsUsed} limit={usage.reviewsLimit} dark={dark} />
      <Meter label="Images" used={usage.imagesUsed} limit={usage.imagesLimit} dark={dark} />
    </div>
  );
}
