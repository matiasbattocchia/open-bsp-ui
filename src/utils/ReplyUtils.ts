import { type MessageRow, isInternal } from "@/supabase/client";

/**
 * How a reply names a message (its re_message_id): by the service's id for
 * it, a local row, which has none, by its own. Undefined where the message
 * can't be answered: a note, a reaction or a vote, one the service has not
 * taken yet, and on Instagram anything but a comment (its quoted DMs are
 * documented only for accounts linked to a Facebook Page).
 */
export function replyRef(message: MessageRow): string | undefined {
  const { content } = message;

  if (isInternal(message)) return;
  if (content.kind === "reaction" || content.kind === "poll_vote") return;
  if (message.service === "instagram" && content.kind !== "comment") return;

  return (
    message.external_id ??
    (message.service === "local" ? message.id : undefined)
  );
}

/**
 * The message a message answers, as its re_message_id names it. None for a
 * reaction, a vote or a forward: their re_message_id names what they react
 * to, vote on or pass along.
 */
export function quotedRef(message: MessageRow): string | undefined {
  const { content } = message;

  if ("forwarded" in content && content.forwarded) return;
  if (content.kind === "reaction" || content.kind === "poll_vote") return;

  return content.re_message_id;
}

/** Scrolls the chat to a message, and flashes it. */
export function scrollToMessage(id: string) {
  const row = document.getElementById(`message-${id}`);

  if (!row) return;

  row.scrollIntoView({ behavior: "smooth", block: "center" });
  row.animate(
    [
      { backgroundColor: "rgb(0 0 0 / 0.08)" },
      { backgroundColor: "transparent" },
    ],
    { duration: 1600, easing: "ease-out" },
  );
}
