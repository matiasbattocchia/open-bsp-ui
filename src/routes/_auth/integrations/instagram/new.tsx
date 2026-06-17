import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import SectionFooter from "@/components/SectionFooter";
import Button from "@/components/Button";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentAgent } from "@/queries/useAgents";
import { getInstagramAuthorizeUrl } from "@/queries/useInstagramSignup";

export const Route = createFileRoute("/_auth/integrations/instagram/new")({
  component: InstagramNew,
});

// Where Instagram redirects back to after the user authorizes. Must match a
// redirect URI registered in the Meta app dashboard. It's a standalone route
// (not under `_auth`) so the return page is a bare "connecting" screen rather
// than the whole app shell.
export const IG_INAPP_REDIRECT_PATH = "/oauth/instagram";

function InstagramNew() {
  const { translate: t } = useTranslation();
  const { data: currentAgent } = useCurrentAgent();
  const isOwner = currentAgent?.extra?.role === "owner";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Instagram Business Login is a plain redirect OAuth (no SDK/popup like
  // WhatsApp). We redirect the whole tab so the token exchange happens back in
  // this same tab — scoped to the active org — with no fragile cross-tab
  // handoff (which COOP + background-tab throttling make unreliable).
  const connect = () => {
    setError(false);
    setLoading(true);

    const state = crypto.randomUUID();
    const redirect_uri = `${window.location.origin}${IG_INAPP_REDIRECT_PATH}`;
    // Read back on return to validate against CSRF.
    localStorage.setItem("ig_oauth_state", state);

    getInstagramAuthorizeUrl(redirect_uri, state)
      .then((url) => window.location.assign(url))
      .catch(() => {
        setLoading(false);
        setError(true);
      });
  };

  return (
    <>
      <SectionHeader title={t("Conectar Instagram")} />

      <SectionBody>
        <div className="instructions">
          <p>
            {t(
              "Para conectar Instagram a la plataforma, iniciá sesión con la cuenta de Instagram profesional (empresa o creador) que querés conectar.",
            )}
          </p>
          <ul>
            <li>
              {t(
                "La cuenta debe ser profesional (empresa o creador) y tener los mensajes habilitados.",
              )}
            </li>
            <li>
              {t(
                "Vas a ser redirigido a Instagram para autorizar y luego volverás a la plataforma.",
              )}
            </li>
          </ul>
          {error && (
            <p className="text-destructive font-medium">
              {t("No se pudo conectar la cuenta de Instagram.")}
            </p>
          )}
        </div>
      </SectionBody>

      <SectionFooter>
        <Button
          loading={loading}
          disabled={!isOwner}
          disabledReason={t("Requiere permisos de propietario")}
          className="primary bg-[#E1306C] hover:bg-[#E1306C]/90 text-white w-full"
          onClick={connect}
        >
          {t("Continuar con Instagram")}
        </Button>
      </SectionFooter>
    </>
  );
}
