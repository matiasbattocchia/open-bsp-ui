import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionFooter from "@/components/SectionFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateAgent, useCurrentAgent } from "@/queries/useAgents";
import { useForm, useWatch } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import { type AIAgentInsert, type AIAgentExtra } from "@/supabase/client";
import { useState } from "react";
import Button from "@/components/Button";
import SelectField from "@/components/SelectField";
import TextAreaField from "@/components/TextAreaField";
import SectionField from "@/components/SectionField";
import ToolsSection from "@/components/ToolsSection";

export const Route = createFileRoute("/_auth/agents/new")({
  component: AddAgent,
});

export const protocols: Record<string, NonNullable<AIAgentExtra['protocol']>[]> = {
  openai: ["chat_completions"],
  google: ["chat_completions"],
  anthropic: ["chat_completions"],
  groq: ["chat_completions"],
  custom: ["chat_completions", "a2a"],
};

export const protocolLabels: Record<NonNullable<AIAgentExtra['protocol']>, string> = {
  "chat_completions": "Chat Completions",
  a2a: "A2A",
};

export const defaultModels: Record<string, string> = {
  openai: "gpt-5-mini",
  anthropic: "claude-sonnet-4-6",
  google: "gemini-3-flash-preview",
  groq: "openai/gpt-oss-20b",
};

export const creditModels: Record<string, string[]> = {
  openai: ["gpt-5-mini", "gpt-5.3-chat-latest"],
  anthropic: ["claude-sonnet-4-6"],
  google: ["gemini-2.5-flash", "gemini-3-flash-preview"],
  groq: ["openai/gpt-oss-20b", "openai/gpt-oss-120b"],
};

export const apiKeyInstructions: Record<string, { url: string; label: string; steps: string; free?: boolean }> = {
  openai: {
    url: "https://platform.openai.com/api-keys",
    label: "platform.openai.com",
    steps: "API Keys > Create new secret key.",
  },
  anthropic: {
    url: "https://console.anthropic.com/settings/keys",
    label: "console.anthropic.com",
    steps: "Settings > API Keys > Create Key.",
  },
  google: {
    url: "https://aistudio.google.com/app/apikey",
    label: "aistudio.google.com",
    steps: "Get API key > Create API key.",
    free: true,
  },
  groq: {
    url: "https://console.groq.com/keys",
    label: "console.groq.com",
    steps: "API Keys > Create API Key.",
    free: true,
  },
};

