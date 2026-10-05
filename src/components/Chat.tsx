import { useContext, useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import "dayjs/locale/pt";
import localizedFormat from "dayjs/plugin/localizedFormat";
dayjs.extend(localizedFormat);
import useBoundStore from "@/stores/useBoundStore";
import Message from "./Message/Message";
import { type MessageRow } from "@/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentOrganization } from "@/queries/useOrganizations";
import { useCurrentAgent } from "@/queries/useAgents";
import { useChatScroll } from "@/hooks/useChatScroll";
import { AVATAR_COLORS } from "@/utils/colors";
import { isOlderThanCursor } from "@/utils/messageHistory";
import {
  buildReactionIndex,
  getAggregatedReactions,
  getOwnReactionEmoji,
  isReactionMessage,
  supportsReactions,
} from "@/utils/ReactionUtils";
import { buildExternalIdIndex, replyTargetId } from "@/utils/ReplyUtils";
import { TickContext } from "@/contexts/useTick";
import Spinner from "./Spinner";
import { useTemplates } from "@/queries/useTemplates";

type EnvelopeType = { message: MessageRow; first: boolean; last: boolean };
type SeparatorType = { text: string; first: true; last: true };

function Separator({ text }: { text: string }) {
  // TODO: just a placeholder
  const type: string = "date";

  return (
    <div
      className={
        "flex justify-center mb-[12px]" +
        (type === "unread" ? " py-[5px] bg-incoming-chat-bubble/25" : "")
      }
    >
      {/* unreads has rounded-16px px-22px py-0 but I prefer to keep the date style */}
      <div
        className={
          "px-[12px] pt-[4px] pb-[5px] capitalize text-[12px] bg-incoming-chat-bubble rounded-lg text-foreground" +
          (type === "unread" ? "" : " shadow")
        }
      >
        {text}
      </div>
    </div>
  );
}

export default function Chat() {
  const activeConvId = useBoundStore((store) => store.ui.activeConvId);
  const conv = useBoundStore((store) =>
    store.chat.conversations.get(store.ui.activeConvId || ""),
  );
  const messages = Array.from(
    useBoundStore((store) =>
      store.chat.messages.get(store.ui.activeConvId || ""),
    )?.values() || [],
  );

  const { data: org } = useCurrentOrganization();
  const orgName = org?.name || "?";

  const convName = useBoundStore(
    (store) =>
      store.chat.conversations.get(store.ui.activeConvId || "")?.name || "?",
  );

  const { data: agent } = useCurrentAgent();
  const activeAgentId = agent?.id;
  const isAdmin = ["admin", "owner"].includes(agent?.extra?.role || "");

  // Prefetch WhatsApp templates so template bubbles can fill {{1}} / {{2}}
  // from the definition instead of showing raw variables.
  useTemplates(
    conv?.service === "whatsapp" ? conv.organization_address : undefined,
  );

  const tick = useContext(TickContext);

  const mostRecentIncoming = messages.find(
    (msg) => msg.direction === "incoming" && !isReactionMessage(msg),
  );

  const canReply =
    (conv?.service !== "whatsapp" && conv?.service !== "instagram") ||
    tick.isBefore(dayjs(mostRecentIncoming?.timestamp || 0).add(1, "day"));

  const canReact = supportsReactions(conv?.service) && canReply;

  const reactionIndex = useMemo(() => buildReactionIndex(messages), [messages]);
  const messagesByExternalId = useMemo(
    () => buildExternalIdIndex(messages),
    [messages],
  );

  const { scrollerRef, isLoadingOlder, onScroll, historyCursor } =
    useChatScroll(activeConvId, messages.length);

  const { translate: t, currentLanguage } = useTranslation();

  function formatDate(timestamp: string): string {
    const dayjsTs = dayjs(timestamp).locale(currentLanguage);
    const date = dayjsTs.format("l"); // 9/9/2024

    const days = dayjs().diff(dayjsTs.startOf("day"), "day", true);

    if (days < 1) return `${t("hoy")} · ${date}`;

    if (days < 2) return `${t("ayer")} · ${date}`;

    if (days < 7) return `${dayjsTs.format("dddd")} · ${date}`; // Jueves · 9/9/2024

    return date;
  }

  function getUniqueAgentIds(messages: MessageRow[] | undefined): Set<string> {
    if (!messages) return new Set();

    const agentIds = new Set<string>();

    for (const message of messages) {
      if (message.agent_id) {
        agentIds.add(message.agent_id);
      }
    }

    return agentIds;
  }

  function assignAgentColors(agentIds: Set<string>): Map<string, string> {
    const colorMap = new Map<string, string>();
    let colorIndex = 0;

    // Ensure consistent color assignment by sorting agent IDs
    const sortedAgentIds = Array.from(agentIds).sort();

    for (const agentId of sortedAgentIds) {
      colorMap.set(agentId, AVATAR_COLORS[colorIndex % AVATAR_COLORS.length]);
      colorIndex++;
    }

    return colorMap;
  }

  const colorMap = assignAgentColors(getUniqueAgentIds(messages));

  function getAgentAvatar(
    agentId: string | null,
  ): { agentId: string; color: string } | undefined {
    // Incoming messages don't have an agent id
    if (!agentId) return undefined;

    // Avatar is not needed for the user
    if (agentId === activeAgentId) return undefined;

    return { agentId, color: colorMap.get(agentId)! };
  }

  function insertDateSeparators(
    chat: MessageRow[],
  ): (EnvelopeType | SeparatorType)[] {
    const _chat = [];

    let prevMsg: EnvelopeType | null = null;

    for (const [_index, env] of chat
      .map(
        (message) => ({ message, first: false, last: false }) as EnvelopeType,
      )
      .entries()) {
      if (!prevMsg) {
        env.first = true;
        env.last = true;
      } else if (
        prevMsg.message.agent_id === env.message.agent_id &&
        prevMsg.message.direction === env.message.direction &&
        prevMsg.message.contact_address === env.message.contact_address
      ) {
        prevMsg.last = false;
        env.last = true;
      } else if (
        prevMsg.message.agent_id !== env.message.agent_id ||
        prevMsg.message.direction !== env.message.direction ||
        prevMsg.message.contact_address !== env.message.contact_address
      ) {
        prevMsg.last = true;
        env.first = true;
        env.last = true;
      }

      if (
        !prevMsg ||
        dayjs(prevMsg.message.timestamp).isBefore(env.message.timestamp, "day")
      ) {
        _chat.push({
          text: formatDate(env.message.timestamp),
          first: true,
          last: true,
        } as SeparatorType);

        if (prevMsg) {
          prevMsg.last = true;
        }

        env.first = true;
      }

      _chat.push(env);

      prevMsg = env;
    }

    return _chat;
  }

  // If the role is not admin, then do not show internal messages (tool calls, etc).
  // Also hide rows older than the contiguous history window — init can leave
  // orphaned previews months back, which made scroll-up jump from today to the
  // distant past and skip yesterday.
  const envelopesAndSeparators = insertDateSeparators(
    messages
      .filter((m, idx) => {
        if (historyCursor && isOlderThanCursor(m, historyCursor)) return false;

        if (isReactionMessage(m)) return false;

        if (isAdmin) return true;

        // Hide internal messages for non-admin users
        if (m.direction === "internal") return false;

        // @ts-expect-error draft is deprecated
        if (m.kind === "draft" && idx !== 0) return false;

        return true;
      })
      .reverse(),
  );

  return (
    activeConvId && (
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="grow min-h-0 min-w-0 w-full pb-[8px] overflow-y-auto overflow-x-hidden overscroll-x-none [overflow-anchor:none] [scrollbar-gutter:stable]"
      >
        <div className="min-h-[12px] flex justify-center items-center py-1">
          {isLoadingOlder && <Spinner size={16} />}
        </div>
        <div className="flex min-w-0 flex-col">
          {envelopesAndSeparators.map((envOrSep, index) =>
            "message" in envOrSep ? (
              <Message
                key={envOrSep.message.id}
                message={envOrSep.message}
                first={envOrSep.first}
                last={envOrSep.last}
                orgName={orgName}
                convName={convName}
                avatar={getAgentAvatar(envOrSep.message.agent_id)}
                conversation={conv}
                reactions={getAggregatedReactions(
                  envOrSep.message,
                  reactionIndex,
                )}
                ownReaction={getOwnReactionEmoji(
                  envOrSep.message,
                  reactionIndex,
                  activeAgentId,
                )}
                canReact={canReact}
                canReply={canReply}
                repliedTo={messagesByExternalId.get(
                  replyTargetId(envOrSep.message) || "",
                )}
              />
            ) : (
              <Separator key={index} text={envOrSep.text} />
            ),
          )}
        </div>
      </div>
    )
  );
}
