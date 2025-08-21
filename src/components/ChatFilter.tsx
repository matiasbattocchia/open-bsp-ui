import useBoundStore from "@/store/useBoundStore";
import { filters, Filters } from "@/store/uiSlice";
import { useTranslation } from "react-dialect";

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
    <div className="px-[16px] pt-[2px] pb-[7px] flex gap-3 w-[calc(100dvw)] md:w-auto bg-white border-b border-r border-gray-line [overflow-x:overlay]">
      {(Object.keys(filters) as Filters[]).map((filter) => (
        <button
          key={filter}
          className={
            "text-[14px] text-nowrap capitalize px-[12px] py-[6px] rounded-full" +
            (filter === appliedFilter
              ? " text-blue-500 bg-blue-100"
              : " text-gray-dark bg-gray hover:bg-gray-hover")
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
