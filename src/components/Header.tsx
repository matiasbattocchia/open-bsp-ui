import useBoundStore from "@/store/useBoundStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useOrganization } from "@/query/useOrgs";
import { Menu } from "lucide-react";

export default function Header() {
  const toggle = useBoundStore((state) => state.ui.toggle);
  const organizationsList = useBoundStore(
    (state) => state.ui.organizationsList,
  );

  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);
  const { data: orgData } = useOrganization(activeOrgId || "");
  const orgName = orgData?.data?.[0]?.name || "?";

  const { translate: t } = useTranslation();

  return (
    <div className="header border-r bg-white flex justify-between w-[calc(100dvw)] md:w-auto">
      <div className="flex items-center truncate">
        <div>
          <Menu
            className="text-gray-icon stroke-[2] lg:hidden mr-4 cursor-pointer"
            onClick={() => toggle("menu")}
          />
        </div>
        <div className="font-bold text-2xl truncate">
          {organizationsList ? (t("Organizaciones") as string) : orgName}
        </div>
      </div>
      <div className="flex justify-end">
        <button
          className="p-[8px] ml-[10px] rounded-full active:bg-gray-icon-bg"
          title={t("Nueva conversación") as string}
          onClick={() => {
            toggle("newChat");
          }}
        >
          <svg className="w-[24px] h-[24px] text-gray-icon">
            <use href="/icons.svg#new-chat" />
          </svg>
        </button>
      </div>
    </div>
  );
}
