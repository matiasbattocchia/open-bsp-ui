# Open BSP UI

A beautiful WhatsApp Web clone designed to work seamlessly with [open-bsp-api](https://github.com/matiasbattocchia/open-bsp-api).

## Demo

You can test the application live at:
**[https://open-bsp-ui.pages.dev](https://open-bsp-ui.pages.dev)**

> **Note:** You will need a Google account to log in.

## Tech Stack

This project is a Single Page Application (SPA) built with modern web technologies.

-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **UI Framework**: [React](https://react.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Routing**: [TanStack Router](https://tanstack.com/router)
-   **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
-   **Data Fetching**: [TanStack Query](https://tanstack.com/query)

## Deployment

As a Single Page Application, this project can be hosted on any static site hosting service. We recommend **Cloudflare Pages** for its speed and ease of use.

### Deploying to Cloudflare Pages

1. **Fork** this repository.
2. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
3. Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
4. Connect GitHub and select your forked repository.
5. Use the following build settings:
  - Production branch: `main`
  - Framework preset: `React (Vite)`
  - Build command: `npm run build`
  - Build output directory: `dist`
6. Click **Save and deploy**. Ualá!

## Getting Started Locally

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Run the development server:
    ```bash
    npm run dev
    ```

3.  Open [http://localhost:5173](http://localhost:5173) in your browser.
