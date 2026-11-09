import "./_group.css";
import { useState } from "react";
import { Download, FileText, FolderOpen, History, PanelRight, PenLine, Plus, Sparkles } from "lucide-react";
import { MODES, PROJECT, Shell } from "./_stub";

// Source-derived from evidora/src/components/studio/conversation-view.tsx + pages/ideas.tsx (chat view). Handlers stubbed; no production imports.
const TURNS = [
  { q: "Using my references, is handpump water near village schools a likely cause of monsoon illness?", title: "Handpump water and monsoon illness",
    body: ["Your two field notes and Sharma et al. (2019) [1] link post-monsoon diarrhoeal cases to shallow handpumps within 15 m of latrines.", "The evidence is observational. No water testing is recorded in your project yet, so causation cannot be claimed."],
    src: [{ t: "Sharma et al. 2019, Groundwater contamination in Bihar", u: "#" }] },
  { q: "What simple test could I run myself before next monsoon?", title: "A low-cost test plan for one school",
    body: ["H2S strip tests [2] detect faecal contamination for about Rs 40 each and need no laboratory.", "Test weekly from June to September at the school pump and one comparison pump further from latrines; record rainfall the same day."],
    src: [{ t: "WHO 2022, Guidelines for drinking-water quality", u: "#" }, { t: "Manja et al. 1982, H2S strip test", u: "#" }] },
];

function You({ t }: { t: string }) {
  return <div className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-br-md border border-[hsl(var(--teal)/0.25)] bg-[hsl(var(--teal)/0.07)] px-4 py-3"><p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--teal))]">You</p><p className="whitespace-pre-wrap text-[15px] leading-relaxed">{t}</p></div></div>;
}

export function Thread() {
  const [mode, setMode] = useState("project");
  return (
    <Shell>
      <div className="mx-auto max-w-[960px] pb-6">
        <nav className="sticky top-0 z-20 -mx-2 mb-5 flex flex-wrap items-center gap-2 bg-[hsl(var(--ivory)/0.92)] px-2 py-2 backdrop-blur">
          <button className="sx-btn sx-primary"><Plus />New topic</button>
          <div className="ml-auto flex gap-2"><button className="sx-btn"><History />History and uploads</button><span className="sx-btn hidden sm:inline-flex"><FolderOpen />{PROJECT.name}</span></div>
        </nav>
        <p className="mb-5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">Conversation &middot; 2 questions</p>
        <ol className="space-y-8">
          {TURNS.map((x, i) => (
            <li key={i} className="space-y-3">
              <You t={x.q} />
              <article className="sx-card overflow-hidden">
                {i === TURNS.length - 1
                  ? <div className="flex flex-wrap items-center gap-2 border-b bg-[hsl(66_20%_95%)] px-4 py-2.5"><span className="sx-chip">Answer</span><span className="sx-chip">rev 1</span><div className="ml-auto flex gap-1.5"><button className="sx-btn">Edit</button><button className="sx-btn"><PanelRight />Versions and checks</button><button className="sx-btn"><Download />PDF</button><button className="sx-btn"><FileText />Word</button></div></div>
                  : <div className="flex items-center gap-2 px-5 pt-4 md:px-8"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Evidora &middot; Answer &middot; rev 2 &middot; 3 days ago</p><button className="sx-btn ml-auto"><PenLine />Edit, versions, export</button></div>}
                <div className="mx-auto max-w-[760px] px-5 py-6 md:px-10">
                  <h3 className="sx-title text-[28px] leading-tight">{x.title}</h3>
                  <div className="mt-4 space-y-3 text-[15.5px] leading-relaxed">{x.body.map((b, j) => <p key={j}>{b}</p>)}</div>
                  <p className="sx-eyebrow mt-6 mb-1">References</p>
                  <ol className="list-decimal space-y-1 pl-5 text-sm">{x.src.map(s => <li key={s.t}><a className="underline decoration-[hsl(var(--teal)/0.4)] underline-offset-2" href={s.u}>{s.t}</a></li>)}</ol>
                </div>
              </article>
            </li>
          ))}
        </ol>
        <section className="sticky bottom-3 z-10 pt-6">
          <div className="sx-card sx-composer-wide overflow-hidden">
            <div className="flex items-end gap-2 p-2"><textarea rows={2} className="min-h-[44px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] outline-none" placeholder="Ask a follow-up. Earlier questions and answers stay above." /><button className="sx-btn sx-primary"><Sparkles />Ask</button></div>
            <div className="flex flex-wrap items-center gap-3 border-t bg-[hsl(66_22%_96%)] px-3 py-2"><div className="sx-seg">{MODES.map(m => <label key={m.value} className={mode === m.value ? "on" : ""} onClick={() => setMode(m.value)}>{m.label}</label>)}</div><span className="ml-auto font-mono text-[10.5px] text-muted-foreground">Ctrl + Enter to send</span></div>
          </div>
        </section>
      </div>
    </Shell>
  );
}
