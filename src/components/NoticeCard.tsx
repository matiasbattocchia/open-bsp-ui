import type { ReactNode } from "react";
import SectionItem from "@/components/SectionItem";

/**
 * A card heading a list, like an invitation or a quota alert: an icon, a
 * title, its lines, and actions at the bottom right, on a tinted background.
 * It grows with its lines: h-auto! overrides SectionItem's own h-[72px]
 * whatever order the two land in, and min-h keeps a row's height.
 */
export default function NoticeCard({
  icon,
  title,
  children,
  actions,
  className,
  onClick,
}: {
  icon: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  /** The tint, e.g. bg-primary/10. */
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div className={`${className || ""} rounded-lg`}>
      <SectionItem
        className="h-auto! min-h-[72px] py-[10px]"
        title={title}
        description={
          <div className="flex flex-col gap-[2px] w-full whitespace-normal">
            {children}
            {actions && (
              <div className="flex gap-[16px] justify-end">{actions}</div>
            )}
          </div>
        }
        aside={<div className="p-[8px]">{icon}</div>}
        onClick={onClick}
      />
    </div>
  );
}
