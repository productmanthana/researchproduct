import { pool } from "@workspace/db";

/**
 * A step-by-step record of what the writer actually did, saved with the draft.
 * Every line is reported by real work as it happens; nothing is simulated.
 */
export type TraceStep = { id: string; label: string; detail?: string; status: "active" | "done"; startedAt: string; endedAt?: string };
export type TraceCounters = { found?: number; relevant?: number; cited?: number; originalPercent?: number; humanScore?: number };
export type StudioTrace = { steps: TraceStep[]; counters: TraceCounters; startedAt: string; finishedAt?: string; summary?: string };

const now = () => new Date().toISOString();

export function createTrace(itemId: string) {
  const data: StudioTrace = { steps: [], counters: {}, startedAt: now() };
  let n = 0;
  let chain: Promise<unknown> = Promise.resolve();
  // Writes are chained so the saved trace never goes backwards; a failed write is not fatal.
  const save = () => {
    const snapshot = JSON.stringify({ trace: data });
    chain = chain.then(() => pool.query("UPDATE research_studio_items SET metadata=metadata||$2::jsonb WHERE id=$1 AND status='running'", [itemId, snapshot])).catch(() => {});
    return chain;
  };
  const start = (label: string, detail?: string) => {
    const step: TraceStep = { id: `s${++n}`, label, detail, status: "active", startedAt: now() };
    data.steps.push(step);
    void save();
    return {
      update(next: string) { step.detail = next; void save(); },
      done(doneLabel?: string, doneDetail?: string) {
        if (doneLabel) step.label = doneLabel;
        step.detail = doneDetail;
        step.status = "done"; step.endedAt = now();
        void save();
      },
    };
  };
  return {
    data,
    start,
    /** Runs `fn` as one step; the label returned by `doneLabel` describes what it found. */
    async step<T>(label: string, fn: () => Promise<T>, doneLabel?: (result: T) => string) {
      const s = start(label);
      const result = await fn();
      s.done(doneLabel?.(result));
      return result;
    },
    /** A step that already finished, timed from `since`. */
    record(label: string, since: string) {
      data.steps.push({ id: `s${++n}`, label, status: "done", startedAt: since, endedAt: now() });
      void save();
    },
    count(counters: TraceCounters) { Object.assign(data.counters, counters); void save(); },
    finish(summary: string) { data.finishedAt = now(); data.summary = summary; return save(); },
  };
}
export type Trace = ReturnType<typeof createTrace>;
