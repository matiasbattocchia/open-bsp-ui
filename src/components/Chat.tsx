import { useEffect, useRef } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import "dayjs/locale/pt";
import localizedFormat from "dayjs/plugin/localizedFormat";
dayjs.extend(localizedFormat);
import useBoundStore from "@/stores/useBoundStore";
import Message from "./Message/Message";
import { type MessageRow } from "@/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useOrganization } from "@/queries/useOrgs";

const colors = {
  emerald: { text: "text-emerald-500", bg: "bg-emerald-500" },
  red: { text: "text-red-500", bg: "bg-red-500" },
  teal: { text: "text-teal-500", bg: "bg-teal-500" },
  amber: { text: "text-amber-500", bg: "bg-amber-500" },
  cyan: { text: "text-cyan-500", bg: "bg-cyan-500" },
  orange: { text: "text-orange-500", bg: "bg-orange-500" },
  sky: { text: "text-sky-500", bg: "bg-sky-500" },
  blue: { text: "text-blue-500", bg: "bg-blue-500" },
  yellow: { text: "text-yellow-500", bg: "bg-yellow-500" },
  lime: { text: "text-lime-500", bg: "bg-lime-500" },
  green: { text: "text-green-500", bg: "bg-green-500" },
  indigo: { text: "text-indigo-500", bg: "bg-indigo-500" },
  violet: { text: "text-violet-500", bg: "bg-violet-500" },
  purple: { text: "text-purple-500", bg: "bg-purple-500" },
  fuchsia: { text: "text-fuchsia-500", bg: "bg-fuchsia-500" },
  pink: { text: "text-pink-500", bg: "bg-pink-500" },
  rose: { text: "text-rose-500", bg: "bg-rose-500" },
  slate: { text: "text-slate-500", bg: "bg-slate-500" },
  gray: { text: "text-gray-500", bg: "bg-gray-500" },
  zinc: { text: "text-zinc-500", bg: "bg-zinc-500" },
  neutral: { text: "text-neutral-500", bg: "bg-neutral-500" },
  stone: { text: "text-stone-500", bg: "bg-stone-500" },
};

type EnvelopeType = { message: MessageRow; first: boolean; last: boolean };
type SeparatorType = { text: string; first: true; last: true };

function Separator({ text }: { text: string }) {
  // TODO: just a placeholder
  let type = "date";

  return (
    <div
      className={
        "flex justify-center mb-[12px]" +
        (type === "unread"
          ? " py-[5px] bg-white/25 border-t border-t-white/15 border-b border-b-gray-dark/15"
          : "")
      }
    >
      {/* unreads has rounded-16px px-22px py-0 but I prefer to keep the date style */}
      <div
        className={
          "px-[12px] pt-[5px] pb-[6px] uppercase text-[12.5px] bg-white rounded-lg" +
          (type === "unread" ? "" : " text-gray-dark shadow-chat-bubble")
        }
      >
        {text}
      </div>
    </div>
  );
}

