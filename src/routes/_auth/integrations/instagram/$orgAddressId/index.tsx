import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import Button from "@/components/Button";
import SectionFooter from "@/components/SectionFooter";
import AccountLimitAlert from "@/components/stats/AccountLimitAlert";
import { useInstagramConnect } from "@/hooks/useInstagramConnect";
import { useCanConnectAccount } from "@/queries/useBilling";
import {
  activeIssue,
  ConnectionIssueCard,
  isWorking,
} from "@/components/ConnectionIssue";
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
  const reconnect = useInstagramConnect();
  const canConnect = useCanConnectAccount();

  if (!integration) return;

  // Admin+, or the member whose own account this is: a user-scoped address
  // carries their agent_id, the organization's carries none.
  const canManage =
    ["admin", "owner"].includes(agent?.role || "") ||
    (!!integration.agent_id && integration.agent_id === agent?.id);
  const extra = integration.extra as
    | InstagramOrganizationAddressExtra
    | undefined;
  const isConnected = integration.status === "connected";

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

      <SectionBody>
        {/* What Instagram did; the footer reconnects */}
        {activeIssue(integration) && (
          <div className="mb-[12px]">
            <ConnectionIssueCard row={integration} />
          </div>
        )}
        {/* Connecting again is a new connection: the cap counts only
            connected accounts. */}
        {!isConnected && <AccountLimitAlert />}
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
                isWorking(integration) ? t("Conectado") : t("Desconectado")
              }
              readOnly
            />
          </label>

          {reconnect.error && (
            <div className="instructions">
              <p className="text-destructive font-medium">
                {t("No se pudo conectar la cuenta de Instagram.")}
              </p>
            </div>
          )}
        </form>
      </SectionBody>

      <SectionFooter className="gap-[12px]">
        {/* Connecting again is Instagram's login again, for the same owner:
            a fresh token for an expired one, still connected, or the account
            back after a disconnect. Only the latter counts toward the cap.
            An expired account keeps Disconnect too: its place under the cap
            is held until someone frees it. */}
        {!isWorking(integration) && (
          <Button
            type="button"
            className="primary"
            onClick={() => reconnect.connect(integration.agent_id ?? undefined)}
            disabled={!canManage || (!isConnected && !canConnect)}
            disabledReason={
              !isConnected && !canConnect
                ? t("No se pueden conectar más cuentas.")
                : t("Requiere permisos de administrador")
            }
            loading={reconnect.loading}
          >
            {t("Volver a conectar")}
          </Button>
        )}
        {isConnected && (
          <Button
            type="button"
            className="destructive"
            onClick={handleDisconnect}
            confirm={t("¿Desconectar?")}
            disabled={!canManage}
            disabledReason={t("Requiere permisos de administrador")}
            loading={disconnect.isPending}
          >
            {t("Desconectar")}
          </Button>
        )}
      </SectionFooter>
    </>
  );
}
