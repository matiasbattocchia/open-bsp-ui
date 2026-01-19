import { useState } from "react";
import { ArrowLeft, ChevronRight, Plus, Server, Trash2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { type Control, useFieldArray, type FieldValues, type UseFormRegister, useWatch } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import SectionItem from "@/components/SectionItem";
import type { LocalMCPToolConfig, ToolConfig } from "@/supabase/client";

type ToolsSectionProps<T extends FieldValues> = {
  control: Control<T>;
  register: UseFormRegister<T>;
};

export default function ToolsSection<T extends FieldValues>({ control, register }: ToolsSectionProps<T>) {
  const { translate: t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // useFieldArray for structure (IDs) and operations (append/remove)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { fields, append, remove } = useFieldArray({
    control,
    name: "extra.tools" as any,
  });

  // useWatch for current values (fields has stale data after edits via register)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toolsValues = (useWatch({ control, name: "extra.tools" as any }) as ToolConfig[]) || [];

  // Combine fields (for IDs) with watched values (for current data)
  const mcpTools = fields
    .map((field, index) => ({
      ...field,
      ...(toolsValues[index] || {}),
    }))
    .filter((tool): tool is LocalMCPToolConfig & { id: string } => (tool as any).type === "mcp");

  const handleEditMCP = (mcpIndex: number) => {
    const tool = mcpTools[mcpIndex];
    const actualIndex = fields.findIndex((f) => (f as any).id === (tool as any).id);
    setEditingIndex(actualIndex);
  };

  const handleAddMCP = () => {
    // Append a new empty MCP tool and immediately edit it
    const newTool: LocalMCPToolConfig = {
      provider: "local",
      type: "mcp",
      label: "",
      config: { url: "" },
    };
    append(newTool as any);
    // Set editing index to the new tool (last index after append)
    setEditingIndex(fields.length);
  };

  const handleDeleteTool = (index: number) => {
    remove(index);
  };

  const handleBack = () => {
    setIsOpen(false);
    setEditingIndex(null);
  };

  return (
    <>
      {/* Trigger - navigation style */}
      <button
        type="button"
        className="text w-full flex justify-between items-center text-left"
        onClick={() => setIsOpen(true)}
      >
        <span className="text-foreground">{t("Herramientas")}</span>
        <ChevronRight className="w-[20px] h-[20px] text-muted-foreground shrink-0" />
      </button>

      {/* Tools List Modal */}
      {isOpen && editingIndex === null && (
        <div className="absolute inset-0 bottom-[80px] z-50 bg-background flex flex-col">
          <div className="header items-center truncate shrink-0">
            <button
              type="button"
              className="p-[8px] rounded-full hover:bg-muted mr-[8px] ml-[-8px]"
              title={t("Volver")}
              onClick={handleBack}
            >
              <ArrowLeft className="w-[24px] h-[24px]" />
            </button>
            <div className="text-[16px]">{t("Herramientas")}</div>
          </div>

          <SectionBody>
            <SectionItem
              title={t("Agregar servidor MCP")}
              aside={
                <div className="p-[8px] bg-primary/10 rounded-full">
                  <Plus className="w-[24px] h-[24px] text-primary" />
                </div>
              }
              onClick={handleAddMCP}
            />

            {mcpTools.map((tool, index) => (
              <SectionItem
                key={(tool as any).id || index}
                title={tool.label || t("Sin nombre")}
                description={tool.config.url || t("Sin URL")}
                aside={
                  <div className="p-[8px] bg-muted rounded-full">
                    <Server className="w-[24px] h-[24px] text-muted-foreground" />
                  </div>
                }
                onClick={() => handleEditMCP(index)}
              />
            ))}
          </SectionBody>
        </div>
      )}

      {/* MCP Server Editor - for both new and existing tools */}
      {isOpen && editingIndex !== null && (
        <MCPServerEditor
          index={editingIndex}
          register={register}
          control={control}
          onDelete={() => {
            handleDeleteTool(editingIndex);
            setEditingIndex(null);
          }}
          onBack={() => setEditingIndex(null)}
        />
      )}
    </>
  );
}

// MCP Server Editor - uses parent form's register directly
function MCPServerEditor<T extends FieldValues>({
  index,
  register,
  control,
  onDelete,
  onBack,
}: {
  index: number;
  register: UseFormRegister<T>;
  control: Control<T>;
  onDelete: () => void;
  onBack: () => void;
}) {
  const { translate: t } = useTranslation();

  // Watch current values to check validity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const label = (useWatch({ control, name: `extra.tools.${index}.label` as any }) as string) || "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const url = (useWatch({ control, name: `extra.tools.${index}.config.url` as any }) as string) || "";

  const isValid = label.trim() !== "" && url.trim() !== "";

  return (
    <div className="absolute inset-0 bottom-[80px] z-50 bg-background flex flex-col">
      <div className="header items-center truncate shrink-0">
        <button
          type="button"
          className="p-[8px] rounded-full hover:bg-muted mr-[8px] ml-[-8px] disabled:opacity-30 disabled:hover:bg-transparent"
          title={isValid ? t("Volver") : t("Volver") + " - " + t("Completa los campos requeridos")}
          onClick={onBack}
          disabled={!isValid}
        >
          <ArrowLeft className="w-[24px] h-[24px]" />
        </button>
        <div className="text-[16px]">{label ? t("Editar servidor MCP") : t("Agregar servidor MCP")}</div>

        {/* Delete button - matches SectionHeader style */}
        <button
          type="button"
          className="p-[8px] rounded-full hover:bg-muted ml-auto"
          title={t("Eliminar")}
          onClick={onDelete}
        >
          <Trash2 className="w-[24px] h-[24px]" />
        </button>
      </div>

      <SectionBody className="gap-[24px] pl-[10px]">
        <label>
          <div className="label">{t("Nombre")}</div>
          <input
            type="text"
            className="text"
            placeholder={t("Mi servidor MCP")}
            {...register(`extra.tools.${index}.label` as any, { required: true })}
          />
        </label>

        <label>
          <div className="label">{t("URL")}</div>
          <input
            type="url"
            className="text"
            placeholder="https://mcp.example.com/sse"
            {...register(`extra.tools.${index}.config.url` as any, { required: true })}
          />
        </label>

        <label>
          <div className="label">{t("Clave API")}</div>
          <input
            type="text"
            className="text"
            placeholder="Bearer sk-..."
            {...register(`extra.tools.${index}.config.headers.authentication` as any)}
          />
        </label>
      </SectionBody>
    </div>
  );
}
