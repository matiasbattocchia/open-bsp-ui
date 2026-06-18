import { type ReactEventHandler, useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
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
  const [started, setStarted] = useState(false);
  const [showAnnotation, setShowAnnotation] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // When the video is loaded and there is no caption/description below it, the
  // timestamp overlays the video itself (as in ImageMessage). The native player
  // puts its controls along the bottom, so — unlike an image — the overlay goes
  // at the top to stay clear of them.
  const overlayTimestamp =
    !!src &&
    !content.text &&
    !(content.artifacts && content.artifacts.length > 0);

  return (
    <>
      <div
        className={
          "rounded-md relative overflow-hidden" +
          // Before load: a clickable placeholder. Once loaded, the native
          // <video> owns the whole frame, so the wrapper adds no
          // cursor/click-target/background that would interfere with its
          // controls (those caused the play button to dim and the cursor to
          // drop back to the default arrow over the controls).
          (src
            ? ""
            : " flex items-center justify-center cursor-pointer" +
              " bg-black/5 dark:bg-white/5")
        }
        style={{ height, width }}
        onClick={
          src
            ? undefined
            : () => {
                if (load.status === "pending" || load.status === "error") {
                  startLoad();
                } else if (load.status === "loading") {
                  cancelLoad();
                }
              }
        }
      >
        {/* Video — fills the frame, which is itself sized to the video's aspect
            ratio (see videoDimensions) so it adapts like an image does. */}
        {src && (
          <video
            ref={videoRef}
            src={src}
            controls
            onLoadedMetadata={videoDimensions}
            className="message-video absolute inset-0 h-full w-full cursor-pointer rounded-md bg-black object-cover"
          />
        )}

        {/* Custom play button shown until playback starts. It is a real,
            full-frame button: it covers the video and owns all hovering/clicks,
            so Chrome's native overlay play button underneath (which dims on
            hover and shows the default cursor, and whose internal state cannot
            be restyled) is never the hover target. Clicking it starts playback,
            after which the native controls take over. */}
        {src && !started && (
          <button
            type="button"
            onClick={() => {
              void videoRef.current?.play();
              setStarted(true);
            }}
            className="absolute inset-0 z-[1] flex cursor-pointer items-center justify-center"
          >
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[rgba(11,20,26,.35)] text-white">
              <Play
                className="h-[22px] w-[22px] translate-x-[1px]"
                fill="currentColor"
              />
            </div>
          </button>
        )}

        {/* Top shadow — keeps the overlaid timestamp legible (mirrors the
            bottom shadow in ImageMessage, flipped to the top to clear the
            native controls). pointer-events-none so it never blocks the player. */}
        {overlayTimestamp && (
          <div className="pointer-events-none absolute top-0 z-[1] h-[30px] w-full rounded-md shadow-[inset_0_30px_10px_-10px_rgba(0,0,0,0.4)]" />
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
          <Markdown
            content={content.text || ""}
            direction={message.direction}
          />
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
          "z-[2] text-[11px] absolute right-[7px] flex items-center" +
          (overlayTimestamp
            ? " text-white top-[3px]"
            : " text-muted-foreground bottom-[0px]")
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
