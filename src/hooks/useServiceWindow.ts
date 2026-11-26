import { useContext } from "react";
import dayjs from "dayjs";
import useBoundStore from "@/stores/useBoundStore";
import { TickContext } from "@/contexts/useTick";
import { isIncoming, isTeamChat } from "@/supabase/client";

/**
 * How a conversation can be written to now. WhatsApp (Cloud API) and
 * Instagram give a window of 24 hours from the contact's last message, TikTok
 * one of 48; `local` (internal testing) and `whatsapp-web` (unofficial bridge)
 * none. Only what the contact writes in private opens it; on Instagram, a
 * comment opens it for one DM, within 7 days of it, which Instagram addresses
 * by the comment. With the window closed, the contact's latest comment's is
 * `privately`, until it is sent.
 */
export function useServiceWindow(convId: string | null | undefined) {
  const id = convId || "";

  const tick = useContext(TickContext); // one-minute ticks

  const service = useBoundStore(
    (store) => store.chat.conversations.get(id)?.service,
  );
  const lastWord = useBoundStore((store) => {
    const teamChat = isTeamChat(store.chat.conversations.get(id));

    for (const msg of store.chat.messages.get(id)?.values() || []) {
      if (
        isIncoming(msg, store.chat.ownAgentId, teamChat) &&
        msg.content.kind !== "comment"
      ) {
        return msg.timestamp;
      }
    }
  });
  const comment = useBoundStore((store) => {
    if (service !== "instagram") return;

    const teamChat = isTeamChat(store.chat.conversations.get(id));

    for (const msg of store.chat.messages.get(id)?.values() || []) {
      if (
        isIncoming(msg, store.chat.ownAgentId, teamChat) &&
        msg.content.kind === "comment"
      ) {
        return msg;
      }
    }
  });
  // The DM that went out through it; a failed one did not.
  const spent = useBoundStore((store) => {
    if (!comment?.external_id) return false;

    for (const msg of store.chat.messages.get(id)?.values() || []) {
      if (
        msg.sender_address === null &&
        msg.content.type === "text" &&
        msg.content.re_message_id === comment.external_id &&
        !(msg.status as { failed?: string } | null)?.failed
      ) {
        return true;
      }
    }

    return false;
  });

  const hours =
    service === "whatsapp" || service === "instagram"
      ? 24
      : service === "tiktok"
        ? 48
        : undefined;
  const end = dayjs(lastWord || 0).add(hours ?? 0, "hour");
  const open = hours === undefined || tick.isBefore(end);

  const privateEnd = dayjs(comment?.timestamp || 0).add(7, "day");
  const privately =
    !open && comment?.external_id && !spent && tick.isBefore(privateEnd)
      ? { comment, end: privateEnd }
      : undefined;

  return { hours, end, open, privately };
}
