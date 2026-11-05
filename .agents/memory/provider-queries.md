---
name: Provider query contracts
description: Provider-safe query construction, relevance-preserving recency and explicit partial-coverage reporting.
---

## Recency does not establish topical relevance

Do not implement “recent first” by sorting broad provider search matches solely by publication timestamp.

**Why:** Provider keyword queries can match weakly related records; chronological ordering promoted stellar-wind and robotics papers for a wind-turbine-efficiency question.

**How to apply:** Obtain relevance-ranked results within a recent publication-date window alongside broader relevance-ranked results, retain a topical floor for the recent batch, and only then order the combined candidates by date. Keep older relevant evidence available and report publication-date precision honestly.

Do not forward a conversational question verbatim as every provider's search expression. Respect each provider's query language.

**Why:** DOAJ rejected a natural-language question ending with a question mark as a disallowed Lucene feature. arXiv's implicit query parsing produced extremely broad matches when a whole sentence was forwarded without explicit term conjunctions. A valid HTTP response alone does not demonstrate a meaningful search.

**How to apply:** Plan short topical queries for Ask, normalize literal queries safely for Discover, preserve DOI lookups, and test provider-specific syntax rather than assuming all APIs accept plain text identically.

Detect upstream HTML bot challenges and distinguish them from usable JSON/XML responses. Do not bypass provider bot checks or report failed providers as contributing results.

**Why:** dblp returned HTTP 202 with a bot-check HTML page. Treating all 2xx statuses as connected obscured the cause and retried a request the app could not satisfy.

**How to apply:** Preserve explicit partial-coverage warnings, bounded timeouts and cooldowns. A healthy provider's results do not imply the other providers succeeded.
