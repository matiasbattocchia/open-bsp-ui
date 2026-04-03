import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { TickProvider } from "./contexts/useTick";
import { WhatsAppIntegrationProvider } from "./contexts/WhatsAppIntegrationContext";
import { loadTranslations } from "./i18n/translations";
import type { Language } from "./stores/uiSlice";

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
  } catch { /* ignore */ }

  const nav = navigator.language;
  if (nav.startsWith("en")) return "en";
  if (nav.startsWith("pt")) return "pt";
  return "es";
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
