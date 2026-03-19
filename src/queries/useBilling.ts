import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { queryKeys } from "./queryKeys";

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.billing.products(),
    queryFn: async () =>
      await supabase
        .schema("billing")
        .from("products")
        .select()
        .order("name")
        .throwOnError(),
    staleTime: 1000 * 60 * 60,
    select: (data) => data.data,
  });
}

export function useUsage(interval: string) {
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.billing.usage(orgId, interval),
    queryFn: async () =>
      await supabase
        .schema("billing")
        .from("usage")
        .select()
        .eq("organization_id", orgId!)
        .eq("interval", interval)
        .order("period")
        .throwOnError(),
    enabled: !!orgId,
    select: (data) => data.data,
  });
}

export function useSubscription() {
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.billing.subscription(orgId),
    queryFn: async () =>
      await supabase
        .schema("billing")
        .from("subscriptions")
        .select("*, tiers(*), plans(*)")
        .eq("organization_id", orgId!)
        .single()
        .throwOnError(),
    enabled: !!orgId,
    select: (data) => data.data,
  });
}

export function useTierLimits() {
  const orgId = useBoundStore((state) => state.ui.activeOrgId);
  const { data: subscription } = useSubscription();
  const tierId = subscription?.tier_id;

  return useQuery({
    queryKey: queryKeys.billing.tierLimits(orgId),
    queryFn: async () =>
      await supabase
        .schema("billing")
        .from("tiers_products")
        .select("*, products(*)")
        .eq("tier_id", tierId!)
        .throwOnError(),
    enabled: !!orgId && !!tierId,
    select: (data) => data.data,
  });
}

export function usePlanProducts() {
  const orgId = useBoundStore((state) => state.ui.activeOrgId);
  const { data: subscription } = useSubscription();
  const planId = subscription?.plan_id;

  return useQuery({
    queryKey: queryKeys.billing.planProducts(orgId),
    queryFn: async () =>
      await supabase
        .schema("billing")
        .from("plans_products")
        .select()
        .eq("plan_id", planId!)
        .throwOnError(),
    enabled: !!orgId && !!planId,
    select: (data) => data.data,
  });
}
