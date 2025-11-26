import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import useBoundStore from "@/store/useBoundStore";

export function useAuthOrgs() {
  const user = useBoundStore((state) => state.ui.user);

  return useQuery({
    queryKey: ["authOrgs"],
    queryFn: async () =>
      await supabase
        .from("agents")
        .select("id, organization_id, user_id, extra->roles")
        .eq("user_id", user!.id)
        .throwOnError(),
    select: (data) => data.data.map((a) => a.organization_id),
    enabled: !!user,
  });
}
