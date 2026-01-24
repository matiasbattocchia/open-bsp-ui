/**
 * DEPRECATED MESSAGE TYPES
 * 
 * This file contains deprecated message handling code that is no longer used in the application.
 * Kept here for reference and potential future need.
 */

import { useTranslation } from "@/hooks/useTranslation";
import { type MessageRow } from "@/supabase/client";
import { type FormEventHandler } from "react";

/**
 * DEPRECATED: Draft and Notification message types
 * These were removed from active use but code is preserved here.
 */
export function DeprecatedSpecialMessageTypes() {
  const { translate: t } = useTranslation();

  return {
    notification: t("🔔 Notificación"),
    draft: t("📝 Borrador"),
  };
}

/**
 * DEPRECATED: Draft message handling in BaseMessage
 * This allowed users to send draft messages with a button.
 * Removed from BaseMessage component but preserved here.
 */
export function DraftMessageAction({
  draft,
  onInput: _onInput,
}: {
  draft?: MessageRow;
  onInput?: FormEventHandler<HTMLDivElement>;
}) {
  const { translate: t } = useTranslation();

  if (!draft) return null;

  return (
    <div
      className="py-3 border-t border-border text-center text-primary cursor-pointer"
      onClick={() => {
        // This functionality would need to be reimplemented if draft messages are brought back
        console.warn("Draft message send action is deprecated");
      }}
    >
      {t("Enviar")}
    </div>
  );
}

/**
 * DEPRECATED: SystemMessage component
 * Previously used for system messages, but now internal messages use InternalMessage instead.
 */
export function SystemMessage({
  first: _first,
  last,
  children,
  avatar: _avatar,
}: any) {
  const msgRowClasses = "lg:px-[63px] px-[24px] flex";
  const msgBubbleClasses =
    "relative rounded-lg shadow break-words text-[14.2px] leading-[19px] p-[3px]";
  const textMsgMaxWidth = " max-w-[90%] lg:max-w-[65%]";

  return (
    <div
      className={
        msgRowClasses + " justify-center" + (last ? " mb-[12px]" : " mb-[2px]")
      }
    >
      <div
        className={
          msgBubbleClasses + " bg-white" + textMsgMaxWidth
        }
      >
        {children}
      </div>
    </div>
  );
}

/**
 * DEPRECATED: rewriteInternalMessageDirection from Chat.tsx
 * This function was used to convert internal messages to incoming/outgoing
 * based on agent ownership, but this loses the "internal" direction type.
 * Now we keep the direction as "internal" and handle it properly in the Message component.
 */
export function rewriteInternalMessageDirection(
  originalMessage: MessageRow,
  activeAgentId: string | undefined,
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
