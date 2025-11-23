// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import useBoundStore from "@/store/useBoundStore";
import OrganizationUserService from "@/services/OrganizationUserService";
import { Translate as T, useTranslation } from "@/hooks/useTranslation";

export default function UserSettings() {
  const session = useBoundStore((store) => store.ui.session);
  const activeOrgId = useBoundStore((store) => store.ui.activeOrgId);

  const [notification, setNotification] = useState("");

  const { translate: t } = useTranslation();

  useEffect(() => {
    let ignore = false;

    async function readConfig() {
      if (!session?.id || !activeOrgId) {
        return;
      }

      const { data, error } = await OrganizationUserService.getUser(
        activeOrgId,
        session!.id,
      );

      if (ignore) return;

      if (error) console.error(error);

      if (data) {
        const notification = (data?.notifications as string) || "off";
        setNotification(notification);
      }
    }

    activeOrgId && session && readConfig();

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrgId]);

  async function updateConfig(extra: { notifications?: string }) {
    if (!activeOrgId || !session?.id) {
      return;
    }

    const { error } = await OrganizationUserService.updateOrganizationUser(
      activeOrgId,
      session!.id,
      { extra },
    );

    if (error) {
      throw error;
    }
  }

  const notificationKinds = [
    {
      name: t("Completa"),
      value: "full",
      description: t("Sonido y notificación en pantalla"),
    },
    {
      name: t("Silenciosa"),
      value: "silent",
      description: t("Solo notificación en pantalla"),
    },
    {
      name: t("Desactivada"),
      value: "off",
      description: t("Ningun tipo de notificación"),
    },
  ];

  return (
    activeOrgId && (
      <div className="mb-[16px]">
        <T as="div" className="text-xl">
          Notificaciones
        </T>
        <div className="flex flex-wrap">
          {notificationKinds.map((op) => (
            <label
              key={op.value}
              className="flex items-start me-[16px] mb-[16px] cursor-pointer"
            >
              <div className="pt-[0.75px]">
                <input
                  type="radio"
                  value={op.value}
                  name="notification"
                  checked={notification === op.value}
                  onChange={(e) => {
                    setNotification(e.target.value);
                    updateConfig({ notifications: e.target.value });
                  }}
                />
              </div>

              <div className="ms-2 w-[180px]">
                <div className="text-[15px]">{op.name}</div>
                <div className="text-[13px]">{op.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    )
  );
}
