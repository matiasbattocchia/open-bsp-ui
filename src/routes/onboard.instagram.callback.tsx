import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { IG_ONBOARD_REDIRECT_PATH } from "./onboard.instagram.$token";

export const Route = createFileRoute("/onboard/instagram/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : undefined,
    state: typeof search.state === "string" ? search.state : undefined,
  }),
  component: OnboardInstagramCallback,
});

type State =
  | { status: "working" }
  | { status: "success" }
  | { status: "error" };

function OnboardInstagramCallback() {
  const { translate: t } = useTranslation();
  const { code, state } = Route.useSearch();
  const [result, setResult] = useState<State>({ status: "working" });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // `state` carries the onboarding token.
    if (!code || !state) {
      setResult({ status: "error" });
      return;
    }

    const redirect_uri = `${window.location.origin}${IG_ONBOARD_REDIRECT_PATH}`;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/instagram-management/onboard`;

    fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: state, code, redirect_uri }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Onboard failed");
        return res.json();
      })
      .then(() => setResult({ status: "success" }))
      .catch(() => setResult({ status: "error" }));
  }, [code, state]);

  return (
    <div className="flex flex-col gap-9 justify-center items-center bg-background text-foreground h-dvh w-screen">
      <div className="text-primary tracking-tighter font-bold text-[36px]">
        Open BSP
      </div>

      <div className="flex flex-col gap-4 w-[320px] text-center">
        {result.status === "working" && (
          <p className="text-muted-foreground">
            {t("Conectando tu cuenta de Instagram...")}
          </p>
        )}

        {result.status === "success" && (
          <div className="flex flex-col gap-2">
            <p className="text-primary font-medium text-[18px]">
              {t("Tu cuenta de Instagram fue conectada exitosamente.")}
            </p>
            <p className="text-muted-foreground text-[14px]">
              {t("Podés cerrar esta página.")}
            </p>
          </div>
        )}

        {result.status === "error" && (
          <p className="text-destructive font-medium">
            {t("Error al conectar. Intentá de nuevo o contactá al proveedor.")}
          </p>
        )}
      </div>
    </div>
  );
}
