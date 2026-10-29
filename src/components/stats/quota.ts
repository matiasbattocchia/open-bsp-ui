import type { Quota } from "@/queries/useBilling";
import { formatNumber } from "@/i18n/numbers";

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

/**
 * What counts toward a product's usage, as the API's billing triggers count
 * it. Kept short: the one or two facts that are easy to forget.
 */
export function productExplainer(productId: string, t: Translate) {
  switch (productId) {
    case "messages":
      return t(
        "Cada mensaje enviado o recibido por cualquier canal, también los enviados desde el teléfono u otro dispositivo vinculado. Incluye reacciones, notas internas y los registros de los agentes de IA. No cuenta el historial importado.",
      );
    case "conversations":
      return t(
        "Cada conversación nueva: la primera vez que un contacto y una conexión intercambian un mensaje. El mismo contacto en dos conexiones son dos conversaciones. Cuentan también las que trae el historial importado.",
      );
    case "storage":
      return t(
        "Lo que ocupan los archivos guardados: la media enviada o recibida y los archivos subidos. Al borrarse un archivo, se libera su espacio.",
      );
    case "organizations_addresses":
      return t(
        "Las cuentas conectadas de WhatsApp, WhatsApp Web, Instagram y TikTok. Una cuenta desconectada deja de contar.",
      );
    case "ai_credits":
      return t(
        "Lo que gastan los agentes de IA y el pre-procesamiento de media al usar los modelos de la plataforma. Un agente con clave API propia no consume créditos.",
      );
    default:
      return null;
  }
}

export function fmt(n: number, unit: string) {
  if (unit === "usd")
    return `$${formatNumber(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return formatNumber(n, {
    minimumFractionDigits: n % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

export function unitLabel(unit: string) {
  if (unit === "usd" || unit === "count") return "";
  return ` ${unit.toUpperCase()}`;
}

/**
 * What the bar is drawn against. A balance shows the credit left out of its
 * entitlement (the cap when capped, otherwise the plan's grant; max() keeps it
 * within 100% if it was topped up beyond). A counter or gauge goes up to the
 * cap, or past it when usage did (messages received still count once sending
 * is capped); without a cap, up to the allowance unless usage went past it;
 * without either, the usage itself, so the bar is full.
 */
export function quotaRange({ kind, used, included, cap }: Quota) {
  if (kind === "balance") {
    const entitlement = cap && cap > 0 ? cap : (included ?? 0);
    return Math.max(entitlement, used);
  }
  if (cap !== null) return Math.max(cap, used);
  if (included !== null) return Math.max(used, included);
  return used;
}

/**
 * The bar's composition, left to right: usage within the allowance, usage
 * beyond it (what gets charged), usage beyond the cap, and the allowance left.
 * All tones of primary: past the allowance it deepens toward the foreground
 * (darker on light, lighter on dark), the allowance left is a pale tint.
 * Without an allowance all usage up to the cap counts as within it: there is
 * nothing to go over.
 */
export function quotaSegments(quota: Quota, t: Translate): Segment[] {
  const { kind, used, included, cap } = quota;

  if (kind === "balance")
    return [{ label: t("Disponible"), value: used, className: "bg-primary" }];

  const ceiling = cap ?? Infinity;
  const allowance = Math.min(included ?? Infinity, ceiling);

  return [
    {
      label: t("Usado"),
      value: Math.min(used, allowance),
      className: "bg-primary",
    },
    {
      label: t("Excedente"),
      value: Math.max(Math.min(used, ceiling) - allowance, 0),
      className:
        "bg-[color-mix(in_oklab,var(--color-primary),var(--color-foreground)_30%)]",
    },
    {
      label: t("Sobre el límite"),
      value: Math.max(used - ceiling, 0),
      className:
        "bg-[color-mix(in_oklab,var(--color-primary),var(--color-foreground)_60%)]",
    },
    {
      label: t("Incluido"),
      value: included !== null ? Math.max(allowance - used, 0) : 0,
      className: "bg-primary/40",
    },
  ].filter((s) => s.value > 0);
}

export type QuotaStatus = "ok" | "near" | "capped";

/** The tint of a quota's warning: amber about to meet the cap, red met. */
export const statusColors: Record<
  Exclude<QuotaStatus, "ok">,
  { background: string; icon: string }
> = {
  near: { background: "bg-destructive/10", icon: "text-destructive" },
  capped: { background: "bg-destructive/10", icon: "text-destructive" },
};

/** The share of the cap past which a quota is about to meet it. */
const NEAR_CAP = 0.8;

/**
 * Whether the quota is about to meet its cap or has met it, by the rule
 * billing.check_limit blocks with. A counter or gauge is capped once usage
 * reaches the cap. A balance is capped once it is down to its floor, and near
 * when what is left above the floor is a small share of the grant. No cap is
 * unlimited: never near, never capped.
 */
export function quotaStatus({ kind, used, included, cap }: Quota): QuotaStatus {
  if (cap === null) return "ok";

  if (kind === "balance") {
    if (used <= cap) return "capped";
    const grant = (included ?? 0) - cap;
    return grant > 0 && used - cap <= grant * (1 - NEAR_CAP) ? "near" : "ok";
  }

  if (used >= cap) return "capped";
  return used >= cap * NEAR_CAP ? "near" : "ok";
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
    // Overage stops at the cap; what is past it is over the limit instead.
    const overage = Math.min(used, cap ?? Infinity) - included;
    if (overage > 0) parts.push(`${t("Excedente")} ${fmt(overage, unit)}`);
  }
  parts.push(
    cap === null ? t("Ilimitado") : `${t("Límite")} ${fmt(cap, unit)}`,
  );
  if (cap !== null && used > cap)
    parts.push(`${t("Sobre el límite")} ${fmt(used - cap, unit)}`);
  return parts.join(" · ");
}
