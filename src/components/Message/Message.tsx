import {
  type MessageRow,
  type OutgoingStatus,
  type ToolInfo,
} from "@/supabase/client";
import AudioMessage from "./AudioMessage";
import DocumentMessage from "./DocumentMessage";
import ImageMessage from "./ImageMessage";
import VideoMessage from "./VideoMessage";
import { mediaCategory } from "./media";
import StatusIcon from "./StatusIcon";
import dayjs from "dayjs";
import { type FormEventHandler, type PropsWithChildren, useState } from "react";
import { Forward } from "lucide-react";
import { prettyPrintJson } from "pretty-print-json";
import { useTranslation } from "@/hooks/useTranslation";
import AvatarComponent from "@/components/Avatar";
import { useAgent } from "@/queries/useAgents";
import { useContactByAddress } from "@/queries/useContacts";
import { formatPhoneNumber } from "@/utils/FormatUtils";
import { AVATAR_BG_COLORS, AVATAR_TEXT_COLORS } from "@/utils/colors";
import type { Json } from "@/supabase/db_types";
import type { ConversationRow } from "@/supabase/client";
import MessageReactions from "./MessageReactions";
import ReplyQuote from "./ReplyQuote";
import ReplyButton from "./ReplyButton";
import { useMessageActionTray } from "./useMessageActionTray";
import { type AggregatedReaction } from "@/utils/ReactionUtils";
import { canReplyToMessage, isReplyMessage } from "@/utils/ReplyUtils";
import useBoundStore from "@/stores/useBoundStore";
import {
  chatMarkdownToHtml,
  chatTextDirection,
} from "@/utils/whatsappMarkdown";
import {
  getDataMessageDisplay,
  isTemplateMessageContent,
} from "@/utils/dataMessageDisplay";
import { useTemplates } from "@/queries/useTemplates";

export function Markdown({
  content,
  onInput,
}: {
  content: string;
  direction?: MessageRow["direction"];
  onInput?: FormEventHandler<HTMLDivElement>;
}) {
  const html = chatMarkdownToHtml(content);

  return (
    <div
      className="markdown"
      dir={chatTextDirection(content)}
      dangerouslySetInnerHTML={{ __html: html }}
      onInput={onInput}
    />
  );
}

export function TextMessage({
  header,
  body,
  footer,
  buttons,
  timestamp,
  status,
  onInput,
  direction,
  type,
  fixedWidth,
}: {
  header?: string;
  body: string | Json;
  footer?: string;
  buttons?: string[];
  timestamp?: string;
  status?: OutgoingStatus;
  onInput?: FormEventHandler<HTMLDivElement>;
  direction: MessageRow["direction"];
  type?: "markdown" | "json";
  fixedWidth?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { translate: t } = useTranslation();
  const MAX_LENGTH = 500;

  // Calculate if content is "too long"
  const isTooLong =
    type === "json"
      ? JSON.stringify(body).length > MAX_LENGTH
      : (body as string).length > MAX_LENGTH;

  return (
    <>
      <div
        className={
          "pl-[6px] pt-[6px] pb-[5px] pr-[4px]" +
          (fixedWidth ? " w-[320px]" : "")
        }
      >
        {/* Header */}
        {header && (
          <div
            className="text-[15px] mb-3 font-semibold"
            dangerouslySetInnerHTML={{ __html: header }}
            onInput={onInput}
          />
        )}

        {/* Body */}
        {type === "json" ? (
          <div
            className={
              "scrollbar-hide min-w-0 overflow-x-auto " +
              (isTooLong && !expanded ? "max-h-[150px] overflow-y-hidden" : "")
            }
          >
            <pre
              dangerouslySetInnerHTML={{
                __html: prettyPrintJson.toHtml(body as Json, {
                  indent: 2,
                }),
              }}
            />
          </div>
        ) : (
          <div
            className={
              "min-w-0 overflow-x-hidden " +
              (isTooLong && !expanded ? "max-h-[150px] overflow-y-hidden" : "")
            }
          >
            <Markdown content={body as string} onInput={onInput} />
          </div>
        )}

        {isTooLong && (
          <div
            className="text-primary cursor-pointer mt-1"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? t("ver menos...") : t("ver más...")}
          </div>
        )}

        {/* Footer */}
        {footer && (
          <div className="text-[13px] text-muted-foreground mt-1">{footer}</div>
        )}

        {/* Timestamp — below the text, not overlaid */}
        <div className="mt-[2px] flex items-center justify-end gap-[2px] text-[11px] text-muted-foreground">
          {dayjs(timestamp).format("HH:mm")}
          {direction === "outgoing" && !!status && <StatusIcon {...status} />}
        </div>
      </div>

      {/* Actions */}
      {buttons?.map((text, idx) => (
        <div
          key={idx}
          className="py-3 border-t border-border text-center text-primary"
        >
          {text}
        </div>
      ))}
    </>
  );
}

