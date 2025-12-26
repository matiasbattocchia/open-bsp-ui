import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateAgent } from "@/queries/useAgents";
import { useForm } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import { type AIAgentInsert } from "@/supabase/client";
import { useState } from "react";

export const Route = createFileRoute("/_auth/agents/new")({
  component: AddAgent,
});

function AddAgent() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const createAgent = useCreateAgent();
  const [provider, setProvider] = useState("openai");

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
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-[16px] pb-[14px] grow"
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
            <div className="label">{t("Proveedor")}</div>
            <select
              value={provider}
              onChange={(e) => {
                const val = e.target.value;
                setProvider(val);
                setValue("extra.model", "");
                if (val === 'custom') {
                  setValue("extra.api_url", "");
                } else {
                  setValue("extra.api_url", val);
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

          {provider === 'custom' && (
            <label>
              <div className="label">{t("API URL")}</div>
              <input
                type="url"
                className="text"
                placeholder="https://api.example.com/v1"
                {...register("extra.api_url", { required: true })}
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
              {...register("extra.model", { required: true })}
            />
          </label>

          <label>
            <div className="label">{t("Instrucciones")}</div>
            <textarea
              className="text bg-incoming-chat-bubble rounded-lg w-full p-[8px] h-[120px] focus-visible:outline-none"
              placeholder={t("Eres un asistente útil...") as string}
              {...register("extra.instructions")}
            />
          </label>

          <div className="grow" />

          <button
            type="submit"
            disabled={createAgent.isPending || !isValid}
            className="primary"
          >
            {createAgent.isPending ? "..." : t("Crear")}
          </button>
        </form>
      </SectionBody>
    </>
  );
}
