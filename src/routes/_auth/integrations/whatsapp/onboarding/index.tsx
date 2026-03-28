import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import SectionItem from "@/components/SectionItem";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "@/hooks/useTranslation";
import { useOnboardingTokens } from "@/queries/useOnboardingTokens";
import { useCurrentAgent } from "@/queries/useAgents";
import { Link, Plus } from "lucide-react";
import type { JSX } from "react";

export const Route = createFileRoute("/_auth/integrations/whatsapp/onboarding/")({
  component: OnboardingIndex,
});

function OnboardingIndex() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: tokens } = useOnboardingTokens();
  const { data: currentAgent } = useCurrentAgent();
  const isOwner = currentAgent?.extra?.role === "owner";

  function getStatus(token: { status: string; expires_at: string }): string | JSX.Element {
    if (token.status === "used") return t("Usado");
    if (token.status === "expired" || new Date(token.expires_at) < new Date()) return t("Expirado");
    return <span className="text-primary">{t("Activo")}</span>;
  }

  return (
    <>
      <SectionHeader title={t("Enlaces de onboarding")} />

      <SectionBody>
        <SectionItem
          title={t("Generar enlace")}
          aside={
            <div className="p-[8px] bg-primary/10 rounded-full">
              <Plus className="w-[24px] h-[24px] text-primary" />
            </div>
          }
          onClick={() =>
            navigate({
              to: "/integrations/whatsapp/onboarding/new",
              hash: (prevHash) => prevHash!,
            })
          }
          disabled={!isOwner}
          disabledReason={t("Requiere permisos de propietario")}
        />
        {tokens?.map((token) => (
          <SectionItem
            key={token.id}
            aside={
              <div className="p-[8px]">
                <Link className="w-[24px] h-[24px] text-muted-foreground" />
              </div>
            }
            title={
              <span className="font-mono text-[13px]">
                {token.id.slice(0, 8)}...
              </span>
            }
            description={
              <span>
                {getStatus(token)}
                {" · "}
                {t("Expira")} {new Date(token.expires_at).toLocaleDateString()}
              </span>
            }
            onClick={() =>
              navigate({
                to: "/integrations/whatsapp/onboarding/$tokenId",
                params: { tokenId: token.id },
                hash: (prevHash) => prevHash!,
              })
            }
          />
        ))}
      </SectionBody>
    </>
  );
}
