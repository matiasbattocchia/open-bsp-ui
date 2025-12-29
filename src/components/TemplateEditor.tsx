import {
  useState,
} from "react";
import { type TemplateData } from "@/supabase/client";
import { Translate as T, useTranslation } from "@/hooks/useTranslation";
import { LoaderCircle, PlusIcon } from "lucide-react";
import Input from "antd/es/input/Input";
import TextArea from "antd/es/input/TextArea";
import TemplatePreview from "./TemplatePreview";
import { useNavigate } from "@tanstack/react-router";
import { useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from "@/queries/useTemplates";

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

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  // Parse body variables from text: {{1}}, {{2}}, etc.
  const bodyVariablesAux = Array.from(body.matchAll(/{{(\d+)}}/g) || []).map(
    (r: any) => parseInt(r[1]),
  );

  const bodyVariablesRange = [];

  // Assuming consecutive variables starting from 1
  for (let i = 1; i <= 9; i++) {
    if (!bodyVariablesAux.includes(i)) {
      break;
    }
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
      ...(header ? [{ type: "HEADER" as const, text: header, format: "TEXT" as const }] : []),
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

  async function handleSave() {
    if (existingTemplate) {
      updateMutation.mutate(
        { template, organizationAddress },
        {
          onSuccess: () => navigate({ to: "/templates" }),
        }
      );
    } else {
      createMutation.mutate(
        { template, organizationAddress },
        {
          onSuccess: () => navigate({ to: "/templates" }),
        }
      );
    }
  }

  async function handleDelete() {
    if (!existingTemplate) return;
    deleteMutation.mutate(
      { template: existingTemplate, organizationAddress },
      {
        onSuccess: () => navigate({ to: "/templates" }),
      }
    );
  }

  return (
    <div className="flex gap-[16px] w-full p-4">
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
              className="p-1 border rounded"
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
                  className="border rounded px-2"
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

        {/* Pie */}
        <div className="field">
          <T as="label">Pie</T>
          <input
            type="text"
            className="border rounded px-2 w-full"
            value={footer}
            onChange={(e) => setFooter(e.target.value)}
          />
        </div>
      </div>

      {/* Previsualización y botones */}
      <div className="w-[50%] flex flex-col gap-[2px]">
        <T as="label">Previsualización</T>
        <div className="py-[12px] bg-chat rounded-[7.5px] mb-[6px]">
          <TemplatePreview editMode template={template} />
        </div>
        <div className="flex gap-[6px] self-end">
          <button
            className="bg-blue-300 hover:bg-blue-400 px-3 py-1 rounded disabled:opacity-50"
            onClick={handleSave}
            disabled={isPending}
          >
            <div className="flex items-center gap-[3px]">
              {(createMutation.isPending || updateMutation.isPending) && (
                <LoaderCircle className="h-5 w-5 animate-spin stroke-blue-700" />
              )}
              <T>Enviar a revisión</T>
            </div>
          </button>

          {existingTemplate && (
            <button
              className="bg-red-300 hover:bg-red-400 px-3 py-1 rounded disabled:opacity-50"
              onClick={handleDelete}
              disabled={isPending}
            >
              <div className="flex items-center gap-[3px]">
                {deleteMutation.isPending && (
                  <LoaderCircle className="h-5 w-5 animate-spin stroke-red-700" />
                )}
                <T>Eliminar</T>
              </div>
            </button>
          )}

          <T
            as="button"
            className="bg-zinc-300 hover:bg-zinc-400 px-3 py-1 rounded"
            onClick={() => navigate({ to: "/templates" })}
          >
            Descartar
          </T>
        </div>
      </div>
    </div>
  );
}
