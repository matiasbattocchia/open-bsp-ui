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

export default function Menu() {
  const user = useBoundStore((state) => state.ui.user);

  const { data: agent } = useCurrentAgent();
  const isAdmin = agent?.extra?.roles?.includes("admin");

  const activeConvId = useBoundStore((state) => state.ui.activeConvId);

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
        "absolute lg:static h-full z-10 flex flex-col justify-between px-[12px] pb-[10px] bg-sidebar text-sidebar-foreground border-r border-sidebar-border"
        /*TODO + (menu ? "" : " invisible lg:visible")*/
      }
    >
      {/* Upper section */}
      <div className="flex flex-col">

        {/* Organizations button */}
        {organizationsSize !== 1 && (
          <Link
            to="/organizations"
            hash={activeConvId || undefined}
            className={
              "p-[8px] mt-[10px] rounded-full" +
              (pathname === "/organizations"
                ? " bg-gray-icon-bg"
                : " active:bg-gray-icon-bg")
            }
            title={t("Organizaciones") as string}
          >
            <Building className="w-[24px] h-[24px] stroke-[2]" />
          </Link>
        )}

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
            "p-[8px] mt-[10px] rounded-full active:bg-gray-icon-bg hidden" +
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

        <button
          className="px-[8px] py-[10px] mt-[10px] rounded-full active:bg-gray-icon-bg"
          title={t("Cerrar sesión") as string}
          onClick={() => {
            supabase.auth.signOut();
            resetAuthorizedCache();
          }}
        >
          <LogOut className="w-[24px] h-[19px] stroke-[2.4]" />
        </button>

        {/* User profile */}
        <div className="mt-[10px] p-[4px]">
          <Avatar
            src={agent?.picture || user?.user_metadata?.picture}
            fallback={(
              agent?.name ||
              user?.user_metadata?.name ||
              user?.email ||
              "?"
            ).charAt(0)}
            size={32}
            className="bg-primary text-primary-foreground text-[14px]"
          />
        </div>
      </div>
    </div>
  );
}
