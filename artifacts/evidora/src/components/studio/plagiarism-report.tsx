import type { StudioItem } from "@workspace/api-client-react";
import { ExternalLink } from "lucide-react";

type Passage = { draft: string; source: string; type: string; words: number };
type Report = {
  target: number; checkedAt: string; method: string; notices?: string[];
  similarityPercent: number; originalPercent: number; wordsChecked: number; matchedWords: number;
  breakdown: { identical: number; minorChanges: number; paraphrased: number };
  searched: { project: number; scholarly: number; fullText: number; web: number };
  sources: { title: string; url?: string; origin: string; percent: number; matchedWords: number; passages: Passage[] }[];
};

/** Plagiarism report stored on this revision (metadata.plagiarism), if any. */
export function plagiarismOf(item: StudioItem): Report | null {
  const r = (item.metadata as Record<string, unknown> | null)?.plagiarism as Report | undefined;
  return r && typeof r === "object" && typeof r.originalPercent === "number" ? r : null;
}

const ORIGIN: Record<string, string> = { project: "Project", scholarly: "Scholarly", web: "Internet" };

export function PlagiarismReportPanel({ data }: { data: Report }) {
  const ok = data.originalPercent >= data.target;
  return (
    <div className="sx-card space-y-3 p-4 text-sm" data-testid="panel-plagiarism-report">
      <p className="sx-eyebrow">Plagiarism check</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="sx-eyebrow">Original</p>
          <p className={`sx-title mt-1 text-3xl ${ok ? "" : "text-vermilion"}`} data-testid="text-original-percent">{data.originalPercent.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">{ok ? "Meets" : "Below"} the {data.target}% target</p>
        </div>
        <div><p className="sx-eyebrow">Identical</p><p className="sx-title mt-1 text-xl">{data.breakdown.identical}%</p></div>
        <div><p className="sx-eyebrow">Minor changes</p><p className="sx-title mt-1 text-xl">{data.breakdown.minorChanges}%</p></div>
        <div><p className="sx-eyebrow">Paraphrased</p><p className="sx-title mt-1 text-xl">{data.breakdown.paraphrased}%</p></div>
      </div>
      <p className="text-xs text-muted-foreground">
        {data.matchedWords} of {data.wordsChecked} words matched · searched {data.searched.project} project sources, {data.searched.scholarly} scholarly abstracts, {data.searched.fullText} open-access full texts, {data.searched.web} Internet pages
      </p>
      {data.sources.length > 0 && (
        <ul className="space-y-2 text-xs" data-testid="list-plagiarism-sources">
          {data.sources.map((s, i) => (
            <li key={i} className="rounded border p-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{ORIGIN[s.origin] ?? s.origin} · {s.title}</p>
                <span className="shrink-0 font-medium">{s.percent}%</span>
              </div>
              {s.url && <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all text-muted-foreground underline">{s.url}<ExternalLink className="h-3 w-3 shrink-0" /></a>}
              <details className="mt-1">
                <summary className="cursor-pointer text-muted-foreground">{s.passages.length} matched passage{s.passages.length === 1 ? "" : "s"}</summary>
                <ul className="mt-1 space-y-2">
                  {s.passages.map((p, k) => (
                    <li key={k} className="border-l-2 pl-2">
                      <p><span className="font-medium">{p.type} · {p.words} words.</span> Draft: "{p.draft}"</p>
                      <p className="mt-0.5 text-muted-foreground">Source: "{p.source}"</p>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      )}
      {data.notices?.map((n, i) => <p key={i} className="text-xs text-vermilion">{n}</p>)}
      <p className="text-[11px] text-muted-foreground">{data.method} Checked {new Date(data.checkedAt).toLocaleString()}.</p>
    </div>
  );
}
