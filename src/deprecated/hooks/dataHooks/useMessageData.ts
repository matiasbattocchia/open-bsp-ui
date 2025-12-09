// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import useBoundStore from "@/store/useBoundStore";
import {
  fetchMessagesFromBackend,
  getCachedMessages,
  updateMessagesCache,
} from "@/utils/IdbUtils";

export const useMessageData = (
  authorizedAddresses: string[] | undefined,
  days: number = 60,
  limit: number = 30000,
) => {
  const pushMessages = useBoundStore((state) => state.chat.pushMessages);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!authorizedAddresses?.length) return;

      const cache = await getCachedMessages(authorizedAddresses.join("_"));
      pushMessages(cache.messages);

      const newMessages = await fetchMessagesFromBackend(
        cache.lastFetched,
        authorizedAddresses,
        days,
        limit,
      );
      if (newMessages.length > 0) {
        await updateMessagesCache(newMessages, authorizedAddresses.join("_"));
        pushMessages(newMessages);
      }
    };

    fetchMessages();
  }, [authorizedAddresses, days, limit, pushMessages]);
};
