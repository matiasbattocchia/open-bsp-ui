import type { ReactNode } from "react";

export default function SectionBody({ children }: { children?: ReactNode }) {
  return (
    <div className="[overflow-y:overlay] w-full h-full px-[20px]">
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
