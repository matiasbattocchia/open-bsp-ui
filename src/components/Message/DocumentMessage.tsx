import { useEffect, useState } from "react";
import StatusIcon from "./StatusIcon";
import { useMedia } from "@/hooks/useMedia";
import { type MessageRow, type OutgoingStatus } from "@/supabase/client";
import dayjs from "dayjs";
import { Markdown } from "./Message";
import { useTranslation } from "@/hooks/useTranslation";

export function extension(filename: string | undefined) {
  return filename?.split(".").slice(-1)[0]?.toLowerCase();
}

export function iconName(filename: string | undefined) {
  switch (extension(filename)) {
    case "pdf":
      return "/pdf.png";
    case "doc":
    case "docx":
      return "/doc.png";
    case "xls":
    case "xlsx":
      return "/xls.png";
    default:
      return "/file.png";
  }
}

export function fileSize(size: number) {
  if (isNaN(size)) {
    return;
  }

  const KB = Math.round(size / 1000);

  if (KB < 1000) {
    return `${KB} KB`;
  }

  const MB = Math.round(KB / 1000);

  return `${MB} MB`;
}

export function mediaType(type: string) {
  switch (type.split("/")[0]) {
    case "audio":
      return "Audio";
    case "application":
      return "Documento";
    case "image":
      return "Imagen";
    case "sticker":
      return "Pegatina";
    case "video":
      return "Video";
    default:
      return "Archivo";
  }
}

export function isImage(type: string) {
  return type.split("/")[0] === "image";
}

export default function DocumentMessage(message: MessageRow) {
  if (!(message.direction === "incoming" || message.direction === "outgoing")) {
    throw new Error(`Message with id ${message.id} is not a BaseMessage.`);
  }

  const content = message.content;

  if (content.type !== "file" || content.kind !== "document") {
    throw new Error(`Message with id ${message.id} is not a document message.`);
  }

  const media = content.file;

  const { load, startLoad, cancelLoad, handleLoad } = useMedia(message);
  const [showAnnotation, setShowAnnotation] = useState(false);

  const { translate: t } = useTranslation();

  useEffect(() => {
    // Start the upload right away.
    if (load.type === "upload" && load.status === "pending") {
      startLoad();
    }

    // Save the file after it has finished.
    if (
      !load.handledOnce &&
      load.type === "download" &&
      load.status === "done"
    ) {
      handleLoad(media.name);
    }
  }, [load.blob]);

  return (
    <div
      className={
        "w-[320px]" + (content.text || content.artifacts ? "" : " pb-[25px]")
      }
    >
      {/* File */}
      <div
        className={
          "py-[13px] px-[19px] rounded-md flex items-start cursor-pointer" +
          (message.direction === "outgoing" ? " bg-blue-200" : " bg-[#f5f6f6]")
        }
        onClick={() => {
          if (load.status === "done") {
            handleLoad(media.name);
          } else if (load.status === "loading") {
            cancelLoad();
          } else {
            startLoad();
          }
        }}
      >
        {/* Icon */}
        <img src={iconName(media.name)} width={26} height={30} />

        {/* Info */}
        <div className="mx-[10px] -top-[2px] grow min-w-0 relative">
          <div>{media.name || mediaType(media.mime_type)}</div>
          <div className="text-muted-foreground py-[3px] text-[12px]">
            <span className="uppercase">{extension(media.name)}</span>
            {media.name && !isNaN(media.size) && (
              <span className="mx-[3px]">•</span>
            )}
            <span>{fileSize(media.size)}</span>
          </div>
        </div>

        {/* Load button */}
        {(load.status === "pending" || load.status === "error") && (
          <div>
            <svg
              className={
                "w-[34px] h-[34px] text-gray-light transition" +
                (load.type === "upload" ? " -scale-y-100" : "")
              }
            >
              <use href="/icons.svg#download" />
            </svg>
          </div>
        )}
        {load.status === "loading" && (
          <div>
            <svg className="w-[34px] h-[34px]">
              <use className="text-gray-light" href="/icons.svg#cancel" />
              <use className="text-gray-light spin" href="/icons.svg#spin" />
            </svg>
          </div>
        )}
      </div>

      {/* Caption */}
      {content.text && (
        <div className="pl-[6px] pt-[6px] pb-[5px] pr-[4px]">
          <Markdown content={content.text || ""} type={message.direction} />
        </div>
      )}

      {/* Description - from artifacts with kind "description" */}
      {content.artifacts &&
        content.artifacts.some(
          (a) => a.type === "text" && a.kind === "description",
        ) && (
          <div
            className={
              "pl-[6px] pb-[5px] pr-[4px] text-muted-foreground" +
              (content.text ? "" : " pt-[6px]")
            }
          >
            {showAnnotation && (
              <Markdown
                content={(() => {
                  const description = content.artifacts.find(
                    (a) => a.type === "text" && a.kind === "description",
                  );
                  return description?.type === "text"
                    ? description.text || ""
                    : "";
                })()}
                type={message.direction}
              />
            )}
            <div
              className="text-primary cursor-pointer"
              onClick={() => setShowAnnotation(!showAnnotation)}
            >
              {showAnnotation
                ? t("ocultar descripción...")
                : t("ver descripción...")}
            </div>
          </div>
        )}

      {/* Timestamp */}
      <div className="text-[11px] text-muted-foreground absolute bottom-[0px] right-[7px] flex items-center">
        {dayjs(message.timestamp).format("HH:mm")}
        {message.direction === "outgoing" && (
          <StatusIcon {...(message.status as OutgoingStatus)} />
        )}
      </div>
    </div>
  );
}
