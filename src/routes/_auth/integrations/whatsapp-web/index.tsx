import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import SectionItem from "@/components/SectionItem";
import ServiceIcon from "@/components/ServiceIcon";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useOrganizationsAddresses } from "@/queries/useOrganizationsAddresses";
import { useTranslation } from "@/hooks/useTranslation";
import { Plus } from "lucide-react";
import { formatPhoneNumber } from "@/utils/FormatUtils";
import ConnectionOwner from "@/components/ConnectionOwner";
import { ConnectionStatus } from "@/components/ConnectionIssue";
import WarningBadge from "@/components/WarningBadge";

export const Route = createFileRoute("/_auth/integrations/whatsapp-web/")({
  component: WhatsAppWebIndex,
});

function WhatsAppWebIndex() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: integrations } = useOrganizationsAddresses();

  const webIntegrations = integrations?.filter(
    (integration) => integration.service === "whatsapp-web",
  );

  return (
    <>
      <SectionHeader title="WhatsApp Web" />

      <SectionBody className="gap-4">
        <div className="flex flex-col">
          <SectionItem
            title={t("Vincular dispositivo")}
            aside={
              <div className="p-[8px] bg-primary/10 rounded-full">
                <Plus className="w-[24px] h-[24px] text-primary" />
              </div>
            }
            onClick={() =>
              navigate({
                to: "/integrations/whatsapp-web/new",
                hash: (prevHash) => prevHash!,
              })
            }
          />
          {webIntegrations?.map((integration) => (
            <SectionItem
              key={integration.address}
              aside={
                <div className="p-[8px]">
                  <WarningBadge show={!!integration.issue}>
                    <ServiceIcon service="whatsapp-web" size={24} />
                  </WarningBadge>
                </div>
              }
              title={formatPhoneNumber(integration.address)}
              description={
                <>
                  <ConnectionStatus row={integration} />
                  <ConnectionOwner agentId={integration.agent_id} />
                </>
              }
              onClick={() =>
                navigate({
                  to: "/integrations/whatsapp-web/$orgAddressId",
                  params: { orgAddressId: integration.address },
                  hash: (prevHash) => prevHash!,
                })
              }
            />
          ))}
        </div>
      </SectionBody>
    </>
  );
}
