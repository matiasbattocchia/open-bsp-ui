import { type ReactNode, useContext } from "react";
import Avatar from "./Avatar";
import { getHighestStatus, getStatusIcon } from "@/utils/MessageStatusUtils";
import useBoundStore from "@/stores/useBoundStore";
import {
  contactName,
  type Draft,
  type InstagramContactAddressExtra,
  type MessageRow,
  type OutgoingStatus,
  isInternal,
  isIncoming,
  isMultiParty,
  peerAddress,
  isOutgoing,
  isTeamChat,
} from "@/supabase/client";
import ServiceIcon from "./ServiceIcon";
import ItemActions from "./ItemActions";
import dayjs from "dayjs";
import "dayjs/locale/es";
import "dayjs/locale/pt";
import localizedFormat from "dayjs/plugin/localizedFormat";
dayjs.extend(localizedFormat);
import { TickContext } from "@/contexts/useTick";
import { useTranslation } from "@/hooks/useTranslation";
import { AtSign } from "lucide-react";
import { mediaCategory } from "./Message/media";

import { useCurrentAgent, useCurrentAgents } from "@/queries/useAgents";
import { useContactAddress } from "@/queries/useContactsAddresses";
import { formatPhoneNumber, nameInitials } from "@/utils/FormatUtils";
import { useNavigate } from "@tanstack/react-router";

function mediaPreview(t: (content: string) => ReactNode, message?: MessageRow) {
  let mediaIcon = null;
  let mediaIconClass = "mr-[3px]";
  let mediaPreviewContent: ReactNode = "";

  if (!message || isInternal(message)) {
    return { mediaIcon, mediaPreviewContent };
  }

  // Media that could not be ingested arrives as an empty data placeholder.
  // Show a media icon and a friendly label instead of an empty "{}".
  if (
    message.content.type === "data" &&
    message.content.kind === "media_placeholder"
  ) {
    mediaIcon = (
      <div>
        <svg className={`${mediaIconClass} h-[20px] w-[16px]`}>
          <use href="/icons.svg#chat-image" />
        </svg>
      </div>
    );
    mediaPreviewContent = t("Contenido multimedia no disponible");
    return { mediaIcon, mediaPreviewContent };
  }

  if (message.content.type !== "file") {
    return { mediaIcon, mediaPreviewContent };
  }

  const type = message.content.kind;
  const status = getHighestStatus(message.status);

  const mime = message.content.file?.mime_type || "";

  // Known kinds keep their own icon (incl. the distinct sticker icon); the
  // Instagram "native" kinds and the generic file/media kinds resolve via the
  // shared kind/MIME mapping (e.g. a shared reel gets the video icon).
  const knownKinds = ["audio", "document", "image", "sticker", "video"];
  const iconKind = knownKinds.includes(type) ? type : mediaCategory(type, mime);

  // Instagram "native" share kinds get friendlier last-message labels.
  const igLabels: Record<string, ReactNode> = {
    ig_post: t("Publicación"),
    ig_reel: t("Reel"),
    reel: t("Reel"),
    story: t("Historia"),
    ig_story: t("Historia"),
    story_mention: t("Mención de historia"),
    story_reply: t("Respuesta a historia"),
  };

  switch (iconKind) {
    case "audio":
      mediaIconClass += " h-[20px] w-[12px]";

      if (status === "read") {
        mediaIconClass += " text-primary";
      }

      // TODO: Should be the audio length - cabra 24/05/2024
      mediaPreviewContent = t("Audio");
      break;
    case "document":
      mediaIconClass += " h-[20px] w-[13px]";
      mediaPreviewContent = message.content.file?.name || t("Documento");
      break;
    case "image":
      mediaIconClass += " h-[20px] w-[16px]";
      mediaPreviewContent = t("Foto");
      break;
    case "sticker":
      mediaIconClass += " h-[16px] w-[16px] mt-[4px]";
      mediaPreviewContent = t("Pegatina");
      break;
    case "video":
      mediaIconClass += " h-[20px] w-[16px]";
      mediaPreviewContent = message.content.file?.name || t("Video");
      break;
  }

  // Override the label for Instagram shares (icon stays image/video).
  if (igLabels[type]) {
    mediaPreviewContent = igLabels[type];
  }

  mediaIcon = (
    <div>
      <svg className={mediaIconClass}>
        <use href={`/icons.svg#chat-${iconKind}`} />
      </svg>
    </div>
  );

  return { mediaIcon, mediaPreviewContent };
}

