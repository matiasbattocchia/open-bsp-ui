import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import {
  newMessage,
  pushMessageToDb,
  pushMessageToStore,
} from "@/utils/MessageUtils";
import useBoundStore from "@/stores/useBoundStore";
import { pushConversationToDb, saveDraft } from "@/utils/ConversationUtils";
import { type FileDraft } from "@/stores/chatSlice";
import {
  type Draft,
  type MessageRow,
  type TemplateMessage,
  isIncoming,
  isTeamChat,
} from "@/supabase/client";
import { TickContext } from "@/contexts/useTick";
import dayjs from "dayjs";
import "dayjs/locale/es";
import "dayjs/locale/pt";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentAgent } from "@/queries/useAgents";
import {
  isQuotaError,
  useQuotaReached,
  useRefreshUsage,
} from "@/queries/useBilling";
import { useTextLength } from "@/queries/useTextLimit";
import { moveCursorToEnd } from "@/utils/UtilityFunctions";
import { htmlToMarkdown } from "@/utils/htmlToMarkdown";
import TemplatePicker from "./TemplatePicker";

function TemplateVarInput({
  placeholder,
  value,
  onChange,
  onEnter,
  autoFocus,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  autoFocus?: boolean;
}) {
  const measureRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<number | undefined>();

  useEffect(() => {
    if (measureRef.current) {
      setWidth(measureRef.current.offsetWidth);
    }
  }, [value, placeholder]);

  return (
    <>
      <span
        ref={measureRef}
        className="absolute invisible whitespace-pre text-[14px] px-[12px]"
        aria-hidden
      >
        {value || placeholder}
      </span>
      <input
        type="text"
        className="inline-block bg-primary/10 border border-primary/30 rounded-full px-[12px] py-[1px] mx-[2px] text-[14px] leading-[18px] outline-none focus:border-primary"
        style={{ width: width ? `${width + 4}px` : undefined }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onEnter();
          }
        }}
        autoFocus={autoFocus}
      />
    </>
  );
}

