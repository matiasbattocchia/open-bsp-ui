import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export default function ActionCard({
  icon,
  title,
  to,
}: {
  icon: ReactNode;
  title: string;
  to: string;
}) {
  return (
    <Link
      to={to}
    >
      <div className="flex flex-col items-center gap-[16px]">
        <div className="text-foreground bg-background hover:bg-background/60 transition-colors rounded-2xl flex items-center justify-center h-[96px] w-[96px]">{icon}</div>
        <div className="text-foreground text-[14px] word-break text-center w-[96px] leading-[16px]">
          {title}
        </div>
      </div>
    </Link>
  );
}
