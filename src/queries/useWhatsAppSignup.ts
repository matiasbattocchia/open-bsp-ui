import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import type { SignupPayload } from "@/contexts/WhatsAppIntegrationContext";
import useBoundStore from "@/stores/useBoundStore";
import { queryKeys } from "./queryKeys";

export function useWhatsAppSignup() {
  const queryClient = useQueryClient();
  const organization_id = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (payload: SignupPayload) => {
      if (!organization_id) throw new Error("No active organization");

      const { data, error } = await supabase.functions.invoke(
        "whatsapp-management/signup",
        {
          method: "POST",
          body: {
            organization_id,
            ...payload,
          },
        },
      );

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.addresses(organization_id) });
      queryClient.setQueryData(
        queryKeys.organizations.addressDetail(organization_id, data.id),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (old: any) => old ? { ...old, data } : { data, error: null },
      );
    },
  });
}

export function useWhatsAppDisconnect() {
  const queryClient = useQueryClient();
  const organization_id = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (payload: { phone_number_id: string }) => {
      if (!organization_id) throw new Error("No active organization");

      const { data, error } = await supabase.functions.invoke(
        "whatsapp-management/signup",
        {
          method: "DELETE",
          body: {
            organization_id,
            ...payload,
          },
        },
      );

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.addresses(organization_id) });
      queryClient.setQueryData(
        queryKeys.organizations.addressDetail(organization_id, data.id),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (old: any) => old ? { ...old, data } : { data, error: null },
      );
    },
  });
}
