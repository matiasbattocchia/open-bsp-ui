import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import type { SignupPayload } from "@/contexts/WhatsAppIntegrationContext";
import useBoundStore from "@/stores/useBoundStore";

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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["integrations", organization_id],
      });
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["integrations", organization_id],
      });
    },
  });
}
