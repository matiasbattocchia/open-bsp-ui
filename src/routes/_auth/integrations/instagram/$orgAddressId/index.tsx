import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import Button from "@/components/Button";
import { useTranslation } from "@/hooks/useTranslation";
import { useOrganizationAddress } from "@/queries/useOrganizationsAddresses";
import { useInstagramDisconnect } from "@/queries/useInstagramSignup";
import { useCurrentAgent } from "@/queries/useAgents";
import type { InstagramOrganizationAddressExtra } from "@/supabase/client";

export const Route = createFileRoute(
  "/_auth/integrations/instagram/$orgAddressId/",
)({
  component: InstagramAddressDetail,
});

function InstagramAddressDetail() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { orgAddressId } = Route.useParams();
  const { data: integration } = useOrganizationAddress(orgAddressId);
  const disconnect = useInstagramDisconnect();
  const { data: agent } = useCurrentAgent();

  if (!integration) return;

  const isOwner = agent?.extra?.role === "owner";
  const extra = integration.extra as
    | InstagramOrganizationAddressExtra
    | undefined;

  const handleDisconnect = () => {
    disconnect.mutate(
      { ig_user_id: integration.address },
      {
        onSuccess: () => navigate({ to: "/integrations/instagram" }),
      },
    );
  };

  return (
    <>
      <SectionHeader
        title={
          extra?.username
            ? `@${extra.username}`
            : extra?.name || t("Cuenta de Instagram")
        }
      />

      <SectionBody className="pb-[40px]">
        <form>
          {extra?.name && (
            <label>
              <div className="label">{t("Nombre")}</div>
              <input type="text" className="text" value={extra.name} readOnly />
            </label>
          )}

          <label>
            <div className="label">{t("Usuario")}</div>
            <input
              type="text"
              className="text"
              value={extra?.username ? `@${extra.username}` : ""}
              readOnly
            />
          </label>

          <label>
            <div className="label">{t("ID de cuenta")}</div>
            <input
              type="text"
              className="text"
              value={integration.address}
              readOnly
            />
          </label>

          {extra?.token_expires_at && (
            <label>
              <div className="label">{t("El acceso expira")}</div>
              <input
                type="text"
                className="text"
                value={new Date(extra.token_expires_at).toLocaleString()}
                readOnly
              />
            </label>
          )}

          <label>
            <div className="label">{t("Estado")}</div>
            <input
              type="text"
              className="text capitalize"
              value={
                integration.status === "connected"
                  ? t("Conectado")
                  : t("Desconectado")
              }
              readOnly
            />
          </label>

          {extra?.needs_reauth && (
            <div className="instructions">
              <p className="text-destructive">
                {t(
                  "La conexión expiró o fue revocada. Volvé a conectar la cuenta.",
                )}
              </p>
            </div>
          )}

          {integration.status === "connected" && (
            <Button
              type="button"
              className="primary bg-destructive text-primary-foreground hover:bg-destructive/80 px-4 py-2 rounded-full font-medium transition-colors w-fit text-[14px]"
              onClick={handleDisconnect}
              disabled={!isOwner}
              disabledReason={t("Requiere permisos de propietario")}
              loading={disconnect.isPending}
            >
              {t("Desconectar")}
            </Button>
          )}
        </form>
      </SectionBody>
    </>
  );
}
