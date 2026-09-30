import { supabase } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { useEffect, useRef } from "react";
import {
  applyInitBootstrapPage,
  fetchInitDataPage,
} from "@/utils/initDataUtils";

export const useInitialDataFetch = () => {
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  const lastVisibleAt = useRef<Date | null>(null);

  const pushConversations = useBoundStore(
    (state) => state.chat.pushConversations,
  );
  const pushMessages = useBoundStore((state) => state.chat.pushMessages);

  const PHASE1_LIMIT = 200;

  // App init: windowed fetch via RPC (timestamp-based), returns convs + msgs
  const initData = async () => {
    if (!activeOrgId) return;

    const page = await fetchInitDataPage(activeOrgId, {
      limit: PHASE1_LIMIT,
      perConversation: 10,
    });
    applyInitBootstrapPage(page);
  };

  // Tab-visibility recovery: flat queries (updated_at-based)
  const loadConvs = async (since: Date) => {
    if (!activeOrgId) return;
    const { data: conversations } = await supabase
      .from("conversations")
      .select()
      .eq("organization_id", activeOrgId)
      .gt("updated_at", since.toISOString())
      .order("updated_at", { ascending: false })
      .limit(999)
      .throwOnError();

    pushConversations(conversations);
  };

  const loadMsgs = async (since: Date) => {
    if (!activeOrgId) return;
    const { data: messages } = await supabase
      .from("messages")
      .select()
      .eq("organization_id", activeOrgId)
      .gt("updated_at", since.toISOString())
      .order("updated_at", { ascending: false })
      .limit(999)
      .throwOnError();

    pushMessages(messages);
  };

  useEffect(() => {
    initData();

    lastVisibleAt.current = new Date();
  }, [activeOrgId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        lastVisibleAt.current = new Date();
      } else if (
        document.visibilityState === "visible" &&
        lastVisibleAt.current
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
