import "./_group.css";
import { Lightbulb, MessagesSquare, Sparkles } from "lucide-react";
import { DocRows, Items, MODES, ProjectLink, Shell } from "./_stub";
import { IDEA_TITLE, IDEA_BODY } from "./_content";

// Source-derived from the previous evidora/src/pages/ideas.tsx + ItemWorkspace default layout.
export function Before() {
  return (
    <Shell>
      <div className="mx-auto max-w-[1180px]">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="sx-eyebrow">Ideas</p><h1 className="sx-title mt-0.5 text-[28px]">Five directions from your own thinking</h1></div><ProjectLink /></header>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_284px]">
          <section className="min-w-0 space-y-4">
            <div className="flex gap-5 border-b border-[hsl(90_14%_84%)]"><button role="tab" aria-selected className="sx-tab"><Lightbulb />Suggest five ideas</button><button role="tab" aria-selected={false} className="sx-tab"><MessagesSquare />Ask my project</button></div>
            <div className="sx-card sx-composer-wide overflow-hidden"><textarea className="sx-wide-input" placeholder="Describe what you are curious about..." />
              <div className="space-y-3 border-t bg-[hsl(66_22%_95%)] px-4 py-3"><div className="sx-seg">{MODES.map(m => <label key={m.value} className={m.value === "combined" ? "on" : ""}>{m.label}</label>)}</div>
                <button className="sx-btn sx-primary" disabled><Sparkles />Suggest five ideas</button></div></div>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
              <article className="sx-card p-6"><h2 className="sx-title text-3xl">{IDEA_TITLE}</h2><p className="mt-1 font-mono text-[11px] text-muted-foreground">79 words</p>
                <h1 className="sx-title mt-6 text-2xl">{IDEA_TITLE}</h1>
                {IDEA_BODY.map(([h, t]) => <div key={h} className="mt-4"><h3 className="sx-title text-lg">{h}</h3><p className="text-sm">{t.split(".")[0]}.</p></div>)}</article>
              <aside className="space-y-4"><div className="sx-card p-4"><p className="sx-eyebrow">Version history</p><select className="sx-input"><option>Revision 1</option></select></div><div className="sx-card p-4"><p className="sx-eyebrow">Project search index</p></div><div className="sx-card p-4"><p className="sx-eyebrow">Check</p></div></aside>
            </div>
          </section>
          <aside className="space-y-4"><div className="sx-card p-3.5"><p className="sx-eyebrow mb-2">Uploads</p><ul className="space-y-1"><DocRows /></ul></div><div className="sx-card p-3.5"><p className="sx-eyebrow mb-2">Idea sets and confirmed ideas</p><Items /></div></aside>
        </div>
      </div>
    </Shell>
  );
}
