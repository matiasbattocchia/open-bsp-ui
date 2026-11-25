import type {
  ConversationAgentExtra,
  ConversationRow,
  MessageRow,
} from "@/supabase/client";
import type { AppState } from "./useBoundStore";
import type { StateCreator } from "zustand";
// @ts-expect-error no type declarations for the core-js-pure submodule
import groupByUntyped from "core-js-pure/actual/object/group-by";

// Object.groupBy, polyfilled — it is not in the ES2022 lib this project targets.
const groupBy = groupByUntyped as <T>(
  items: Iterable<T>,
  keySelector: (item: T, index: number) => string,
) => Partial<Record<string, T[]>>;
import { type MessageRowV0, toV1 } from "@/supabase/messages-v0";

export function timestampDescending(a?: MessageRow, b?: MessageRow) {
  // Valid comparator: returns a signed number and 0 on ties. The previous
  // version returned only -1/1 (never 0), which is non-antisymmetric for equal
  // timestamps and makes V8's sort produce engine-dependent, unstable order.
  const ta = +new Date(a?.timestamp || 0);
  const tb = +new Date(b?.timestamp || 0);
  if (ta !== tb) return tb - ta;

  // Ties are common: WhatsApp delivers whole-second timestamps, and echoed
  // outgoing messages get their ms-disambiguated timestamp overwritten by
  // Meta's second-resolution one. created_at preserves the true insertion
  // order in those cases; id is the final, fully deterministic fallback.
  const ca = +new Date(a?.created_at || 0);
  const cb = +new Date(b?.created_at || 0);
  if (ca !== cb) return cb - ca;

  return (b?.id || "").localeCompare(a?.id || "");
}

export type FileDraft = {
  file: File;
  caption?: string;
};

/** The message a conversation's next message answers, chosen with Reply. */
export type ReplyDraft = {
  message: MessageRow;
  // Instagram answers a comment either under it, in public, or in a DM to its
  // author.
  inPublic?: boolean;
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
  // The caller's own agent id in the active org, and their per-conversation
  // state (conversations_agents.extra rows): archived/pinned/draft.
  ownAgentId: string | null;
  membershipExtras: Map<string, ConversationAgentExtra>;
  messages: Map<string, Map<string, MessageRow>>; // TODO: replace the nested maps with a data structure capable of prefix search (a Trie) - cabra 2024/07/26
  textDrafts: Map<string, string>;
  fileDrafts: Map<string, FileDraft[]>;
  replyDrafts: Map<string, ReplyDraft>;
  // Per conversation, the comment the composer proposed answering and the
  // member closed (see useReplyTo): it is not proposed again.
  dismissedReplies: Map<string, string>;
  mediaLoads: Map<string, MediaLoad>;
};

export type ChatActions = {
  pushConversations: (convs: ConversationRow[]) => void;
  setOwnAgentId: (agentId: string | null) => void;
  setMembershipExtra: (
    convId: string,
    extra: Partial<ConversationAgentExtra>,
  ) => void;
  pushMembershipExtras: (
    rows: { conversation_id: string; extra: ConversationAgentExtra | null }[],
  ) => void;
  pushMessages: (msgs: MessageRow[]) => void;
  setMediaLoad: (messageId: string, mediaLoad: MediaLoad) => void;
  setConversationTextDraft: (convId: string, textDraft: string) => void;
  setConversationFileDrafts: (convId: string, drafts: FileDraft[]) => void;
  setConversationReplyDraft: (convId: string, draft?: ReplyDraft) => void;
  dismissReply: (convId: string, messageId: string) => void;
  setConversationFileDraftCaption: (
    convId: string,
    draftIndex: number,
    caption: string,
  ) => void;
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
  ownAgentId: null,
  membershipExtras: new Map(),
  messages: new Map(),
  textDrafts: new Map(),
  fileDrafts: new Map(),
  replyDrafts: new Map(),
  dismissedReplies: new Map(),
  mediaLoads: new Map(),
  setOwnAgentId: (agentId: string | null) =>
    set((state) => ({ chat: { ...state.chat, ownAgentId: agentId } })),
  setMembershipExtra: (
    convId: string,
    extra: Partial<ConversationAgentExtra>,
  ) =>
    set((state) => {
      const membershipExtras = new Map(state.chat.membershipExtras);
      membershipExtras.set(convId, {
        ...membershipExtras.get(convId),
        ...extra,
      });
      return { chat: { ...state.chat, membershipExtras } };
    }),
  pushMembershipExtras: (
    rows: { conversation_id: string; extra: ConversationAgentExtra | null }[],
  ) =>
    set((state) => {
      const membershipExtras = new Map(state.chat.membershipExtras);
      for (const row of rows) {
        membershipExtras.set(row.conversation_id, row.extra || {});
      }
      return { chat: { ...state.chat, membershipExtras } };
    }),
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

      const msgsByConv = groupBy(
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
  setConversationReplyDraft: (convId: string, draft?: ReplyDraft) => {
    set((state) => {
      const replyDrafts = new Map(state.chat.replyDrafts);

      if (draft) {
        replyDrafts.set(convId, draft);
      } else {
        replyDrafts.delete(convId);
      }

      return { chat: { ...state.chat, replyDrafts } };
    });
  },
  dismissReply: (convId: string, messageId: string) => {
    set((state) => {
      const dismissedReplies = new Map(state.chat.dismissedReplies);
      dismissedReplies.set(convId, messageId);
      return { chat: { ...state.chat, dismissedReplies } };
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
