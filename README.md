<h1 align="center">OpenBSP UI</h1>
<p align="center">
  <strong>Open-source WhatsApp Web interface</strong>
</p>
<p align="center">
  Self-hostable, multi-tenant, and AI-agent ready. Built for <a href="https://github.com/matiasbattocchia/open-bsp-api">OpenBSP API</a>.
</p>

<p align="center">
  <a href="https://web.openbsp.dev"><img src="https://img.shields.io/badge/%F0%9F%9A%80_try_it-web.openbsp.dev-C26A3D" alt="Try it"></a>&nbsp;
  <a href="https://unlicense.org/"><img src="https://img.shields.io/badge/license-Unlicense-blue.svg" alt="License: Unlicense"></a>&nbsp;
  <a href="https://github.com/matiasbattocchia/open-bsp-ui/stargazers"><img src="https://img.shields.io/github/stars/matiasbattocchia/open-bsp-ui" alt="GitHub Stars"></a>&nbsp;
  <a href="https://github.com/matiasbattocchia/open-bsp-ui/commits/main"><img src="https://img.shields.io/github/last-commit/matiasbattocchia/open-bsp-ui" alt="Last Commit"></a>&nbsp;
  <a href="https://chat.whatsapp.com/Ch6AwZizSDt5quzHodcYh5"><img src="https://img.shields.io/badge/Community-25D366?logo=whatsapp&logoColor=white" alt="Community"></a>
</p>

<p align="center">
  <img src="./screenshot.png" alt="OpenBSP UI Screenshot" width="800">
</p>

## Features

### UI

- Live updates via Supabase Realtime
- Responsive, mobile-first design
- Dark mode
- Spanish, English, and Portuguese
- Built with [Vite](https://vitejs.dev/), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Zustand](https://zustand-demo.pmnd.rs/), [TanStack Query](https://tanstack.com/query) + [Router](https://tanstack.com/router)

### App

- **Conversations** — Real-time WhatsApp-style chat with media support (images, audio, documents), message status indicators, and inline template sending
- **Contacts** — Address book with phone validation
- **AI Agents** — Create and configure agents with any provider, set tools, and instructions
- **Templates** — WhatsApp message template builder with variable pills, formatting preview, and category management
- **Integrations** — WhatsApp Business account connection via Embedded Signup
- **Settings** — Organization management, team members with roles (owner/admin/member), API keys, webhooks
- **Stats** — Usage charts and billing quota dashboards
- **Multi-org** — Switch between organizations; invite and onboard team members

## Deployment

> [!NOTE]
> **Deploy in under 5 minutes** — no local environment required. This is an SPA that can be hosted on any static site hosting service.

### Cloudflare Pages

1. **Fork** this repository (`main` branch)
2. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**
3. Select your fork and use these build settings:
   - Production branch: `main`
   - Framework preset: `React (Vite)`
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Set environment variables:
   - **VITE_SUPABASE_URL**
   - **VITE_SUPABASE_ANON_KEY**
   - **VITE_META_APP_ID** — Optional. Needed for WhatsApp Embedded Signup.
   - **VITE_FB_LOGIN_CONFIG_ID** — Optional. Needed for Tech Provider flow.
5. **Save and deploy**

You are live! 🚀

## Development

### Local setup

You need a running [OpenBSP API](https://github.com/matiasbattocchia/open-bsp-api) — either locally via `npx supabase start` or a hosted Supabase project.

```bash
npm install
```

Create a `.env` file:

```env
VITE_SUPABASE_URL=http://localhost:54321     # or your Supabase project URL
VITE_SUPABASE_ANON_KEY=your-anon-key
# VITE_META_APP_ID=                          # optional, for WhatsApp Embedded Signup
# VITE_FB_LOGIN_CONFIG_ID=                   # optional, for Tech Provider flow
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### i18n (Internationalization)

The UI is written in Spanish (the default language) and supports English and Portuguese translations. All user-facing strings use the `t()` function from `src/hooks/useTranslation.tsx`, which returns the Spanish key as-is or looks up a translation from `public/locales/{lang}.json`.

**Adding new strings**: wrap any user-facing text with `t("Texto en español")`. The Spanish key is the source of truth — no entry in `en.json`/`pt.json` means the Spanish text is shown.

**Adding translations**: add the corresponding entries to `public/locales/en.json` and `public/locales/pt.json`.

**Checking for drift**: run the sync script to detect missing or stale keys:

```bash
./scripts/sync-translations.sh
```

## Community

Questions, ideas, or feedback? Join our [WhatsApp Community](https://chat.whatsapp.com/Ch6AwZizSDt5quzHodcYh5) or open an [issue](https://github.com/matiasbattocchia/open-bsp-ui/issues). We'd love to hear from you.
