/**
 * What a reviewer or guide checks first in a literature survey: one narrow focus covered in depth,
 * a reproducible search method, 50+ peer-reviewed works, a comparison table and evidence-based gaps.
 */

/** Papers selected for a literature survey; other long-form drafts use LITERATURE_PAPERS. */
export const SURVEY_PAPERS = 70;

/** A survey's paper selection is topped up to this many from the closest index matches. */
export const SURVEY_MIN_SELECTED = 45;

/** Below this many cited works a survey reads as a short essay, not a review. */
export const SURVEY_MIN_CITED = 40;

export const LITERATURE_SURVEY_INSTRUCTIONS = `Produce a literature survey (a review article) with these sections: Title, Abstract, Keywords, 1 Introduction, 2 Review Method, thematic review sections, a Comparison of Approaches section, Research Gaps and Future Directions, Conclusion.
Focus: a survey covers ONE narrow topic in depth, never several separate fields with one or two sources each. If the request spans several fields (for example structural inspection, condition monitoring, wake control, grid support and acoustics), choose the single focus the evidence covers most deeply and that best matches the request, make the title name that focus precisely, and state in the Introduction which adjacent topics are out of scope. Every thematic section must synthesise several studies; a section resting on one source is not allowed, so merge or drop it.
Coverage: cite at least 50 distinct evidence items, more when available. A reviewer rejects a survey with ten references. Cite the standard review articles and the foundational, highly cited studies of the focus as well as recent work, and name the main established methods of the field even when the newest papers do not. Prefer the original study over a review's secondary report; when a number is known only through a review, attribute it as reported in that review.
Review Method: report the search from searchRecord: databases, search date, the query strings, the years covered, records retrieved, records screened and included, and inclusion and exclusion criteria (peer-reviewed journal or conference papers on the focus, in English, with a method and a reported evaluation; excluded: off-topic work, vendor and news pages, duplicates). Write it as the authors' method. Never write that the search cannot be reproduced, that screening was not documented, or that the work rests on a "supplied collection" or "evidence entries".
Measures: include a section on how the focus is measured or evaluated: the established metrics, indices and evaluation measures the field uses, each defined, cited and compared for what it captures and misses. Do not rely on one method's measure.
Relevance: leave out evidence items that are not about the focus even when they are available (for example protection, power-quality devices, converter control or dispatch algorithms in a survey on resource complementarity); never stretch a section to use them.
A survey reviews the literature; it does not design a new study. Do not include a proposed study, required records, proposed measurement design or "the proposed work"; future work belongs in Research Gaps and Future Directions.
Length: 6,000 to 9,000 words of developed synthesis.
Thematic sections: organise by method family or problem stage, compare methods, data, test conditions, results and limitations across studies, and state where studies agree and disagree.
Comparison of Approaches: a pipe table | Study | Method | Data / test setting | Reported result | Limitation | with one row per key study (at least 12 rows), every row cited.
Sources: build the scientific argument from peer-reviewed work. Cite vendor, company and news pages at most twice and only for industry deployment context; label preprints and discussion papers as not yet peer reviewed.
Research Gaps: concrete gaps that follow from the compared studies, each tied to citations. Keep one consistent organising argument from the Introduction through the Conclusion.
Never leave author, affiliation or institution text in the body; the title page carries them.`;
