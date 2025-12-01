import { supabase } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { useEffect } from "react";
import { useOrganizations } from "@/queries/useOrgs";

export const useInitialDataFetch = () => {
  const setActiveOrg = useBoundStore((state) => state.ui.setActiveOrg);
  const { data } = useOrganizations();

  const orgIds = data?.map((o) => o.id) || [];

  const pushConversations = useBoundStore(
    (state) => state.chat.pushConversations,
  );
  const pushMessages = useBoundStore((state) => state.chat.pushMessages);

  const loadConvs = async () => {
    const { data: conversations } = await supabase
      .from("conversations")
      .select()
      .in("organization_id", orgIds)
      .order("updated_at", { ascending: false })
      .limit(999)
      .throwOnError();

    pushConversations(conversations);
  };

  const loadMsgs = async () => {
    const { data: messages } = await supabase
      .from("messages")
      .select()
      .in("organization_id", orgIds)
      .order("updated_at", { ascending: false })
      .limit(999)
      .throwOnError();

    pushMessages(messages);
  };

  useEffect(() => {
    if (!orgIds.length) {
      return;
    }

    setActiveOrg(orgIds.at(-1)!);

    loadConvs();
    loadMsgs();
  }, [orgIds]);
};
