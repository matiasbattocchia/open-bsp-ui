import type { ReactNode } from "react";

export default function SectionBody({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className="[overflow-y:overlay] w-full h-full pt-[10px] px-[20px]">
      <div className={`flex flex-col gap-[4px] min-h-full ${className || ""}`}>{children}</div>
    </div>
  );
}
