import { ReactNode, useContext, useState } from "react";
import Avatar from "../Avatar";
import { getHighestStatus, getStatusIcon } from "@/utils/MessageStatusUtils";
import useBoundStore from "@/store/useBoundStore";
import { ChatListType } from "../ChatList";
import {
  BaseMessage,
  ConversationRow,
  Draft,
  MessageRow,
  OrganizationRow,
  OutgoingStatus,
  supabase,
  TemplateMessage,
} from "@/supabase/client";
import ItemActions from "./ItemActions";
import dayjs from "dayjs";
import "dayjs/locale/es";
import "dayjs/locale/pt";
import localizedFormat from "dayjs/plugin/localizedFormat";
dayjs.extend(localizedFormat);
import { TickContext } from "@/context/useTick";
import { Translate as T, useTranslation } from "react-dialect";
import { AtSign, Pause, VolumeOff } from "lucide-react";
import { SpecialMessageTypeMap } from "../Message/Message";
import { useQuery } from "@tanstack/react-query";
import { NotificationKind } from "@/hooks/useWebNotifications";
import { useRouter } from "next/navigation";

export function nameInitials(name: string): string {
  const names = name.split(" ");

  if (names.length === 1) {
    return names[0].slice(0, 2);
  }

  if (names.length > 1) {
    return names
      .slice(0, 2)
      .map((name) => name[0])
      .join("");
  }

  return "?";
}

