import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invokeFunction, type OrganizationAddressRow } from "@/supabase/client";
import type { SignupPayload } from "@/contexts/WhatsAppIntegrationContext";
import useBoundStore from "@/stores/useBoundStore";
import { type CachedResponse, queryKeys } from "./queryKeys";

export function useWhatsAppSignup() {
  const queryClient = useQueryClient();
  const organization_id = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (payload: SignupPayload) => {
      if (!organization_id) throw new Error("No active organization");

      const address = await invokeFunction<OrganizationAddressRow>(
        "whatsapp-management/signup",
        { method: "POST", body: { organization_id, ...payload } },
      );

      if (!address) throw new Error("Empty signup response");

      return address;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.addresses(organization_id),
      });
      queryClient.setQueryData<CachedResponse<OrganizationAddressRow>>(
        queryKeys.organizations.addressDetail(organization_id, data.address),
        (old) => (old ? { ...old, data } : { data, error: null }),
      );
    },
  });
}

/** Records how the signup popup ended when no finish follows. */
export function useWhatsAppSignupEvent() {
  const organization_id = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (payload: { event: string; data: unknown }) => {
      if (!organization_id) throw new Error("No active organization");

      await invokeFunction("whatsapp-management/signup/events", {
        method: "POST",
        body: { organization_id, ...payload },
      });
    },
    onError: (error) => {
      console.error("Could not record signup event:", error);
    },
  });
}

export function useWhatsAppDisconnect() {
  const queryClient = useQueryClient();
  const organization_id = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (payload: { phone_number_id: string }) => {
      if (!organization_id) throw new Error("No active organization");

      const address = await invokeFunction<OrganizationAddressRow>(
        "whatsapp-management/signup",
        { method: "DELETE", body: { organization_id, ...payload } },
      );

      if (!address) throw new Error("Empty disconnect response");

      return address;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.addresses(organization_id),
      });
      queryClient.setQueryData<CachedResponse<OrganizationAddressRow>>(
        queryKeys.organizations.addressDetail(organization_id, data.address),
        (old) => (old ? { ...old, data } : { data, error: null }),
      );
    },
  });
}
