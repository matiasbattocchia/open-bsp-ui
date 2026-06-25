import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Database, supabase } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { queryKeys } from "./queryKeys";

export type OnboardingTokenRow =
  Database["public"]["Tables"]["onboarding_tokens"]["Row"];

// The `service` enum also includes "local"; onboarding links only target the
// two external channels.
export type OnboardingService = Extract<
  Database["public"]["Enums"]["service"],
  "whatsapp" | "instagram"
>;

export function useOnboardingTokens(service: OnboardingService) {
  const userId = useBoundStore((state) => state.ui.user?.id);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.onboardingTokens.all(orgId, service),
    queryFn: async () =>
      await supabase
        .from("onboarding_tokens")
        .select()
        .eq("organization_id", orgId!)
        .eq("service", service)
        .order("created_at", { ascending: false })
        .throwOnError(),
    enabled: !!userId && !!orgId,
    select: (data) => data.data as OnboardingTokenRow[],
  });
}

export function useCreateOnboardingToken(service: OnboardingService) {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);
  const userId = useBoundStore((state) => state.ui.user?.id);

  return useMutation({
    mutationFn: async ({
      name,
      expiresInDays,
      callbackUrl,
      verifyToken,
    }: {
      name: string;
      expiresInDays: number;
      callbackUrl?: string;
      verifyToken?: string;
    }) => {
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
          expires_at,
          service,
          callback_url: callbackUrl || null,
          verify_token: verifyToken || null,
        })
        .select()
        .single()
        .throwOnError();

      return data as OnboardingTokenRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.onboardingTokens.all(orgId, service),
      });
    },
  });
}

export function useDeleteOnboardingToken(service: OnboardingService) {
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
        queryKey: queryKeys.onboardingTokens.all(orgId, service),
      });
    },
  });
}
