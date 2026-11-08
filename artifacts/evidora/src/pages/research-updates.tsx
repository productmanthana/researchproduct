import { useMemo, useState } from "react";
import { Link } from "wouter";
import { BellRing, Inbox } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { ErrorState, RowSkeleton } from "@/components/states";
import { WatchPanel, WatchStatus } from "@/components/research/watch-panel";
import { AlertCard } from "@/components/research/alert-card";
import { useActiveProject } from "@/lib/active-project";
import { proposeTopic, useAlerts, useWatches } from "@/lib/research-watch";

function Inner() {
  const { project, projects, loading, select } = useActiveProject();
  const watches = useWatches();
  const alerts = useAlerts();
  const [filter, setFilter] = useState<"all" | "unread" | "project">("all");
  const byProject = useMemo(() => new Map((watches.data ?? []).map(w => [w.projectId, w])), [watches.data]);
  const list = useMemo(() => (alerts.data?.alerts ?? []).filter(a => filter === "unread" ? !a.read : filter === "project" ? a.projectId === project?.id : true), [alerts.data, filter, project?.id]);

  return (
    <>
      <header className="rise mb-7 border-b border-[hsl(90_14%_84%)] pb-6">
        <p className="sx-eyebrow">Research updates</p>
        <h1 className="sx-title mt-1.5 text-4xl md:text-5xl">Keep an eye on your topic.</h1>
        <p className="mt-3 max-w-2xl text-[15px] text-muted-foreground">One watch per project. Evidora searches open sources about once a day and lists new matches here and in the bell. Email alerts are not enabled.</p>
      </header>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <p className="sx-eyebrow">Projects</p>
          {(loading || watches.isLoading) && <RowSkeleton rows={3} />}
          {watches.isError && <ErrorState error={watches.error} onRetry={() => void watches.refetch()} title="Couldn't load watches" />}
          {!loading && !projects.length && <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">Create a project in <Link href="/my-library" className="underline">My Library</Link> first.</p>}
          <div className="space-y-1">
            {projects.map(p => {
              const w = byProject.get(p.id);
              return (
                <button key={p.id} onClick={() => select(p.id)} aria-current={p.id === project?.id || undefined} className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${p.id === project?.id ? "border-[hsl(var(--teal))] bg-[hsl(var(--teal)/0.07)]" : "border-transparent hover:bg-[hsl(90_18%_88%)]"}`} data-testid={`button-watch-project-${p.id}`}>
                  <span className="h-6 w-1.5 rounded-full" style={{ background: p.color }} />
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  {w ? <WatchStatus watch={w} /> : <span className="font-mono text-[10.5px] text-muted-foreground">not watched</span>}
                </button>
              );
            })}
          </div>
          {project && !watches.isLoading && !watches.isError && (
            <WatchPanel key={project.id} projectId={project.id} projectName={project.name} watch={byProject.get(project.id)}
              proposal={proposeTopic({ name: project.name, description: project.description })} proposalSource="your project details" />
          )}
          {!project && projects.length > 0 && <p className="sx-card p-5 text-sm text-muted-foreground">Choose a project above to set up or manage its watch.</p>}
        </div>
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="sx-eyebrow mr-auto">Digest {alerts.data ? `· ${alerts.data.unread} unread` : ""}</p>
            <div className="sx-card inline-grid grid-cols-3 gap-1 p-1" role="tablist">
              {([["all", "All"], ["unread", "Unread"], ["project", "This project"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={filter === k} disabled={k === "project" && !project} className={`sx-btn min-h-[32px] border-0 ${filter === k ? "sx-primary" : ""}`} onClick={() => setFilter(k)} data-testid={`tab-alerts-${k}`}>{l}</button>)}
            </div>
          </div>
          {alerts.isLoading && <RowSkeleton rows={4} />}
          {alerts.isError && <ErrorState error={alerts.error} onRetry={() => void alerts.refetch()} title="Couldn't load updates" />}
          {alerts.data && !list.length && (
            <div className="sx-card grid-paper flex min-h-[280px] flex-col items-center justify-center p-10 text-center" data-testid="empty-alerts">
              {byProject.size ? <Inbox className="h-10 w-10 text-[hsl(var(--teal))]" strokeWidth={1.2} /> : <BellRing className="h-10 w-10 text-[hsl(var(--teal))]" strokeWidth={1.2} />}
              <p className="sx-title mt-4 text-2xl">{byProject.size ? "Nothing new here" : "No watches yet"}</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">{byProject.size ? "When a check finds new related work, it shows up here with its publication date and why it surfaced." : "Pick a project, review the proposed topic and save it to start."}</p>
            </div>
          )}
          {list.map(a => <AlertCard key={a.id} alert={a} currentTopic={byProject.get(a.projectId)?.topic} />)}
        </div>
      </div>
    </>
  );
}

export default function ResearchUpdates() { return <RequireAuth what="research updates"><Inner /></RequireAuth>; }
