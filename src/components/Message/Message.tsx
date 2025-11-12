import { MessageRow, OutgoingStatus, supabase } from "@/supabase/client";
import AudioMessage from "./AudioMessage";
import DocumentMessage from "./DocumentMessage";
import ImageMessage from "./ImageMessage";
import StatusIcon from "./StatusIcon";
import dayjs from "dayjs";
import { Remarkable } from "remarkable";
import { FormEventHandler, PropsWithChildren, useState } from "react";
import { prettyPrintJson } from "pretty-print-json";
import { useTranslation } from "react-dialect";
import { useQuery } from "@tanstack/react-query";
import AvatarComponent from "@/components/Avatar";
import useBoundStore from "@/store/useBoundStore";
import { pushMessageToDb } from "@/utils/MessageUtils";
import { pushMessageToStore } from "@/utils/MessageUtils";

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
            <div className="text-[13px] text-gray-dark mt-1">
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
        <div className="text-[11px] text-gray-dark absolute bottom-[0px] right-[7px] flex items-center">
          {dayjs(timestamp).format("HH:mm")}
          {type === "outgoing" && !!status && <StatusIcon {...status} />}
        </div>
      </div>

      {/* Actions */}
      {buttons?.map((text, idx) => (
        <div
          key={idx}
          className="py-3 border-t border-t-gray-dark text-center text-blue-ack"
        >
          {text}
        </div>
      ))}

      {draft && (
        <div
          className="py-3 border-t border-t-gray-dark text-center text-blue-ack cursor-pointer"
          onClick={() => {
            pushMessageToStore({ ...draft, type: "outgoing" });
            pushMessageToDb({ ...draft, type: "outgoing" }, false);
          }}
        >
          {t("Enviar")}
        </div>
      )}
    </>
  );
}

function TextMessage(message: MessageRow) {
  if (!(message.type === "incoming" || message.type === "outgoing")) {
    throw new Error(`Message with id ${message.id} is not a BaseMessage.`);
  }

  return (
    <BaseMessage
      header={message.message.header}
      body={message.message.content || ""}
      footer={message.message.footer}
      type={message.type}
      timestamp={message.timestamp}
      status={message.type === "outgoing" ? message.status : undefined}
    />
  );
}

function Avatar({
  agentId,
  color,
  display,
}: {
  agentId: string;
  color: { text: string; bg: string };
  display: "name" | "picture-left" | "picture-right";
}) {
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  const { data: agent } = useQuery({
    queryKey: [activeOrgId, "agents", "avatar", agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60 * 6, // Six hours
  });

  if (display === "picture-left" || display === "picture-right") {
    return (
      <AvatarComponent
        src={agent?.picture}
        fallback={agent?.name.charAt(0) || "A"}
        size={28}
        className={
          `${color.bg || "bg-gray-500"} absolute` +
          (display === "picture-left" ? " -left-[38px]" : " -right-[38px]")
        }
      />
    );
  }

  if (display === "name") {
    return (
      <div
        className={`text-[14px] p-[6px] pb-0 ${color.text || "text-gray-500"}`}
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
  "relative rounded-lg shadow-chat-bubble break-words text-[14.2px] leading-[19px] p-[3px]";

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
          " bg-white" +
          (first ? " rounded-tl-none" : "") +
          (text ? textMsgMaxWidth : "")
        }
      >
        {first && (
          <>
            {avatar && <Avatar {...avatar} display="picture-left" />}
            <svg className={msgTailClasses + " text-white -left-[8px]"}>
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
          " bg-blue-100" +
          (first ? " rounded-tr-none" : "") +
          (text ? textMsgMaxWidth : "")
        }
      >
        {first && (
          <>
            {!!avatar && <Avatar {...avatar} display="picture-right" />}
            <svg className={msgTailClasses + " text-blue-100 -right-[8px]"}>
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
  if (!(message.type === "function_call")) {
    throw new Error(
      `Message with id ${message.id} is not a FunctionCallMessage.`,
    );
  }

  const [showArguments, setShowArguments] = useState(false);

  const { translate: t } = useTranslation();

  return (
    <div className="relative">
      {/* Content */}
      <div className="pl-[6px] pt-[6px] pb-[5px] pr-[4px] w-[320px]">
        {/* Header */}
        <div className="text-[15px] mb-3 font-semibold">{header}</div>

        <pre className="pb-[6px]">{message.message.function.name}</pre>

        {showArguments && (
          <pre
            dangerouslySetInnerHTML={{
              __html: prettyPrintJson.toHtml(
                JSON.parse(message.message.function.arguments || "{}"),
                { indent: 2 },
              ),
            }}
          />
        )}
        <div
          className="text-blue-ack cursor-pointer"
          onClick={() => setShowArguments(!showArguments)}
        >
          {showArguments ? t("ocultar argumentos...") : t("ver argumentos...")}
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-[11px] text-gray-dark absolute bottom-[0px] right-[7px] flex items-center">
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
  if (!(message.type === "function_response")) {
    throw new Error(
      `Message with id ${message.id} is not a FunctionResponseMessage.`,
    );
  }

  const [showResponse, setShowResponse] = useState(false);

  const { translate: t } = useTranslation();

  let isJson = false;
  let textBody = "";
  try {
    textBody = JSON.stringify(
      JSON.parse(message.message.content || "{}"),
      null,
      2,
    );
    isJson = true;
  } catch {
    textBody = message.message.content || "";
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
                    __html: prettyPrintJson.toHtml(
                      JSON.parse(message.message.content || "{}"),
                      { indent: 2 },
                    ),
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
              className="text-blue-ack cursor-pointer"
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
      <div className="text-[11px] text-gray-dark absolute bottom-[0px] right-[7px] flex items-center">
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
  switch (message.type) {
    case "notification":
      return (
        <BaseMessage
          header={SpecialMessageTypeMap(message.type)}
          body={message.message.content || ""}
          type="system"
          timestamp={message.timestamp}
        />
      );
    case "draft":
      return (
        <BaseMessage
          header={SpecialMessageTypeMap(message.type)}
          body={message.message.content || ""}
          type="system"
          timestamp={message.timestamp}
          draft={message}
        />
      );
    case "function_call":
      return (
        <FunctionCallMessage
          message={message}
          header={SpecialMessageTypeMap(message.type) as string}
        />
      );
    case "function_response":
      return (
        <FunctionResponseMessage
          message={message}
          header={SpecialMessageTypeMap(message.type) as string}
        />
      );
    default:
      return null;
  }
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
  avatar?: { agentId: string; color: { text: string; bg: string } };
};

export default function Message(props: UIMessage & { message: MessageRow }) {
  let content;
  let text = false;

  // Safety check for message structure
  if (!props.message.message || typeof props.message.message !== 'object') {
    console.error('Invalid message structure:', props.message);
    return (
      <div className="p-2 text-red-500 bg-red-50 rounded">
        Error: Invalid message format
      </div>
    );
  }

  switch (props.message.message.type) {
    case "text":
    case "reaction":
    case "button":
    case "template": {
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
  }

  return (
    <>
      {props.message.type === "incoming" && (
        <InMessage {...{ ...props, text }}>{content}</InMessage>
      )}
      {props.message.type === "outgoing" && (
        <OutMessage {...{ ...props, text }}>{content}</OutMessage>
      )}
      {props.message.type !== "outgoing" &&
        props.message.type !== "incoming" && (
          <SystemMessage {...props}>
            <SpecialMessage {...props.message} />
          </SystemMessage>
        )}
    </>
  );
}
