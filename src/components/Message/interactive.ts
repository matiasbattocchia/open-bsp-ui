import type { OutgoingInteractiveData } from "@/supabase/types/message_types";
import type { InteractiveMessage } from "@/supabase/types/whatsapp_webhook_message_types";

type InteractiveData =
  | InteractiveMessage["interactive"]
  | OutgoingInteractiveData;

/**
 * An interactive part as markdown, so the text bubble renders it instead of the
 * JSON fallback printing its shape at whoever is reading the conversation.
 *
 * Inbound is a reply: WhatsApp shows the option the user tapped as an ordinary
 * message, so the title alone is the faithful rendering.
 *
 * Outbound is the menu that was sent. Header, body and footer are already text;
 * the buttons follow, marked so they do not read as more body copy.
 */
export function interactiveToMarkdown(data: InteractiveData): string {
  if (data.type === "button_reply") {
    return data.button_reply.title;
  }

  if (data.type === "list_reply") {
    const { title, description } = data.list_reply;

    return description ? `${title}\n${description}` : title;
  }

  return [
    data.header && `*${data.header.text}*`,
    data.body.text,
    data.footer && `_${data.footer.text}_`,
    data.action.buttons.map((b) => `▸ ${b.reply.title}`).join("\n"),
  ]
    .filter(Boolean)
    .join("\n\n");
}
