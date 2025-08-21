"use client";

import React from "react";
import { Image } from "antd";
import { supabase } from "@/supabase/client";
import { nameInitials } from "./ChatListItem/ChatListItem";
import Avatar from "./Avatar";
import useBoundStore from "@/store/useBoundStore";
import { SwitchLanguage, useTranslation } from "react-dialect";
import {
  LogOut,
  Settings,
  MessageSquareText,
  Wrench,
  Building,
  Unplug,
  Users,
  ChartLine,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { resetAuthorizedCache } from "@/utils/IdbUtils";

export default function Menu() {
  const user = useBoundStore((state) => state.ui.session);
  const organizationId = useBoundStore((state) => state.ui.activeOrgId);
  const { data: agent } = useQuery({
    queryKey: ["users", organizationId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("name, picture")
        .eq("organization_id", organizationId!)
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId && !!user,
    staleTime: 1000 * 60 * 60 * 24,
  });
  const role = useBoundStore(
    (state) => state.ui.roles[state.ui.activeOrgId || ""]?.role,
  );
  const menu = useBoundStore((state) => state.ui.menu);
  const setUI = useBoundStore((state) => state.ui.setUI);
  const organizationsList = useBoundStore(
    (state) => state.ui.organizationsList,
  );

  const organizationsSize = useBoundStore(
    (state) => state.chat.organizations.size,
  );

  const { translate: t } = useTranslation();

  const pathname = usePathname();

  return (
    <div
      className={
        "absolute lg:static h-[100dvh] z-10 flex flex-col justify-between px-[12px] pb-[10px] bg-gray border-r border-gray-line" +
        (menu ? "" : " invisible lg:visible")
      }
    >
      {/* Upper section */}
      <div className="flex flex-col">
        {/* Organizations button */}
        {organizationsSize !== 1 && (
          <Link
            href="/organizations"
            onClick={() => setUI({ organizationsList: true, menu: false })}
            className={
              "p-[8px] mt-[10px] rounded-full" +
              (pathname === "/organizations" && organizationsList
                ? " bg-gray-icon-bg"
                : " active:bg-gray-icon-bg")
            }
            title={t("Organizaciones") as string}
          >
            <Building className="w-[24px] h-[24px] text-gray-icon stroke-[2]" />
          </Link>
        )}

        {/* Messages button */}
        <Link
          href="/conversations"
          onClick={() => setUI({ organizationsList: false, menu: false })}
          className={
            "p-[8px] mt-[10px] rounded-full active:bg-gray-icon-bg" +
            (pathname === "/conversations" && !organizationsList
              ? " bg-gray-icon-bg"
              : "")
          }
          title={t("Mensajes") as string}
        >
          <MessageSquareText className="w-[24px] h-[24px] text-gray-icon stroke-[2]" />
        </Link>

        {/* Settings button */}
        <Link
          href="/settings"
          onClick={() => setUI({ menu: false })}
          className={
            "p-[8px] mt-[10px] rounded-full active:bg-gray-icon-bg" +
            (pathname === "/settings" ? " bg-gray-icon-bg" : "") +
            (role === "admin" ? "" : " hidden")
          }
          title={t("Preferencias") as string}
        >
          <Settings className="w-[24px] h-[24px] text-gray-icon stroke-[2]" />
        </Link>

        {/* Agents button */}
        <Link
          href="/agents"
          onClick={() => setUI({ menu: false })}
          className={
            "p-[8px] mt-[10px] rounded-full active:bg-gray-icon-bg" +
            (pathname === "/agents" ? " bg-gray-icon-bg" : "")
          }
          title={t("Agentes") as string}
        >
          <Users className="w-[24px] h-[24px] text-gray-icon stroke-[2]" />
        </Link>

        {/* Integrations button */}
        <Link
          href="/integrations"
          onClick={() => setUI({ menu: false })}
          className={
            "p-[8px] mt-[10px] rounded-full active:bg-gray-icon-bg hidden" +
            (pathname === "/integrations" ? " bg-gray-icon-bg" : "")
          }
          title={t("Integraciones") as string}
        >
          <Unplug className="w-[24px] h-[24px] text-gray-icon stroke-[2]" />
        </Link>

        {/* Tools button */}
        <Link
          href="/tools"
          onClick={() => setUI({ menu: false })}
          className={
            "p-[8px] mt-[10px] rounded-full active:bg-gray-icon-bg hidden" +
            (pathname === "/tools" ? " bg-gray-icon-bg" : "")
          }
          title={t("Herramientas") as string}
        >
          <Wrench className="w-[24px] h-[24px] text-gray-icon stroke-[2]" />
        </Link>

        {/* Analytics button */}
        <Link
          href="/dashboard"
          onClick={() => setUI({ menu: false })}
          className={
            "p-[8px] mt-[10px] rounded-full active:bg-gray-icon-bg" +
            (pathname === "/dashboard" ? " bg-gray-icon-bg" : "")
          }
          title={t("Analytics") as string}
        >
          <ChartLine className="w-[24px] h-[24px] text-gray-icon stroke-[2]" />
        </Link>
      </div>

      {/* Lower section */}
      <div className="flex flex-col items-center">
        <SwitchLanguage className="w-[40px] py-[5px] mt-[10px] bg-gray text-lg text-gray-icon" />

        <button
          className="px-[8px] py-[10px] mt-[10px] rounded-full active:bg-gray-icon-bg"
          title={t("Cerrar sesión") as string}
          onClick={() => {
            supabase.auth.signOut();
            resetAuthorizedCache();
          }}
        >
          <LogOut className="w-[24px] h-[19px] text-gray-icon stroke-[2.4]" />
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
            className="bg-azul text-md"
          />
        </div>
      </div>
    </div>
  );
}
