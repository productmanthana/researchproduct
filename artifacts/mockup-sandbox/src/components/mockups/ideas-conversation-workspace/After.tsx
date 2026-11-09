import "./_group.css";
import { useState } from "react";
import { ArrowLeft, Download, FileText, FolderOpen, History, PanelRight, Plus, Sparkles, Wand2 } from "lucide-react";
import { DocRows, Items, MODES, PROJECT, Shell } from "./_stub";
import { IDEA_TITLE, IDEA_BODY } from "./_content";

// Source-derived from evidora/src/pages/ideas.tsx (selected item) + ItemWorkspace presentation="reading" + Composer compact. Handlers stubbed.
export function After() {
  const [drawer, setDrawer] = useState<null | "history" | "tools">(null);
  const [mode, setMode] = useState("project");
  const [prompt, setPrompt] = useState("");
  return (
    <Shell>
      <div className="mx-auto max-w-[960px] pb-6">
        <nav className="sticky top-0 z-20 -mx-2 mb-5 flex flex-wrap items-center gap-2 bg-[hsl(var(--ivory)/0.92)] px-2 py-2 backdrop-blur">
          <button className="sx-btn sx-primary"><Plus />New topic</button>
          <button className="sx-btn"><ArrowLeft />Back to five ideas</button>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground md:inline">Chosen idea</span>
          <div className="ml-auto flex gap-2"><button className="sx-btn" onClick={() => setDrawer("history")}><History />History and uploads</button><span className="sx-btn hidden sm:inline-flex"><FolderOpen />{PROJECT.name}</span></div>
        </nav>
        <div className="space-y-5">
          <div className="flex flex-col items-start gap-3 rounded-lg border border-[hsl(var(--teal)/0.3)] bg-[hsl(var(--teal)/0.05)] px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Wand2 className="hidden h-4 w-4 text-[hsl(var(--teal))] sm:block" /><p className="min-w-0 flex-1 text-sm">This idea is a short outline (231 words). Develop it into rationale, objectives, method, evaluation, feasibility, limitations and related work. The original stays as written.</p>
            <button className="sx-btn sx-primary"><Sparkles />Develop this idea</button></div>
          <article className="sx-card overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b bg-[hsl(66_20%_95%)] px-4 py-2.5"><span className="sx-chip">Chosen idea</span><span className="sx-chip">rev 1</span><span className="sx-chip ok">search index: indexed</span>
              <div className="ml-auto flex flex-wrap gap-1.5"><button className="sx-btn">Edit</button><button className="sx-btn" onClick={() => setDrawer("tools")}><PanelRight />Versions and checks</button><button className="sx-btn"><Download />PDF</button><button className="sx-btn"><FileText />Word</button></div></div>
            <div className="mx-auto max-w-[760px] px-5 py-6 md:px-10 md:py-10">
              <h2 className="sx-title text-[32px] leading-tight md:text-[38px]">{IDEA_TITLE}</h2>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">created 4 min ago &middot; 231 words</p>
              <div className="mt-6 space-y-6">{IDEA_BODY.map(([h, t]) => <section key={h}><h3 className="sx-title text-xl">{h}</h3><p className="mt-2 text-[16px] leading-[1.75]">{t}</p></section>)}</div>
            </div>
            <div className="flex items-center gap-2 border-t px-4 py-3"><span className="text-xs text-muted-foreground">All changes saved</span><button className="sx-btn sx-primary ml-auto" disabled>Save new version</button></div>
          </article>
          <section className="sticky bottom-3 z-10 pt-2">
            <div className="sx-card sx-composer-wide overflow-hidden">
              <div className="flex items-end gap-2 p-2"><textarea rows={2} value={prompt} onChange={e => setPrompt(e.target.value)} className="min-h-[44px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] outline-none" placeholder={`Ask a follow-up about "${IDEA_TITLE.slice(0, 60)}"...`} /><button className="sx-btn sx-primary" disabled={prompt.trim().length < 5}><Sparkles />Ask</button></div>
              <div className="flex flex-wrap items-center gap-3 border-t bg-[hsl(66_22%_96%)] px-3 py-2"><div className="sx-seg">{MODES.map(m => <label key={m.value} className={mode === m.value ? "on" : ""} onClick={() => setMode(m.value)}>{m.label}</label>)}</div><label className="flex items-center gap-1.5 text-xs"><input type="checkbox" defaultChecked />Patents</label><span className="ml-auto font-mono text-[10.5px] text-muted-foreground">Ctrl + Enter to send</span></div>
            </div>
          </section>
        </div>
      </div>
      {drawer && <div className="fixed inset-0 z-50 flex justify-end bg-[hsl(174_22%_19%/0.35)]" onClick={() => setDrawer(null)}>
        <div className="h-full w-full max-w-[400px] overflow-y-auto bg-[hsl(52_30%_96%)] p-6" onClick={e => e.stopPropagation()}>
          <p className="sx-title text-xl">{drawer === "history" ? "History and uploads" : "Versions, checks and sources"}</p>
          {drawer === "history" ? <div className="mt-4 space-y-4"><Items /><ul className="space-y-1"><DocRows /></ul></div>
            : <div className="mt-4 space-y-4"><div className="sx-card p-4"><p className="sx-eyebrow mb-2">Version history</p><select className="sx-input"><option>Revision 1</option></select></div><div className="sx-card p-4"><p className="sx-eyebrow">Project search index</p></div><div className="sx-card p-4"><p className="sx-eyebrow">Check this draft</p></div><button className="sx-btn sx-danger w-full">Delete this revision</button></div>}
          <button className="sx-btn mt-4" onClick={() => setDrawer(null)}>Close</button>
        </div></div>}
    </Shell>
  );
}
