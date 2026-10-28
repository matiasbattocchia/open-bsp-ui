import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

/**
 * A warning badge at an icon's bottom right, like the service icon on a
 * conversation's avatar: a quota near its cap, an account the service
 * disconnected.
 */
export default function WarningBadge({
  show,
  children,
}: {
  show: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      {show && (
        <div className="absolute -bottom-[4px] -right-[6px] rounded-full bg-background p-[1px] leading-none">
          <TriangleAlert className="w-[14px] h-[14px] text-amber-500" />
        </div>
      )}
    </div>
  );
}
