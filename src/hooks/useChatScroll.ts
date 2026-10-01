import { useEffect, useLayoutEffect, useRef, useState } from "react";
import useBoundStore from "@/stores/useBoundStore";
import {
  fetchConversationMessages,
  fetchLatestConversationMessages,
} from "@/utils/IdbUtils";
import {
  oldestHistoryCursor,
  toHistoryCursor,
  type MessageHistoryCursor,
} from "@/utils/messageHistory";

/** One indexed page for seed and scroll-up. */
const HISTORY_PAGE_SIZE = 30;
/** Soft cap while stuck to bottom; deep scroll may hold up to this many rows. */
const MAX_MESSAGES_PER_CONVERSATION = 300;
const SCROLL_TOP_LOAD_THRESHOLD_PX = 80;
const STICK_TO_BOTTOM_THRESHOLD_PX = 80;

type HistoryWindow = {
  cursor: MessageHistoryCursor | null;
  hasMore: boolean;
};

type PendingRestore = {
  height: number;
  top: number;
  baselineCount: number;
  /** Set true only immediately before pushMessages so restore is eligible. */
  ready: boolean;
};

type ScrollSession = {
  conversationId: string | null | undefined;
  /** Bumped on conversation switch to discard in-flight requests. */
  epoch: number;
  hasMore: boolean;
  loading: boolean;
  stickToBottom: boolean;
  seeded: boolean;
  /** Contiguous-window cursor — never the absolute oldest store orphan. */
  cursor: MessageHistoryCursor | null;
  pendingRestore: PendingRestore | null;
  /**
   * While > 0, ignore scroll events for stickToBottom. Programmatic pin/restore
   * can fire `scroll` before layout settles; without this, open-chat briefly
   * sees scrollTop≈0 and clears stickToBottom — leaving the viewport mid-history.
   */
  ignoreStickUpdates: number;
};

/**
 * Stick-to-bottom + contiguous older-history pagination.
 *
 * Flow:
 * 1. Open chat → seed one latest page (or restore session cache) and trim orphans.
 * 2. Near top (user scrolled up) / short thread → fetch older keyset pages.
 * 3. Prepend → restore scrollTop from pendingRestore snapshot.
 * 4. At bottom → cap memory to MAX_MESSAGES_PER_CONVERSATION.
 */
