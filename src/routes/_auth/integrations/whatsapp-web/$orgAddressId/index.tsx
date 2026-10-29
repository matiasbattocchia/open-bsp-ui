import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import Button from "@/components/Button";
import SectionFooter from "@/components/SectionFooter";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useOrganizationAddress } from "@/queries/useOrganizationsAddresses";
import {
  useWhatsAppWebHealth,
  useDisconnectWhatsAppWeb,
} from "@/queries/useWhatsAppWeb";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentAgent } from "@/queries/useAgents";
import { formatPhoneNumber } from "@/utils/FormatUtils";
import AccountLimitAlert from "@/components/stats/AccountLimitAlert";
import { useCanConnectAccount } from "@/queries/useBilling";
import {
  activeIssue,
  ConnectionIssueCard,
  isWorking,
} from "@/components/ConnectionIssue";

export const Route = createFileRoute(
  "/_auth/integrations/whatsapp-web/$orgAddressId/",
)({
  component: WhatsAppWebDetails,
});

function WhatsAppWebDetails() {
  const { orgAddressId } = Route.useParams();
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: integration } = useOrganizationAddress(orgAddressId);
  const { data: health } = useWhatsAppWebHealth(orgAddressId);
  const disconnect = useDisconnectWhatsAppWeb();
  const { data: agent } = useCurrentAgent();
  const canConnect = useCanConnectAccount();

  if (!integration) return;

  // Admin+, or the member whose own number this is: a user-scoped address
  // carries their agent_id, the organization's carries none.
  const canManage =
    ["admin", "owner"].includes(agent?.role || "") ||
    (!!integration.agent_id && integration.agent_id === agent?.id);
  const isConnected = integration.status === "connected";

  // Durable row status is the source of truth; live health refines the label.
  const statusText = !isWorking(integration)
    ? t("Desconectado")
    : health
      ? health.connected && health.logged_in
        ? t("Conectado")
        : t("Reconectando...")
      : t("Conectado");

  const handleDisconnect = () => {
    disconnect.mutate(integration.address, {
      onSuccess: () => navigate({ to: "/integrations/whatsapp-web" }),
    });
  };

  return (
    <>
      <SectionHeader title={formatPhoneNumber(integration.address)} />

      <SectionBody>
        {/* What WhatsApp did; the footer reconnects */}
        {activeIssue(integration) && (
          <div className="mb-[12px]">
            <ConnectionIssueCard row={integration} />
          </div>
        )}
        {/* Re-pairing a disconnected number connects it anew: the cap counts
            only connected accounts. */}
        {!isConnected && <AccountLimitAlert />}
        <form>
          <label>
            <div className="label">{t("Número de teléfono")}</div>
            <input
              type="tel"
              className="text"
              value={formatPhoneNumber(integration.address)}
              readOnly
            />
          </label>

          <label>
            <div className="label">{t("Estado")}</div>
            <input
              type="text"
              className="text capitalize"
              value={statusText}
              readOnly
            />
          </label>
        </form>
      </SectionBody>

      <SectionFooter>
        {!isConnected ? (
          // Pairing again is the QR or code flow again, on its own page,
          // for the owner the number had.
          <Button
            type="button"
            className="primary"
            onClick={() =>
              navigate({
                to: "/integrations/whatsapp-web/new",
                search: { reconnect: integration.address },
                hash: (prevHash) => prevHash!,
              })
            }
            disabled={!canManage || !canConnect}
            disabledReason={
              !canConnect
                ? t("No se pueden conectar más cuentas.")
                : t("Requiere permisos de administrador")
            }
          >
            {t("Volver a conectar")}
          </Button>
        ) : (
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
