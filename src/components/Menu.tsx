import { supabase } from "@/supabase/client";
import Avatar from "./Avatar";
import useBoundStore from "@/stores/useBoundStore";
import { useTranslation } from "@/hooks/useTranslation";
import {
  LogOut,
  Settings,
  MessageSquareText,
  BarChart3,
  Languages,
  Plus,
} from "lucide-react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { LinkButton } from "./LinkButton";
import { resetAuthorizedCache } from "@/utils/IdbUtils";
import { useCurrentAgent } from "@/queries/useAgents";
import { Dropdown } from "antd";
import { useOrganizations } from "@/queries/useOrganizations";

export default function Menu() {
  const user = useBoundStore((state) => state.ui.user);

  const { data: agent } = useCurrentAgent();

  const setActiveOrg = useBoundStore((state) => state.ui.setActiveOrg);
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  const { data: organizations } = useOrganizations();

  const { translate: t, currentLanguage, setCurrentLanguage } = useTranslation();

  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  return (
    <div
      className={
        "h-full w-full z-10 flex flex-col justify-between pb-[10px] bg-sidebar text-sidebar-foreground border-r border-sidebar-border"
      }
    >
      {/* Upper section */}
      <div className="flex flex-col items-center">

        {/* Conversations button */}
        <LinkButton
          to="/conversations"
          title={t("Mensajes")}
          isActive={pathname.startsWith("/conversations")}
          className="mt-[10px]"
        >
          <MessageSquareText className="w-[24px] h-[24px] stroke-[2]" />
        </LinkButton>

        {/* Stats button */}
        <LinkButton
          to="/stats"
          title={t("Estadísticas")}
          isActive={pathname.startsWith("/stats")}
          className="mt-[10px]"
        >
          <BarChart3 className="w-[24px] h-[24px] stroke-[2]" />
        </LinkButton>
      </div>

      {/* Lower section */}
      <div className="flex flex-col items-center">

        {/* Settings button */}
        <LinkButton
          to="/settings"
          title={t("Preferencias")}
          isActive={pathname.startsWith("/settings")}
          className="mt-[10px]"
        >
          <Settings className="w-[20px] h-[20px] stroke-[2]" />
        </LinkButton>

        <Dropdown
          menu={{
            items: [
              {
                key: "user_email",
                type: "group",
                label: user?.email || "",
              },
              { type: "divider" },
              {
                key: "orgs",
                type: "group",
                label: "Organizaciones",
                children: [
                  ...(organizations?.map((org) => ({
                    key: org.id,
                    label: org.name,
                    onClick: () => {
                      setActiveOrg(org.id);
                      navigate({ to: "/conversations" });
                    },
                  })) || []),
                  {
                    key: "new_org",
                    label: t("Nueva organización"),
                    icon: <Plus className="w-[16px] h-[16px]" />,
                    onClick: () => navigate({ to: "/settings/organization/new", hash: (prevHash) => prevHash! }),
                  },
                ],
              },
              { type: "divider" },
              {
                key: "lang",
                label: t("Idioma"),
                icon: <Languages className="w-[16px] h-[16px]" />,
                children: (["es", "en", "pt", "sw", "fr"] as const).map((lang) => ({
                  key: lang,
                  label: { es: "Español", en: "English", pt: "Português", sw: "Kiswahili", fr: "Français" }[lang],
                  className: lang === currentLanguage ? "ant-dropdown-menu-item-selected" : "",
                  onClick: () => setCurrentLanguage(lang),
                })),
              },
              { type: "divider" },
              {
                key: "logout",
                label: t("Cerrar sesión"),
                icon: <LogOut className="w-[16px] h-[16px]" />,
                onClick: () => {
                  supabase.auth.signOut();
                  resetAuthorizedCache();
                },
              },
            ],
            selectable: true,
            selectedKeys: [
              ...(activeOrgId ? [activeOrgId] : []),
            ],
          }}
          trigger={["click"]}
        >
          <div className="cursor-pointer mt-[10px] p-[2px] rounded-full hover:bg-muted">
            <Avatar
              src={agent?.picture || user?.user_metadata?.picture}
              fallback={(
                agent?.name ||
                user?.user_metadata?.name ||
                user?.email ||
                "?"
              ).charAt(0)}
              size={32}
              className="bg-primary text-primary-foreground text-[14px] border border-sidebar-border"
            />
          </div>
        </Dropdown>
      </div>
    </div>
  );
}
