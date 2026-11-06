---
name: Research experience priorities
description: User wants a simple question-to-answer flow with minimal waiting.
---
The user wants research to be very easy, with a direct question-to-answer flow and instant answers; they report that the current flow takes too long.

**Why:** The user identified waiting time as their main problem, rather than the choice of vector database.

**How to apply:** Prioritize end-to-end answer latency and simple interactions when evaluating architecture. Preserve the existing accuracy requirement; distinguish progress updates or provisional content from evidence-checked answers, and do not promise instant full-paper analysis.

The user wants numbered citations, a polished research interface, and research-related AI-agent names, using the supplied AnswerThis portal screenshots as a workflow reference.

**Why:** They explicitly requested numbering, better UI/UX, and named research agents after reviewing the competitor's answer/source and processing panels.

**How to apply:** Keep citations connected to their sources and research-role labels tied to actual processing. Design previews must not be presented as functioning new agents or measured speed improvements.

Show the named research roles in a processing progress bar, including names such as “Literature Survey Agent,” rather than only a text processing notice.

**Why:** The user explicitly requested agent names in a processing bar.

**How to apply:** Drive the active role from reported backend stages, not timed simulations; distinguish workflow position from estimated completion time and omit skipped discovery roles for same-paper follow-ups.

Publisher-specific requests such as “focus on IEEE publications from 2020 onward” are hard evidence restrictions, not just ranking preferences.

**Why:** The user flagged an MDPI paper in the evidence list for that IEEE-specific question.

**How to apply:** Restrict discovered, selected and cited papers consistently; exclude missing required publisher/year metadata instead of silently broadening the request. Keep historical answers intact and clearly flag answers generated before filtering was enforced.

Research answers should read as professional academic syntheses: organised evidence-based paragraphs, numbered citations, references and concise scientific limitations—not lists of internal processing notices. Default to expanded explanations of mechanisms, study conditions, measured results and defensible comparisons rather than a few isolated findings.

**Why:** The user requested university-quality research writing after seeing embedding, database and internal-ID details mixed into the answer, and explicitly chose “Expand research answers” after receiving only three short findings.

**How to apply:** Separate reproducibility/processing notes from the scientific narrative. Follow clear claim–evidence–analysis structure without implying Harvard endorsement, inventing research methods, or padding unsupported sections. Preserve verified claims and user-edited drafts when improving older presentations.

For expanded answers, word counts are targets, not minimums. Ask for distinct supported aspects in focused paragraphs rather than one long paragraph per paper.

**Why:** Whole-paragraph evidence checking can discard an otherwise useful discussion when one assertion is unsupported; requesting a longer total answer alone did not reliably produce a developed synthesis.

**How to apply:** Plan section and paragraph coverage, preserve independently supported material, and permit shorter outputs when evidence cannot support more detail. Never relax citation matching or repeatedly regenerate just to reach a word count.

The user approved the ivory/teal Research Studio design and asked to use it, with as many papers as practical shown on the right.

**Why:** They said “I think this is best design use it but right side show as much as papers.”

**How to apply:** Preserve the approved reading-and-evidence layout. The user also wants minimal top whitespace and conversation history moved out of the main content flow. Show retrieved papers separately from those selected or cited; never imply that a larger discovery list means every paper was read.

Paper details should expand below the clicked sidebar paper, without moving the page upward.

**Why:** The user explicitly requested downward expansion instead of an inspector above the list.

**How to apply:** Keep sidebar clicks in place; citation links may reveal their corresponding source.

The user wants processing options enabled by default and no repeated OpenAI-sending consent or PDF-page inspection switches anywhere in the app.

**Why:** They explicitly asked to remove these controls and make the available processing automatic.

**How to apply:** Keep the question-to-answer flow simple, without per-message consent checkboxes. Preserve source-selection boundaries, ownership checks, budget limits and truthful evidence limitations.

Default freshness policy: “Recent first, allow older.”

**Why:** The user chose this over excluding everything outside the last 60 days after noticing references from 2012–2022.

**How to apply:** Prioritise relevant newer publications in discovery and selection, retain useful older evidence, and distinguish the report date from source publication dates. A year alone is not proof of publication in the last two months; indexing delays prevent guarantees of complete coverage through yesterday. Do not imply a fresh search when reusing historical papers.

When usage limits are exhausted, the user wants this shown across the app, and clicking a restricted action should explain the limit rather than appear unresponsive.

**Why:** They explicitly asked for “limit reached” feedback everywhere when attempting to click.

**How to apply:** Distinguish account allowances from the shared service AI budget, preserve unlimited-account exemptions only for account quotas, and keep viewing saved research available.

The users are non-technical and want as few steps as possible; a visible six-step research journey feels overwhelming.

**Why:** The user explicitly rejected the six-step presentation of the connected design previews as too much for their audience.

**How to apply:** Keep research capabilities available without presenting a mandatory six-stage process. The user approved one chat-first workspace with conversation, evidence and writing as contextual states, not separate steps. Reveal sources and an editable draft alongside the conversation only when needed.

The user specifically approved the simplified writing preview: conversation on the left, editable working draft on the right, and sources available on demand.

**Why:** They supplied the writing-state screenshot and said “this is good.”

**How to apply:** Use this side-by-side composition as the preferred writing direction. Keep the conversation available while editing, without restoring a visible multi-step journey.
