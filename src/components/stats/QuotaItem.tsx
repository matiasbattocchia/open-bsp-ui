import {
  Gauge,
  HardDrive,
  MessageSquare,
  MessagesSquare,
  Plug,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import type { Quota } from "@/queries/useBilling";
import { QuotaBar } from "./QuotaBar";
import {
  quotaAmount,
  quotaRange,
  quotaSegments,
  quotaSummary,
  translateProductName,
} from "./quota";

export function ProductIcon({ productId }: { productId: string }) {
  const className = "w-[24px] h-[24px]";
  switch (productId) {
    case "messages":
      return <MessageSquare className={className} />;
    case "conversations":
      return <MessagesSquare className={className} />;
    case "storage":
      return <HardDrive className={className} />;
    case "ai_credits":
      return <Sparkles className={className} />;
    case "organizations_addresses":
      return <Plug className={className} />;
    default:
      return <Gauge className={className} />;
  }
}

/**
 * A SectionItem whose lower row is the quota's bar instead of a description,
 * with the figures at the end of the title row. The tooltip stands in for the
 * legend, which the row has no room for.
 */
export default function QuotaItem({
  quota,
  onClick,
}: {
  quota: Quota;
  onClick?: () => void;
}) {
  const { translate: t } = useTranslation();
  const amount = quotaAmount(quota, t);

  return (
    <div
      title={quotaSummary(quota, t)}
      className={
        "h-[72px] flex rounded-xl group" +
        (onClick ? " cursor-pointer hover:bg-accent" : "")
      }
      onClick={onClick}
    >
      {/* Left Pane: Icon */}
      <div className="pl-[10px] pr-[15px] flex items-center">
        <div className="p-[8px]">
          <ProductIcon productId={quota.id} />
        </div>
      </div>

      {/* Right Pane: Content */}
      <div className="flex flex-col justify-center grow min-w-0 pr-[15px]">
        {/* Upper Row: Title and figures */}
        <div className="flex justify-between items-baseline gap-[8px]">
          <div className="truncate text-foreground text-[16px]">
            {translateProductName(quota.name, t)}
          </div>
          <div className="text-[13px] text-muted-foreground whitespace-nowrap">
            <span className="text-foreground font-medium">{amount.used}</span>
            {amount.rest}
          </div>
        </div>

        {/* Lower Row: Bar */}
        <div className="mt-[8px]">
          <QuotaBar
            segments={quotaSegments(quota, t)}
            range={quotaRange(quota)}
          />
        </div>
      </div>
    </div>
  );
}
