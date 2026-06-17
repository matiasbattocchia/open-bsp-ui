# Claude Code Instructions

## UI

Read the README.md.

## API

Read the [OpenBSP API README](../open-bsp-api/README.md) for project context,
architecture, deployment, and **local development workflow** (database schema
changes, migrations, type generation).

## Key Conventions

- **Schema files** live in `../open-bsp-api/supabase/schemas/` — always edit
  these, never create tables directly via SQL queries or write migration files
  by hand.
- **`db_types.ts`** is auto-generated. Never edit manually. See "Syncing types"
  below.
- **Hand-written shared types** (message/status/extra/template types, e.g.
  `OrganizationExtra`, `MediaTypes`, `IncomingMessage`) are **mirrored** from
  the API's `_shared/types/*` into `src/supabase/types/*`. See "Syncing types"
  below.

## Syncing types (API → UI)

The UI mirrors the API's types but cannot use them verbatim — it uses
extensionless imports, omits server-only deps and webhook/endpoint types it
never ingests, and intentionally diverges on a few fields. So a re-sync is
**paste → fix imports/prune → re-apply divergences**, never a blind copy.

- **`src/supabase/db_types.ts`** (DB-generated): the source of truth is the live
  DB. Regenerate in the API repo, then copy here — **but ensure the `billing`
  schema is included** (a bare `gen types` can default to public-only and
  silently drop it, breaking `useBilling`). When unsure, prefer the API repo's
  checked-in `_shared/db_types.ts` only if it carries `billing`; otherwise keep
  the existing copy. IG/feature work that only touches `extra` JSON columns
  needs no regen.
- **`src/supabase/types/*`** mirror `../open-bsp-api/.../_shared/types/*`:
  - Each intentional difference is tagged inline with `// @ui-divergence: …`.
    Preserve these across a paste — do **not** let an API paste overwrite them.
  - Pure UI-only additions (no API counterpart) live in `types/ui_types.ts`,
    which is never overwritten by a paste.
  - `types/database_types.ts` is UI-bespoke (typed `Database` wrapper, strict
    agent rows) — not mirrored.
- **Run `npm run types:sync-check`** (`scripts/check-type-sync.sh`) to list
  every `@ui-divergence` tag and show a normalized diff of each mirrored file vs
  the API source — this is how you find drift and the exact lines to re-apply
  after a paste.
- After any sync: `npm run build` (tsc) + `npm run lint` must stay green.
