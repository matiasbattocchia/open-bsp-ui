import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import Button from "@/components/Button";
import { getInstagramAuthorizeUrl } from "@/queries/useInstagramSignup";

export const Route = createFileRoute("/onboard/instagram/$token")({
  component: OnboardInstagram,
});

// Fixed public callback (must be registered in the Meta app dashboard); the
// onboarding token rides in `state`, not the path.
export const IG_ONBOARD_REDIRECT_PATH = "/onboard/instagram/callback";

type TokenValidation =
  | { status: "loading" }
  | { status: "valid"; organization_name: string }
  | { status: "invalid" };

function OnboardInstagram() {
  const { token } = Route.useParams();
  const { translate: t } = useTranslation();
  const [state, setState] = useState<TokenValidation>({ status: "loading" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/instagram-management/onboard?token=${token}`;
    fetch(url, {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setState({
            status: "valid",
            organization_name: data.organization_name,
          });
        } else {
          setState({ status: "invalid" });
        }
      })
      .catch(() => setState({ status: "invalid" }));
  }, [token]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const redirect_uri = `${window.location.origin}${IG_ONBOARD_REDIRECT_PATH}`;
      const url = await getInstagramAuthorizeUrl(redirect_uri, token);
      window.location.assign(url);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-9 justify-center items-center bg-background text-foreground h-dvh w-screen">
      <div className="text-primary tracking-tighter font-bold text-[36px]">
        Open BSP
      </div>

      <div className="flex flex-col gap-4 w-[320px] text-center">
        {state.status === "loading" && (
          <p className="text-muted-foreground">{t("Validando enlace...")}</p>
        )}

        {state.status === "invalid" && (
          <div className="flex flex-col gap-2">
            <p className="text-destructive font-medium">
              {t("Este enlace es inválido o ha expirado.")}
            </p>
            <p className="text-muted-foreground text-[14px]">
              {t("Solicitá un nuevo enlace a tu proveedor.")}
            </p>
          </div>
        )}

        {state.status === "valid" && (
          <div className="flex flex-col gap-4">
            <p className="text-foreground">
              {t("Conectá tu cuenta de Instagram a")}{" "}
              <strong>{state.organization_name}</strong>
            </p>

            <div className="instructions text-left text-[14px] text-muted-foreground">
              <p>
                {t(
                  "Iniciá sesión con la cuenta de Instagram profesional (empresa o creador) que querés conectar. Vas a ser redirigido a Instagram para autorizar.",
                )}
              </p>
            </div>

            <Button
              loading={loading}
              className="primary bg-[#E1306C] hover:bg-[#E1306C]/90 text-white w-full"
              onClick={handleConnect}
            >
              {t("Continuar con Instagram")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
