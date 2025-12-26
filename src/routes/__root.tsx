import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useInitialDataFetch } from "@/hooks/useInitalDataFetch";
import useBoundStore from "@/stores/useBoundStore";
import { redirect } from "@tanstack/react-router";
import { supabase } from "@/supabase/client";
import { useSetActiveOrg } from "@/hooks/useSetActiveOrg";

function RootLayout() {
  useAuth();
  useSetActiveOrg();
  useRealtimeSubscription();
  useInitialDataFetch();

  return <Outlet />;
}

export const Route = createRootRoute({
  validateSearch: (search): { redirect?: string } => ({
    redirect: (search.redirect as string) || undefined,
  }),
  beforeLoad: async ({ search, location }) => {
    let user = useBoundStore.getState().ui.user;

    if (!user) {
      const { data } = await supabase.auth.getSession();
      user = data?.session?.user ?? null;
    }

    if (user && location.pathname.startsWith("/login")) {
      throw redirect({
        to: search.redirect || "/",
      });
    }

    if (!user && !location.pathname.startsWith("/login")) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: RootLayout,
});
