# TODO

- [x] (enhacement) Test conversation names

- [x] (feat) Respond to invitation

- [ ] (enhacement) Eliminated agent messages display name

- [ ] (enhacement) Media messages colors

- [ ] (enhacement) Internal messages preview

- [ ] (bug) Error internal messages are shown as incoming in test conversations

- [ ] (feat) Modals (delete confirmation)

- [ ] (feat) Annotator configuration

- [ ] (enhacement) Translations

- [ ] (feat) Templates

- [ ] (feat) Client-side cache using IndexedDB

- [x] (enhacement) Hide empty conversations from the chat list

- [ ] (enhacement) General feedback / spinner (delete, accept invitation, ...)

- [ ] (enhancement) Primary button spinner placement to the left of the text

- [ ] (enhancement) Active conversation from another organization
  - The conversation is not in the store
  - Also contacts / contacts_addresses depend on the organization to which the conversation belongs

- [ ] (bug) Google login redirect does not respect hash identifier. It seems Supabase drops it or replaces it with an access token

https://develop.open-bsp-ui.pages.dev/settings/organization/new#access_token=eyJhbGciOiJFU...tQugBjxzngiNVg&expires_at=1767219571&expires_in=3600&provider_token=ya...nw0293&refresh_token=ktzzl77plo42&token_type=bearer

If redirected to organizations/new from this URL, the cancel button returns to SSO

- [ ] (bug) Re-login does not initializes data, needs to refresh