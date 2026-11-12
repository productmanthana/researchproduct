import type { StudioItem } from "@workspace/api-client-react";
import { ExternalLink } from "lucide-react";

type ExternalChecks = {
  provider: string; target: number; checkedAt: string; errors?: string[];
  ai?: { humanPercent: number; aiPercent: number; aiAssistedPercent: number; prediction: string; flagged: { text: string; label: string; confidence: string }[] };
  plagiarism?: { uniquePercent: number; plagiarizedPercent: number; totalSentences: number; plagiarizedSentences: number; matches: { sourceUrl: string; matchedText: string; similarity: number }[] };
};

/** Independent Pangram checks stored on this revision (metadata.externalChecks), if any. */
export function externalChecksOf(item: StudioItem): ExternalChecks | null {
  const c = (item.metadata as Record<string, unknown> | null)?.externalChecks as ExternalChecks | undefined;
  return c && typeof c === "object" && typeof c.target === "number" ? c : null;
}

function Score({ label, value, target, testId }: { label: string; value: number; target: number; testId: string }) {
  const ok = value >= target;
  return (
    <div>
      <p className="sx-eyebrow">{label}</p>
      <p className={`sx-title mt-1 text-3xl ${ok ? "" : "text-vermilion"}`} data-testid={testId}>{value.toFixed(1)}%</p>
      <p className="text-xs text-muted-foreground">{ok ? "Meets" : "Below"} the {target}% target</p>
    </div>
  );
}

export function ExternalChecksPanel({ data }: { data: ExternalChecks }) {
  const { ai, plagiarism } = data;
  return (
    <div className="sx-card space-y-3 p-4 text-sm" data-testid="panel-external-checks">
      <p className="sx-eyebrow">Independent checks · {data.provider}</p>
      <div className="grid grid-cols-2 gap-3">
        {plagiarism && <Score label="Unique (web plagiarism)" value={plagiarism.uniquePercent} target={data.target} testId="text-unique-percent" />}
        {ai && <Score label="Human-written (AI check)" value={ai.humanPercent} target={data.target} testId="text-human-percent" />}
      </div>
      {plagiarism && plagiarism.matches.length > 0 && (
        <div>
          <p className="text-xs font-medium">Matched online sources ({plagiarism.plagiarizedSentences} of {plagiarism.totalSentences} sentences)</p>
          <ul className="mt-1 space-y-2 text-xs">
            {plagiarism.matches.map((m, i) => (
              <li key={i} className="rounded border p-2">
                <p>"{m.matchedText}"</p>
                <a href={m.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-muted-foreground underline">{m.sourceUrl}<ExternalLink className="h-3 w-3" /></a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {ai && ai.flagged.length > 0 && (
        <div>
          <p className="text-xs font-medium">Passages flagged as AI-written or AI-assisted</p>
          <ul className="mt-1 space-y-2 text-xs">
            {ai.flagged.map((w, i) => <li key={i} className="rounded border p-2"><span className="font-medium">{w.label} · {w.confidence} confidence.</span> {w.text}</li>)}
          </ul>
        </div>
      )}
      {data.errors?.map((e, i) => <p key={i} className="text-xs text-vermilion">{e}</p>)}
      <p className="text-[11px] text-muted-foreground">Results from Pangram Labs, an independent service. AI detectors can be wrong, so check flagged passages yourself. Checked {new Date(data.checkedAt).toLocaleString()}.</p>
    </div>
  );
}
