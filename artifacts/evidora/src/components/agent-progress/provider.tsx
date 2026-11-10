import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useAuth } from "@clerk/react";
import { Activity, Minimize2 } from "lucide-react";
import { buildWorkflowView, observe, TONES, type WorkflowInput } from "@/lib/agent-workflow";
import { WorkflowPanel } from "./workflow-panel";
import { showProgressPopup, streamHasStarted } from "@/lib/progress-visibility";
import "./agent-progress.css";

type Job = { input: WorkflowInput; observed: string[]; seq: number; preview?: string; connection?: string; streamStarted?: boolean; openedAfterStreaming?: boolean };
type Ctx = {
  register: (input: WorkflowInput, subscriber: string) => void;
  unregister: (key: string, subscriber: string) => void;
  setPreview: (key: string, text: string, connection: string) => void;
  open: (key: string) => void;
  jobs: Record<string, Job>;
  openKey: string | null;
};
const AgentProgressContext = createContext<Ctx | null>(null);

/** One shared registry + one modal for every processing job in the app. */
export function AgentProgressProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  return <AgentProgressRegistry key={userId ?? "anonymous"}>{children}</AgentProgressRegistry>;
}

function AgentProgressRegistry({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Record<string, Job>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [minimised, setMinimised] = useState<Set<string>>(() => new Set());
  const seq = useRef(0);
  const subscribers = useRef(new Map<string, Set<string>>());
  // The account-keyed registry remounts on sign-out/account change. Unlike a reset
  // effect, it cannot erase registrations from children mounting in that commit.
  const register = useCallback((input: WorkflowInput, subscriber: string) => {
    const owners = subscribers.current.get(input.key) ?? new Set<string>();
    owners.add(subscriber); subscribers.current.set(input.key, owners);
    setJobs(prev => {
      const old = prev[input.key];
      return { ...prev, [input.key]: { ...old, input, observed: observe(old?.observed ?? [], input.active), seq: old?.seq ?? ++seq.current } };
    });
  }, []);
  const unregister = useCallback((key: string, subscriber: string) => {
    const owners = subscribers.current.get(key);
    owners?.delete(subscriber);
    if (owners?.size) return;
    subscribers.current.delete(key);
    setJobs(prev => { if (!prev[key]) return prev; const next = { ...prev }; delete next[key]; return next; });
    setMinimised(prev => { if (!prev.has(key)) return prev; const n = new Set(prev); n.delete(key); return n; });
  }, []);
  const setPreview = useCallback((key: string, text: string, connection: string) => {
    setJobs(prev => {
      const j = prev[key];
      if (!j || (j.preview === text && j.connection === connection)) return prev;
      return { ...prev, [key]: { ...j, preview: text, connection, streamStarted: streamHasStarted(j.streamStarted, text) } };
    });
  }, []);
  const open = useCallback((key: string) => {
    setSelected(key);
    setJobs(prev => {
      const job = prev[key];
      return job?.streamStarted ? { ...prev, [key]: { ...job, openedAfterStreaming: true } } : prev;
    });
    setMinimised(prev => { if (!prev.has(key)) return prev; const n = new Set(prev); n.delete(key); return n; });
  }, []);

  const ordered = useMemo(() => Object.entries(jobs).sort((a, b) => a[1].seq - b[1].seq), [jobs]);
  // Selected job if still present; otherwise newest job the user has not minimised.
  const visible = ordered.filter(([k, job]) => showProgressPopup(job, minimised.has(k)));
  const current = selected && jobs[selected] && showProgressPopup(jobs[selected], minimised.has(selected)) ? selected
    : visible.at(-1)?.[0] ?? (selected && jobs[selected] ? selected : ordered.at(-1)?.[0] ?? null);
  const openKey = current && showProgressPopup(jobs[current], minimised.has(current)) ? current : null;
  const minimise = () => { if (current) setMinimised(prev => new Set(prev).add(current)); };

  const value = useMemo(() => ({ register, unregister, setPreview, open, jobs, openKey }), [register, unregister, setPreview, open, jobs, openKey]);
  const job = openKey ? jobs[openKey] : null;
  const view = job ? buildWorkflowView(job.input, job.observed) : null;
  const titleId = useId();

  return (
    <AgentProgressContext.Provider value={value}>
      {children}
      <DialogPrimitive.Root open={!!view} onOpenChange={o => { if (!o) minimise(); }}>
        {view && <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="ap-overlay" />
          <DialogPrimitive.Content className="ap-modal" aria-labelledby={titleId} aria-describedby={undefined} data-testid="modal-agent-progress">
            <DialogPrimitive.Title className="sr-only">{view.workflow} in progress</DialogPrimitive.Title>
            {ordered.length > 1 && (
              <div className="ap-switch" role="tablist" aria-label="Running requests">
                {ordered.map(([k, j], i) => (
                  <button key={k} role="tab" aria-selected={k === openKey} onClick={() => open(k)} data-testid={`tab-progress-${i}`}>
                    <span>{j.input.workflow}</span><small>{j.input.title}</small>
                  </button>
                ))}
              </div>
            )}
            <WorkflowPanel view={view} preview={job?.preview} connection={job?.connection} titleId={titleId} />
            <div className="ap-actions">
              <p>Closing keeps the work running. Reopen it from the page or the progress button.</p>
              <DialogPrimitive.Close className="ap-btn" data-testid="button-minimise-progress"><Minimize2 />Keep working in background</DialogPrimitive.Close>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>}
      </DialogPrimitive.Root>
      {!openKey && ordered.length > 0 && (
        <button className="ap-dock" onClick={() => open(current ?? ordered.at(-1)![0])} data-testid="button-open-progress-dock">
          <Activity aria-hidden /><span>{ordered.length === 1 ? `${ordered[0][1].input.workflow} running` : `${ordered.length} requests running`}</span><small>Show progress</small>
        </button>
      )}
    </AgentProgressContext.Provider>
  );
}

export function useAgentProgressContext() { return useContext(AgentProgressContext); }

/** Registers a running job while `input` is non-null; unregisters on null/unmount (completion, failure, navigation). */
export function useAgentJob(input: WorkflowInput | null) {
  const ctx = useContext(AgentProgressContext);
  const subscriber = useId();
  const register = ctx?.register, unregister = ctx?.unregister;
  const key = input?.key ?? null;
  const sig = input ? JSON.stringify(input) : "";
  const inputRef = useRef(input); inputRef.current = input;
  useEffect(() => { if (inputRef.current && register) register(inputRef.current, subscriber); }, [sig, register, subscriber]);
  useEffect(() => { if (!key || !unregister) return; return () => unregister(key, subscriber); }, [key, unregister, subscriber]);
}

/** Compact page status that reopens the shared popup. Shown in place of the old inline progress bars. */
export function AgentProgressChip({ jobKey, label }: { jobKey: string; label?: string }) {
  const ctx = useContext(AgentProgressContext);
  const job = ctx?.jobs[jobKey];
  if (!ctx || !job) return null;
  const view = buildWorkflowView(job.input, job.observed);
  const active = view.activeIndex >= 0 ? view.tiles[view.activeIndex] : null;
  const isOpen = ctx.openKey === jobKey;
  return (
    <button type="button" className="ap-chip" style={{ ["--ap-tone" as string]: active ? TONES[active.index] : "208 68% 34%" }} onClick={() => ctx.open(jobKey)} aria-haspopup="dialog" aria-expanded={isOpen} data-testid={`button-reopen-progress-${jobKey}`}>
      <span className="ap-chip-dots" aria-hidden>{view.tiles.map(t => <i key={t.role.id} className={`is-${t.state}`} style={{ ["--ap-tone" as string]: TONES[t.index] }} />)}</span>
      <span className="ap-chip-text"><strong>{label ?? (active ? active.role.name : view.phase === "queued" ? "Queued" : "Working")}</strong><span role="status">{view.statusLine}</span></span>
      <span className="ap-chip-cta">View progress</span>
    </button>
  );
}
