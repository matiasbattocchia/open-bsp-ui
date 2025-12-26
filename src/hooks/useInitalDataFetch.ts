import { supabase } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { useEffect, useRef } from "react";

export const useInitialDataFetch = () => {
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  const lastVisibleAt = useRef<Date | null>(null);

  const pushConversations = useBoundStore(
    (state) => state.chat.pushConversations,
  );
  const pushMessages = useBoundStore((state) => state.chat.pushMessages);

  const loadConvs = async (since?: Date) => {
    if (!activeOrgId) return;

    let query = supabase
      .from("conversations")
      .select()
      .eq("organization_id", activeOrgId);

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
    if (!activeOrgId) return;

    let query = supabase
      .from("messages")
      .select()
      .eq("organization_id", activeOrgId);

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
    loadConvs();
    loadMsgs();

    lastVisibleAt.current = new Date();
  }, [activeOrgId]);

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
  }, []);
};
