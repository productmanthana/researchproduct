---
name: Retrieval and spending decisions
description: Product scope and billing safety reasons behind the selected-material research pipeline.
---
The user chose live provider catalogue search, not downloading the complete catalogue. They want their own research software rather than PaperQA2 or a similar packaged research application.

**Why:** The user's ₹30,000 monthly operating target is incompatible with independently hosting hundreds of millions of full papers. A provider's metadata coverage is not the number of readable full-text documents available to this app.

**How to apply:** Describe provider search coverage separately from locally retained evidence. Never claim the complete catalogue has been downloaded, embedded, or visually analysed.

The user wants Weaviate on a separate Evidora-only cluster, not merely an Evidora collection within their other products' cluster.

**Why:** They explicitly selected “Separate cluster” because other products also use Weaviate.

**How to apply:** Confirm the supplied endpoint belongs to the isolated cluster before writes or migration. Do not modify other products' collections or silently substitute collection-level isolation.

The user approved finding papers from title-and-abstract vectors first, then retrieving and analysing the relevant PDFs on demand, including discovery of paywalled papers through available metadata.

**Why:** They want broader research discovery without downloading or processing every full paper upfront.

**How to apply:** Grow the public metadata index alongside live provider search. Keep abstracts distinct from verified full-text evidence, preserve source IDs, and never describe incremental indexing as complete coverage of hundreds of millions of papers.

Initial research-idea selection should use bounded abstracts and project text rather than automatically downloading and visually inspecting full papers or embedding every discovered catalogue result. Keep deeper reading for explicit full-text/figure requests and research-document development; retain citation validation and independent review.

**Why:** The user identified waiting for initial idea cards as a problem. Deep paper reading before choosing a direction adds delay, while abstract-backed proposals can be clearly labelled without claiming verified novelty.

**How to apply:** State the initial evidence boundary honestly, preserve source identities and evidence restrictions, and do not apply this shortcut to journal papers, theses or literature reviews.

Keep failed-run allowance refunds separate from AI spending. Ambiguous timeouts may already have been billed, so retain conservative cost reservations instead of silently refunding money estimates.

**Why:** Otherwise retries and interrupted analyses can bypass the service budget despite apparently correct per-user quotas.

**How to apply:** Track each paid request before dispatch, including embedding, synthesis, comparison, and verification calls. State that local estimates and caps do not cap external invoices or storage charges.

Use direct OpenAI for embeddings; the Replit OpenAI proxy did not support the embeddings API when this pipeline was introduced. OpenAI generation uses the direct account as well. The user separately approved their own OpenRouter account for DeepSeek with Internet search, not a migration of scholarly retrieval, patents or all generation.

**Why:** Treating the proxy as supporting every OpenAI endpoint would leave semantic search broken, and mixing billing sources obscures the user's operating budget.

**How to apply:** Recheck current integration capabilities before changing providers. Keep credentials in Secrets and never print them. Track OpenRouter search and model charges in the shared budget; its credits are separate from the user's direct DeepSeek/OpenAI accounts.

An explicit request to use the same papers must constrain follow-up discovery, even if a planner thinks additional searches would improve the answer.

**Why:** A real follow-up test asked for the same papers, but the planner expanded the search and cited a new paper. Better evidence does not justify silently changing the requested evidence scope.

**How to apply:** Enforce explicit reuse restrictions outside the LLM plan. When the selected papers cannot support the requested comparison, disclose insufficient evidence instead of expanding the scope without permission.

Keep private project retrieval separated from public discovery even when both share the Evidora-only cluster's collection.

**Why:** The chosen free cluster permits one collection; the user subsequently requested searchable project knowledge as well as public metadata. Public search must never return private drafts or uploads.

**How to apply:** Public retrieval must explicitly select public records; private retrieval must enforce both owner and project boundaries and recheck authoritative ownership and deletion state. A vector hit is not permission to read a document. Original files and exports belong in private file storage, not vector payloads.
