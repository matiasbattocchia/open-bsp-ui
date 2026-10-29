import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import SectionItem from "@/components/SectionItem";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useOrganizationsAddresses } from "@/queries/useOrganizationsAddresses";
import { useTranslation } from "@/hooks/useTranslation";
import { Link, Plus } from "lucide-react";
import type { TikTokOrganizationAddressExtra } from "@/supabase/client";
import ConnectionOwner from "@/components/ConnectionOwner";
import { ConnectionStatus } from "@/components/ConnectionIssue";
import WarningBadge from "@/components/WarningBadge";
import ServiceIcon from "@/components/ServiceIcon";

export const Route = createFileRoute("/_auth/integrations/tiktok/")({
  component: TikTokIndex,
});

function TikTokIndex() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: integrations } = useOrganizationsAddresses();

  const tiktokIntegrations = integrations?.filter(
    (integration) => integration.service === "tiktok",
  );

  return (
    <>
      <SectionHeader title="TikTok" />

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
                to: "/integrations/tiktok/new",
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
                to: "/integrations/tiktok/onboarding",
                hash: (prevHash) => prevHash!,
              })
            }
          />
          {tiktokIntegrations?.map((integration) => {
            const extra =
              integration.extra as TikTokOrganizationAddressExtra | null;
            const title = extra?.username
              ? `@${extra.username}`
              : extra?.name || integration.address;
            return (
              <SectionItem
                key={integration.address}
                aside={
                  <div className="p-[8px]">
                    <WarningBadge show={!!integration.issue}>
                      <ServiceIcon service="tiktok" size={24} />
                    </WarningBadge>
                  </div>
                }
                title={title}
                description={
                  <>
                    <ConnectionStatus row={integration} />
                    <ConnectionOwner agentId={integration.agent_id} />
                  </>
                }
                onClick={() =>
                  navigate({
                    to: "/integrations/tiktok/$orgAddressId",
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
