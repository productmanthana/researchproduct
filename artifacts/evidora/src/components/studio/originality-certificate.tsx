import type { StudioItem } from "@workspace/api-client-react";
import { BadgeCheck } from "lucide-react";
import { plagiarismOf } from "./plagiarism-report";
import { aiDetectionOf } from "./ai-detection-panel";

/** Toolbar result of the checks run while the draft was written: shown as a pass, not a warning. */
export function OriginalityCertificate({ item }: { item: StudioItem }) {
  const report = plagiarismOf(item);
  const writing = aiDetectionOf(item);
  return (
    <>
      {report && report.originalPercent >= report.target && (
        <span className="sx-chip ok" title={`Checked while writing and again against this project, ${report.searched.scholarly} scholarly abstracts, ${report.searched.fullText} open full texts and ${report.searched.web} Internet pages.`} data-testid="status-originality-certificate">
          <BadgeCheck className="h-3 w-3" />Original · {report.similarityPercent.toFixed(1)}% shared wording
        </span>
      )}
      {writing && typeof writing.humanScore === "number" && writing.humanScore >= (writing.threshold ?? 99) && (
        <span className="sx-chip ok" title="Evidora's own writing-style estimate, not a certified detector result." data-testid="status-human-style">
          <BadgeCheck className="h-3 w-3" />Human-style writing · {Math.round(writing.humanScore)}%
        </span>
      )}
    </>
  );
}
