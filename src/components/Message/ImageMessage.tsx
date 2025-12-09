import { type ReactEventHandler, useEffect, useState } from "react";
import StatusIcon from "./StatusIcon";
import { useMedia } from "@/hooks/useMedia";
import { fileSize } from "./DocumentMessage";
import dayjs from "dayjs";
import { Image, Space } from "antd";
import {
  DownloadOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import styles from "./ImageMessagePreviewer.module.css";
import { type MessageRow, type OutgoingStatus } from "@/supabase/client";
import { Markdown } from "./Message";
import { useTranslation } from "@/hooks/useTranslation";

const PORTRAIT_WIDTH = 240;
const LANDSCAPE_WIDTH = 320;
const MAX_PORTRAIT_HEIGHT = (PORTRAIT_WIDTH * 4) / 3;
const MAX_LANDSCAPE_HEIGHT = (LANDSCAPE_WIDTH * 3) / 4;

export default function ImageMessage(message: MessageRow) {
  if (!(message.direction === "incoming" || message.direction === "outgoing")) {
    throw new Error(`Message with id ${message.id} is not a BaseMessage.`);
  }

  const content = message.content;

  if (
    content.type !== "file" ||
    (content.kind !== "image" &&
      content.kind !== "sticker" &&
      content.kind !== "video")
  ) {
    throw new Error(
      `Message with id ${message.id} is not an image/sticker/video message.`,
    );
  }

  const media = content.file;

  const { load, startLoad, cancelLoad, handleLoad } = useMedia(message);
  const [width, setWidth] = useState(PORTRAIT_WIDTH);
  const [height, setHeight] = useState(MAX_PORTRAIT_HEIGHT);
  const [showAnnotation, setShowAnnotation] = useState(false);

  const { translate: t } = useTranslation();

  useEffect(() => {
    // Start the upload right away.
    if (load.type === "upload" && load.status === "pending") {
      startLoad();
    }

    // Auto download if the message is recent.
    if (
      load.type === "download" &&
      load.status === "pending" &&
      dayjs(message.timestamp).isAfter(dayjs().subtract(1, "day"))
    ) {
      startLoad();
    }
  }, [load.blob]);

  const imageDimensions: ReactEventHandler<HTMLImageElement> = (event) => {
    if (!(event.target instanceof HTMLImageElement)) {
      return;
    }

    const img = event.target;

    const isPortrait = img.naturalHeight >= img.naturalWidth; // or squared

    const width = isPortrait ? PORTRAIT_WIDTH : LANDSCAPE_WIDTH;
    const maxHeight = isPortrait ? MAX_PORTRAIT_HEIGHT : MAX_LANDSCAPE_HEIGHT;

    const factor = img.naturalWidth / width;
    const height = img.naturalHeight / factor;

    setWidth(width);
    setHeight(Math.min(maxHeight, height));
  };

  return (
    <>
      <div
        className={
          "rounded-md flex items-center justify-center cursor-pointer relative"
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
        {/* Image */}
        {load.blob && (
          <>
            <div className="absolute top-0">
              {" "}
              {/* antd.Image does not absolute, hence, absolute it in a parent div */}
              <Image
                src={URL.createObjectURL(load.blob)}
                onLoad={imageDimensions}
                className="rounded-md object-cover"
                preview={{
                  toolbarRender: (
                    _,
                    {
                      transform: { scale },
                      actions: {
                        onFlipY,
                        onFlipX,
                        onRotateLeft,
                        onRotateRight,
                        onZoomOut,
                        onZoomIn,
                      },
                    },
                  ) => {
                    return (
                      <Space size={18} className={styles.toolbarWrapper}>
                        <DownloadOutlined
                          className={styles.anticon}
                          onClick={() => handleLoad(media.name)}
                        />
                        <SwapOutlined
                          className={styles.anticon}
                          rotate={90}
                          onClick={onFlipY}
                        />
                        <SwapOutlined
                          className={styles.anticon}
                          onClick={onFlipX}
                        />
                        <RotateLeftOutlined
                          className={styles.anticon}
                          onClick={onRotateLeft}
                        />
                        <RotateRightOutlined
                          className={styles.anticon}
                          onClick={onRotateRight}
                        />
                        <ZoomOutOutlined
                          className={styles.anticon}
                          disabled={scale === 1}
                          onClick={onZoomOut}
                        />
                        <ZoomInOutlined
                          className={styles.anticon}
                          disabled={scale === 50}
                          onClick={onZoomIn}
                        />
                      </Space>
                    );
                  },
                }}
                height={height}
                width={width}
              />
            </div>

            {/* Shadow */}
            {!content.text && (
              <div className="absolute rounded-md z-[1] h-[30px] bottom-0 w-full shadow-[inset_0_-30px_10px_-10px_rgba(0,0,0,0.4)]" />
            )}
          </>
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
              "pl-[6px] pb-[5px] pr-[4px] text-gray-dark" +
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
                type={message.direction}
              />
            )}
            <div
              className="text-blue-ack cursor-pointer"
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
            !load.blob
            ? " text-gray-dark"
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
