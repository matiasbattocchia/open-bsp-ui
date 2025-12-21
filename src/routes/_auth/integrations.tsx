import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import SectionItem from "@/components/SectionItem";
import { createFileRoute } from "@tanstack/react-router";
import WhatsAppIntegration from "@/components/WhatsAppIntegration";
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
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground font-bold">
                    {integration.service[0].toUpperCase()}
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
