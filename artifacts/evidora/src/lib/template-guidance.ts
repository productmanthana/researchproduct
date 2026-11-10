type GuidanceRecord = { status: string; verifiedAt?: string | null };

/** A recorded review of instructions is not journal approval or a ranking check. */
export function instructionsReviewed(template: GuidanceRecord): boolean {
  const status = template.status.trim();
  if (/^verified$/i.test(status)) return true; // Older API records.
  return /^Official guidance reviewed;\s*supported layout rules applied\b/i.test(status)
    && !!template.verifiedAt && Number.isFinite(Date.parse(template.verifiedAt));
}
