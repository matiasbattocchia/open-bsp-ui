import useBoundStore from "@/stores/useBoundStore";
import { filters, Filters } from "@/stores/uiSlice";
import { useTranslation } from "@/hooks/useTranslation";

export default function ChatFilter() {
  const appliedFilter = useBoundStore((state) => state.ui.filter);
  const setFilter = useBoundStore((state) => state.ui.setFilter);

  const { translate: t } = useTranslation();

  const filterNames: { [key in Filters]: string } = {
    todas: t("todas") as string,
    pendientes: t("pendientes") as string,
    "24h": t("24h") as string,
    archivadas: t("archivadas") as string,
  };

  return (
    <div className="px-[20px] pb-[12px] flex gap-3 w-full [overflow-x:overlay] shrink-0">
      {(Object.keys(filters) as Filters[]).map((filter) => (
        <button
          key={filter}
          className={
            "text-[14px] text-nowrap capitalize px-[12px] py-[6px] rounded-full" +
            (filter === appliedFilter
              ? " text-foreground bg-primary/10 hover:bg-primary/20 border border-primary"
              : " text-foreground bg-background hover:bg-accent border border-border")
          }
          onClick={() => {
            setFilter(filter);
          }}
        >
          {filterNames[filter]}
        </button>
      ))}
    </div>
  );
}
