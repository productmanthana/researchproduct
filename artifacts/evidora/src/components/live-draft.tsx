import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { useAgentProgressContext } from "@/components/agent-progress/provider";
import type { QueryKey } from "@tanstack/react-query";
import { useLiveGeneration, type LiveKind, type LiveConnection } from "@/hooks/use-live-generation";
import "./live-draft.css";
import { AcademicAnswer } from "@/components/academic-answer";

const CONN_LABEL: Record<LiveConnection, string> = {
  idle: "", connecting: "Connecting to live draft", live: "Live", reconnecting: "Reconnecting; progress still refreshes",
  unavailable: "Live draft unavailable; progress still refreshes", done: "Finishing; loading the checked version",
};

/**
 * Shows the server's partial draft for a running job as plain text. Before any text arrives, `fallback`
 * (the existing progress label) is rendered unchanged. No actions are offered on partial text.
 */
export function LiveDraft({ kind, id, working, fallback, invalidate, testId, progressKey, presentation="panel" }: {
  kind: LiveKind; id: string; working: boolean; fallback: ReactNode; invalidate?: QueryKey[]; testId?: string;
  presentation?: "panel" | "chat";
  /** Shared progress popup job key; the streamed text is mirrored there as an optional preview. */
  progressKey?: string;
}) {
  const { draft, connection, snapshot } = useLiveGeneration(kind, id, { enabled: working, invalidate });
  const setPreview = useAgentProgressContext()?.setPreview;
  useEffect(() => { if (progressKey && setPreview && working) setPreview(progressKey, draft, CONN_LABEL[connection]); }, [progressKey, setPreview, working, draft, connection]);
  const textBox=useRef<HTMLDivElement>(null);
  const follow=useRef(true);
  useLayoutEffect(()=>{follow.current=true;},[id]);
  useLayoutEffect(()=>{if(follow.current&&textBox.current)textBox.current.scrollTop=textBox.current.scrollHeight;},[draft]);
  if (!working) return null;
  const text = draft.trim();
  const status = CONN_LABEL[connection];
  if(presentation==="chat"){
    const stage=snapshot?.stage??"";
    const research=kind==="studio"||!["","queued","running","planning"].includes(stage);
    const labels:Record<string,string>={discovering:"Finding relevant papers…",searching:"Searching scholarly sources…",reading:"Reading the evidence…",writing:"Writing your answer…",checking:"Checking the citations…",planning:"Thinking…",queued:"Waiting to start…"};
    const reconnecting=connection==="reconnecting"||connection==="unavailable";
    return <section className="ld-chat" aria-label="Live response" data-testid={testId??`panel-live-draft-${id}`}>
      <p className="ld-chat-status" role="status"><i aria-hidden />{reconnecting?status:text?(research?"Writing · evidence checks in progress":"Writing…"):(labels[stage]??(research?"Reviewing your sources…":"Thinking…"))}</p>
      {text&&<><AcademicAnswer content={text} inline={value=>value.split(/(\*\*[^*]+\*\*)/g).map((part,i)=>part.startsWith("**")&&part.endsWith("**")?<strong key={i}>{part.slice(2,-2)}</strong>:part)}/><span className="ld-caret" aria-hidden />{research&&<p className="ld-conn">Live draft; claims may change when evidence checks finish.</p>}</>}
    </section>;
  }
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
