import type { ConversationRow, MessageRow } from "@/supabase/client";
import type { AppState } from "./useBoundStore";
import type { StateCreator } from "zustand";
// @ts-expect-error no type declarations for the core-js-pure submodule
import groupBy from "core-js-pure/actual/object/group-by";
import { type MessageRowV0, toV1 } from "@/supabase/messages-v0";
import {
  isOlderThanCursor,
  timestampDescending,
  toHistoryCursor,
  type MessageHistoryCursor,
} from "@/utils/messageHistory";

export {
  isOlderThanCursor,
  timestampDescending,
  toHistoryCursor,
  type MessageHistoryCursor,
} from "@/utils/messageHistory";

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
  conversations: Map<string, ConversationRow>;
  messages: Map<string, Map<string, MessageRow>>; // TODO: replace the nested maps with a data structure capable of prefix search (a Trie) - cabra 2024/07/26
  textDrafts: Map<string, string>;
  fileDrafts: Map<string, FileDraft[]>;
  /** Per-conversation reply target (message id). Cleared on send/cancel. */
  replyToIds: Map<string, string>;
  mediaLoads: Map<string, MediaLoad>;
};

export type ChatActions = {
  pushConversations: (convs: ConversationRow[]) => void;
  pushMessages: (msgs: MessageRow[]) => void;
  /**
   * Drop messages strictly older than `cursor` for a conversation. Used after
   * seeding a contiguous latest window so orphaned init previews cannot sit
   * above a hole and make scroll-up jump from today to the distant past.
   */
  trimMessagesOlderThan: (
    conversationId: string,
    cursor: MessageHistoryCursor,
  ) => void;
  /**
   * Keep only the newest `limit` messages for a conversation (map is newest-first).
   * Returns the new oldest cursor when anything was dropped, else null.
   */
  retainNewestMessages: (
    conversationId: string,
    limit: number,
  ) => MessageHistoryCursor | null;
  setMediaLoad: (messageId: string, mediaLoad: MediaLoad) => void;
  setConversationTextDraft: (convId: string, textDraft: string) => void;
  setConversationFileDrafts: (convId: string, drafts: FileDraft[]) => void;
  setConversationFileDraftCaption: (
    convId: string,
    draftIndex: number,
    caption: string,
  ) => void;
  setConversationReplyTo: (convId: string, messageId: string | null) => void;
};

export type ChatSlice = ChatState & ChatActions;

// @ts-expect-error partializing the slice creator's state type
export const createChatSlice: StateCreator<Partial<AppState>> = (
  set: (
    partial:
      | AppState
      | Partial<AppState>
      | ((state: AppState) => AppState | Partial<AppState>),
    replace?: boolean,
  ) => void,
) => ({
  conversations: new Map(),
  messages: new Map(),
  textDrafts: new Map(),
  fileDrafts: new Map(),
  replyToIds: new Map(),
  mediaLoads: new Map(),
  pushConversations: (convs: ConversationRow[]) =>
    set((state) => {
      const conversations = new Map(state.chat.conversations);

      for (const conv of convs) {
        // skip push when the cached conv is more recent than the incoming conv
        const cachedUpdatedAt = conversations.get(conv.id)?.updated_at;

        if (
          cachedUpdatedAt &&
          +new Date(cachedUpdatedAt) > +new Date(conv.updated_at)
        ) {
          continue;
        }

        conversations.set(conv.id, conv);
      }

      return {
        chat: {
          ...state.chat,
          conversations,
        },
      };
    }),
  pushMessages: (msgsMixedVersions: MessageRow[]) =>
    set((state) => {
      const msgs = msgsMixedVersions
        .map((m) =>
          m.content.version === "1" ? m : toV1(m as unknown as MessageRowV0),
        )
        .filter(Boolean) as MessageRow[];

      const messages = new Map(state.chat.messages);

      const msgsByConv: { [key: string]: MessageRow[] } = groupBy(
        msgs.filter((m) => m.timestamp <= m.updated_at), // do not display scheduled messages (timestamp in the future)
        (msg: MessageRow) => msg.conversation_id,
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
  trimMessagesOlderThan: (
    conversationId: string,
    cursor: MessageHistoryCursor,
  ) =>
    set((state) => {
      const existing = state.chat.messages.get(conversationId);
      if (!existing?.size) return {};

      let removed = false;
      const next = new Map<string, MessageRow>();
      for (const [id, msg] of existing) {
        if (isOlderThanCursor(msg, cursor)) {
          removed = true;
          continue;
        }
        next.set(id, msg);
      }
      if (!removed) return {};

      const messages = new Map(state.chat.messages);
      messages.set(conversationId, next);
      return {
        chat: {
          ...state.chat,
          messages,
        },
      };
    }),
  retainNewestMessages: (conversationId: string, limit: number) => {
    let newOldest: MessageHistoryCursor | null = null;

    set((state) => {
      const existing = state.chat.messages.get(conversationId);
      if (!existing || existing.size <= limit) return {};

      // Map iteration order is newest-first (see pushMessages sort).
      const kept = Array.from(existing.entries()).slice(0, limit);
      newOldest = toHistoryCursor(kept[kept.length - 1]?.[1]);

      const messages = new Map(state.chat.messages);
      messages.set(conversationId, new Map(kept));
      return {
        chat: {
          ...state.chat,
          messages,
        },
      };
    });

    return newOldest;
  },
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
  setConversationReplyTo: (convId: string, messageId: string | null) => {
    set((state) => {
      const replyToIds = new Map(state.chat.replyToIds);

      if (messageId) {
        replyToIds.set(convId, messageId);
      } else {
        replyToIds.delete(convId);
      }

      return {
        chat: {
          ...state.chat,
          replyToIds,
        },
      };
    });
  },
});
