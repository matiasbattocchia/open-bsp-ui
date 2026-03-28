import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import { useTranslation } from "@/hooks/useTranslation";
import { useOnboardingTokens, useDeleteOnboardingToken } from "@/queries/useOnboardingTokens";
import { useCurrentAgent } from "@/queries/useAgents";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export const Route = createFileRoute("/_auth/integrations/whatsapp/onboarding/$tokenId")({
  component: OnboardingTokenDetail,
});

function OnboardingTokenDetail() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { tokenId } = Route.useParams();
  const { data: tokens } = useOnboardingTokens();
  const { data: currentAgent } = useCurrentAgent();
  const deleteToken = useDeleteOnboardingToken();
  const isOwner = currentAgent?.extra?.role === "owner";
  const [copied, setCopied] = useState(false);

  const token = tokens?.find((t) => t.id === tokenId);
  const isActive = token && token.status === "active" && new Date(token.expires_at) > new Date();
  const onboardUrl = `${window.location.origin}/onboard/${tokenId}`;

  function getStatusLabel() {
    if (!token) return "";
    if (token.status === "used") return t("Usado");
    if (token.status === "expired" || new Date(token.expires_at) < new Date()) return t("Expirado");
    return t("Activo");
  }

  function copyLink() {
    navigator.clipboard.writeText(onboardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return token && (
    <>
      <SectionHeader
        title={token.name}
        onDelete={() =>
          deleteToken.mutate(tokenId, {
            onSuccess: () =>
              navigate({ to: "..", hash: (prevHash) => prevHash! }),
          })
        }
        deleteDisabled={!isOwner}
        deleteDisabledReason={t("Requiere permisos de propietario")}
        deleteLoading={deleteToken.isPending}
      />

      <SectionBody>
        <form>
          <label>
            <div className="label">{t("Estado")}</div>
            <div className="text-[16px] text-foreground">{getStatusLabel()}</div>
          </label>

          <label>
            <div className="label">{t("Expira")}</div>
            <div className="text-[16px] text-foreground">
              {new Date(token.expires_at).toLocaleString()}
            </div>
          </label>

          {token.used_at && (
            <label>
              <div className="label">{t("Usado")}</div>
              <div className="text-[16px] text-foreground">
                {new Date(token.used_at).toLocaleString()}
              </div>
            </label>
          )}

          <label>
            <div className="label">{t("Enlace")}</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="text"
                readOnly
                value={onboardUrl}
              />
              {isActive && (
                <button
                  type="button"
                  className="p-[8px] hover:bg-muted rounded-full shrink-0"
                  title={t("Copiar enlace")}
                  onClick={copyLink}
                >
                  {copied ? (
                    <Check className="w-[20px] h-[20px] text-primary" />
                  ) : (
                    <Copy className="w-[20px] h-[20px] text-muted-foreground" />
                  )}
                </button>
              )}
            </div>
          </label>
        </form>
      </SectionBody>
    </>
  );
}
