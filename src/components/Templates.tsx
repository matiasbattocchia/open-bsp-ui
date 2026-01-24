import {
  useState,
  useEffect,
  type FormEventHandler,
  type Dispatch,
  type SetStateAction,
  useMemo,
} from "react";
import useBoundStore from "@/stores/useBoundStore";
import { supabase, type TemplateMessage, type TemplateData } from "@/supabase/client";
import { OutMessage, InMessage, TextMessage } from "./Message/Message";
import {
  newMessage,
  pushMessageToDb,
  pushMessageToStore,
} from "@/utils/MessageUtils";
import { pushConversationToDb } from "@/utils/ConversationUtils";
import { Translate as T, useTranslation } from "@/hooks/useTranslation";
import { LoaderCircle, PencilLine, PlusIcon } from "lucide-react";
import Input from "antd/es/input/Input";
import TextArea from "antd/es/input/TextArea";

function Template({
  template: { name, language, components },
  sendTemplateMessage,
  editMode = false,
}: {
  template: TemplateData;
  sendTemplateMessage?: (
    template: TemplateMessage["template"],
    body: string,
    header?: string,
    footer?: string,
  ) => void;
  editMode?: boolean;
}) {
  const toggle = useBoundStore((store) => store.ui.toggle);

  const head = useMemo(
    () => components.find((c) => c.type === "HEADER"),
    [components],
  );
  const body = useMemo(
    () => components.find((c) => c.type === "BODY")!,
    [components],
  );
  const foot = useMemo(
    () => components.find((c) => c.type === "FOOTER"),
    [components],
  );
  const butt = useMemo(
    () => components.find((c) => c.type === "BUTTONS"),
    [components],
  );

  let headPlaceholders = head?.text;
  let bodyPlaceholders = body.text;

  const headExamples = head?.example?.header_text || [];
  const bodyExamples = useMemo(
    () => body.example?.body_text[0] || [],
    [body.example?.body_text],
  );

  const buttons = butt?.buttons;

  const [headValues, setHeadValues] = useState(headExamples);
  const [bodyValues, setBodyValues] = useState(bodyExamples);

  useEffect(() => {
    setBodyValues(bodyExamples);
  }, [bodyExamples]);

  let idx = 1;
  for (const value of headValues) {
    headPlaceholders = headPlaceholders?.replaceAll(
      `{{${idx}}}`,
      `<span id="${idx}" class="templateField templateHeader" contentEditable>${value}</span>`,
    );
    idx++;
  }

  idx = 1;
  for (const value of bodyValues) {
    bodyPlaceholders = bodyPlaceholders.replaceAll(
      `{{${idx}}}`,
      editMode
        ? value
        : `<span id="${idx}" class="templateField templateBody" contentEditable>${value}</span>`,
    );
    idx++;
  }

  const onInputHandler: FormEventHandler<HTMLDivElement> = (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }
    // template slot numeration starts at 1

    //@ts-expect-error Property 'id' does not exist on type 'NamedNodeMap'
    const idx = Number(event.target.attributes.id.value) - 1;

    //@ts-expect-error Property 'class' does not exist on type 'NamedNodeMap'
    if (event.target.attributes.class.value.includes("templateHeader")) {
      headValues[idx] = event.target.textContent || "???";
      setHeadValues(headValues);
    } else {
      bodyValues[idx] = event.target.textContent || "???";
      setBodyValues(bodyValues);
    }
  };

  const sendHandler = () => {
    if (!sendTemplateMessage) {
      return;
    }

    let headContent = head?.text;
    let bodyContent = body.text;
    const components = [];

    if (headValues) {
      let idx = 1;
      for (const value of headValues) {
        headContent = headContent?.replaceAll(`{{${idx}}}`, value);
        idx++;
      }

      components.push({
        type: "header",
        parameters: headValues.map((text) => ({ type: "text", text })),
      });
    }

    if (bodyValues) {
      idx = 1;
      for (const value of bodyValues) {
        bodyContent = bodyContent.replaceAll(`{{${idx}}}`, value);
        idx++;
      }

      components.push({
        type: "body",
        parameters: bodyValues.map((text) => ({ type: "text", text })),
      });
    }

    if (buttons) {
      idx = 0;
      for (const button of buttons) {
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

    const template = {
      name,
      language: {
        code: language,
        policy: "deterministic" as const,
      },
    };

    if (components.length) {
      //@ts-expect-error
      template["components"] = components;
    }

    sendTemplateMessage(template, bodyContent, headContent, foot?.text);
    toggle("templatePicker");
  };

  const Message = editMode ? InMessage : OutMessage;

  return (
    <div className="relative mx-[16px]">
      <Message first text>
        <TextMessage
          header={headPlaceholders}
          body={bodyPlaceholders}
          footer={foot?.text}
          buttons={buttons?.map((b) => b.text)}
          direction="outgoing"
          onInput={onInputHandler}
        />
      </Message>
      {sendTemplateMessage && (
        <button
          className="p-[8px] absolute right-[16px] top-0"
          onClick={sendHandler}
        >
          <svg className="w-[24px] h-[24px] text-gray-icon">
            <use href="/icons.svg#send" />
          </svg>
        </button>
      )}
    </div>
  );
}

function TemplateEditor({
  setShowEditor,
  existingTemplate,
}: {
  setShowEditor: Dispatch<SetStateAction<boolean>>;
  existingTemplate?: TemplateData;
}) {
  const { currentLanguage, translate: t } = useTranslation();
  const activeConvId = useBoundStore((store) => store.ui.activeConvId);

  const [name, setName] = useState(existingTemplate?.name || "");
  const [language, setLanguage] = useState(
    existingTemplate?.language || currentLanguage || "es",
  );
  const [category, setCategory] = useState(
    existingTemplate?.category || "MARKETING",
  );
  const [header, setHeader] = useState(
    existingTemplate?.components.find((c) => c.type === "HEADER")?.text || "",
  );
  const [body, setBody] = useState(
    existingTemplate?.components.find((c) => c.type === "BODY")?.text || "",
  );
  const [bodyVariables, setBodyVariables] = useState<string[]>(
    existingTemplate?.components.find((c) => c.type === "BODY")?.example
      ?.body_text[0] || [],
  );
  const [footer, setFooter] = useState(
    existingTemplate?.components.find((c) => c.type === "FOOTER")?.text || "",
  );

  const [upsertLoading, setUpsertLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const bodyVariablesAux = Array.from(body.matchAll(/{{(\d+)}}/g) || []).map(
    (r: any) => parseInt(r[1]),
  );

  const bodyVariablesRange = [];

  for (let i = 1; i <= 9; i++) {
    if (!bodyVariablesAux.includes(i)) {
      break;
    }

    bodyVariablesRange.push(i);
  }

  const template = {
    id: existingTemplate?.id || "",
    name,
    status: "PENDING" as "PENDING",
    category: category as "MARKETING",
    sub_category: "CUSTOM",
    language,
    components: [
      ...(header ? [{ type: "HEADER", text: header, format: "TEXT" }] : []),
      {
        type: "BODY",
        text: body,
        ...(bodyVariablesRange.length
          ? {
            example: {
              body_text: [bodyVariables.slice(0, bodyVariablesRange.length)],
            },
          }
          : {}),
      },
      ...(footer ? [{ type: "FOOTER", text: footer }] : []),
    ],
  } as TemplateData;

  async function manageTemplate(method: "DELETE" | "PATCH" | "POST") {
    if (!activeConvId) {
      return;
    }

    const organization_address = activeConvId.split("<>").at(0);

    if (method === "DELETE") {
      setDeleteLoading(true);
    } else {
      setUpsertLoading(true);
    }

    const { error } = await supabase.functions.invoke(
      "whatsapp-management/templates",
      {
        method,
        body: { organization_address, template },
      },
    );

    setUpsertLoading(false);
    setDeleteLoading(false);

    if (error) {
      throw error;
    }
  }

  return (
    <>
      <T as="div" className="text-xl mb-[12px]">
        Crear plantilla
      </T>
      <div className="flex gap-[16px] w-full">
        <div className="w-[50%] flex flex-col gap-[8px]">
          {/* Categoría e idioma */}
          <div className="flex gap-[32px]">
            {/* Categoría */}
            <div className="field">
              <T as="label">Categoría</T>
              <div className="flex gap-[12px] px-[12px] py-[3px]">
                <label className="flex items-center gap-[4px]">
                  <input
                    type="radio"
                    name="category"
                    value="MARKETING"
                    checked={category === "MARKETING"}
                    onChange={(e) => setCategory(e.target.value as "MARKETING")}
                    disabled={!!existingTemplate}
                  />
                  <T>Promoción</T>
                </label>
                <label className="flex items-center gap-[4px]">
                  <input
                    type="radio"
                    name="category"
                    value="UTILITY"
                    checked={category === "UTILITY"}
                    onChange={(e) => setCategory(e.target.value as "UTILITY")}
                    disabled={!!existingTemplate}
                  />
                  <T>Utilidad</T>
                </label>
              </div>
            </div>
            {/* Idioma */}
            <div className="field">
              <T as="label">Idioma</T>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={!!existingTemplate}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </div>
          </div>

          {/* Nombre */}
          <div className="field">
            <T as="label">Nombre</T>
            <Input
              count={{
                show: true,
                max: 512,
              }}
              value={name}
              onChange={(e) => setName(e.target.value.replace(" ", "_"))}
              disabled={!!existingTemplate}
            />
          </div>

          {/* Encabezado */}
          <div className="field">
            <T as="label">Encabezado</T>
            <Input
              count={{
                show: true,
                max: 60,
              }}
              value={header}
              onChange={(e) => setHeader(e.target.value)}
            />
          </div>

          {/* Cuerpo */}
          <div className="field">
            <T as="label">Cuerpo</T>
            <TextArea
              count={{
                show: true,
                max: 1024,
              }}
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />

            <button
              onClick={() => {
                setBody(body + ` {{${bodyVariablesRange.length + 1}}}`);
              }}
              className="self-end mt-[21px]"
            >
              <div className="flex items-center gap-[3px] cursor-pointer mb-[6px]">
                <PlusIcon className="w-[16px] h-[16px]" />
                <T>Agregar variable</T>
              </div>
            </button>

            <div className="flex flex-col gap-[4px]">
              {bodyVariablesRange.map((i) => (
                <div key={i} className="flex items-center gap-[12px]">
                  <label>{`{{${i}}}`}</label>
                  <input
                    type="text"
                    value={bodyVariables[i - 1]}
                    onChange={(e) => {
                      const newBodyVariables = [...bodyVariables];
                      newBodyVariables[i - 1] = e.target.value;
                      setBodyVariables(newBodyVariables);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Pie */}
          <div className="field">
            <T as="label">Pie</T>
            <input
              type="text"
              placeholder={t("Texto del pie de página")}
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
            />
          </div>
        </div>

        {/* Previsualización y botones */}
        <div className="w-[50%] flex flex-col gap-[2px]">
          <T as="label">Previsualización</T>
          <div className="py-[12px] bg-chat rounded-[7.5px] mb-[6px]">
            <Template editMode template={template} />
          </div>
          <div className="flex gap-[6px] self-end">
            <button
              className="bg-blue-300 hover:bg-blue-400"
              onClick={async () => {
                await manageTemplate(existingTemplate ? "PATCH" : "POST");
                setShowEditor(false);
              }}
            >
              <div className="flex items-center gap-[3px]">
                {upsertLoading && (
                  <LoaderCircle className="h-5 w-5 animate-spin stroke-blue-700" />
                )}
                <T>Enviar a revisión</T>
              </div>
            </button>
            {existingTemplate && (
              <button
                className="bg-red-300 hover:bg-red-400"
                onClick={async () => {
                  await manageTemplate("DELETE");
                  setShowEditor(false);
                }}
              >
                <div className="flex items-center gap-[3px]">
                  {deleteLoading && (
                    <LoaderCircle className="h-5 w-5 animate-spin stroke-red-700" />
                  )}
                  <T>Eliminar</T>
                </div>
              </button>
            )}
            <T
              as="button"
              className="bg-zinc-300 hover:bg-zinc-400"
              onClick={() => setShowEditor(false)}
            >
              Descartar
            </T>
          </div>
        </div>
      </div>
    </>
  );
}

import { useCurrentAgent } from "@/queries/useAgents";

// ...

export default function WhatsAppTemplates() {
  const activeConvId = useBoundStore((store) => store.ui.activeConvId);
  const conv = useBoundStore((store) =>
    store.chat.conversations.get(store.ui.activeConvId || ""),
  );
  const templatePicker = useBoundStore((store) => store.ui.templatePicker);

  const { data: agent } = useCurrentAgent();
  const agentId = agent?.id;

  const [templates, setTemplates] = useState<TemplateData[]>();
  const [loading, setLoading] = useState(false);

  const [showEditor, setShowEditor] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<
    TemplateData | undefined
  >(undefined);

  const { translate: t } = useTranslation();

  useEffect(() => {
    async function getTemplates() {
      if (!activeConvId || !templatePicker || conv?.service !== "whatsapp") {
        setTemplates([
          // Plantilla de ejemplo para testear localmente
          // {
          //   id: "1",
          //   name: "Plantilla de ejemplo",
          //   status: "APPROVED",
          //   category: "MARKETING",
          //   components: [
          //     // {
          //     //   type: "HEADER",
          //     //   text: "Encabezado de la plantilla",
          //     //   format: "TEXT",
          //     // },
          //     {
          //       type: "BODY",
          //       text: "Encabezado de la plantilla",
          //     },
          //     // {
          //     //   type: "FOOTER",
          //     //   text: "Footer de la plantilla",
          //     // },
          //   ],
          //   language: "es",
          //   sub_category: "CUSTOM",
          // },
        ]);
        return;
      }

      const organization_address = activeConvId?.split("<>").at(0);

      setLoading(true);

      const { data, error } = await supabase.functions.invoke(
        "whatsapp-management/templates",
        {
          method: "PUT", // TODO: GET is not working (Supabase JS client bug?). PUT is a workaround.
          body: { organization_address },
        },
      );

      setLoading(false);

      if (error) {
        setTemplates([]);
        throw error;
      }

      setTemplates(data.data);
    }

    getTemplates();
  }, [activeConvId, templatePicker, showEditor]);

  const sendTemplateMessage = async (
    template: TemplateMessage["template"],
    _body: string,
    _header?: string,
    _footer?: string,
  ) => {
    if (!activeConvId || !conv || !template) {
      return;
    }

    // If the conv has the `updated_at` unset, it means it has not been pushed to the DB yet.
    !conv.updated_at && await pushConversationToDb(conv);

    const record = newMessage(
      conv,
      "outgoing",
      {
        version: "1",
        type: "data",
        kind: "template",
        data: template,
        // body,
        // header,
        // footer,
      },
      agentId,
    );
    pushMessageToStore(record);
    await pushMessageToDb(record);
  };

  return (
    templatePicker &&
    activeConvId && (
      <div className="overflow-y-auto absolute z-10 bg-gray h-[calc(100%-62px)] w-full">
        <div className="p-[16px] template-form">
          {showEditor ? (
            <TemplateEditor
              setShowEditor={setShowEditor}
              existingTemplate={templateToEdit}
            />
          ) : (
            <>
              <div className="flex items-center gap-[8px] mb-[12px]">
                <T as="div" className="text-xl">
                  Plantillas de WhatsApp
                </T>
                {loading && (
                  <LoaderCircle className="h-5 w-5 animate-spin stroke-blue-ack" />
                )}
              </div>

              <T
                as="button"
                className="bg-blue-300 hover:bg-blue-400 mb-[12px]"
                onClick={() => {
                  setTemplateToEdit(undefined);
                  setShowEditor(true);
                }}
              >
                Crear plantilla
              </T>

              {templates?.map((template) => (
                <div className="mb-[12px] relative group" key={template.id}>
                  {template.status !== "APPROVED" && (
                    <p className="absolute bg-red-100 text-red-500 px-[12px] py-[6px] rounded-full capitalize">
                      {template.status.toLowerCase()}
                    </p>
                  )}

                  <button
                    title={t("Editar")}
                    className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 z-50"
                    onClick={() => {
                      setTemplateToEdit(template);
                      setShowEditor(true);
                    }}
                  >
                    <PencilLine className="w-[24px] h-[24px] text-gray-icon" />
                  </button>

                  <Template {...{ template, sendTemplateMessage }} />
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    )
  );
}
