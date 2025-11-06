import { useContext, useEffect, useRef, useState } from "react";
import {
  newMessage,
  pushMessageToStore,
  pushMessageToDb,
} from "@/utils/MessageUtils";
import useBoundStore from "@/store/useBoundStore";
import {
  pushConversationToDb,
  updateConvExtra,
} from "@/utils/ConversationUtils";
import { FileDraft } from "@/store/chatSlice";
import {
  ConversationRow,
  Draft,
  MessageRow,
  supabase,
  WebhookPayload,
} from "@/supabase/client";
import { TickContext } from "@/context/useTick";
import dayjs from "dayjs";
import "dayjs/locale/es";
import "dayjs/locale/pt";
import { NotepadTextDashed } from "lucide-react";
import { WandSparkles } from "lucide-react";
import { Translate as T, useTranslation } from "react-dialect";
import { Button, Dropdown, MenuProps } from "antd";
import { useQuery } from "@tanstack/react-query";

// Taken from https://phuoc.ng/collection/html-dom/move-the-cursor-to-the-end-of-a-content-editable-element
export async function moveCursorToEnd(element: HTMLDivElement) {
  const range = document.createRange();
  const selection = window.getSelection();
  range.setStart(element, element.childNodes.length);
  range.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

export async function saveDraft(
  conv: ConversationRow,
  text: string | null,
  sendAsContact?: boolean,
) {
  let origin = "human";

  if (sendAsContact !== undefined) {
    origin = sendAsContact ? "human-as-contact" : "human-as-organization";
  }

  const payload = {
    extra: {
      draft: text
        ? {
            text,
            timestamp: new Date().toISOString(),
            origin,
          }
        : null,
    },
  };

  const { error } = await supabase
    .from("conversations")
    .update(payload)
    .eq("organization_address", conv.organization_address)
    .eq("contact_address", conv.contact_address);

  if (error) {
    throw error;
  }
}

export default function ChatFooter() {
  const activeOrgId = useBoundStore((store) => store.ui.activeOrgId);
  const activeConvId = useBoundStore((store) => store.ui.activeConvId);
  const conv = useBoundStore((store) =>
    store.chat.conversations.get(store.ui.activeConvId || ""),
  );
  const draft: Draft | undefined = conv?.extra?.draft;
  const sendAsContact = useBoundStore((store) => store.ui.sendAsContact);
  const setSendAsContact = useBoundStore((store) => store.ui.setSendAsContact);
  const toggle = useBoundStore((store) => store.ui.toggle);
  const templatePicker = useBoundStore((store) => store.ui.templatePicker);
  const message = useBoundStore((store) =>
    store.chat.textDrafts.get(store.ui.activeConvId || ""),
  );
  const setMessage = useBoundStore(
    (store) => (message: string) =>
      store.chat.setConversationTextDraft(store.ui.activeConvId || "", message),
  );
  const fileDrafts = useBoundStore((store) =>
    store.chat.fileDrafts.get(store.ui.activeConvId || ""),
  );
  const setFileDrafts = useBoundStore(
    (store) => (fileDrafts: FileDraft[]) =>
      store.chat.setConversationFileDrafts(
        store.ui.activeConvId || "",
        fileDrafts,
      ),
  );
  const agentId = useBoundStore(
    (store) => store.ui.roles[store.ui.activeOrgId || ""]?.agentId,
  );

  const orgMode = useQuery({
    queryKey: ["orgs", activeOrgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("extra->>mode")
        .eq("id", activeOrgId!)
        .single();
      if (error) {
        throw error;
      }
      return data.mode as "auto" | "manual" | "draft" | undefined;
    },
    enabled: !!activeOrgId,
    staleTime: 1000 * 60 * 60 * 6, // 6 hours
  });

  const convType = conv?.extra?.type;

  const [timer, setTimer] = useState<NodeJS.Timeout>();

  const editableDiv = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const { translate: t, currentLanguage } = useTranslation();

  const tick = useContext(TickContext); // one-minute ticks

  const mostRecent: MessageRow | undefined = useBoundStore(
    (store) =>
      store.chat.messages
        .get(store.ui.activeConvId || "")
        ?.values()
        .next().value,
  );

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
    moveCursorToEnd(editableDiv.current);

    // do not steal the focus from the file previewer
    if (!fileDrafts?.length) {
      // focus on the text input only on desktop
      //window.matchMedia("(min-width: 768px)").matches &&
      //  editableDiv.current.focus();
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
        moveCursorToEnd(editableDiv.current);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId, draft]);

  const sendTextMessage = async () => {
    if (!activeConvId || !conv || !message) {
      return;
    }

    clearTimeout(timer);

    const isPaused =
      +new Date(conv.extra?.paused || 0) > +new Date() - 12 * 60 * 60 * 1000; // Less than 12 hours ago.

    // Human response pauses the bot
    // TODO: not done in media messages - cabra 2025-01-11
    if (
      orgMode.data !== "manual" &&
      convType !== "group" &&
      !sendAsContact &&
      !isPaused &&
      conv.updated_at
    ) {
      updateConvExtra(conv, {
        paused: new Date().toISOString(),
      });
    }

    // If the conv has the `updated_at` unset, it means it has not been pushed to the DB yet.
    !conv.updated_at && pushConversationToDb(conv);

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
    pushMessageToDb(record);

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

  const templateButton =
    convType === "group" ? null : (
      <>
        {/* Templates button */}
        <button
          className={
            "p-[8px] rounded-full" +
            (templatePicker ? " bg-gray-icon-bg" : " active:bg-gray-icon-bg")
          }
          onClick={() => toggle("templatePicker")}
          title={t("Plantillas") as string}
        >
          <NotepadTextDashed className="w-[24px] h-[24px] text-gray-icon" />
        </button>
      </>
    );

  const generateButton =
    convType === "group" ? null : (
      <>
        {/* Generate message button */}
        <button
          disabled={!inCSWindow}
          className="p-[8px]"
          onClick={async () => {
            if (conv && conv.extra?.paused) {
              await updateConvExtra(conv, { paused: null });
            }

            if (!mostRecent) {
              return;
            }

            const { data, error } = await supabase.functions.invoke("bot", {
              body: {
                table: "messages",
                schema: "public",
                record: mostRecent,
              } as WebhookPayload<MessageRow>,
            });

            if (error) {
              console.error(error);
            }
          }}
          title={t("Generar respuesta") as string}
        >
          <WandSparkles className="w-[24px] h-[24px] p-[1px] text-gray-icon" />
        </button>
      </>
    );

  const attachButton = (
    <>
      {/* Attach files button */}
      <button
        disabled={!inCSWindow}
        className="p-[8px]"
        onClick={() => fileInput.current?.click()}
        title={t("Adjuntar") as string}
      >
        <svg className={"w-[24px] h-[24px] text-gray-icon"}>
          <use href="/icons.svg#attach" />
        </svg>
      </button>
    </>
  );

  const footerActions: MenuProps["items"] = [
    {
      key: "1",
      label: templateButton,
    },
    {
      key: "2",
      label: generateButton,
    },
    {
      key: "3",
      label: attachButton,
    },
  ];

  return (
    activeConvId &&
    conv && (
      <div className="flex items-end bg-gray py-[11px] px-[16px] ">
        <div className="hidden lg:block shrink-0">
          {templateButton}
          {generateButton}
          {attachButton}
        </div>
        <div className="block lg:hidden">
          <Dropdown menu={{ items: footerActions }} placement="topLeft">
            <button
              disabled={!inCSWindow}
              className="p-[8px]"
              title={t("Más acciones") as string}
            >
              <svg className={"w-[24px] h-[24px] text-gray-icon"}>
                <use href="/icons.svg#attach" />
              </svg>
            </button>
          </Dropdown>
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
            className={`${!inCSWindow ? "bg-gray-line cursor-pointer" : "bg-white"} rounded-lg py-[10px] px-[13px] mx-[8px] outline-none min-h-[40px] max-h-40 overflow-y-auto text-[15px] leading-[20px] break-words`}
            onInput={(event) => {
              if (!(event.target instanceof Element)) {
                return;
              }
              // TODO: HTML to markdown
              // TODO: DOM sanitizer to prevent injection attacks
              //const message = event.target.textContent || "";
              const message =
                event.target.innerHTML
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
                "absolute bottom-[2px] left-[8px] py-[10px] pl-[20px] max-h-[40px] text-[15px] text-gray-dark" +
                (inCSWindow ? "" : " cursor-pointer")
              }
              onClick={() =>
                inCSWindow
                  ? editableDiv.current?.focus()
                  : toggle("templatePicker")
              }
            >
              {!inCSWindow ? (
                <T as="span">Conversación cerrada</T>
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
          className="p-[8px]"
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
              "w-[24px] h-[24px] text-blue-400 transition" +
              (sendAsContact ? " -scale-x-100" : "")
            }
          >
            <use href="/icons.svg#send" />
          </svg>
        </button>
      </div>
    )
  );
}
