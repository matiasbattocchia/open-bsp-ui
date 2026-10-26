import { createFileRoute } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import { QuotaBar, QuotaLegend } from "@/components/stats/QuotaBar";
import UsageChart from "@/components/stats/UsageChart";
import {
  quotaAmount,
  quotaRange,
  quotaSegments,
  translateProductName,
} from "@/components/stats/quota";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuotas, useUsage } from "@/queries/useBilling";

export const Route = createFileRoute("/_auth/stats/$productId")({
  component: ProductStats,
});

function last14Days(): string[] {
  const days: string[] = [];
  const d = new Date();
  for (let i = 13; i >= 0; i--) {
    const dt = new Date(d);
    dt.setDate(d.getDate() - i);
    days.push(dt.toISOString().slice(0, 10));
  }
  return days;
}

function fillSeries(
  periods: string[],
  usage: { period: string; product_id: string; quantity: number }[] | undefined,
  productId: string,
  carry = false,
): { period: string; quantity: number }[] {
  const map = new Map<string, number>();
  for (const row of usage ?? []) {
    if (row.product_id === productId) map.set(row.period, row.quantity);
  }
  let last = 0;
  return periods.map((p) => {
    const val = map.get(p);
    if (val != null) {
      last = val;
      return { period: p, quantity: val };
    }
    return { period: p, quantity: carry ? last : 0 };
  });
}

function ProductStats() {
  const { translate: t } = useTranslation();
  const { productId } = Route.useParams();
  const quota = useQuotas()?.find((q) => q.id === productId);
  const { data: dayUsage } = useUsage("day");

  if (!quota) {
    return <SectionHeader title={t("Estadísticas")} />;
  }

  const segments = quotaSegments(quota, t);
  const amount = quotaAmount(quota, t, true);
  // Balances and gauges are levels, not flows: a day without a row keeps the
  // last known value instead of dropping to zero.
  const carry = quota.kind === "balance" || quota.kind === "gauge";

  return (
    <>
      <SectionHeader title={translateProductName(quota.name, t)} />
      <SectionBody>
        <div className="flex flex-col gap-[24px] p-[10px]">
          <div className="flex flex-col gap-[8px]">
            <div className="text-[13px] text-muted-foreground">
              <span className="text-foreground text-[16px] font-medium">
                {amount.used}
              </span>
              {amount.rest}
            </div>
            <QuotaBar segments={segments} range={quotaRange(quota)} />
            <QuotaLegend segments={segments} />
          </div>

          <div className="flex flex-col gap-[8px]">
            <div className="flex justify-between items-baseline">
              <span className="text-[16px] text-foreground">{t("Uso")}</span>
              <span className="text-[13px] text-muted-foreground">
                {t("Últimos 14 días")}
              </span>
            </div>
            <UsageChart
              data={fillSeries(last14Days(), dayUsage, quota.id, carry)}
              unit={quota.unit}
              periodLabel={t("Día")}
              formatLabel={(p) => p.slice(8, 10)}
            />
          </div>
        </div>
      </SectionBody>
    </>
  );
}
