import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import SectionFooter from "@/components/SectionFooter";
import Button from "@/components/Button";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentAgent } from "@/queries/useAgents";
import {
  getInstagramAuthorizeUrl,
  useInstagramSignup,
} from "@/queries/useInstagramSignup";

export const Route = createFileRoute("/_auth/integrations/instagram/new")({
  component: InstagramNew,
});

// Where Instagram redirects back to after the user authorizes. Must match a
// redirect URI registered in the Meta app dashboard.
export const IG_INAPP_REDIRECT_PATH = "/integrations/instagram/callback";

function InstagramNew() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: currentAgent } = useCurrentAgent();
  const isOwner = currentAgent?.extra?.role === "owner";
  // The token exchange runs here (not in the popup) so the connection is scoped
  // to this tab's active organization — mirroring the WhatsApp embedded signup.
  const { mutate: signup } = useInstagramSignup();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<number | null>(null);
  const handledRef = useRef(false);

  const cleanup = () => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    popupRef.current = null;
  };

  useEffect(() => {
    // Authorization happens in a popup; it posts the OAuth `code` back here and
    // closes itself. We finish the exchange in this tab so the spinner stays on
    // the button and the account lands in the right organization.
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "ig_oauth" || handledRef.current) return;
      handledRef.current = true;

      const { code, state } = event.data;
      const expected = localStorage.getItem("ig_oauth_state");
      localStorage.removeItem("ig_oauth_state");

      popupRef.current?.close();
      cleanup();

      if (!code || !state || state !== expected) {
        setLoading(false);
        setError(true);
        return;
      }

      const redirect_uri = `${window.location.origin}${IG_INAPP_REDIRECT_PATH}`;
      signup(
        { code, redirect_uri },
        {
          onSuccess: (data: { address?: string }) => {
            setLoading(false);
            navigate({
              to: "/integrations/instagram/$orgAddressId",
              params: { orgAddressId: data.address ?? "" },
              hash: (prevHash) => prevHash!,
            });
          },
          onError: () => {
            setLoading(false);
            setError(true);
          },
        },
      );
    };

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      cleanup();
    };
  }, [navigate, signup]);

  const connect = () => {
    setError(false);
    handledRef.current = false;

    // Open the popup synchronously within the click gesture so it isn't caught
    // by popup blockers, then point it at the authorize URL once we have it.
    const popup = window.open(
      "about:blank",
      "ig_oauth",
      "popup,width=600,height=700",
    );
    popupRef.current = popup;
    setLoading(true);

    const redirect_uri = `${window.location.origin}${IG_INAPP_REDIRECT_PATH}`;
    const state = crypto.randomUUID();
    // localStorage (not sessionStorage) so the popup callback can read the nonce
    // in the same-tab fallback path.
    localStorage.setItem("ig_oauth_state", state);

    // Reset the spinner if the user closes the popup without authorizing.
    pollRef.current = window.setInterval(() => {
      if (popup?.closed) {
        cleanup();
        if (!handledRef.current) setLoading(false);
      }
    }, 500);

    getInstagramAuthorizeUrl(redirect_uri, state)
      .then((url) => {
        if (popup) popup.location.href = url;
        // Popup blocked → fall back to a same-tab redirect.
        else window.location.assign(url);
      })
      .catch(() => {
        popup?.close();
        cleanup();
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
