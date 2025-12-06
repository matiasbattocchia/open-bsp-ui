import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./main.css";
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TickProvider>
        <RouterProvider router={router} />
      </TickProvider>
    </QueryClientProvider>
  </StrictMode>,
);
