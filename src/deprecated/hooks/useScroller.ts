// @ts-nocheck
// @ts-nocheck
import { RefObject, useEffect, useState } from "react";
import {
  fetchConversationMessages,
  updateMessagesCache,
} from "@/utils/IdbUtils";
import { debounce } from "@/utils/UtilityFunctions";
import useBoundStore from "@/store/useBoundStore";
import dayjs from "dayjs";
import { MessageRow } from "@/supabase/client";

const useScroller = (
  scroller: RefObject<HTMLDivElement>,
  messages: MessageRow[],
  activeConvId: string | null,
) => {
  const pushMessages = useBoundStore((state) => state.chat.pushMessages);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const fetchMoreMessages = async (
    activeConvId: string,
    timeStamp?: number,
  ) => {
    setIsFetchingMore(true);
    const newMessages = await fetchConversationMessages(
      activeConvId,
      timeStamp ? dayjs(timeStamp) : dayjs(),
    );
    if (newMessages.length > 0) {
      await updateMessagesCache(newMessages);
      pushMessages(newMessages);
    }
    setTimeout(() => setIsFetchingMore(false), 5000);
  };

  // Debounce the scroll event to avoid multiple fetches
  // fetching when reaching the 15% of the scroll height of the scroller
  const handleScroll: any = debounce(() => {
    if (!scroller.current) return;
    if (
      scroller.current.scrollTop <= scroller.current.scrollHeight * 0.15 &&
      activeConvId &&
      messages[messages.length - 1]
    ) {
      fetchMoreMessages(
        activeConvId,
        dayjs(messages[messages.length - 1].timestamp).valueOf(),
      );
    }
  }, 2000);

  const isFarFromBottom = () => {
    if (!scroller.current) return false;
    return (scroller.current.scrollTop + scroller.current.clientHeight) <
      (scroller.current.scrollHeight * 0.8)
      ;
  }

  const doShowScrollButton = () => setShowScrollButton(isFarFromBottom());

  const addListeners = () => {
    if (!scroller.current) return;

    scroller.current?.addEventListener("scroll", handleScroll);
    scroller.current?.addEventListener("scroll", doShowScrollButton);
    // Sometimes conversations will have fewer messages than the limit that causes scroll
    // so, we'll need to fetch more if the user scrolls being on the top.
    scroller.current?.addEventListener(
      "wheel",
      function (event) {
        if (event.deltaY < 0 && scroller.current?.scrollTop === 0) {
          handleScroll();
        }
      },
      { once: true },
    );
  };

  const removeListeners = () => {
    if (scroller) {
      scroller.current?.removeEventListener("scroll", handleScroll);
      scroller.current?.removeEventListener("scroll", doShowScrollButton);
      scroller.current?.removeEventListener("wheel", function (event) {
        if (event.deltaY < 0 && scroller.current?.scrollTop === 0) {
          handleScroll();
        }
      });
    }
  };

  useEffect(() => {
    setShowScrollButton(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId]);

  return {
    fetchMoreMessages,
    addListeners,
    removeListeners,
    showScrollButton,
    isLoading: isFetchingMore,
    isFarFromBottom
  };
};

export default useScroller;
