export type Range = "month" | "30d" | "12m";

type UsageRow = { period: string; product_id: string; quantity: number };

export type Point = { period: string; quantity: number };

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * The periods a range covers, oldest first: the days of the current month so
 * far, the last 30 days, or the first day of each of the last 12 months. In
 * UTC, the calendar the database dates usage rows with.
 */
export function rangePeriods(range: Range): string[] {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  if (range === "12m")
    return Array.from({ length: 12 }, (_, i) =>
      iso(new Date(Date.UTC(y, m - 11 + i, 1))),
    );

  const first = range === "month" ? 1 : d - 29;
  return Array.from({ length: d - first + 1 }, (_, i) =>
    iso(new Date(Date.UTC(y, m, first + i))),
  );
}

/**
 * One point per period: what was used in it, zero for a period without a row.
 */
export function fillSeries(
  periods: string[],
  usage: UsageRow[] | undefined,
  productId: string,
): Point[] {
  const map = new Map(
    (usage ?? [])
      .filter((r) => r.product_id === productId)
      .map((r) => [r.period, r.quantity]),
  );
  return periods.map((period) => ({ period, quantity: map.get(period) ?? 0 }));
}

/**
 * The level at the end of each period, for a balance or gauge. Usage rows
 * record what changed in a period, never the level itself, so it is worked
 * back from the current level: minus every change recorded after the period.
 */
export function levelSeries(
  periods: string[],
  usage: UsageRow[] | undefined,
  productId: string,
  current: number,
): Point[] {
  const rows = (usage ?? []).filter((r) => r.product_id === productId);
  return periods.map((period) => {
    const later = rows
      .filter((r) => r.period > period)
      .reduce((sum, r) => sum + r.quantity, 0);
    // Rounded to shed float noise from summing decimals (0.35 - 0.17).
    return { period, quantity: Math.round((current - later) * 1e6) / 1e6 };
  });
}

/**
 * The running total of a daily series, starting over on the first of each
 * month like the monthly allowance does.
 */
export function accumulate(series: Point[]): Point[] {
  let total = 0;
  return series.map(({ period, quantity }) => {
    if (period.endsWith("-01")) total = 0;
    total += quantity;
    return { period, quantity: total };
  });
}
