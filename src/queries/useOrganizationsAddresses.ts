import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { queryKeys } from "./queryKeys";

export function useOrganizationsAddresses() {
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.organizations.addresses(activeOrgId),
    queryFn: async () =>
      await supabase
        .from("organizations_addresses")
        .select("*")
        .eq("organization_id", activeOrgId!)
        .throwOnError(),
    enabled: !!activeOrgId,
    select: (data) => data.data,
  });
}
