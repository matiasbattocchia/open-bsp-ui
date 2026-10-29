import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useOrganizationAddress } from "@/queries/useOrganizationsAddresses";
import { useWhatsAppDisconnect } from "@/queries/useWhatsAppSignup";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentAgent } from "@/queries/useAgents";
import { formatPhoneNumber } from "@/utils/FormatUtils";
import type { WhatsAppOrganizationAddressExtra } from "@/supabase/client";
import { useState } from "react";
import Button from "@/components/Button";
import SectionFooter from "@/components/SectionFooter";
import SectionItem from "@/components/SectionItem";
import WhatsAppIntegration from "@/components/WhatsAppIntegration";
import AccountLimitAlert from "@/components/stats/AccountLimitAlert";
import { useCanConnectAccount } from "@/queries/useBilling";
import { LayoutTemplate } from "lucide-react";
import {
  activeIssue,
  ConnectionIssueCard,
  isHeldByMeta,
  MetaReview,
} from "@/components/ConnectionIssue";

export const Route = createFileRoute(
  "/_auth/integrations/whatsapp/$orgAddressId/",
)({
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
  const canConnect = useCanConnectAccount();

  if (!integration) return;

  // Admin+, or the member whose own account this is: a user-scoped address
  // carries their agent_id, the organization's carries none.
  const canManage =
    ["admin", "owner"].includes(agent?.role || "") ||
    (!!integration.agent_id && integration.agent_id === agent?.id);

  const extra = integration.extra as
    | WhatsAppOrganizationAddressExtra
    | undefined;
  const flowType = extra?.flow_type;
  const isCoexistence = flowType === "existing_phone_number";
  const isConnected = integration.status === "connected";
  const issue = activeIssue(integration);
  // Meta holds it: the signup would be refused, a review at Meta is the way.
  const held = isHeldByMeta(integration);
  // A dead token keeps the account connected, and a signup replaces it.
  const needsSignup = !isConnected || issue?.reason === "expired";

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
          void navigate({ to: "/integrations/whatsapp" });
        },
      },
    );
  };

  return (
    <>
      <SectionHeader title={extra?.verified_name || t("Cuenta de WhatsApp")} />

      <SectionBody>
        {/* What Meta did; the footer reconnects, or says where to appeal */}
        {issue && (
          <div className="mb-[12px]">
            <ConnectionIssueCard row={integration} />
          </div>
        )}
        {/* Connecting again is a new connection: the cap counts only
            connected accounts. */}
        {!isConnected && !held && <AccountLimitAlert />}
        {/* Set apart from the form by its field gap. Templates live at Meta,
            reached with the account's token: none while disconnected. */}
        <div className="mb-[20px]">
          <SectionItem
            className="bg-accent"
            title={t("Plantillas de mensajes")}
            aside={
              <div className="p-[8px]">
                <LayoutTemplate className="w-[24px] h-[24px] text-muted-foreground" />
              </div>
            }
            disabled={!isConnected}
            disabledReason={t("La cuenta está desconectada")}
            onClick={() =>
              navigate({
                to: "/integrations/whatsapp/$orgAddressId/templates",
                params: { orgAddressId },
                hash: (prevHash) => prevHash!,
              })
            }
          />
        </div>
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
              value={extra?.waba_id}
              readOnly
            />
          </label>

          <label>
            <div className="label">{t("Estado")}</div>
            <input
              type="text"
              className="text capitalize"
              value={isConnected ? t("Conectado") : t("Desconectado")}
              readOnly
            />
          </label>

          {extra?.access_token && (
            <label>
              <div className="label">{t("Token de acceso de WABA")}</div>
              <input
                type="text"
                className="text font-mono text-xs"
                value={extra.access_token}
                readOnly
              />
            </label>
          )}

          <div className="instructions">
            <p>
              {t(
                "Sobrescribir la URL de callback es útil para evadir OpenBSP y recibir los webhooks crudos en el endpoint que indiques. OpenBSP seguirá recibiendo los eventos de cuenta y plantillas (no se pueden redirigir), pero no recibirá los mensajes.",
              )}
            </p>
          </div>

          <label>
            <div className="label">{t("URL de callback")}</div>
            <input
              type="text"
              className="text"
              value={extra?.callback_url || ""}
              placeholder={t("Sin sobrescribir")}
              readOnly
            />
          </label>

          <label>
            <div className="label">{t("Token de verificación")}</div>
            <input
              type="text"
              className="text"
              value={extra?.verify_token || ""}
              placeholder={t("Sin sobrescribir")}
              readOnly
            />
          </label>
        </form>
      </SectionBody>

      {isConnected && (
        <SectionFooter>
          {/* A coexistence account is unlinked from the app, not here: its
              steps take the button's place, like the plans' contact note. */}
          {showInstructions ? (
            <div className="instructions">
              <p>
                {t(
                  "La cuenta debe ser desvinculada desde la aplicación móvil de WhatsApp Business:",
                )}
              </p>
              <ol>
                <li>{t("Abrí la aplicación WhatsApp Business")}</li>
                <li>{t("Andá a Ajustes > Cuenta > Plataforma de negocio")}</li>
                <li>
                  {t('Tocá la plataforma conectada y seleccioná "Desconectar"')}
                </li>
              </ol>
            </div>
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
      )}

      {/* Connecting again is Embedded Signup again: Meta hands over a fresh
          token, and the account keeps its owner and webhook overrides. */}
      {(held ||
        issue?.reason === "restricted" ||
        issue?.reason === "locked") && (
        <SectionFooter>
          <div className="instructions">
            <MetaReview />
          </div>
        </SectionFooter>
      )}

      {needsSignup && !held && (
        <SectionFooter>
          <WhatsAppIntegration
            label={t("Volver a conectar")}
            className="primary"
            allowed={canManage}
            canConnect={canConnect}
            signupOptions={{
              callback_url: extra?.callback_url ?? undefined,
              verify_token: extra?.verify_token ?? undefined,
              agent_id: integration.agent_id ?? undefined,
            }}
            onSuccess={(phone_number_id) =>
              navigate({
                to: "/integrations/whatsapp/$orgAddressId",
                params: { orgAddressId: phone_number_id || orgAddressId },
                hash: (prevHash) => prevHash!,
              })
            }
          />
        </SectionFooter>
      )}
    </>
  );
}
