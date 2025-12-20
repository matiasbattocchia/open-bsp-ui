import type { ReactNode } from "react";

export default function SectionBody({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className="[overflow-y:overlay] w-full h-full px-[20px]">
      <div className={`flex flex-col gap-[32px] ${className || ""}`}>{children}</div>
    </div>
  );
}
