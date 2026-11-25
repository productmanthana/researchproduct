/**
 * Reviewers reject a reference list that cites predatory or hijacked venues, and they flag low-tier
 * "international research journal" outlets. A paper on wind forecasting in a health journal
 * (a classic hijacked-journal sign) or in a listed low-tier outlet is left out of scholarly drafts.
 */
const LOW_TIER_VENUES = [
  /international research journal on advanced engineering hub/i,
  /\birjaeh\b/i,
  /international journal of research and scientific innovation/i,
  /\bijrsi\b/i,
  /journal of intelligent decision making and information science/i,
  /international journal of (?:innovative )?research in (?:science,? )?engineering and technology/i,
  /international journal of engineering research (?:&|and) technology/i,
  /international journal of scientific research in (?:science,? )?engineering and technology/i,
  /world journal of advanced research and reviews/i,
  /international journal for multidisciplinary research/i,
];

// Venue disciplines that do not publish engineering or physical-science work; a paper's title outside
// the same discipline in such a venue indicates a hijacked or mis-indexed record.
const DISCIPLINES: [RegExp, RegExp][] = [
  [/sa[uú]de|health|nursing|medic|clinic|adolesc|pediatr|dental|pharma|hospital|psychiatr|oncolog/i,
   /health|medic|clinic|patient|disease|nursing|hospital|adolesc|child|drug|therap|epidemi/i],
  [/\blaw\b|legal|jurisprud|theolog|relig/i, /\blaw\b|legal|regulat|relig|theolog/i],
  [/education|pedagog|teaching|linguist|literatur(?:e|a) (?:studies|review of)/i, /educat|teach|learn(?:ers|ing outcomes)|student|curricul|language/i],
];

/** Why a paper's venue is unsuitable for a submission reference list, or undefined when it is acceptable. */
export function unsuitableVenue(p: { title?: string; venue?: string; doi?: string }) {
  const venue = (p.venue ?? "").trim();
  if (!venue) return undefined;
  if (LOW_TIER_VENUES.some(r => r.test(venue))) return "low-tier venue";
  const title = p.title ?? "";
  if (DISCIPLINES.some(([field, topic]) => field.test(venue) && !topic.test(title))) return "venue outside the paper's discipline";
  return undefined;
}
