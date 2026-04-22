import { Search, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  size?: "default" | "small";
}

export default function SearchBar({
  value,
  onChange,
  placeholder,
  autoFocus,
  className,
  size = "default",
}: SearchBarProps) {
  const { translate: t } = useTranslation();
  const isSmall = size === "small";

  return (
    <div className={className ?? "px-[20px] pb-[12px] flex"}>
      <div className={`flex items-center w-full bg-incoming-chat-bubble rounded-full hover:ring ring-border px-[12px] text-foreground ${isSmall ? "h-[32px]" : "h-[40px]"}`}>
        <Search className="text-muted-foreground w-[16px] h-[16px] stroke-[3px] shrink-0" />
        <input
          placeholder={placeholder ?? t("Buscar")}
          className={`bg-transparent border-none outline-none w-full h-full mx-[12px] placeholder:text-muted-foreground ${isSmall ? "text-[14px]" : "text-[15px]"}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
        />
        {value && (
          <X
            className="cursor-pointer text-muted-foreground w-[16px] h-[16px] stroke-[3px]"
            onClick={() => onChange("")}
          />
        )}
      </div>
    </div>
  );
}
