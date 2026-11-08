import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";

export type LiveKind = "analysis" | "studio";
export type LiveSnapshot = { id: string; status: string; stage: string; draft: string; updatedAt: string | null };
export type LiveConnection = "idle" | "connecting" | "live" | "reconnecting" | "unavailable" | "done";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const MAX_BACKOFF = 15000;
const MAX_FAILURES = 8;

class FatalStream extends Error {}

function parseSnapshot(raw: string): LiveSnapshot | null {
  try {
    const v = JSON.parse(raw) as Partial<LiveSnapshot>;
    if (!v || typeof v !== "object") return null;
    return {
      id: String(v.id ?? ""), status: String(v.status ?? ""), stage: String(v.stage ?? ""),
      draft: typeof v.draft === "string" ? v.draft : "", updatedAt: typeof v.updatedAt === "string" ? v.updatedAt : null,
    };
  } catch { return null; }
}

/**
 * Streams accumulated draft snapshots for a running job. Each snapshot replaces the text (never appended).
 * Polling stays the source of truth; on 'done' the given query keys are invalidated so the checked answer replaces the draft.
 */
export function useLiveGeneration(kind: LiveKind, id: string | null | undefined, opts: { enabled: boolean; invalidate?: QueryKey[] }) {
  const { getToken, userId } = useAuth();
  const qc = useQueryClient();
  const [snapshot, setSnapshot] = useState<LiveSnapshot | null>(null);
  const [connection, setConnection] = useState<LiveConnection>("idle");
  const getTokenRef = useRef(getToken); getTokenRef.current = getToken;
  const invalidateRef = useRef(opts.invalidate); invalidateRef.current = opts.invalidate;
  const active = opts.enabled && !!id && !!userId;

  useEffect(() => { setSnapshot(null); setConnection("idle"); }, [kind, id, userId]);

  useEffect(() => {
    if (!active || !id) return;
    const ctrl = new AbortController();
    let failures = 0;
    let finished = false;
    const sleep = (ms: number) => new Promise<void>(r => {
      const finish=()=>{window.clearTimeout(t);ctrl.signal.removeEventListener("abort",finish);r();};
      const t=window.setTimeout(finish,ms);ctrl.signal.addEventListener("abort",finish,{once:true});
    });

    const handle = (event: string, data: string) => {
      if(event==="gone"){finished=true;setSnapshot(null);setConnection("unavailable");for(const key of invalidateRef.current??[])void qc.invalidateQueries({queryKey:key});return;}
      const snap = parseSnapshot(data);
      if (!snap) return;
      if (event === "done") {
        finished = true;
        setSnapshot(snap);
        setConnection("done");
        for (const key of invalidateRef.current ?? []) void qc.invalidateQueries({ queryKey: key });
      } else if (event === "snapshot") {
        setSnapshot(prev => (prev && prev.draft === snap.draft && prev.stage === snap.stage && prev.status === snap.status ? prev : snap));
        setConnection("live");
      }
    };

    const connectOnce = async () => {
      const started=Date.now();
      const token = await getTokenRef.current();
      if (ctrl.signal.aborted) return;
      const res = await fetch(`${basePath}/api/live/${kind}/${encodeURIComponent(id)}`, {
        headers: { Accept: "text/event-stream", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include", signal: ctrl.signal, cache: "no-store",
      });
      if ([401, 403, 404].includes(res.status)) throw new FatalStream(String(res.status));
      if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      try {for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true }).replace(/\r\n?/g, "\n");
        let idx: number;
        while ((idx = buf.indexOf("\n\n")) >= 0) {
          const block = buf.slice(0, idx); buf = buf.slice(idx + 2);
          let event = "message"; const lines: string[] = [];
          for (const line of block.split("\n")) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            else if (line.startsWith("data:")) lines.push(line.slice(5).replace(/^ /, ""));
          }
          if (lines.length) handle(event, lines.join("\n"));
        }
        if (finished) { void reader.cancel().catch(() => undefined); break; }
      }}finally{await reader.cancel().catch(()=>undefined);reader.releaseLock();}
      if(Date.now()-started>=5000)failures=0;
      else if(!finished&&!ctrl.signal.aborted)throw new Error("Live stream ended early");
    };

    void (async () => {
      setConnection("connecting");
      while (!ctrl.signal.aborted && !finished) {
        try {
          await connectOnce();
          if (finished || ctrl.signal.aborted) break;
          // Server closed the stream (time limit) while still working: reconnect promptly.
          setConnection("reconnecting");
          await sleep(500);
        } catch (e) {
          if (ctrl.signal.aborted) break;
          if (e instanceof FatalStream) { setConnection("unavailable"); break; }
          failures += 1;
          if (failures > MAX_FAILURES) { setConnection("unavailable"); break; }
          setConnection("reconnecting");
          await sleep(Math.min(MAX_BACKOFF, 1000 * 2 ** (failures - 1)) + Math.random() * 400);
        }
      }
    })();
    return () => ctrl.abort();
  }, [active, kind, id, userId, qc]);

  return { snapshot, draft: snapshot?.draft ?? "", connection };
}
