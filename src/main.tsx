import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { TickProvider } from "./contexts/useTick";
import { WhatsAppIntegrationProvider } from "./contexts/WhatsAppIntegrationContext";
import { loadTranslations } from "./i18n/translations";
import { detectDefaultLanguage, type Language } from "./stores/uiSlice";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient();

// After a deploy, an open tab may still reference hashed chunks that no longer
// exist ("Failed to fetch dynamically imported module"). Vite surfaces this as
// vite:preloadError — reload once to pick up the new build. The timestamp
// guard avoids a reload loop if the fresh build also fails to load.
window.addEventListener("vite:preloadError", (event) => {
  const KEY = "chunk-reload-at";
  const last = Number(sessionStorage.getItem(KEY) || 0);
  if (Date.now() - last < 10_000) return; // let the error surface

  sessionStorage.setItem(KEY, String(Date.now()));
  event.preventDefault();
  window.location.reload();
});

// Dark mode detection
const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

function updateTheme(e: MediaQueryListEvent | MediaQueryList) {
  if (e.matches) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

// Initial check
updateTheme(darkModeMediaQuery);

// Listen for changes
darkModeMediaQuery.addEventListener("change", updateTheme);

// Preload translations before rendering
function detectLanguage(): Language {
  try {
    const stored = JSON.parse(localStorage.getItem("app-state") || "{}");
    if (stored?.state?.ui?.language) return stored.state.ui.language;
  } catch {
    /* ignore */
  }

  return detectDefaultLanguage();
}

const initialLang = detectLanguage();
await loadTranslations(initialLang);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TickProvider>
        <WhatsAppIntegrationProvider>
          <RouterProvider router={router} />
        </WhatsAppIntegrationProvider>
      </TickProvider>
    </QueryClientProvider>
  </StrictMode>,
);
