import { supabase } from "@/supabase/client";
import Avatar from "./Avatar";
import useBoundStore from "@/stores/useBoundStore";
import { useTranslation } from "@/hooks/useTranslation";
import {
  LogOut,
  Settings,
  MessageSquareText,
  Unplug,
  Users,
  Languages,
  Plus,
} from "lucide-react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { LinkButton } from "./LinkButton";
import { resetAuthorizedCache } from "@/utils/IdbUtils";
import { useCurrentAgent } from "@/queries/useAgents";
import { Dropdown } from "antd";
import { useOrganizations } from "@/queries/useOrgs";

export default function Menu() {
  const user = useBoundStore((state) => state.ui.user);

  const { data: agent } = useCurrentAgent();
  //const isAdmin = !agent?.ai && ["admin", "owner"].includes(agent?.extra?.role || "");

  const setActiveOrg = useBoundStore((state) => state.ui.setActiveOrg);
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  const { data: organizations } = useOrganizations();

  // react-dialect may have issues with React 19, add fallback
  const translation = useTranslation();
  const t = translation?.translate || ((text: string) => text);

  // Simpler approach - call useLocation without select first
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
          title={t("Mensajes") as string}
          isActive={pathname.startsWith("/conversations")}
          className="mt-[10px]"
        >
          <MessageSquareText className="w-[24px] h-[24px] stroke-[2]" />
        </LinkButton>

        {/* Agents button */}
        <LinkButton
          to="/agents"
          title={t("Agentes") as string}
          isActive={pathname.startsWith("/agents")}
          className="mt-[10px]"
        >
          <Users className="w-[24px] h-[24px] stroke-[2]" />
        </LinkButton>

        {/* Integrations button */}
        <LinkButton
          to="/integrations"
          title={t("Integraciones") as string}
          isActive={pathname.startsWith("/integrations")}
          className="mt-[10px]"
        >
          <Unplug className="w-[24px] h-[24px] stroke-[2]" />
        </LinkButton>
      </div>

      {/* Lower section */}
      <div className="flex flex-col items-center">

        {/* Settings button */}
        <LinkButton
          to="/settings"
          title={t("Preferencias") as string}
          isActive={pathname.startsWith("/settings")}
          className="mt-[10px]"
        >
          <Settings className="w-[20px] h-[20px] stroke-[2]" />
        </LinkButton>

        <Dropdown
          menu={{
            items: [
              {
                key: "orgs",
                type: "group",
                label: "Organizaciones",
                children: [
                  ...(organizations?.map((org) => ({
                    key: org.id,
                    label: org.name,
                    onClick: () => setActiveOrg(org.id),
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
                children: [
                  {
                    key: "es",
                    label: "Español",
                    onClick: () => translation.setCurrentLanguage("es"),
                  },
                  {
                    key: "en",
                    label: "English",
                    onClick: () => translation.setCurrentLanguage("en"),
                  },
                ],
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
            selectedKeys: activeOrgId ? [activeOrgId] : [],
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
