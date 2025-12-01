import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";

export function useOrganizations() {
  const userId = useBoundStore((state) => state.ui.user?.id);

  return useQuery({
    queryKey: ["organizations"],
    queryFn: async () =>
      await supabase
        .from("organizations")
        .select()
        .order("name")
        .throwOnError(),
    enabled: !!userId,
    select: (data) => data.data,
  });
}

export function useOrganization(id: string) {
  const userId = useBoundStore((state) => state.ui.user?.id);

  return useQuery({
    queryKey: ["organizations", id],
    queryFn: async () =>
      await supabase
        .from("organizations")
        .select()
        .eq("id", id)
        .throwOnError()
        .single(),
    enabled: !!userId,
    select: (data) => data.data,
  });
}

export function useCurrentOrganization() {
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useOrganization(orgId || "");
}
