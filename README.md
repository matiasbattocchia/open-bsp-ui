This is a [Next.js](https://nextjs.org/) project that uses React and Tailwind.

## Getting Started

Install the dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

The development server reloads whenever it detects changes.

## Deployment

https://dash.cloudflare.com/7bb9714f43d84ddb520f3e1e3b739b21/workers-and-pages/create/pages

cloudflare > Compute & AI > Workers & Pages > Create application > Pages > Import an existing Git repository

Project name: ...
Production branch: main

### Build settings

Framework preset: Next.js (Static HTML Export)
Build command: `npx next build`
Build output directory: `out`

Environment variables

- SUPABASE_URL
- SUPABASE_ANON_KEY

#### Optional

- META_APP_ID
- FB_LOGIN_CONFIG_ID

Facebook Login for Business > Configurations > Configuration ID

https://developers.facebook.com/apps/629323992623834/business-login/configurations
