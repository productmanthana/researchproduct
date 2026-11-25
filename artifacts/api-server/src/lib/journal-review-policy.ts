/**
 * A journal paper without original results is a review or perspective. Editors check: a stated database
 * search with counts, 60+ references including the field's foundations, every section on the question,
 * confident prose, figures of the paper's own contribution and complete declarations.
 */

/** A journal draft without supplied experimental results is a review or perspective article. */
export function isJournalReview(kind: string, experimentalResults?: string) {
  return kind === "journal" && !experimentalResults?.trim();
}

/** Below this many cited works a journal review is sent back for a broader reference base. */
export const JOURNAL_REVIEW_MIN_CITED = 60;

export const JOURNAL_REVIEW_INSTRUCTIONS = `This journal manuscript is a review or perspective paper. Label the article type with a standard journal type: "Review article" or "Perspective". Never invent labels such as "narrative critique" or "framework proposal".
Section 2, Review Method, reports the search as the authors' method from searchRecord: the databases searched, the search date, the exact query strings, the years covered, records retrieved, records screened and included, and inclusion and exclusion criteria, with PRISMA-style counts in one sentence or a small table. Never say the review rests on abstracts, selected pages or publication extracts, that no database search was done, or that screening was not documented.
References: cite at least 60 distinct evidence items, more when available. Cite the field's foundational and most cited works, the standard benchmark competitions and datasets, and the established verification and evaluation literature, not only recent papers. When the paper argues about decisions or value, cite the decision literature it depends on (for example scheduling, unit commitment, reserve sizing or storage dispatch under uncertainty).
Scope: every section answers the research question. A topic adjacent to the question gets at most one paragraph that states the boundary and why it matters, never its own section. Never build a subsection on one case study, and never report page numbers of a cited source ("Page 5 estimates…").
Practice case: when evidence covers a real regulation, market rule or grid code that turns the paper's metric into a cost or penalty (prefer the jurisdiction named in the request), include a short boxed "Practice case" paragraph that works through it with citations. Skip it when no evidence covers one.
Voice: state findings confidently. Keep at most one limitation sentence per section ("does not establish", "cannot be inferred", "remains untested"); put the rest in Limitations once.
Declarations: Author contributions (CRediT roles), Funding, Conflicts of interest and Data availability, each as a bracketed placeholder for the authors when unknown.`;

const HEDGE = /\b(?:does not (?:establish|prove|demonstrate|determine|permit|isolate|imply)|do not (?:establish|prove|demonstrate|determine|permit|isolate)|cannot (?:establish|be inferred|be reconstructed|replace|substitute)|remains? (?:untested|unestablished|to be demonstrated)|not (?:independently )?(?:audited|verified|validated))\b/gi;

/** Limitation phrases per 1,000 words; reviewers read a high rate as an unconfident paper. */
export function hedgeRate(content: string) {
  const words = content.split(/\s+/).filter(Boolean).length;
  return words ? ((content.match(HEDGE) ?? []).length * 1000) / words : 0;
}

export const HEDGE_RATE_LIMIT = 4;
