---
name: Research visuals
description: User expectations for related-paper maps and scientific illustrations.
---
The user wants optional related-paper diagrams with readable explanations, and topic-specific coloured scientific illustrations in literature reviews, journal papers and theses—not generic box diagrams for every subject.

**Why:** They supplied a related-papers network and an illustrated neural-training process as references, then explicitly requested both in the working app.

**How to apply:** Distinguish actual citations from search relevance; never imply a map proves novelty. Use meaningful role colours, scientific pictograms, numbered stages, correct arrow direction, captions and explanations. Keep technical labels exact and retain illustrations in Word/PDF. Measured charts still require actual data; a conceptual illustration is not experimental evidence.

Shared figure-renderer changes must also invalidate the browser's figure-preview cache.

**Why:** Existing scientific figures are rendered again by the download endpoint, but their browser preview blobs are cached indefinitely. A server-only geometry fix otherwise leaves the old diagram visible.

**How to apply:** Update the preview renderer cache version alongside shared geometry changes; preserve figure IDs, evidence and manuscript text rather than regenerating the research.
