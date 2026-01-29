import { useState, useRef } from "react";
import { ArrowLeft, Calendar, Check, ChevronRight, Database, FileSpreadsheet, Globe, Plus, Server, Trash2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { type Control, useFieldArray, type FieldValues, type UseFormRegister, useWatch, type UseFormSetValue } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import SectionItem from "@/components/SectionItem";
import SelectField from "@/components/SelectField";
import Switch from "@/components/Switch";
import type { LocalMCPToolConfig, LocalHTTPToolConfig, LocalSQLToolConfig, LocalFunctionToolConfig, ToolConfig } from "@/supabase/client";

type ToolsSectionProps<T extends FieldValues> = {
  control: Control<T>;
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
};

type EditorState =
  | { type: "closed" }
  | { type: "new-selection" }
  | { type: "mcp"; index: number }
  | { type: "google-mcp"; index: number }
  | { type: "http"; index: number }
  | { type: "sql"; index: number };

export default function ToolsSection<T extends FieldValues>({ control, register, setValue }: ToolsSectionProps<T>) {
  const { translate: t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState>({ type: "closed" });

  // useFieldArray for structure (IDs) and operations (append/remove)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "extra.tools" as any,
  });

  // useWatch for current values (fields has stale data after edits via register)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toolsValues = (useWatch({ control, name: "extra.tools" as any }) as ToolConfig[]) || [];

  // Combine fields (for IDs) with watched values (for current data)
  const allTools = fields.map((field, index) => ({
    ...field,
    ...(toolsValues[index] || {}),
    _index: index,
  }));

  const googleTools = allTools.filter((tool): tool is LocalMCPToolConfig & { id: string; _index: number } =>
    (tool as any).type === "mcp" && ["calendar", "sheets"].includes((tool as any).config?.product)
  );

  const mcpTools = allTools.filter((tool): tool is LocalMCPToolConfig & { id: string; _index: number } =>
    (tool as any).type === "mcp" && !["calendar", "sheets"].includes((tool as any).config?.product)
  );

  const httpTools = allTools.filter((tool): tool is LocalHTTPToolConfig & { id: string; _index: number } =>
    (tool as any).type === "http"
  );

  const sqlTools = allTools.filter((tool): tool is LocalSQLToolConfig & { id: string; _index: number } =>
    (tool as any).type === "sql"
  );

  // Simple tools (function type) - only one instance of each allowed
  const simpleToolNames = ["calculator", "transfer_to_human_agent"] as const;
  type SimpleToolName = typeof simpleToolNames[number];

  const hasSimpleTool = (name: SimpleToolName): boolean => {
    return toolsValues.some(
      (tool) => tool.type === "function" && (tool as LocalFunctionToolConfig).name === name
    );
  };

  const toggleSimpleTool = (name: SimpleToolName) => {
    if (hasSimpleTool(name)) {
      // Remove the tool
      const index = toolsValues.findIndex(
        (tool) => tool.type === "function" && (tool as LocalFunctionToolConfig).name === name
      );
      if (index !== -1) {
        remove(index);
      }
    } else {
      // Add the tool
      const newTool: LocalFunctionToolConfig = {
        provider: "local",
        type: "function",
        name,
      };
      append(newTool as any);
    }
  };

  const handleAddMCP = () => {
    const newTool: LocalMCPToolConfig = {
      provider: "local",
      type: "mcp",
      label: "",
      config: { url: "" },
    };
    append(newTool as any);
    setEditor({ type: "mcp", index: fields.length });
  };

  const handleAddHTTP = () => {
    const newTool: LocalHTTPToolConfig = {
      provider: "local",
      type: "http",
      label: "",
      config: {
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      },
    };
    append(newTool as any);
    setEditor({ type: "http", index: fields.length });
  };

  const handleAddSQL = () => {
    const newTool: LocalSQLToolConfig = {
      provider: "local",
      type: "sql",
      label: "",
      config: { driver: "libsql", url: "" },
    };
    append(newTool as any);
    setEditor({ type: "sql", index: fields.length });
  };

  const handleAddGoogle = (product: "calendar" | "sheets") => {
    const defaultTools = product === "calendar"
      ? ["list_calendars", "list_events", "check_availability", "create_event", "update_event", "delete_event"]
      : ["list_authorized_files", "get_spreadsheet", "get_sheet_schema", "describe_sheet", "search_rows", "read_sheet", "write_sheet", "append_rows", "create_spreadsheet"];

    const newTool: LocalMCPToolConfig = {
      provider: "local",
      type: "mcp",
      label: "",
      config: {
        url: "https://g.mcp.openbsp.dev/mcp",
        product,
        allowed_tools: defaultTools,
      },
    };
    append(newTool as any);
    setEditor({ type: "google-mcp", index: fields.length });
  };

  const handleDeleteTool = (index: number) => {
    remove(index);
  };

  const handleBack = () => {
    setIsOpen(false);
    setEditor({ type: "closed" });
  };

  const isEditing = editor.type !== "closed";

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
      {isOpen && !isEditing && (
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
            {/* Add button */}
            <SectionItem
              title={t("Agregar herramienta")}
              aside={
                <div className="p-[8px] bg-primary/10 rounded-full">
                  <Plus className="w-[24px] h-[24px] text-primary" />
                </div>
              }
              onClick={() => setEditor({ type: "new-selection" })}
            />

            {/* Google Tools */}
            {googleTools.map((tool) => (
              <SectionItem
                key={tool.id}
                title={tool.label || t("Sin nombre")}
                description={tool.config.url || t("Sin URL")}
                aside={
                  <div className="p-[8px] bg-muted rounded-full">
                    {tool.config.product === "calendar" ? (
                      <Calendar className="w-[24px] h-[24px] text-muted-foreground" />
                    ) : (
                      <FileSpreadsheet className="w-[24px] h-[24px] text-muted-foreground" />
                    )}
                  </div>
                }
                onClick={() => setEditor({ type: "google-mcp", index: tool._index })}
              />
            ))}

            {/* Existing MCP Clients */}
            {mcpTools.map((tool) => (
              <SectionItem
                key={tool.id}
                title={tool.label || t("Sin nombre")}
                description={tool.config.url || t("Sin URL")}
                aside={
                  <div className="p-[8px] bg-muted rounded-full">
                    <Server className="w-[24px] h-[24px] text-muted-foreground" />
                  </div>
                }
                onClick={() => setEditor({ type: "mcp", index: tool._index })}
              />
            ))}

            {/* Existing HTTP Clients */}
            {httpTools.map((tool) => (
              <SectionItem
                key={tool.id}
                title={tool.label || t("Sin nombre")}
                description={(tool.config as any)?.url || t("Sin URL base")}
                aside={
                  <div className="p-[8px] bg-muted rounded-full">
                    <Globe className="w-[24px] h-[24px] text-muted-foreground" />
                  </div>
                }
                onClick={() => setEditor({ type: "http", index: tool._index })}
              />
            ))}

            {/* Existing SQL Clients */}
            {sqlTools.map((tool) => {
              const config = tool.config as any;
              const driver = config.driver || "libsql";
              // Format: driver://host/db
              const desc = driver === "libsql"
                ? `${driver}://${config.url?.replace(/^.*:\/\//, "") || ""}`
                : `${driver}://${config.host || "localhost"}/${config.database || ""}`;

              return (
                <SectionItem
                  key={tool.id}
                  title={tool.label || t("Sin nombre")}
                  description={desc}
                  aside={
                    <div className="p-[8px] bg-muted rounded-full">
                      <Database className="w-[24px] h-[24px] text-muted-foreground" />
                    </div>
                  }
                  onClick={() => setEditor({ type: "sql", index: tool._index })}
                />
              );
            })}

            {/* Simple Tools (Toggles) */}

            <div className="flex flex-col gap-[24px] pl-[10px] mt-[6px]">
              <div className="border-t border-border" />

              {/* Calculator */}
              {/* Calculator */}
              <label className="flex items-center gap-[12px] cursor-pointer justify-between">
                <div className="flex-1">
                  <div className="text-foreground">{t("Calculadora")}</div>
                  <p className="text-muted-foreground text-[14px]">
                    {t("Evita errores de cálculo en LLMs")}
                  </p>
                </div>
                <Switch
                  checked={hasSimpleTool("calculator")}
                  onCheckedChange={() => toggleSimpleTool("calculator")}
                  className="mt-[4px]"
                />
              </label>

              {/* Transfer to Human */}
              <label className="flex items-center gap-[12px] cursor-pointer justify-between">
                <div className="flex-1">
                  <div className="text-foreground">{t("Transferir a humano")}</div>
                  <p className="text-muted-foreground text-[14px]">
                    {t("Dejar que un humano responda cuando no se tiene la respuesta exacta")}
                  </p>
                </div>
                <Switch
                  checked={hasSimpleTool("transfer_to_human_agent")}
                  onCheckedChange={() => toggleSimpleTool("transfer_to_human_agent")}
                  className="mt-[4px]"
                />
              </label>
            </div>
          </SectionBody>
        </div>
      )}

      {/* New Tool Selection */}
      {isOpen && editor.type === "new-selection" && (
        <NewToolSelection
          onBack={() => setEditor({ type: "closed" })}
          onAddMCP={handleAddMCP}
          onAddHTTP={handleAddHTTP}
          onAddSQL={handleAddSQL}
          onAddGoogle={handleAddGoogle}
        />
      )}

      {/* Google MCP Client Editor */}
      {isOpen && editor.type === "google-mcp" && (
        <GoogleMCPClientEditor
          index={editor.index}
          register={register}
          control={control}
          setValue={setValue}
          updateTool={(idx, data) => update(idx, data as any)}
          onDelete={() => {
            handleDeleteTool(editor.index);
            setEditor({ type: "closed" });
          }}
          onBack={() => setEditor({ type: "closed" })}
        />
      )}

      {/* MCP Client Editor */}
      {isOpen && editor.type === "mcp" && (
        <MCPClientEditor
          index={editor.index}
          register={register}
          control={control}
          onDelete={() => {
            handleDeleteTool(editor.index);
            setEditor({ type: "closed" });
          }}
          onBack={() => setEditor({ type: "closed" })}
        />
      )}

      {/* HTTP Client Editor */}
      {isOpen && editor.type === "http" && (
        <HTTPClientEditor
          index={editor.index}
          register={register}
          control={control}
          onDelete={() => {
            handleDeleteTool(editor.index);
            setEditor({ type: "closed" });
          }}
          onBack={() => setEditor({ type: "closed" })}
        />
      )}

      {/* SQL Client Editor */}
      {isOpen && editor.type === "sql" && (
        <SQLClientEditor
          index={editor.index}
          register={register}
          control={control}
          setValue={setValue}
          onDelete={() => {
            handleDeleteTool(editor.index);
            setEditor({ type: "closed" });
          }}
          onBack={() => setEditor({ type: "closed" })}
        />
      )}
    </>
  );
}

