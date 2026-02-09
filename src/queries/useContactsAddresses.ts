import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { queryKeys } from "./queryKeys";

export function useContactAddress(address: string | null | undefined) {
  const userId = useBoundStore((state) => state.ui.user?.id);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.contacts.addressDetail(orgId, address),
    queryFn: async () =>
      await supabase
        .from("contacts_addresses")
        .select()
        .eq("organization_id", orgId!)
        .eq("address", address!)
        .single()
        .throwOnError(),
    enabled: !!userId && !!orgId && !!address,
    select: (data) => data.data,
    experimental_prefetchInRender: true,
  });
}

export function useContactAddresses(contactId: string | null | undefined) {
  const userId = useBoundStore((state) => state.ui.user?.id);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.contacts.addresses(orgId, contactId),
    queryFn: async () =>
      await supabase
        .from("contacts_addresses")
        .select()
        .eq("organization_id", orgId!)
        .eq("contact_id", contactId!)
        .throwOnError(),
    enabled: !!userId && !!orgId && !!contactId,
    select: (data) => data.data,
    experimental_prefetchInRender: true,
  });
}