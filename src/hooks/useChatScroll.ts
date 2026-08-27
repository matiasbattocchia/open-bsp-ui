import { useEffect, useLayoutEffect, useRef, useState } from "react";
import useBoundStore from "@/stores/useBoundStore";
import { fetchConversationMessages } from "@/utils/IdbUtils";

const OLDER_PAGE_SIZE = 30;
const SCROLL_TOP_LOAD_THRESHOLD_PX = 80;
const STICK_TO_BOTTOM_THRESHOLD_PX = 80;

type ScrollSession = {
  conversationId: string | null | undefined;
  /** Bumped on conversation switch to discard in-flight history requests. */
  epoch: number;
  hasMore: boolean;
  loading: boolean;
  stickToBottom: boolean;
  /**
   * Snapshot for anchoring the viewport across a history prepend.
   * `ready` is set only immediately before `pushMessages` so realtime/media
   * count bumps during the fetch cannot consume the snapshot early. Zustand
   * may re-render synchronously on push, so restore must be eligible in that
   * same turn (not gated on a `loading` flag cleared in `finally`).
   */
  pendingRestore: {
    height: number;
    top: number;
    baselineCount: number;
    ready: boolean;
  } | null;
};

/**
 * Manages chat scroller stick-to-bottom and older-history pagination.
 *
 * Flow:
 * 1. Conversation switch resets the session and sticks to bottom.
 * 2. On message-list layout: restore scroll after a prepend, else stick to bottom.
 * 3. Fetch older messages when near the top, or when content does not overflow
 *    (init only seeds ~10 msgs/conversation — without this, short threads never
 *    fire scroll events and history never loads).
 * 4. When a fetch finishes, `isLoadingOlder` flips and we re-check so pages keep
 *    chaining until the viewport is filled or history ends.
 */
export function useChatScroll(
  conversationId: string | null | undefined,
  messageCount: number,
) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pushMessages = useBoundStore((state) => state.chat.pushMessages);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  const sessionRef = useRef<ScrollSession>({
    conversationId,
    epoch: 0,
    hasMore: true,
    loading: false,
    stickToBottom: true,
    pendingRestore: null,
  });

  // Always point at the latest fetch implementation so effects can stay stable.
  const loadOlderRef = useRef<() => Promise<void>>(async () => {});

  loadOlderRef.current = async () => {
    const session = sessionRef.current;
    const el = scrollerRef.current;
    if (!conversationId || !el || session.loading || !session.hasMore) return;

    const needsPage =
      el.scrollHeight <= el.clientHeight + 1 ||
      el.scrollTop < SCROLL_TOP_LOAD_THRESHOLD_PX;
    if (!needsPage) return;

    // Read the live store map (newest-first); tail is the oldest loaded cursor.
    const messages = Array.from(
      useBoundStore.getState().chat.messages.get(conversationId)?.values() ??
        [],
    );
    const oldest = messages[messages.length - 1];
    if (!oldest?.timestamp || !oldest.created_at || !oldest.id) return;

    // Reserve a restore slot while reading history (not during autofill).
    session.pendingRestore = session.stickToBottom
      ? null
      : {
          height: el.scrollHeight,
          top: el.scrollTop,
          baselineCount: messages.length,
          ready: false,
        };

    const epoch = session.epoch;
    session.loading = true;
    setIsLoadingOlder(true);

    try {
      const older = await fetchConversationMessages(
        conversationId,
        {
          timestamp: oldest.timestamp,
          created_at: oldest.created_at,
          id: oldest.id,
        },
        OLDER_PAGE_SIZE,
      );

      if (epoch !== sessionRef.current.epoch) return;

      if (older.length < OLDER_PAGE_SIZE) {
        session.hasMore = false;
      }
      if (older.length === 0) {
        session.pendingRestore = null;
        return;
      }

      const sizeBefore =
        useBoundStore.getState().chat.messages.get(conversationId)?.size ?? 0;

      // Mark ready + re-snapshot immediately before prepend so: (1) realtime
      // bumps during the fetch cannot consume the slot early, (2) the delta
      // excludes those bumps, (3) a sync zustand re-render can restore.
      if (session.pendingRestore && el.isConnected) {
        session.pendingRestore = {
          height: el.scrollHeight,
          top: el.scrollTop,
          baselineCount: sizeBefore,
          ready: true,
        };
      }

      pushMessages(older);

      const sizeAfter =
        useBoundStore.getState().chat.messages.get(conversationId)?.size ?? 0;

      // Rows returned but none applied (e.g. all scheduled) — don't leave a
      // dangling restore or retry the same cursor forever.
      if (sizeAfter <= sizeBefore) {
        session.pendingRestore = null;
        session.hasMore = false;
      }
    } catch (err) {
      console.error(err);
      if (epoch === sessionRef.current.epoch) {
        session.pendingRestore = null;
      }
    } finally {
      if (epoch === sessionRef.current.epoch) {
        session.loading = false;
        setIsLoadingOlder(false);
      }
    }
  };

  // Position the scroller after the list paints; reset session on switch.
  useLayoutEffect(() => {
    const session = sessionRef.current;
    const el = scrollerRef.current;

    if (session.conversationId !== conversationId) {
      session.conversationId = conversationId;
      session.epoch += 1;
      session.hasMore = true;
      session.loading = false;
      session.stickToBottom = true;
      session.pendingRestore = null;
      setIsLoadingOlder(false);
    }

    if (!el) return;

    const pending = session.pendingRestore;
    if (pending) {
      // Slot reserved but history not prepended yet (fetch in flight / realtime).
      if (!pending.ready || messageCount <= pending.baselineCount) return;

      el.scrollTop = el.scrollHeight - pending.height + pending.top;
      session.pendingRestore = null;
    } else if (session.stickToBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: "instant" });
    }
  }, [conversationId, messageCount]);

  // Page history after position is applied, and again when a load finishes.
  useEffect(() => {
    void loadOlderRef.current();
  }, [conversationId, messageCount, isLoadingOlder]);

  useEffect(() => {
    const onResize = () => {
      const el = scrollerRef.current;
      if (sessionRef.current.stickToBottom && el) {
        el.scrollTo({ top: el.scrollHeight, behavior: "instant" });
      }
      void loadOlderRef.current();
    };

    window.visualViewport?.addEventListener("resize", onResize);
    return () => window.visualViewport?.removeEventListener("resize", onResize);
  }, []);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;

    sessionRef.current.stickToBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight <
      STICK_TO_BOTTOM_THRESHOLD_PX;

    void loadOlderRef.current();
  };

  return { scrollerRef, isLoadingOlder, onScroll };
}
