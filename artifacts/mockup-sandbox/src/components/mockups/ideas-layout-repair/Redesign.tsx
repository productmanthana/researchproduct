import "./_group.css";
import { useState } from "react";
import { Lightbulb, MessagesSquare, Sparkles } from "lucide-react";
import { BookmarkPlus, DocRows, Items, MODES, ProjectLink, Shell, TONES, UploadBtn } from "./_stub";

// Copied from evidora/src/pages/ideas.tsx + Composer variant="wide" + AttachDocuments variant="compact".
export function Redesign() {
  const [tab, setTab] = useState("ideas");
  const [mode, setMode] = useState("combined");
  const [prompt, setPrompt] = useState("");
  const trimmed = prompt.trim();
  const problem = trimmed.length < 5 ? "Write at least 5 characters." : null;
  return (
    <Shell>
      <div className="mx-auto max-w-[1180px]">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0"><p className="sx-eyebrow">Ideas</p><h1 className="sx-title mt-0.5 text-2xl leading-tight md:text-[28px]">Five directions from your own thinking</h1></div>
          <ProjectLink />
        </header>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_284px] xl:grid-cols-[minmax(0,1fr)_312px]">
          <section className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-[hsl(90_14%_84%)]">
              <div className="flex gap-5" role="tablist">
                <button role="tab" aria-selected={tab === "ideas"} onClick={() => setTab("ideas")} className="sx-tab"><Lightbulb />Suggest five ideas</button>
                <button role="tab" aria-selected={tab === "answer"} onClick={() => setTab("answer")} className="sx-tab"><MessagesSquare />Ask my project</button>
              </div>
              <p className="hidden pb-2 text-xs text-muted-foreground md:block">In your own words. Plain language is fine.</p>
            </div>
            <div className="sx-card sx-composer-wide overflow-hidden">
              <textarea className="sx-wide-input" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe what you are curious about. e.g. I teach in a village school near Patna. Many children fall sick after monsoon and I wonder whether our handpump water is safe..." />
              <div className="flex items-center justify-between gap-3 px-4 pb-2 font-mono text-[10.5px] text-muted-foreground"><span>{problem && trimmed ? problem : "AI drafts need your review against the original sources."}</span><span className="shrink-0 whitespace-nowrap">{trimmed.length} / 5,000</span></div>
              <div className="space-y-3 border-t border-[hsl(90_14%_86%)] bg-[hsl(66_22%_95%)] px-4 py-3">
                <fieldset className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="sx-eyebrow">Evidence</span>
                  <div className="sx-seg">{MODES.map(m => <label key={m.value} title={m.hint} className={mode === m.value ? "on" : ""}><input type="radio" name="mode" className="sr-only" checked={mode === m.value} onChange={() => setMode(m.value)} />{m.label}</label>)}</div>
                  <span className="hidden text-xs text-muted-foreground xl:inline">{MODES.find(m => m.value === mode)?.hint}</span>
                  <label className="ml-auto flex items-center gap-2 text-[13px]"><input type="checkbox" defaultChecked />Include patents</label>
                </fieldset>
                <div className="flex flex-wrap items-center gap-2">
                  <button className="sx-btn sx-primary min-w-[200px] flex-1 sm:flex-none" disabled={!!problem}><Sparkles />Suggest five ideas</button>
                  <button className="sx-btn" disabled={!!problem}><BookmarkPlus />Save to Library</button>
                  <span className="ml-auto hidden font-mono text-[10.5px] text-muted-foreground sm:inline">Ctrl + Enter to send</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-lg border border-dashed border-[hsl(110_14%_78%)] px-4 py-3">
              <div className="flex shrink-0 -space-x-2">{TONES.map((t, i) => <span key={i} className="h-7 w-5 rounded-[3px] border border-[hsl(52_40%_98%)]" style={{ background: `hsl(${t})`, transform: `rotate(${(i - 2) * 7}deg)` }} />)}</div>
              <p className="text-[13px] text-muted-foreground"><span className="font-medium text-[hsl(var(--ink-teal))]">Your five ideas will appear here.</span> Read each one and confirm the ones you like; your choices are remembered.</p>
            </div>
          </section>
          <aside className="min-w-0 space-y-4">
            <div className="sx-card space-y-3 p-3.5"><div className="flex items-center justify-between gap-2"><p className="sx-eyebrow">Reference documents</p><UploadBtn label="Upload file" /></div>
              <p className="text-xs text-muted-foreground">Files stay private to your account. Attach a ready file so drafts can draw on it.</p><ul className="max-h-44 space-y-1 overflow-y-auto"><DocRows /></ul></div>
            <div className="sx-card p-3.5"><p className="sx-eyebrow mb-2">Idea sets and confirmed ideas</p><div className="max-h-[340px] overflow-y-auto"><Items /></div></div>
          </aside>
        </div>
      </div>
    </Shell>
  );
}
