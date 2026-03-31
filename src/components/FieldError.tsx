import type { FieldError as RHFFieldError } from "react-hook-form";

export default function FieldError({ error }: { error?: RHFFieldError | string }) {
  const message = typeof error === "string" ? error : error?.message;
  if (!message) return null;
  return <div className="text-destructive text-[12px]">{message}</div>;
}