function Avatar({
  agentId,
  color,
  display,
}: {
  agentId: string;
  color: string;
  display: "name" | "picture-left" | "picture-right";
}) {
  const { data: agent } = useAgent(agentId);

  if (display === "picture-left" || display === "picture-right") {
    return (
      <AvatarComponent
        src={agent?.picture}
        fallback={agent?.name.charAt(0) || "A"}
        size={28}
        className={
          `${
            (color && AVATAR_BG_COLORS[color]) || ""
          } absolute text-foreground border border-border -top-[0.25px]` +
          (display === "picture-left" ? " -left-[38px]" : " -right-[38px]")
        }
      />
    );
  }

  if (display === "name") {
    return (
      <div
        className={`text-[12.8px] p-[6px] pb-0 ${
          (color && AVATAR_TEXT_COLORS[color]) || ""
        }`}
      >
        {agent?.name || "?"}
      </div>
    );
  }
}

// Shared in/out message classes. I could not find a better way to do it. - cabra 15/05/2024
const msgRowClasses = "lg:px-[63px] px-[24px] flex min-w-0 max-w-full";
const avatarMsgRowClasses =
  "lg:px-[calc(63px+38px)] px-[calc(24px+33px)] flex min-w-0 max-w-full";

const msgBubbleClasses =
  "relative min-w-0 rounded-lg shadow break-words overflow-x-hidden text-[14.2px] leading-[19px] p-[3px]";

const textMsgMaxWidth = " max-w-[90%] lg:max-w-[65%]";

const msgTailClasses = "w-[8px] h-[13px] absolute top-0";

