import { supabase } from "@/supabase/client";
import Avatar from "./Avatar";
import useBoundStore from "@/stores/useBoundStore";
import { SwitchLanguage, useTranslation } from "@/hooks/useTranslation";
import {
  LogOut,
  Settings,
  MessageSquareText,
  Building,
  Unplug,
  Users,
} from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { resetAuthorizedCache } from "@/utils/IdbUtils";
import { useCurrentAgent } from "@/queries/useAgents";
import { Dropdown } from "antd";
import { useOrganizations } from "@/queries/useOrgs";

export default function Menu() {
  const user = useBoundStore((state) => state.ui.user);

  const { data: agent } = useCurrentAgent();
  const isAdmin = agent?.extra?.roles?.includes("admin");

  const activeConvId = useBoundStore((state) => state.ui.activeConvId);
  const setActiveOrg = useBoundStore((state) => state.ui.setActiveOrg);
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  const { data: organizations } = useOrganizations();

  const organizationsSize = 1;

  // react-dialect may have issues with React 19, add fallback
  const translation = useTranslation();
  const t = translation?.translate || ((text: string) => text);

  // Simpler approach - call useLocation without select first
  const location = useLocation();
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
        <Link
          to="/conversations"
          hash={activeConvId || undefined}
          className={
            "p-[8px] mt-[10px] rounded-full active:bg-black" +
            (pathname === "/conversations"
              ? " bg-primary"
              : " bg-accent")
          }
          title={t("Mensajes") as string}
        >
          <MessageSquareText className="w-[24px] h-[24px] stroke-[2]" />
        </Link>

        {/* Settings button */}
        <Link
          to="/settings"
          hash={activeConvId || undefined}
          className={
            "p-[8px] mt-[10px] rounded-full active:bg-gray-icon-bg" +
            (pathname === "/settings" ? " bg-gray-icon-bg" : "") +
            (isAdmin ? "" : " hidden")
          }
          title={t("Preferencias") as string}
        >
          <Settings className="w-[24px] h-[24px] stroke-[2]" />
        </Link>

        {/* Agents button */}
        <Link
          to="/agents"
          hash={activeConvId || undefined}
          className={
            "p-[8px] mt-[10px] rounded-full active:bg-gray-icon-bg" +
            (pathname === "/agents" ? " bg-gray-icon-bg" : "")
          }
          title={t("Agentes") as string}
        >
          <Users className="w-[24px] h-[24px] stroke-[2]" />
        </Link>

        {/* Integrations button */}
        <Link
          to="/integrations"
          hash={activeConvId || undefined}
          className={
            "p-[8px] mt-[10px] rounded-full active:bg-gray-icon-bg" +
            (pathname === "/integrations" ? " bg-gray-icon-bg" : "")
          }
          title={t("Integraciones") as string}
        >
          <Unplug className="w-[24px] h-[24px] stroke-[2]" />
        </Link>
      </div>

      {/* Lower section */}
      <div className="flex flex-col items-center">
        <SwitchLanguage className="w-[40px] mt-[10px]" />

        <div className="mt-[10px] p-[4px]">
          <Dropdown
            menu={{
              items: [
                {
                  key: "orgs",
                  type: "group",
                  label: "Organizaciones",
                  children:
                    organizations?.map((org) => ({
                      key: org.id,
                      label: org.name,
                      onClick: () => setActiveOrg(org.id),
                    })) || [],
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
            <div className="cursor-pointer">
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
    </div>
  );
}
