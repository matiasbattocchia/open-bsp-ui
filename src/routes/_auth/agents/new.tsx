import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionFooter from "@/components/SectionFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateAgent } from "@/queries/useAgents";
import { useForm } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import { type AIAgentInsert, type AIAgentExtra } from "@/supabase/client";
import { useState } from "react";

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
  const [provider, setProvider] = useState<keyof typeof protocols>("openai");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isValid },
  } = useForm<AIAgentInsert>({
    defaultValues: {
      extra: {
        mode: "active",
        api_url: "openai",
        protocol: "chat_completions",
        model: "gpt-4.1-mini",
      }
    },
  });

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
      <SectionHeader title={t("Agregar agente") as string} />

      <SectionBody>
        <form
          id="create-agent-form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <label>
            <div className="label">{t("Nombre")}</div>
            <input
              type="text"
              className="text"
              placeholder="Nombre del agente"
              {...register("name", { required: true })}
            />
          </label>

          <label>
            <div className="label">{t("Estado")}</div>
            <select {...register("extra.mode")}>
              <option value="active">{t("Activo")}</option>
              <option value="draft">{t("Borrador")}</option>
              <option value="inactive">{t("Inactivo")}</option>
            </select>
          </label>

          <label>
            <div className="label">{t("Instrucciones")}</div>
            <textarea
              className="text h-min-[100px] font-mono text-[12.8px]"
              placeholder={t("Eres un asistente útil...") as string}
              {...register("extra.instructions")}
            />
          </label>

          <label>
            <div className="label">{t("Proveedor")}</div>
            <select
              value={provider}
              onChange={(e) => {
                const val = e.target.value;
                setProvider(val);
                setValue("extra.model", "");

                const availableProtocols = protocols[val as keyof typeof protocols];
                setValue("extra.protocol", availableProtocols[0]);

                if (val === 'custom') {
                  setValue("extra.api_url", "", { shouldDirty: true });
                } else {
                  setValue("extra.api_url", val, { shouldDirty: true });
                }
              }}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="groq">Groq</option>
              <option value="gemini">Gemini</option>
              <option value="custom">{t("Personalizado")}</option>
            </select>
          </label>

          <label>
            <div className="label">{t("Protocolo")}</div>
            <select
              {...register("extra.protocol")}
            >
              {(protocols[provider as keyof typeof protocols]).map((p) => (
                <option key={p} value={p}>{protocolLabels[p] || p}</option>
              ))}
            </select>
          </label>

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
            <div className="label">{t("API Key")}</div>
            <input
              type="text"
              className="text"
              placeholder="sk_..."
              {...register("extra.api_key")}
            />
          </label>

          <label>
            <div className="label">{t("Modelo")}</div>
            <input
              type="text"
              className="text"
              placeholder="gpt-4.1-mini"
              {...register("extra.model")}
            />
          </label>
        </form>
      </SectionBody>

      <SectionFooter>
        <button
          form="create-agent-form"
          type="submit"
          disabled={createAgent.isPending || !isValid}
          className="primary"
        >
          {createAgent.isPending ? "..." : t("Crear")}
        </button>
      </SectionFooter>
    </>
  );
}
