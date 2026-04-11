import { supabase } from "@/supabase/client";
import type { ConversationRow, MessageRow } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { useEffect, useRef } from "react";

type InitDataResponse = {
  conversations: ConversationRow[];
  messages: MessageRow[];
};

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

    // Phase 1: recent messages with chat context
    const { data: phase1 } = await supabase
      .rpc("init_data", {
        p_organization_id: activeOrgId,
        p_limit: PHASE1_LIMIT,
        p_per_conversation: 10,
      })
      .throwOnError();

    const p1 = phase1 as unknown as InitDataResponse;
    pushConversations(p1.conversations);
    pushMessages(p1.messages);

    // Phase 2: older conversations with preview messages
    // Skip if phase 1 returned fewer than the limit (all messages fit)
    if (p1.messages.length >= PHASE1_LIMIT) {
      const oldest = p1.messages[p1.messages.length - 1].timestamp;
      const { data: phase2 } = await supabase
        .rpc("init_data", {
          p_organization_id: activeOrgId,
          p_limit: 100,
          p_per_conversation: 5,
          p_until: oldest,
        })
        .throwOnError();

      const p2 = phase2 as unknown as InitDataResponse;
      pushConversations(p2.conversations);
      pushMessages(p2.messages);
    }
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