function statusIcon(status: OutgoingStatus) {
  const { icon, color } = getStatusIcon(getHighestStatus(status));

  return (
    <div>
      <svg
        className={
          `h-[18px] mr-[2px] ${color}` +
          (icon === "clock" ? " w-[14px]" : " w-[18px]")
        }
      >
        <use href={`/icons.svg#chat-${icon}`} />
      </svg>
    </div>
  );
}

function severityClass(hours: number) {
  if (hours < 6) {
    return { text: "text-green-500", bg: "bg-green-500" }; // First six hours (green)
  } else if (hours < 12) {
    return { text: "text-yellow-500", bg: "bg-yellow-500" }; // Second six hours (yellow)
  } else if (hours < 24) {
    return { text: "text-red-500", bg: "bg-red-500" }; // Remaining twelve hours (red)
  } else {
    return { text: "text-muted-foreground", bg: "bg-muted-foreground" }; // Overdue (gray)
  }
}

export default function ChatListItem({ itemId }: { itemId: string }) {
  const navigate = useNavigate();
  const activeConvId = useBoundStore((state) => state.ui.activeConvId);

  const active = itemId === activeConvId;

  const conversation = useBoundStore((state) =>
    state.chat.conversations.get(itemId),
  );

  const ownAgentId = useBoundStore((state) => state.chat.ownAgentId);
  const teamChat = isTeamChat(conversation);
  const multiParty = !!conversation && isMultiParty(conversation);
  const peer = peerAddress(conversation);

  const { data: contactAddress } = useContactAddress(
    conversation?.organization_address,
    conversation?.service,
    peer,
  );

  const { data: agent } = useCurrentAgent();
  const { data: agents } = useCurrentAgents();
  const isAdmin = ["admin", "owner"].includes(agent?.role || "");

  const messages: MessageRow[] | undefined = Array.from(
    useBoundStore((state) => state.chat.messages.get(itemId || ""))?.values() ||
      [],
  );

  // If the role is not admin, then do not show internal messages.
  const mostRecent = messages?.find((m) => isAdmin || !isInternal(m));

  // Attribution, by the same rule the chat bubbles use: a preview says who
  // spoke only where more than one party could have. In contact space that is
  // a name (here, as in WhatsApp Web); a member gets theirs below.
  const previewSenderAddress =
    multiParty &&
    mostRecent &&
    isIncoming(mostRecent, ownAgentId, teamChat) &&
    mostRecent.sender_address
      ? mostRecent.sender_address
      : undefined;
  const { data: previewSender } = useContactAddress(
    conversation?.organization_address,
    conversation?.service,
    previewSenderAddress,
  );

  const membershipExtra = useBoundStore((state) =>
    state.chat.membershipExtras.get(itemId),
  );
  const draft: Draft | null | undefined = membershipExtra?.draft;

  const preview =
    +new Date(mostRecent?.timestamp || 0) >= +new Date(draft?.timestamp || 0)
      ? mostRecent
      : ({
          // A draft is authored by nobody yet; sender_address set keeps it
          // rendering as incoming, which correctly shows no status icons.
          sender_address: "draft",
          content: {
            version: "1",
            type: "text",
            kind: "text",
            text: draft!.text,
          },
          timestamp: draft!.timestamp,
          status: {},
        } as unknown as MessageRow);

  // The member half of the same rule: whoever answered on our side, unless it
  // was me — and on the incoming side only where the room has more than one
  // party to attribute between. A 1:1 with an AI needs no label; its every
  // message is the agent's.
  const previewAgentId =
    preview?.agent_id &&
    preview.agent_id !== ownAgentId &&
    (multiParty || !isIncoming(preview, ownAgentId, teamChat))
      ? preview.agent_id
      : undefined;

  const unread = (() => {
    let count = 0;
    let notification = false;
    let countBreak = false;

    if (!messages) {
      return { count, notification };
    }

    // Messages are sorted by most recent first.
    for (const msg of messages) {
      if (isIncoming(msg, ownAgentId, teamChat) && !countBreak) {
        count += 1;
      } else if (
        isInternal(msg) &&
        // @ts-expect-error notification is deprecated (TODO: remove)
        msg.content.kind === "notification"
      ) {
        notification = true;
      } else if (
        isOutgoing(msg, ownAgentId, teamChat) &&
        agents
          ?.filter((a) => a.user_id !== null)
          .map((a) => a.id)
          .includes(msg.agent_id || "")
      ) {
        // Only humans can mark notifications as responded.
        break;
      } else if (isOutgoing(msg, ownAgentId, teamChat)) {
        // Any agent can mark incoming messages as responded.
        countBreak = true;
      }
    }

    return { count, notification };
  })();

  const tick = useContext(TickContext); // one-minute ticks

  const isPinned = membershipExtra?.pinned;

  const igExtra =
    conversation?.service === "instagram"
      ? (contactAddress?.extra as InstagramContactAddressExtra | null)
      : null;

  // Nearest name first: the address-book entry (saved name over push name,
  // see contactName), then the conversation. The conversation's name is last
  // because it is the connector's — a profile name at the time the row was
  // minted — while the entry's is ours, and renaming one should be visible.
  // On a group or a channel there is no entry, so the subject wins by falling
  // through; no special case needed.
  const name =
    contactName(contactAddress?.extra) ||
    (igExtra?.username ? `@${igExtra.username}` : undefined) ||
    conversation?.name;

  // Nameless: show the address. Only a peer's address is a phone number worth
  // formatting — a group or channel addresses a container, not a person.
  const displayName =
    name ||
    (peer &&
    (conversation?.service === "whatsapp" ||
      conversation?.service === "whatsapp-web")
      ? formatPhoneNumber(peer)
      : conversation?.address) ||
    "?";

  const { translate: t, currentLanguage } = useTranslation();

  function formatTime(timestamp: string): string {
    const dayjsTs = dayjs(timestamp).locale(currentLanguage);

    const days = dayjs().diff(dayjsTs, "day", true);

    if (days < 1) return dayjsTs.format("HH:mm");

    if (days < 2) return t("ayer");

    if (days < 7) return dayjsTs.format("dddd"); // Jueves

    return dayjsTs.format("l"); // 7/5/2024
  }

  const { mediaIcon, mediaPreviewContent } = mediaPreview(t, preview);

  // Note: severity depends on the most recent incoming message timestamp.
  // `mostRecent` does not distinguish between incoming/outgoing. Nonetheless
  // `severity` is used when `unread` is greater than zero. This only happens
  // when the most recent messages are of the incoming type.
  const severity = severityClass(
    tick.diff(mostRecent?.timestamp, "hours", true),
  );

  return (
    conversation && (
      <ItemActions trigger={["contextMenu"]} itemId={itemId}>
        <div
          className={
            "chat-list-item h-[72px] flex cursor-pointer rounded-xl group" +
            (active ? " bg-accent" : " hover:bg-accent")
          }
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            // setActiveConv(itemId);
            void navigate({ to: "/conversations", hash: itemId });
          }}
        >
          <div className="profile-picture pl-[10px] pr-[15px] flex items-center">
            <div className="relative">
              <Avatar
                src={igExtra?.profile_picture_url}
                fallback={nameInitials(name || "?")}
                size={49}
                className="bg-accent text-accent-foreground border border-border text-[16px]"
              />
              {conversation.service !== "local" && (
                <div className="absolute -bottom-[1px] -right-[1px] rounded-full bg-background p-[1px] leading-none">
                  <ServiceIcon service={conversation.service} size={14} />
                </div>
              )}
            </div>
          </div>
          <div className="info flex flex-col justify-center grow min-w-0 pr-[15px]">
            {/* Upper row */}
            <div className="flex justify-between items-baseline">
              <div className="truncate text-foreground text-[16px]">
                {displayName}
              </div>
              <div
                className={
                  "text-[12px] ml-[6px] capitalize" +
                  (unread.count
                    ? ` ${severity.text} font-bold`
                    : " text-muted-foreground")
                }
              >
                {preview && formatTime(preview.timestamp)}
              </div>
            </div>
            {/* Lower row */}
            <div className="flex justify-between mt-[2px] items-start">
              <div className="min-w-0 flex items-start text-muted-foreground">
                {preview &&
                  isOutgoing(preview, ownAgentId, teamChat) &&
                  statusIcon(preview.status)}
                {previewAgentId && (
                  <div className="text-primary text-[14px] mr-1 shrink-0">
                    {agents?.find((a) => a.id === previewAgentId)?.name || "?"}:
                  </div>
                )}
                {/* Group sender prefix, as in WhatsApp Web */}
                {previewSenderAddress && preview === mostRecent && (
                  <div className="text-[14px] mr-1 shrink-0 max-w-[45%] truncate">
                    {contactName(previewSender?.extra) ||
                      formatPhoneNumber(previewSenderAddress)}
                    :
                  </div>
                )}
                {mediaIcon}
                {draft && (
                  <div className="text-[14px] text-primary mr-1">
                    {t("Borrador:")}
                  </div>
                )}
                {preview?.content.type === "data" &&
                  preview?.content.kind === "template" && (
                    <div className="text-[14px] text-primary mr-1">
                      {t("Plantilla:")}
                    </div>
                  )}
                <div className="truncate text-[14px]">
                  {preview?.content.type === "text" && preview.content.text}
                  {preview?.content.type === "data" &&
                    preview.content.kind === "poll" &&
                    `📊 ${preview.content.data.question}`}
                  {preview?.content.type === "data" &&
                    preview.content.kind !== "media_placeholder" &&
                    preview.content.kind !== "poll" &&
                    JSON.stringify(preview.content.data)}
                  {(preview?.content.type === "file" ||
                    (preview?.content.type === "data" &&
                      preview.content.kind === "media_placeholder")) &&
                    mediaPreviewContent}
                </div>
              </div>

              <div className="flex flex-row items-center">
                {/* Pin - For now just conversations can be fixed */}
                {isPinned && (
                  <svg className="h-[18px] w-[12px] ml-[6px] text-muted-foreground">
                    <use href="/icons.svg#pin" />
                  </svg>
                )}
                {/* Mention */}
                {unread.notification && (
                  <AtSign
                    className={`h-[15px] w-[15px] ml-[6px] ${severity.text}`}
                  />
                )}
                {/* Pending messages badge */}
                {unread.count > 0 && (
                  <div className="ml-[6px]">
                    <span
                      className={`font-bold text-[12px] text-white rounded-full py-[2px] px-[6px] ${severity.bg}`}
                    >
                      {unread.count}
                    </span>
                  </div>
                )}
                {/* Dropdown menu */}
                <ItemActions trigger={["click"]} itemId={itemId}>
                  <svg
                    className="h-[20px] w-[19px] ml-[6px] text-muted-foreground hidden group-hover:block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <use href="/icons.svg#down" />
                  </svg>
                </ItemActions>
              </div>
            </div>
          </div>
        </div>
      </ItemActions>
    )
  );
}
