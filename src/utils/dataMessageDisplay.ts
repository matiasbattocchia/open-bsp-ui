import type { Json } from "@/supabase/db_types";
import type { TemplateData } from "@/supabase/types/whatsapp_template_types";

type DataContent = {
  kind?: string;
  data?: Json;
  text?: string;
};

export type DataMessageDisplay = {
  header?: string;
  body: string;
  footer?: string;
  buttons?: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function typeOf(value: unknown): string {
  return isRecord(value) && typeof value.type === "string"
    ? value.type.toUpperCase()
    : "";
}

function unwrapInteractive(
  data: Record<string, unknown>,
): Record<string, unknown> {
  return isRecord(data.interactive) ? data.interactive : data;
}

function parameterText(param: unknown): string | undefined {
  if (!isRecord(param)) {
    return;
  }
  if (param.type === "text" || typeof param.text === "string") {
    return str(param.text);
  }
  if (param.type === "currency" && isRecord(param.currency)) {
    return str(param.currency.fallback_value);
  }
  if (param.type === "date_time" && isRecord(param.date_time)) {
    return str(param.date_time.fallback_value);
  }
}

function componentText(value: unknown): string | undefined {
  if (typeof value === "string") {
    return str(value);
  }
  if (isRecord(value)) {
    return str(value.text);
  }
}

function buttonLabel(value: unknown): string | undefined {
  if (!isRecord(value)) {
    return;
  }
  if (isRecord(value.reply)) {
    return str(value.reply.title) || str(value.reply.id);
  }
  return str(value.title) || str(value.text);
}

function collectButtons(data: Record<string, unknown>): string[] | undefined {
  if (Array.isArray(data.buttons)) {
    const labels = data.buttons
      .map(buttonLabel)
      .filter((label): label is string => !!label);
    if (labels.length) {
      return labels;
    }
  }

  const action = isRecord(data.action) ? data.action : undefined;
  if (action && Array.isArray(action.buttons)) {
    const labels = action.buttons
      .map(buttonLabel)
      .filter((label): label is string => !!label);
    if (labels.length) {
      return labels;
    }
  }
  if (action) {
    const params = isRecord(action.parameters) ? action.parameters : undefined;
    const cta = str(params?.display_text);
    if (cta) {
      return [cta];
    }
    const list = str(action.button);
    if (list) {
      return [list];
    }
  }
}

function looksLikeTemplate(data: Record<string, unknown>): boolean {
  return (
    typeof data.name === "string" &&
    isRecord(data.language) &&
    typeof data.language.code === "string"
  );
}

function templatePayload(
  data: Record<string, unknown>,
): Record<string, unknown> {
  if (looksLikeTemplate(data)) {
    return data;
  }
  if (isRecord(data.template) && looksLikeTemplate(data.template)) {
    return data.template;
  }
  return data;
}

export function isTemplateMessageContent(content: DataContent): boolean {
  if (content.kind === "template") {
    return true;
  }
  if (!isRecord(content.data)) {
    return false;
  }
  return looksLikeTemplate(templatePayload(content.data));
}

function fillPlaceholders(text: string, params: unknown[]): string {
  let result = text;
  params.forEach((param, i) => {
    const value = parameterText(param);
    if (value === undefined) {
      return;
    }
    result = result.replaceAll(`{{${i + 1}}}`, value);
    if (isRecord(param)) {
      const name = str(param.parameter_name);
      if (name) {
        result = result.replaceAll(`{{${name}}}`, value);
      }
    }
  });
  return result;
}

function findTemplateDefinition(
  templates: TemplateData[] | undefined,
  name: string,
  languageCode: string,
): TemplateData | undefined {
  if (!templates?.length) {
    return;
  }
  const wantName = name.trim().toLowerCase();
  const wantLang = languageCode.trim().toLowerCase().replace("-", "_");
  const sameName = templates.filter(
    (t) => t.name.trim().toLowerCase() === wantName,
  );
  if (!sameName.length) {
    return;
  }
  return (
    sameName.find(
      (t) => t.language.toLowerCase().replace("-", "_") === wantLang,
    ) ||
    sameName.find((t) =>
      t.language.toLowerCase().replace("-", "_").startsWith(`${wantLang}_`),
    ) ||
    sameName.find((t) =>
      wantLang.startsWith(t.language.toLowerCase().replace("-", "_")),
    ) ||
    sameName[0]
  );
}

function componentParameters(components: unknown[], type: string): unknown[] {
  const component = components.find((c) => typeOf(c) === type.toUpperCase());
  if (!isRecord(component) || !Array.isArray(component.parameters)) {
    return [];
  }
  return component.parameters;
}

function definitionComponent(
  definition: TemplateData,
  type: string,
): Record<string, unknown> | undefined {
  const found = definition.components.find(
    (c) => c.type.toUpperCase() === type.toUpperCase(),
  );
  return isRecord(found) ? found : undefined;
}

function looksLikeButtonReply(data: Record<string, unknown>): boolean {
  return typeof data.text === "string" && typeof data.payload === "string";
}

function looksLikeInteractive(data: Record<string, unknown>): boolean {
  const inner = unwrapInteractive(data);
  if (inner.type === "button_reply" || isRecord(inner.button_reply)) {
    return true;
  }
  if (inner.type === "list_reply" || isRecord(inner.list_reply)) {
    return true;
  }
  return !!collectButtons(inner)?.length;
}

function joinedParams(params: unknown[]): string | undefined {
  const values = params
    .map(parameterText)
    .filter((value): value is string => !!value);
  return values.length ? values.join("\n\n") : undefined;
}

function templateDisplay(
  data: Record<string, unknown>,
  text: string | undefined,
  definition: TemplateData | undefined,
): DataMessageDisplay {
  const components = Array.isArray(data.components) ? data.components : [];
  const headerParams = componentParameters(components, "header");
  const bodyParams = componentParameters(components, "body");
  const paramValues = [
    ...headerParams.map(parameterText),
    ...bodyParams.map(parameterText),
  ].filter((value): value is string => !!value);

  if (definition) {
    const head = definitionComponent(definition, "HEADER");
    const body = definitionComponent(definition, "BODY");
    const foot = definitionComponent(definition, "FOOTER");
    const butt = definitionComponent(definition, "BUTTONS");

    const header = str(head?.text)
      ? fillPlaceholders(head!.text as string, headerParams)
      : undefined;
    const filledBody = str(body?.text)
      ? fillPlaceholders(body!.text as string, bodyParams)
      : undefined;
    const footer = str(foot?.text);
    const buttons = Array.isArray(butt?.buttons)
      ? (butt.buttons as unknown[])
          .map(buttonLabel)
          .filter((label): label is string => !!label)
      : undefined;

    if (filledBody || header) {
      return {
        header,
        body: filledBody || joinedParams(bodyParams) || str(data.name) || "",
        footer,
        buttons: buttons?.length ? buttons : undefined,
      };
    }

    if (buttons?.length) {
      return {
        body: str(text) || joinedParams(bodyParams) || str(data.name) || "",
        buttons,
        footer,
      };
    }
  }

  // Stored `text` is often just one variable (e.g. "4"). Prefer the full
  // parameter list whenever `text` is clearly one of those values.
  const storedText = str(text);
  const textIsJustAParam =
    !!storedText && paramValues.some((value) => value === storedText);

  return {
    header: joinedParams(headerParams),
    body:
      (!textIsJustAParam && storedText) ||
      joinedParams(bodyParams) ||
      storedText ||
      str(data.name) ||
      "",
  };
}

function interactiveDisplay(
  data: Record<string, unknown>,
  text?: string,
): DataMessageDisplay {
  const inner = unwrapInteractive(data);
  const buttonReply = isRecord(inner.button_reply)
    ? inner.button_reply
    : undefined;
  const listReply = isRecord(inner.list_reply) ? inner.list_reply : undefined;

  if (buttonReply) {
    return { body: str(text) || str(buttonReply.title) || "" };
  }
  if (listReply) {
    return { body: str(text) || str(listReply.title) || "" };
  }

  return {
    header: componentText(inner.header),
    body: str(text) || componentText(inner.body) || "",
    footer: componentText(inner.footer),
    buttons: collectButtons(inner),
  };
}

/**
 * Human-readable view of a `data` message (templates, interactive buttons,
 * button replies). Returns undefined for payloads that should stay JSON
 * (tool args/results, unknown shapes).
 */
export function getDataMessageDisplay(
  content: DataContent,
  templates?: TemplateData[],
): DataMessageDisplay | undefined {
  const data = isRecord(content.data) ? content.data : undefined;
  if (!data) {
    return str(content.text) ? { body: content.text! } : undefined;
  }

  const payload = templatePayload(data);
  if (content.kind === "template" || looksLikeTemplate(payload)) {
    const languageCode = isRecord(payload.language)
      ? str(payload.language.code)
      : undefined;
    const definition =
      str(payload.name) && languageCode
        ? findTemplateDefinition(
            templates,
            payload.name as string,
            languageCode,
          )
        : undefined;
    const display = templateDisplay(payload, content.text, definition);
    if (display.body || display.buttons?.length) {
      return display;
    }
  }

  if (content.kind === "button" || looksLikeButtonReply(data)) {
    const body = str(content.text) || str(data.text);
    if (body) {
      return { body };
    }
  }

  if (content.kind === "interactive" || looksLikeInteractive(data)) {
    const display = interactiveDisplay(data, content.text);
    if (display.body || display.buttons?.length) {
      return display;
    }
  }

  if (str(content.text)) {
    return { body: content.text! };
  }
}
