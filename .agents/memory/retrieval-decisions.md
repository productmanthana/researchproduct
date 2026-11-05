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

Keep failed-run allowance refunds separate from AI spending. Ambiguous timeouts may already have been billed, so retain conservative cost reservations instead of silently refunding money estimates.

**Why:** Otherwise retries and interrupted analyses can bypass the service budget despite apparently correct per-user quotas.

**How to apply:** Track each paid request before dispatch, including embedding, synthesis, comparison, and verification calls. State that local estimates and caps do not cap external invoices or storage charges.

Use direct OpenAI for embeddings; the Replit OpenAI proxy did not support the embeddings API when this pipeline was introduced. Generation also uses the direct account so its token-based planning prices share one billing source.

**Why:** Treating the proxy as supporting every OpenAI endpoint would leave semantic search broken, and mixing billing sources obscures the user's operating budget.

**How to apply:** Recheck current integration capabilities before changing providers. Keep credentials in Secrets and never print them.

An explicit request to use the same papers must constrain follow-up discovery, even if a planner thinks additional searches would improve the answer.

**Why:** A real follow-up test asked for the same papers, but the planner expanded the search and cited a new paper. Better evidence does not justify silently changing the requested evidence scope.

**How to apply:** Enforce explicit reuse restrictions outside the LLM plan. When the selected papers cannot support the requested comparison, disclose insufficient evidence instead of expanding the scope without permission.
