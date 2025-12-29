import {
  useState,
  useEffect,
  type FormEventHandler,
  useMemo,
} from "react";
import useBoundStore from "@/stores/useBoundStore";
import { type TemplateMessage, type TemplateData } from "@/supabase/client";
import { OutMessage, InMessage, BaseMessage } from "./Message/Message";

export default function TemplatePreview({
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
        <BaseMessage
          header={headPlaceholders}
          body={bodyPlaceholders}
          footer={foot?.text}
          buttons={buttons?.map((b) => b.text)}
          type="outgoing"
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