function mediaPreview(t: (content: string) => ReactNode, message?: MessageRow) {
  let mediaIcon = null;
  let mediaIconClass = "mr-[3px] text-gray-dark";
  let mediaPreviewContent = "";

  if (
    !message ||
    !(message.type === "incoming" || message.type === "outgoing") ||
    !message.message.media
  ) {
    return { mediaIcon, mediaPreviewContent };
  }

  const type = message.message.type;
  const status = getHighestStatus(message.status);

  if (["audio", "document", "image", "sticker", "video"].includes(type)) {
    switch (type) {
      case "audio":
        mediaIconClass += " h-[20px] w-[12px]";

        if (status === "read") {
          mediaIconClass += " text-blue-ack";
        }

        // TODO: Should be the audio length - cabra 24/05/2024
        mediaPreviewContent = t("Audio") as string;
        break;
      case "document":
        mediaIconClass += " h-[20px] w-[13px]";
        mediaPreviewContent =
          message.message.media?.filename || (t("Documento") as string);
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
          message.message.media?.filename || (t("Video") as string);
        break;
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
    return { text: "text-gray-dark", bg: "bg-gray-dark" }; // Overdue (gray)
  }
}

export default function ChatListItem({
  itemId,
  type,
}: {
  itemId: string;
  type: ChatListType;
}) {
  const router = useRouter();
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);
  const setActiveOrg = useBoundStore((state) => state.ui.setActiveOrg);

  const activeConvId = useBoundStore((state) => state.ui.activeConvId);
  const setActiveConv = useBoundStore((state) => state.ui.setActiveConv);

  const active = itemId === activeConvId || itemId === activeOrgId;
  const setActive = () => {
    if (type === "organizations") {
      setActiveConv(null);
      setActiveOrg(itemId);
      router.push("/conversations");

      return;
    }
    setActiveConv(itemId);
  };

  const toggle = useBoundStore((state) => state.ui.toggle);

  const item = useBoundStore((state) =>
    state.chat[type].get(itemId),
  ) as ConversationRow;

  const { data: agents } = useQuery({
    queryKey: [activeOrgId, "agents", "chat-list-item"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("id, name, ai")
        .eq("organization_id", activeOrgId!);

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!activeOrgId,
    staleTime: 1000 * 60 * 60 * 6, // 6 hours
  });

  const currentAgentId = useBoundStore(
    (state) => state.ui.roles[state.ui.activeOrgId || ""].agentId,
  );

  const messages: MessageRow[] | undefined = Array.from(
    useBoundStore((state) => state.chat.messages.get(itemId || ""))?.values() ||
      [],
  );

  const role = useBoundStore(
    (state) => state.ui.roles[state.ui.activeOrgId || ""]?.role,
  );

  // If the role is not admin, then do not show function call and response messages.
  const mostRecent = messages?.find(
    (m) =>
      role === "admin" ||
      !["function_call", "function_response"].includes(m.type),
  );

  const draft: Draft | undefined = item?.extra?.draft;

  const preview =
    +new Date(mostRecent?.timestamp || 0) >= +new Date(draft?.timestamp || 0)
      ? mostRecent
      : ({
          message: { content: draft!.text },
          timestamp: draft!.timestamp,
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
      if (msg.type === "incoming" && !countBreak) {
        count += 1;
      } else if (msg.type === "notification") {
        notification = true;
      } else if (
        msg.type === "outgoing" &&
        agents
          ?.filter((a) => !a.ai)
          .map((a) => a.id)
          .includes(msg.agent_id || "")
      ) {
        // Only humans can mark notifications as responded.
        break;
      } else if (msg.type === "outgoing") {
        // Any agent can mark incoming messages as responded.
        countBreak = true;
      }
    }

    return { count, notification };
  })();

  const tick = useContext(TickContext); // one-minute ticks

  const [hovered, setHovered] = useState(false);

  const isPinned = item?.extra?.pinned;
  const isMuted = item?.extra?.notifications === NotificationKind.disabled;

  const isPaused =
    +new Date(item?.extra?.paused || 0) > +new Date() - 12 * 60 * 60 * 1000; // Less than 12 hours ago.

  const name = item?.name;

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
  const severity =
    type === "organizations"
      ? { text: "text-green-500", bg: "bg-green-500" }
      : severityClass(tick.diff(mostRecent?.timestamp, "hours", true));

  return (
    item && (
      <ItemActions trigger={["contextMenu"]} type={type} itemId={itemId}>
        <div
          className={
            "chat-list-item h-[72px] flex cursor-pointer" +
            (active ? " bg-gray" : " hover:bg-gray-hover")
          }
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            type === "organizations" && toggle("organizationsList");
            const active =
              type === "organizations" ? activeOrgId : activeConvId;

            setActive();
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="profile-picture pl-[13px] pr-[15px] flex items-center">
            <Avatar
              fallback={nameInitials(name || "?")}
              size={49}
              className="bg-gray-dark text-xl"
            />
          </div>
          <div className="info flex flex-col justify-center grow min-w-0 pr-[15px] border-b border-gray-line">
            <div className="upper-row flex justify-between items-baseline">
              <div className="truncate text-[17px]">{name || "?"}</div>
              <div
                className={
                  "text-[12px] text-gray-dark ml-[6px] capitalize" +
                  (unread.count ? ` ${severity.text} font-bold` : "")
                }
              >
                {preview && formatTime(preview.timestamp)}
              </div>
            </div>
            <div className="lower-row flex justify-between mt-[2px] items-start">
              <div className="min-w-0 flex items-start text-gray-dark">
                {preview?.type === "outgoing" && statusIcon(preview.status)}
                {preview?.agent_id && preview.agent_id !== currentAgentId && (
                  <div className="text-[14px] mr-1 shrink-0">
                    {agents?.find((a) => a.id === preview.agent_id)?.name ||
                      "Asistente"}
                    :
                  </div>
                )}
                {mediaIcon}
                {(draft || preview?.type === "draft") && (
                  <T as="div" className="text-[14px] text-blue-500 mr-1">
                    Borrador:
                  </T>
                )}
                {(preview?.message as TemplateMessage)?.template && (
                  <T as="div" className="text-[14px] text-blue-500 mr-1">
                    Plantilla:
                  </T>
                )}
                {[
                  "notification",
                  "function_call",
                  "function_response",
                ].includes(preview?.type || "") && (
                  <div className="text-[14px] text-gray-dark">
                    {SpecialMessageTypeMap(preview?.type || "")}
                  </div>
                )}
                {![
                  "notification",
                  "function_call",
                  "function_response",
                ].includes(preview?.type || "") && (
                  <div className="truncate text-[14px]">
                    {(preview?.message as BaseMessage)?.content ||
                      mediaPreviewContent}
                  </div>
                )}
              </div>

              <div className="flex flex-row items-center">
                {/* Muted - Notifications is turned off */}
                {isMuted && (
                  <VolumeOff className="h-[19px] w-[19px] ml-[6px] stroke-gray-dark" />
                )}
                {/* Pause - AI assistant paused */}
                {isPaused && (
                  <Pause className="h-[19px] w-[19px] ml-[6px] fill-gray-dark stroke-0" />
                )}
                {/* Pin - For now just conversations can be fixed */}
                {type === "conversations" && isPinned && (
                  <svg className="h-[18px] w-[12px] ml-[6px] text-gray-dark">
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
                      className={`font-bold text-[12px] text-white rounded-full py-[3px] px-[7px] ${severity.bg}`}
                    >
                      {unread.count}
                    </span>
                  </div>
                )}
                {/* Dropdown menu */}
                <ItemActions
                  trigger={["click"]}
                  type={type}
                  visible={hovered}
                  itemId={itemId}
                >
                  {type === "conversations" && (
                    <svg
                      className="h-[20px] w-[19px] ml-[6px] text-gray-dark"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <use href="/icons.svg#down" />
                    </svg>
                  )}
                </ItemActions>
              </div>
            </div>
          </div>
        </div>
      </ItemActions>
    )
  );
}
