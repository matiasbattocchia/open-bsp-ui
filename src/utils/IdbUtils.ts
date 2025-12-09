import { type MessageRow, supabase } from "@/supabase/client";
import dayjs from "dayjs";
import { del, get, set } from "idb-keyval";

interface MessageCache {
  messages: MessageRow[];
  lastFetched: number; // Timestamp of the latest fetch
}

const MSGS_CACHE_KEY = "messages_cache";
const AUTH_CACHE_KEY = "authorized_cache";
const CACHE_TTL = 60 * 24 * 60 * 60 * 1000; // 60 days in ms

export const getCachedMessages = async (authOrgs: string | undefined) => {
  const cache: MessageCache | undefined = await get(
    MSGS_CACHE_KEY + (authOrgs ? "_" + authOrgs : ""),
  );
  if (!cache) return { messages: [], lastFetched: 0 };

  // Remove expired messages
  const now = Date.now();
  const filteredMessages = cache.messages.filter(
    (msg) => now - dayjs(msg.timestamp).valueOf() < CACHE_TTL,
  );

  return { messages: filteredMessages, lastFetched: cache.lastFetched };
};

// Global fetch messages for bulk message load on app init
export const fetchMessagesFromBackend = async (
  lastFetched: number,
  authorizedAddresses: string[],
  days: number,
  limit: number,
) => {
  const timeWindowStart =
    lastFetched === 0 ? dayjs().subtract(days, "days") : dayjs(lastFetched);
  let messagesResponse: MessageRow[] = [];

  try {
    const fetch = async (from: number = 0, to: number = 999) => {
      const msgsQuery = await supabase
        .from("messages")
        .select()
        .in("organization_address", authorizedAddresses)
        .gte("timestamp", timeWindowStart)
        .order("updated_at", { ascending: false })
        .range(from, to);

      if (msgsQuery.error) {
        throw msgsQuery.error;
      }

      return msgsQuery.data;
    };

    let rows = 0;
    const pageSize = 1000;

    while (true) {
      const results = await fetch(rows, Math.min(rows + pageSize, limit) - 1);

      messagesResponse.push(...results);
      if (results.length < pageSize) {
        break;
      }

      rows += results.length;
    }
  } catch (err) {
    console.error(err);
  }

  return messagesResponse;
};

// Fetch messages for a specific conversation for infinite scroll
// getting a small amount of messages at a time if the conversation
// is empty, or if the user has reached the top of the conversation
export const fetchConversationMessages = async (
  activeConvId: string,
  timeWindowStart: dayjs.Dayjs,
) => {
  const [organizationAddress, contactAddress] = activeConvId.split("<>");

  const msgsQuery = await supabase
    .from("messages")
    .select()
    .match({
      organization_address: organizationAddress,
      contact_address: contactAddress,
    })
    .lt("timestamp", timeWindowStart.toISOString())
    .order("updated_at", { ascending: false })
    .limit(30);

  if (msgsQuery.error) {
    throw msgsQuery.error;
  }

  return msgsQuery.data;
};

// Update messages cache with new messages
export const updateMessagesCache = async (
  newMessages: MessageRow[],
  authAdresses?: string,
) => {
  let authAdd = authAdresses;
  if (!authAdd) {
    authAdd = (await getAuthorizedCache())?.authorizedAddresses.join("_") || "";
  }
  const cache = await getCachedMessages(authAdd);
  const mergedMessagesMap = new Map<string, MessageRow>();

  // Add existing cached messages to the map
  cache.messages.forEach((msg) => mergedMessagesMap.set(msg.id, msg));

  // Add new messages to the map, overwriting any existing messages with the same id if they are older
  newMessages.forEach((msg) => {
    const existingMsg = mergedMessagesMap.get(msg.id);
    if (
      !existingMsg ||
      dayjs(msg.updated_at).isAfter(dayjs(existingMsg.updated_at))
    ) {
      mergedMessagesMap.set(msg.id, msg);
    }
  });

  // Convert the map back to an array
  const mergedMessages = Array.from(mergedMessagesMap.values());

  await set(MSGS_CACHE_KEY + (authAdd ? "_" + authAdd : ""), {
    messages: mergedMessages,
    lastFetched: Date.now(),
  });
};

// Authorized orgs and addresses cache methods
export const updateAuthorizedCache = async (authData: {
  authorizedOrgs: string[];
  authorizedAddresses: string[];
}) => {
  await set(AUTH_CACHE_KEY, authData);
};

export const getAuthorizedCache = async () => {
  return await get(AUTH_CACHE_KEY);
};

export const resetAuthorizedCache = async () => {
  await del(AUTH_CACHE_KEY);
};
