import { useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import SectionBody from "@/components/SectionBody";

interface TextAreaFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function TextAreaField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  disabled,
}: TextAreaFieldProps<T>) {
  const { translate: t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <>
          {/* Trigger - navigation style, shows label text */}
          <button
            type="button"
            className="text w-full flex justify-between items-center text-left"
            onClick={() => !disabled && setIsOpen(true)}
            disabled={disabled}
          >
            <span className="text-foreground">{label}</span>
            <ChevronRight className="w-[20px] h-[20px] text-muted-foreground shrink-0" />
          </button>

          {/* Modal with textarea */}
          {isOpen && (
            <div className="absolute inset-0 bottom-[80px] z-50 bg-background flex flex-col">
              {/* Header */}
              <div className="header items-center truncate shrink-0">
                <button
                  className="p-[8px] rounded-full hover:bg-muted mr-[8px] ml-[-8px]"
                  title={t("Volver")}
                  onClick={() => setIsOpen(false)}
                >
                  <ArrowLeft className="w-[24px] h-[24px]" />
                </button>
                <div className="text-[16px]">{label}</div>
              </div>

              {/* Textarea wrapped in SectionBody for consistent scrollbar */}
              <SectionBody className="pl-[10px]">
                <textarea
                  className="text grow font-mono text-[14px] "
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder={placeholder}
                  autoFocus
                />
              </SectionBody>
            </div>
          )}
        </>
      )}
    />
  );
}

