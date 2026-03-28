# Claude Code Instructions

## UI

Read the README.md.

## API

Read the [OpenBSP API README](../open-bsp-api/README.md) for project context, architecture, deployment, and **local development workflow** (database schema changes, migrations, type generation).

## Key Conventions

- **Schema files** live in `../open-bsp-api/supabase/schemas/` — always edit these, never create tables directly via SQL queries or write migration files by hand.
- **`db_types.ts`** is auto-generated. Never edit manually. After generation in the API repo, copy to `src/supabase/db_types.ts`.
- **JSON types** (e.g. `OrganizationExtra`, `HumanAgentExtra`) are manually defined and **mirrored between both repos**:
  - API: `../open-bsp-api/supabase/functions/_shared/supabase.ts`
  - UI: `src/supabase/client.ts`
