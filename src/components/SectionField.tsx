import { useState, type ReactNode } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import SectionBody from "@/components/SectionBody";

interface SectionFieldProps {
  label: string;
  children: ReactNode;
  disabled?: boolean;
}

export default function SectionField({
  label,
  children,
  disabled,
}: SectionFieldProps) {
  const { translate: t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger - navigation style */}
      <button
        type="button"
        className="text w-full flex justify-between items-center text-left"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <span className="text-foreground">{label}</span>
        <ChevronRight className="w-[20px] h-[20px] text-muted-foreground shrink-0" />
      </button>

      {/* Modal with section content */}
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

          {/* Content */}
          <SectionBody className="gap-[24px] pl-[10px]">
            {children}
          </SectionBody>
        </div>
      )}
    </>
  );
}
