import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useTikTokSignup } from "@/queries/useTikTokSignup";
import OnboardLimitNotice from "@/components/OnboardLimitNotice";
import {
  TT_OAUTH_AGENT_KEY,
  TT_OAUTH_STATE_KEY,
  TT_ONBOARD_STATE_PREFIX,
  TT_REDIRECT_PATH,
} from "@/hooks/useTikTokConnect";

// Standalone (outside the `_auth` layout) so the return page is a bare
// "connecting" screen instead of the whole app shell — and so it opens without
// a session, for the onboarding links.
export const Route = createFileRoute("/oauth/tiktok")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : undefined,
    state: typeof search.state === "string" ? search.state : undefined,
    // TikTok sends `error=access_denied` when the user cancels/denies.
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  component: TikTokOAuthCallback,
});

function TikTokOAuthCallback() {
  const { state } = Route.useSearch();

  return state?.startsWith(TT_ONBOARD_STATE_PREFIX) ? (
    <OnboardCallback token={state.slice(TT_ONBOARD_STATE_PREFIX.length)} />
  ) : (
    <InAppCallback />
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-9 justify-center items-center bg-background text-foreground h-dvh w-screen">
      <div className="text-primary tracking-tighter font-bold text-[36px]">
        Open BSP
      </div>

      <div className="flex flex-col items-center gap-4 w-[320px] text-center">
        {children}
      </div>
    </div>
  );
}

/** The connect page sent this same tab to TikTok and back. */
function InAppCallback() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { code, state, error } = Route.useSearch();
  const { mutate: signup } = useTikTokSignup();
  const [failed, setFailed] = useState(false);
  const ran = useRef(false);

  // The token exchange runs here, scoped to the (persisted) active org.
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const expected = localStorage.getItem(TT_OAUTH_STATE_KEY);
    localStorage.removeItem(TT_OAUTH_STATE_KEY);

    // Whose account this is, chosen before the redirect. Absent is the
    // organization's.
    const agent_id = localStorage.getItem(TT_OAUTH_AGENT_KEY) ?? undefined;
    localStorage.removeItem(TT_OAUTH_AGENT_KEY);

    // User canceled/denied: quietly return to the connect screen.
    if (error === "access_denied") {
      void navigate({ to: "/integrations/tiktok/new", hash: "" });
      return;
    }

    if (error || !code || !state || state !== expected) {
      setFailed(true);
      return;
    }

    const redirect_uri = `${window.location.origin}${TT_REDIRECT_PATH}`;
    signup(
      { code, redirect_uri, agent_id },
      {
        onSuccess: (data) =>
          navigate({
            to: "/integrations/tiktok/$orgAddressId",
            params: { orgAddressId: data?.address ?? "" },
            hash: "",
          }),
        onError: () => setFailed(true),
      },
    );
  }, [code, state, error, signup, navigate]);

  return (
    <Shell>
      {failed ? (
        <>
          <p className="text-destructive font-medium">
            {t("No se pudo conectar la cuenta de TikTok.")}
          </p>
          <button
            type="button"
            className="text-primary font-medium cursor-pointer"
            onClick={() =>
              navigate({ to: "/integrations/tiktok/new", hash: "" })
            }
          >
            {t("Reintentar")}
          </button>
        </>
      ) : (
        <p className="text-muted-foreground">
          {t("Conectando tu cuenta de TikTok...")}
        </p>
      )}
    </Shell>
  );
}

type OnboardResult =
  | { status: "working" }
  | { status: "success" }
  | { status: "capped" }
  | { status: "error" };

/** An onboarding link sent a third party to TikTok and back, with no session. */
function OnboardCallback({ token }: { token: string }) {
  const { translate: t } = useTranslation();
  const { code } = Route.useSearch();
  const [result, setResult] = useState<OnboardResult>({ status: "working" });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!code || !token) {
      setResult({ status: "error" });
      return;
    }

    const redirect_uri = `${window.location.origin}${TT_REDIRECT_PATH}`;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tiktok-management/onboard`;

    fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, code, redirect_uri }),
    })
      .then((res) => {
        // The cap filled up between the link page and TikTok's return.
        if (res.status === 402) return setResult({ status: "capped" });
        if (!res.ok) throw new Error("Onboard failed");
        setResult({ status: "success" });
      })
      .catch(() => setResult({ status: "error" }));
  }, [code, token]);

  return (
    <Shell>
      {result.status === "working" && (
        <p className="text-muted-foreground">
          {t("Conectando tu cuenta de TikTok...")}
        </p>
      )}

      {result.status === "success" && (
        <div className="flex flex-col gap-2">
          <p className="text-primary font-medium text-[18px]">
            {t("Tu cuenta de TikTok fue conectada exitosamente.")}
          </p>
          <p className="text-muted-foreground text-[14px]">
            {t("Podés cerrar esta página.")}
          </p>
        </div>
      )}

      {result.status === "capped" && <OnboardLimitNotice />}

      {result.status === "error" && (
        <p className="text-destructive font-medium">
          {t("Error al conectar. Intentá de nuevo o contactá al proveedor.")}
        </p>
      )}
    </Shell>
  );
}
