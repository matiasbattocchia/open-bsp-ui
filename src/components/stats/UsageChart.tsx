import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "@/hooks/useTranslation";

type UsageRow = {
  period: string;
  quantity: number;
};

export default function UsageChart({
  data,
  unit,
  periodLabel,
  color = "var(--color-primary)",
  formatLabel,
}: {
  data: UsageRow[];
  unit: string;
  periodLabel: string;
  color?: string;
  formatLabel?: (period: string) => string;
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

  const unitLabel = unit === "count" ? "" : unit === "usd" ? " USD" : ` ${unit.toUpperCase()}`;

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const val = payload[0].value as number;
            return (
              <div className="bg-background border border-border rounded-lg px-[10px] py-[6px] text-[12px] shadow-sm">
                {periodLabel}: {label}
                <br />
                <span className="font-medium">{val.toLocaleString(undefined, { maximumFractionDigits: 2 })}{unitLabel}</span>
              </div>
            );
          }}
        />
        <Bar dataKey="quantity" fill={color} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