export default function ChatFooter() {
  const activeConvId = useBoundStore((store) => store.ui.activeConvId);
  const conv = useBoundStore((store) =>
    store.chat.conversations.get(store.ui.activeConvId || ""),
  );
  const draft: Draft | null | undefined = useBoundStore((store) =>
    store.chat.membershipExtras.get(store.ui.activeConvId || ""),
  )?.draft;
  const toggle = useBoundStore((store) => store.ui.toggle);
  const templatePicker = useBoundStore((store) => store.ui.templatePicker);
  const templateDraftEntry = useBoundStore((store) =>
    store.ui.templateDrafts.get(store.ui.activeConvId || ""),
  );
  const setTemplateDraft = useBoundStore((store) => store.ui.setTemplateDraft);
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
      if (
        isIncoming(
          msg,
          store.chat.ownAgentId,
          isTeamChat(store.chat.conversations.get(msg.conversation_id)),
        )
      ) {
        return msg;
      }
    }
  });

  // Wether or not the user is allowed to send messages to the client.
  // WhatsApp (Cloud API) and Instagram both enforce a 24h customer-service
  // window since the contact's last message, TikTok a 48h one; `local`
  // (internal testing) and `whatsapp-web` (unofficial bridge) have no window.
  const windowHours =
    conv?.service === "whatsapp" || conv?.service === "instagram"
      ? 24
      : conv?.service === "tiktok"
        ? 48
        : undefined;
  const windowEnd = dayjs(mostRecentIncoming?.timestamp || 0).add(
    windowHours ?? 0,
    "hour",
  );
  const inCSWindow = windowHours === undefined || tick.isBefore(windowEnd);

  // Templates count too: at the messages cap nothing more goes out, whatever
  // the window.
  const quotaReached = useQuotaReached("messages");
  const canSend = inCSWindow && !quotaReached;
  const refreshUsage = useRefreshUsage();
  // Past the service's limit the database refuses the message: it has to go
  // out as several.
  const text = useTextLength(conv?.service, "text", message);
  const navigate = useNavigate();

  // A send the database refused for the cap: the usage catches up, and the
  // footer locks.
  const onSendError = (error: unknown) => {
    console.error(error);
    if (isQuotaError(error)) void refreshUsage();
  };

  // A locked input leads to what unlocks it: the messages stats at the cap,
  // a template once WhatsApp's window closed.
  const onLockedClick = () => {
    if (quotaReached) {
      void navigate({
        to: "/stats/$productId",
        params: { productId: "messages" },
        hash: (prevHash) => prevHash!,
      });
    } else if (!inCSWindow && conv?.service === "whatsapp") {
      toggle("templatePicker");
    }
  };

  // What's left of the customer service window.
  const remaining = tick.locale(currentLanguage).to(windowEnd, true);

  // Template mode: derive from per-conv store
  const templateDraft = templateDraftEntry?.template;
  const bodyVarValues = templateDraftEntry?.bodyVarValues || [];
  const headVarValues = templateDraftEntry?.headVarValues || [];

  const templateBody = templateDraft?.components.find((c) => c.type === "BODY");
  const templateHead = templateDraft?.components.find(
    (c) => c.type === "HEADER",
  );
  const templateFoot = templateDraft?.components.find(
    (c) => c.type === "FOOTER",
  );
  const templateButtons = templateDraft?.components.find(
    (c) => c.type === "BUTTONS",
  );

  const bodyExamples = templateBody?.example?.body_text[0] || [];
  const headExamples = templateHead?.example?.header_text || [];

  // Count how many variables are in the template body/header
  const bodyVarCount = (templateBody?.text.match(/\{\{\d+\}\}/g) || []).length;
  const headVarCount = (templateHead?.text?.match(/\{\{\d+\}\}/g) || []).length;

  const allVarsFilled =
    templateDraft &&
    bodyVarValues.slice(0, bodyVarCount).every((v) => v.trim() !== "") &&
    headVarValues.slice(0, headVarCount).every((v) => v.trim() !== "");

  function updateVarValues(bodyVars: string[], headVars: string[]) {
    if (!activeConvId || !templateDraftEntry) return;
    setTemplateDraft(activeConvId, {
      ...templateDraftEntry,
      bodyVarValues: bodyVars,
      headVarValues: headVars,
    });
  }

  useEffect(() => {
    if (!editableDiv.current) {
      return;
    }

    if (!canSend) {
      editableDiv.current.textContent = "";
      return;
    }

    editableDiv.current.textContent = message || "";

    // do not steal the focus from the file previewer
    if (
      !fileDrafts?.length &&
      window.matchMedia("(min-width: 768px)").matches
    ) {
      moveCursorToEnd(editableDiv.current);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId, fileDrafts, canSend]);

  // Load the stored draft
  useEffect(() => {
    if (!activeConvId || !conv) {
      return;
    }

    // Note: draft is the DB stored draft; message (textDraft) is just an UI buffer
    const shouldLoadDraft = canSend && draft?.text && !message; // do not overwrite a current message

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
    if (!activeConvId || !conv || !message || text.over) {
      return;
    }

    clearTimeout(timer);

    // If the conv has the `updated_at` unset, it means it has not been pushed to the DB yet.
    !conv.updated_at && (await pushConversationToDb(conv));

    const record = newMessage(
      conv,
      {
        version: "1",
        type: "text",
        kind: "text",
        text: message,
      },
      agentId,
    );

    pushMessageToStore({ ...record, conversation_id: conv.id });
    await pushMessageToDb(record);

    setMessage("");
    // TODO: optimization: combine with the updateConvExtra call - cabra 2025-01-16
    draft && saveDraft(conv, "").catch(console.error);

    if (editableDiv.current) {
      editableDiv.current.textContent = "";
    }
  };

  const sendTemplateMessage = async () => {
    if (!activeConvId || !conv || !templateDraft || !templateBody) {
      return;
    }

    // If the conv has the `updated_at` unset, it means it has not been pushed to the DB yet.
    !conv.updated_at && (await pushConversationToDb(conv));

    // Build rendered text
    let bodyContent = templateBody.text;
    let headContent = templateHead?.text;
    const components: TemplateMessage["template"]["components"] = [];

    if (headVarValues.length && headVarCount > 0) {
      let idx = 1;
      for (const value of headVarValues.slice(0, headVarCount)) {
        headContent = headContent?.replaceAll(`{{${idx}}}`, value);
        idx++;
      }
      components.push({
        type: "header",
        parameters: headVarValues.slice(0, headVarCount).map((text) => ({
          type: "text" as const,
          text,
        })),
      });
    }

    if (bodyVarValues.length && bodyVarCount > 0) {
      let idx = 1;
      for (const value of bodyVarValues.slice(0, bodyVarCount)) {
        bodyContent = bodyContent.replaceAll(`{{${idx}}}`, value);
        idx++;
      }
      components.push({
        type: "body",
        parameters: bodyVarValues.slice(0, bodyVarCount).map((text) => ({
          type: "text" as const,
          text,
        })),
      });
    }

    if (templateButtons?.buttons) {
      let idx = 0;
      for (const button of templateButtons.buttons) {
        components.push({
          type: "button",
          sub_type: "quick_reply",
          index: idx.toString(),
          parameters: [
            {
              type: "payload",
              payload: button.text.toLowerCase().replaceAll(" ", "_"),
            },
          ],
        });
        idx++;
      }
    }

    const template: TemplateMessage["template"] = {
      name: templateDraft.name,
      language: {
        code: templateDraft.language,
        policy: "deterministic" as const,
      },
    };

    if (components.length) {
      template.components = components;
    }

    // Build rendered text for display
    const renderedParts: string[] = [];
    if (headContent) renderedParts.push(`*${headContent}*`);
    renderedParts.push(bodyContent);
    if (templateFoot?.text) renderedParts.push(`_${templateFoot.text}_`);
    const renderedBody = renderedParts.join("\n\n");

    const record = newMessage(
      conv,
      {
        version: "1",
        type: "data",
        kind: "template",
        data: template,
        text: renderedBody,
      },
      agentId,
    );

    pushMessageToStore(record);
    await pushMessageToDb(record);

    setTemplateDraft(activeConvId, null);
  };

  function debounce(fn: () => void, ms: number) {
    clearTimeout(timer);
    setTimer(setTimeout(fn, ms));
  }

  // Render template body with inline inputs for variables
  function renderTemplateBody() {
    if (!templateBody) return null;

    const parts: (string | { varIndex: number; isHeader: boolean })[] = [];

    // Render header if present
    if (templateHead?.text && headVarCount > 0) {
      const headerSegments = templateHead.text.split(/(\{\{\d+\}\})/);
      let headerIdx = 0;
      for (const seg of headerSegments) {
        const match = seg.match(/^\{\{(\d+)\}\}$/);
        if (match) {
          parts.push({ varIndex: headerIdx, isHeader: true });
          headerIdx++;
        } else if (seg) {
          parts.push(seg);
        }
      }
      parts.push("\n");
    } else if (templateHead?.text) {
      parts.push(templateHead.text + "\n");
    }

    // Render body
    const segments = templateBody.text.split(/(\{\{\d+\}\})/);
    let bodyIdx = 0;
    for (const seg of segments) {
      const match = seg.match(/^\{\{(\d+)\}\}$/);
      if (match) {
        parts.push({ varIndex: bodyIdx, isHeader: false });
        bodyIdx++;
      } else if (seg) {
        parts.push(seg);
      }
    }

    // Render footer if present
    if (templateFoot?.text) {
      parts.push("\n" + templateFoot.text);
    }

    return (
      <div className="mx-[5px] py-[10px] min-h-[40px] max-h-40 overflow-y-auto text-[15px] leading-[20px] break-words">
        {parts.map((part, i) =>
          typeof part === "string" ? (
            <span key={i}>{part}</span>
          ) : (
            <TemplateVarInput
              key={i}
              placeholder={
                part.isHeader
                  ? headExamples[part.varIndex] || `{{${part.varIndex + 1}}}`
                  : bodyExamples[part.varIndex] || `{{${part.varIndex + 1}}}`
              }
              value={
                part.isHeader
                  ? headVarValues[part.varIndex] || ""
                  : bodyVarValues[part.varIndex] || ""
              }
              onChange={(value) => {
                if (part.isHeader) {
                  const next = [...headVarValues];
                  next[part.varIndex] = value;
                  updateVarValues(bodyVarValues, next);
                } else {
                  const next = [...bodyVarValues];
                  next[part.varIndex] = value;
                  updateVarValues(next, headVarValues);
                }
              }}
              onEnter={() => {
                if (
                  allVarsFilled &&
                  window.matchMedia("(min-width: 768px)").matches
                ) {
                  sendTemplateMessage().catch(onSendError);
                }
              }}
              autoFocus={i === parts.findIndex((p) => typeof p !== "string")}
            />
          ),
        )}
      </div>
    );
  }

  return (
    activeConvId &&
    conv && (
      <div className="relative mx-[12px] mb-[12px] mt-[4px] lg:mt-[0px] z-10">
        {templatePicker && <TemplatePicker />}
        <div
          className={
            "flex items-end text-foreground p-[5px] rounded-[24px] shadow-[0_0_4px_0px_rgba(0,0,0,0.1)]" +
            (templateDraft
              ? " bg-incoming-chat-bubble"
              : !canSend
                ? " bg-background"
                : " bg-incoming-chat-bubble")
          }
        >
          <div className="shrink-0">
            {templateDraft ? (
              <button
                className="p-[8px] rounded-full cursor-pointer hover:bg-accent"
                onClick={() => setTemplateDraft(activeConvId, null)}
                title={t("Descartar plantilla")}
              >
                <X className="w-[24px] h-[24px]" />
              </button>
            ) : (
              <button
                disabled={!canSend}
                className={
                  "p-[8px] rounded-full" +
                  (!canSend ? "" : " cursor-pointer hover:bg-accent")
                }
                onClick={() => fileInput.current?.click()}
                title={t("Adjuntar")}
              >
                <Plus className="w-[24px] h-[24px]" />
              </button>
            )}
          </div>

          <input
            disabled={!canSend}
            ref={fileInput}
            type="file"
            multiple={true}
            className="hidden"
            // TikTok sends JPG and PNG images, nothing else.
            accept={conv?.service === "tiktok" ? "image/jpeg,image/png" : "*/*"}
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

          {/* Text input or template mode */}
          <div className="relative grow">
            {templateDraft ? (
              renderTemplateBody()
            ) : (
              <>
                <div
                  ref={editableDiv}
                  contentEditable={canSend}
                  className={`${
                    !canSend ? "cursor-pointer" : ""
                  } outline-none mx-[5px] py-[10px] min-h-[40px] max-h-40 overflow-y-auto text-[15px] leading-[20px] break-words`}
                  onInput={(event) => {
                    if (!(event.target instanceof Element)) {
                      return;
                    }

                    // Use secure utility to sanitize and convert HTML to Markdown
                    const message = htmlToMarkdown(
                      event.currentTarget.innerHTML,
                    );

                    setMessage(message);

                    if (conv.created_at !== conv.updated_at) {
                      // no drafts for new convs, sorry!
                      debounce(() => saveDraft(conv, message), 3000); // milliseconds
                    }
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      window.matchMedia("(min-width: 768px)").matches
                    ) {
                      event.preventDefault();
                      sendTextMessage().catch(onSendError);
                    }
                  }}
                  onClick={onLockedClick}
                  title={
                    quotaReached
                      ? t(
                          "No se envían más mensajes; los recibidos siguen llegando.",
                        )
                      : inCSWindow
                        ? undefined
                        : conv.service === "whatsapp"
                          ? t(
                              "WhatsApp cierra la conversación a las 24 horas del último mensaje recibido. Para abrir la conversación debes utilizar una plantilla.",
                            )
                          : conv.service === "tiktok"
                            ? t(
                                "La conversación se cerró 48 horas después del último mensaje del contacto. Esperá a que te escriba de nuevo para responder.",
                              )
                            : t(
                                "La conversación se cerró 24 horas después del último mensaje del contacto. Esperá a que te escriba de nuevo para responder.",
                              )
                  }
                />
                {(!message || !canSend) && (
                  <div
                    className={
                      "absolute bottom-[1px] py-[10px] mx-[5px] max-h-[40px] text-[15px] text-muted-foreground" +
                      (canSend ? "" : " cursor-pointer")
                    }
                    onClick={() =>
                      canSend ? editableDiv.current?.focus() : onLockedClick()
                    }
                  >
                    {quotaReached ? (
                      <>
                        <span className="lg:hidden">
                          {t("Límite de mensajes alcanzado")}
                        </span>
                        <span className="hidden lg:inline">
                          {t(
                            "Límite de mensajes alcanzado, mejora el plan para seguir enviando",
                          )}
                        </span>
                      </>
                    ) : !inCSWindow ? (
                      conv.service === "whatsapp" ? (
                        <>
                          <span className="lg:hidden">
                            {t("Conversación cerrada")}
                          </span>
                          <span className="hidden lg:inline">
                            {t(
                              "Conversación cerrada, abre la conversación con una plantilla",
                            )}
                          </span>
                        </>
                      ) : (
                        <span>{t("Conversación cerrada")}</span>
                      )
                    ) : windowHours !== undefined ? (
                      <>
                        <span className="lg:hidden">{t("Cerrará en")}</span>
                        <span className="hidden lg:inline">
                          {t("La conversación cerrará en")}
                        </span>{" "}
                        <span>{remaining}</span>
                      </>
                    ) : (
                      <span>{t("Escribe un mensaje")}</span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {!templateDraft && canSend && text.near && (
            <span
              className={
                "shrink-0 self-end mx-[6px] py-[12px] text-[12px] leading-[16px] tabular-nums" +
                (text.over ? " text-destructive" : " text-muted-foreground")
              }
            >
              {text.length}/{text.limit}
            </span>
          )}

          {/* Send button */}
          <button
            disabled={
              quotaReached ||
              (templateDraft ? !allVarsFilled : !inCSWindow || text.over)
            }
            className={
              "p-[8px] rounded-full bg-primary disabled:opacity-50" +
              (quotaReached
                ? ""
                : templateDraft
                  ? allVarsFilled
                    ? " cursor-pointer"
                    : ""
                  : !inCSWindow || text.over
                    ? ""
                    : " cursor-pointer")
            }
            onClick={() => {
              if (quotaReached) {
                return;
              } else if (templateDraft) {
                allVarsFilled && sendTemplateMessage().catch(onSendError);
              } else if (message) {
                sendTextMessage().catch(onSendError);
              }
            }}
            title={
              templateDraft
                ? t("Enviar plantilla")
                : text.over
                  ? t("Demasiado largo: divídelo en varios mensajes")
                  : t("Enviar mensaje")
            }
          >
            <svg className="w-[24px] h-[24px] transition text-primary-foreground">
              <use href="/icons.svg#send" />
            </svg>
          </button>
        </div>
      </div>
    )
  );
}
