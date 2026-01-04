import useBoundStore from "@/stores/useBoundStore";
import ChatListItem from "./ChatListItem";
import { type ConversationRow, type MessageRow } from "@/supabase/client";
import { timestampDescending } from "@/stores/chatSlice";
import { filters, Filters } from "@/stores/uiSlice";
import Fuse from "fuse.js";
import { Translate as T } from "@/hooks/useTranslation";

export type ConvMetadata = {
  convId: string;
  conv: ConversationRow;
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
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);
  const conversations = useBoundStore((state) => state.chat.conversations);
  const messages = useBoundStore((state) => state.chat.messages);
  const filterName = useBoundStore((state) => state.ui.filter);
  const setFilterName = useBoundStore((state) => state.ui.setFilter);
  const searchPattern = useBoundStore((state) => state.ui.searchPattern);
  const setSearchPattern = useBoundStore((state) => state.ui.setSearchPattern);

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
      mostRecentMsg: getMostRecentMsg(convId),
    }))
    .filter(
      (a) =>
        a.conv.organization_id === activeOrgId &&
        filters[filterName](a.conv, a.mostRecentMsg) &&
        !!a.mostRecentMsg
    );

  if (searchPattern) {
    const fuse = new Fuse(items, {
      threshold: 0.4,
      keys: ["conv.name", "conv.contact_address"],
    });
    items = fuse.search(searchPattern).map((r) => r.item);
  } else {
    items.sort(
      (a, b) =>
        pinnedAscending(a.conv, b.conv) ||
        timestampDescending(a.mostRecentMsg, b.mostRecentMsg),
    );
  }

  const itemIds = items.map((a) => a.convId);

  return (
    <div className="overflow-y-auto [scrollbar-gutter:stable] w-full h-full pt-[10px] px-[10px]">
      {itemIds.length ? (
        <div className="flex flex-col gap-[4px]">
          {itemIds.map((key) => (
            <ChatListItem key={key} itemId={key} />
          ))}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center flex-col text-foreground text-[15px] mt-[-24px]">
          <T>Nada por aquí</T>
          {(searchPattern || filterName !== Filters.ALL) && (
            <T
              className="text-[13px] text-primary"
              as="button"
              onClick={() => {
                setSearchPattern("");
                setFilterName(Filters.ALL);
              }}
            >
              remover filtros...
            </T>
          )}
        </div>
      )}
    </div>
  )
};

export default ChatList;

