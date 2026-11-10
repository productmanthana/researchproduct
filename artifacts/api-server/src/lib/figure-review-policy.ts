export function figureReviewContext(request: string, manuscript: string, figures: unknown[], sources: unknown[]) {
  return {
    request,
    reviewedManuscript: manuscript.slice(0, 22000),
    scopeRule: "The reviewedManuscript is the actual document being illustrated. Other project drafts are context, not a replacement for it. Check section references and proposed methodology against this manuscript. Its proposed methods are not verified experimental results.",
    figures,
    sources,
  };
}

export function canRepairMissingFigures(kind: string, manuscript: string, request: string, existingCount: number, alreadyRetried: boolean) {
  return !alreadyRetried && existingCount === 0 && manuscript.trim().length >= 200
    && ["journal", "thesis", "literature", "synopsis"].includes(kind)
    && !/\b(?:no|without)\s+(?:figures?|diagrams?|illustrations?)\b|\btext[- ]only\b/i.test(request);
}
