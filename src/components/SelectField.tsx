import { useState } from "react";
import { ArrowLeft, ChevronRight, Check } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

export interface SelectOption {
  value: string;
  label: string;
}

// --- Types ---

interface BaseSelectProps {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
}

// Single Select
interface SingleSelectControlledProps<T extends FieldValues> extends BaseSelectProps {
  multiple?: false;
  name: Path<T>;
  control: Control<T>;
  required?: boolean;
  onValueChange?: (value: string) => void;
}

interface SingleSelectUncontrolledProps extends BaseSelectProps {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
}

// Multi Select
interface MultiSelectControlledProps<T extends FieldValues> extends BaseSelectProps {
  multiple: true;
  name: Path<T>;
  control: Control<T>;
  required?: boolean;
  onValueChange?: (value: string[]) => void;
}

interface MultiSelectUncontrolledProps extends BaseSelectProps {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
}

// Union
type SelectFieldProps<T extends FieldValues> =
  | SingleSelectControlledProps<T>
  | SingleSelectUncontrolledProps
  | MultiSelectControlledProps<T>
  | MultiSelectUncontrolledProps;

function isControlled<T extends FieldValues>(
  props: SelectFieldProps<T>
): props is SingleSelectControlledProps<T> | MultiSelectControlledProps<T> {
  return "control" in props;
}

export default function SelectField<T extends FieldValues>(
  props: SelectFieldProps<T>
) {
  const { translate: t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const { label, placeholder, options, disabled, multiple } = props;

  // Render the actual select UI
  // internally we treat value as string | string[] to share logic
  const renderSelect = (
    value: string | string[] | undefined,
    handleChange: (val: string | string[]) => void
  ) => {
    const getDisplayLabel = () => {
      if (multiple && Array.isArray(value)) {
        if (value.length === 0) return placeholder || t("Seleccionar...");
        return options
          .filter((o) => value.includes(o.value))
          .map((o) => o.label)
          .join(", ");
      }
      const selectedOption = options.find((o) => o.value === value);
      return selectedOption?.label || placeholder || t("Seleccionar...");
    };

    const hasSelection = multiple
      ? Array.isArray(value) && value.length > 0
      : !!value;

    return (
      <>
        {/* Trigger */}
        <label>
          <div className="label">{label}</div>
          <button
            type="button"
            className="text w-full flex justify-between items-center text-left"
            onClick={() => !disabled && setIsOpen(true)}
            disabled={disabled}
          >
            <span
              className={hasSelection ? "text-foreground" : "text-muted-foreground"}
            >
              {getDisplayLabel()}
            </span>
            <ChevronRight className="w-[20px] h-[20px] ml-[12px] text-muted-foreground shrink-0" />
          </button>
        </label>

        {/* Options Modal */}
        {isOpen && (
          <div className="absolute inset-0 bottom-[80px] z-50 bg-background flex flex-col">
            {/* Header */}
            <div className="header items-center truncate">
              <button
                className="p-[8px] rounded-full hover:bg-muted mr-[8px] ml-[-8px]"
                title={t("Volver")}
                onClick={() => setIsOpen(false)}
              >
                <ArrowLeft className="w-[24px] h-[24px]" />
              </button>
              <div className="text-[16px]">{label}</div>
            </div>

            {/* Options */}
            <div className="flex flex-col overflow-y-auto grow px-[10px]">
              {options.map((option) => {
                const isSelected = multiple
                  ? Array.isArray(value) && value.includes(option.value)
                  : value === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className="flex items-center gap-[12px] w-full py-[16px] text-left rounded-xl px-[10px]"
                    onClick={() => {
                      if (multiple) {
                        const currentRef = Array.isArray(value) ? value : [];
                        const newValue = currentRef.includes(option.value)
                          ? currentRef.filter((v) => v !== option.value)
                          : [...currentRef, option.value];
                        // we know handleChange expects string | string[]
                        handleChange(newValue);
                      } else {
                        handleChange(option.value);
                        setIsOpen(false);
                      }
                    }}
                  >
                    {/* Indicator */}
                    <span
                      className={`w-[20px] h-[20px] border-[2px] flex items-center justify-center shrink-0 ${isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                        } ${multiple ? "rounded-[4px]" : "rounded-full"}`}
                    >
                      {isSelected && (
                        multiple ? (
                          <Check className="w-[14px] h-[14px] text-primary-foreground" />
                        ) : (
                          <span className="w-[8px] h-[8px] rounded-full bg-primary-foreground" />
                        )
                      )}
                    </span>
                    <span className="text-[16px] text-foreground">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  };

  // Controlled mode: wrap with Controller
  if (isControlled(props)) {
    // We cast to access properties safely, knowing strict types guide external usage
    const { name, control, required, onValueChange } = props;
    // We need to cast props to any or specific controlled type because TS can't narrow generic union easily here
    const isMultiple = props.multiple === true;

    return (
      <Controller
        name={name}
        control={control}
        rules={{ required }}
        render={({ field }) =>
          renderSelect(field.value, (val) => {
            field.onChange(val);
            // safe cast because we know usage matches prop
            if (onValueChange) {
              if (isMultiple) {
                (onValueChange as (v: string[]) => void)(val as string[]);
              } else {
                (onValueChange as (v: string) => void)(val as string);
              }
            }
          })
        }
      />
    );
  }

  // Uncontrolled mode
  const p = props as unknown as (SingleSelectUncontrolledProps | MultiSelectUncontrolledProps);

  return renderSelect(p.value, (val) => {
    if (p.multiple) {
      (p.onChange as (v: string[]) => void)(val as string[]);
    } else {
      (p.onChange as (v: string) => void)(val as string);
    }
  });
}
