import type { Segment } from "./quota";

export function QuotaBar({
  segments,
  range,
}: {
  segments: Segment[];
  range: number;
}) {
  return (
    <div className="h-[8px] w-full rounded-full bg-border overflow-hidden flex">
      {range > 0 &&
        segments.map((s) => (
          <div
            key={s.label}
            className={`h-full ${s.className}`}
            style={{ width: `${Math.min((s.value / range) * 100, 100)}%` }}
          />
        ))}
    </div>
  );
}

export function QuotaLegend({ segments }: { segments: Segment[] }) {
  return (
    <div className="flex gap-[16px] text-[12px] text-muted-foreground">
      {segments.map((s) => (
        <span key={s.label} className="flex items-center gap-[4px]">
          <span
            className={`inline-block w-[8px] h-[8px] rounded-full ${s.className}`}
          />
          {s.label}
        </span>
      ))}
    </div>
  );
}
