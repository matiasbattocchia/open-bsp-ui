import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import SectionFooter from "@/components/SectionFooter";
import Button from "@/components/Button";
import { useTranslation } from "@/hooks/useTranslation";
import { getInstagramAuthorizeUrl } from "@/queries/useInstagramSignup";
import ScopeToggle from "@/components/ScopeToggle";
import { useConnectionScope } from "@/hooks/useConnectionScope";
import AccountLimitAlert from "@/components/stats/AccountLimitAlert";
import { useCanConnectAccount } from "@/queries/useBilling";

export const Route = createFileRoute("/_auth/integrations/instagram/new")({
  component: InstagramNew,
});

// Where Instagram redirects back to after the user authorizes. Must match a
// redirect URI registered in the Meta app dashboard. It's a standalone route
// (not under `_auth`) so the return page is a bare "connecting" screen rather
// than the whole app shell.
export const IG_INAPP_REDIRECT_PATH = "/oauth/instagram";

// The scope is chosen here but spent on the way back, after a round trip
// through Instagram — so it waits in localStorage beside the CSRF state.
export const IG_OAUTH_AGENT_KEY = "ig_oauth_agent_id";

function InstagramNew() {
  const { translate: t } = useTranslation();
  const { scope, setScope, isAdmin, agentId, allowed } = useConnectionScope();
  const canConnect = useCanConnectAccount();
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

    if (agentId) {
      localStorage.setItem(IG_OAUTH_AGENT_KEY, agentId);
    } else {
      localStorage.removeItem(IG_OAUTH_AGENT_KEY);
    }

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
        <AccountLimitAlert />
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

        <label>
          <div className="label">{t("Cuenta")}</div>
          <ScopeToggle value={scope} onChange={setScope} isAdmin={isAdmin} />
        </label>
      </SectionBody>

      <SectionFooter>
        <Button
          loading={loading}
          disabled={!allowed || !canConnect}
          disabledReason={
            !canConnect
              ? t("No se pueden conectar más cuentas.")
              : t("Requiere permisos de administrador")
          }
          className="primary bg-[#E1306C] hover:bg-[#E1306C]/90 text-white w-full"
          onClick={connect}
        >
          {t("Continuar con Instagram")}
        </Button>
      </SectionFooter>
    </>
  );
}
