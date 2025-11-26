import { supabase } from "@/supabase/client";
import useBoundStore from "@/store/useBoundStore";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Route } from "@/routes/__root";

/**
 * Hook to manage authentication state
 * Syncs Supabase auth session with the app's global store
 * Redirects to login when user logs out
 */
export function useAuth() {
  const setUser = useBoundStore((state) => state.ui.setUser);
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  useEffect(() => {
    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);

      const user = session?.user ?? null;
      setUser(user);

      // Signed in
      if (user && event === "SIGNED_IN") {
        navigate({
          to: redirect || "/",
        });
      }

      // Signed out
      if (!user && !window.location.pathname.startsWith("/login")) {
        navigate({
          to: "/login",
          search: { redirect: window.location.pathname },
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [redirect]);
}
