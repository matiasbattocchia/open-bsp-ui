import { type ReactNode, useContext } from "react";
import Avatar from "./Avatar";
import { getHighestStatus, getStatusIcon } from "@/utils/MessageStatusUtils";
import useBoundStore from "@/stores/useBoundStore";
import {
  type Draft,
  type MessageRow,
  type OutgoingStatus,
} from "@/supabase/client";
import ItemActions from "./ItemActions";
import dayjs from "dayjs";
import "dayjs/locale/es";
import "dayjs/locale/pt";
import localizedFormat from "dayjs/plugin/localizedFormat";
dayjs.extend(localizedFormat);
import { TickContext } from "@/contexts/useTick";
import { Translate as T, useTranslation } from "@/hooks/useTranslation";
import { AtSign, Pause, VolumeOff } from "lucide-react";
import { SpecialMessageTypeMap } from "./Message/Message";
import { useAgents, useCurrentAgent } from "@/queries/useAgents";
import { nameInitials } from "@/utils/FormatUtils";
import { useNavigate } from "@tanstack/react-router";

function mediaPreview(t: (content: string) => ReactNode, message?: MessageRow) {
  let mediaIcon = null;
  let mediaIconClass = "mr-[3px]";
  let mediaPreviewContent = "";

  if (
    !message ||
    !(message.direction === "incoming" || message.direction === "outgoing") ||
    message.content.type !== "file"
  ) {
    return { mediaIcon, mediaPreviewContent };
  }

  const type = message.content.kind;
  const status = getHighestStatus(message.status);

  if (["audio", "document", "image", "sticker", "video"].includes(type)) {
    switch (type) {
      case "audio":
        mediaIconClass += " h-[20px] w-[12px]";

        if (status === "read") {
          mediaIconClass += " text-primary";
        }

        // TODO: Should be the audio length - cabra 24/05/2024
        mediaPreviewContent = t("Audio") as string;
        break;
      case "document":
        mediaIconClass += " h-[20px] w-[13px]";
        mediaPreviewContent =
          message.content.file?.name || (t("Documento") as string);
        break;
      case "image":
        mediaIconClass += " h-[20px] w-[16px]";
        mediaPreviewContent = t("Foto") as string;
        break;
      case "sticker":
        mediaIconClass += " h-[16px] w-[16px] mt-[4px]";
        mediaPreviewContent = t("Pegatina") as string;
        break;
      case "video":
        mediaIconClass += " h-[20px] w-[16px]";
        mediaPreviewContent =
          message.content.file?.name || (t("Video") as string);
        break;
      // @ts-expect-error gif is not declared yet
      case "gif":
        mediaIconClass += " h-[20px] w-[20px]";
        mediaPreviewContent = "GIF";
        break;
    }

    mediaIcon = (
      <div>
        <svg className={mediaIconClass}>
          <use href={`/icons.svg#chat-${type}`} />
        </svg>
      </div>
    );
  }

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

export default function ChatListItem({
  itemId,
}: {
  itemId: string;
}) {
  const navigate = useNavigate();
  const activeConvId = useBoundStore((state) => state.ui.activeConvId);

  const active = itemId === activeConvId;

  const conversation = useBoundStore((state) =>
    state.chat.conversations.get(itemId),
  );

  const { data: agent } = useCurrentAgent();
  const { data: agents } = useAgents();
  const isAdmin = agent?.extra?.roles?.includes("admin");

  const messages: MessageRow[] | undefined = Array.from(
    useBoundStore((state) => state.chat.messages.get(itemId || ""))?.values() ||
    [],
  );

  // If the role is not admin, then do not show internal messages.
  const mostRecent = messages?.find(
    (m) => isAdmin || m.direction !== "internal",
  );

  const draft: Draft | undefined = conversation?.extra?.draft;

  const preview =
    +new Date(mostRecent?.timestamp || 0) >= +new Date(draft?.timestamp || 0)
      ? mostRecent
      : ({
        direction: "incoming", // direction is not important, except that incoming does not display status icons, which is correct for drafts
        content: {
          version: "1",
          type: "text",
          kind: "text",
          text: draft!.text,
        },
        timestamp: draft!.timestamp,
        status: {},
      } as MessageRow);

  const unread = (() => {
    let count = 0;
    let notification = false;
    let countBreak = false;

    if (!messages) {
      return { count, notification };
    }

    // Messages are sorted by most recent first.
    for (const msg of messages) {
      if (msg.direction === "incoming" && !countBreak) {
        count += 1;
      } else if (
        msg.direction === "internal" &&
        // @ts-expect-error notification is deprecated (TODO: remove)
        msg.content.kind === "notification"
      ) {
        notification = true;
      } else if (
        msg.direction === "outgoing" &&
        agents
          ?.filter((a) => !a.ai)
          .map((a) => a.id)
          .includes(msg.agent_id || "")
      ) {
        // Only humans can mark notifications as responded.
        break;
      } else if (msg.direction === "outgoing") {
        // Any agent can mark incoming messages as responded.
        countBreak = true;
      }
    }

    return { count, notification };
  })();

  const tick = useContext(TickContext); // one-minute ticks

  const isPinned = conversation?.extra?.pinned;
  const isMuted = conversation?.extra?.notifications === "off";

  const isPaused =
    +new Date(conversation?.extra?.paused || 0) > +new Date() - 12 * 60 * 60 * 1000; // Less than 12 hours ago.

  const name = conversation?.name;

  const { translate: t, currentLanguage } = useTranslation();

  function formatTime(timestamp: string): string {
    const dayjsTs = dayjs(timestamp).locale(currentLanguage);

    const days = dayjs().diff(dayjsTs, "day", true);

    if (days < 1) return dayjsTs.format("HH:mm");

    if (days < 2) return t("ayer") as string;

    if (days < 7) return dayjsTs.format("dddd"); // Jueves

    return dayjsTs.format("l"); // 7/5/2024
  }

  const { mediaIcon, mediaPreviewContent } = mediaPreview(t, preview);

  // Note: severity depends on the most recent incoming message timestamp.
  // `mostRecent` does not distinguish between incoming/outgoing. Nonetheless
  // `severity` is used when `unread` is greater than zero. This only happens
  // when the most recent messages are of the incoming type.
  const severity = severityClass(tick.diff(mostRecent?.timestamp, "hours", true));

  return (
    conversation && (
      <ItemActions trigger={["contextMenu"]} itemId={itemId}>
        <div
          className={
            "chat-list-item h-[72px] flex cursor-pointer mx-[10px] my-[2px] rounded-xl group" +
            (active ? " bg-accent" : " hover:bg-accent")
          }
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            // setActiveConv(itemId);
            navigate({ to: "/conversations", hash: itemId });
          }}
        >
          <div className="profile-picture pl-[10px] pr-[15px] flex items-center">
            <Avatar
              fallback={nameInitials(name || "?")}
              size={49}
              className="bg-accent text-accent-foreground border border-border text-[16px]"
            />
          </div>
          <div className="info flex flex-col justify-center grow min-w-0 pr-[15px]">
            <div className="upper-row flex justify-between items-baseline">
              <div className="truncate text-foreground text-[16px]">{name || "?"}</div>
              <div
                className={
                  "text-[12px] ml-[6px] capitalize" +
                  (unread.count ? ` ${severity.text} font-bold` : " text-muted-foreground")
                }
              >
                {preview && formatTime(preview.timestamp)}
              </div>
            </div>
            <div className="lower-row flex justify-between mt-[2px] items-start">
              <div className="min-w-0 flex items-start text-muted-foreground">
                {preview?.direction === "outgoing" &&
                  statusIcon(preview.status)}
                {preview?.agent_id && preview.agent_id !== agent?.id && (
                  <div className="text-[14px] mr-1 shrink-0">
                    {agents?.find((a) => a.id === preview.agent_id)?.name || "?"}:
                  </div>
                )}
                {mediaIcon}
                {draft && (
                  <T as="div" className="text-[14px] text-primary mr-1">
                    Borrador:
                  </T>
                )}
                {preview?.content.type === "data" &&
                  preview?.content.kind === "template" && (
                    <T as="div" className="text-[14px] text-primary mr-1">
                      Plantilla:
                    </T>
                  )}
                {preview?.direction === "internal" && (
                  <div className="text-[14px] text-muted-foreground">
                    {SpecialMessageTypeMap(preview?.content.kind || "")}
                  </div>
                )}
                {preview?.direction !== "internal" && (
                  <div className="truncate text-[14px]">
                    {preview?.content.type === "text" || preview?.content.type === "file"
                      ? preview.content.text
                      : mediaPreviewContent}
                  </div>
                )}
              </div>

              <div className="flex flex-row items-center">
                {/* Muted - Notifications is turned off */}
                {isMuted && (
                  <VolumeOff className="h-[19px] w-[19px] ml-[6px] stroke-muted-foreground" />
                )}
                {/* Pause - AI assistant paused */}
                {isPaused && (
                  <Pause className="h-[19px] w-[19px] ml-[6px] fill-muted-foreground stroke-0" />
                )}
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
                      className={`font-bold text-[12px] text-white rounded-full py-[3px] px-[6px] ${severity.bg}`}
                    >
                      {unread.count}
                    </span>
                  </div>
                )}
                {/* Dropdown menu */}
                <ItemActions
                  trigger={["click"]}
                  itemId={itemId}
                >
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

