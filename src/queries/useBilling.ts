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

/**
 * Whether the organization can connect one more account: its connected
 * accounts against the tier's cap. No cap (billing not set up, or a null cap)
 * is unlimited, the same rule billing.check_limit applies when the account is
 * created. Optimistic while loading: the database has the final word.
 */
export function useCanConnectAccount() {
  const { data: usage } = useUsage("lifetime");
  const { data: tierLimits } = useTierLimits();

  const cap = tierLimits?.find(
    (tl) => tl.product_id === "organizations_addresses",
  )?.cap;

  if (cap == null) return true;

  const used =
    usage?.find((u) => u.product_id === "organizations_addresses")?.quantity ??
    0;

  return used + 1 <= cap;
}

/**
 * One quota per product the tier limits, with what the organization used in
 * the tier's interval, the plan's allowance and the tier's cap (null =
 * unlimited). Products without a tier row have no quota and are left out.
 */
export function useQuotas() {
  const { data: products } = useProducts();
  const { data: monthUsage } = useUsage("month");
  const { data: lifetimeUsage } = useUsage("lifetime");
  const { data: tierLimits } = useTierLimits();
  const { data: planProducts } = usePlanProducts();

  if (!products || !tierLimits) return undefined;

  // The month usage rows run back in time; only the current one counts toward
  // the quota. Periods are UTC dates, like the database's current_date.
  const currentMonth = new Date().toISOString().slice(0, 8) + "01";

  return products.flatMap((product) => {
    const tier = tierLimits.find((tl) => tl.product_id === product.id);
    if (!tier) return [];

    const row =
      tier.interval === "lifetime"
        ? lifetimeUsage?.find((u) => u.product_id === product.id)
        : monthUsage?.find(
            (u) => u.product_id === product.id && u.period === currentMonth,
          );

    return {
      id: product.id,
      name: product.name,
      kind: product.kind,
      unit: product.unit,
      interval: tier.interval,
      used: row?.quantity ?? 0,
      included:
        planProducts?.find((pp) => pp.product_id === product.id)?.included ??
        null,
      cap: tier.cap,
    };
  });
}

export type Quota = NonNullable<ReturnType<typeof useQuotas>>[number];
