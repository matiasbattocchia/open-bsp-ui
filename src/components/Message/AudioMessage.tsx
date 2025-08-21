import { useEffect, useState } from "react";
import StatusIcon from "./StatusIcon";
import { useMedia } from "@/hooks/useMedia";
import Avatar from "../Avatar";
import { AudioVisualizer } from "react-audio-visualize";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { nameInitials } from "../ChatListItem/ChatListItem";
import { MessageRow, OutgoingStatus } from "@/supabase/client";
dayjs.extend(duration);

export default function AudioMessage({
  message,
  orgName,
  convName,
}: {
  message: MessageRow;
  orgName: string;
  convName: string;
}) {
  if (!(message.type === "incoming" || message.type === "outgoing")) {
    throw new Error(`Message with id ${message.id} is not a BaseMessage.`);
  }

  if (!message.message.media) {
    throw new Error(`Message with id ${message.id} has no media property.`);
  }

  const { load, startLoad, cancelLoad } = useMedia(message);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [paused, setPaused] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekTime, setSeekTime] = useState(0);

  useEffect(() => {
    // Start the upload right away.
    if (load.type === "upload" && load.status === "pending") {
      startLoad();
    }

    if (load.blob) {
      // TODO: initialize a zeroed audio blob as a placeholder - cabra 05/06/2024
      const audio = new Audio(URL.createObjectURL(load.blob));

      audio.ondurationchange = () => setDuration(audio.duration);
      audio.ontimeupdate = () => setTime(audio.currentTime);
      audio.onpause = () => setPaused(true);
      audio.onplay = () => setPaused(false);
      audio.onended = () => {
        audio.currentTime = 0;
        setTime(0);
      };

      setAudio(audio);
    }
  }, [load.blob]);

  return (
    <div className={"w-[320px]"}>
      {/* Audio player */}
      <div
        className={
          "py-[3px] flex items-center" +
          (message.type === "incoming"
            ? " pl-[11px] pr-[7px]"
            : " pr-[11px] pl-[7px]")
        }
      >
        {/* Controls */}
        <div
          className={
            "grow flex items-center pb-[5px]" +
            (message.type === "incoming" ? " mr-[11px]" : " ml-[11px]")
          }
        >
          {/* Load/Play/Pause button */}
          <button
            className="mr-[12px] -mt-[1px]"
            onClick={() => {
              if (load.status === "done") {
                if (audio && paused) {
                  audio.play();
                }
                if (audio && !paused) {
                  audio.pause();
                }
              } else if (load.status === "loading") {
                cancelLoad();
              } else {
                startLoad();
              }
            }}
          >
            {(load.status === "pending" || load.status === "error") && (
              <svg
                className={
                  "w-[34px] h-[34px] text-gray-light transition" +
                  (load.type === "upload" ? " -scale-y-100" : "")
                }
              >
                <use href="/icons.svg#download" />
              </svg>
            )}
            {load.status === "loading" && (
              <svg className="w-[34px] h-[34px]">
                <use className="text-gray-light" href="/icons.svg#cancel" />
                <use className="text-gray-light spin" href="/icons.svg#spin" />
              </svg>
            )}
            {load.status === "done" && (
              <>
                {paused && (
                  <svg className="w-[34px] h-[34px]">
                    <use className="text-[#728977]" href="/icons.svg#play" />
                  </svg>
                )}
                {!paused && (
                  <svg className="w-[34px] h-[34px]">
                    <use className="text-[#728977]" href="/icons.svg#pause" />
                  </svg>
                )}
              </>
            )}
          </button>

          {/* Progress bar #09d261 */}
          <div className="relative px-[12px]">
            {audio && (
              <input
                className={
                  "left-[6px] h-full absolute cursor-pointer" +
                  (true
                    ? " [&::-moz-range-thumb]:bg-[#4fc3f7] [&::-webkit-slider-thumb]::bg-[#4fc3f7]"
                    : " [&::-moz-range-thumb]:bg-gray-light [&::-webkit-slider-thumb]::bg-gray-light")
                }
                type="range"
                min={0}
                max={duration}
                step={0.01}
                value={seekTime || time}
                onInput={(event) => {
                  setSeekTime(Number(event.currentTarget.value));
                }}
                onMouseUp={(event) => {
                  if (!audio) {
                    return;
                  }
                  audio.currentTime = Number(event.currentTarget.value);
                  setTime(Number(event.currentTarget.value));
                  setSeekTime(0);
                }}
              />
            )}
            <AudioVisualizer
              blob={load.blob}
              width={166}
              height={24}
              barWidth={2.5}
              gap={1.5}
              barColor={"#b0ceae"}
              barPlayedColor={"#728977"}
              currentTime={seekTime || time}
            />
            {duration > 0 && (
              <div className="absolute left-0 -bottom-[22px] text-[11px] text-[#ced0d1]">
                {dayjs.duration(time || duration, "seconds").format("m:ss")}
              </div>
            )}
            {/* Timestamp */}
            <div
              className={
                "text-[11px] text-gray-dark absolute -bottom-[22px] flex items-center" +
                (message.type === "incoming" ? " right-0" : " -right-[7px]")
              }
            >
              {dayjs(message.timestamp).format("HH:mm")}
              {message.type === "outgoing" && (
                <StatusIcon {...(message.status as OutgoingStatus)} />
              )}
            </div>
          </div>
        </div>

        {/* Avatar */}
        <div
          className={
            "relative" +
            (message.type === "incoming" ? " order-last" : " order-first")
          }
        >
          <Avatar
            // TODO: use agent name and pic - cabra 16/01/2025
            fallback={nameInitials(
              (message.type === "incoming" ? convName : orgName) || "?",
            )}
            size={55}
            className="bg-blue-400 text-xl"
          />
          <svg
            className={
              "w-[19px] h-[26px] absolute -bottom-[2px]" +
              (message.type === "incoming" ? " left-0" : " right-0")
            }
          >
            {/* TODO: out message mic background should match the green background of the message - cabra 05/06/2024 */}
            <use className="text-[#4d5f56]" href="/icons.svg#mic" />
          </svg>
        </div>
      </div>

      {/* Caption */}
      {message.message.content && (
        <div className="pl-[6px] pt-[6px] pb-[5px] pr-[4px] text-gray-dark">
          {message.message.content}
        </div>
      )}
    </div>
  );
}
