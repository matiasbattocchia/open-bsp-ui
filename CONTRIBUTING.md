# Contributing

Thanks for your interest in contributing to Open BSP UI!

## Local Setup

1. Clone both repos:
   ```bash
   git clone https://github.com/matiasbattocchia/open-bsp-api
   git clone https://github.com/matiasbattocchia/open-bsp-ui
   ```

2. Start the API locally (requires Docker):
   ```bash
   cd open-bsp-api
   npx supabase start
   ```

3. Install UI dependencies and start the dev server:
   ```bash
   cd open-bsp-ui
   npm install
   npm run dev
   ```

## Conventions

- TypeScript strict mode
- Tailwind CSS for styling (no inline styles)
- File-based routing with TanStack Router
- TanStack Query for server state, Zustand for client state

## Submitting Changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Ensure `npm run build` and `npm run lint` pass
4. Open a pull request with a clear description

PRs are welcome for bug fixes, UI improvements, and new features.
