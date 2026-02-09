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
  openai: ["chat_completions", "assistants"],
  google: ["chat_completions"],
  anthropic: ["chat_completions"],
  groq: ["chat_completions"],
  custom: ["chat_completions", "a2a", "assistants"],
};

export const protocolLabels: Record<NonNullable<AIAgentExtra['protocol']>, string> = {
  "chat_completions": "Chat Completions",
  assistants: "Assistants",
  a2a: "A2A",
};

function AddAgent() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const createAgent = useCreateAgent();
  const { data: currentAgent } = useCurrentAgent();
  const isAdmin = ["admin", "owner"].includes(currentAgent?.extra?.role || "");
  const [provider, setProvider] = useState<keyof typeof protocols>("openai");

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
        api_url: "openai",
        protocol: "chat_completions",
        model: "gpt-4.1-mini",
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
                  setValue("extra.model", "");

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

              <label>
                <div className="label">{t("Modelo")}</div>
                <input
                  type="text"
                  className="text"
                  placeholder={t("Nombre del modelo")}
                  {...register("extra.model")}
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
