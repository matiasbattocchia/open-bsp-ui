import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  define: {
    // Exposed to the client bundle for quick deploy verification.
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || "dev"),
    __DEPLOY_SHA__: JSON.stringify(
      (process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || "")
        .slice(0, 7) || "local",
    ),
    __DEPLOY_ID__: JSON.stringify(
      process.env.CF_PAGES_BUILD_ID || process.env.CF_PAGES_DEPLOYMENT_ID || "",
    ),
  },
  plugins: [
    // Please make sure that '@tanstack/router-plugin' is passed before '@vitejs/plugin-react'
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 600,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
