import { useEffect, useState } from "react";
import type { StudioItem } from "@workspace/api-client-react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { studioWorkflow } from "@/lib/agent-workflow";
import "./finishing-dialog.css";

/** Steps that run after the live text has finished streaming. */
const AFTER_WRITING = ["review", "authorship", "figures", "originality"];

const PHRASES: Record<string, string[]> = {
  review: ["Checking every claim", "Matching citations to sources", "Verifying references"],
  authorship: ["Refining sentence rhythm", "Polishing the academic voice", "Removing stock phrasing"],
  figures: ["Preparing figures", "Checking figure placement", "Labelling diagrams"],
  originality: ["Scanning scholarly indexes", "Comparing against the web", "Rewriting any shared wording"],
};

/** Items seen in the finishing phase, so the "ready" state survives the workspace swapping views on completion. */
const seenFinishing = new Set<string>();
const dismissed = new Set<string>();

function RotatingWords({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
    const t = window.setInterval(() => setI(n => (n + 1) % words.length), 2200);
    return () => window.clearInterval(t);
  }, [words]);
  return <span key={`${words[0]}-${i}`} className="fd-word">{words[i]}…</span>;
}

/**
 * Appears as soon as live writing ends and the draft moves into checking, so a
 * paused stream never reads as "done". Shows each post-writing agent step and a
 * clear "ready" state when the server reports completion.
 */
export function FinishingDialog({ item }: { item: StudioItem }) {
  const working = item.status === "queued" || item.status === "running";
  const job = working ? studioWorkflow(item) : null;
  const finishing = !!job?.active && AFTER_WRITING.includes(job.active);
  if (finishing) seenFinishing.add(item.id);
  const justCompleted = item.status === "completed" && seenFinishing.has(item.id);
  const [, force] = useState(0);
  const close = () => { dismissed.add(item.id); seenFinishing.delete(item.id); force(n => n + 1); };

  useEffect(() => {
    if (!justCompleted) return;
    const t = window.setTimeout(close, 3500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justCompleted, item.id]);

  if (item.status === "failed") { seenFinishing.delete(item.id); return null; }
  if (dismissed.has(item.id) && !justCompleted) return null;
  if (!finishing && !justCompleted) return null;

  const steps = studioWorkflow({ ...item, status: "running" }).roles.filter(r => AFTER_WRITING.includes(r.id) && !job?.skipped?.[r.id]);
  const activeIndex = justCompleted ? steps.length : steps.findIndex(r => r.id === job?.active);

  return (
    <div className="fd-backdrop" role="dialog" aria-modal="false" aria-labelledby="fd-title" data-testid="dialog-finishing">
      <div className="fd-card">
        {!justCompleted && <button className="fd-close" onClick={close} aria-label="Hide" data-testid="button-finishing-hide"><X className="h-4 w-4" /></button>}
        <div className="fd-head">
          <span className={`fd-badge ${justCompleted ? "ok" : ""}`}>{justCompleted ? <Check className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}</span>
          <div>
            <p className="sx-eyebrow">{justCompleted ? "All checks passed" : "Writing completed"}</p>
            <h3 id="fd-title" className="sx-title text-xl">{justCompleted ? "Your draft is ready" : "Final checks in progress"}</h3>
          </div>
        </div>
        <p className="fd-live" aria-live="polite">
          {justCompleted ? "Opening the verified version…" : <RotatingWords words={PHRASES[job!.active!] ?? ["Working"]} />}
        </p>
        <ol className="fd-steps">
          <li className="fd-step done"><Check className="h-4 w-4" />Draft written</li>
          {steps.map((s, i) => {
            const state = i < activeIndex ? "done" : i === activeIndex ? "active" : "pending";
            return (
              <li key={s.id} className={`fd-step ${state}`} data-testid={`finishing-step-${s.id}`}>
                {state === "done" ? <Check className="h-4 w-4" /> : state === "active" ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="fd-dot" />}
                <span>{s.name}</span>
                <span className="fd-state">{state === "done" ? "Completed" : state === "active" ? "In progress" : "Waiting"}</span>
              </li>
            );
          })}
        </ol>
        {!justCompleted && <p className="fd-note">The text you see may still change. Export unlocks when these checks finish.</p>}
      </div>
    </div>
  );
}
