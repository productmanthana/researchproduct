---
name: Verifying open-access retrieval
description: Why successful metadata calls are insufficient evidence that full-text retrieval works.
---
Verify automatic full-text access with an actual licensed file download and successful text extraction, not just an open-access flag or a successful metadata response.

**Why:** Live catalogue records supplied reuse licences while omitting PDF links, and a publisher download URL returned an HTML error despite valid paper metadata. These are distinct failure modes.

**How to apply:** Preserve explicit abstract fallback notices and use an opt-in live extraction check when changing full-text providers. Never infer reusable full-text access solely from discoverability.

A failed draft/citation check is not evidence that the relevant literature is absent.

**Why:** A run rejected every draft claim despite having six public abstracts. A bounded reconstruction from those same abstracts subsequently produced five independently supported claims.

**How to apply:** Distinguish missing material, literal citation-matching failures and independent support rejections. Permit one budgeted reconstruction using exact excerpts and smaller claims, then apply the same evidence checks. Bind page metadata only to an exactly identified source with a matching quote; never guess a source or accept a fabricated quote. Retain diagnostic counts, not raw private drafts, and do not present unverified draft caveats as findings when no claims pass.
