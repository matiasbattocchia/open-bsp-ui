import { useEffect, useRef, useState } from "react";
import { Badge } from "antd";
import useBoundStore from "@/stores/useBoundStore";
import { type FileDraft } from "@/stores/chatSlice";
import {
  isImage,
  extension,
  iconName,
  fileSize,
} from "@/components/Message/DocumentMessage";
import { newMessage, pushMessageToStore } from "@/utils/MessageUtils";
import { saveDraft } from "@/utils/ConversationUtils";
import { pushConversationToDb } from "@/utils/ConversationUtils";

import { useCurrentAgent } from "@/queries/useAgents";

// ...

const FilePreviewer = () => {
  const { data: agent } = useCurrentAgent();
  const agentId = agent?.id;
  const activeConvId = useBoundStore((store) => store.ui.activeConvId);
  const conv = useBoundStore((store) =>
    store.chat.conversations.get(store.ui.activeConvId || ""),
  );
  const drafts = useBoundStore((store) =>
    store.chat.fileDrafts.get(store.ui.activeConvId || ""),
  );
  const setConversationFileDrafts = useBoundStore(
    (store) => store.chat.setConversationFileDrafts,
  );
  const setConversationFileDraftCaption = useBoundStore(
    (store) => store.chat.setConversationFileDraftCaption,
  );
  const setConversationTextDraft = useBoundStore(
    (store) => store.chat.setConversationTextDraft,
  );
  const sendAsContact = useBoundStore((store) => store.ui.sendAsContact);
  const setMediaLoad = useBoundStore((store) => store.chat.setMediaLoad);
  const convType = conv?.extra?.type;

  const [previewIndex, setPreviewIndex] = useState(0);

  const editableDiv = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewIndex(0);
  }, [activeConvId]);

  useEffect(() => {
    if (!editableDiv.current || !drafts) {
      return;
    }

    editableDiv.current.textContent = drafts[previewIndex].caption || "";
    editableDiv.current.focus();
  }, [drafts?.length, previewIndex]);

  const unloadDrafts = () => {
    if (!activeConvId || !drafts) {
      return;
    }

    const textDraft = drafts
      .map((draft) => draft.caption)
      .filter((caption) => !!caption)
      .join("\n\n");

    setConversationTextDraft(activeConvId, textDraft || "");
  };

  const resetFiles = () => {
    if (!activeConvId) {
      return;
    }

    setPreviewIndex(0);
    setConversationFileDrafts(activeConvId, []);
  };

  // TODO: should be able to quit pressing ESC - cabra 01/06/2024
  const quitPreviewer = () => {
    // First unload, then reset to populate the textDraft
    unloadDrafts();
    resetFiles();
  };

  const removeFile = (index: number) => {
    if (!activeConvId || !drafts) {
      return;
    }

    const draftsCopy = Array.from(drafts);
    draftsCopy.splice(index, 1); // or just use Array.toSpliced instead of shallow copying

    setConversationFileDrafts(activeConvId, draftsCopy);

    if (index <= previewIndex && previewIndex > 0) {
      setPreviewIndex(previewIndex - 1);
    }
  };

  const addFiles = (files: FileList | null) => {
    if (!files || !activeConvId || !drafts) {
      return;
    }

    const newDrafts = Array.from(files).map<FileDraft>((file) => ({ file }));

    setConversationFileDrafts(activeConvId, drafts.concat(newDrafts));

    setPreviewIndex(drafts.length); // set the index on the first of the new files
  };

  const sendMediaMessages = async () => {
    if (!activeConvId || !conv || !drafts) {
      return;
    }

    // If the conv has the `updated_at` unset, it means it has not been pushed to the DB yet.
    !conv.updated_at && await pushConversationToDb(conv);

    for (const draft of drafts) {
      const fileKind = isImage(draft.file.type) ? "image" : "document";

      const record = newMessage(
        conv,
        convType === "group"
          ? "internal"
          : sendAsContact
            ? "incoming"
            : "outgoing",
        {
          version: "1",
          type: "file",
          kind: fileKind,
          file: {
            uri: "", // Will be set by newMessage
            mime_type: draft.file.type,
            name: draft.file.name,
            size: draft.file.size,
          },
          text: draft.caption, // caption
        },
        agentId,
        draft.file,
      );

      setMediaLoad(record.id!, {
        type: "upload",
        status: "pending",
        blob: draft.file,
      });

      pushMessageToStore(record);
    }

    setConversationTextDraft(activeConvId, "");
    (conv.extra as any)?.draft && saveDraft(conv, "", sendAsContact);
    resetFiles();
  };

  const previewDraft = drafts && drafts[previewIndex];

  /**
   * File Picker TODO
   *
   * 1. Sombras de previsualización y botón de enviar
   * 2. Contención de la previsualización (ahora atado con alambre)
   * 3. Estilo badge botón enviar
   * 4. Placeholder caption ("escribe un mensaje")
   * 5. Sombra botón quitar
   * 6. Hover botón quitar (hacerlo con CSS)
   * 7. Cartel de previsualización no disponible
   * 8. Borrador en ChatListItem (si guarda borrador y se cierra, el borrador permanece y escribe el mensaje)
   * 9. Títulos (tooltips) botones?
   */
  return (
    activeConvId &&
    previewDraft && (
      <div className="flex flex-col bg-gray z-20 absolute h-full w-full">
        {/* Close button - Filename */}
        <div className="py-[8px] px-[16px] min-h-[60px] flex justify-between items-center">
          <button onClick={quitPreviewer}>
            <svg className="w-[24px] h-[24px] text-gray-icon">
              <use href="/icons.svg#x" />
            </svg>
          </button>
          <div className="grow flex justify-center items-center mx-[16px] pr-[24px]">
            <span className="text-[14px]">{previewDraft.file.name}</span>
          </div>
        </div>

        {/* Preview area */}
        <div className="grow flex flex-col items-center justify-center m-[16px]">
          {isImage(previewDraft.file.type) ? (
            <img
              src={URL.createObjectURL(previewDraft.file)}
              className="max-h-[25vw] max-w-[25hw]"
            /> // TODO: not to memoize URL.createObjectURL could be potentially *stupid* - cabra 30/05/2024
          ) : (
            <>
              <img src={iconName(previewDraft.file.name)} height={90} />

              <div className="text-gray-dark py-[3px] text-[12px]">
                <span className="uppercase">
                  {extension(previewDraft.file.name)}
                </span>
                <span className="mx-[3px]">•</span>
                <span>{fileSize(previewDraft.file.size)}</span>
              </div>
            </>
          )}
        </div>

        {/* Caption input */}
        <div className="shrink-0 py-[8px] mx-[80px] flex justify-center items-center">
          <div
            ref={editableDiv}
            contentEditable
            className="relative grow max-w-[650px] py-[10px] px-[13px] bg-white rounded-lg outline-none max-h-20 overflow-y-auto text-[18px] leading-[24px] break-words"
            onInput={(event) => {
              if (!(event.target instanceof Element)) {
                return;
              }
              setConversationFileDraftCaption(
                activeConvId,
                previewIndex,
                event.target.textContent || "",
              );
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && event.ctrlKey) {
                // toggle("sendAsContact") is handled at window level, nonetheless this
                // no-op block prevents from sending the message when pressing ctrl+enter
              } else if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMediaMessages();
              }
            }}
          />
        </div>

        {/* Carousel */}
        <div className="flex justify-between items-center mx-[16px] py-[16px]">
          {/* Files */}
          <div className="grow flex justify-center items-center mx-[16px] mt-[4px] min-w-0 pl-[60px]">
            <div className="flex justify-center items-center overflow-x-auto">
              {drafts.map((draft, index) => {
                return (
                  <div
                    className={
                      "shrink-0 rounded-md flex justify-center items-center relative cursor-pointer" +
                      (previewIndex === index
                        ? " border-[3px] border-blue-400 w-[56px] h-[56px] mx-[3px] mt-[6px] mb-[8px]"
                        : " border border-[#d1d7db] w-[52px] h-[52px] mx-[5px] mt-[8px] mb-[10px]")
                    }
                    key={index}
                    onClick={() => {
                      setPreviewIndex(index);
                    }}
                  >
                    {/* Remove file button */}
                    <button
                      className="top-[1px] right-[1px] absolute z-10"
                      onClick={(e) => {
                        e.stopPropagation(); // prevent image being deleted from being selected
                        removeFile(index);
                      }}
                    >
                      <svg className="w-[24px] h-[24px] text-white">
                        <use href="/icons.svg#x-alt" />
                      </svg>
                    </button>

                    {isImage(draft.file.type) ? (
                      <img
                        src={URL.createObjectURL(draft.file)} // TODO: this is potentially *stupid* - cabra 30/05/2024
                        className="object-cover w-[50px] h-[50px] rounded-sm"
                      />
                    ) : (
                      <img
                        src={iconName(draft.file.name)}
                        width={26}
                        height={30}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div>
              {/* Add files */}
              <div>
                <input
                  ref={fileInput}
                  type="file"
                  multiple={true}
                  accept="*/*"
                  className="hidden"
                  onChange={(event) => {
                    addFiles(event.target.files);
                  }}
                />
                <button
                  className="border border-[#d1d7db] mx-[5px] mt-[8px] mb-[10px] w-[52px] h-[52px] rounded-md flex justify-center items-center"
                  onClick={() => fileInput.current?.click()}
                >
                  <svg className="w-[24px] h-[24px] text-gray-icon">
                    <use href="/icons.svg#attach" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Send button */}
          <div className="mx-4 mt-1">
            <Badge
              count={drafts.length > 1 ? drafts.length : 0}
              style={{ backgroundColor: "white", color: "#3b82f6" }}
            >
              <button
                onClick={sendMediaMessages}
                className="h-[60px] w-[60px] bg-blue-400 rounded-full flex justify-center items-center"
              >
                <svg
                  className={
                    "mb-[1px] w-[24px] h-[24px] text-white transition" +
                    (sendAsContact ? " -scale-x-100 mr-[4px] " : " ml-[4px] ")
                  }
                >
                  <use href="/icons.svg#send" />
                </svg>
              </button>
            </Badge>
          </div>
        </div>
      </div>
    )
  );
};

export default FilePreviewer;
