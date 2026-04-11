import { useTranslation } from "@/hooks/useTranslation";
import { useProducts, useUsage, useTierLimits } from "@/queries/useBilling";
import UsageChart from "./UsageChart";

function translateProductName(name: string, t: (s: string) => string) {
  switch (name) {
    case "Messages": return t("Mensajes");
    case "Conversations": return t("Conversaciones");
    case "Storage": return t("Almacenamiento");
    case "AI Credits": return t("Créditos IA");
    default: return name;
  }
}

function formatMonth(period: string, t: (s: string) => string) {
  const names = [t("Ene"), t("Feb"), t("Mar"), t("Abr"), t("May"), t("Jun"), t("Jul"), t("Ago"), t("Sep"), t("Oct"), t("Nov"), t("Dic")];
  const m = parseInt(period.slice(5, 7), 10);
  return names[m - 1] || period.slice(5, 7);
}

function formatDay(period: string) {
  return period.slice(8, 10);
}

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

function last12Months(): string[] {
  const months: string[] = [];
  const d = new Date();
  for (let i = 11; i >= 0; i--) {
    const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push(dt.toISOString().slice(0, 10));
  }
  return months;
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

export default function StatsUsage() {
  const { translate: t } = useTranslation();
  const { data: products } = useProducts();
  const { data: dayUsage } = useUsage("day");
  const { data: monthUsage } = useUsage("month");
  const { data: tierLimits } = useTierLimits();

  const tierSet = new Set(tierLimits?.map((tl) => tl.product_id));
  const visibleProducts = products?.filter((p) => tierSet.has(p.id));

  const days = last14Days();
  const months = last12Months();

  return (
    <div className="flex flex-col gap-[32px] p-[24px] w-full">
      <h2 className="text-[20px] font-medium">{t("Uso")}</h2>
      {visibleProducts?.map((product) => {
        const name = translateProductName(product.name, t);
        const carry = product.kind === "balance" || product.kind === "gauge";
        return (
          <div key={product.id} className="flex flex-col gap-[8px]">
            <h3 className="text-[16px] font-medium text-foreground">{name}</h3>
            <div className="grid grid-cols-2 gap-[16px]">
              <div className="flex flex-col gap-[4px]">
                <span className="text-[13px] text-muted-foreground">{t("Últimos 12 meses")}</span>
                <UsageChart
                  data={fillSeries(months, monthUsage, product.id, carry)}
                  unit={product.unit}
                  periodLabel={t("Mes")}
                  formatLabel={(p) => formatMonth(p, t)}
                />
              </div>
              <div className="flex flex-col gap-[4px]">
                <span className="text-[13px] text-muted-foreground">{t("Últimos 14 días")}</span>
                <UsageChart
                  data={fillSeries(days, dayUsage, product.id, carry)}
                  unit={product.unit}
                  periodLabel={t("Día")}
                  formatLabel={formatDay}
                />
              </div>
            </div>
          </div>
        );
      })}
      {!visibleProducts?.length && (
        <div className="text-muted-foreground text-center py-[40px]">
          {t("Sin datos de uso")}
        </div>
      )}
    </div>
  );
}
