import { useState } from "react";
import { type TemplateData } from "@/supabase/client";
import { Translate as T, useTranslation } from "@/hooks/useTranslation";
import { LoaderCircle, PlusIcon } from "lucide-react";
import Input from "antd/es/input/Input";
import TextArea from "antd/es/input/TextArea";
import TemplatePreview from "./TemplatePreview";
import SectionBody from "./SectionBody";
import SectionFooter from "./SectionFooter";
import { useNavigate } from "@tanstack/react-router";
import {
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from "@/queries/useTemplates";

export default function TemplateEditor({
  existingTemplate,
  organizationAddress,
}: {
  existingTemplate?: TemplateData;
  organizationAddress: string;
}) {
  const { currentLanguage } = useTranslation();
  const navigate = useNavigate();

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

  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const bodyVariablesAux = Array.from(body.matchAll(/{{(\d+)}}/g) || []).map(
    (r: any) => parseInt(r[1]),
  );

  const bodyVariablesRange = [];
  for (let i = 1; i <= 9; i++) {
    if (!bodyVariablesAux.includes(i)) break;
    bodyVariablesRange.push(i);
  }

  const template: TemplateData = {
    id: existingTemplate?.id || "",
    name,
    status: existingTemplate?.status || "PENDING",
    category: category as "MARKETING",
    sub_category: "CUSTOM",
    language,
    components: [
      ...(header
        ? [{ type: "HEADER" as const, text: header, format: "TEXT" as const }]
        : []),
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
      ...(footer ? [{ type: "FOOTER" as const, text: footer }] : []),
    ],
  };

  function handleSave() {
    if (existingTemplate) {
      updateMutation.mutate(
        { template, organizationAddress },
        { onSuccess: () => navigate({ to: "/templates" }) },
      );
    } else {
      createMutation.mutate(
        { template, organizationAddress },
        { onSuccess: () => navigate({ to: "/templates" }) },
      );
    }
  }

  function handleDelete() {
    if (!existingTemplate) return;
    deleteMutation.mutate(
      { template: existingTemplate, organizationAddress },
      { onSuccess: () => navigate({ to: "/templates" }) },
    );
  }

  return (
    <>
      <SectionBody className="gap-[16px]">
        {/* Category */}
        <div className="flex flex-col gap-[4px]">
          <T as="label" className="text-muted-foreground text-[14px]">
            Categoría
          </T>
          <div className="flex gap-[12px]">
            <label className="flex items-center gap-[4px]">
              <input
                type="radio"
                name="category"
                value="MARKETING"
                checked={category === "MARKETING"}
                onChange={(e) => setCategory(e.target.value as "MARKETING" | "UTILITY")}
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
                onChange={(e) => setCategory(e.target.value as "MARKETING" | "UTILITY")}
                disabled={!!existingTemplate}
              />
              <T>Utilidad</T>
            </label>
          </div>
        </div>

        {/* Language */}
        <div className="flex flex-col gap-[4px]">
          <T as="label" className="text-muted-foreground text-[14px]">
            Idioma
          </T>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={!!existingTemplate}
            className="bg-muted text-foreground rounded-[8px] px-[12px] py-[8px] border border-border"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
          </select>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-[4px]">
          <T as="label" className="text-muted-foreground text-[14px]">
            Nombre
          </T>
          <Input
            count={{ show: true, max: 512 }}
            value={name}
            onChange={(e) => setName(e.target.value.replace(" ", "_"))}
            disabled={!!existingTemplate}
          />
        </div>

        {/* Header */}
        <div className="flex flex-col gap-[4px]">
          <T as="label" className="text-muted-foreground text-[14px]">
            Encabezado
          </T>
          <Input
            count={{ show: true, max: 60 }}
            value={header}
            onChange={(e) => setHeader(e.target.value)}
          />
        </div>

        {/* Body */}
        <div className="flex flex-col gap-[4px]">
          <T as="label" className="text-muted-foreground text-[14px]">
            Cuerpo
          </T>
          <TextArea
            count={{ show: true, max: 1024 }}
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          <button
            onClick={() =>
              setBody(body + ` {{${bodyVariablesRange.length + 1}}}`)
            }
            className="self-end mt-[4px]"
          >
            <div className="flex items-center gap-[3px] cursor-pointer text-primary text-[14px]">
              <PlusIcon className="w-[16px] h-[16px]" />
              <T>Agregar variable</T>
            </div>
          </button>

          <div className="flex flex-col gap-[4px]">
            {bodyVariablesRange.map((i) => (
              <div key={i} className="flex items-center gap-[12px]">
                <label className="text-muted-foreground text-[14px]">{`{{${i}}}`}</label>
                <input
                  type="text"
                  className="bg-muted text-foreground rounded-[8px] px-[12px] py-[6px] border border-border flex-1"
                  value={bodyVariables[i - 1] || ""}
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

        {/* Footer */}
        <div className="flex flex-col gap-[4px]">
          <T as="label" className="text-muted-foreground text-[14px]">
            Pie
          </T>
          <input
            type="text"
            className="bg-muted text-foreground rounded-[8px] px-[12px] py-[8px] border border-border w-full"
            value={footer}
            onChange={(e) => setFooter(e.target.value)}
          />
        </div>

        {/* Preview */}
        <div className="flex flex-col gap-[4px]">
          <T as="label" className="text-muted-foreground text-[14px]">
            Previsualización
          </T>
          <div className="py-[12px] bg-chat rounded-[7.5px]">
            <TemplatePreview editMode template={template} />
          </div>
        </div>
      </SectionBody>

      <SectionFooter className="flex-row gap-[8px]">
        <button
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-[16px] py-[8px] rounded-[8px] disabled:opacity-50"
          onClick={handleSave}
          disabled={isPending || !name || !body}
        >
          <div className="flex items-center gap-[4px]">
            {(createMutation.isPending || updateMutation.isPending) && (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            )}
            <T>Enviar a revisión</T>
          </div>
        </button>

        {existingTemplate && (
          <button
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-[16px] py-[8px] rounded-[8px] disabled:opacity-50"
            onClick={handleDelete}
            disabled={isPending}
          >
            <div className="flex items-center gap-[4px]">
              {deleteMutation.isPending && (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              )}
              <T>Eliminar</T>
            </div>
          </button>
        )}

        <T
          as="button"
          className="bg-muted text-foreground hover:bg-muted/80 px-[16px] py-[8px] rounded-[8px]"
          onClick={() => navigate({ to: "/templates" })}
        >
          Descartar
        </T>
      </SectionFooter>
    </>
  );
}
