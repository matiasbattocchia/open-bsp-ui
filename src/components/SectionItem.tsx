import type { ReactNode } from "react";

export default function SectionItem({
  title,
  description,
  aside,
  onClick,
  className,
  disabled,
  disabledReason,
}: {
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const isDisabled = disabled;
  const tooltip = title + (isDisabled ? " - " + disabledReason : "");

  return (
    <div
      title={tooltip}
      className={
        `h-[72px] flex rounded-xl group ${className || ""} ` +
        (onClick && !isDisabled ? " cursor-pointer hover:bg-accent" : "") +
        (isDisabled ? " opacity-50 grayscale" : "")
      }
      onClick={isDisabled ? undefined : onClick}
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
            <div className="min-w-0 flex items-start text-muted-foreground text-[14px] truncate w-full">
              {description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
