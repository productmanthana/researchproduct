import { useEffect, useState } from "react";
import { Radio } from "lucide-react";

export type ActivityEntry = { line: string; at: number };

/** Ticks once a second while a job is live so elapsed/relative times stay honest. */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

function clock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function ago(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 4) return "now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ${String(s % 60).padStart(2, "0")}s ago` : `${Math.floor(m / 60)}h ago`;
}

/**
 * Live activity strip: only values the app really has — the stages the server reported,
 * how long the current one has been running, and the draft text as it arrives.
 */
export function AgentActivity({ log, since, preview, live }: { log: ActivityEntry[]; since: number; preview?: string; live: boolean }) {
  const now = useNow(live);
  const stream = (preview ?? "").trim();
  const tail = stream.slice(-200);
  const entries = log.slice(-3).reverse();
  return (
    <section className="ap-live" aria-label="Agent activity" data-testid="panel-agent-activity">
      <div className="ap-live-head">
        <span className={`ap-live-badge ${live ? "is-on" : ""}`}><i aria-hidden />{live ? "Live" : "Reported"}</span>
        {live && <span className="ap-live-clock" data-testid="text-agent-elapsed"><Radio aria-hidden />{clock(now - since)}</span>}
        {stream.length > 0 && <span className="ap-live-count" data-testid="text-agent-streamed">{stream.length.toLocaleString()} characters received</span>}
      </div>
      <ol className="ap-live-log" aria-live="polite" aria-atomic="false">
        {entries.map((e, i) => (
          <li key={`${e.at}-${e.line.slice(0, 24)}`} className={i === 0 ? "is-current" : ""}>
            <span className="ap-live-time">{ago(now - e.at)}</span>
            <span className="ap-live-line">{e.line}</span>
          </li>
        ))}
        {entries.length === 0 && <li className="is-current"><span className="ap-live-time">now</span><span className="ap-live-line">Preparing this step</span></li>}
      </ol>
      {tail && (
        <p className="ap-live-stream" data-testid="text-agent-stream">
          <span aria-hidden>“</span>{tail}<i className="ap-caret" aria-hidden />
        </p>
      )}
    </section>
  );
}
