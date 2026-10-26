import {
  ComposedChart,
  Area,
  Bar,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "@/hooks/useTranslation";
import { formatNumber } from "@/i18n/numbers";

type UsageRow = {
  period: string;
  quantity: number;
};

/**
 * A horizontal line at a quota figure. One that extends the domain is always
 * in view; otherwise it shows only when the data reaches that far, so a far
 * cap doesn't flatten the chart.
 */
export type Reference = {
  value: number;
  label: string;
  color: string;
  extendDomain: boolean;
};

export default function UsageChart({
  data,
  unit,
  periodLabel,
  color = "var(--color-primary)",
  formatLabel,
  area = false,
  references = [],
}: {
  data: UsageRow[];
  unit: string;
  periodLabel: string;
  color?: string;
  formatLabel?: (period: string) => string;
  /** A level (or a running total) draws as an area, not as bars. */
  area?: boolean;
  references?: Reference[];
}) {
  const { translate: t } = useTranslation();

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[160px] text-muted-foreground text-[13px]">
        {t("Sin datos")}
      </div>
    );
  }

  const chartData = data.map((row) => ({
    label: formatLabel ? formatLabel(row.period) : row.period,
    quantity: row.quantity,
  }));

  const unitLabel =
    unit === "count" ? "" : unit === "usd" ? " USD" : ` ${unit.toUpperCase()}`;

  return (
    <ResponsiveContainer width="100%" height={160}>
      <ComposedChart
        data={chartData}
        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) => formatNumber(v)}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const val = payload[0].value as number;
            return (
              <div className="bg-background border border-border rounded-lg px-[10px] py-[6px] text-[12px] shadow-sm whitespace-nowrap">
                {periodLabel}: {label}
                <br />
                <span className="font-medium">
                  {formatNumber(val, { maximumFractionDigits: 2 })}
                  {unitLabel}
                </span>
              </div>
            );
          }}
        />
        {area ? (
          <Area
            dataKey="quantity"
            type="linear"
            stroke={color}
            fill={color}
            fillOpacity={0.2}
            isAnimationActive={false}
          />
        ) : (
          <Bar dataKey="quantity" fill={color} radius={[3, 3, 0, 0]} />
        )}
        {references.map((r) => (
          <ReferenceLine
            key={r.label}
            y={r.value}
            stroke={r.color}
            strokeDasharray="4 4"
            ifOverflow={r.extendDomain ? "extendDomain" : "discard"}
            label={{
              value: r.label,
              position: "insideTopRight",
              fontSize: 11,
              fill: r.color,
            }}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
