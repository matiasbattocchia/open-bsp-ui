import useBoundStore from "@/store/useBoundStore";
import ChatListItem from "./ChatListItem/ChatListItem";
import { ConversationRow, MessageRow } from "@/supabase/client";
import { timestampDescending } from "@/store/chatSlice";
import { filters, Filters } from "@/store/uiSlice";
import Fuse from "fuse.js";
import { Translate as T } from "react-dialect";

export type ChatListType = "organizations" | "conversations";

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

const ChatList = ({ type }: { type: ChatListType }) => {
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);
  const items = useBoundStore((state) => state.chat[type]);
  const messages = useBoundStore((state) => state.chat.messages);
  const filterName = useBoundStore((state) => state.ui.filter);
  const setFilterName = useBoundStore((state) => state.ui.setFilter);
  const searchPattern = useBoundStore((state) => state.ui.searchPattern);
  const setSearchPattern = useBoundStore((state) => state.ui.setSearchPattern);
  const role = useBoundStore(
    (state) => state.ui.roles[state.ui.activeOrgId || ""]?.role,
  );

  function getMostRecentMsg(convId: string): MessageRow | undefined {
    return messages.get(convId)?.values().next().value;
  }

  let metaItems: ConvMetadata[] = [...items]
    .filter(
      ([convId, conv]) =>
        role === "admin" || (conv as ConversationRow).service !== "local",
    )
    .map(([convId, conv]) => ({
      convId,
      conv: conv as ConversationRow,
      mostRecentMsg: getMostRecentMsg(convId),
    }))
    .filter(
      (a) =>
        type === "organizations" ||
        (a.conv.organization_id === activeOrgId &&
          filters[filterName](a.conv, a.mostRecentMsg)),
    );

  if (searchPattern) {
    const fuse = new Fuse(metaItems, {
      threshold: 0.4,
      keys: ["conv.name", "conv.contact_address"],
    });
    metaItems = fuse.search(searchPattern).map((r) => r.item);
  } else {
    metaItems.sort(
      (a, b) =>
        pinnedAscending(a.conv, b.conv) ||
        timestampDescending(a.mostRecentMsg, b.mostRecentMsg),
    );
  }

  const itemIds = metaItems.map((a) => a.convId);
  const organizationsList = useBoundStore(
    (state) => state.ui.organizationsList,
  );

  const isActive =
    type === "organizations" ? organizationsList : !organizationsList;

  return (
    isActive && (
      <div className="[overflow-y:overlay] border-r border-gray-line bg-white w-[calc(100dvw)]">
        {itemIds.length ? (
          <div className="chat-list flex flex-col">
            {itemIds.map((key) => (
              <ChatListItem key={key} itemId={key} type={type} />
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center flex-col">
            <T className="text-lg">Nada por aquí</T>
            {(searchPattern || filterName !== Filters.ALL) && (
              <T
                className="p-1 text-blue-ack"
                as="button"
                onClick={(e) => {
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
  );
};

export default ChatList;
