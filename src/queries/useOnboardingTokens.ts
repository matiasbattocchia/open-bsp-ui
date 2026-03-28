import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { queryKeys } from "./queryKeys";

export type OnboardingTokenRow = {
  id: string;
  name: string;
  organization_id: string;
  created_by: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  status: "active" | "used" | "expired";
};

export function useOnboardingTokens() {
  const userId = useBoundStore((state) => state.ui.user?.id);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.onboardingTokens.all(orgId),
    queryFn: async () =>
      await supabase
        .from("onboarding_tokens")
        .select()
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false })
        .throwOnError(),
    enabled: !!userId && !!orgId,
    select: (data) => data.data as OnboardingTokenRow[],
  });
}

export function useCreateOnboardingToken() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);
  const userId = useBoundStore((state) => state.ui.user?.id);

  return useMutation({
    mutationFn: async ({ name, expiresInDays }: { name: string; expiresInDays: number }) => {
      if (!orgId) throw new Error("No active organization");
      if (!userId) throw new Error("No authenticated user");

      const expires_at = new Date(
        Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
      ).toISOString();

      const { data } = await supabase
        .from("onboarding_tokens")
        .insert({
          name,
          organization_id: orgId,
          created_by: userId,
          expires_at,
        })
        .select()
        .single()
        .throwOnError();

      return data as OnboardingTokenRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.onboardingTokens.all(orgId),
      });
    },
  });
}

export function useDeleteOnboardingToken() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error("No active organization");

      await supabase
        .from("onboarding_tokens")
        .delete()
        .eq("id", id)
        .throwOnError();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.onboardingTokens.all(orgId),
      });
    },
  });
}
