import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import SectionItem from "@/components/SectionItem";
import { createFileRoute } from "@tanstack/react-router";
import WhatsAppIntegration from "@/components/WhatsAppIntegration";
import { WhatsAppOutlined } from "@ant-design/icons";
import { useIntegrations } from "@/queries/useIntegrations";

export const Route = createFileRoute("/_auth/integrations")({
  component: Integrations,
});

function Integrations() {
  const { data: integrations } = useIntegrations();

  return (
    <>
      <SectionHeader title="Integraciones" />

      <SectionBody>
        <div className="py-[10px]">
          <WhatsAppIntegration />
        </div>

        {integrations && integrations.length > 0 && (
          <>
            {integrations.map((integration) => (
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
