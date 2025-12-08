import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { TickProvider } from "./contexts/useTick";

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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TickProvider>
        <RouterProvider router={router} />
      </TickProvider>
    </QueryClientProvider>
  </StrictMode>,
);
