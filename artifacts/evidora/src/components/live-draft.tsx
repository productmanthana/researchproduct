import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useAgentProgressContext } from "@/components/agent-progress/provider";
import type { QueryKey } from "@tanstack/react-query";
import { useTypewriter } from "@/hooks/use-typewriter";
import { useLiveGeneration, type LiveKind, type LiveConnection } from "@/hooks/use-live-generation";
import "./live-draft.css";
import { AcademicAnswer } from "@/components/academic-answer";
import { authorshipStatusLine, liveStage, liveStatusLabel, stabilizeLiveMarkdown } from "@/lib/live-markdown";

const CONN_LABEL: Record<LiveConnection, string> = {
  idle: "", connecting: "Connecting to live draft", live: "Live", reconnecting: "Reconnecting; progress still refreshes",
  unavailable: "Live draft unavailable; progress still refreshes", done: "Finishing; loading the checked version",
};

const plain = (value: string) => value;

function scrollParent(el: HTMLElement | null): HTMLElement | Window {
  for (let n = el?.parentElement; n; n = n.parentElement) {
    const o = getComputedStyle(n).overflowY;
    if (o === "auto" || o === "scroll") return n;
  }
  return window;
}
const metrics = (s: HTMLElement | Window) => s instanceof Window
  ? { gap: document.documentElement.scrollHeight - window.scrollY - window.innerHeight }
  : { gap: s.scrollHeight - s.scrollTop - s.clientHeight };

/**
 * Renders the server's partial draft inline, formatted progressively from real SSE snapshots.
 * Before text arrives, `fallback` (honest progress) is shown. No actions are offered on partial text.
 */
export function LiveDraft({ kind, id, working, fallback, invalidate, testId, progressKey, presentation = "panel", onSection }: {
  kind: LiveKind; id: string; working: boolean; fallback: ReactNode; invalidate?: QueryKey[]; testId?: string;
  presentation?: "panel" | "chat";
  /** Reports the section heading currently being streamed, e.g. "Writing section 4 · Methodology". */
  onSection?: (line: string | null) => void;
  /** Shared progress popup job key; the streamed text is mirrored there as an optional preview. */
  progressKey?: string;
}) {
  const { draft, connection, snapshot } = useLiveGeneration(kind, id, { enabled: working, invalidate });
  const progress = useAgentProgressContext();
  const setPreview = progress?.setPreview;
  const registered = !!(progressKey && progress?.jobs[progressKey]);
  useEffect(() => { if (progressKey && registered && setPreview && working) setPreview(progressKey, draft, CONN_LABEL[connection]); }, [progressKey, registered, setPreview, working, draft, connection]);

  const headings = [...draft.matchAll(/^#{2,3}\s+(.+)$/gm)];
  const sectionLine = headings.length ? `Writing section ${headings.length} · ${headings[headings.length - 1][1].replace(/[*_`#]/g, "").trim()}` : null;
  useEffect(() => { onSection?.(sectionLine); }, [sectionLine, onSection]);

  const root = useRef<HTMLElement>(null);
  const follow = useRef(true);
  const [behind, setBehind] = useState(false);
  // Rewriting stages (authorship) send no tokens; count the elapsed time so the pause reads as work in progress.
  const liveProgress = snapshot?.progress ?? null;
  const authorship = working && liveProgress && /authorship/i.test(snapshot?.stage ?? "") ? liveProgress : null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!authorship) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [authorship?.since, !!authorship]);
  const typed = useTypewriter(draft, working);
  const text = stabilizeLiveMarkdown(typed);
  const hasText = !!text;

  useLayoutEffect(() => { follow.current = true; setBehind(false); }, [id]);
  useEffect(() => {
    if (!working || !root.current) return;
    const s = scrollParent(root.current);
    const on = () => { const near = metrics(s).gap < 120; follow.current = near; setBehind(!near); };
    on();
    s.addEventListener("scroll", on, { passive: true });
    return () => s.removeEventListener("scroll", on);
  }, [working, id]);
  useLayoutEffect(() => {
    if (!hasText || !follow.current || !root.current) return;
    const s = scrollParent(root.current);
    if (s instanceof Window) window.scrollTo({ top: document.documentElement.scrollHeight });
    else s.scrollTop = s.scrollHeight;
  }, [text, hasText]);
  const jump = () => {
    follow.current = true; setBehind(false);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    root.current?.scrollIntoView({ block: "end", behavior: reduce ? "auto" : "smooth" });
  };

  if (!working) return null;
  const stage = snapshot?.stage ?? "";
  const phase = liveStage(stage, connection, hasText);
  const label = authorship ? authorshipStatusLine(authorship, now) : liveStatusLabel(phase, stage, connection);
  const research = kind === "studio" || !["", "queued", "running", "planning"].includes(stage);
  const statusLine = <p className={`ld-status is-${phase}`} role="status" aria-live="polite" data-testid={`status-live-${id}`}><i aria-hidden />{label}</p>;

  return <section ref={root} className={`ld-live ld-${presentation}`} aria-label="Live draft, not yet checked" aria-busy="true" data-testid={testId ?? `panel-live-draft-${id}`}>
    {!hasText ? <>{fallback}{(presentation==="chat"||connection==="reconnecting"||connection==="unavailable")&&statusLine}</> : <>{statusLine}
    <div className={`ld-body${phase === "writing" ? " is-writing" : ""}`} aria-live="off" data-testid={`text-live-draft-${id}`}>
      <AcademicAnswer content={text} inline={plain} />
    </div>
    {research && <p className="ld-note" data-testid={`text-live-note-${id}`}>Provisional. Claims and citations may change once checked against your sources.</p>}
    {behind && <button type="button" className="ld-jump" onClick={jump} data-testid={`button-live-jump-${id}`}>Jump to latest</button>}</>}
  </section>;
}
