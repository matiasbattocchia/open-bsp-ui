import { useState } from "react";
import { pushMessageToDb } from "@/utils/MessageUtils";
import useBoundStore from "@/store/useBoundStore";
import { MessageInsert, MessageRow, supabase } from "@/supabase/client";

export function useMedia(message: MessageRow) {
  if (!(message.direction === "incoming" || message.direction === "outgoing")) {
    throw new Error(
      `Message with id ${message.id} is not an incoming or outgoing message.`,
    );
  }

  if (message.content.type !== "file") {
    throw new Error(`Message with id ${message.id} is not a file message.`);
  }

  const content = message.content;
  const mediaId = content.file.uri.replace("internal://media/", ""); // Extract path from URI

  if (!mediaId) {
    throw new Error(`Message with id ${message.id} has no valid media URI.`);
  }

  const load = useBoundStore((store) =>
    store.chat.mediaLoads.get(message.id),
  ) || {
    type: "download",
    status: "pending",
    handledOnce: false,
  };
  const setLoad = useBoundStore((store) => store.chat.setMediaLoad);
  const [cancel, setCancel] = useState(false);

  const uploadTask = async () => {
    if (
      !load.blob ||
      load.type === "download" ||
      load.status === "done" ||
      load.status === "loading"
    ) {
      return;
    }

    setLoad(message.id, { ...load, status: "loading", error: undefined });

    const { error } = await supabase.storage
      .from("media")
      .upload(mediaId, load.blob, {
        upsert: true,
      });

    if (cancel) {
      setCancel(false);
      return;
    }

    if (
      error &&
      error.message !== "new row violates row-level security policy" // weird Supabase bug, it might be related to React loading hooks twice during development - cabra 2024/07/30
    ) {
      setLoad(message.id, { ...load, status: "error", error: error.message });
      return;
    }

    setLoad(message.id, { ...load, status: "done" });

    !error && pushMessageToDb(message as MessageInsert);
  };

  const downloadTask = async () => {
    if (load.status === "done" || load.status === "loading") {
      return;
    }

    setLoad(message.id, { ...load, status: "loading", error: undefined });

    const { data, error } = await supabase.storage
      .from("media")
      .download(mediaId);

    if (cancel) {
      setCancel(false);
      return;
    }

    if (error) {
      setLoad(message.id, { ...load, status: "error", error: error.message });
      return;
    }

    setLoad(message.id, { ...load, status: "done", blob: data });
  };

  const startLoad = () => {
    setTimeout(load.type === "upload" ? uploadTask : downloadTask, 0);
  };

  const cancelLoad = () => {
    setCancel(true);
    setLoad(message.id, { ...load, status: "pending" });
  };

  const handleLoad = (filename?: string) => {
    if (!load.blob) {
      return;
    }

    setLoad(message.id, { ...load, handledOnce: true });

    const url = URL.createObjectURL(load.blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename || crypto.randomUUID(); // TODO: improve default filename - cabra 28/05/2024
    a.click();

    URL.revokeObjectURL(url);
    // TODO: do not keep in memory files with size bigger than 10 MB, or... any document after being handled? - cabra 02/06/2024
  };

  return { load, startLoad, cancelLoad, handleLoad };
}
