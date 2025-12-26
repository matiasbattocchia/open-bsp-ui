import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useAgent, useDeleteAgent, useUpdateAgent } from "@/queries/useAgents";
import { useForm } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import useBoundStore from "@/stores/useBoundStore";
import { type AIAgentRow, type AIAgentUpdate } from "@/supabase/client";
import { startConversation } from "@/utils/ConversationUtils";
import { useIntegrations } from "@/queries/useIntegrations";

export const Route = createFileRoute("/_auth/agents/$agentId")({
  component: AgentDetail,
});

function AgentDetail() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { agentId } = Route.useParams();
  const { data: agent } = useAgent<AIAgentRow>(agentId);
  const deleteAgent = useDeleteAgent();
  const updateAgent = useUpdateAgent();
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);
  const [provider, setProvider] = useState("openai"); // Added local state for provider

  const localAddress = useIntegrations().data?.find(
    (address) => address.service === "local",
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isDirty, isValid },
  } = useForm<AIAgentUpdate>({
    /*defaultValues: async () => {
      const agent = await promise;
      console.log("ues form promiso", agent);
      const apiUrl = agent.extra?.api_url || "";
      const isKnown = knownProviders.includes(apiUrl);
      setProvider(isKnown ? apiUrl : "custom"); // Set local state based on agent data

      return agent;
    },*/
    values: agent,
  });

  const handleChat = () => {
    if (!activeOrgId || !localAddress) return;

    const convId = startConversation({
      organization_id: activeOrgId,
      organization_address: localAddress.address,
      contact_address: crypto.randomUUID(),
      service: "local",
      extra: { agent_id: agentId },
      name: agent?.name,
    });

    navigate({ hash: convId });
  };

  return agent && (
    <>
      <SectionHeader title={agent.name} />

      <SectionBody>
        <form
          onSubmit={handleSubmit(data => updateAgent.mutate(data))}
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
                if (val !== 'custom') {
                  setValue("extra.api_url", val, { shouldDirty: true });
                } else {
                  setValue("extra.api_url", "", { shouldDirty: true });
                }
              }}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="groq">Groq</option>
              <option value="google">Google</option>
              <option value="custom">{t("Personalizado")}</option>
            </select>
          </label>

          {provider === "custom" && (
            <label>
              <div className="label">{t("API URL")}</div>
              <input
                type="text"
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
              {...register("extra.api_key")}
              placeholder="sk_012345..."
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
              rows={4}
              className="text h-auto"
              {...register("extra.instructions")}
              placeholder={t("Eres un asistente útil...") as string}
            />
          </label>

          <div className="grow" />

          <button
            type="button"
            className="destructive"
            onClick={() => {
              deleteAgent.mutate(agentId, {
                onSuccess: () => navigate({ to: "..", hash: (prevHash) => prevHash! })
              });
            }}
          >
            {t("Eliminar")}
          </button>

          {!isDirty ? (
            <button
              type="button"
              className="primary"
              onClick={handleChat}
            >
              {t("Chatea con este agente")}
            </button>
          ) : (
            <button
              type="submit"
              disabled={updateAgent.isPending || !isValid}
              className="primary"
            >
              {updateAgent.isPending ? "..." : t("Actualizar")}
            </button>
          )}
        </form>
      </SectionBody>
    </>
  );
}
