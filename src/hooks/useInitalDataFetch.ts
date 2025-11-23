import { supabase } from "@/supabase/client";
import useBoundStore from "@/store/useBoundStore";
import { useEffect } from "react";
import { useAuthOrgs } from "@/query/useAuthOrgs";

export const useInitialDataFetch = () => {
  const { data: authorizedOrgs } = useAuthOrgs();

  const pushConversations = useBoundStore(
    (state) => state.chat.pushConversations,
  );
  const pushMessages = useBoundStore((state) => state.chat.pushMessages);

  const loadConvs = async () => {
    const { data: conversations } = await supabase
      .from("conversations")
      .select()
      .in("organization_id", authorizedOrgs!)
      .order("updated_at", { ascending: false })
      .limit(999)
      .throwOnError();

    pushConversations(conversations);
  };

  const loadMsgs = async () => {
    const { data: messages } = await supabase
      .from("messages")
      .select()
      .in("organization_id", authorizedOrgs!)
      .order("updated_at", { ascending: false })
      .limit(999)
      .throwOnError();

    pushMessages(messages);
  };

  useEffect(() => {
    if (!authorizedOrgs?.length) {
      return;
    }

    loadConvs();
    loadMsgs();
  }, [authorizedOrgs]);
};
