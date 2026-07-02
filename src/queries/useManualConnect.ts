import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { queryKeys } from "./queryKeys";

export type ManualConnectPayload = {
  waba_id: string;
  phone_number_id: string;
  flow_type: "new_phone_number" | "existing_phone_number";
  business_id?: string;
  callback_url?: string;
  verify_token?: string;
};

export function useManualConnect() {
  const queryClient = useQueryClient();
  const organization_id = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (payload: ManualConnectPayload) => {
      if (!organization_id) throw new Error("No active organization");

      const { data, error } = await supabase.functions.invoke(
        "whatsapp-management/manual-connect",
        {
          method: "POST",
          body: {
            organization_id,
            ...payload,
          },
        },
      );

      if (error) throw error;
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
