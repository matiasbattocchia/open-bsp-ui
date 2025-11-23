// @ts-nocheck
// @ts-nocheck
import useBoundStore from "@/store/useBoundStore";
import { supabase } from "@/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";

export enum NotificationKind {
  disabled = "off",
  silent = "muted",
  full = "on",
}

const useWebNotifications = () => {
  const user = useBoundStore((store) => store.ui.session);
  const activeOrgId = useBoundStore((store) => store.ui.activeOrgId);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  const { data: notificationsSettings } = useQuery({
    queryKey: ["agent.extra.notifications", user?.id, activeOrgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("extra->>notifications")
        .eq("organization_id", activeOrgId!)
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data?.notifications;
    },
    enabled: !!user?.id && !!activeOrgId,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    initialData: NotificationKind.disabled,
  });

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          setPermission(permission);
        });
      }
    }
  }, []);

  const showNotification = useCallback(
    (
      contactName: string,
      message: string,
      options: NotificationOptions = {},
    ) => {
      if (permission === "granted") {
        // Show the notification is the user has set to display them
        if (notificationsSettings != NotificationKind.disabled) {
          const defaultOptions: NotificationOptions = {
            icon: "/logo-192x192.png",
            body: message,
            silent: true,
            ...options,
          };

          new Notification(contactName, defaultOptions);

          // Same thing as above, but with a sound
          if (notificationsSettings == NotificationKind.full) {
            playNotificationSound();
          }
        }
      }
    },
    [permission, notificationsSettings],
  );

  const playNotificationSound = () => {
    // The path to the MP3 file in the /public folder
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.2;
    audio.play().catch((error) => {
      console.error("Error playing notification sound:", error);
    });
  };

  return {
    showNotification,
  };
};

export default useWebNotifications;