function AddAgent() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const createAgent = useCreateAgent();
  const { data: currentAgent } = useCurrentAgent();
  const isAdmin = ["admin", "owner"].includes(currentAgent?.extra?.role || "");
  const [provider, setProvider] = useState<keyof typeof protocols>("groq");

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { isValid, isDirty },
  } = useForm<AIAgentInsert>({
    defaultValues: {
      extra: {
        mode: "active",
        api_url: "groq",
        protocol: "chat_completions",
        model: "openai/gpt-oss-20b",
        tools: [],
      }
    },
  });

  const model = useWatch({ control, name: "extra.model" });

  const onSubmit = (data: AIAgentInsert) => {
    createAgent.mutate(
      { ...data, ai: true },
      {
        onSuccess: (agent) =>
          navigate({
            to: `/agents/${agent.id}`,
            hash: (prevHash) => prevHash!,
          }),
      }
    );
  };

  return (
    <>
      <SectionHeader title={t("Agregar agente")} />

      <SectionBody>
        <form
          id="create-agent-form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <fieldset disabled={!isAdmin} className="contents">
            <p>
              {t("Configura un agente de IA que responderá automáticamente a tus conversaciones.")}
            </p>

            <label>
              <div className="label">{t("Nombre")}</div>
              <input
                type="text"
                className="text"
                placeholder={t("Nombre del agente")}
                {...register("name", { required: true })}
              />
            </label>

            <SelectField
              name="extra.mode"
              control={control}
              label={t("Estado")}
              options={[
                { value: "active", label: t("Activo") },
                { value: "draft", label: t("Borrador") },
                { value: "inactive", label: t("Inactivo") },
              ]}
            />

            <div className="border-t border-border" />

            <TextAreaField
              name="extra.instructions"
              control={control}
              label={t("Instrucciones")}
              placeholder={t("Eres un asistente útil...")}
            />

            {/* Tools Section */}
            <ToolsSection control={control} register={register} setValue={setValue} />

            {/* AI Section */}
            <SectionField label={t("Modelo de IA")} description={model || t("Ninguno")}>
              <SelectField
                value={provider}
                onChange={(val) => {
                  setProvider(val);
                  setValue("extra.model", defaultModels[val] || "");

                  const availableProtocols = protocols[val as keyof typeof protocols];
                  setValue("extra.protocol", availableProtocols[0]);

                  if (val !== "custom") {
                    setValue("extra.api_url", val, { shouldDirty: true });
                  } else {
                    setValue("extra.api_url", "", { shouldDirty: true });
                  }
                }}
                label={t("Proveedor")}
                options={[
                  { value: "openai", label: "OpenAI" },
                  { value: "anthropic", label: "Anthropic" },
                  { value: "groq", label: "Groq" },
                  { value: "google", label: "Google" },
                  { value: "custom", label: t("Personalizado") },
                ]}
              />

              <SelectField
                name="extra.protocol"
                control={control}
                label={t("Protocolo")}
                options={protocols[provider as keyof typeof protocols].map((p) => ({
                  value: p,
                  label: protocolLabels[p] || p,
                }))}
              />

              {provider === 'custom' && (
                <label>
                  <div className="label">{t("API URL")}</div>
                  <input
                    type="url"
                    className="text"
                    placeholder="https://api.example.com/v1"
                    {...register("extra.api_url")}
                  />
                </label>
              )}

              <label>
                <div className="label">{t("Clave API")}</div>
                <input
                  type="text"
                  className="text"
                  placeholder={t("Clave API del proveedor")}
                  {...register("extra.api_key")}
                />
              </label>

              {provider !== 'custom' && apiKeyInstructions[provider] && (
                <div className="instructions">
                  <p>
                    {t("Usar una clave API propia no consume créditos locales y permite usar cualquier modelo.")}
                  </p>
                  <p>
                    <a href={apiKeyInstructions[provider].url} target="_blank" rel="noopener noreferrer" className="underline">{apiKeyInstructions[provider].label}</a>
                    {" > "}{apiKeyInstructions[provider].steps}
                    {apiKeyInstructions[provider].free && ` — ${t("Gratuito.")}`}
                  </p>
                </div>
              )}

              <label>
                <div className="label">{t("Modelo")}</div>
                <input
                  type="text"
                  className="text"
                  placeholder={t("Nombre del modelo")}
                  {...register("extra.model")}
                />
              </label>

              {provider !== 'custom' && creditModels[provider] && (
                <div className="instructions">
                  <p>{t("Los siguientes modelos funcionan con créditos de IA:")}</p>
                  <ul>
                    {creditModels[provider].map((m) => <li key={m}><code>{m}</code></li>)}
                  </ul>
                </div>
              )}

              <label>
                <div className="label">{t("Mensajes máximos")}</div>
                <input
                  type="number"
                  className="text"
                  min={1}
                  placeholder="50"
                  {...register("extra.max_messages", { valueAsNumber: true })}
                />
              </label>

              <label>
                <div className="label">{t("Temperatura")}</div>
                <input
                  type="number"
                  className="text"
                  min={0}
                  max={2}
                  step={0.1}
                  placeholder="1.0"
                  {...register("extra.temperature", { valueAsNumber: true })}
                />
              </label>

              {provider === 'custom' && (
                <div className="instructions">
                  <p>{t("Se envían los siguientes encabezados HTTP con cada solicitud:")}</p>
                  <ul>
                    <li><code>organization-id</code></li>
                    <li><code>organization-address</code></li>
                    <li><code>conversation-id</code></li>
                    <li><code>agent-id</code></li>
                    <li><code>contact-id</code></li>
                    <li><code>contact-address</code></li>
                  </ul>
                </div>
              )}
            </SectionField>
          </fieldset>
        </form>
      </SectionBody>

      <SectionFooter>
        <Button
          form="create-agent-form"
          type="submit"
          disabled={!isAdmin}
          invalid={!isValid || !isDirty}
          loading={createAgent.isPending}
          disabledReason={t("Requiere permisos de administrador")}
          className="primary"
        >
          {t("Crear")}
        </Button>
      </SectionFooter>
    </>
  );
}
