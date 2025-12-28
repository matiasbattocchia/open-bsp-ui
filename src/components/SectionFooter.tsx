import type { ReactNode } from "react";

export default function SectionFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col px-[20px] pb-[17px] pt-[23px] ${className || ""}`}>
      {children}
    </div>
  );
}
