import { useMemo } from "react";
import useBoundStore from "@/stores/useBoundStore";
import ChatListItem from "./ChatListItem";
import { type ConversationRow, type MessageRow } from "@/supabase/client";
import type { ContactAddressExtra } from "@/supabase/client";
import { timestampDescending } from "@/stores/chatSlice";
import { filters, Filters } from "@/stores/uiSlice";
import { useTranslation } from "@/hooks/useTranslation";
import { useConversationListScroll } from "@/hooks/useConversationListScroll";
import { useConversationSearch } from "@/hooks/useConversationSearch";
import { useContacts } from "@/queries/useContacts";
import { conversationMatchesSearch } from "@/utils/conversationSearch";
import Spinner from "./Spinner";

export type ConvMetadata = {
  convId: string;
  conv: ConversationRow;
  alias?: string;
  mostRecentMsg?: MessageRow;
};

function pinnedAscending(a: ConversationRow, b: ConversationRow) {
  const aPin = a.extra?.pinned;
  const bPin = b.extra?.pinned;

  if (!aPin && !bPin) {
    return 0;
  }

  if (aPin && bPin) {
    return +new Date(aPin) > +new Date(bPin) ? 1 : -1;
  }

  return aPin && !bPin ? -1 : 1;
}

const ChatList = () => {
  const { translate: t } = useTranslation();
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);
  const conversations = useBoundStore((state) => state.chat.conversations);
  const messages = useBoundStore((state) => state.chat.messages);
  const filterName = useBoundStore((state) => state.ui.filter);
  const setFilterName = useBoundStore((state) => state.ui.setFilter);
  const searchPattern = useBoundStore((state) => state.ui.searchPattern);
  const setSearchPattern = useBoundStore((state) => state.ui.setSearchPattern);
  const conversationAliases = useBoundStore(
    (state) => state.ui.conversationAliases || {},
  );
  const { data: contacts } = useContacts();
  const isSearching = Boolean(searchPattern.trim());

  useConversationSearch(searchPattern);

  const contactIndex = useMemo(() => {
    const map = new Map<
      string,
      { name?: string; extraName?: string; username?: string }
    >();

    for (const contact of contacts ?? []) {
      for (const addr of contact.addresses ?? []) {
        const extra = addr.extra as ContactAddressExtra | null;
        const key = `${addr.service}:${addr.address}`;
        const prev = map.get(key);
        map.set(key, {
          name: contact.name || prev?.name,
          extraName: extra?.name || prev?.extraName,
          username:
            extra && "username" in extra && extra.username
              ? extra.username
              : prev?.username,
        });
      }
    }

    return map;
  }, [contacts]);

  function getMostRecentMsg(convId: string): MessageRow | undefined {
    return messages.get(convId)?.values().next().value;
  }

  let items: ConvMetadata[] = [...conversations]
    /*.filter(
      ([, conv]) =>
        role === "admin" || conv.service !== "local",
    )*/
    .map(([convId, conv]) => ({
      convId,
      conv,
      alias: conversationAliases[convId],
      mostRecentMsg: getMostRecentMsg(convId),
    }))
    .filter(
      (a) =>
        a.conv.organization_id === activeOrgId &&
        filters[filterName](a.conv, a.mostRecentMsg) &&
        !!a.mostRecentMsg,
    );

  if (isSearching) {
    items = items.filter((item) => {
      const info = item.conv.contact_address
        ? contactIndex.get(`${item.conv.service}:${item.conv.contact_address}`)
        : undefined;
      return conversationMatchesSearch(
        {
          alias: item.alias,
          name: item.conv.name,
          contactName: info?.name,
          extraName: info?.extraName,
          username: info?.username,
          contactAddress: item.conv.contact_address,
          groupAddress: item.conv.group_address,
        },
        searchPattern,
      );
    });
  } else {
    items.sort(
      (a, b) =>
        pinnedAscending(a.conv, b.conv) ||
        timestampDescending(a.mostRecentMsg, b.mostRecentMsg),
    );
  }

  const itemIds = items.map((a) => a.convId);

  const { scrollerRef, isLoadingOlder, onScroll } = useConversationListScroll(
    itemIds.length,
    { enabled: !isSearching },
  );

  return (
    <div
      ref={scrollerRef}
      onScroll={onScroll}
      className="flex-1 min-h-0 w-full overflow-y-auto [overflow-anchor:none] [scrollbar-gutter:stable] pt-[10px] px-[10px]"
    >
      {itemIds.length ? (
        <div className="flex flex-col gap-[4px]">
          {itemIds.map((key) => (
            <ChatListItem key={key} itemId={key} />
          ))}
          {isLoadingOlder && (
            <div className="flex justify-center py-2">
              <Spinner size={16} />
            </div>
          )}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center flex-col text-foreground text-[15px] mt-[-24px]">
          {t("Nada por aquí")}
          {(searchPattern || filterName !== Filters.ALL) && (
            <button
              className="text-[13px] text-primary"
              onClick={() => {
                setSearchPattern("");
                setFilterName(Filters.ALL);
              }}
            >
              {t("remover filtros...")}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatList;
