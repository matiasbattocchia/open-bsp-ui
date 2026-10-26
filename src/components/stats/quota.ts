import type { Quota } from "@/queries/useBilling";

type Translate = (s: string) => string;

export type Segment = { label: string; value: number; className: string };

export function translateProductName(name: string, t: Translate) {
  switch (name) {
    case "Messages":
      return t("Mensajes");
    case "Conversations":
      return t("Conversaciones");
    case "Storage":
      return t("Almacenamiento");
    case "AI Credits":
      return t("Créditos IA");
    case "Connections":
      return t("Conexiones");
    default:
      return name;
  }
}

export function fmt(n: number, unit: string) {
  if (unit === "usd")
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: n % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

function unitLabel(unit: string) {
  if (unit === "usd" || unit === "count") return "";
  return ` ${unit.toUpperCase()}`;
}

/**
 * What the bar is drawn against. A balance shows the credit left out of its
 * entitlement (the cap when capped, otherwise the plan's grant; max() keeps it
 * within 100% if it was topped up beyond). A counter or gauge goes up to the
 * cap; without one, up to the allowance unless usage went past it; without
 * either, the usage itself, so the bar is full.
 */
export function quotaRange({ kind, used, included, cap }: Quota) {
  if (kind === "balance") {
    const entitlement = cap && cap > 0 ? cap : (included ?? 0);
    return Math.max(entitlement, used);
  }
  if (cap !== null) return cap;
  if (included !== null) return Math.max(used, included);
  return used;
}

/**
 * The bar's composition, left to right: usage within the allowance, usage
 * beyond it (what gets charged) and the allowance left. Without an allowance
 * all usage counts as within it: there is nothing to go over.
 */
export function quotaSegments(quota: Quota, t: Translate): Segment[] {
  const { kind, used, included } = quota;

  if (kind === "balance")
    return [{ label: t("Disponible"), value: used, className: "bg-primary" }];

  const allowance = included ?? Infinity;

  return [
    {
      label: t("Usado"),
      value: Math.min(used, allowance),
      className: "bg-primary",
    },
    {
      label: t("Excedente"),
      value: Math.max(used - allowance, 0),
      className: "bg-amber-500",
    },
    {
      label: t("Incluido"),
      value: included !== null ? Math.max(included - used, 0) : 0,
      className: "bg-primary/40",
    },
  ].filter((s) => s.value > 0);
}

/**
 * The figures next to the bar: what was used (or is left, for a balance) and
 * what it is measured against, the cap or else the allowance. Usage that has
 * neither stands alone.
 */
export function quotaAmount(quota: Quota, t: Translate, withPeriod = false) {
  const { kind, unit, interval, used, included, cap } = quota;
  const period = withPeriod && interval === "month" ? " " + t("por mes") : "";

  if (kind === "balance")
    return {
      used: fmt(used, unit),
      rest: ` / ${fmt(quotaRange(quota), unit)}`,
    };

  const total = cap ?? included;
  if (total === null)
    return { used: fmt(used, unit), rest: `${unitLabel(unit)}${period}` };

  return {
    used: fmt(used, unit),
    rest: ` / ${fmt(total, unit)}${unitLabel(unit)}${period}`,
  };
}

/** A one-line breakdown for the row's tooltip, where there is no legend. */
export function quotaSummary(quota: Quota, t: Translate) {
  const { kind, unit, used, included, cap } = quota;

  if (kind === "balance") return `${t("Disponible")} ${fmt(used, unit)}`;

  const parts = [`${t("Usado")} ${fmt(used, unit)}`];
  if (included !== null) {
    parts.push(`${t("Incluido")} ${fmt(included, unit)}`);
    if (used > included)
      parts.push(`${t("Excedente")} ${fmt(used - included, unit)}`);
  }
  parts.push(
    cap === null ? t("Ilimitado") : `${t("Límite")} ${fmt(cap, unit)}`,
  );
  return parts.join(" · ");
}
