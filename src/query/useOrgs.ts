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
        .throwOnError(),
    enabled: !!user,
    select: (data) => data.data,
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
        .eq("id", id)
        .throwOnError()
        .single(),
    enabled: !!user,
    select: (data) => data.data,
  });
}
