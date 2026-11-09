import "./_group.css";
import { Lightbulb, MessagesSquare, Sparkles } from "lucide-react";
import { BookmarkPlus, DocRows, Items, MODES, ProjectLink, Shell, TONES, UploadBtn } from "./_stub";

export function Current() {
  return (
    <Shell>
      <header className="mb-7 flex flex-col gap-3 border-b border-[hsl(90_14%_84%)] pb-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl"><p className="sx-eyebrow">Ideas</p><h1 className="sx-title mt-1.5 text-4xl leading-[1.05] md:text-5xl">Five directions from your own thinking.</h1>
          <p className="mt-3 text-[15px] text-muted-foreground">Describe what you are curious about, in your own words. Evidora proposes five researchable ideas grounded in your project; confirm the ones worth keeping. Or ask a direct question about your ideas and references.</p></div>
        <ProjectLink />
      </header>
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-5">
          <div className="sx-card grid grid-cols-2 gap-1 p-1"><button className="sx-btn sx-primary border-0"><Lightbulb />Five ideas</button><button className="sx-btn border-0"><MessagesSquare />Ask my project</button></div>
          <div className="sx-card space-y-4 p-4">
            <textarea className="sx-input min-h-[130px] resize-y leading-relaxed" placeholder="e.g. I teach in a village school near Patna. Many children fall sick after monsoon and I wonder whether our handpump water is safe..." />
            <fieldset><legend className="sx-eyebrow mb-2">Evidence to use</legend><div className="grid gap-1.5">{MODES.map(m => (
              <label key={m.value} className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-sm ${m.value === "combined" ? "border-[hsl(var(--teal))] bg-[hsl(var(--teal)/0.06)]" : ""}`}><input type="radio" name="m" className="mt-1" defaultChecked={m.value === "combined"} /><span><span className="font-medium">{m.label}</span><span className="block text-xs text-muted-foreground">{m.hint}</span></span></label>))}</div></fieldset>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked />Include patent records when available</label>
            <div className="flex flex-wrap gap-2"><button className="sx-btn sx-primary flex-1" disabled><Sparkles />Suggest five ideas</button><button className="sx-btn" disabled><BookmarkPlus />Save to Library</button></div>
            <p className="text-xs text-muted-foreground">Write at least 5 characters.</p>
          </div>
          <div className="sx-card space-y-3 p-4"><div className="flex items-center justify-between gap-2"><p className="sx-eyebrow">Your uploaded documents</p><UploadBtn label="Upload" /></div>
            <p className="text-xs text-muted-foreground">Files stay private to your account. Attach a ready file so drafts can draw on it.</p><ul className="max-h-56 space-y-1 overflow-y-auto"><DocRows /></ul></div>
          <div><p className="sx-eyebrow mb-2">Idea sets and confirmed ideas</p><Items /></div>
        </div>
        <div className="min-w-0"><div className="sx-card grid-paper flex min-h-[420px] flex-col items-center justify-center p-10 text-center">
          <div className="flex -space-x-3">{TONES.map((t, i) => <span key={i} className="h-12 w-9 rounded-md border-2 border-[hsl(52_40%_98%)] shadow-sm" style={{ background: `hsl(${t})`, transform: `rotate(${(i - 2) * 7}deg)` }} />)}</div>
          <p className="sx-title mt-6 text-2xl">Five cards, one decision at a time</p><p className="mt-2 max-w-sm text-sm text-muted-foreground">Nothing is forced. Read each idea, confirm the ones you like, and come back any time; your choices are remembered.</p></div></div>
      </div>
    </Shell>
  );
}
