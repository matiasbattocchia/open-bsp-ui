import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import type { SignupPayload } from "@/contexts/WhatsAppIntegrationContext";

export function useWhatsAppSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SignupPayload) => {
      const { data, error } = await supabase.functions.invoke(
        "whatsapp-management/signup",
        {
          method: "POST",
          body: payload,
        },
      );

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });
}
