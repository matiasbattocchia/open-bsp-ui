import type { ButtonHTMLAttributes, DetailedHTMLProps } from "react";
import Spinner from "./Spinner";

type ButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  loading?: boolean;
  disabledReason?: string;
  invalid?: boolean;
};

export default function Button({
  loading,
  disabledReason,
  disabled,
  invalid,
  children,
  className,
  title,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || invalid || loading;

  // Combine disabledReason with existing title if prominent
  const tooltip = disabled && disabledReason
    ? (title ? `${title} - ${disabledReason}` : disabledReason)
    : title;

  return (
    <button
      {...props}
      disabled={isDisabled}
      title={tooltip}
      className={
        `${className || ""} ` +
        (isDisabled ? "opacity-50" : "") +
        " flex items-center justify-center gap-2"
      }
    >
      {/* Spinner on left - invisible when not loading, visible placeholder on right for balance */}
      <Spinner className={loading ? "" : "invisible"} />
      {children}
      {/* Invisible placeholder to keep text centered */}
      <Spinner className="invisible" />
    </button>
  );
}
