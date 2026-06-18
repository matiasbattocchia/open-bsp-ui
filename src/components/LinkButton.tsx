import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";

interface LinkButtonProps {
  to: string;
  title: string;
  children: ReactNode;
  isActive?: boolean;
  className?: string;
  compact?: boolean;
}

export function LinkButton({ to, title, children, isActive, className = "", compact }: LinkButtonProps) {
  const shape = compact ? "rounded-xl" : "rounded-full";

  return (
    <Link to={to} hash={(prevHash) => prevHash!} title={title}>
      <div
        className={
          `p-[8px] ${shape} hover:bg-muted ${isActive ? " bg-muted" : ""} ${className}`
        }
      >
        {children}
      </div>
    </Link>
  );
}
