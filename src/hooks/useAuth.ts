import { supabase } from "@/supabase/client";
import useBoundStore from "@/store/useBoundStore";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * Hook to manage authentication state
 * Syncs Supabase auth session with the app's global store
 * Redirects to login when user logs out
 */
export function useAuth() {
  const setUser = useBoundStore((state) => state.ui.setUser);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setUser(user);

      // Redirect to login if user is null (logged out)
      if (!user) {
        navigate({ to: "/login", search: { redirect: window.location.pathname } });
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, navigate]);
}
