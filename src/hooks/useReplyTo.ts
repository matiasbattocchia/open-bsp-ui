import useBoundStore from "@/stores/useBoundStore";
import { type ReplyDraft } from "@/stores/chatSlice";
import { isIncoming, isInternal, isTeamChat } from "@/supabase/client";
import { replyRef } from "@/utils/ReplyUtils";

/**
 * The message a conversation's next message answers: the one chosen with
 * Reply. On TikTok, with none chosen, the contact's comment when it is the
 * last word: TikTok answers a commenter only in public, under the comment, so
 * that is proposed until someone answers or the member closes it.
 */
export function useReplyTo(convId: string | null | undefined) {
  const id = convId || "";

  const chosen = useBoundStore((store) => store.chat.replyDrafts.get(id));
  const dismissed = useBoundStore((store) =>
    store.chat.dismissedReplies.get(id),
  );
  const proposed = useBoundStore((store) => {
    const conv = store.chat.conversations.get(id);

    if (conv?.service !== "tiktok") return;

    for (const msg of store.chat.messages.get(id)?.values() || []) {
      if (isInternal(msg)) continue;

      return isIncoming(msg, store.chat.ownAgentId, isTeamChat(conv)) &&
        msg.content.kind === "comment" &&
        replyRef(msg)
        ? msg
        : undefined;
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
    setInPublic: (inPublic: boolean) =>
      replyTo && setReplyDraft(id, { ...replyTo, inPublic }),
    // Sent: what it answered is answered.
    clear: () => setReplyDraft(id, undefined),
    // Closed: neither the choice nor the proposal stays.
    close: () => {
      setReplyDraft(id, undefined);
      if (proposed) dismissReply(id, proposed.id);
    },
  };
}
