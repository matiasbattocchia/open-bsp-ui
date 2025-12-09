import {
  type MessageRow,
  type MessageInsert,
  type OutgoingStatus,
  type InternalMessage,
} from "@/supabase/client";
import AudioMessage from "./AudioMessage";
import DocumentMessage from "./DocumentMessage";
import ImageMessage from "./ImageMessage";
import StatusIcon from "./StatusIcon";
import dayjs from "dayjs";
import { Remarkable } from "remarkable";
import { type FormEventHandler, type PropsWithChildren, useState } from "react";
import { prettyPrintJson } from "pretty-print-json";
import { useTranslation } from "@/hooks/useTranslation";
import AvatarComponent from "@/components/Avatar";
import { pushMessageToDb } from "@/utils/MessageUtils";
import { pushMessageToStore } from "@/utils/MessageUtils";
import { useAgent } from "@/queries/useAgents";

const md = new Remarkable({ breaks: true, html: true });

export function Markdown({
  content,
  type,
  onInput,
  withoutEndingSpace,
}: {
  content: string;
  type: string;
  onInput?: FormEventHandler<HTMLDivElement>;
  withoutEndingSpace?: boolean;
}) {
  let toRender = content;
  toRender = toRender.replace(
    /(?<=[^*]|^)\*(?=[^*\s])(.+?)(?<=[^*\s])\*(?=[^*]|$)/g,
    "**$1**",
  ); // TODO: use a markdown parser that supports the WhatsApp style - cabra 06/10/2024

  // Hack to induce some space to not to overwrite the timestamp.
  if (!withoutEndingSpace) {
    toRender += "&emsp;&emsp;&emsp;";

    if (type === "outgoing") {
      toRender += "&emsp;";
    }
  }

  const renderedHTML = md.render(toRender);

  return (
    <div
      className="markdown"
      dangerouslySetInnerHTML={{ __html: renderedHTML }}
      onInput={onInput}
    />
  );
}

