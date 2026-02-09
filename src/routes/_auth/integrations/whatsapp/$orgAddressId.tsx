import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useOrganizationAddress } from "@/queries/useOrganizationsAddresses";
import { useWhatsAppDisconnect } from "@/queries/useWhatsAppSignup";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentAgent } from "@/queries/useAgents";
import { formatPhoneNumber } from "@/utils/FormatUtils";
import type { OrganizationAddressExtra } from "@/supabase/client";
import { useState } from "react";
import Button from "@/components/Button";

export const Route = createFileRoute("/_auth/integrations/whatsapp/$orgAddressId")({
  component: WhatsAppDetails,
});

function WhatsAppDetails() {
  const { orgAddressId } = Route.useParams();
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: integration } = useOrganizationAddress(orgAddressId);
  const disconnect = useWhatsAppDisconnect();
  const { data: agent } = useCurrentAgent();
  const [showInstructions, setShowInstructions] = useState(false);

  if (!integration) return

  const isOwner = agent?.extra?.role === "owner";

  const extra = integration.extra as OrganizationAddressExtra | undefined;
  const flowType = extra?.flow_type;
  const isCoexistence = flowType === "existing_phone_number";

  const flowTypeLabels: Record<string, string> = {
    new_phone_number: t("Nuevo número de WhatsApp"),
    existing_phone_number: t("Cuenta de WhatsApp Business existente"),
    only_waba: t("Solo WABA"),
  };

  const handleDisconnect = () => {
    if (isCoexistence) {
      setShowInstructions(true);
      return;
    }

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
      <SectionHeader title={integration.extra?.verified_name || t("Cuenta de WhatsApp")} />

      <SectionBody className="pb-[40px]">
        <form>
          <label>
            <div className="label">{t("Nombre verificado")}</div>
            <input
              type="text"
              className="text"
              value={extra?.verified_name || t("Sin nombre")}
              readOnly
            />
          </label>

          <label>
            <div className="label">{t("Número de teléfono")}</div>
            <input
              type="tel"
              className="text"
              value={formatPhoneNumber(extra?.phone_number || "")}
              readOnly
            />
          </label>

          <label>
            <div className="label">{t("Tipo de integración")}</div>
            <input
              type="text"
              className="text"
              value={flowType ? flowTypeLabels[flowType] || flowType : ""}
              readOnly
            />
          </label>

          <label>
            <div className="label">{t("ID de número")}</div>
            <input
              type="text"
              className="text"
              value={integration.address}
              readOnly
            />
          </label>

          <label>
            <div className="label">{t("ID de WABA")}</div>
            <input
              type="text"
              className="text"
              value={integration.extra?.waba_id}
              readOnly
            />
          </label>

          <label>
            <div className="label">{t("Estado")}</div>
            <input
              type="text"
              className="text capitalize"
              value={integration.status === "connected" ? t("Conectado") : t("Desconectado")}
              readOnly
            />
          </label>

          {/* Disconnect button */}
          {integration.status === "connected" && !showInstructions && <Button
            type="button"
            className="primary bg-destructive text-primary-foreground hover:bg-destructive/80 px-4 py-2 rounded-full font-medium transition-colors w-fit text-[14px]"
            onClick={handleDisconnect}
            disabled={!isOwner}
            disabledReason={t("Requiere permisos de propietario")}
            loading={disconnect.isPending}
          >
            {t("Desconectar")}
          </Button>}

          {/* Coexistence disconnect instructions */}
          {showInstructions && (
            <div className="instructions">
              <p>{t("La cuenta debe ser desvinculada desde la aplicación móvil de WhatsApp Business:")}</p>
              <ol>
                <li>{t("Abrí la aplicación WhatsApp Business")}</li>
                <li>{t("Andá a Ajustes > Cuenta > Plataforma de negocio")}</li>
                <li>{t("Tocá la plataforma conectada y seleccioná \"Desconectar\"")}</li>
              </ol>
            </div>
          )}
        </form>
      </SectionBody>
    </>
  );
}
