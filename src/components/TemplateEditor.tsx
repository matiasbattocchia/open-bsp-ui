import { useEffect, useRef } from "react";
import { type TemplateData } from "@/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { PlusIcon } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import TemplatePreview from "./TemplatePreview";
import FieldError from "./FieldError";
import SectionBody from "./SectionBody";
import SectionFooter from "./SectionFooter";
import Button from "./Button";
import SelectField from "./SelectField";
import { useNavigate } from "@tanstack/react-router";
import { useCreateTemplate, useUpdateTemplate } from "@/queries/useTemplates";

interface TemplateFormData {
  name: string;
  language: string;
  category: "MARKETING" | "UTILITY";
  header: string;
  headerVariable: string;
  body: string;
  bodyVariables: { value: string }[];
  footer: string;
}

export default function TemplateEditor({
  existingTemplate,
  organizationAddress,
}: {
  existingTemplate?: TemplateData;
  organizationAddress: string;
}) {
  "use no memo";
  const { translate: t, currentLanguage } = useTranslation();
  const navigate = useNavigate();

  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const existingHeader =
    existingTemplate?.components.find((c) => c.type === "HEADER");
  const existingBody =
    existingTemplate?.components.find((c) => c.type === "BODY");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { isDirty, isValid, errors },
  } = useForm<TemplateFormData>({
    mode: "onTouched",
    defaultValues: {
      name: existingTemplate?.name || "",
      language: existingTemplate?.language || currentLanguage || "es",
      category: existingTemplate?.category || "MARKETING",
      header: existingHeader?.text || "",
      headerVariable: existingHeader?.example?.header_text?.[0] || "",
      body: existingBody?.text || "",
      bodyVariables: (existingBody?.example?.body_text[0] || []).map(
        (v: string) => ({ value: v }),
      ),
      footer:
        existingTemplate?.components.find((c) => c.type === "FOOTER")?.text ||
        "",
    },
  });

  const { fields, replace } = useFieldArray({
    control,
    name: "bodyVariables",
  });

  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const headerRef = useRef<HTMLInputElement | null>(null);

  const bodyText = watch("body");
  const headerText = watch("header");
  const footerText = watch("footer");
  const nameText = watch("name");
  const categoryValue = watch("category");
  const languageValue = watch("language");
  const headerVariableValue = watch("headerVariable");
  const bodyVariablesValue = watch("bodyVariables");

  // Get unique variable numbers from text, in order of appearance
  function getVarNumbers(text: string): number[] {
    const seen = new Set<number>();
    const ordered: number[] = [];
    for (const m of text.matchAll(/\{\{(\d+)\}\}/g)) {
      const n = parseInt(m[1]);
      if (!seen.has(n)) { seen.add(n); ordered.push(n); }
    }
    return ordered;
  }

  // Renumber variables in text to contiguous 1..n, returns [newText, reorderMap]
  function renumberVars(text: string) {
    const matches = Array.from(text.matchAll(/\{\{(\d+)\}\}/g));
    const seen = new Set<number>();
    const ordered: number[] = [];
    for (const m of matches) {
      const n = parseInt(m[1]);
      if (!seen.has(n)) { seen.add(n); ordered.push(n); }
    }
    if (ordered.every((n, i) => n === i + 1)) return { text, ordered };
    const renumber = new Map<number, number>();
    ordered.forEach((old, i) => renumber.set(old, i + 1));
    let result = text;
    for (const [old, _new] of renumber) {
      result = result.replaceAll(`{{${old}}}`, `__VAR_${_new}__`);
    }
    for (let i = 1; i <= renumber.size; i++) {
      result = result.replaceAll(`__VAR_${i}__`, `{{${i}}}`);
    }
    return { text: result, ordered };
  }

  // Insert text at position with spaces on left/right as needed
  function insertAtPos(text: string, pos: number, insertion: string) {
    const before = text.slice(0, pos);
    const after = text.slice(pos);
    const needsSpaceBefore = before.length > 0 && !before.endsWith(" ") && !before.endsWith("\n");
    const needsSpaceAfter = after.length > 0 && !after.startsWith(" ") && !after.startsWith("\n");
    return before + (needsSpaceBefore ? " " : "") + insertion + (needsSpaceAfter ? " " : "") + after;
  }

  // Track actual variable numbers found in body text
  const bodyVarNumbers = getVarNumbers(bodyText);

  // Sync bodyVariables field count with unique variables in body text
  useEffect(() => {
    const currentVars = bodyVariablesValue || [];
    if (bodyVarNumbers.length !== currentVars.length) {
      const newFields = Array.from({ length: bodyVarNumbers.length }, (_, i) => ({
        value: currentVars[i]?.value || "",
      }));
      replace(newFields);
    }
  }, [bodyText]);

  // Build TemplateData from watched form values for preview
  // Renumber for preview so {{N}} indices match example array positions
  const { text: previewBody } = renumberVars(bodyText);
  const previewVars = bodyVarNumbers.map((_, i) => bodyVariablesValue?.[i]?.value || "");

  const previewTemplate: TemplateData = {
    id: existingTemplate?.id || "",
    name: nameText,
    status: existingTemplate?.status || "PENDING",
    category: categoryValue,
    sub_category: "CUSTOM",
    language: languageValue,
    components: [
      ...(headerText
        ? [
            {
              type: "HEADER" as const,
              text: headerText,
              format: "TEXT" as const,
              ...(headerText.includes("{{1}}") && headerVariableValue
                ? { example: { header_text: [headerVariableValue] as [string] } }
                : {}),
            },
          ]
        : []),
      {
        type: "BODY",
        text: previewBody,
        ...(previewVars.length
          ? {
              example: {
                body_text: [previewVars],
              },
            }
          : {}),
      },
      ...(footerText
        ? [{ type: "FOOTER" as const, text: footerText }]
        : []),
    ],
  };

  function onSubmit(data: TemplateFormData) {
    // Renumber variables to contiguous 1..n on submit
    const { text: renumberedBody, ordered } = renumberVars(data.body);
    const reorderedVars = ordered.map((_, i) => data.bodyVariables[i]?.value || "");

    const template: TemplateData = {
      id: existingTemplate?.id || "",
      name: data.name,
      status: existingTemplate?.status || "PENDING",
      category: data.category,
      sub_category: "CUSTOM",
      language: data.language,
      components: [
        ...(data.header
          ? [
              {
                type: "HEADER" as const,
                text: data.header,
                format: "TEXT" as const,
                ...(data.header.includes("{{1}}") && data.headerVariable
                  ? { example: { header_text: [data.headerVariable] as [string] } }
                  : {}),
              },
            ]
          : []),
        {
          type: "BODY",
          text: renumberedBody,
          ...(reorderedVars.length
            ? {
                example: {
                  body_text: [reorderedVars],
                },
              }
            : {}),
        },
        ...(data.footer
          ? [{ type: "FOOTER" as const, text: data.footer }]
          : []),
      ],
    };

    const mutation = existingTemplate ? updateMutation : createMutation;
    mutation.mutate(
      { template, organizationAddress },
      { onSuccess: () => navigate({ to: "..", hash: (prevHash) => prevHash! }) },
    );
  }

  return (
    <>
      <SectionBody>
        <form id="template-form" onSubmit={handleSubmit(onSubmit)}>
          {/* Category */}
          <SelectField<TemplateFormData>
            name="category"
            control={control}
            label={t("Categoría")}
            disabled={!!existingTemplate}
            options={[
              { value: "MARKETING", label: t("Promoción") },
              { value: "UTILITY", label: t("Utilidad") },
            ]}
          />

          {/* Language */}
          <SelectField<TemplateFormData>
            name="language"
            control={control}
            label={t("Idioma")}
            disabled={!!existingTemplate}
            options={[
              { value: "es", label: "Español" },
              { value: "en", label: "English" },
              { value: "pt", label: "Português" },
            ]}
          />

          {/* Name */}
          <label>
            <div className="label">{t("Nombre")}</div>
            <input
              type="text"
              className="text"
              placeholder={t("nombre_de_plantilla")}
              disabled={!!existingTemplate}
              {...register("name", {
                required: t("El nombre es obligatorio"),
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/ /g, "_");
                },
              })}
            />
            <FieldError error={errors.name} />
          </label>

          {/* Header */}
          <div className="flex flex-col">
            <label>
              <div className="label">{t("Encabezado")} ({t("opcional")})</div>
              <input
                type="text"
                className="text"
                placeholder={t("Oferta para {{1}}")}
                maxLength={60}
                {...register("header", {
                  maxLength: { value: 60, message: t("Máximo 60 caracteres") },
                })}
                ref={(e) => {
                  register("header").ref(e);
                  headerRef.current = e;
                }}
              />
              <FieldError error={errors.header} />
            </label>

            {!headerText?.includes("{{1}}") && (
              <button
                type="button"
                className="self-end flex items-center gap-[3px] text-primary text-[14px] mt-[6px]"
                onClick={() => {
                  const el = headerRef.current;
                  const current = watch("header");
                  const pos = el?.selectionStart ?? current.length;
                  const newHeader = insertAtPos(current, pos, "{{1}}");
                  setValue("header", newHeader, { shouldDirty: true });
                  const cursorPos = newHeader.indexOf("{{1}}", pos > 0 ? pos - 1 : 0) + "{{1}}".length;
                  requestAnimationFrame(() => {
                    el?.focus();
                    el?.setSelectionRange(cursorPos, cursorPos);
                  });
                }}
              >
                <PlusIcon className="w-[16px] h-[16px]" />
                {t("Agregar variable")}
              </button>
            )}
          </div>

          {headerText?.includes("{{1}}") && (
            <label>
              <div className="label">{t("Variable de encabezado")} {"{{1}}"}</div>
              <input
                type="text"
                className="text"
                placeholder={t("Ejemplo: Juan, #1234...")}
                {...register("headerVariable", {
                  validate: (value) =>
                    headerText?.includes("{{1}}") && !value
                      ? t("Ingresá un ejemplo para la variable")
                      : true,
                })}
              />
              <FieldError error={errors.headerVariable} />
            </label>
          )}

          {/* Body */}
          <div className="flex flex-col">
            <label>
              <div className="label">{t("Cuerpo")}</div>
              <textarea
                className="text"
                rows={4}
                maxLength={1024}
                placeholder={t("Hola {{1}}, tu pedido está listo.")}
                {...register("body", {
                  required: t("El cuerpo es obligatorio"),
                  maxLength: { value: 1024, message: t("Máximo 1024 caracteres") },
                  validate: (value) => {
                    const trimmed = value.trim();
                    if (/^\{\{\d+\}\}/.test(trimmed)) return t("El cuerpo no puede empezar con una variable");
                    if (/\{\{\d+\}\}$/.test(trimmed)) return t("El cuerpo no puede terminar con una variable");
                    return true;
                  },
                })}
                ref={(e) => {
                  register("body").ref(e);
                  bodyRef.current = e;
                }}
              />
            </label>

            <FieldError error={errors.body} />

            <button
              type="button"
              className="self-end flex items-center gap-[3px] text-primary text-[14px] mt-[6px]"
              onClick={() => {
                const el = bodyRef.current;
                const current = watch("body");
                const nums = getVarNumbers(current);
                const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
                const pos = el?.selectionStart ?? current.length;
                const newBody = insertAtPos(current, pos, `{{${next}}}`);
                setValue("body", newBody, { shouldDirty: true, shouldValidate: true });
                // Restore cursor after the inserted variable
                const cursorPos = newBody.indexOf(`{{${next}}}`, pos > 0 ? pos - 1 : 0) + `{{${next}}}`.length;
                requestAnimationFrame(() => {
                  el?.focus();
                  el?.setSelectionRange(cursorPos, cursorPos);
                });
              }}
            >
              <PlusIcon className="w-[16px] h-[16px]" />
              {t("Agregar variable")}
            </button>
          </div>

          {/* Body variables */}
          {fields.map((field, idx) => (
            <label key={field.id}>
              <div className="label">{`{{${bodyVarNumbers[idx] ?? idx + 1}}}`}</div>
              <input
                type="text"
                className="text"
                placeholder={t("Ejemplo: Juan, #1234...")}
                {...register(`bodyVariables.${idx}.value`, {
                  validate: (value) =>
                    !value ? t("Ingresá un ejemplo para la variable") : true,
                })}
              />
              <FieldError error={errors.bodyVariables?.[idx]?.value} />
            </label>
          ))}

          {/* Footer */}
          <label>
            <div className="label">{t("Pie")} ({t("opcional")})</div>
            <input type="text" className="text" placeholder={t("Texto del pie")} maxLength={60} {...register("footer", {
              maxLength: { value: 60, message: t("Máximo 60 caracteres") },
            })} />
          </label>

          {/* Preview */}
          <label>
            <div className="label">{t("Previsualización")}</div>
            <div className="py-[12px] bg-chat relative rounded-[7.5px] [&>div>div]:!px-0 [&>div>div>div]:!max-w-[85%]">
              <TemplatePreview editMode template={previewTemplate} />
            </div>
          </label>
        </form>
      </SectionBody>

      <SectionFooter>
        <Button
          type="submit"
          form="template-form"
          invalid={!isValid || !isDirty}
          loading={isPending}
          className="primary"
        >
          {t("Enviar a revisión")}
        </Button>
      </SectionFooter>
    </>
  );
}
