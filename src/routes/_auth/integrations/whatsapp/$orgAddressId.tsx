import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import SectionFooter from "@/components/SectionFooter";
import Button from "@/components/Button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useOrganizationsAddresses } from "@/queries/useOrganizationsAddresses";
import { useWhatsAppDisconnect } from "@/queries/useWhatsAppSignup";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentAgent } from "@/queries/useAgents";
import { formatPhoneNumber } from "@/utils/FormatUtils";

export const Route = createFileRoute("/_auth/integrations/whatsapp/$orgAddressId")({
  component: WhatsAppDetails,
});

function WhatsAppDetails() {
  const { orgAddressId } = Route.useParams();
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: integrations } = useOrganizationsAddresses();
  const disconnect = useWhatsAppDisconnect();
  const { data: agent } = useCurrentAgent();

  const isOwner = agent?.extra?.role === "owner";

  const integration = integrations?.find(
    (i) => i.address === orgAddressId
  );

  if (!integration) {
    return <div className="p-4">{t("Integración no encontrada")}</div>;
  }

  const handleDisconnect = () => {
    disconnect.mutate(
      { phone_number_id: integration.address },
      {
        onSuccess: () => {
          navigate({ to: "/integrations/whatsapp" });
        },
      }
    );
  };

  return (
    <>
      <SectionHeader title={t("Detalles de WhatsApp")} />

      <SectionBody>
        <div className="p-4 space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">{t("Número de teléfono")}</div>
            <div className="font-medium">{formatPhoneNumber((integration.extra as any)?.phone_number || integration.address)}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">{t("ID de Identificación")}</div>
            <div className="font-mono text-xs">{integration.address}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">{t("Estado")}</div>
            <div className="font-medium capitalize">{integration.status}</div>
          </div>
        </div>
      </SectionBody>

      <SectionFooter>
        <Button
          onClick={handleDisconnect}
          loading={disconnect.isPending}
          disabled={!isOwner}
          disabledReason={t("Requiere permisos de propietario")}
          className="danger"
        >
          {t("Desconectar")}
        </Button>
      </SectionFooter>
    </>
  );
}
