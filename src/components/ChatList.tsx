import useBoundStore from "@/store/useBoundStore";
import ChatListItem from "./ChatListItem/ChatListItem";
import { type ConversationRow, type MessageRow } from "@/supabase/client";
import { timestampDescending } from "@/store/chatSlice";
import { filters, Filters } from "@/store/uiSlice";
import Fuse from "fuse.js";
import { Translate as T } from "@/hooks/useTranslation";
import { useOrganizations } from "@/query/useOrgs";

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
  const conversations = useBoundStore((state) => state.chat.conversations);
  const messages = useBoundStore((state) => state.chat.messages);
  const filterName = useBoundStore((state) => state.ui.filter);
  const setFilterName = useBoundStore((state) => state.ui.setFilter);
  const searchPattern = useBoundStore((state) => state.ui.searchPattern);
  const setSearchPattern = useBoundStore((state) => state.ui.setSearchPattern);
  const role = useBoundStore(
    (state) => state.ui.roles[state.ui.activeOrgId || ""]?.role,
  );

  // New hook for organizations
  const { data: organizations } = useOrganizations();

  function getMostRecentMsg(convId: string): MessageRow | undefined {
    return messages.get(convId)?.values().next().value;
  }

  let metaItems: ConvMetadata[] = [];

  if (type === "organizations") {
    // Handle organizations using the new hook data
    metaItems = (organizations?.data || []).map((org) => ({
      convId: org.id,
      conv: org as unknown as ConversationRow, // Temporary cast until we fix types
      mostRecentMsg: undefined,
    }));
  } else {
    // Handle conversations using Zustand store
    metaItems = [...conversations]
      .filter(
        ([, conv]) =>
          role === "admin" || (conv as ConversationRow).service !== "local",
      )
      .map(([convId, conv]) => ({
        convId,
        conv: conv as ConversationRow,
        mostRecentMsg: getMostRecentMsg(convId),
      }))
      .filter(
        (a) =>
          a.conv.organization_id === activeOrgId &&
          filters[filterName](a.conv, a.mostRecentMsg),
      );
  }

  if (searchPattern) {
    const fuse = new Fuse(metaItems, {
      threshold: 0.4,
      keys: ["conv.name", "conv.contact_address"],
    });
    metaItems = fuse.search(searchPattern).map((r) => r.item);
  } else {
    if (type === "conversations") {
      metaItems.sort(
        (a, b) =>
          pinnedAscending(a.conv, b.conv) ||
          timestampDescending(a.mostRecentMsg, b.mostRecentMsg),
      );
    } else {
      // Sort organizations alphabetically by name
      metaItems.sort((a, b) => (a.conv.name || "").localeCompare(b.conv.name || ""));
    }
  }

  const itemIds = metaItems.map((a) => a.convId);
  const organizationsList = useBoundStore(
    (state) => state.ui.organizationsList,
  );

  const isActive =
    type === "organizations" ? organizationsList : !organizationsList;

  return (
    isActive && (
      <div className="[overflow-y:overlay] border-r border-gray-line bg-white w-full h-full">
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
  );
};

export default ChatList;