export function useChatScroll(
  conversationId: string | null | undefined,
  messageCount: number,
) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pushMessages = useBoundStore((s) => s.chat.pushMessages);
  const trimMessagesOlderThan = useBoundStore(
    (s) => s.chat.trimMessagesOlderThan,
  );
  const retainNewestMessages = useBoundStore(
    (s) => s.chat.retainNewestMessages,
  );

  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [historyCursor, setHistoryCursor] =
    useState<MessageHistoryCursor | null>(null);

  /** Per-conversation window; survives switches so reopen skips the seed fetch. */
  const windowCacheRef = useRef(new Map<string, HistoryWindow>());

  const sessionRef = useRef<ScrollSession>({
    conversationId,
    epoch: 0,
    hasMore: true,
    loading: false,
    stickToBottom: true,
    seeded: false,
    cursor: null,
    pendingRestore: null,
    ignoreStickUpdates: 0,
  });

  const seedRef = useRef<() => Promise<void>>(async () => {});
  const loadOlderRef = useRef<() => Promise<void>>(async () => {});
  const capIfAtBottomRef = useRef<(convId: string) => void>(() => {});

  const pinToBottom = (el: HTMLDivElement) => {
    const session = sessionRef.current;
    session.ignoreStickUpdates += 1;
    // Assign scrollTop directly — more reliable than scrollTo({ behavior:"instant" })
    // across Safari / older Chromium when opening a chat.
    el.scrollTop = el.scrollHeight;
    // Release after the scroll event from this assignment has been delivered.
    requestAnimationFrame(() => {
      session.ignoreStickUpdates = Math.max(0, session.ignoreStickUpdates - 1);
    });
  };

  const applyWindow = (convId: string, window: HistoryWindow) => {
    const session = sessionRef.current;
    session.cursor = window.cursor;
    session.hasMore = window.hasMore;
    windowCacheRef.current.set(convId, window);
    setHistoryCursor(window.cursor);
  };

  capIfAtBottomRef.current = (convId: string) => {
    if (!sessionRef.current.stickToBottom) return;
    const newOldest = retainNewestMessages(
      convId,
      MAX_MESSAGES_PER_CONVERSATION,
    );
    if (!newOldest) return;
    applyWindow(convId, { cursor: newOldest, hasMore: true });
  };

  const storeOldestCursor = (convId: string): MessageHistoryCursor | null => {
    const messages = Array.from(
      useBoundStore.getState().chat.messages.get(convId)?.values() ?? [],
    );
    return toHistoryCursor(messages[messages.length - 1]);
  };

  seedRef.current = async () => {
    const session = sessionRef.current;
    if (!conversationId || session.seeded || session.loading) return;

    const cached = windowCacheRef.current.get(conversationId);
    if (cached) {
      if (cached.cursor) trimMessagesOlderThan(conversationId, cached.cursor);
      applyWindow(conversationId, cached);
      session.seeded = true;
      return;
    }

    const epoch = session.epoch;
    session.loading = true;
    setIsLoadingOlder(true);

    try {
      const latest = await fetchLatestConversationMessages(
        conversationId,
        HISTORY_PAGE_SIZE,
      );
      if (epoch !== sessionRef.current.epoch) return;

      const cursor = oldestHistoryCursor(latest);
      if (latest.length > 0) {
        pushMessages(latest);
        if (cursor) trimMessagesOlderThan(conversationId, cursor);
      }

      applyWindow(conversationId, {
        cursor,
        hasMore: latest.length >= HISTORY_PAGE_SIZE,
      });
      session.seeded = true;
      capIfAtBottomRef.current(conversationId);
    } catch (err) {
      console.error(err);
      if (epoch !== sessionRef.current.epoch) return;
      // Network failed — fall back to whatever init already put in the store,
      // trimmed to one page so orphans cannot become the pagination cursor.
      const fallback = retainNewestMessages(conversationId, HISTORY_PAGE_SIZE);
      applyWindow(conversationId, {
        cursor: fallback ?? storeOldestCursor(conversationId),
        hasMore: true,
      });
      session.seeded = true;
    } finally {
      if (epoch === sessionRef.current.epoch) {
        session.loading = false;
        setIsLoadingOlder(false);
      }
    }
  };

  loadOlderRef.current = async () => {
    const session = sessionRef.current;
    const el = scrollerRef.current;
    if (
      !conversationId ||
      !el ||
      !session.seeded ||
      session.loading ||
      !session.hasMore
    ) {
      return;
    }

    const loaded =
      useBoundStore.getState().chat.messages.get(conversationId)?.size ?? 0;
    if (loaded >= MAX_MESSAGES_PER_CONVERSATION) return;

    const contentFits = el.scrollHeight <= el.clientHeight + 1;
    const nearTop = el.scrollTop < SCROLL_TOP_LOAD_THRESHOLD_PX;

    // Autofill only when the thread is shorter than the viewport (open chat with
    // a handful of init/seed rows). When stickToBottom, do NOT treat scrollTop≈0
    // as "user scrolled up" — that is also the initial/pre-pin position and was
    // paging older history on open, jumping the viewport away from the latest.
    const needsPage = session.stickToBottom
      ? contentFits
      : nearTop || contentFits;
    if (!needsPage) return;

    const before = session.cursor ?? storeOldestCursor(conversationId);
    if (!before) return;

    session.pendingRestore = session.stickToBottom
      ? null
      : {
          height: el.scrollHeight,
          top: el.scrollTop,
          baselineCount: messageCount,
          ready: false,
        };

    const epoch = session.epoch;
    session.loading = true;
    setIsLoadingOlder(true);

    try {
      const older = await fetchConversationMessages(
        conversationId,
        before,
        HISTORY_PAGE_SIZE,
      );
      if (epoch !== sessionRef.current.epoch) return;

      const hasMore = older.length >= HISTORY_PAGE_SIZE;
      if (older.length === 0) {
        session.pendingRestore = null;
        applyWindow(conversationId, { cursor: session.cursor, hasMore: false });
        return;
      }

      // Advance past this page even if rows are filtered out (scheduled/dupes),
      // so we never retry the same keyset forever.
      applyWindow(conversationId, {
        cursor: oldestHistoryCursor(older) ?? session.cursor,
        hasMore,
      });

      const sizeBefore =
        useBoundStore.getState().chat.messages.get(conversationId)?.size ?? 0;

      if (session.pendingRestore && el.isConnected) {
        session.pendingRestore = {
          height: el.scrollHeight,
          top: el.scrollTop,
          baselineCount: sizeBefore,
          ready: true,
        };
      }

      pushMessages(older);
      capIfAtBottomRef.current(conversationId);

      const sizeAfter =
        useBoundStore.getState().chat.messages.get(conversationId)?.size ?? 0;
      if (sizeAfter <= sizeBefore) {
        session.pendingRestore = null;
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

  useLayoutEffect(() => {
    const session = sessionRef.current;
    const el = scrollerRef.current;

    if (session.conversationId !== conversationId) {
      session.conversationId = conversationId;
      session.epoch += 1;
      session.hasMore = true;
      session.loading = false;
      session.stickToBottom = true;
      session.cursor = null;
      session.seeded = false;
      session.pendingRestore = null;
      session.ignoreStickUpdates = 0;
      setHistoryCursor(null);
      setIsLoadingOlder(false);
      if (conversationId) capIfAtBottomRef.current(conversationId);
    }

    if (!el) return;

    const pending = session.pendingRestore;
    if (pending) {
      if (!pending.ready || messageCount <= pending.baselineCount) return;
      session.ignoreStickUpdates += 1;
      el.scrollTop = el.scrollHeight - pending.height + pending.top;
      session.pendingRestore = null;
      requestAnimationFrame(() => {
        session.ignoreStickUpdates = Math.max(
          0,
          session.ignoreStickUpdates - 1,
        );
      });
    } else if (session.stickToBottom) {
      pinToBottom(el);
    }
  }, [conversationId, messageCount]);

  useEffect(() => {
    void seedRef.current().then(() => {
      const el = scrollerRef.current;
      // Seed/trim can change layout after the conversationId layout pass.
      if (sessionRef.current.stickToBottom && el) pinToBottom(el);
      void loadOlderRef.current();
    });
  }, [conversationId]);

  useEffect(() => {
    void loadOlderRef.current();
  }, [messageCount, isLoadingOlder]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onViewportResize = () => {
      if (sessionRef.current.stickToBottom) pinToBottom(el);
      void loadOlderRef.current();
    };

    window.visualViewport?.addEventListener("resize", onViewportResize);

    // Media/images expanding after open would leave the viewport above the
    // latest bubble if we only pin on messageCount changes. Observe content
    // children — the scrollport's own box stays fixed when overflow grows.
    const onContentResize = () => {
      if (sessionRef.current.stickToBottom) pinToBottom(el);
    };
    const ro = new ResizeObserver(onContentResize);
    for (const child of Array.from(el.children)) ro.observe(child);

    return () => {
      window.visualViewport?.removeEventListener("resize", onViewportResize);
      ro.disconnect();
    };
  }, [conversationId, messageCount]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;

    if (sessionRef.current.ignoreStickUpdates > 0) {
      void loadOlderRef.current();
      return;
    }

    const wasAtBottom = sessionRef.current.stickToBottom;
    sessionRef.current.stickToBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight <
      STICK_TO_BOTTOM_THRESHOLD_PX;

    if (!wasAtBottom && sessionRef.current.stickToBottom && conversationId) {
      capIfAtBottomRef.current(conversationId);
    }

    void loadOlderRef.current();
  };

  return { scrollerRef, isLoadingOlder, onScroll, historyCursor };
}
