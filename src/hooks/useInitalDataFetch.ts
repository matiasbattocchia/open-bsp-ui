import { supabase } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { useEffect, useRef } from "react";
import { useOrganizations } from "@/queries/useOrgs";

export const useInitialDataFetch = () => {
  const setActiveOrg = useBoundStore((state) => state.ui.setActiveOrg);
  const { data } = useOrganizations();

  const orgIds = data?.map((o) => o.id) || [];

  const pushConversations = useBoundStore(
    (state) => state.chat.pushConversations,
  );
  const pushMessages = useBoundStore((state) => state.chat.pushMessages);

  const loadConvs = async (since?: Date) => {
    let query = supabase
      .from("conversations")
      .select()
      .in("organization_id", orgIds);

    if (since) {
      query = query.gt("updated_at", since.toISOString());
    }

    const { data: conversations } = await query
      .order("updated_at", { ascending: false })
      .limit(999)
      .throwOnError();

    pushConversations(conversations);
  };

  const loadMsgs = async (since?: Date) => {
    let query = supabase
      .from("messages")
      .select()
      .in("organization_id", orgIds);

    if (since) {
      query = query.gt("updated_at", since.toISOString());
    }

    const { data: messages } = await query
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

  const lastVisibleAt = useRef<Date | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        lastVisibleAt.current = new Date();
      } else if (
        document.visibilityState === "visible" && lastVisibleAt.current
      ) {
        loadConvs(lastVisibleAt.current);
        loadMsgs(lastVisibleAt.current);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgIds]);
};
