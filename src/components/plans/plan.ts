import { fmt, unitLabel } from "@/components/stats/quota";

type Translate = (s: string) => string;

type Product = { id: string; kind: string; unit: string };
type PlanProduct = {
  product_id: string;
  interval: string;
  included: number | null;
  unit_price: number | null;
};
type TierProduct = { product_id: string; interval: string; cap: number | null };
type Tier = { level: number; tiers_products: TierProduct[] };

/** Plans carry no display name: the id, capitalized, stands in for it. */
export function planName(id: string) {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

export function planPrice(
  { price, billing_cycle }: { price: number; billing_cycle: string | null },
  t: Translate,
) {
  if (price <= 0) return t("Gratis");
  return `${fmt(price, "usd")}${billing_cycle === "month" ? " " + t("por mes") : ""}`;
}

/**
 * The tier a plan runs on, whose caps it gets: the plan's minimum tier, or the
 * organization's own when that is higher — taking a plan never lowers a tier.
 */
export function planTier<T extends Tier>(
  minTier: number,
  currentLevel: number,
  tiers: T[],
) {
  const level = Math.max(minTier, currentLevel);
  return tiers.filter((tier) => tier.level <= level).at(-1);
}

/**
 * What a plan offers for one product, a line per fact: what is included,
 * what usage past it costs, and how far it can go (the tier's cap). A balance
 * is a grant of credit, and its cap a floor, not something to show. Nothing
 * for a product neither the plan nor the tier mentions.
 */
export function planOffer(
  product: Product,
  planProduct: PlanProduct | undefined,
  tierProduct: TierProduct | undefined,
  t: Translate,
): string[] {
  if (!planProduct && !tierProduct) return [];

  const { kind, unit } = product;
  const lines: string[] = [];
  const perMonth = (interval: string | undefined) =>
    interval === "month" ? " " + t("por mes") : "";

  const included = planProduct?.included ?? null;
  if (included !== null && included > 0) {
    lines.push(
      kind === "balance"
        ? `${fmt(included, unit)} ${t("de crédito, por única vez")}`
        : `${fmt(included, unit)}${unitLabel(unit)} ${t("incluidos")}${perMonth(planProduct?.interval)}`,
    );
  }

  const unitPrice = planProduct?.unit_price ?? null;
  if (unitPrice !== null) {
    const price = `$${unitPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
    lines.push(
      `${t("Excedente")}: ${price} ${unit === "count" ? t("c/u") : `${t("por")} ${unit.toUpperCase()}`}`,
    );
  }

  if (kind !== "balance" && tierProduct) {
    const cap = tierProduct.cap;
    if (cap === null) lines.push(t("Ilimitado"));
    else if (included === null || cap > included)
      lines.push(
        `${t("Hasta")} ${fmt(cap, unit)}${unitLabel(unit)}${perMonth(tierProduct.interval)}`,
      );
  }

  return lines;
}
