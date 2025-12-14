import useBoundStore from "@/stores/useBoundStore";
import { useTranslation } from "@/hooks/useTranslation";
import { Link } from "@tanstack/react-router";

export default function Header() {
  const activeConvId = useBoundStore((state) => state.ui.activeConvId);

  const { translate: t } = useTranslation();

  return (
    <div className="header flex justify-between w-full">
      <div className="flex items-center truncate">
        <div className="text-primary tracking-tighter font-bold text-[24px]">
          Open BSP
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
