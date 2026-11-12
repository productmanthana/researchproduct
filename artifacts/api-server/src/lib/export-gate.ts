import { ORIGINALITY_TARGET } from "./plagiarism-check";

/** Draft kinds that must pass the plagiarism check before export. */
export const GATED_KINDS = ["journal", "thesis", "literature", "synopsis", "report"];

/** Why this draft may not be exported yet, or null when it may. */
export function exportBlockReason(row: { kind: string; metadata?: any }): string | null {
  if (!GATED_KINDS.includes(row.kind)) return null;
  const report = row.metadata?.plagiarism;
  if (!report || typeof report.similarityPercent !== "number")
    return "Run the plagiarism check on the Originality page before exporting this draft.";
  const allowed = 100 - ORIGINALITY_TARGET;
  if (report.similarityPercent > allowed)
    return `Export is blocked: ${report.similarityPercent}% of this draft matches other sources (limit ${allowed}%). Rewrite, or quote and cite, the matched passages, then re-run the check.`;
  return null;
}
