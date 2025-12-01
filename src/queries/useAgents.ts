import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";

export function useAgents() {
  const userId = useBoundStore((state) => state.ui.user?.id);

  return useQuery({
    queryKey: ["agents"],
    queryFn: async () =>
      await supabase
        .from("agents")
        .select()
        .order("name")
        .throwOnError(),
    enabled: !!userId,
    select: (data) => data.data,
  });
}

export function useAgent(id: string) {
  const userId = useBoundStore((state) => state.ui.user?.id);

  return useQuery({
    queryKey: ["agents", id],
    queryFn: async () =>
      await supabase
        .from("agents")
        .select()
        .eq("id", id)
        .throwOnError()
        .single(),
    enabled: !!userId,
    select: (data) => data.data,
  });
}

export function useCurrentAgent() {
  const orgId = useBoundStore((state) => state.ui.activeOrgId);
  const userId = useBoundStore((state) => state.ui.user?.id);

  return useQuery({
    queryKey: ["agents", { orgId, userId }],
    queryFn: async () =>
      await supabase
        .from("agents")
        .select()
        .eq("organization_id", orgId!)
        .eq("user_id", userId!)
        .throwOnError()
        .single(),
    enabled: !!userId && !!orgId,
    select: (data) => data.data,
  });
}
