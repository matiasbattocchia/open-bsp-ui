import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useAgent, useDeleteAgent, useUpdateAgent, useCurrentAgent } from "@/queries/useAgents";
import { useForm } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import useBoundStore from "@/stores/useBoundStore";
import { type AIAgentRow, type AIAgentUpdate } from "@/supabase/client";
import { startConversation } from "@/utils/ConversationUtils";
import { useOrganizationsAddresses } from "@/queries/useOrganizationsAddresses";
import SectionFooter from "@/components/SectionFooter";
import { protocols, protocolLabels } from "./new";
import Button from "@/components/Button";

export const Route = createFileRoute("/_auth/agents/$agentId")({
  component: AgentDetail,
});

function AgentDetail() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { agentId } = Route.useParams();
  const { data: agent } = useAgent<AIAgentRow>(agentId);
  const { data: currentAgent } = useCurrentAgent();
  const isAdmin = ["admin", "owner"].includes(currentAgent?.extra?.role || "");
  const deleteAgent = useDeleteAgent();
  const updateAgent = useUpdateAgent();
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);
  const [provider, setProvider] = useState<keyof typeof protocols>("openai");

  const localAddress = useOrganizationsAddresses().data?.find(
    (address) => address.service === "local",
  );

  useEffect(() => {
    if (!agent) return;
    const apiUrl = agent.extra?.api_url || "";
    const isKnown = ["openai", "anthropic", "groq", "google"].includes(apiUrl);
    setProvider(isKnown ? apiUrl : "custom");
  }, [agent]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isDirty, isValid },
  } = useForm<AIAgentUpdate>({ values: agent });

  const handleChat = () => {
    if (!activeOrgId || !localAddress) return;

    const convId = startConversation({
      organization_id: activeOrgId,
      organization_address: localAddress.address,
      contact_address: crypto.randomUUID(),
      service: "local",
      extra: { default_agent_id: agentId },
      name: agent?.name,
    });

    navigate({ hash: convId });
  };

  return agent && (
    <>
      <SectionHeader
        title={agent.name}
        onDelete={() => {
          deleteAgent.mutate(agentId, {
            onSuccess: () => navigate({ to: "..", hash: (prevHash) => prevHash! })
          });
        }}
        deleteDisabled={!isAdmin}
        deleteDisabledReason={t("Requiere permisos de administrador")}
      />

      <SectionBody>
        <form
          id="agent-form"
          onSubmit={handleSubmit(data => updateAgent.mutate(data))}
        >
          <label>
            <div className="label">{t("Nombre")}</div>
            <input
              type="text"
              className="text"
              placeholder={t("Nombre del agente")}
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
              {...register("extra.instructions")}
              placeholder={t("Eres un asistente útil...")}
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

          <label>
            <div className="label">{t("Protocolo")}</div>
            <select
              {...register("extra.protocol")}
            >
              {(protocols[provider as keyof typeof protocols] || []).map((p) => (
                <option key={p} value={p}>{protocolLabels[p] || p}</option>
              ))}
            </select>
          </label>

          {provider === "custom" && (
            <label>
              <div className="label">{t("API URL")}</div>
              <input
                type="text"
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
        </form>
      </SectionBody >

      <SectionFooter>
        {!isDirty ? (
          <button
            type="button"
            className="primary"
            onClick={handleChat}
          >
            {t("Chatea con este agente")}
          </button>
        ) : (
          <Button
            form="agent-form"
            type="submit"
            disabled={!isAdmin}
            invalid={!isValid}
            loading={updateAgent.isPending}
            disabledReason={t("Requiere permisos de administrador")}
            className="primary"
          >
            {t("Actualizar")}
          </Button>
        )}
      </SectionFooter>
    </>
  );
}