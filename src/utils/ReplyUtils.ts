import type { MessageRow } from "@/supabase/client";
import { isReactionMessage } from "@/utils/ReactionUtils";
import { mediaCategory } from "@/components/Message/media";
import { getDataMessageDisplay } from "@/utils/dataMessageDisplay";

export function isReplyMessage(message: MessageRow): boolean {
  return (
    !!message.content.re_message_id &&
    !isReactionMessage(message) &&
    !message.content.forwarded
  );
}

export function replyTargetId(message: MessageRow): string | undefined {
  if (!isReplyMessage(message)) {
    return undefined;
  }

  return message.content.re_message_id;
}

/** Index messages by WhatsApp/IG `external_id` for reply-target lookup. */
export function buildExternalIdIndex(
  messages: MessageRow[],
): Map<string, MessageRow> {
  const index = new Map<string, MessageRow>();

  for (const message of messages) {
    if (message.external_id) {
      index.set(message.external_id, message);
    }
  }

  return index;
}

/**
 * Short label for a quoted message body (text caption or media type).
 * `t` is the translate helper — Spanish keys are the source of truth.
 */
export function getMessagePreviewText(
  message: MessageRow,
  t: (key: string) => string,
): string {
  const content = message.content;

  if (content.type === "text") {
    return content.text?.trim() || "";
  }

  if (content.type === "data") {
    if (content.kind === "media_placeholder") {
      return content.text?.trim() || t("Contenido multimedia no disponible");
    }

    const display = getDataMessageDisplay(content);
    if (display?.body.trim()) {
      return display.body.trim();
    }

    if (content.text?.trim()) {
      return content.text.trim();
    }

    if (content.kind === "template") {
      return t("Plantilla");
    }

    if (content.kind === "location") {
      return t("Ubicación");
    }

    if (content.kind === "contacts") {
      return t("Contacto");
    }

    if (content.kind === "share") {
      const shareType = content.data?.type;
      if (shareType === "ig_reel" || shareType === "reel") {
        return t("Reel");
      }
      return t("Publicación");
    }

    return t("Mensaje");
  }

  if (content.type === "file") {
    if (content.text?.trim()) {
      return content.text.trim();
    }

    const category = mediaCategory(content.kind, content.file?.mime_type || "");

    switch (category) {
      case "audio":
        return t("Audio");
      case "video":
        return content.file?.name || t("Video");
      case "image":
        return content.kind === "sticker" ? t("Pegatina") : t("Foto");
      default:
        return content.file?.name || t("Documento");
    }
  }

  return t("Mensaje");
}

export function canReplyToMessage(
  message: MessageRow,
  canCompose: boolean,
): boolean {
  return (
    canCompose &&
    !!message.external_id &&
    (message.direction === "incoming" || message.direction === "outgoing")
  );
}
