import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import SelectField from "@/components/SelectField";
import TextAreaField from "@/components/TextAreaField";
import SectionField from "@/components/SectionField";
import ToolsSection from "@/components/ToolsSection";

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

  // Normalize agent data to ensure tools is always an array
  const normalizedAgent = useMemo(() => {
    if (!agent) return undefined;
    return {
      ...agent,
      extra: {
        ...agent.extra,
        tools: agent.extra?.tools ?? [],
      },
    };
  }, [agent]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { isDirty, isValid },
  } = useForm<AIAgentUpdate>({ values: normalizedAgent });

  const handleChat = () => {
    if (!activeOrgId || !localAddress) return;

    const convId = startConversation({
      organization_id: activeOrgId,
      organization_address: localAddress.address,
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
          {/* Root view fields */}
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
          <SectionField label={t("Modelo de IA")}>
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
              options={(protocols[provider as keyof typeof protocols] || []).map((p) => ({
                value: p,
                label: protocolLabels[p] || p,
              }))}
            />

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
          </SectionField>
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