import type { ReactNode } from "react";

export default function SectionItem({
  title,
  description,
  aside,
  onClick,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      className={
        `h-[72px] flex rounded-xl group ${className || ""}` +
        (onClick ? " cursor-pointer hover:bg-accent" : "")
      }
      onClick={onClick}
    >
      {/* Left Pane: Avatar/Icon */}
      <div className="pl-[10px] pr-[15px] flex items-center">
        {aside}
      </div>

      {/* Right Pane: Content */}
      <div className="flex flex-col justify-center grow min-w-0 pr-[15px]">
        {/* Upper Row: Title */}
        <div className="flex justify-between items-baseline">
          <div className="truncate text-foreground text-[16px]">{title}</div>
        </div>

        {/* Lower Row: Description */}
        {description && (
          <div className="flex justify-between mt-[2px] items-start">
            <div className="min-w-0 flex items-start text-muted-foreground text-[14px] truncate">
              {description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
