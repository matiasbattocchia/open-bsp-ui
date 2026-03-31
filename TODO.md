# TODO

## Before Product Hunt Launch

- [ ] (enhancement) Translations

- [-] (feat) Templates

- [x] (enhancement) Media messages colors

## General

- [x] (feat) Users onboard their own clients flow (add org address without giving access to org)

- [ ] (enhancement) Free AI providers API keys instructions (in the UI)

- [ ] (enhancement) Auth headers / tokens
  - Webhooks -> token, the back prepends Bearer
  - API keys -> confusing: Supa client vs cURL / Supa API vs Edge Functions
  - HTTP tool -> front sets the auth header but says "token" in the UI
  - MCP tool -> same
  - SQL tool (Turso) -> ok

- [x] (enhancement) Test conversation names

- [x] (feat) Respond to invitation

- [ ] (enhancement) Eliminated agent messages display name

- [ ] (enhancement) Display form errors (like in /templates)

- [ ] (enhancement) Not found section message for conversations, contacts, etc. (like in /templates)

- [ ] (enhancement) Loader (spinner or skeleton) for list and detail views (like in /templates)

- [x] (enhancement) Internal messages preview

- [x] (bug) Error internal messages are shown as incoming in test conversations

- [ ] (feat) Modals (delete confirmation)

- [x] (feat) Annotator configuration

- [ ] (feat) Client-side cache using IndexedDB

- [x] (enhancement) Hide empty conversations from the chat list

- [x] (enhancement) General feedback / spinner (delete, accept invitation, ...)

- [x] (enhancement) Primary button spinner placement to the left of the text

- [ ] (enhancement) Active conversation or resource in path from another organization
  - The conversation is not in the store
  - Also contacts / contacts_addresses depend on the organization to which the conversation belongs

- [ ] (bug) Google login redirect does not respect hash identifier. It seems Supabase drops it or replaces it with an access token

https://develop.open-bsp-ui.pages.dev/settings/organization/new#access_token=eyJhbGciOiJFU...tQugBjxzngiNVg&expires_at=1767219571&expires_in=3600&provider_token=ya...nw0293&refresh_token=ktzzl77plo42&token_type=bearer

If redirected to organizations/new from this URL, the cancel button returns to SSO

- [ ] (bug) Re-login does not initializes data, needs to refresh

- [ ] (enhancement) Display email in member view (should be made available at extra so we don't need RLS to read auth.users)

- [ ] (enhancement) Show more... could improve (it counts chars but many new lines can make it show more than expected)
