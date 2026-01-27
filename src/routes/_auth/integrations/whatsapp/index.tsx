import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import SectionItem from "@/components/SectionItem";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useOrganizationsAddresses } from "@/queries/useOrganizationsAddresses";
import { useTranslation } from "@/hooks/useTranslation";
import { WhatsAppOutlined } from "@ant-design/icons";
import { Plus } from "lucide-react";
import type { JSX } from "react";

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

  const statusLabels: Record<string, string | JSX.Element> = {
    connected: <span className="text-primary">{t("Conectado")}</span>,
    disconnected: t("Desconectado"),
  };

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
          {whatsappIntegrations?.map((integration) => (
            <SectionItem
              key={integration.address}
              aside={
                <div className="p-[8px]">
                  <WhatsAppOutlined style={{ fontSize: "24px", color: "#25D366" }} />
                </div>
              }
              title={(integration.extra as { phone_number?: string })?.phone_number || integration.address}
              description={statusLabels[integration.status] || integration.status}
              onClick={() => navigate({
                to: "/integrations/whatsapp/$orgAddressId",
                params: { orgAddressId: integration.address },
                hash: (prevHash) => prevHash!
              })}
            />
          ))
          }
        </div>
      </SectionBody>
    </>
  );
}
