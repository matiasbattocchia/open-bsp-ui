import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useInstagramSignup } from "@/queries/useInstagramSignup";
import { IG_INAPP_REDIRECT_PATH } from "@/routes/_auth/integrations/instagram/new";

// Standalone (outside the `_auth` layout) so the return page is a bare
// "connecting" screen instead of the whole app shell.
export const Route = createFileRoute("/oauth/instagram")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : undefined,
    state: typeof search.state === "string" ? search.state : undefined,
    // Instagram sends `error=access_denied` when the user cancels/denies.
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  component: InstagramOAuthCallback,
});

function InstagramOAuthCallback() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { code, state, error } = Route.useSearch();
  const { mutate: signup } = useInstagramSignup();
  const [failed, setFailed] = useState(false);
  const ran = useRef(false);

  // The connect page redirected this same tab to Instagram and back, so the
  // token exchange runs here, scoped to the (persisted) active org.
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const expected = localStorage.getItem("ig_oauth_state");
    localStorage.removeItem("ig_oauth_state");

    // User canceled/denied: quietly return to the connect screen.
    if (error === "access_denied") {
      navigate({ to: "/integrations/instagram/new", hash: "" });
      return;
    }

    if (error || !code || !state || state !== expected) {
      setFailed(true);
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
        onError: () => setFailed(true),
      },
    );
  }, [code, state, error, signup, navigate]);

  return (
    <div className="flex flex-col gap-9 justify-center items-center bg-background text-foreground h-dvh w-screen">
      <div className="text-primary tracking-tighter font-bold text-[36px]">
        Open BSP
      </div>

      <div className="flex flex-col items-center gap-4 w-[320px] text-center">
        {failed ? (
          <>
            <p className="text-destructive font-medium">
              {t("No se pudo conectar la cuenta de Instagram.")}
            </p>
            <button
              type="button"
              className="text-primary font-medium cursor-pointer"
              onClick={() =>
                navigate({ to: "/integrations/instagram/new", hash: "" })
              }
            >
              {t("Reintentar")}
            </button>
          </>
        ) : (
          <p className="text-muted-foreground">
            {t("Conectando tu cuenta de Instagram...")}
          </p>
        )}
      </div>
    </div>
  );
}
