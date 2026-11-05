# Evidora Research

Independent research workspace for Indian engineering students and scholars, with cited AI analysis and private document storage. Evidora is a working name, not a trademark-cleared company name.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/evidora` — React UI, Clerk sign-in and private workspace.
- `artifacts/api-server/src/routes` — catalogue, projects/library, document upload and analysis APIs.
- `artifacts/api-server/src/lib/research-engine.ts` — bounded job worker and evidence-checking pipeline.
- `lib/api-spec/openapi.yaml` — API contract (JSON syntax, valid YAML); regenerate after changes.
- `lib/db/src/schema/research.ts` — PostgreSQL schema; user file bytes belong only in App Storage.

## Architecture decisions

- Use the existing pnpm Express/React architecture rather than introducing a second Next/FastAPI deployment for the initial release.
- Same agreed GPT-4.1 model and evidence checks across plans. Do not silently change models based on price tier.
- Starter trial is bounded and lifetime to permit evaluation while payment setup is disconnected; no client-side paid-plan grants.
- No prepaid data licences or large-scale vector infrastructure may be provisioned without separate approval. Current search is federated, not a locally imported 300M corpus.
- The user explicitly chose live provider catalogues rather than hosting our own full catalogue. Complete broad discovery through provider APIs and cache/deduplicate retrieved records; do not turn catalogue hosting into a prerequisite.
- Automated citation existence, quote and support checks reduce errors but cannot guarantee correctness. Clearly label metadata-only, abstract-only and selected-page evidence.

## Product

Live search adapters for OpenAlex, Crossref and arXiv, conservative deduplication, private projects, notes/tags, PDF and image uploads, queued cited answers/reviews/image analysis, editable drafts, source-linked claims and DOCX/Markdown exports. Topic summaries describe only returned results.

Paid upgrades are deliberately disabled. Prices: Student ₹499 (20/1/10), Researcher ₹999 (60/3/30), Faculty/Pro ₹1,999 (150/6/60): answers/reviews/images per month. Starter allowance is 3/1/2 lifetime.

Not yet delivered: full-corpus ingestion/vector retrieval, additional source integrations, publisher licences, institution administration and institution/India-share analytics, comprehensive structured method/dataset/result extraction, full journal-style formatting. Phase 2 writing/thesis tools remain out of scope.

## User preferences

- Build our own software; do not use PaperQA2 or a ready-made research assistant.
- The user wants the full app ready, not a starter version with major requirements deferred. Do not present partial catalogue coverage or unverified workflows as completion.
- Broad coverage without duplicate paper records; preserve distinct preprint/published versions.
- Analyse screenshots and scientific visuals, preserve private originals, and prioritize accuracy with lower operating cost.
- User declined the payment integration; continue without it. Do not add a different payment provider or activate charges silently.
- The name must be completely different from VYAAS AI.

## Gotchas

- OpenAlex anonymous search was returning 429 during initial development; render partial-source warnings, never replace failures with fictional results.
- `lib/api-spec/fix-zod-exports.mjs` keeps generated server validators from colliding with similarly named query parameter interfaces.
- Public discovery requires no sign-in; private routes must keep Clerk owner checks. Never remove authentication to preview private screens.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
