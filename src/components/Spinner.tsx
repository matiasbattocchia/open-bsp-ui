import { LoaderCircle } from "lucide-react";

export default function Spinner({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <LoaderCircle
      className={`animate-spin ${className || ""}`}
      width={size}
      height={size}
    />
  );
}
