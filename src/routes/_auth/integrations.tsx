import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import SectionItem from "@/components/SectionItem";
import { createFileRoute } from "@tanstack/react-router";
import WhatsAppIntegration from "@/components/WhatsAppIntegration";
import { WhatsAppOutlined } from "@ant-design/icons";
import { useIntegrations } from "@/queries/useOrganizationsAddresses";
import { useCurrentAgent } from "@/queries/useAgents";

export const Route = createFileRoute("/_auth/integrations")({
  component: Integrations,
});

function Integrations() {
  const { data: integrations } = useIntegrations();
  const { data: agent } = useCurrentAgent();
  const isAdmin = ["admin", "owner"].includes(agent?.extra?.role || "");

  const externalIntegrations = integrations?.filter(
    (integration) => integration.service !== "local",
  );

  return (
    <>
      <SectionHeader title="Integraciones" />

      <SectionBody>
        {isAdmin && (
          <div className="py-[10px]">
            <WhatsAppIntegration />
          </div>
        )}

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
      </SectionBody>
    </>
  );
}
