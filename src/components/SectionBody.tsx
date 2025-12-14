import type { ReactNode } from "react";

export default function SectionBody({ children }: { children?: ReactNode }) {
  return (
    <div className="[overflow-y:overlay] border-r border-border bg-background w-full h-full px-[20px]">
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
