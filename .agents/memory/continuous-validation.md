---
name: Reliable database setup in CI
description: Avoiding falsely successful schema initialization in disposable validation databases.
---

Do not treat a zero exit status from `drizzle-kit push` as proof that schema creation succeeded. Follow setup with SQL that actually reads required tables.

**Why:** In a fresh validation database, a missing vector extension caused DDL errors while the schema command still reported success to the workflow. Tests then failed because later tables had never been created.

**How to apply:** Initialize the vector extension before applying the schema in disposable CI databases, and verify required tables afterward. CI must not receive the app's development/production database credentials or provider keys.
