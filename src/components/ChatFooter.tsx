import { useContext, useEffect, useRef, useState } from "react";
import {
  newMessage,
  pushMessageToStore,
  pushMessageToDb,
} from "@/utils/MessageUtils";
import useBoundStore from "@/stores/useBoundStore";
import {
  pushConversationToDb,
  saveDraft,
} from "@/utils/ConversationUtils";
import { type FileDraft } from "@/stores/chatSlice";
import {
  type Draft,
  type MessageRow,
} from "@/supabase/client";
import { TickContext } from "@/contexts/useTick";
import dayjs from "dayjs";
import "dayjs/locale/es";
import "dayjs/locale/pt";
import { Translate as T, useTranslation } from "@/hooks/useTranslation";
import { useCurrentAgent } from "@/queries/useAgents";
import { moveCursorToEnd } from "@/utils/UtilityFunctions";

export default function ChatFooter() {
  const activeConvId = useBoundStore((store) => store.ui.activeConvId);
  const conv = useBoundStore((store) =>
    store.chat.conversations.get(store.ui.activeConvId || ""),
  );
  const draft: Draft | undefined = conv?.extra?.draft;
  const sendAsContact = useBoundStore((store) => store.ui.sendAsContact);
  const setSendAsContact = useBoundStore((store) => store.ui.setSendAsContact);
  const toggle = useBoundStore((store) => store.ui.toggle);
  const message = useBoundStore((store) =>
    store.chat.textDrafts.get(store.ui.activeConvId || ""),
  );
  const setConversationTextDraft = useBoundStore(
    (store) => store.chat.setConversationTextDraft,
  );
  const setMessage = (message: string) =>
    setConversationTextDraft(activeConvId || "", message);

  const fileDrafts = useBoundStore((store) =>
    store.chat.fileDrafts.get(store.ui.activeConvId || ""),
  );
  const setConversationFileDrafts = useBoundStore(
    (store) => store.chat.setConversationFileDrafts,
  );
  const setFileDrafts = (fileDrafts: FileDraft[]) =>
    setConversationFileDrafts(activeConvId || "", fileDrafts);

  const { data: agent } = useCurrentAgent();
  const agentId = agent?.id;

  const convType = conv?.extra?.type;

  const [timer, setTimer] = useState<ReturnType<typeof setTimeout>>();

  const editableDiv = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const { translate: t, currentLanguage } = useTranslation();

  const tick = useContext(TickContext); // one-minute ticks

  const mostRecentIncoming: MessageRow | undefined = useBoundStore((store) => {
    const msgs = store.chat.messages.get(store.ui.activeConvId || "")?.values();

    if (!msgs) {
      return;
    }

    for (const msg of msgs) {
      if (msg.direction === "incoming") {
        return msg;
      }
    }
  });

  // Wether or not the user is allowed to send messages to the client
  const inCSWindow =
    conv?.service !== "whatsapp" ||
    tick.isBefore(dayjs(mostRecentIncoming?.timestamp || 0).add(1, "day"));

  // WhatsApp customer service window lasts 24 hours since the last contact's message
  const remaining = tick
    .locale(currentLanguage)
    .to(dayjs(mostRecentIncoming?.timestamp || 0).add(1, "day"), true);

  useEffect(() => {
    if (!editableDiv.current) {
      return;
    }

    if (!inCSWindow) {
      editableDiv.current.textContent = "";
      return;
    }

    editableDiv.current.textContent = message || "";

    // do not steal the focus from the file previewer
    if (!fileDrafts?.length && window.matchMedia("(min-width: 768px)").matches) {
      moveCursorToEnd(editableDiv.current);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId, fileDrafts]);

  // Set send as contact
  useEffect(() => {
    if (!activeConvId || !conv) {
      return;
    }

    // Note: conv.extra.draft is a DB stored draft; message (textDraft) is just an UI buffer
    const shouldLoadDraft = inCSWindow && draft?.text && !message; // do not overwrite a current message

    if (draft?.origin === "bot" || draft?.origin === "human-as-organization") {
      // Draft defaults to send as organization
      shouldLoadDraft && setSendAsContact(false);
    } else if (conv.service === "local" && convType !== "group") {
      // Internal testing service defaults to send as contact
      setSendAsContact(true);
    } else {
      // WhatsApp defaults to send as organization
      setSendAsContact(false);
    }

    if (shouldLoadDraft) {
      clearTimeout(timer);

      setMessage(draft.text);

      if (editableDiv.current) {
        editableDiv.current.textContent = draft.text;
        if (window.matchMedia("(min-width: 768px)").matches) {
          moveCursorToEnd(editableDiv.current);
        }
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId, draft]);

  const sendTextMessage = async () => {
    if (!activeConvId || !conv || !message) {
      return;
    }

    clearTimeout(timer);

    // If the conv has the `updated_at` unset, it means it has not been pushed to the DB yet.
    !conv.updated_at && await pushConversationToDb(conv);

    const record = newMessage(
      conv,
      convType === "group"
        ? "internal"
        : sendAsContact
          ? "incoming"
          : "outgoing",
      {
        version: "1",
        type: "text",
        kind: "text",
        text: message,
      },
      agentId,
    );

    pushMessageToStore(record);
    await pushMessageToDb(record);

    setMessage("");
    // TODO: optimization: combine with the updateConvExtra call - cabra 2025-01-16
    draft && saveDraft(conv, "", sendAsContact);

    if (editableDiv.current) {
      editableDiv.current.textContent = "";
    }
  };

  function debounce(fn: () => void, ms: number) {
    clearTimeout(timer);
    setTimer(setTimeout(fn, ms));
  }

  const attachButton = (
    <>
      {/* Attach files button */}
      <button
        disabled={!inCSWindow}
        className={"p-[8px] " + (!inCSWindow ? "" : " cursor-pointer")}
        onClick={() => fileInput.current?.click()}
        title={t("Adjuntar") as string}
      >
        <svg className={"w-[24px] h-[24px] text-foreground"}>
          <use href="/icons.svg#attach" />
        </svg>
      </button>
    </>
  );

  return (
    activeConvId &&
    conv && (
      <div className={"flex items-end text-foreground p-[5px] mx-[12px] mb-[12px] rounded-[24px] shadow-[0_0_4px_0px_rgba(0,0,0,0.1)] z-10" + (!inCSWindow ? " bg-background" : " bg-incoming-chat-bubble")}>
        <div className="shrink-0">
          {attachButton}
        </div>

        <input
          disabled={!inCSWindow}
          ref={fileInput}
          type="file"
          multiple={true}
          className="hidden"
          accept="*/*"
          onChange={(event) => {
            if (!event.target.files?.length) {
              return;
            }

            const drafts = Array.from(event.target.files).map<FileDraft>(
              (file) => ({
                file,
              }),
            );

            drafts[0].caption = message;

            setFileDrafts(drafts);
          }}
        />

        {/* Text input */}
        <div className="relative grow">
          <div
            ref={editableDiv}
            contentEditable={inCSWindow}
            className={`${!inCSWindow ? "cursor-pointer" : ""} outline-none mx-[5px] py-[10px] min-h-[40px] max-h-40 overflow-y-auto text-[15px] leading-[20px] break-words`}
            onInput={(event) => {
              if (!(event.target instanceof Element)) {
                return;
              }
              // TODO: HTML to markdown
              // TODO: DOM sanitizer to prevent injection attacks
              //const message = event.target.textContent || "";
              const message =
                event.target.innerHTML
                  .replace(/<br>/, "")
                  .replace(/<br>/g, "\n")
                  .replace(/<\/div><div>/g, "\n")
                  .replace(/<\/?div>/g, "") || "";

              setMessage(message);

              if (conv.created_at !== conv.updated_at) {
                // no drafts for new convs, sorry!
                debounce(() => saveDraft(conv, message, sendAsContact), 3000); // milliseconds
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && event.ctrlKey) {
                // toggle("sendAsContact") is handled at window level, nonetheless this
                // no-op block prevents from sending the message when pressing ctrl+enter
              } else if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendTextMessage();
              }
            }}
            onClick={() => !inCSWindow && toggle("templatePicker")}
            title={
              inCSWindow
                ? undefined
                : (t(
                  "WhatsApp cierra la conversación a las 24 horas del último mensaje recibido. Para abrir la conversación debes utilizar una plantilla.",
                ) as string)
            }
          />
          {!message && (
            <div
              className={
                "absolute bottom-[1px] py-[10px] mx-[5px] max-h-[40px] text-[15px] text-muted-foreground" +
                (inCSWindow ? "" : " cursor-pointer")
              }
              onClick={() =>
                inCSWindow
                  ? editableDiv.current?.focus()
                  : toggle("templatePicker")
              }
            >
              {!inCSWindow ? (
                <>
                  <T as="span" className="md:hidden">
                    Conversación cerrada
                  </T>
                  <T as="span" className="hidden md:inline">
                    Conversación cerrada, abre la conversación con una plantilla
                  </T>
                </>
              ) : sendAsContact ? (
                <>
                  <T as="span" className="md:hidden">
                    Mensaje entrante
                  </T>
                  <T as="span" className="hidden md:inline">
                    Simula un mensaje entrante
                  </T>
                </>
              ) : conv.service === "whatsapp" ? (
                <>
                  <T as="span" className="md:hidden">
                    Cerrará en
                  </T>
                  <T as="span" className="hidden md:inline">
                    La conversación cerrará en
                  </T>
                  {/* I had to split T and span because react-dialect is not working as expected with interpolated strings - cabra 2024-11-04 */}
                  <span> {remaining}</span>
                </>
              ) : (
                <T as="span">Escribe un mensaje</T>
              )}
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          disabled={!inCSWindow}
          className={"p-[8px] rounded-full bg-primary " + (!inCSWindow ? "" : " cursor-pointer")}
          onClick={() => {
            if (message) {
              sendTextMessage();
            } else if (conv.service === "local" && convType !== "group") {
              // Only the internal service can simulate incoming messages
              toggle("sendAsContact");
            }
          }}
          title={
            (sendAsContact
              ? t("Recibir mensaje")
              : t("Enviar mensaje")) as string
          }
        >
          <svg
            className={
              "w-[24px] h-[24px] transition" +
              (sendAsContact ? " -scale-x-100" : "") +
              (!inCSWindow ? " text-background" : " text-primary-foreground")
            }
          >
            <use href="/icons.svg#send" />
          </svg>
        </button>
      </div>
    )
  );
}
