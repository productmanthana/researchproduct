import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { QueryKey } from "@tanstack/react-query";
import { useLiveGeneration, type LiveKind, type LiveConnection } from "@/hooks/use-live-generation";
import "./live-draft.css";

const CONN_LABEL: Record<LiveConnection, string> = {
  idle: "", connecting: "Connecting to live draft", live: "Live", reconnecting: "Reconnecting; progress still refreshes",
  unavailable: "Live draft unavailable; progress still refreshes", done: "Finishing; loading the checked version",
};

/**
 * Shows the server's partial draft for a running job as plain text. Before any text arrives, `fallback`
 * (the existing progress label) is rendered unchanged. No actions are offered on partial text.
 */
export function LiveDraft({ kind, id, working, fallback, invalidate, testId }: {
  kind: LiveKind; id: string; working: boolean; fallback: ReactNode; invalidate?: QueryKey[]; testId?: string;
}) {
  const { draft, connection, snapshot } = useLiveGeneration(kind, id, { enabled: working, invalidate });
  const textBox=useRef<HTMLDivElement>(null);
  const follow=useRef(true);
  useLayoutEffect(()=>{follow.current=true;},[id]);
  useLayoutEffect(()=>{if(follow.current&&textBox.current)textBox.current.scrollTop=textBox.current.scrollHeight;},[draft]);
  if (!working) return null;
  const text = draft.trim();
  const status = CONN_LABEL[connection];
  if (!text) return <>
    {fallback}
    {(connection === "reconnecting" || connection === "unavailable") && <p className="ld-conn" role="status" data-testid={`status-live-${id}`}>{status}</p>}
  </>;
  const stage = snapshot?.stage ? snapshot.stage.replace(/[_-]+/g, " ") : "";
  return <section className="ld-panel" aria-label="Unverified live draft" data-testid={testId ?? `panel-live-draft-${id}`}>
    <header className="ld-head">
      <span className="ld-badge">Unverified draft</span>
      {stage && <span className="ld-stage">{stage}</span>}
      <span className={`ld-conn-inline is-${connection}`} role="status" data-testid={`status-live-${id}`}><i aria-hidden />{status}</span>
    </header>
    <p className="ld-warn">Being written now. Not yet checked against sources; wording and claims may change or be removed when checks finish.</p>
    <div ref={textBox} onScroll={e=>{const el=e.currentTarget;follow.current=el.scrollHeight-el.scrollTop-el.clientHeight<60;}} className="ld-text" aria-live="off" data-testid={`text-live-draft-${id}`}>{text}<span className="ld-caret" aria-hidden /></div>
  </section>;
}
