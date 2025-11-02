import { ConversationRow, MessageRow, supabase } from "@/supabase/client";
import useBoundStore from "@/store/useBoundStore";
import { useEffect } from "react";
import useWebNotifications, { NotificationKind } from "../useWebNotifications";
import { updateMessagesCache } from "@/utils/IdbUtils";

export const useRealtimeSubscription = (
  authorizedAddresses: string[] | undefined,
) => {
  const conversations = useBoundStore((state) => state.chat.conversations);
  const activeConvId = useBoundStore((state) => state.ui.activeConvId);
  const { showNotification } = useWebNotifications();
  // Set up subscription outside of React lifecycle
  useEffect(() => {
    if (!authorizedAddresses?.length) return;

    const filter = `organization_address=in.(${authorizedAddresses?.join(",")})`;

    const channel = supabase
      .channel("rialtaim")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter,
        },
        (payload) => {
          // TODO: https://github.com/supabase/supabase/issues/32817
          if (payload.table !== "conversations") return;

          useBoundStore
            .getState()
            .chat.pushConversations([payload.new as ConversationRow]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter,
        },
        (payload) => {
          // TODO: https://github.com/supabase/supabase/issues/32817
          if (payload.table !== "messages") return;

          const message = payload.new as MessageRow;

          useBoundStore.getState().chat.pushMessages([message]);

          updateMessagesCache([message]);

          if (message.direction === "incoming") {
            const key =
              message.organization_address + "<>" + message.contact_address;

            const conv = conversations.get(key);

            // Default conversation to full
            const setting = conv?.extra?.notifications || NotificationKind.full;

            if (
              setting == NotificationKind.full ||
              setting == NotificationKind.silent
            ) {
              const content = message.content;
              const notificationText =
                content.type === "text" ? content.text : "Media message";

              showNotification(conv?.name || "?", notificationText);
            }
          }
        },
      );

    channel.subscribe();

    // Cleanup subscription on unmount
    return () => {
      channel.unsubscribe();
    };
  }, [activeConvId, authorizedAddresses, conversations, showNotification]);
};
