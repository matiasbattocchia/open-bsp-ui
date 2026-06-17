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
// redirect URI registered in the Meta app dashboard. It's a standalone route
// (not under `_auth`) so the auth tab doesn't boot the whole app shell.
export const IG_INAPP_REDIRECT_PATH = "/oauth/instagram";

type OAuthResult = { code?: string; state?: string; error?: string };

function InstagramNew() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: currentAgent } = useCurrentAgent();
  const isOwner = currentAgent?.extra?.role === "owner";
  // The token exchange runs in THIS tab (not the auth tab) so the connection is
  // scoped to this tab's active organization — mirroring WhatsApp's flow.
  const { mutate: signup } = useInstagramSignup();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const stateRef = useRef<string | null>(null);
  const authTabRef = useRef<Window | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const pollRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  const teardown = () => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    channelRef.current?.close();
    channelRef.current = null;
    localStorage.removeItem("ig_oauth_result");
    localStorage.removeItem("ig_oauth_state");
  };

  // Drop the channel / interval if the user leaves this page mid-flow.
  useEffect(() => teardown, []);

  // Finalize once the auth tab reports back (via BroadcastChannel or the
  // localStorage safety net). Idempotent — both paths may fire.
  const finish = (result: OAuthResult | null) => {
    if (doneRef.current) return;
    doneRef.current = true;

    try {
      authTabRef.current?.close();
    } catch {
      // The handle is often neutered after Instagram's COOP hop; ignore.
    }
    teardown();

    const code = result?.code;
    const state = result?.state;
    if (result?.error || !code || !state || state !== stateRef.current) {
      setLoading(false);
      // Don't show an error when the user simply canceled the authorization.
      if (result?.error !== "access_denied") setError(true);
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

  const connect = () => {
    setError(false);
    doneRef.current = false;

    // Open the tab synchronously within the click gesture so it isn't caught by
    // popup blockers, then point it at the authorize URL once we have it.
    const authTab = window.open("about:blank", "_blank");
    authTabRef.current = authTab;
    setLoading(true);

    const state = crypto.randomUUID();
    stateRef.current = state;
    const redirect_uri = `${window.location.origin}${IG_INAPP_REDIRECT_PATH}`;
    // Persisted for the same-tab fallback below, where this tab navigates away
    // and validates `state` after coming back.
    localStorage.setItem("ig_oauth_state", state);
    localStorage.removeItem("ig_oauth_result");

    // BroadcastChannel survives Instagram severing window.opener via COOP.
    const channel = new BroadcastChannel("ig_oauth");
    channel.onmessage = (event: MessageEvent) => {
      if (event.data?.type === "ig_oauth") finish(event.data as OAuthResult);
    };
    channelRef.current = channel;

    // Safety net for a missed message, plus closed-tab detection.
    pollRef.current = window.setInterval(() => {
      const raw = localStorage.getItem("ig_oauth_result");
      if (raw) {
        try {
          finish(JSON.parse(raw) as OAuthResult);
        } catch {
          finish(null);
        }
        return;
      }
      try {
        if (authTab && authTab.closed) {
          teardown();
          setLoading(false);
        }
      } catch {
        // The handle may be neutered after the COOP hop; nothing to do.
      }
    }, 500);

    getInstagramAuthorizeUrl(redirect_uri, state)
      .then((url) => {
        if (authTab) {
          authTab.location.href = url;
        } else {
          // Tab blocked → fall back to a same-tab redirect; the callback
          // finishes the exchange in place.
          sessionStorage.setItem("ig_oauth_same_tab", "1");
          teardown();
          window.location.assign(url);
        }
      })
      .catch(() => {
        try {
          authTab?.close();
        } catch {
          // ignore
        }
        teardown();
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
