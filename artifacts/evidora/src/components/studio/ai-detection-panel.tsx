import type { StudioItem } from "@workspace/api-client-react";

type Measure = { label: string; value: string; score: number; note: string };
export type AiDetection = {
  humanScore?: number; modelScore?: number; styleScore?: number; threshold?: number; verdict?: string; signals?: string[];
  measures?: Measure[]; flagged?: { sentence: string; reasons: string[] }[]; passes?: number; method?: string; checkedAt?: string;
};

/** The AI-writing screen stored on this revision (metadata.aiDetection), if any. */
export function aiDetectionOf(item: StudioItem): AiDetection | null {
  const d = (item.metadata as Record<string, unknown> | null)?.aiDetection as AiDetection | undefined;
  return d && typeof d === "object" && typeof d.humanScore === "number" ? d : null;
}

export function AiDetectionPanel({ data }: { data: AiDetection }) {
  const target = data.threshold ?? 99;
  const ok = (data.humanScore ?? 0) >= target;
  return (
    <div className="sx-card space-y-3 p-4 text-sm" data-testid="panel-ai-detection">
      <p className="sx-eyebrow">AI-writing check · estimated human writing</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="sx-eyebrow">Combined</p>
          <p className={`sx-title mt-1 text-3xl ${ok ? "" : "text-vermilion"}`} data-testid="text-human-score">{data.humanScore!.toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground">{ok ? "Meets" : "Below"} the {target}% target</p>
        </div>
        {typeof data.styleScore === "number" && <div><p className="sx-eyebrow">Style measures</p><p className="sx-title mt-1 text-xl" data-testid="text-style-score">{data.styleScore.toFixed(0)}%</p></div>}
        {typeof data.modelScore === "number" && <div><p className="sx-eyebrow">Reviewer model</p><p className="sx-title mt-1 text-xl" data-testid="text-model-score">{data.modelScore.toFixed(0)}%</p></div>}
      </div>
      {data.verdict && <p className="text-xs text-muted-foreground">{data.verdict}</p>}
      {data.measures?.length ? (
        <ul className="grid gap-1.5 text-xs sm:grid-cols-2" data-testid="list-style-measures">
          {data.measures.map(m => (
            <li key={m.label} className="rounded-md border p-2" title={m.note}>
              <div className="flex justify-between gap-2"><span className="font-medium">{m.label}</span><span className={`font-mono ${m.score < 90 ? "text-vermilion" : ""}`}>{m.score}%</span></div>
              <p className="text-muted-foreground">{m.value}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {data.signals?.length ? <ul className="list-disc space-y-1 pl-5 text-xs">{data.signals.map((s, i) => <li key={i}>{s}</li>)}</ul> : null}
      {data.flagged?.length ? (
        <details className="text-xs" data-testid="list-flagged-sentences">
          <summary className="cursor-pointer font-medium">Sentences to revise ({data.flagged.length})</summary>
          <ul className="mt-2 space-y-2">
            {data.flagged.map((f, i) => (
              <li key={i} className="rounded-md border bg-[hsl(var(--turmeric)/0.07)] p-2">
                <p>&ldquo;{f.sentence}&rdquo;</p>
                <p className="mt-1 text-muted-foreground">{f.reasons.join(" · ")}</p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <p className="text-[11px] text-muted-foreground">
        {data.method ?? "Language-model estimate, not a certified detector."}
        {typeof data.passes === "number" ? ` Humanising passes applied: ${data.passes}.` : ""}
        {data.checkedAt ? ` Checked ${new Date(data.checkedAt).toLocaleString()}.` : ""}
      </p>
    </div>
  );
}
