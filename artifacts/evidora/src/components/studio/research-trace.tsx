import { useEffect, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import "./research-trace.css";

export type TraceStep = { id: string; label: string; detail?: string; status: "active" | "done"; startedAt: string; endedAt?: string };
export type StudioTrace = {
  steps: TraceStep[]; startedAt: string; finishedAt?: string;
  counters: { found?: number; relevant?: number; cited?: number; originalPercent?: number; humanScore?: number };
};

export function traceOf(metadata: unknown): StudioTrace | null {
  const t = (metadata as { trace?: StudioTrace } | null | undefined)?.trace;
  return t && Array.isArray(t.steps) ? t : null;
}

const ms = (a: string, b: number) => Math.max(0, b - new Date(a).getTime());
function duration(value: number) {
  const s = Math.round(value / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

function useNow(running: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [running]);
  return now;
}

function Counter({ label, value, tone }: { label: string; value?: number | string; tone?: "ok" | "bad" }) {
  return (
    <div className="rt-counter" data-testid={`trace-counter-${label.toLowerCase()}`}>
      <span key={String(value)} className={`rt-num ${tone ?? ""}`}>{value ?? "—"}</span>
      <span className="rt-label">{label}</span>
    </div>
  );
}

/**
 * Live record of what the writer is doing, one line per real step with its own timer.
 * While working it shows every step; once finished it collapses to one summary row.
 * `liveDetail` adds the section currently streaming during the writing step.
 */
export function ResearchTrace({ trace, working, liveDetail, exportLocked }: { trace: StudioTrace; working: boolean; liveDetail?: string | null; exportLocked?: boolean }) {
  const now = useNow(working);
  const [open, setOpen] = useState(working);
  useEffect(() => { if (working) setOpen(true); }, [working]);
  const c = trace.counters ?? {};
  const finished = !working && !!trace.finishedAt;
  const total = duration(ms(trace.startedAt, trace.finishedAt ? new Date(trace.finishedAt).getTime() : now));
  const active = trace.steps.find(s => s.status === "active");
  const ratio = (v: number | undefined, target: number) => (typeof v === "number" ? (v >= target ? "ok" : "bad") : undefined);

  return (
    <section className={`rt ${finished ? "rt-finished" : ""}`} aria-label="Research trace" data-testid="research-trace">
      <div className="rt-counters">
        <Counter label="Found" value={c.found?.toLocaleString("en")} />
        <Counter label="Relevant" value={c.relevant} />
        <Counter label="Cited" value={c.cited} />
        <Counter label="Original" value={typeof c.originalPercent === "number" ? `${c.originalPercent}%` : undefined} tone={ratio(c.originalPercent, 99)} />
        <Counter label="Human" value={typeof c.humanScore === "number" ? `${Math.round(c.humanScore)}%` : undefined} tone={ratio(c.humanScore, 99)} />
      </div>
      <button type="button" className="rt-head" onClick={() => setOpen(o => !o)} aria-expanded={open} data-testid="button-trace-toggle">
        {finished
          ? <><Check className="h-4 w-4 text-[hsl(158_45%_32%)]" /><span data-testid="text-trace-finish">Done in {total}
              {typeof c.originalPercent === "number" ? ` · ${c.originalPercent}% original` : ""}
              {exportLocked !== undefined ? ` · export ${exportLocked ? "locked" : "unlocked"}` : ""}</span></>
          : <><Loader2 className="h-4 w-4 animate-spin" /><span className="rt-working">{active?.label ?? "Working"}</span><span className="rt-time">{total}</span></>}
        <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ol className="rt-steps" aria-live="polite">
          {trace.steps.map(s => {
            const live = s.status === "active" && working;
            const detail = live && /^Writing the draft/.test(s.label) && liveDetail ? liveDetail : s.detail;
            return (
              <li key={s.id} className={`rt-step ${live ? "active" : "done"}`} data-testid={`trace-step-${s.id}`}>
                {live ? <Loader2 className="rt-icon animate-spin" /> : <Check className="rt-icon" />}
                <span className="rt-text">{s.label}{detail && <span className="rt-detail"> · {detail}</span>}</span>
                <span className="rt-time">{duration(ms(s.startedAt, s.endedAt ? new Date(s.endedAt).getTime() : now))}{live && " ⏱"}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
