import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useInstagramSignup } from "@/queries/useInstagramSignup";
import { IG_INAPP_REDIRECT_PATH } from "@/routes/_auth/integrations/instagram/new";

// Standalone (outside the `_auth` layout) so the popup renders a bare page
// instead of booting the whole app shell.
export const Route = createFileRoute("/oauth/instagram")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : undefined,
    state: typeof search.state === "string" ? search.state : undefined,
    // Instagram sends `error=access_denied` when the user cancels/denies.
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  component: InstagramOAuthCallback,
});

type Status = "working" | "posted" | "error";

function InstagramOAuthCallback() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { code, state, error } = Route.useSearch();
  const { mutate: signup } = useInstagramSignup();
  const [status, setStatus] = useState<Status>("working");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // New-tab mode (the default): hand the result to the opener tab and close.
    // We can't use `window.opener` — Instagram's auth pages send
    // Cross-Origin-Opener-Policy, which the browser uses to permanently sever
    // the opener link (and to block `window.close()`, hence the "you can close
    // this page" message). A BroadcastChannel is scoped to the origin, not the
    // opener, so it crosses that boundary; the localStorage write is a fallback
    // the opener also polls for.
    if (sessionStorage.getItem("ig_oauth_same_tab") !== "1") {
      const result = { code, state, error };
      const channel = new BroadcastChannel("ig_oauth");
      channel.postMessage({ type: "ig_oauth", ...result });
      channel.close();
      localStorage.setItem("ig_oauth_result", JSON.stringify(result));
      setStatus("posted");
      window.close(); // best effort; usually blocked after the COOP hop
      return;
    }

    // Same-tab fallback (popup was blocked, so the flow ran in this tab via a
    // full-page redirect): finish the exchange here.
    sessionStorage.removeItem("ig_oauth_same_tab");
    const expected = localStorage.getItem("ig_oauth_state");
    localStorage.removeItem("ig_oauth_state");

    // User canceled/denied, or the response is malformed.
    if (error || !code || !state || state !== expected) {
      if (error === "access_denied") {
        navigate({ to: "/integrations/instagram/new", hash: "" });
      } else {
        setStatus("error");
      }
      return;
    }

    const redirect_uri = `${window.location.origin}${IG_INAPP_REDIRECT_PATH}`;
    signup(
      { code, redirect_uri },
      {
        onSuccess: (data: { address?: string }) =>
          navigate({
            to: "/integrations/instagram/$orgAddressId",
            params: { orgAddressId: data.address ?? "" },
            // Drop the `#_=_` artifact Instagram appends to the redirect.
            hash: "",
          }),
        onError: () => setStatus("error"),
      },
    );
  }, [code, state, error, signup, navigate]);

  return (
    <div className="flex flex-col gap-9 justify-center items-center bg-background text-foreground h-dvh w-screen">
      <div className="text-primary tracking-tighter font-bold text-[36px]">
        Open BSP
      </div>

      <div className="flex flex-col gap-2 w-[320px] text-center">
        {status === "error" && (
          <p className="text-destructive font-medium">
            {t("No se pudo conectar la cuenta de Instagram.")}
          </p>
        )}
        {status === "working" && (
          <p className="text-muted-foreground">
            {t("Conectando tu cuenta de Instagram...")}
          </p>
        )}
        {status === "posted" && (
          <p className="text-muted-foreground text-[14px]">
            {t("Podés cerrar esta página.")}
          </p>
        )}
      </div>
    </div>
  );
}
