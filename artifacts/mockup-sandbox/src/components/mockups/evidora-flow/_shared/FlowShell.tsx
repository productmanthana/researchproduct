import "../_group.css";
import { BookOpen, ChevronRight, Leaf } from "lucide-react";
import type { ReactNode } from "react";

export const flowStages = [
  { id: "chat", label: "Clarify", name: "ResearchChat", path: "/__mockup/preview/evidora-flow/ResearchChat" },
  { id: "topics", label: "Explore", name: "TopicExplorer", path: "/__mockup/preview/evidora-flow/TopicExplorer" },
  { id: "evidence", label: "Evidence", name: "EvidenceReview", path: "/__mockup/preview/evidora-flow/EvidenceReview" },
  { id: "plan", label: "Plan", name: "ResearchPlanner", path: "/__mockup/preview/evidora-flow/ResearchPlanner" },
  { id: "write", label: "Write", name: "ManuscriptStudio", path: "/__mockup/preview/evidora-flow/ManuscriptStudio" },
  { id: "publish", label: "Publish", name: "PublicationPlan", path: "/__mockup/preview/evidora-flow/PublicationPlan" },
];

type FlowShellProps = {
  active: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  action?: ReactNode;
};

export function FlowShell({ active, title, subtitle, children, action }: FlowShellProps) {
  const activeIndex = flowStages.findIndex(stage => stage.id === active);
  return <div className="ef-root">
    <div className="ef-shell">
      <header className="ef-topbar">
        <a className="ef-brand" href={flowStages[0].path} aria-label="Evidora flow home">
          <span className="ef-brand-mark"><Leaf /></span>evidora<span style={{ color: "#9ba58e" }}>.</span>
        </a>
        <div className="ef-crumb"><span>Workspace</span><ChevronRight /><span>Research project</span><ChevronRight /><strong>{title}</strong></div>
        <div className="ef-top-meta"><span className="ef-demo">Design sample · local only</span><span className="ef-avatar" aria-label="Sample workspace">ED</span></div>
      </header>
      <div className="ef-body">
        <aside className="ef-sidebar" aria-label="Research journey navigation">
          <section>
            <p className="ef-side-label">Current project</p>
            <div className="ef-project-card">
              <span className="ef-project-mark"><BookOpen /> Project note</span>
              <strong>Interpretable AI for wind turbine pitch control</strong>
              <small>Simulation-only · working direction</small>
            </div>
          </section>
          <nav>
            <p className="ef-side-label">Research journey</p>
            <div className="ef-stages">{flowStages.map((stage, index) => <a className="ef-stage-link" key={stage.id} href={stage.path} aria-current={active === stage.id ? "page" : undefined}>
              <span className="ef-stage-num">{String(index + 1).padStart(2, "0")}</span>{stage.label}
            </a>)}</div>
          </nav>
          <div className="ef-side-foot"><Leaf />A considered route from an early idea to a defensible manuscript plan.<br /><br />Everything here is illustrative. Nothing is saved or sent.</div>
        </aside>
        <main className="ef-main">
          <div className="ef-heading">
            <div><div className="ef-kicker">Evidora · research companion</div><h1>{title}</h1><p>{subtitle}</p></div>
            <div className="ef-heading-actions">{action}</div>
          </div>
          <nav className="ef-progress" aria-label="Journey progress">{flowStages.map((stage, index) => <a key={stage.id} className={`ef-progress-item ${active === stage.id ? "active" : index < activeIndex ? "done" : ""}`} href={stage.path} aria-current={active === stage.id ? "step" : undefined}><span>{String(index + 1).padStart(2, "0")}</span>{stage.label}</a>)}</nav>
          <div className="ef-enter" key={active}>{children}</div>
          <div className="ef-footer-nav"><small>Sample project · local interaction only · no live research or persistence</small><small>Illustrative content, not a finding</small></div>
        </main>
      </div>
    </div>
  </div>;
}

export function NextStage({ current, label }: { current: string; label: string }) {
  const index = flowStages.findIndex(stage => stage.id === current);
  const next = flowStages[Math.min(index + 1, flowStages.length - 1)];
  return <a className="ef-btn ef-btn-primary" href={next.path}>{label}<ChevronRight /></a>;
}
