import type { ReactNode } from "react";

export default function SectionBody({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className="overflow-y-auto [scrollbar-gutter:stable] w-full h-full pt-[10px] pl-[20px] pr-[10px]">
      <div className={`flex flex-col gap-[4px] min-h-full ${className}`}>{children}</div>
    </div>
  );
}
