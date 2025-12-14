import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import { createFileRoute } from "@tanstack/react-router";
import WhatsAppIntegration from "@/components/WhatsAppIntegration";

export const Route = createFileRoute("/_auth/integrations")({
  component: Integrations,
});

function Integrations() {
  return (<>
    <SectionHeader title="Integraciones" />

    <SectionBody>
      <WhatsAppIntegration />
    </SectionBody>

  </>);
}
