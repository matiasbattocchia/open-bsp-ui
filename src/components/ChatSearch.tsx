import { Search, X } from "lucide-react";
import useBoundStore from "@/stores/useBoundStore";
import { useTranslation } from "@/hooks/useTranslation";

export default function ChatSearch() {
  const searchPattern = useBoundStore((state) => state.ui.searchPattern);
  const setSearchPattern = useBoundStore((state) => state.ui.setSearchPattern);

  const { translate: t } = useTranslation();

  return (
    <div className="px-[20px] pb-[12px] flex bg-background border-r border-border">
      <div className="flex items-center w-full bg-incoming-chat-bubble h-[40px] rounded-full hover:ring ring-border px-[12px] text-foreground">
        <Search className="text-muted-foreground w-[16px] h-[16px] stroke-[3px]" />
        <input
          placeholder={t("Buscar") as string}
          className="bg-transparent border-none outline-none w-full h-full text-[15px] mx-[12px] placeholder:text-muted-foreground"
          value={searchPattern}
          onChange={(e) => setSearchPattern(e.target.value)}
        />
        {searchPattern && (
          <X
            className="cursor-pointer text-muted-foreground w-[16px] h-[16px] stroke-[3px]"
            onClick={() => setSearchPattern("")}
          />
        )}
      </div>
    </div>
  );
}
