import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import useBoundStore from "@/store/useBoundStore";

export function useOrganizations() {
  const user = useBoundStore((state) => state.ui.user);

  return useQuery({
    queryKey: ["organizations"],
    queryFn: async () =>
      await supabase
        .from("organizations")
        .select()
        //.eq("agents.id", user!.id)
        .throwOnError(),
    enabled: !!user,
  });
}

export function useOrganization(id: string) {
  const user = useBoundStore((state) => state.ui.user);

  return useQuery({
    queryKey: ["organizations", id],
    queryFn: async () =>
      await supabase
        .from("organizations")
        .select()
        .eq("agent.id", user!.id)
        .eq("id", id)
        .throwOnError(),
    enabled: !!user,
  });
}