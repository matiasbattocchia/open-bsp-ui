import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import SectionItem from "@/components/SectionItem";
import { createFileRoute } from "@tanstack/react-router";
import WhatsAppIntegration from "@/components/WhatsAppIntegration";
import { WhatsAppOutlined } from "@ant-design/icons";
import { useOrganizationsAddresses } from "@/queries/useOrganizationsAddresses";
import { useCurrentAgent } from "@/queries/useAgents";
import { useTranslation } from "@/hooks/useTranslation";

export const Route = createFileRoute("/_auth/integrations")({
  component: Integrations,
});

function Integrations() {
  const { translate: t } = useTranslation();
  const { data: integrations } = useOrganizationsAddresses();
  const { data: agent } = useCurrentAgent();
  const isAdmin = ["admin", "owner"].includes(agent?.extra?.role || "");

  const externalIntegrations = integrations?.filter(
    (integration) => integration.service !== "local",
  );

  return (
    <>
      <SectionHeader title="Integraciones" />

      <SectionBody>
        <div className="pl-[10px]">
          <p>
            {t("Conecta tu número de WhatsApp Business para recibir y enviar mensajes directamente desde la plataforma.")}
          </p>

          {/* WhatsApp Integration - Always show but disabled if not admin */}
          <div className={`py-[10px] ${!isAdmin ? "opacity-50 pointer-events-none" : ""}`} title={!isAdmin ? t("Requiere permisos de administrador") : undefined}>
            <fieldset disabled={!isAdmin} className="group">
              <WhatsAppIntegration />
            </fieldset>
          </div>
        </div>

        {externalIntegrations && externalIntegrations.length > 0 && (
          <>
            {externalIntegrations.map((integration) => (
              <SectionItem
                key={integration.address}
                aside={
                  <div className="p-[8px]" >
                    <WhatsAppOutlined style={{ fontSize: "24px", color: "#25D366" }} />
                  </div>
                }
                title={(integration.extra as { phone_number?: string })?.phone_number}
                description={integration.status}
              />
            ))}
          </>
        )}
      </SectionBody >
    </>
  );
}
