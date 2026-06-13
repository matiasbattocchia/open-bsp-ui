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
// redirect URI registered in the Meta app dashboard.
export const IG_INAPP_REDIRECT_PATH = "/integrations/instagram/callback";

function InstagramNew() {
  const { translate: t } = useTranslation();
  const { data: currentAgent } = useCurrentAgent();
  const isOwner = currentAgent?.extra?.role === "owner";
  const [loading, setLoading] = useState(false);

  const connect = () => {
    // Open the tab synchronously within the click gesture so it isn't caught by
    // popup blockers, then point it at the authorize URL once we have it.
    const win = window.open("about:blank", "_blank");
    setLoading(true);

    const redirect_uri = `${window.location.origin}${IG_INAPP_REDIRECT_PATH}`;
    const state = crypto.randomUUID();
    // localStorage (not sessionStorage) so the new tab can read the CSRF nonce.
    localStorage.setItem("ig_oauth_state", state);

    getInstagramAuthorizeUrl(redirect_uri, state)
      .then((url) => {
        if (win) win.location.href = url;
        // Popup blocked → fall back to a same-tab redirect.
        else window.location.assign(url);
      })
      .catch(() => win?.close())
      .finally(() => setLoading(false));
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