// MCP Client Editor
function MCPClientEditor<T extends FieldValues>({
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const label = (useWatch({ control, name: `extra.tools.${index}.label` as any }) as string) || "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const url = (useWatch({ control, name: `extra.tools.${index}.config.url` as any }) as string) || "";

  const isValid = label.trim() !== "" && url.trim() !== "";
  const isEmpty = label.trim() === "" && url.trim() === "";

  // Allow back if valid OR if unchanged (empty) - empty tools get deleted
  const canGoBack = isValid || isEmpty;

  const handleBack = () => {
    if (isEmpty) {
      onDelete(); // Delete empty tool
    } else {
      onBack();
    }
  };

  return (
    <div className="absolute inset-0 bottom-[80px] z-50 bg-background flex flex-col">
      <div className="header items-center truncate shrink-0">
        <button
          type="button"
          className="p-[8px] rounded-full hover:bg-muted mr-[8px] ml-[-8px] disabled:opacity-30 disabled:hover:bg-transparent"
          title={canGoBack ? t("Volver") : t("Volver") + " - " + t("Completa los campos requeridos")}
          onClick={handleBack}
          disabled={!canGoBack}
        >
          <ArrowLeft className="w-[24px] h-[24px]" />
        </button>
        <div className="text-[16px]">{label ? t("Editar cliente MCP") : t("Agregar cliente MCP")}</div>

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
            placeholder={t("Mi cliente MCP")}
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
          <div className="label">{t("Token")} ({t("opcional")})</div>
          <input
            type="text"
            className="text"
            placeholder="Bearer sk-..."
            {...register(`extra.tools.${index}.config.headers.authorization` as any)}
          />
        </label>
      </SectionBody>
    </div>
  );
}

// HTTP Client Editor
function HTTPClientEditor<T extends FieldValues>({
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const label = (useWatch({ control, name: `extra.tools.${index}.label` as any }) as string) || "";

  const isValid = label.trim() !== "";
  const isEmpty = label.trim() === "";

  // Allow back if valid OR if unchanged (empty) - empty tools get deleted
  const canGoBack = isValid || isEmpty;

  const handleBack = () => {
    if (isEmpty) {
      onDelete(); // Delete empty tool
    } else {
      onBack();
    }
  };

  return (
    <div className="absolute inset-0 bottom-[80px] z-50 bg-background flex flex-col">
      <div className="header items-center truncate shrink-0">
        <button
          type="button"
          className="p-[8px] rounded-full hover:bg-muted mr-[8px] ml-[-8px] disabled:opacity-30 disabled:hover:bg-transparent"
          title={canGoBack ? t("Volver") : t("Volver") + " - " + t("Completa los campos requeridos")}
          onClick={handleBack}
          disabled={!canGoBack}
        >
          <ArrowLeft className="w-[24px] h-[24px]" />
        </button>
        <div className="text-[16px]">{label ? t("Editar cliente HTTP") : t("Agregar cliente HTTP")}</div>

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
            placeholder={t("Mi cliente HTTP")}
            {...register(`extra.tools.${index}.label` as any, { required: true })}
          />
        </label>

        <SelectField
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name={`extra.tools.${index}.config.methods` as any}
          control={control}
          label={t("Métodos")}
          multiple
          options={[
            { value: "GET", label: "GET" },
            { value: "POST", label: "POST" },
            { value: "PUT", label: "PUT" },
            { value: "PATCH", label: "PATCH" },
            { value: "DELETE", label: "DELETE" },
          ]}
        />

        <label>
          <div className="label">{t("URL base")} ({t("opcional")})</div>
          <input
            type="url"
            className="text"
            placeholder="https://api.example.com"
            {...register(`extra.tools.${index}.config.base_url` as any)}
          />
        </label>

        <label>
          <div className="label">{t("Token")} ({t("opcional")})</div>
          <input
            type="text"
            className="text"
            placeholder="Bearer sk-..."
            {...register(`extra.tools.${index}.config.headers.authorization` as any)}
          />
        </label>
      </SectionBody>
    </div>
  );
}

// SQL Client Editor with driver-specific fields
function SQLClientEditor<T extends FieldValues>({
  index,
  register,
  control,
  setValue,
  onDelete,
  onBack,
}: {
  index: number;
  register: UseFormRegister<T>;
  control: Control<T>;
  setValue: UseFormSetValue<T>;
  onDelete: () => void;
  onBack: () => void;
}) {
  const { translate: t } = useTranslation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const label = (useWatch({ control, name: `extra.tools.${index}.label` as any }) as string) || "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const driver = (useWatch({ control, name: `extra.tools.${index}.config.driver` as any }) as string) || "libsql";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const url = (useWatch({ control, name: `extra.tools.${index}.config.url` as any }) as string) || "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const host = (useWatch({ control, name: `extra.tools.${index}.config.host` as any }) as string) || "";

  // Validation depends on driver
  const isLibSQL = driver === "libsql";
  const isValid = label.trim() !== "" && (isLibSQL ? url.trim() !== "" : host.trim() !== "");
  const isEmpty = label.trim() === "" && (isLibSQL ? url.trim() === "" : host.trim() === "");

  // Allow back if valid OR if unchanged (empty) - empty tools get deleted
  const canGoBack = isValid || isEmpty;

  const handleDriverChange = (newDriver: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue(`extra.tools.${index}.config.driver` as any, newDriver as any, { shouldDirty: true });
  };

  const handleBack = () => {
    if (isEmpty) {
      onDelete(); // Delete empty tool
    } else {
      onBack();
    }
  };

  return (
    <div className="absolute inset-0 bottom-[80px] z-50 bg-background flex flex-col">
      <div className="header items-center truncate shrink-0">
        <button
          type="button"
          className="p-[8px] rounded-full hover:bg-muted mr-[8px] ml-[-8px] disabled:opacity-30 disabled:hover:bg-transparent"
          title={canGoBack ? t("Volver") : t("Volver") + " - " + t("Completa los campos requeridos")}
          onClick={handleBack}
          disabled={!canGoBack}
        >
          <ArrowLeft className="w-[24px] h-[24px]" />
        </button>
        <div className="text-[16px]">{label ? t("Editar cliente SQL") : t("Agregar cliente SQL")}</div>

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
            placeholder={t("Mi base de datos")}
            {...register(`extra.tools.${index}.label` as any, { required: true })}
          />
        </label>

        <SelectField
          label={t("Driver")}
          value={driver}
          onChange={handleDriverChange}
          options={[
            { value: "libsql", label: "LibSQL / Turso" },
            { value: "postgres", label: "PostgreSQL" },
            { value: "mysql", label: "MySQL" },
          ]}
          modalClassName="bottom-0"
        />

        {/* LibSQL-specific fields */}
        {isLibSQL && (
          <>
            <label>
              <div className="label">{t("URL")}</div>
              <input
                type="url"
                className="text"
                placeholder="libsql://your-database.turso.io"
                {...register(`extra.tools.${index}.config.url` as any, { required: true })}
              />
            </label>

            <label>
              <div className="label">{t("Token")} ({t("opcional")})</div>
              <input
                type="text"
                className="text"
                placeholder="eyJhbGciOiJFZ..."
                {...register(`extra.tools.${index}.config.token` as any)}
              />
            </label>
          </>
        )}

        {/* Postgres/MySQL-specific fields */}
        {!isLibSQL && (
          <>
            <label>
              <div className="label">{t("Host")}</div>
              <input
                type="text"
                className="text"
                placeholder="localhost"
                {...register(`extra.tools.${index}.config.host` as any, { required: true })}
              />
            </label>

            <label>
              <div className="label">{t("Puerto")} ({t("opcional")})</div>
              <input
                type="number"
                className="text"
                placeholder={driver === "postgres" ? "5432" : "3306"}
                {...register(`extra.tools.${index}.config.port` as any, { valueAsNumber: true })}
              />
            </label>

            <label>
              <div className="label">{t("Usuario")} ({t("opcional")})</div>
              <input
                type="text"
                className="text"
                placeholder={driver === "postgres" ? "postgres" : "root"}
                {...register(`extra.tools.${index}.config.user` as any)}
              />
            </label>

            <label>
              <div className="label">{t("Contraseña")} ({t("opcional")})</div>
              <input
                type="text"
                className="text"
                placeholder={t("Contraseña")}
                {...register(`extra.tools.${index}.config.password` as any)}
              />
            </label>

            <label>
              <div className="label">{t("Base de datos")} ({t("opcional")})</div>
              <input
                type="text"
                className="text"
                placeholder="mydb"
                {...register(`extra.tools.${index}.config.database` as any)}
              />
            </label>
          </>
        )}
      </SectionBody>
    </div>
  );
}
// Google MCP Client Editor
function GoogleMCPClientEditor<T extends FieldValues>({
  index,
  register,
  control,
  setValue,
  updateTool,
  onDelete,
  onBack,
}: {
  index: number;
  register: UseFormRegister<T>;
  control: Control<T>;
  setValue: UseFormSetValue<T>;
  updateTool: (index: number, data: ToolConfig) => void;
  onDelete: () => void;
  onBack: () => void;
}) {
  const { translate: t } = useTranslation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product = (useWatch({ control, name: `extra.tools.${index}.config.product` as any }) as string);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const label = (useWatch({ control, name: `extra.tools.${index}.label` as any }) as string) || "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (useWatch({ control, name: `extra.tools.${index}.config.headers.authorization` as any }) as string) || "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const files = (useWatch({ control, name: `extra.tools.${index}.config.files` as any }) as string[]) || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allowedTools = (useWatch({ control, name: `extra.tools.${index}.config.allowed_tools` as any }) as string[]) || [];

  // Keep a ref with fresh values that the callback can access
  const currentValuesRef = useRef({ label, token, files, allowedTools, product });
  currentValuesRef.current = { label, token, files, allowedTools, product };

  const isValid = label.trim() !== "" && token.trim() !== "";
  const isEmpty = label.trim() === "" && token.trim() === "";

  // Allow back if valid OR if unchanged (empty) - empty tools get deleted
  const canGoBack = isValid || isEmpty;

  const handleBack = () => {
    if (isEmpty) {
      onDelete(); // Delete empty tool
    } else {
      onBack();
    }
  };

  const handleGetToken = () => {
    // Open popup
    // https://g.mcp.openbsp.dev/auth/google?products=calendar,sheets&callback=YOUR_CALLBACK_URL
    const callbackUrl = window.location.origin + "/oauth/callback";
    const authUrl = `https://g.mcp.openbsp.dev/auth/google?products=${product}&callback=${encodeURIComponent(callbackUrl)}`;

    // Calculate center position
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      authUrl,
      "google_auth_popup",
      `width=${width},height=${height},top=${top},left=${left}`
    );

    // Listen for message
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "oauth-callback" && event.data?.apiKey) {
        // Build tool from fresh ref values (not stale closure data)
        const { label: freshLabel, files: freshFiles, allowedTools: freshAllowedTools, product: freshProduct } = currentValuesRef.current;
        const newToken = `Bearer ${event.data.apiKey}`;
        const updatedTool: LocalMCPToolConfig = {
          provider: "local",
          type: "mcp",
          label: freshLabel,
          config: {
            url: "https://g.mcp.openbsp.dev/mcp",
            product: freshProduct as "calendar" | "sheets",
            allowed_tools: freshAllowedTools,
            files: event.data?.files
              ? (typeof event.data.files === 'string' ? event.data.files.split(',') : [])
              : freshFiles,
            headers: {
              authorization: newToken,
            },
          },
        };
        updateTool(index, updatedTool);

        // Explicitly set the token field to force dirty state
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue(`extra.tools.${index}.config.headers.authorization` as any, newToken as any, { shouldDirty: true, shouldValidate: true, shouldTouch: true });

        // Remove listener
        window.removeEventListener("message", handleMessage);
      }
    };

    window.addEventListener("message", handleMessage);
  };

  const allowedToolsOptions = product === "calendar"
    ? [
      { value: "list_calendars", label: t("Listar calendarios") },
      { value: "list_events", label: t("Listar eventos") },
      { value: "check_availability", label: t("Verificar disponibilidad") },
      { value: "create_event", label: t("Crear evento") },
      { value: "update_event", label: t("Actualizar evento") },
      { value: "delete_event", label: t("Eliminar evento") },
    ]
    : [
      { value: "list_authorized_files", label: t("Listar archivos autorizados") },
      { value: "get_spreadsheet", label: t("Obtener hoja de cálculo") },
      { value: "get_sheet_schema", label: t("Obtener esquema de la hoja") },
      { value: "describe_sheet", label: t("Describir hoja") },
      { value: "search_rows", label: t("Buscar filas") },
      { value: "read_sheet", label: t("Leer hoja") },
      { value: "write_sheet", label: t("Escribir hoja") },
      { value: "append_rows", label: t("Agregar filas") },
      { value: "create_spreadsheet", label: t("Crear hoja de cálculo") },
    ];

  return (
    <div className="absolute inset-0 bottom-[80px] z-50 bg-background flex flex-col">
      <div className="header items-center truncate shrink-0">
        <button
          type="button"
          className="p-[8px] rounded-full hover:bg-muted mr-[8px] ml-[-8px] disabled:opacity-30 disabled:hover:bg-transparent"
          title={canGoBack ? t("Volver") : t("Volver") + " - " + t("Completa los campos requeridos")}
          onClick={handleBack}
          disabled={!canGoBack}
        >
          <ArrowLeft className="w-[24px] h-[24px]" />
        </button>
        <div className="text-[16px]">
          {product === "calendar" ? t("Google Calendar") : t("Google Sheets")}
        </div>

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
            placeholder={product === "calendar" ? t("Mi calendario") : t("Mi hoja de cálculo")}
            {...register(`extra.tools.${index}.label` as any, { required: true })}
          />
        </label>

        <p>
          {t("Autoriza el acceso a tu cuenta de Google para que el agente pueda interactuar con")} {product === "calendar" ? t("tu calendario") : t("tus hojas de cálculo")}.
        </p>

        <button
          type="button"
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-full font-medium transition-colors w-fit text-[14px] flex items-center gap-2"
          onClick={handleGetToken}
        >
          {token && <Check className="w-4 h-4" />}
          {token ? t("Autorizado") : t("Autorizar")}
        </button>

        {/* Hidden input to register field for setValue to work */}
        <input
          type="hidden"
          {...register(`extra.tools.${index}.config.headers.authorization` as any, { required: true })}
        />

        {product === "sheets" && files.length > 0 && (
          <div>
            <div className="label mb-2">{t("Archivos compartidos")}</div>
            <div className="flex flex-wrap gap-2">
              {files.map((file, i) => (
                <div key={i} className="bg-muted px-3 py-1 rounded-full text-sm text-foreground flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                  {file}
                </div>
              ))}
            </div>
          </div>
        )}

        <SelectField
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name={`extra.tools.${index}.config.allowed_tools` as any}
          control={control}
          label={t("Herramientas permitidas")}
          multiple
          options={allowedToolsOptions}
          placeholder={t("Ninguna")}
          modalClassName="bottom-0"
        />

      </SectionBody>
    </div >
  );
}

