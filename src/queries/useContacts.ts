import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";

export function useContactByAddress(address: string | null | undefined) {
  const userId = useBoundStore((state) => state.ui.user?.id);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: [orgId, "contacts", address],
    queryFn: async () =>
      await supabase
        .from("contacts")
        .select()
        .eq("organization_id", orgId!)
        .contains("extra->addresses", JSON.stringify([address]))
        .maybeSingle()
        .throwOnError(),
    enabled: !!userId && !!orgId && !!address,
    select: (data) => data.data,
    experimental_prefetchInRender: true,
  });
}