export default function Chat() {
  const activeConvId = useBoundStore((store) => store.ui.activeConvId);
  const messages = Array.from(
    useBoundStore((store) =>
      store.chat.messages.get(store.ui.activeConvId || ""),
    )?.values() || [],
  );
  const { data: orgData } = useOrganization(useBoundStore((store) => store.ui.activeOrgId || ""));
  const orgName = orgData?.name || "?";
  const convName = useBoundStore(
    (store) =>
      store.chat.conversations.get(store.ui.activeConvId || "")?.name || "?",
  );

  const activeAgentId = useBoundStore(
    (store) => store.ui.roles[store.ui.activeOrgId || ""]?.agentId,
  );

  const scroller = useRef<HTMLDivElement>(null);

  const { translate: t, currentLanguage } = useTranslation();

  function formatDate(timestamp: string): string {
    const dayjsTs = dayjs(timestamp).locale(currentLanguage);

    const days = dayjs().diff(dayjsTs.startOf("day"), "day", true);

    if (days < 1) return t("hoy") as string;

    if (days < 2) return t("ayer") as string;

    if (days < 7) return dayjsTs.format("dddd"); // Jueves

    return dayjsTs.format("l"); // 9/9/2024
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

  function assignAgentColors(
    agentIds: Set<string>,
  ): Map<string, { text: string; bg: string }> {
    const colorMap = new Map<string, { text: string; bg: string }>();
    let colorIndex = 0;

    // Ensure consistent color assignment by sorting agent IDs
    const sortedAgentIds = Array.from(agentIds).sort();

    for (const agentId of sortedAgentIds) {
      colorMap.set(
        agentId,
        Object.values(colors)[colorIndex % Object.keys(colors).length],
      );
      colorIndex++;
    }

    return colorMap;
  }

  const colorMap = assignAgentColors(getUniqueAgentIds(messages));

  function getAgentAvatar(
    agentId: string | null,
  ): { agentId: string; color: { text: string; bg: string } } | undefined {
    // Incoming messages don't have an agent id
    if (!agentId) return undefined;

    // Avatar is not needed for the user
    if (agentId === activeAgentId) return undefined;

    return { agentId, color: colorMap.get(agentId)! };
  }

  // If the message is internal (teams communication), we need to determine if it's an incoming or outgoing message for display purposes.
  function rewriteInternalMessageDirection(
    originalMessage: MessageRow,
  ): MessageRow {
    let message = { ...originalMessage };

    if (
      message.direction === "internal" &&
      message.agent_id !== activeAgentId
    ) {
      // @ts-ignore
      message = { ...message, direction: "incoming" };
    } else if (
      message.direction === "internal" &&
      message.agent_id === activeAgentId
    ) {
      // @ts-ignore
      message = { ...message, direction: "outgoing" };
    }

    return message;
  }

  function insertDateSeparators(
    chat: MessageRow[],
    t: (content: string) => React.ReactNode,
  ): (EnvelopeType | SeparatorType)[] {
    const _chat = [];
    _chat.push({
      text: t("Inicio de la conversación"),
      first: true,
      last: true,
    } as SeparatorType);
    function typeMap(row: MessageRow) {
      // For internal messages with tool info, use tool use_id to group related calls
      if (row.direction === "internal" && row.content.tool?.event === "use") {
        return `tool-use-${row.content.tool.use_id}`;
      }
      if (
        row.direction === "internal" &&
        row.content.tool?.event === "result"
      ) {
        return `tool-result-${row.content.tool.use_id}`;
      }
      // For other messages, combine direction and content kind
      return `${row.direction}-${row.content.kind}`;
    }

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
        typeMap(prevMsg.message) === typeMap(env.message)
      ) {
        prevMsg.last = false;
        env.last = true;
      } else if (
        prevMsg.message.agent_id !== env.message.agent_id ||
        typeMap(prevMsg.message) !== typeMap(env.message)
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

  /* Actions that reset the unreads counter
   * ======================================
   *
   *   Inactive conversation
   *   ---------------------
   *   [x] Opening the conversation (conv goes active)
   *   [~] {X new messages} system message, it dissapears when conv goes inactive
   *   [ ] Scroll starts at system message
   *
   *   Active conversations
   *   --------------------
   *   [x] Sending a message
   *   [ ] Scrolling to bottom
   *
   * Scrolling behavior
   * ==================
   *
   * If at bottom, it sticks
   * New outgoing -> goes to bottom
   * New incoming -> stays at place
   *
   * Telegram:
   *   Remembers conv scroll position
   *   Re-activating the conv -> goes to bottom
   */

  useEffect(() => {
    let scrollerRef = scroller.current;

    if (!scrollerRef || !scroller.current) {
      return;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, activeConvId]);

  useEffect(() => {
    scrollToBottom(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId]);

  // Keep the scroll at the bottom when new messages are added
  // prevent the scroll from jumping when the user is reading old messages
  useEffect(() => {
    const scrollRef = scroller.current;
    if (!scrollRef) {
      return;
    }
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const role = useBoundStore(
    (state) => state.ui.roles[state.ui.activeOrgId || ""]?.role,
  );

  // If the role is not admin, then do not show internal messages (tool calls, etc).
  const envelopesAndSeparators = insertDateSeparators(
    messages
      .filter((m, idx) => {
        if (role === "admin") return true;

        // Hide internal messages for non-admin users
        if (m.direction === "internal") return false;

        // @ts-expect-error draft is deprecated
        if (m.kind === "draft" && idx !== 0) return false;

        return true;
      })
      .reverse()
      .map((message) => rewriteInternalMessageDirection(message)),
    t,
  );

  const scrollToBottom = (isSmooth: boolean = true) => {
    if (scroller.current) {
      scroller.current.scrollTo({
        top: scroller.current.scrollHeight,
        behavior: isSmooth ? "smooth" : "instant",
      });
    }
  };

  return (
    activeConvId && (
      <div ref={scroller} className="grow pb-[8px] bg-chat [overflow-y:scroll]">
        <div className="min-h-[12px]" />
        <div className="flex flex-col">
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
              />
            ) : (
              <Separator key={index} text={envOrSep.text} />
            ),
          )}
        </div>
        {/* (
          <button
            style={{
              width: "42px",
              height: "42px",
              position: "fixed",
              bottom: "75px",
              right: "20px",
              backgroundColor: "#FFFFFF",
              borderRadius: "50%",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
            }}
            onClick={() => scrollToBottom()}
          >
            <ChevronDown className="w-8 h-8 pt-1 text-gray-dark" />
          </button>
        ) */}
      </div>
    )
  );
}
