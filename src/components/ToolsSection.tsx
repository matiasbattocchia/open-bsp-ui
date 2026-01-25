import { useState } from "react";
import { ArrowLeft, Calendar, ChevronRight, Database, FileSpreadsheet, Globe, Plus, Server, Trash2 } from "lucide-react";
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
  const { fields, append, remove } = useFieldArray({
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
      config: {},
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
      ? ["list_calendars", "list_events", "create_event", "update_event", "delete_event"]
      : ["get_spreadsheet", "read_sheet", "write_sheet", "append_rows", "create_spreadsheet"];

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
            {/* Add buttons */}
            <SectionItem
              title={t("Agregar cliente MCP")}
              aside={
                <div className="p-[8px] bg-primary/10 rounded-full">
                  <Plus className="w-[24px] h-[24px] text-primary" />
                </div>
              }
              onClick={handleAddMCP}
            />
            <SectionItem
              title={t("Agregar cliente HTTP")}
              aside={
                <div className="p-[8px] bg-primary/10 rounded-full">
                  <Plus className="w-[24px] h-[24px] text-primary" />
                </div>
              }
              onClick={handleAddHTTP}
            />
            <SectionItem
              title={t("Agregar cliente SQL")}
              aside={
                <div className="p-[8px] bg-primary/10 rounded-full">
                  <Plus className="w-[24px] h-[24px] text-primary" />
                </div>
              }
              onClick={handleAddSQL}
            />

            <SectionItem
              title={t("Agregar Google Calendar")}
              aside={
                <div className="p-[8px] bg-primary/10 rounded-full">
                  <Plus className="w-[24px] h-[24px] text-primary" />
                </div>
              }
              onClick={() => handleAddGoogle("calendar")}
            />
            <SectionItem
              title={t("Agregar Google Sheets")}
              aside={
                <div className="p-[8px] bg-primary/10 rounded-full">
                  <Plus className="w-[24px] h-[24px] text-primary" />
                </div>
              }
              onClick={() => handleAddGoogle("sheets")}
            />

            {/* Google Tools */}
            {googleTools.map((tool) => (
              <SectionItem
                key={tool.id}
                title={tool.label || t("Sin nombre")}
                description={t("Cliente MCP preconfigurado")}
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
            {sqlTools.map((tool) => (
              <SectionItem
                key={tool.id}
                title={tool.label || t("Sin nombre")}
                description={(tool.config as any)?.driver || t("Sin driver")}
                aside={
                  <div className="p-[8px] bg-muted rounded-full">
                    <Database className="w-[24px] h-[24px] text-muted-foreground" />
                  </div>
                }
                onClick={() => setEditor({ type: "sql", index: tool._index })}
              />
            ))}

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

      {/* Google MCP Client Editor */}
      {isOpen && editor.type === "google-mcp" && (
        <GoogleMCPClientEditor
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

        <label>
          <div className="label">{t("URL base")} ({t("opcional")})</div>
          <input
            type="url"
            className="text"
            placeholder="https://api.example.com"
            {...register(`extra.tools.${index}.config.url` as any)}
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
  const product = (useWatch({ control, name: `extra.tools.${index}.config.product` as any }) as string);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const label = (useWatch({ control, name: `extra.tools.${index}.label` as any }) as string) || "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (useWatch({ control, name: `extra.tools.${index}.config.headers.authorization` as any }) as string) || "";

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
        // Set the token
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue(`extra.tools.${index}.config.headers.authorization` as any, `Bearer ${event.data.apiKey}` as any, { shouldDirty: true });

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
      { value: "create_event", label: t("Crear evento") },
      { value: "update_event", label: t("Actualizar evento") },
      { value: "delete_event", label: t("Eliminar evento") },
    ]
    : [
      { value: "get_spreadsheet", label: t("Obtener hoja de cálculo") },
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
          {t("Esta herramienta es un cliente MCP preconfigurado que se conecta a los servicios de Google a través del")} <a href="https://g.mcp.openbsp.dev" target="_blank" rel="noreferrer">servidor MCP de OpenBSP</a>.
        </p>

        {
          product === "calendar" ?
            <p>
              {t("Es recomendable activar la variable de fecha y hora actual en las instrucciones del agente.")}
            </p>
            :
            <p>
              {t("Es recomendable compartir los IDs de las hojas de cálculo en las instrucciones del agente.")}
            </p>
        }

        <p>
          {t("Para obtener el token, inicia sesión en Google usando el siguiente botón:")}
        </p>

        <button
          type="button"
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-full font-medium transition-colors w-fit text-[14px]"
          onClick={handleGetToken}
        >
          {t("Obtener token")}
        </button>

        <label>
          <div className="label">{t("URL")}</div>
          <input
            type="url"
            className="text opacity-50 cursor-not-allowed"
            readOnly
            {...register(`extra.tools.${index}.config.url` as any)}
          />
        </label>

        <label>
          <div className="label">{t("Token")}</div>
          <input
            type="text"
            className="text"
            placeholder="Bearer gmc_..."
            {...register(`extra.tools.${index}.config.headers.authorization` as any, { required: true })}
          />
        </label>

        <SelectField
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name={`extra.tools.${index}.config.allowed_tools` as any}
          control={control}
          label={t("Herramientas permitidas")}
          multiple
          options={allowedToolsOptions}
          placeholder={t("Ninguna")}
        />

      </SectionBody>
    </div>
  );
}
