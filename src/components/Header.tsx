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
    <div className="header border-r border-border bg-background text-foreground flex justify-between w-full md:w-auto">
      <div className="flex items-center truncate">
        <div>
          <Menu
            className="stroke-[2] lg:hidden mr-4 cursor-pointer"
            onClick={() => toggle("menu")}
          />
        </div>
        <div className="text-primary tracking-tighter font-bold text-[24px] truncate">
          {orgName}
        </div>
      </div>
      <div className="flex justify-end">
        <Link
          to="/conversations/new"
          hash={activeConvId || undefined}
          className="p-[8px] ml-[10px] rounded-full active:bg-sidebar"
          title={t("Nueva conversación") as string}
        >
          <svg className="w-[24px] h-[24px]">
            <use href="/icons.svg#new-chat" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
