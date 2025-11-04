import { ConversationRow, MessageRow, supabase } from "@/supabase/client";
import useBoundStore from "@/store/useBoundStore";
import { useEffect } from "react";
import { updateMessagesCache } from "@/utils/IdbUtils";

export const useRealtimeSubscription = (
  authorizedOrgs: string[] | undefined,
) => {
  const conversations = useBoundStore((state) => state.chat.conversations);
  const activeConvId = useBoundStore((state) => state.ui.activeConvId);
  // Set up subscription outside of React lifecycle
  useEffect(() => {
    if (!authorizedOrgs?.length) return;

    const filter = `organization_id=in.(${authorizedOrgs?.join(",")})`;

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
        },
      );

    channel.subscribe();

    // Cleanup subscription on unmount
    return () => {
      channel.unsubscribe();
    };
  }, [authorizedOrgs]);
};
