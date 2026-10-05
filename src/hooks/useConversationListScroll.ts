import { useCallback, useEffect, useRef, useState } from "react";
import useBoundStore from "@/stores/useBoundStore";
import {
  applyInitDataPage,
  fetchInitDataPage,
  oldestLoadedConversationPreview,
  oldestTimestampInPage,
} from "@/utils/initDataUtils";

const PAGE_LIMIT = 100;
const PER_CONVERSATION = 5;
const SCROLL_BOTTOM_THRESHOLD_PX = 120;

/**
 * Loads older conversations when the user scrolls the chat list toward the
 * bottom. Initial init_data only covers a recent message window; this pages
 * backward with init_data(p_until).
 */
export function useConversationListScroll(
  itemCount: number,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeOrgId = useBoundStore((s) => s.ui.activeOrgId);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const untilRef = useRef<string | null>(null);
  const epochRef = useRef(0);

  useEffect(() => {
    epochRef.current += 1;
    hasMoreRef.current = true;
    untilRef.current = null;
    loadingRef.current = false;
    setIsLoadingOlder(false);
  }, [activeOrgId]);

  const loadOlder = useCallback(async () => {
    const epoch = epochRef.current;
    if (!enabled || !activeOrgId || !hasMoreRef.current || loadingRef.current) {
      return;
    }

    const el = scrollerRef.current;
    if (el) {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      const shortList = el.scrollHeight <= el.clientHeight + 1;
      if (distanceFromBottom > SCROLL_BOTTOM_THRESHOLD_PX && !shortList) {
        return;
      }
    }

    const until =
      untilRef.current ?? oldestLoadedConversationPreview(activeOrgId);
    if (!until) return;

    loadingRef.current = true;
    setIsLoadingOlder(true);

    try {
      const page = await fetchInitDataPage(activeOrgId, {
        limit: PAGE_LIMIT,
        perConversation: PER_CONVERSATION,
        until,
      });

      if (epoch !== epochRef.current) return;
      if (!page.messages?.length) {
        hasMoreRef.current = false;
        return;
      }

      const pageOldest = oldestTimestampInPage(page.messages);
      if (pageOldest && pageOldest >= until) {
        hasMoreRef.current = false;
        return;
      }

      applyInitDataPage(page);
      if (pageOldest) untilRef.current = pageOldest;

      if (page.messages.length < PAGE_LIMIT) {
        hasMoreRef.current = false;
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (epoch === epochRef.current) {
        loadingRef.current = false;
        setIsLoadingOlder(false);
      }
    }
  }, [activeOrgId, enabled]);

  useEffect(() => {
    void loadOlder();
  }, [itemCount, loadOlder]);

  const onScroll = useCallback(() => {
    void loadOlder();
  }, [loadOlder]);

  return { scrollerRef, isLoadingOlder, onScroll };
}
