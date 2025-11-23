import {
  type ConversationRow,
  type MessageRow,
  supabase,
} from "@/supabase/client";
import useBoundStore from "@/store/useBoundStore";
import { useEffect } from "react";
import { useAuthOrgs } from "@/query/useAuthOrgs";

export const useRealtimeSubscription = () => {
  const { data: authorizedOrgs } = useAuthOrgs();

  const pushConversations = useBoundStore(
    (state) => state.chat.pushConversations,
  );
  const pushMessages = useBoundStore((state) => state.chat.pushMessages);

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

          const conversation = payload.new as ConversationRow;

          pushConversations([conversation]);
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

          pushMessages([message]);

          //updateMessagesCache([message]);
        },
      );

    channel.subscribe();

    // Cleanup subscription on unmount
    return () => {
      channel.unsubscribe();
    };
  }, [authorizedOrgs]);
};
