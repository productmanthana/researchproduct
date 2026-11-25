/** Draft kinds that must pass the plagiarism check before export. */
export const GATED_KINDS = ["journal", "thesis", "literature", "synopsis", "report"];

/**
 * Journal-style export limits (typical iThenticate/Turnitin practice). Drafting still aims for 99% original;
 * export is locked only when the overall match or the match to any single source exceeds these.
 */
export const EXPORT_LIMITS = { totalPercent: 10, singleSourcePercent: 3 };

/** Why this draft may not be exported yet, or null when it may. */
export function exportBlockReason(row: { kind: string; metadata?: any }): string | null {
  if (!GATED_KINDS.includes(row.kind)) return null;
  const report = row.metadata?.plagiarism;
  if (!report || typeof report.similarityPercent !== "number")
    return "Run the plagiarism check on the Originality page before exporting this draft.";
  const fix = "Rewrite, or quote and cite, the matched passages, then re-run the check.";
  if (report.similarityPercent > EXPORT_LIMITS.totalPercent)
    return `Export is blocked: ${report.similarityPercent}% of this draft matches other sources (limit ${EXPORT_LIMITS.totalPercent}%). ${fix}`;
  const top = (Array.isArray(report.sources) ? report.sources : [])
    .reduce((a: any, s: any) => (typeof s?.percent === "number" && s.percent > (a?.percent ?? -1) ? s : a), null);
  if (top && top.percent > EXPORT_LIMITS.singleSourcePercent)
    return `Export is blocked: ${top.percent}% of this draft matches one source, “${top.title}” (limit ${EXPORT_LIMITS.singleSourcePercent}% per source). ${fix}`;
  return null;
}
