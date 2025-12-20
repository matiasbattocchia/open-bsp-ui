import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";

interface LinkButtonProps {
  to: string;
  title: string;
  children: ReactNode;
  isActive?: boolean;
  className?: string; // For margin tops etc
}

export function LinkButton({ to, title, children, isActive, className = "" }: LinkButtonProps) {
  className = className + (isActive ? " bg-muted" : "");

  return (
    <Link to={to} hash={(prevHash) => prevHash!} title={title}>
      <div
        className={
          `p-[8px] rounded-full hover:bg-muted ${className}`
        }
      >
        {children}
      </div>
    </Link>
  );
}
