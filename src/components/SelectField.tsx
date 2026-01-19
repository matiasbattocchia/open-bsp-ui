import { useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

export interface SelectOption {
  value: string;
  label: string;
}

// Controlled mode (with react-hook-form)
interface ControlledSelectFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  required?: boolean;
  onValueChange?: (value: string) => void;
}

// Uncontrolled mode (with value/onChange)
interface UncontrolledSelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
}

type SelectFieldProps<T extends FieldValues> =
  | ControlledSelectFieldProps<T>
  | UncontrolledSelectFieldProps;

function isControlled<T extends FieldValues>(
  props: SelectFieldProps<T>
): props is ControlledSelectFieldProps<T> {
  return "control" in props;
}

export default function SelectField<T extends FieldValues>(
  props: SelectFieldProps<T>
) {
  const { translate: t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const { label, placeholder, options, disabled } = props;

  // Render the actual select UI
  const renderSelect = (value: string | undefined, handleChange: (val: string) => void) => {
    const selectedOption = options.find((o) => o.value === value);

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
            <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
              {selectedOption?.label || placeholder || t("Seleccionar...")}
            </span>
            <ChevronRight className="w-[20px] h-[20px] text-muted-foreground shrink-0" />
          </button>
        </label>

        {/* Options Modal - absolute within left panel (which has relative) */}
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
                const isSelected = value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className="flex items-center gap-[12px] w-full py-[16px] text-left rounded-xl px-[10px]"
                    onClick={() => {
                      handleChange(option.value);
                      setIsOpen(false);
                    }}
                  >
                    {/* Radio indicator */}
                    <span
                      className={`w-[20px] h-[20px] rounded-full border-[2px] flex items-center justify-center shrink-0 ${isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                        }`}
                    >
                      {isSelected && (
                        <span className="w-[8px] h-[8px] rounded-full bg-primary-foreground" />
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
    const { name, control, required, onValueChange } = props;
    return (
      <Controller
        name={name}
        control={control}
        rules={{ required }}
        render={({ field }) =>
          renderSelect(field.value, (val) => {
            field.onChange(val);
            onValueChange?.(val);
          })
        }
      />
    );
  }

  // Uncontrolled mode: use value/onChange directly
  return renderSelect(props.value, props.onChange);
}
