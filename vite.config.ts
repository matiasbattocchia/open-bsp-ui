import { defineConfig, type Plugin } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

// Onboarding links open on pages that don't say OpenBSP, and link previews
// (WhatsApp, email) read the HTML without running the app. So each service
// gets its own copy of index.html, in a neutral voice, which public/_redirects
// serves for /onboard/<service>/*.
const ONBOARD_SERVICES = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  tiktok: "TikTok",
};

function onboardPages(): Plugin {
  let outDir = "dist";

  return {
    name: "onboard-pages",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    // From the index.html the build wrote, scripts and styles included.
    closeBundle() {
      const index = fs.readFileSync(path.join(outDir, "index.html"), "utf8");

      // The app's branding: icons, manifest, theme color, previews.
      const branding = index
        .replace(/<!-- (?:Open Graph|Twitter Card)[^>]*-->\s*/g, "")
        .replace(
          /<meta\s[^>]*(?:name|property)="(?:description|theme-color|og:[^"]*|twitter:[^"]*)"[^>]*>\s*/g,
          "",
        )
        .replace(
          /<link\s[^>]*rel="(?:icon|apple-touch-icon|manifest)"[^>]*>\s*/g,
          "",
        );

      for (const [service, name] of Object.entries(ONBOARD_SERVICES)) {
        const title = `Connect your ${name}`;
        const description = `Follow this link to connect your ${name} account.`;
        const head = [
          `<link rel="icon" type="image/svg+xml" href="/onboard-icon.svg" />`,
          `<title>${title}</title>`,
          `<meta name="description" content="${description}" />`,
          `<meta property="og:type" content="website" />`,
          `<meta property="og:title" content="${title}" />`,
          `<meta property="og:description" content="${description}" />`,
          `<meta name="twitter:card" content="summary" />`,
          `<meta name="twitter:title" content="${title}" />`,
          `<meta name="twitter:description" content="${description}" />`,
        ].join("\n    ");

        fs.writeFileSync(
          path.join(outDir, `onboard-${service}.html`),
          branding.replace(/<title>[\s\S]*?<\/title>/, head),
        );
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
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
    onboardPages(),
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
