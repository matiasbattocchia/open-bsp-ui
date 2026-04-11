import { useTranslation } from "@/hooks/useTranslation";

type QuotaBarProps = {
  productName: string;
  kind: string;
  unit: string;
  interval: string;
  used: number;
  included: number | null;
  cap: number | null;
  budget?: number;
};

function translateProductName(name: string, t: (s: string) => string) {
  switch (name) {
    case "Messages": return t("Mensajes");
    case "Conversations": return t("Conversaciones");
    case "Storage": return t("Almacenamiento");
    case "AI Credits": return t("Créditos IA");
    default: return name;
  }
}

function fmt(n: number, unit: string) {
  if (unit === "usd") return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return n.toLocaleString(undefined, { minimumFractionDigits: n % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 });
}

function unitLabel(unit: string) {
  if (unit === "usd" || unit === "count") return "";
  return ` ${unit.toUpperCase()}`;
}

export default function QuotaBar({
  productName,
  kind,
  unit,
  interval,
  used,
  included,
  cap,
  budget,
}: QuotaBarProps) {
  const { translate: t } = useTranslation();
  const isBalance = kind === "balance";
  const periodLabel = interval === "month" ? " " + t("por mes") : "";

  if (isBalance) {
    const total = budget ?? 0;
    const remaining = used;
    const pct = total > 0 ? Math.min((remaining / total) * 100, 100) : 0;

    return (
      <div className="flex flex-col gap-[8px] p-[16px] rounded-xl bg-background border border-border">
        <div className="flex justify-between items-baseline">
          <span className="text-[16px] font-medium text-foreground">{translateProductName(productName, t)}</span>
          <span className="text-[13px] text-muted-foreground">
            <span className="text-foreground font-medium">{fmt(remaining, unit)}</span> / {fmt(total, unit)}
          </span>
        </div>

        <div className="h-[8px] rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex gap-[16px] text-[12px] text-muted-foreground">
          <span className="flex items-center gap-[4px]">
            <span className="inline-block w-[8px] h-[8px] rounded-full bg-primary" />
            {t("Disponible")}
          </span>
        </div>
      </div>
    );
  }

  // Counter / Gauge style
  const total = cap ?? 0;
  const inc = included ?? 0;
  const usedPct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const incPct = total > 0 ? Math.min((inc / total) * 100, 100) : 0;

  const rest = ` / ${fmt(total, unit)}${unitLabel(unit)}${periodLabel}`;

  return (
    <div className="flex flex-col gap-[8px] p-[16px] rounded-xl bg-background border border-border">
      <div className="flex justify-between items-baseline gap-[8px]">
        <span className="text-[16px] font-medium text-foreground">{translateProductName(productName, t)}</span>
        <span className="text-[13px] text-muted-foreground whitespace-nowrap">
          <span className="text-foreground font-medium">{fmt(used, unit)}</span>{rest}
        </span>
      </div>

      {/* Segmented bar */}
      <div className="h-[8px] rounded-full bg-border overflow-hidden relative">
        {incPct > 0 && (
          <div
            className="absolute h-full rounded-full bg-primary/40"
            style={{ width: `${incPct}%` }}
          />
        )}
        {usedPct > 0 && (
          <div
            className="absolute h-full rounded-full bg-primary"
            style={{ width: `${usedPct}%` }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-[16px] text-[12px] text-muted-foreground">
        <span className="flex items-center gap-[4px]">
          <span className="inline-block w-[8px] h-[8px] rounded-full bg-primary" />
          {t("Usado")}
        </span>
        {inc > 0 && (
          <span className="flex items-center gap-[4px]">
            <span className="inline-block w-[8px] h-[8px] rounded-full bg-primary/40" />
            {t("Incluido")}
          </span>
        )}
      </div>
    </div>
  );
}
