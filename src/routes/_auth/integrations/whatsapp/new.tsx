import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import SectionFooter from "@/components/SectionFooter";
import WhatsAppIntegration from "@/components/WhatsAppIntegration";
import { useTranslation } from "@/hooks/useTranslation";
import ScopeToggle from "@/components/ScopeToggle";
import { useConnectionScope } from "@/hooks/useConnectionScope";

export const Route = createFileRoute("/_auth/integrations/whatsapp/new")({
  component: WhatsAppNew,
});

function WhatsAppNew() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { scope, setScope, isAdmin, agentId, allowed } = useConnectionScope();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("");
  const [verifyToken, setVerifyToken] = useState("");

  const handleSuccess = (phone_number_id: string) => {
    void navigate({
      to: "/integrations/whatsapp/$orgAddressId",
      params: { orgAddressId: phone_number_id },
      hash: (prevHash) => prevHash!,
    });
  };

  return (
    <>
      <SectionHeader title={t("Conectar WhatsApp")} />

      <SectionBody>
        <form>
          <div className="instructions">
            <p>
              {t(
                "Para conectar WhatsApp a la plataforma, iniciá sesión en tu cuenta de Meta y seguí el proceso de registro.",
              )}
            </p>

            <p>
              <strong>{t("Requisitos importantes")}</strong>
            </p>
            <ul>
              <li>
                {t(
                  "Si usás la app WhatsApp Business, podés conectar tu número actual y seguir usando la app.",
                )}
              </li>
              <li>
                {t(
                  "Si no usás la app, el número a conectar no debe estar activo en otra cuenta de WhatsApp.",
                )}
              </li>
            </ul>
          </div>

          <label>
            <div className="label">{t("Número")}</div>
            <ScopeToggle value={scope} onChange={setScope} isAdmin={isAdmin} />
          </label>

          <button
            type="button"
            className="text-primary text-sm font-medium cursor-pointer self-start"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            {showAdvanced
              ? t("Ocultar opciones avanzadas")
              : t("Opciones avanzadas")}
          </button>

          {showAdvanced && (
            <>
              <div className="instructions">
                <p>
                  {t(
                    "Sobrescribir la URL de callback es útil para evadir OpenBSP y recibir los webhooks crudos en el endpoint que indiques. OpenBSP seguirá recibiendo los eventos de cuenta y plantillas (no se pueden redirigir), pero no recibirá los mensajes.",
                  )}
                </p>
              </div>

              <label>
                <div className="label">
                  {t("URL de callback")} ({t("opcional")})
                </div>
                <input
                  type="url"
                  className="text"
                  placeholder="https://example.com/webhook"
                  value={callbackUrl}
                  onChange={(e) => setCallbackUrl(e.target.value)}
                />
              </label>

              <label>
                <div className="label">
                  {t("Token de verificación")} ({t("opcional")})
                </div>
                <input
                  type="text"
                  className="text"
                  placeholder={t("Token de verificación")}
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                />
              </label>
            </>
          )}
        </form>
      </SectionBody>

      <SectionFooter>
        <WhatsAppIntegration
          onSuccess={handleSuccess}
          allowed={allowed}
          signupOptions={{
            callback_url: callbackUrl.trim() || undefined,
            verify_token: verifyToken.trim() || undefined,
            agent_id: agentId,
          }}
        />
      </SectionFooter>
    </>
  );
}
