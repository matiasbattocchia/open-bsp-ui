import { type ReactEventHandler, useEffect, useState } from "react";
import StatusIcon from "./StatusIcon";
import { useMedia } from "@/hooks/useMedia";
import { fileSize } from "./DocumentMessage";
import dayjs from "dayjs";
import { type MessageRow, type OutgoingStatus } from "@/supabase/client";
import { Markdown } from "./Message";
import { mediaCategory } from "./media";
import { useTranslation } from "@/hooks/useTranslation";

const PORTRAIT_WIDTH = 240;
const LANDSCAPE_WIDTH = 320;
const MAX_PORTRAIT_HEIGHT = (PORTRAIT_WIDTH * 4) / 3;
const MAX_LANDSCAPE_HEIGHT = (LANDSCAPE_WIDTH * 3) / 4;

export default function VideoMessage(message: MessageRow) {
  if (!(message.direction === "incoming" || message.direction === "outgoing")) {
    throw new Error(`Message with id ${message.id} is not a BaseMessage.`);
  }

  const content = message.content;

  if (
    content.type !== "file" ||
    mediaCategory(content.kind, content.file.mime_type || "") !== "video"
  ) {
    throw new Error(`Message with id ${message.id} is not a video message.`);
  }

  const media = content.file;

  const { load, startLoad, cancelLoad } = useMedia(message);
  const [width, setWidth] = useState(PORTRAIT_WIDTH);
  const [height, setHeight] = useState(MAX_PORTRAIT_HEIGHT);
  const [src, setSrc] = useState<string>();
  const [showAnnotation, setShowAnnotation] = useState(false);

  const { translate: t } = useTranslation();

  useEffect(() => {
    // Start the upload right away.
    if (load.type === "upload" && load.status === "pending") {
      startLoad();
    }
    // Unlike images, videos are not auto-downloaded — they can be heavy, so the
    // user opts in by clicking the load button.
  }, [load.blob]);

  // Build a stable object URL per blob (and revoke it on change/unmount) so the
  // <video> source is not recreated on every render, which would interrupt
  // playback.
  useEffect(() => {
    if (!load.blob) {
      setSrc(undefined);
      return;
    }

    const url = URL.createObjectURL(load.blob);
    setSrc(url);

    return () => URL.revokeObjectURL(url);
  }, [load.blob]);

  const videoDimensions: ReactEventHandler<HTMLVideoElement> = (event) => {
    if (!(event.target instanceof HTMLVideoElement)) {
      return;
    }

    const video = event.target;

    const isPortrait = video.videoHeight >= video.videoWidth; // or squared

    const width = isPortrait ? PORTRAIT_WIDTH : LANDSCAPE_WIDTH;
    const maxHeight = isPortrait ? MAX_PORTRAIT_HEIGHT : MAX_LANDSCAPE_HEIGHT;

    const factor = video.videoWidth / width;
    const height = video.videoHeight / factor;

    setWidth(width);
    setHeight(Math.min(maxHeight, height));
  };

  return (
    <>
      <div
        className={
          "rounded-md flex items-center justify-center cursor-pointer relative" +
          " bg-black/5 dark:bg-white/5"
        }
        style={{ height, width }}
        onClick={() => {
          if (load.status === "pending" || load.status === "error") {
            startLoad();
          } else if (load.status === "loading") {
            cancelLoad();
          }
        }}
      >
        {/* Video */}
        {src && (
          <video
            src={src}
            controls
            onLoadedMetadata={videoDimensions}
            className="rounded-md object-cover"
            height={height}
            width={width}
            // The element renders its own controls; let clicks reach it instead
            // of the wrapper's load/cancel handler.
            onClick={(event) => event.stopPropagation()}
          />
        )}

        {/* Load button */}
        {(load.status === "pending" || load.status === "error") &&
          !isNaN(media.size) && (
            <div className="z-[1] rounded-full h-[44px] pl-[13px] pr-[18px] flex items-center text-white bg-[rgba(11,20,26,.35)] text-[13px]">
              <svg
                className={
                  "w-[24px] h-[24px] transition" +
                  (load.type === "upload" ? " -scale-y-100" : "")
                }
              >
                <use href="/icons.svg#image-download" />
              </svg>

              <div className="ml-[5px]">{fileSize(media.size)}</div>
            </div>
          )}
        {/* Alternative load button for when file size is missing, just in case */}
        {(load.status === "pending" || load.status === "error") &&
          isNaN(media.size) && (
            <div className="z-[1] rounded-full flex items-center justify-center text-white bg-[rgba(11,20,26,.35)] w-[44px] h-[44px]">
              <svg
                className={
                  "w-[24px] h-[24px] transition" +
                  (load.type === "upload" ? " -scale-y-100" : "")
                }
              >
                <use href="/icons.svg#image-download" />
              </svg>
            </div>
          )}
        {load.status === "loading" && (
          <div className="z-[1] rounded-full text-white bg-[rgba(11,20,26,.35)]">
            <svg className="w-[44px] h-[44px]">
              <use href="/icons.svg#image-cancel" />
              <use className="text-white spin" href="/icons.svg#image-spin" />
            </svg>
          </div>
        )}
      </div>

      {/* Caption */}
      {content.text && (
        <div className="pl-[6px] pt-[6px] pb-[5px] pr-[4px]" style={{ width }}>
          <Markdown content={content.text || ""} direction={message.direction} />
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
            style={{ width }}
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
                direction={message.direction}
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
      <div
        className={
          "z-[2] text-[11px] absolute bottom-[0px] right-[7px] flex items-center" +
          (content.text ||
          (content.artifacts && content.artifacts.length > 0) ||
          !src
            ? " text-muted-foreground"
            : " text-white bottom-[3px]")
        }
      >
        {dayjs(message.timestamp).format("HH:mm")}
        {message.direction === "outgoing" && (
          <StatusIcon {...(message.status as OutgoingStatus)} />
        )}
      </div>
    </>
  );
}
