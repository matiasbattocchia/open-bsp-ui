export type PillOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
  title?: string;
};

/**
 * A row of pills to pick one of a few options, for choices short enough that
 * a SelectField's full-pane picker would be a detour.
 */
export default function PillToggle<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: PillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-[8px]">
      {options.map((option) => {
        const isDisabled = disabled || option.disabled;

        return (
          <button
            key={option.value}
            type="button"
            disabled={isDisabled}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={
              "px-[12px] py-[6px] rounded-full text-[14px] " +
              (value === option.value
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:bg-accent") +
              (isDisabled
                ? " opacity-50 cursor-not-allowed hover:bg-transparent"
                : "")
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