// New Tool Selection View
function NewToolSelection({
  onBack,
  onAddMCP,
  onAddHTTP,
  onAddSQL,
  onAddGoogle,
}: {
  onBack: () => void;
  onAddMCP: () => void;
  onAddHTTP: () => void;
  onAddSQL: () => void;
  onAddGoogle: (product: "calendar" | "sheets") => void;
}) {
  const { translate: t } = useTranslation();

  return (
    <div className="absolute inset-0 bottom-[80px] z-50 bg-background flex flex-col">
      <div className="header items-center truncate shrink-0">
        <button
          type="button"
          className="p-[8px] rounded-full hover:bg-muted mr-[8px] ml-[-8px]"
          title={t("Volver")}
          onClick={onBack}
        >
          <ArrowLeft className="w-[24px] h-[24px]" />
        </button>
        <div className="text-[16px]">{t("Agregar herramienta")}</div>
      </div>

      <SectionBody>
        <SectionItem
          title={t("Cliente MCP")}
          description={t("Conectar servidor MCP externo")}
          aside={
            <div className="p-[8px] bg-muted rounded-full">
              <Server className="w-[24px] h-[24px] text-muted-foreground" />
            </div>
          }
          onClick={onAddMCP}
        />
        <SectionItem
          title={t("Cliente HTTP")}
          description={t("Realizar peticiones HTTP")}
          aside={
            <div className="p-[8px] bg-muted rounded-full">
              <Globe className="w-[24px] h-[24px] text-muted-foreground" />
            </div>
          }
          onClick={onAddHTTP}
        />
        <SectionItem
          title={t("Cliente SQL")}
          description={t("Consultar base de datos")}
          aside={
            <div className="p-[8px] bg-muted rounded-full">
              <Database className="w-[24px] h-[24px] text-muted-foreground" />
            </div>
          }
          onClick={onAddSQL}
        />
        <SectionItem
          title={t("Google Calendar")}
          description={t("Gestionar eventos y calendarios")}
          aside={
            <div className="p-[8px] bg-muted rounded-full">
              <Calendar className="w-[24px] h-[24px] text-muted-foreground" />
            </div>
          }
          onClick={() => onAddGoogle("calendar")}
        />
        <SectionItem
          title={t("Google Sheets")}
          description={t("Leer y escribir hojas de cálculo")}
          aside={
            <div className="p-[8px] bg-muted rounded-full">
              <FileSpreadsheet className="w-[24px] h-[24px] text-muted-foreground" />
            </div>
          }
          onClick={() => onAddGoogle("sheets")}
        />
      </SectionBody>
    </div>
  );
}


