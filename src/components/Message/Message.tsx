import {
  type MessageRow,
  type OutgoingStatus,
  type ToolInfo,
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
import { useAgent } from "@/queries/useAgents";
import { AVATAR_BG_COLORS, AVATAR_TEXT_COLORS } from "@/utils/colors";
import type { Json } from "@/supabase/db_types";

const md = new Remarkable({
  breaks: true,
  html: false, // Security: Disabled to prevent XSS from untrusted WhatsApp messages
  linkify: true,
  typographer: true,
});

export function Markdown({
  content,
  direction,
  onInput,
  withoutEndingSpace,
}: {
  content: string;
  direction: MessageRow["direction"];
  onInput?: FormEventHandler<HTMLDivElement>;
  withoutEndingSpace?: boolean;
}) {
  // Hack to induce some space to not to overwrite the timestamp.
  if (!withoutEndingSpace) {
    content += "&emsp;&emsp;&emsp;";

    if (direction === "outgoing") {
      content += "&emsp;";
    }
  }

  const renderedHTML = md.render(content);

  return (
    <div
      className="markdown"
      dangerouslySetInnerHTML={{ __html: renderedHTML }}
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
  const isTooLong = type === "json" ? JSON.stringify(body).length > MAX_LENGTH : (body as string).length > MAX_LENGTH;

  return (
    <>
      <div className="relative">
        {/* Content */}
        <div className={"pl-[6px] pt-[6px] pb-[5px] pr-[4px]" + (fixedWidth ? " w-[320px]" : "")}>
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
            <>
              <div className={"scrollbar-hide overflow-x-auto " + (isTooLong && !expanded ? "max-h-[150px] overflow-y-hidden" : "")}>
                <pre
                  dangerouslySetInnerHTML={{
                    __html: prettyPrintJson.toHtml(body as Json, {
                      indent: 2,
                    }),
                  }}
                />
              </div>

              {/* This invisible inline element does not play well with Markdown block elements. */}
              {!!footer && <span className="text-[11px] mx-[4px] invisible">
                {dayjs(timestamp).format("HH:mm")}
                {direction === "outgoing" && (
                  <span className="px-[8px] ml-[3px]"></span>
                )}
              </span>}
            </>
          ) : (
            <div className={"scrollbar-hide overflow-x-auto " + (isTooLong && !expanded ? "max-h-[150px] overflow-y-hidden" : "")}>
              <Markdown
                content={body as string}
                direction={direction}
                onInput={onInput}
                withoutEndingSpace={!!footer}
              />
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
            <div className="text-[13px] text-muted-foreground mt-1">
              {footer}
              <span className="text-[11px] mx-[4px] invisible">
                {dayjs(timestamp).format("HH:mm")}
                {direction === "outgoing" && !!status && (
                  <span className="px-[8px] ml-[3px]"></span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-[11px] text-muted-foreground absolute bottom-[0px] right-[7px] flex items-center">
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
          `${(color && AVATAR_BG_COLORS[color]) || ""} absolute text-foreground border border-border -top-[0.25px]` +
          (display === "picture-left" ? " -left-[38px]" : " -right-[38px]")
        }
      />
    );
  }

  if (display === "name") {
    return (
      <div
        className={`text-[12.8px] p-[6px] pb-0 ${(color && AVATAR_TEXT_COLORS[color]) || ""}`}
      >
        {agent?.name || "?"}
      </div>
    );
  }
}

// Shared in/out message classes. I could not find a better way to do it. - cabra 15/05/2024
const msgRowClasses = "lg:px-[63px] px-[24px] flex";
const avatarMsgRowClasses = "lg:px-[calc(63px+38px)] px-[calc(24px+33px)] flex";

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
  internal
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
          " text-foreground" +
          (first ? " rounded-tr-none" : "") +
          (text ? textMsgMaxWidth : "") +
          (internal ? " bg-incoming-chat-bubble" : " bg-outgoing-chat-bubble")
        }
      >
        {first && (
          <>
            {!!avatar && <Avatar {...avatar} display="picture-right" />}
            <svg className={
              msgTailClasses +
              " -right-[8px]" +
              (internal ? " text-incoming-chat-bubble" : " text-outgoing-chat-bubble")
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
};

export default function Message(props: UIMessage & { message: MessageRow }) {
  const { translate: t } = useTranslation();
  let content;
  let text = false;
  let fixedWidth = false;

  let headerText: string | undefined = undefined;

  if ("tool" in props.message.content && props.message.content.tool) {
    const toolInfo = (props.message.content.tool as ToolInfo["tool"])!;

    const toolName = [
      "label" in toolInfo && toolInfo.label,
      "name" in toolInfo && toolInfo.name
    ].filter(Boolean).join("__");

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
        status={props.message.direction === "outgoing" ? props.message.status : undefined}
        fixedWidth={fixedWidth}
      />
    );
    text = true;
  } else if (props.message.content.type === "data") {
    content = (
      <TextMessage
        header={headerText}
        body={props.message.content.data}
        type="json"
        direction={props.message.direction}
        timestamp={props.message.timestamp}
        status={props.message.direction === "outgoing" ? props.message.status : undefined}
        fixedWidth={fixedWidth}
      />
    );
    text = true;
  } else if (props.message.content.type === "file") {
    switch (props.message.content.kind) {
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
      case "sticker":
      case "video": {
        content = <ImageMessage {...props.message} />;
        break;
      }
      case "document":
      default: {
        content = <DocumentMessage {...props.message} />;
        break;
      }
    }
  }

  return (
    <>
      {props.message.direction === "incoming" && (
        <InMessage {...{ ...props, text, fixedWidth }}>{content}</InMessage>
      )}
      {(props.message.direction === "outgoing" || props.message.direction === "internal") && (
        <OutMessage {...{ ...props, text, internal: props.message.direction === "internal", fixedWidth }}>{content}</OutMessage>
      )}
    </>
  );
}
