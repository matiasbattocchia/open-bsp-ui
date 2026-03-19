import { useTranslation } from "@/hooks/useTranslation";
import { useProducts, useUsage, useTierLimits, usePlanProducts } from "@/queries/useBilling";
import QuotaBar from "./QuotaBar";

const AI_CREDITS_BUDGET = 20;

export default function StatsQuotas() {
  const { translate: t } = useTranslation();
  const { data: products } = useProducts();
  const { data: monthUsage } = useUsage("month");
  const { data: lifetimeUsage } = useUsage("lifetime");
  const { data: tierLimits } = useTierLimits();
  const { data: planProducts } = usePlanProducts();

  const monthMap = new Map(monthUsage?.map((u) => [u.product_id, u.quantity]));
  const lifetimeMap = new Map(lifetimeUsage?.map((u) => [u.product_id, u.quantity]));
  const tierMap = new Map(
    tierLimits?.map((tl) => [tl.product_id, { cap: tl.cap, interval: tl.interval }]),
  );
  const planMap = new Map(
    planProducts?.map((pp) => [pp.product_id, { included: pp.included, interval: pp.interval }]),
  );

  const visibleProducts = products?.filter((p) => tierMap.has(p.id));

  return (
    <div className="flex flex-col gap-[16px] p-[24px] max-w-[600px] mx-auto w-full">
      <h2 className="text-[20px] font-medium">{t("Cuotas")}</h2>
      {visibleProducts?.map((product) => {
        const tier = tierMap.get(product.id)!;
        const plan = planMap.get(product.id);
        const isLifetime = tier.interval === "lifetime";
        const used = isLifetime
          ? (lifetimeMap.get(product.id) ?? 0)
          : (monthMap.get(product.id) ?? 0);

        return (
          <QuotaBar
            key={product.id}
            productName={product.name}
            kind={product.kind}
            unit={product.unit}
            interval={tier.interval}
            used={used}
            included={plan?.included ?? null}
            cap={tier.cap}
            budget={product.kind === "balance" ? AI_CREDITS_BUDGET : undefined}
          />
        );
      })}
      {!visibleProducts?.length && (
        <div className="text-muted-foreground text-center py-[40px]">
          {t("Sin cuotas configuradas")}
        </div>
      )}
    </div>
  );
}
