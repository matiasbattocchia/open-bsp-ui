import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import SectionItem from "@/components/SectionItem";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useOrganizationsAddresses } from "@/queries/useOrganizationsAddresses";
import { useTranslation } from "@/hooks/useTranslation";
import { WhatsAppOutlined } from "@ant-design/icons";
import { Link, Plus } from "lucide-react";
import { formatPhoneNumber } from "@/utils/FormatUtils";
import ConnectionOwner from "@/components/ConnectionOwner";
import { ConnectionStatus } from "@/components/ConnectionIssue";
import WarningBadge from "@/components/WarningBadge";

export const Route = createFileRoute("/_auth/integrations/whatsapp/")({
  component: WhatsAppIndex,
});

function WhatsAppIndex() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: integrations } = useOrganizationsAddresses();

  const whatsappIntegrations = integrations?.filter(
    (integration) => integration.service === "whatsapp",
  );

  return (
    <>
      <SectionHeader title="WhatsApp" />

      <SectionBody className="gap-4">
        <div className="flex flex-col">
          <SectionItem
            title={t("Conectar número")}
            aside={
              <div className="p-[8px] bg-primary/10 rounded-full">
                <Plus className="w-[24px] h-[24px] text-primary" />
              </div>
            }
            onClick={() =>
              navigate({
                to: "/integrations/whatsapp/new",
                hash: (prevHash) => prevHash!,
              })
            }
          />
          <SectionItem
            title={t("Invitaciones a terceros")}
            aside={
              <div className="p-[8px]">
                <Link className="w-[24px] h-[24px] text-muted-foreground" />
              </div>
            }
            onClick={() =>
              navigate({
                to: "/integrations/whatsapp/onboarding",
                hash: (prevHash) => prevHash!,
              })
            }
          />
          {whatsappIntegrations?.map((integration) => (
            <SectionItem
              key={integration.address}
              aside={
                <div className="p-[8px]">
                  <WarningBadge show={!!integration.issue}>
                    <WhatsAppOutlined
                      style={{ fontSize: "24px", color: "#25D366" }}
                    />
                  </WarningBadge>
                </div>
              }
              title={formatPhoneNumber(
                (integration.extra as { phone_number?: string })
                  ?.phone_number || integration.address,
              )}
              description={
                <>
                  <ConnectionStatus row={integration} />
                  <ConnectionOwner agentId={integration.agent_id} />
                </>
              }
              onClick={() =>
                navigate({
                  to: "/integrations/whatsapp/$orgAddressId",
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
