import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import SectionItem from "@/components/SectionItem";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useOrganizationsAddresses } from "@/queries/useOrganizationsAddresses";
import { useTranslation } from "@/hooks/useTranslation";
import { InstagramOutlined } from "@ant-design/icons";
import { Link, Plus } from "lucide-react";
import type { JSX } from "react";
import type { InstagramOrganizationAddressExtra } from "@/supabase/client";

export const Route = createFileRoute("/_auth/integrations/instagram/")({
  component: InstagramIndex,
});

function InstagramIndex() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: integrations } = useOrganizationsAddresses();

  const instagramIntegrations = integrations?.filter(
    (integration) => integration.service === "instagram",
  );

  const statusLabels: Record<string, string | JSX.Element> = {
    connected: <span className="text-primary">{t("Conectado")}</span>,
    disconnected: t("Desconectado"),
  };

  return (
    <>
      <SectionHeader title="Instagram" />

      <SectionBody className="gap-4">
        <div className="flex flex-col">
          <SectionItem
            title={t("Conectar cuenta")}
            aside={
              <div className="p-[8px] bg-primary/10 rounded-full">
                <Plus className="w-[24px] h-[24px] text-primary" />
              </div>
            }
            onClick={() =>
              navigate({
                to: "/integrations/instagram/new",
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
                to: "/integrations/instagram/onboarding",
                hash: (prevHash) => prevHash!,
              })
            }
          />
          {instagramIntegrations?.map((integration) => {
            const extra =
              integration.extra as InstagramOrganizationAddressExtra | null;
            const title = extra?.username
              ? `@${extra.username}`
              : extra?.name || integration.address;
            return (
              <SectionItem
                key={integration.address}
                aside={
                  <div className="p-[8px]">
                    <InstagramOutlined
                      style={{ fontSize: "24px", color: "#E1306C" }}
                    />
                  </div>
                }
                title={title}
                description={
                  statusLabels[integration.status] || integration.status
                }
                onClick={() =>
                  navigate({
                    to: "/integrations/instagram/$orgAddressId",
                    params: { orgAddressId: integration.address },
                    hash: (prevHash) => prevHash!,
                  })
                }
              />
            );
          })}
        </div>
      </SectionBody>
    </>
  );
}
