import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import PillToggle from "@/components/PillToggle";
import { QuotaBar, QuotaLegend } from "@/components/stats/QuotaBar";
import QuotaAlert from "@/components/stats/QuotaAlert";
import UsageChart, { type Reference } from "@/components/stats/UsageChart";
import {
  quotaAmount,
  quotaRange,
  quotaSegments,
  productExplainer,
  translateProductName,
} from "@/components/stats/quota";
import {
  accumulate,
  fillSeries,
  levelSeries,
  rangePeriods,
  type Range,
} from "@/components/stats/series";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuotas, useUsage, type Quota } from "@/queries/useBilling";

export const Route = createFileRoute("/_auth/stats/$productId")({
  component: ProductStats,
});

type View = "period" | "cumulative";

function formatMonth(period: string, t: (s: string) => string) {
  const names = [
    t("Ene"),
    t("Feb"),
    t("Mar"),
    t("Abr"),
    t("May"),
    t("Jun"),
    t("Jul"),
    t("Ago"),
    t("Sep"),
    t("Oct"),
    t("Nov"),
    t("Dic"),
  ];
  const m = parseInt(period.slice(5, 7), 10);
  return names[m - 1] || period.slice(5, 7);
}

/**
 * The quota's allowance and cap as lines, for a chart whose values measure up
 * to them. The allowance is always in view; a cap above it shows only when the
 * usage gets near. When both are the same figure, one line stands for both.
 */
function quotaReferences(
  { kind, included, cap }: Quota,
  t: (s: string) => string,
): Reference[] {
  // A balance's cap is a floor, not a ceiling to measure against.
  if (kind === "balance") return [];

  const references: Reference[] = [];
  if (included !== null && included !== cap)
    references.push({
      value: included,
      label: t("Incluido"),
      color: "var(--color-primary)",
      extendDomain: true,
    });
  if (cap !== null)
    references.push({
      value: cap,
      label: t("Límite"),
      color: "var(--color-muted-foreground)",
      extendDomain: included === null || included === cap,
    });
  return references;
}

function ProductStats() {
  const { translate: t } = useTranslation();
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const quota = useQuotas()?.find((q) => q.id === productId);
  // The day rows any daily range can show: from the earlier of the month's
  // first day and 30 days ago.
  const { data: dayUsage } = useUsage(
    "day",
    [rangePeriods("month")[0], rangePeriods("30d")[0]].sort()[0],
  );
  const { data: monthUsage } = useUsage("month");
  const [range, setRange] = useState<Range>("month");
  const [selectedView, setSelectedView] = useState<View>("period");

  if (!quota) {
    return <SectionHeader title={t("Estadísticas")} />;
  }

  const segments = quotaSegments(quota, t);
  const amount = quotaAmount(quota, t, true);

  // A monthly counter is the one that adds up toward its quota. Over 12 months
  // each bar already is a month's total, so there is nothing left to add.
  const isMonthlyCounter =
    quota.kind === "counter" && quota.interval === "month";
  const view = range === "12m" ? "period" : selectedView;

  // A balance or gauge is a level (credit left, storage held), charted as
  // such; a counter is a flow, charted as what each period used.
  const isLevel = quota.kind === "balance" || quota.kind === "gauge";
  const periods = rangePeriods(range);
  const usage = range === "12m" ? monthUsage : dayUsage;
  const series = isLevel
    ? levelSeries(periods, usage, quota.id, quota.used)
    : fillSeries(periods, usage, quota.id);

  // Lines only where the values measure up to the quota: a level, a running
  // total or a month's total; a single day's count would sit far below them.
  const comparable =
    quota.kind === "gauge" ||
    (isMonthlyCounter && (view === "cumulative" || range === "12m"));

  return (
    <>
      <SectionHeader title={translateProductName(quota.name, t)} />
      <SectionBody>
        <QuotaAlert
          quota={quota}
          onUpgrade={() =>
            navigate({ to: "/settings/plans", hash: (prevHash) => prevHash! })
          }
        />
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
            <p className="text-[13px] text-muted-foreground mt-[8px]">
              {productExplainer(quota.id, t)}
            </p>
          </div>

          <div className="flex flex-col gap-[16px]">
            <span className="text-[16px] text-foreground">{t("Uso")}</span>
            <UsageChart
              data={view === "cumulative" ? accumulate(series) : series}
              unit={quota.unit}
              periodLabel={range === "12m" ? t("Mes") : t("Día")}
              formatLabel={
                range === "12m"
                  ? (p) => formatMonth(p, t)
                  : (p) => p.slice(8, 10)
              }
              area={isLevel || view === "cumulative"}
              references={comparable ? quotaReferences(quota, t) : []}
            />
            {/* Below the chart: it stays put whether or not a product has
                the view toggle. */}
            <div className="flex flex-col gap-[8px]">
              <PillToggle
                value={range}
                onChange={setRange}
                options={[
                  { value: "month", label: t("Este mes") },
                  { value: "30d", label: t("30 días") },
                  { value: "12m", label: t("12 meses") },
                ]}
              />
              {isMonthlyCounter && (
                <PillToggle
                  value={view}
                  onChange={setSelectedView}
                  options={[
                    { value: "period", label: t("Por período") },
                    {
                      value: "cumulative",
                      label: t("Acumulado"),
                      disabled: range === "12m",
                      title:
                        range === "12m"
                          ? t("Cada mes ya muestra su total")
                          : undefined,
                    },
                  ]}
                />
              )}
            </div>
          </div>
        </div>
      </SectionBody>
    </>
  );
}
