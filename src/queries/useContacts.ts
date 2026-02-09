import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  supabase,
  type ContactAddressInsert,
  type ContactWithAddressesInsert,
  type ContactWithAddressesRow,
  type ContactWithAddressesUpdate,
} from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { normalizePhoneNumber } from "@/utils/FormatUtils";
import { queryKeys } from "./queryKeys";

export function useContactByAddress(address: string | null | undefined) {
  const userId = useBoundStore((state) => state.ui.user?.id);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.contacts.byAddress(orgId, address),
    queryFn: async () =>
      await supabase
        .from("contacts_addresses")
        .select("*, contact:contacts(*)")
        .eq("organization_id", orgId!)
        .eq("address", address!)
        .single()
        .throwOnError(),
    enabled: !!userId && !!orgId && !!address,
    select: (data) => data.data.contact,
    experimental_prefetchInRender: true,
  });
}

export function useContacts() {
  const userId = useBoundStore((state) => state.ui.user?.id);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.contacts.all(orgId),
    queryFn: async () =>
      await supabase
        .from("contacts")
        .select("*, primary_address:contacts_addresses(*)")
        .eq("organization_id", orgId!)
        .order("name", { ascending: true })
        .order("created_at", { referencedTable: "primary_address", ascending: true })
        .limit(1, { referencedTable: "primary_address" })
        .throwOnError(),
    enabled: !!userId && !!orgId,
    select: (data) => data.data,
  });
}

export function useContact(id: string) {
  const userId = useBoundStore((state) => state.ui.user?.id);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.contacts.detail(orgId, id),
    queryFn: async () =>
      await supabase
        .from("contacts")
        .select("*, addresses:contacts_addresses(*)")
        .eq("id", id)
        .order("created_at", { referencedTable: "addresses", ascending: true })
        .single()
        .throwOnError(),
    enabled: !!userId && !!orgId && !!id,
    select: (data) => data.data as ContactWithAddressesRow,
    experimental_prefetchInRender: true,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (data: ContactWithAddressesInsert) => {
      if (!orgId) throw new Error("No active organization");

      const { addresses, ...contactData } = data;

      // Create contact
      const { data: contact } = await supabase
        .from("contacts")
        .insert({ ...contactData, organization_id: orgId })
        .select()
        .single()
        .throwOnError();

      // Link addresses to contact (deduplicate by normalized address)
      const toLink = addresses
        .filter(a => Boolean(a.address))
        .map(a => ({ ...a, address: normalizePhoneNumber(a.address!) }))
        .filter((a, i, arr) => arr.findIndex(x => x.address === a.address) === i);

      toLink.length && await supabase
        .from("contacts_addresses")
        .upsert(
          toLink.map(a => ({
            ...a,
            organization_id: orgId,
            service: "whatsapp" as const,
            contact_id: contact.id,
          } as ContactAddressInsert)),
          { onConflict: "organization_id, address", defaultToNull: false }
        )
        .throwOnError();

      return contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.contacts.all(orgId),
      });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (data: ContactWithAddressesUpdate) => {
      if (!orgId) throw new Error("No active organization");
      if (!data.id) throw new Error("No contact id");

      const { addresses: rawNewAddresses, ...newContact } = data;

      const { data: contact } = await supabase
        .from("contacts")
        .update(newContact)
        .eq("id", data.id)
        .select()
        .single()
        .throwOnError();

      const cached = queryClient.getQueryData<{ data: ContactWithAddressesRow }>(
        queryKeys.contacts.detail(orgId, data.id)
      );
      const oldAddresses = cached?.data?.addresses ?? [];

      const oldAddressesString = oldAddresses.map(a => a.address) ?? [];

      const newAddresses = rawNewAddresses.map(a => ({
        ...a,
        address: normalizePhoneNumber(a.address!),
      }));

      const newAddressesString = [...new Set(
        newAddresses.map(a => a.address).filter(Boolean) as string[]
      )];

      // Upsert addresses to link (set contact_id)
      // Note: If address exists in another contact, it will be reassigned (TODO: show warning)
      const toLink = newAddressesString.filter(a => !oldAddressesString.includes(a)).map(address => {
        const addressObject = newAddresses.find(a => a.address === address);

        return {
          ...addressObject,
          organization_id: orgId,
          service: "whatsapp" as const,
          contact_id: data.id,
        } as ContactAddressInsert;
      })

      // Unlink removed addresses (set contact_id to null)
      // DB trigger will delete if no conversations reference them
      const toUnlink = oldAddressesString.filter(a => !newAddressesString.includes(a)).map(address => {
        const addressObject = oldAddresses.find(a => a.address === address);

        return {
          ...addressObject,
          contact_id: null,
        } as ContactAddressInsert;
      })

      // The insert policy prevents the creation of synced address by the users.
      // The update policy allows synced address to be updated.
      // Upsert with extra.synced.action='add' in payload fails even if the row exists,
      // because PostgreSQL checks INSERT policy BEFORE conflict detection.
      const toUpsert = [...toLink, ...toUnlink].filter(a => !(a.extra?.synced?.action === 'add'))
      const toUpdate = [...toLink, ...toUnlink].filter(a => a.extra?.synced?.action === 'add')

      await Promise.all([
        // Upsert non-synced addresses
        toUpsert.length > 0 && supabase
          .from("contacts_addresses")
          .upsert(toUpsert, { onConflict: 'organization_id, address', defaultToNull: false })
          .throwOnError(),
        // Update synced addresses individually (no mass update in Supabase)
        ...toUpdate.map(a =>
          supabase
            .from("contacts_addresses")
            .update(a)
            .eq("organization_id", a.organization_id)
            .eq("address", a.address)
            .throwOnError()
        ),
      ]);

      return contact
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.contacts.all(orgId),
      });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error("No active organization");

      await supabase.from("contacts").delete().eq("id", id).throwOnError();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.contacts.all(orgId),
      });
    },
  });
}
