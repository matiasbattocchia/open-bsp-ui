import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useInitialDataFetch } from "@/hooks/useInitalDataFetch";
import useBoundStore from "@/store/useBoundStore";
import { redirect } from "@tanstack/react-router";
import { supabase } from "@/supabase/client";

function RootLayout() {
  useAuth();
  useRealtimeSubscription();
  useInitialDataFetch();

  return <Outlet />;
}

export const Route = createRootRoute({
  validateSearch: (search) => ({
    redirect: search.redirect as string,
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