export function BaseMessage({
  header,
  body,
  footer,
  buttons,
  type,
  timestamp,
  status,
  onInput,
  draft,
}: {
  header?: string;
  body: string;
  footer?: string;
  buttons?: string[];
  type: "incoming" | "outgoing" | "system";
  timestamp?: string;
  status?: OutgoingStatus;
  onInput?: FormEventHandler<HTMLDivElement>;
  draft?: MessageRow;
}) {
  const { translate: t } = useTranslation();

  return (
    <>
      <div className="relative">
        {/* Content */}
        <div className="pl-[6px] pt-[6px] pb-[5px] pr-[4px]">
          {/* Header */}
          {header && (
            <div
              className="text-[15px] mb-3 font-semibold"
              dangerouslySetInnerHTML={{ __html: header }}
              onInput={onInput}
            />
          )}

          {/* Body */}
          <Markdown
            content={body}
            type={type}
            onInput={onInput}
            withoutEndingSpace={!!footer}
          />

          {/* This invisible inline element does not play well with Markdown block elements.
          <span className="text-[11px] mx-[4px] invisible">
            {dayjs(message.timestamp).format("HH:mm")}
            {message.type === "outgoing" && (
              <span className="px-[8px] ml-[3px]"></span>
            )}
          </span>
          */}

          {/* Footer */}
          {footer && (
            <div className="text-[13px] text-muted-foreground mt-1">
              {footer}
              <span className="text-[11px] mx-[4px] invisible">
                {dayjs(timestamp).format("HH:mm")}
                {type === "outgoing" && !!status && (
                  <span className="px-[8px] ml-[3px]"></span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-[11px] text-muted-foreground absolute bottom-[0px] right-[7px] flex items-center">
          {dayjs(timestamp).format("HH:mm")}
          {type === "outgoing" && !!status && <StatusIcon {...status} />}
        </div>
      </div>

      {/* Actions */}
      {buttons?.map((text, idx) => (
        <div
          key={idx}
          className="py-3 border-t border-t-gray-dark text-center text-primary"
        >
          {text}
        </div>
      ))}

      {draft && (
        <div
          className="py-3 border-t border-border text-center text-primary cursor-pointer"
          onClick={() => {
            // Cast the content as OutgoingMessage since we're sending it as outgoing
            const outgoingMessage = {
              organization_id: draft.organization_id,
              conversation_id: draft.conversation_id,
              contact_address: draft.contact_address,
              organization_address: draft.organization_address,
              agent_id: draft.agent_id,
              direction: "outgoing" as const,
              content: draft.content,
            };
            pushMessageToStore(outgoingMessage as MessageInsert);
            pushMessageToDb(outgoingMessage as MessageInsert, false);
          }}
        >
          {t("Enviar")}
        </div>
      )}
    </>
  );
}

function TextMessage(message: MessageRow) {
  if (!(message.direction === "incoming" || message.direction === "outgoing")) {
    throw new Error(`Message with id ${message.id} is not a BaseMessage.`);
  }

  const content = message.content;
  let body = "";

  // Handle v1 content structure - TextPart
  if (content.type === "text") {
    body = content.text || "";
  }

  return (
    <BaseMessage
      header={undefined}
      body={body}
      footer={undefined}
      type={message.direction}
      timestamp={message.timestamp}
      status={message.direction === "outgoing" ? message.status : undefined}
    />
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
          `${color ? `bg-${color}-500` : ""} absolute` +
          (display === "picture-left" ? " -left-[38px]" : " -right-[38px]")
        }
      />
    );
  }

  if (display === "name") {
    return (
      <div
        className={`text-[14px] p-[6px] pb-0 ${color ? `text-${color}-500` : ""}`}
      >
        {agent?.name || "Asistente"}
      </div>
    );
  }
}

// Shared in/out message classes. I could not find a better way to do it. - cabra 15/05/2024
const msgRowClasses = "px-[18px] lg:px-[63px] flex";
const avatarMsgRowClasses = "px-[calc(18px+28px)] lg:px-[calc(63px+38px)] flex";

const msgBubbleClasses =
  "relative rounded-lg shadow break-words text-[14.2px] leading-[19px] p-[3px]";

const textMsgMaxWidth = " max-w-[90%] lg:max-w-[65%]";

const msgTailClasses = "w-[8px] h-[13px] absolute top-0";

export function InMessage({
  text,
  first,
  last,
  avatar,
  children,
}: PropsWithChildren<UIMessage>) {
  return (
    <div
      className={
        (avatar ? avatarMsgRowClasses : msgRowClasses) +
        " justify-start" +
        (last ? " mb-[12px]" : " mb-[2px]")
      }
    >
      <div
        className={
          // max-w-65% applies to text only but could not find a way to abstract it
          msgBubbleClasses +
          " bg-incoming-chat-bubble text-foreground" +
          (first ? " rounded-tl-none" : "") +
          (text ? textMsgMaxWidth : "")
        }
      >
        {first && (
          <>
            {avatar && <Avatar {...avatar} display="picture-left" />}
            <svg className={msgTailClasses + " text-incoming-chat-bubble -left-[8px]"}>
              <use href="/icons.svg#tail-in" />
            </svg>
          </>
        )}
        {avatar && first && <Avatar {...avatar} display="name" />}
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
}: PropsWithChildren<UIMessage>) {
  return (
    <div
      className={
        (!!avatar ? avatarMsgRowClasses : msgRowClasses) +
        " justify-end" +
        (last ? " mb-[12px]" : " mb-[2px]")
      }
    >
      <div
        className={
          // max-w-65% applies to text only but could not find a way to abstract it
          msgBubbleClasses +
          " bg-outgoing-chat-bubble text-foreground" +
          (first ? " rounded-tr-none" : "") +
          (text ? textMsgMaxWidth : "")
        }
      >
        {first && (
          <>
            {!!avatar && <Avatar {...avatar} display="picture-right" />}
            <svg className={msgTailClasses + " text-outgoing-chat-bubble -right-[8px]"}>
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

function FunctionCallMessage({
  message,
  header,
}: {
  message: MessageRow;
  header: string;
}) {
  const [showArguments, setShowArguments] = useState(false);

  const { translate: t } = useTranslation();

  // Extract tool info from InternalMessage with ToolInfo
  const content = message.content as InternalMessage;
  let toolName: string = "unknown";
  let toolArgs: any = {};

  if ("tool" in content && content.tool) {
    const toolInfo = content.tool;

    // Extract tool name from provider-specific info
    if ("name" in toolInfo) {
      toolName = toolInfo.name as string;
    } else if ("label" in toolInfo) {
      toolName = toolInfo.label as string;
    }
  }

  // Tool arguments are in the data part for function tools
  if (content.type === "data" && content.data) {
    toolArgs = content.data;
  }

  return (
    <div className="relative">
      {/* Content */}
      <div className="pl-[6px] pt-[6px] pb-[5px] pr-[4px] w-[320px]">
        {/* Header */}
        <div className="text-[15px] mb-3 font-semibold">{header}</div>

        <pre className="pb-[6px]">{toolName}</pre>

        {showArguments && (
          <pre
            dangerouslySetInnerHTML={{
              __html: prettyPrintJson.toHtml(toolArgs, {
                indent: 2,
              }),
            }}
          />
        )}
        <div
          className="text-primary cursor-pointer"
          onClick={() => setShowArguments(!showArguments)}
        >
          {showArguments ? t("ocultar argumentos...") : t("ver argumentos...")}
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-[11px] text-muted-foreground absolute bottom-[0px] right-[7px] flex items-center">
        {dayjs(message.timestamp).format("HH:mm")}
      </div>
    </div>
  );
}

function FunctionResponseMessage({
  message,
  header,
}: {
  message: MessageRow;
  header: string;
}) {
  const [showResponse, setShowResponse] = useState(false);

  const { translate: t } = useTranslation();

  // Extract content from InternalMessage with ToolInfo
  const content = message.content as InternalMessage;
  let isJson = false;
  let textBody = "";
  let responseData: any = null;

  // Tool results are typically in text or data parts
  if (content.type === "text") {
    textBody = content.text || "";
  } else if (content.type === "data") {
    responseData = content.data;
    try {
      textBody = JSON.stringify(content.data, null, 2);
      isJson = true;
    } catch {
      textBody = String(content.data || "");
    }
  }

  return (
    <div className="relative">
      {/* Content */}
      <div className="pl-[6px] pt-[6px] pb-[5px] pr-[4px] w-[320px]">
        {/* Header */}
        <div className="text-[15px] mb-3 font-semibold">{header}</div>

        {/* Body */}
        {textBody.length > 100 ? (
          <>
            {showResponse ? (
              isJson ? (
                <pre
                  dangerouslySetInnerHTML={{
                    __html: prettyPrintJson.toHtml(responseData || {}, {
                      indent: 2,
                    }),
                  }}
                />
              ) : (
                <pre>{textBody}</pre>
              )
            ) : (
              <pre className="pb-[6px]">
                {textBody.slice(0, 100)}
                ...
              </pre>
            )}

            <div
              className="text-primary cursor-pointer"
              onClick={() => setShowResponse(!showResponse)}
            >
              {showResponse ? t("ver menos...") : t("ver más...")}
            </div>
          </>
        ) : (
          <pre>{textBody}</pre>
        )}
      </div>

      {/* Timestamp */}
      <div className="text-[11px] text-muted-foreground absolute bottom-[0px] right-[7px] flex items-center">
        {dayjs(message.timestamp).format("HH:mm")}
      </div>
    </div>
  );
}

export function SpecialMessageTypeMap(type: string) {
  const { translate: t } = useTranslation();

  return {
    notification: t("🔔 Notificación") as string,
    draft: t("📝 Borrador") as string,
    function_call: t("⚙️ Uso de herramienta") as string,
    function_response: t("📊 Resultado de herramienta") as string,
  }[type];
}

function SpecialMessage(message: MessageRow) {
  const content = message.content;
  let bodyText = "";

  // Extract text for display
  if (content.type === "text") {
    bodyText = content.text || "";
  } else if (content.type === "data") {
    bodyText = JSON.stringify(content.data, null, 2);
  }

  // Check if this is an internal message with tool information
  // InternalMessage has ToolInfo with event "use" or "result"
  if (message.direction === "internal") {
    const internalContent = content as InternalMessage;

    if ("tool" in internalContent && internalContent.tool) {
      const toolInfo = internalContent.tool;

      if (toolInfo.event === "use") {
        return (
          <FunctionCallMessage
            message={message}
            header={SpecialMessageTypeMap("function_call") as string}
          />
        );
      } else if (toolInfo.event === "result") {
        return (
          <FunctionResponseMessage
            message={message}
            header={SpecialMessageTypeMap("function_response") as string}
          />
        );
      }
    }
  }

  // Default: render internal messages as system messages
  return (
    <BaseMessage
      header={undefined}
      body={bodyText}
      type="system"
      timestamp={message.timestamp}
    />
  );
}

function SystemMessage({
  first,
  last,
  children,
  avatar,
}: PropsWithChildren<UIMessage>) {
  return (
    <div
      className={
        msgRowClasses + " justify-center" + (last ? " mb-[12px]" : " mb-[2px]")
      }
    >
      <div
        className={
          // max-w-65% applies to text only but could not find a way to abstract it
          msgBubbleClasses + " bg-white" + textMsgMaxWidth
        }
      >
        {first && !!avatar && <Avatar {...avatar} display="picture-right" />}
        {first && !!avatar && <Avatar {...avatar} display="name" />}
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
};

export default function Message(props: UIMessage & { message: MessageRow }) {
  let content;
  let text = false;

  const messageContent = props.message.content;
  const messageKind = messageContent.kind;

  // Determine message type based on v1 content structure
  switch (messageKind) {
    case "text":
    case "reaction":
    case "caption":
    case "transcription":
    case "description": {
      content = <TextMessage {...props.message} />;
      text = true;
      break;
    }
    case "document": {
      content = <DocumentMessage {...props.message} />;
      break;
    }
    case "audio": {
      content = (
        <AudioMessage
          {...{
            message: props.message,
            orgName: props.orgName || "",
            convName: props.convName || "",
          }}
        />
      );
      break;
    }
    case "image":
    case "sticker": {
      content = <ImageMessage {...props.message} />;
      break;
    }
    case "video": {
      content = <ImageMessage {...props.message} />; // Reusing ImageMessage for now
      break;
    }
    case "template":
    case "button":
    case "interactive":
    case "contacts":
    case "location":
    case "order": {
      content = <TextMessage {...props.message} />;
      text = true;
      break;
    }
  }

  return (
    <>
      {props.message.direction === "incoming" && (
        <InMessage {...{ ...props, text }}>{content}</InMessage>
      )}
      {props.message.direction === "outgoing" && (
        <OutMessage {...{ ...props, text }}>{content}</OutMessage>
      )}
      {props.message.direction !== "outgoing" &&
        props.message.direction !== "incoming" && (
          <SystemMessage {...props}>
            <SpecialMessage {...props.message} />
          </SystemMessage>
        )}
    </>
  );
}
