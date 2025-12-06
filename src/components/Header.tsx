import useBoundStore from "@/stores/useBoundStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentOrganization } from "@/queries/useOrgs";
import { Menu } from "lucide-react";
import { Link } from "@tanstack/react-router";

export default function Header() {
  const toggle = useBoundStore((state) => state.ui.toggle);

  const { data: org } = useCurrentOrganization();
  const orgName = org?.name || "?";

  const activeConvId = useBoundStore((state) => state.ui.activeConvId);

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
          {orgName}
        </div>
      </div>
      <div className="flex justify-end">
        <Link
          to="/conversations/new"
          hash={activeConvId || undefined}
          className="p-[8px] ml-[10px] rounded-full active:bg-gray-icon-bg"
          title={t("Nueva conversación") as string}
        >
          <svg className="w-[24px] h-[24px] text-gray-icon">
            <use href="/icons.svg#new-chat" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
