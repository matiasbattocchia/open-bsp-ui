import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import Button from "@/components/Button";
import { useTranslation } from "@/hooks/useTranslation";
import { useInstagramSignup } from "@/queries/useInstagramSignup";
import { IG_INAPP_REDIRECT_PATH } from "./new";

export const Route = createFileRoute("/_auth/integrations/instagram/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : undefined,
    state: typeof search.state === "string" ? search.state : undefined,
  }),
  component: InstagramCallback,
});

function InstagramCallback() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { code, state } = Route.useSearch();
  const signup = useInstagramSignup();
  const [error, setError] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // Shared across tabs (the authorize flow may run in a new tab).
    const expected = localStorage.getItem("ig_oauth_state");
    localStorage.removeItem("ig_oauth_state");

    if (!code || !state || state !== expected) {
      setError(true);
      return;
    }

    const redirect_uri = `${window.location.origin}${IG_INAPP_REDIRECT_PATH}`;

    signup.mutate(
      { code, redirect_uri },
      {
        onSuccess: (data: { address?: string }) =>
          navigate({
            to: "/integrations/instagram/$orgAddressId",
            params: { orgAddressId: data.address ?? "" },
            hash: (prevHash) => prevHash!,
          }),
        onError: () => setError(true),
      },
    );
  }, [code, state, signup, navigate]);

  return (
    <>
      <SectionHeader title={t("Conectar Instagram")} />
      <SectionBody>
        {error ? (
          <div className="flex flex-col gap-3">
            <p className="text-destructive font-medium">
              {t("No se pudo conectar la cuenta de Instagram.")}
            </p>
            <Button
              className="primary"
              onClick={() =>
                navigate({
                  to: "/integrations/instagram/new",
                  hash: (prevHash) => prevHash!,
                })
              }
            >
              {t("Reintentar")}
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground">
            {t("Conectando tu cuenta de Instagram...")}
          </p>
        )}
      </SectionBody>
    </>
  );
}
