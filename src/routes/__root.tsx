import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useInitialDataFetch } from "@/hooks/useInitalDataFetch";

function RootLayout() {
  useAuth();
  useRealtimeSubscription();
  useInitialDataFetch();

  return <Outlet />;
}

export const Route = createRootRoute({
  component: RootLayout,
});
