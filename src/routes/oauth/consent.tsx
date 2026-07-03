import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import type { OAuthAuthorizationDetails } from "@supabase/supabase-js";

// Consent screen for Supabase Auth's native OAuth 2.1 server (the MCP
// connector's authorization server). Supabase handles the whole protocol
// (registration, PKCE, codes, tokens) and redirects the user's browser here
// (Site URL + Authorization Path) with an authorization_id; this page's only
// job is to show what app wants access and submit Allow or Deny.
//
// Dynamic client registration is on, so ANY app can register and reach this
// screen — the app name is attacker-controllable. The redirect host is the
// real identity signal: warn when it is not a known AI client.
const TRUSTED_HOSTS = [
  "claude.ai",
  "claude.com",
  "anthropic.com",
  "chatgpt.com",
  "openai.com",
];

function hostOf(uri: string | undefined): string {
  try {
    return new URL(uri ?? "").host;
  } catch {
    return "";
  }
}

export const Route = createFileRoute("/oauth/consent")({
  validateSearch: (search): { authorization_id?: string } => ({
    authorization_id: (search.authorization_id as string) || undefined,
  }),
  component: OAuthConsent,
});

function OAuthConsent() {
  const { authorization_id } = Route.useSearch();
  const { translate: t } = useTranslation();

  const [details, setDetails] = useState<OAuthAuthorizationDetails | null>(
    null,
  );
  const [invalid, setInvalid] = useState(!authorization_id);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!authorization_id) return;

    supabase.auth.oauth
      .getAuthorizationDetails(authorization_id)
      .then(({ data, error }) => {
        if (error || !data) setInvalid(true);
        else setDetails(data);
      })
      .catch(() => setInvalid(true));
  }, [authorization_id]);

  async function decide(action: "approve" | "deny") {
    if (!authorization_id) return;
    setSubmitting(true);
    setMessage("");

    const { data, error } = action === "approve"
      ? await supabase.auth.oauth.approveAuthorization(authorization_id)
      : await supabase.auth.oauth.denyAuthorization(authorization_id);

    if (error || !data?.redirect_url) {
      setSubmitting(false);
      setMessage(
        t(
          "Algo salió mal. La autorización puede haber expirado — inicia la conexión nuevamente desde tu cliente de IA.",
        ),
      );
      return;
    }

    // Completes (or cancels) the flow on the client side.
    globalThis.location.assign(data.redirect_url);
  }

  const host = hostOf(details?.redirect_uri ?? details?.client.client_uri);
  const trusted = TRUSTED_HOSTS.some(
    (h) => host === h || host.endsWith("." + h),
  );

  return (
    <div className="flex flex-col gap-9 justify-center items-center bg-background text-foreground h-dvh w-screen">
      <div className="text-primary tracking-tighter font-bold text-[36px]">
        OpenBSP
      </div>

      <div className="flex flex-col gap-4 w-[340px] max-w-[90vw]">
        {invalid && (
          <div className="text-center">
            {t(
              "Este enlace de autorización no es válido o expiró — inicia la conexión nuevamente desde tu cliente de IA.",
            )}
          </div>
        )}

        {!invalid && !details && (
          <div className="text-center">{t("Cargando...")}</div>
        )}

        {!invalid && details && (
          <>
            <div className="text-center">
              <span className="font-bold">{details.client.client_name}</span>
              {" "}
              {t(
                "quiere conectarse a OpenBSP como tú. Podrá actuar en tu nombre, dentro de tus permisos.",
              )}
              {host && (
                <>
                  {" "}
                  {t("Al permitir, volverás a")}{" "}
                  <span className="font-bold">{host}</span>.
                </>
              )}
            </div>

            {!trusted && (
              <div className="border border-destructive text-destructive rounded-md p-3 text-sm">
                {t(
                  "⚠️ Aplicación no reconocida. Continúa solo si tú iniciaste esta conexión",
                )}
                {host ? ` (${host}).` : "."}{" "}
                {t("Si no fue así, elige Denegar.")}
              </div>
            )}

            <button
              type="button"
              className="primary w-full"
              disabled={submitting}
              onClick={() => decide("approve")}
            >
              {t("Permitir")}
            </button>

            <button
              type="button"
              className="destructive w-full"
              disabled={submitting}
              onClick={() => decide("deny")}
            >
              {t("Denegar")}
            </button>

            {message && (
              <div className="self-center text-destructive text-md text-center">
                {message}
              </div>
            )}

            <div className="text-center text-sm opacity-60">
              {t("Conectado como")} {details.user.email}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
