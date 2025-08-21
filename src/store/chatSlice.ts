import {
  OrganizationRow,
  ConversationRow,
  MessageRow,
} from "@/supabase/client";
import { GoriState } from "./useBoundStore";
import { StateCreator } from "zustand";
// @ts-ignore
import groupBy from "core-js-pure/actual/object/group-by";

export const SEP = "<>";

export function timestampDescending(a?: MessageRow, b?: MessageRow) {
  return +new Date(a?.timestamp || 0) > +new Date(b?.timestamp || 0) ? -1 : 1;
}

export type FileDraft = {
  file: File;
  caption?: string;
};

type MediaLoad = {
  blob?: Blob;
  type: "upload" | "download";
  status: "pending" | "loading" | "done" | "error";
  error?: string;
  handledOnce?: boolean;
};

export type ChatState = {
  organizations: Map<string, OrganizationRow>;
  conversations: Map<string, ConversationRow>;
  messages: Map<string, Map<string, MessageRow>>; // TODO: replace the nested maps with a data structure capable of prefix search (a Trie) - cabra 2024/07/26
  textDrafts: Map<string, string>;
  fileDrafts: Map<string, FileDraft[]>;
  mediaLoads: Map<string, MediaLoad>;
};

export type ChatActions = {
  setOrganizations: (orgs: OrganizationRow[]) => void;
  pushConversations: (convs: ConversationRow[]) => void;
  pushMessages: (msgs: MessageRow[]) => void;
  setMediaLoad: (messageId: string, mediaLoad: MediaLoad) => void;
  setConversationTextDraft: (convId: string, textDraft: string) => void;
  setConversationFileDrafts: (convId: string, drafts: FileDraft[]) => void;
  setConversationFileDraftCaption: (
    convId: string,
    draftIndex: number,
    caption: string,
  ) => void;
};
export type ChatSlice = ChatState & ChatActions;

export const defaultChatInitState: StateCreator<Partial<GoriState>> = (
  set: (
    partial:
      | GoriState
      | Partial<GoriState>
      | ((state: GoriState) => GoriState | Partial<GoriState>),
    replace?: boolean | undefined,
  ) => void,
) => ({
  organizations: new Map(),
  conversations: new Map(),
  messages: new Map(),
  textDrafts: new Map(),
  fileDrafts: new Map(),
  mediaLoads: new Map(),
  setOrganizations: async (orgs: OrganizationRow[]) =>
    set((state) => {
      return {
        chat: {
          ...state.chat,
          organizations: new Map(orgs.map((r) => [r.id, r])),
        },
      };
    }),
  pushConversations: (convs: ConversationRow[]) =>
    set((state) => {
      const conversations = new Map(state.chat.conversations);

      for (const conv of convs) {
        const convId = conv.organization_address + SEP + conv.contact_address;

        // skip push when the cached conv is more recent than the incoming conv
        const cachedUpdatedAt = conversations.get(convId)?.updated_at;
        if (
          cachedUpdatedAt &&
          +new Date(cachedUpdatedAt) > +new Date(conv.updated_at)
        ) {
          continue;
        }

        conversations.set(convId, conv);
      }

      return {
        chat: {
          ...state.chat,
          conversations,
        },
      };
    }),
  pushMessages: (msgs: MessageRow[]) =>
    set((state) => {
      const messages = new Map(state.chat.messages);

      const msgsByConv: { [key: string]: MessageRow[] } = groupBy(
        msgs.filter((m) => m.timestamp <= m.updated_at), // do not display scheduled messages (timestamp in the future)
        (msg: MessageRow) =>
          msg.organization_address + SEP + msg.contact_address,
      );

      for (const [convId, convMsgs] of Object.entries(msgsByConv)) {
        /* PART A: Conciliation */
        const messagesByConv = new Map(messages.get(convId));

        for (const msg of convMsgs!) {
          // skip push when the cached msg is more recent than the incoming msg
          const cachedUpdatedAt = messagesByConv.get(msg.id)?.updated_at;
          if (
            cachedUpdatedAt &&
            +new Date(cachedUpdatedAt) > +new Date(msg.updated_at)
          ) {
            continue;
          }

          messagesByConv.set(msg.id, msg);
        }

        /* PART B: Sorting (most recent first) */
        const sortedMessagesByConv = new Map(
          Array.from(messagesByConv.values())
            .sort(timestampDescending)
            .map((msg) => [msg.id, msg]),
        );

        messages.set(convId, sortedMessagesByConv);
      }

      return {
        chat: {
          ...state.chat,
          messages,
        },
      };
    }),
  setMediaLoad: (messageId: string, mediaLoad: MediaLoad) => {
    set((state) => {
      const mediaLoads = new Map(state.chat.mediaLoads);

      mediaLoads.set(messageId, { ...mediaLoad });

      return {
        chat: {
          ...state.chat,
          mediaLoads,
        },
      };
    });
  },
  setConversationTextDraft: (convId: string, textDraft: string) => {
    set((state) => {
      const textDrafts = new Map(state.chat.textDrafts);

      textDrafts.set(convId, textDraft);

      return {
        chat: {
          ...state.chat,
          textDrafts,
        },
      };
    });
  },
  setConversationFileDrafts: (convId: string, fileDraftArray: FileDraft[]) => {
    set((state) => {
      const fileDrafts = new Map(state.chat.fileDrafts);

      fileDrafts.set(convId, fileDraftArray);

      return {
        chat: {
          ...state.chat,
          fileDrafts,
        },
      };
    });
  },
  setConversationFileDraftCaption: (
    convId: string,
    draftIndex: number,
    caption: string,
  ) => {
    set((state) => {
      const fileDrafts = new Map(state.chat.fileDrafts);

      const draft =
        fileDrafts.get(convId) && fileDrafts.get(convId)![draftIndex];

      if (!draft) {
        return {};
      }

      const fileDraftsArray = Array.from(fileDrafts.get(convId)!);

      fileDraftsArray[draftIndex] = { ...draft, caption };

      fileDrafts.set(convId, fileDraftsArray);

      return {
        chat: {
          ...state.chat,
          fileDrafts,
        },
      };
    });
  },
});