export function InMessage({
  text,
  first,
  last,
  avatar,
  senderName,
  children,
  actionsOpen,
  rootRef,
  rowHandlers,
}: PropsWithChildren<
  UIMessage & {
    actionsOpen?: boolean;
    rootRef?: ReturnType<typeof useMessageActionTray>["rootRef"];
    rowHandlers?: ReturnType<typeof useMessageActionTray>["rowHandlers"];
  }
>) {
  return (
    <div
      ref={rootRef}
      {...rowHandlers}
      className={
        (avatar ? avatarMsgRowClasses : msgRowClasses) +
        " justify-start group/message" +
        (last ? " mb-[12px]" : " mb-[2px]")
      }
      data-actions-open={actionsOpen ? "" : undefined}
    >
      <div
        className={
          // max-w-65% applies to text only but could not find a way to abstract it
          msgBubbleClasses +
          " bg-incoming-chat-bubble text-foreground" +
          (first ? " rounded-tl-none" : "") +
          (text ? textMsgMaxWidth : " max-w-full")
        }
      >
        {first && (
          <>
            {avatar && <Avatar {...avatar} display="picture-left" />}
            <svg
              className={
                msgTailClasses + " text-incoming-chat-bubble -left-[8px]"
              }
            >
              <use href="/icons.svg#tail-in" />
            </svg>
          </>
        )}
        {avatar && first && <Avatar {...avatar} display="name" />}
        {first && senderName && (
          <div className="text-[12.8px] p-[6px] pb-0 text-primary font-medium">
            {senderName}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function OutMessage({
  text,
  first,
  last,
  children,
  avatar,
  internal,
  actionsOpen,
  rootRef,
  rowHandlers,
}: PropsWithChildren<
  UIMessage & {
    actionsOpen?: boolean;
    rootRef?: ReturnType<typeof useMessageActionTray>["rootRef"];
    rowHandlers?: ReturnType<typeof useMessageActionTray>["rowHandlers"];
  }
>) {
  return (
    <div
      ref={rootRef}
      {...rowHandlers}
      className={
        (avatar ? avatarMsgRowClasses : msgRowClasses) +
        " justify-end group/message" +
        (last ? " mb-[12px]" : " mb-[2px]")
      }
      data-actions-open={actionsOpen ? "" : undefined}
    >
      <div
        className={
          // max-w-65% applies to text only but could not find a way to abstract it
          msgBubbleClasses +
          " text-foreground" +
          (first ? " rounded-tr-none" : "") +
          (text ? textMsgMaxWidth : " max-w-full") +
          (internal ? " bg-incoming-chat-bubble" : " bg-outgoing-chat-bubble")
        }
      >
        {first && (
          <>
            {!!avatar && <Avatar {...avatar} display="picture-right" />}
            <svg
              className={
                msgTailClasses +
                " -right-[8px]" +
                (internal
                  ? " text-incoming-chat-bubble"
                  : " text-outgoing-chat-bubble")
              }
            >
              <use href="/icons.svg#tail-out" />
            </svg>
          </>
        )}
        {!!avatar && first && <Avatar {...avatar} display="name" />}
        {children}
      </div>
    </div>
  );
}

type UIMessage = {
  text?: boolean;
  first?: boolean;
  last?: boolean;
  orgName?: string;
  convName?: string;
  avatar?: { agentId: string; color: string };
  internal?: boolean;
  // Sender label for incoming messages in group conversations (whatsapp-web).
  senderName?: string;
};

export default function Message(
  props: UIMessage & {
    message: MessageRow;
    conversation?: ConversationRow;
    reactions?: AggregatedReaction[];
    ownReaction?: string;
    canReact?: boolean;
    canReply?: boolean;
    repliedTo?: MessageRow;
  },
) {
  const { translate: t } = useTranslation();
  const setConversationReplyTo = useBoundStore(
    (store) => store.chat.setConversationReplyTo,
  );
  const { rootRef, actionsOpen, closeActions, rowHandlers } =
    useMessageActionTray();
  const { data: templates } = useTemplates(
    isTemplateMessageContent(props.message.content)
      ? props.message.organization_address ||
          props.conversation?.organization_address
      : undefined,
  );

  // Group conversations (whatsapp-web): incoming rows carry the actual sender in
  // contact_address. Resolve a friendly label to attribute each message.
  const isGroupIncoming =
    !!props.message.group_address &&
    props.message.direction === "incoming" &&
    !!props.message.contact_address;
  const { data: senderContact } = useContactByAddress(
    isGroupIncoming ? props.message.contact_address : undefined,
    props.message.service,
  );
  const senderName = isGroupIncoming
    ? senderContact?.name || formatPhoneNumber(props.message.contact_address!)
    : undefined;

  // Label for the quoted (replied-to) message.
  const repliedTo = props.repliedTo;
  const isGroupReplyIncoming =
    !!repliedTo?.group_address &&
    repliedTo.direction === "incoming" &&
    !!repliedTo.contact_address;
  const { data: replySenderContact } = useContactByAddress(
    isGroupReplyIncoming ? repliedTo?.contact_address : undefined,
    repliedTo?.service,
  );
  const { data: replyAgent } = useAgent(
    (repliedTo && repliedTo.direction !== "incoming" && repliedTo.agent_id) ||
      "",
  );

  let replySenderLabel = t("Mensaje");
  if (repliedTo) {
    if (repliedTo.direction === "incoming") {
      replySenderLabel =
        replySenderContact?.name ||
        (isGroupReplyIncoming
          ? formatPhoneNumber(repliedTo.contact_address!)
          : props.convName) ||
        t("Contacto");
    } else {
      replySenderLabel = replyAgent?.name || t("Tú");
    }
  }

  const showReplyQuote = isReplyMessage(props.message);
  const replyable = canReplyToMessage(
    props.message,
    !!props.canReply && !!props.conversation,
  );

  let content;
  let text = false;
  let fixedWidth = false;

  let headerText: string | undefined = undefined;

  if ("tool" in props.message.content && props.message.content.tool) {
    const toolInfo = (props.message.content.tool as ToolInfo["tool"])!;

    const toolName = [
      "label" in toolInfo && toolInfo.label,
      "name" in toolInfo && toolInfo.name,
    ]
      .filter(Boolean)
      .join("__");

    if (toolInfo.event === "use") {
      headerText = `${t("Uso")}: ${toolName}`;
    } else if (toolInfo.event === "result") {
      headerText = `${t("Resultado")}: ${toolName}`;
    }

    fixedWidth = true;
  }

  if (props.message.content.type === "text") {
    content = (
      <TextMessage
        header={headerText}
        body={props.message.content.text}
        type="markdown"
        direction={props.message.direction}
        timestamp={props.message.timestamp}
        status={
          props.message.direction === "outgoing"
            ? props.message.status
            : undefined
        }
        fixedWidth={fixedWidth}
      />
    );
    text = true;
  } else if (
    (props.message.content.type === "data" &&
      props.message.content.kind === "media_placeholder") ||
    (props.message.content.type === "file" && !props.message.content.file?.uri)
  ) {
    // media_placeholder data parts, and history-imported media (whatsapp-web)
    // that arrived without a stored file — missing file.uri is the signal, as
    // history media carries no status.errors unlike live failures. Render as
    // unavailable media, keeping any caption.
    content = (
      <TextMessage
        header={headerText}
        body={
          `_${t("Contenido multimedia no disponible")}_` +
          (props.message.content.text
            ? `\n\n${props.message.content.text}`
            : "")
        }
        type="markdown"
        direction={props.message.direction}
        timestamp={props.message.timestamp}
        status={
          props.message.direction === "outgoing"
            ? props.message.status
            : undefined
        }
        fixedWidth={fixedWidth}
      />
    );
    text = true;
  } else if (props.message.content.type === "data") {
    const display = getDataMessageDisplay(props.message.content, templates);
    content = display ? (
      <TextMessage
        header={
          headerText ||
          (display.header ? chatMarkdownToHtml(display.header) : undefined)
        }
        body={display.body}
        footer={display.footer}
        buttons={display.buttons}
        type="markdown"
        direction={props.message.direction}
        timestamp={props.message.timestamp}
        status={
          props.message.direction === "outgoing"
            ? props.message.status
            : undefined
        }
        fixedWidth={fixedWidth}
      />
    ) : (
      <TextMessage
        header={headerText}
        body={props.message.content.data}
        type="json"
        direction={props.message.direction}
        timestamp={props.message.timestamp}
        status={
          props.message.direction === "outgoing"
            ? props.message.status
            : undefined
        }
        fixedWidth={fixedWidth}
      />
    );
    text = true;
  } else if (props.message.content.type === "file") {
    // Resolve the renderer by kind first, falling back to MIME (see
    // mediaCategory). This keeps the Instagram "native" kinds — a shared reel
    // (ig_reel/reel) is a video, a post/story is decided by MIME — rendering
    // correctly even when the stored MIME is wrong.
    const category = mediaCategory(
      props.message.content.kind,
      props.message.content.file.mime_type || "",
    );

    if (category === "audio") {
      content = (
        <AudioMessage
          {...{
            message: props.message,
            orgName: props.orgName || "",
            convName: props.convName || "",
          }}
        />
      );
    } else if (category === "video") {
      content = <VideoMessage {...props.message} />;
    } else if (category === "image") {
      content = <ImageMessage {...props.message} />;
    } else {
      content = <DocumentMessage {...props.message} />;
    }
  }

  const align = props.message.direction === "incoming" ? "left" : "right";

  // Reaction picker is rendered when canReact — ReplyButton shifts aside so they
  // don't overlap.
  const showReactionPicker = !!(
    props.canReact &&
    props.conversation &&
    props.message.external_id &&
    (props.message.direction === "incoming" ||
      props.message.direction === "outgoing")
  );

  const reactionPicker = (
    <MessageReactions
      message={props.message}
      conversation={props.conversation}
      reactions={[]}
      ownReaction={props.ownReaction}
      canReact={props.canReact || false}
      align={align}
      picker
    />
  );

  const replyButton = replyable ? (
    <ReplyButton
      align={align}
      offsetForReactions={showReactionPicker}
      onReply={() => {
        if (!props.message.id || !props.conversation) {
          return;
        }
        setConversationReplyTo(props.conversation.id, props.message.id);
        closeActions();
      }}
    />
  ) : null;

  const quote = showReplyQuote ? (
    <ReplyQuote
      message={repliedTo}
      senderLabel={replySenderLabel}
      onClick={
        repliedTo?.id
          ? () => {
              document
                .getElementById(`msg-${repliedTo.id}`)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          : undefined
      }
    />
  ) : null;

  const forwardedLabel = props.message.content.forwarded ? (
    <div className="flex items-center gap-[4px] px-[6px] pt-[6px] pb-[2px] text-[12.5px] italic text-muted-foreground">
      <Forward className="h-[12px] w-[12px] shrink-0" />
      {t("Reenviado")}
    </div>
  ) : null;

  const bubbleBody = (
    <>
      {forwardedLabel}
      {quote}
      {content}
      {reactionPicker}
      {replyButton}
    </>
  );

  const trayProps = { actionsOpen, rootRef, rowHandlers };

  return (
    <div
      id={props.message.id ? `msg-${props.message.id}` : undefined}
      className="min-w-0"
    >
      {props.message.direction === "incoming" && (
        <InMessage
          {...{ ...props, text, fixedWidth, senderName, ...trayProps }}
        >
          {bubbleBody}
        </InMessage>
      )}
      {(props.message.direction === "outgoing" ||
        props.message.direction === "internal") && (
        <OutMessage
          {...{
            ...props,
            text,
            internal: props.message.direction === "internal",
            fixedWidth,
            ...trayProps,
          }}
        >
          {bubbleBody}
        </OutMessage>
      )}
      <MessageReactions
        message={props.message}
        conversation={props.conversation}
        reactions={props.reactions || []}
        ownReaction={props.ownReaction}
        canReact={props.canReact || false}
        align={align}
      />
    </div>
  );
}
