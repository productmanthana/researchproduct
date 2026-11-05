---
name: Dependency generation quirks
description: Non-obvious Orval and Vite behavior encountered during the first build.
---
Orval may regenerate the package barrel, undoing manual export fixes. Path validators and query interfaces can have identical names on operations combining path and query parameters.

**Why:** Removing a conflicting barrel export by hand was undone by the next codegen run.

**How to apply:** Keep generation-time fixes in the codegen hook rather than editing generated output. React Query generation must match the installed major version.

After changing React and react-dom together, Vite's optimized dependency cache may still contain the older react-dom even when pnpm resolves matching versions.

**Why:** A clean workflow restart alone retained the old optimized renderer and the public page failed with a React version mismatch.

**How to apply:** Confirm package resolution first; when it is correct, clear only the affected artifact's generated Vite dependency cache and restart. Do not downgrade working dependency versions to match stale cache output.
