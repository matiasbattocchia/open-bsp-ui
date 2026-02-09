import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { queryKeys } from "./queryKeys";

export function useOrganizationsAddresses() {
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.organizations.addresses(orgId),
    queryFn: async () =>
      await supabase
        .from("organizations_addresses")
        .select("*")
        .eq("organization_id", orgId!)
        .throwOnError(),
    enabled: !!orgId,
    select: (data) => data.data,
  });
}

export function useOrganizationAddress(address: string | null | undefined) {
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.organizations.addressDetail(orgId, address),
    queryFn: async () =>
      await supabase
        .from("organizations_addresses")
        .select("*")
        .eq("organization_id", orgId!)
        .eq("address", address!)
        .single()
        .throwOnError(),
    enabled: !!orgId && !!address,
    select: (data) => data.data,
  });
}
