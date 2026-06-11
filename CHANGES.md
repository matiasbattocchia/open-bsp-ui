# Changes — 2026-06-10

## open-bsp-ui

### TenantDashboard (`src/components/TenantDashboard.tsx`)
- **New component** — three-tab dashboard with Management Grid, Webhook Settings, and Shared Inbox
- **Management Grid**: Fetches `organizations_addresses` rows, renders WABA ID / Phone Number ID from the `extra` JSONB column, includes an Actions column with a "Test Outbound" button per row
- **Test Outbound modal**: Collects recipient number and message content, sends a secure POST to `https://wlnquwjdbrlnxfwonvnd.supabase.co/functions/v1/test-outbound` with session JWT + anon key auth, green "Sent" on success (auto-closes after 1.5s), red "Failed" with error text on failure
- **Webhook Settings**: Adds webhooks via POST to `https://wlnquwjdbrlnxfwonvnd.supabase.co/functions/v1/register-webhook` with session auth, edit/delete via Supabase client, auto-refresh on insert
- **Shared Inbox**: Real-time message feed via Supabase channel, compose and send outgoing messages

### Sidebar navigation (`src/components/Menu.tsx`)
- Removed: Integrations (`/integrations`), Add Contact (`/contacts`), Agents (`/agents`), Quotas sections
- Removed icon imports: `Unplug`, `Bot`, `NotebookTabs`
- Kept: Conversations, Stats, Settings

### Supabase client (`src/supabase/client.ts`)
- Fixed `reconnectAfterMs`: moved from post-creation property assignment into `createClient` options under the `realtime` key (read-only getter in updated SDK)

### Configuration
- `tsconfig.json`: repaired truncated file (was missing closing `]` and `}`)
- `vite.config.ts`: includes `babel-plugin-react-compiler`

## open-bsp-api

- No changes in this session — the whatsapp-dispatcher and test-outbound edge functions were already in place
