"use client";

import useBoundStore from "@/store/useBoundStore";
import { Translate as T, useTranslation } from "react-dialect";
import * as Tabs from "@radix-ui/react-tabs";
import OrgSettings from "@/components/OrgSettings";
import { ArrowLeft } from "lucide-react";
import { Flex, Heading } from "@radix-ui/themes";
import Link from "next/link";
//import UserSettings from "@/components/UserSettings";

export default function SettingsPage() {
  const activeOrgId = useBoundStore((store) => store.ui.activeOrgId);
  const { translate: t } = useTranslation();

  return (
    activeOrgId && (
      <div className="overflow-y-auto p-[16px] bg-white grow">
        <Flex align="center" gap="4">
          <Link href="/" className="lg:hidden">
            <ArrowLeft className="text-gray-icon" />
          </Link>
          <Heading>{t("Preferencias")}</Heading>
        </Flex>

        <Tabs.Root
          defaultValue="organization"
          className="flex w-full flex-col "
        >
          <Tabs.List className="flex border-b border-gray-200 mb-4">
            <Tabs.Trigger
              value="organization"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              <T>Organización</T>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="user"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              <T>Usuario</T>
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="organization">
            <OrgSettings />
          </Tabs.Content>
          <Tabs.Content value="user">{/* <UserSettings /> */}</Tabs.Content>
        </Tabs.Root>
      </div>
    )
  );
}
