import { type ReactNode, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import {
  type MessageRow,
  contactName,
  isMultiParty,
  isTeamChat,
  messageDirection,
} from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentAgents } from "@/queries/useAgents";
import { useContactAddress } from "@/queries/useContactsAddresses";
import { useCurrentOrganization } from "@/queries/useOrganizations";
import { formatPhoneNumber } from "@/utils/FormatUtils";
import { scrollToMessage } from "@/utils/ReplyUtils";
import { mediaPreview } from "../ChatListItem";
import { mediaCategory, shareLabel, unsupportedLabel } from "./media";

type Translate = (text: string) => string;

/** What a quote shows of a message: its words, or what it is. */
function summary(
  message: MessageRow,
  t: Translate,
): { icon?: ReactNode; text: ReactNode } {
  const { content } = message;

  if (
    content.type === "file" ||
    (content.type === "data" && content.kind === "media_placeholder")
  ) {
    const { mediaIcon, mediaPreviewContent } = mediaPreview(t, message);
    return { icon: mediaIcon, text: content.text || mediaPreviewContent };
  }

  if (content.type === "text") return { text: content.text };

  if (content.kind === "comment") return { text: `💬 ${content.text ?? ""}` };
  if (content.kind === "share") {
    return { text: `🔗 ${shareLabel(content.data.type, t)}` };
  }
  if (content.kind === "poll") return { text: `📊 ${content.data.question}` };
  if (content.kind === "unsupported") {
    return { text: unsupportedLabel(content, t) };
  }

  return {
    text:
      "text" in content && typeof content.text === "string" ? content.text : "",
  };
}

/**
 * A message as a reply shows it: who said it and a line of it, in the bubble
 * that answers it and in the composer while answering. Clicking it goes to
 * the message.
 */
export default function Quote({
  message,
  onClose,
}: {
  message: MessageRow;
  onClose?: () => void;
}) {
  const { translate: t } = useTranslation();

  const ownAgentId = useBoundStore((state) => state.chat.ownAgentId);
  const conversation = useBoundStore((state) =>
    state.chat.conversations.get(message.conversation_id),
  );
  const incoming =
    messageDirection(message, ownAgentId, isTeamChat(conversation)) ===
    "incoming";

  const { data: agents } = useCurrentAgents();
  const { data: org } = useCurrentOrganization();
  const { data: contact } = useContactAddress(
    message.organization_address,
    message.service,
    message.agent_id ? undefined : message.sender_address,
  );

  // Members by name, me as such; a contact by the name the address book
  // gives, else the conversation's when it is with them alone.
  const author =
    ownAgentId && message.agent_id === ownAgentId
      ? t("Tú")
      : message.agent_id
        ? agents?.find((agent) => agent.id === message.agent_id)?.name || "?"
        : message.sender_address
          ? contactName(contact?.extra) ||
            (conversation && !isMultiParty(conversation)
              ? conversation.name
              : undefined) ||
            formatPhoneNumber(message.sender_address)
          : org?.name || "?";

  const { icon, text } = summary(message, t);

  // An image shows itself once the chat has it.
  const blob = useBoundStore(
    (state) => state.chat.mediaLoads.get(message.id)?.blob,
  );
  const image =
    message.content.type === "file" &&
    mediaCategory(
      message.content.kind,
      message.content.file.mime_type || "",
    ) === "image";
  const thumbnail = useMemo(
    () => (image && blob ? URL.createObjectURL(blob) : undefined),
    [image, blob],
  );
  useEffect(
    () => () => {
      if (thumbnail) URL.revokeObjectURL(thumbnail);
    },
    [thumbnail],
  );

  return (
    <div
      className="flex min-w-0 overflow-hidden rounded-[7.5px] bg-black/5 dark:bg-white/10 cursor-pointer"
      onClick={() => scrollToMessage(message.id)}
    >
      <div
        className={
          "w-[4px] shrink-0 " + (incoming ? "bg-sky-500" : "bg-primary")
        }
      />
      <div className="grow min-w-0 px-[8px] py-[5px]">
        <div
          className={
            "text-[12.8px] font-medium truncate " +
            (incoming ? "text-sky-600 dark:text-sky-400" : "text-primary")
          }
        >
          {author}
        </div>
        <div className="flex text-[13px] leading-[18px] text-muted-foreground">
          {icon}
          <span
            className={
              "break-words min-w-0 " +
              (onClose ? "line-clamp-2" : "line-clamp-3")
            }
          >
            {text}
          </span>
        </div>
      </div>
      {thumbnail && (
        <img
          src={thumbnail}
          alt=""
          className="w-[60px] object-cover shrink-0"
        />
      )}
      {onClose && (
        <button
          type="button"
          className="self-start p-[8px] text-muted-foreground hover:text-foreground cursor-pointer"
          title={t("Cancelar respuesta")}
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
        >
          <X className="w-[20px] h-[20px]" />
        </button>
      )}
    </div>
  );
}
