import type { ButtonHTMLAttributes, DetailedHTMLProps } from "react";
import Spinner from "./Spinner";
import { useArmed } from "@/hooks/useArmed";

type ButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  loading?: boolean;
  disabledReason?: string;
  invalid?: boolean;
  // A destructive button's safety catch: the first click shows this text,
  // the second carries the click out.
  confirm?: string;
};

export default function Button({
  loading,
  disabledReason,
  disabled,
  invalid,
  children,
  className,
  title,
  confirm,
  onClick,
  onBlur,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || invalid || loading;
  const [armed, setArmed] = useArmed();

  // Combine disabledReason with existing title if prominent
  const tooltip =
    disabled && disabledReason
      ? title
        ? `${title} - ${disabledReason}`
        : disabledReason
      : title;

  return (
    <button
      {...props}
      onClick={(e) => {
        if (confirm && !armed) {
          e.preventDefault();
          setArmed(true);
          return;
        }
        setArmed(false);
        onClick?.(e);
      }}
      onBlur={(e) => {
        setArmed(false);
        onBlur?.(e);
      }}
      disabled={isDisabled}
      title={tooltip}
      className={
        `${className || ""} ` +
        (isDisabled ? "opacity-50" : "") +
        (armed ? " bg-destructive text-white hover:bg-destructive/90" : "") +
        " flex items-center justify-center gap-2"
      }
    >
      {/* Spinner on left - invisible when not loading, visible placeholder on right for balance */}
      <Spinner className={loading ? "" : "invisible"} />
      {armed ? confirm : children}
      {/* Invisible placeholder to keep text centered */}
      <Spinner className="invisible" />
    </button>
  );
}
