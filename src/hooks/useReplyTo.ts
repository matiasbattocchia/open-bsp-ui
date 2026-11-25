import useBoundStore from "@/stores/useBoundStore";
import { type ReplyDraft } from "@/stores/chatSlice";
import { isIncoming, isInternal, isTeamChat } from "@/supabase/client";
import { replyRef } from "@/utils/ReplyUtils";
import { useServiceWindow } from "./useServiceWindow";

/**
 * The message a conversation's next message answers: the one chosen with
 * Reply. With none chosen, the window closed and a comment the last word
 * (the contact's, or our answer to it), the contact's latest comment: an
 * answer under it is then all that can go out, so it is proposed until the
 * member closes it.
 */
export function useReplyTo(convId: string | null | undefined) {
  const id = convId || "";

  const { open, privately } = useServiceWindow(convId);

  const chosen = useBoundStore((store) => store.chat.replyDrafts.get(id));
  const dismissed = useBoundStore((store) =>
    store.chat.dismissedReplies.get(id),
  );
  const proposed = useBoundStore((store) => {
    if (open || privately) return;

    const teamChat = isTeamChat(store.chat.conversations.get(id));
    let lastWord = true;

    for (const msg of store.chat.messages.get(id)?.values() || []) {
      // Notes and reactions are no word in the conversation.
      if (isInternal(msg) || msg.content.kind === "reaction") continue;

      if (lastWord && msg.content.kind !== "comment") return;
      lastWord = false;

      if (
        isIncoming(msg, store.chat.ownAgentId, teamChat) &&
        msg.content.kind === "comment" &&
        replyRef(msg)
      ) {
        return msg;
      }
    }
  });

  const setReplyDraft = useBoundStore(
    (store) => store.chat.setConversationReplyDraft,
  );
  const dismissReply = useBoundStore((store) => store.chat.dismissReply);

  const replyTo: ReplyDraft | undefined =
    chosen ??
    (proposed && proposed.id !== dismissed ? { message: proposed } : undefined);

  return {
    replyTo,
    // Sent: the choice is spent.
    clear: () => setReplyDraft(id, undefined),
    // Closed: neither the choice nor the proposal stays.
    close: () => {
      setReplyDraft(id, undefined);
      if (proposed) dismissReply(id, proposed.id);
    },
  };
}
