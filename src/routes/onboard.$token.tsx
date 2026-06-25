import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import Button from "@/components/Button";
import type { SignupPayload } from "@/contexts/WhatsAppIntegrationContext";

export const Route = createFileRoute("/onboard/$token")({
  component: Onboard,
});

type TokenValidation =
  | { status: "loading" }
  | { status: "valid"; organization_name: string }
  | { status: "invalid" }
  | { status: "success" }
  | { status: "error"; message: string };

function Onboard() {
  const { token } = Route.useParams();
  const { translate: t } = useTranslation();
  const [state, setState] = useState<TokenValidation>({ status: "loading" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-management/onboard?token=${token}`;
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
      .catch(() => {
        setState({ status: "invalid" });
      });
  }, [token]);

  const handleSignup = useCallback(() => {
    const FB = (window as any).FB;

    if (!FB) {
      setState({
        status: "error",
        message: t("Facebook SDK no disponible. Recargá la página."),
      });
      return;
    }

    FB.login(
      function (response: any) {
        if (!response.authResponse?.code) {
          return;
        }

        const code = response.authResponse.code;

        const doSignup = (sessionInfo: Record<string, unknown>) => {
          setLoading(true);

          const payload: SignupPayload = {
            code,
            application_id: import.meta.env.VITE_META_APP_ID,
            phone_number_id: sessionInfo.phone_number_id as string | undefined,
            waba_id: sessionInfo.waba_id as string | undefined,
            business_id: sessionInfo.business_id as string | undefined,
            flow_type: sessionInfo.flow_type as SignupPayload["flow_type"],
          };

          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-management/onboard`;

          fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token, ...payload }),
          })
            .then((res) => {
              if (!res.ok) throw new Error("Signup failed");
              return res.json();
            })
            .then(() => {
              setState({ status: "success" });
            })
            .catch((error: Error) => {
              console.error("Onboard signup failed:", error);
              setState({
                status: "error",
                message: t("Error al conectar. Intentá de nuevo o contactá al proveedor."),
              });
            })
            .finally(() => {
              setLoading(false);
            });
        };

        const sessionInfo = (window as any).__waSessionInfo || {};

        if (sessionInfo.phone_number_id && sessionInfo.waba_id) {
          doSignup(sessionInfo);
          return;
        }

        // Race guard: FB.login may fire before Meta's postMessage with WABA details arrives.
        let timedOut = false;
        const timeout = setTimeout(() => {
          timedOut = true;
          window.removeEventListener("message", onMessage);
          setState({
            status: "error",
            message: t("Error al conectar. Intentá de nuevo o contactá al proveedor."),
          });
        }, 30_000);

        const onMessage = (event: MessageEvent) => {
          if (timedOut) return;

          if (!event.origin.endsWith("facebook.com")) return;
          if (
            typeof event.data !== "string" ||
            !event.data.includes("WA_EMBEDDED_SIGNUP")
          ) return;

          let data: Record<string, unknown>;
          try { data = JSON.parse(event.data); } catch { return; }

          if (data.type !== "WA_EMBEDDED_SIGNUP" || data.event === "CANCEL") return;

          const info = data.data as Record<string, unknown>;
          if (!info?.phone_number_id || !info?.waba_id) return;

          window.removeEventListener("message", onMessage);
          clearTimeout(timeout);

          let flow_type: SignupPayload["flow_type"];
          if (data.event === "FINISH") {
            flow_type = "new_phone_number";
          } else if (data.event === "FINISH_ONLY_WABA") {
            flow_type = "only_waba";
          } else if (data.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING") {
            flow_type = "existing_phone_number";
          } else return;

          doSignup({
            phone_number_id: info.phone_number_id,
            waba_id: info.waba_id,
            business_id: info.business_id,
            flow_type,
          });
        };

        window.addEventListener("message", onMessage);
      },
      {
        config_id: import.meta.env.VITE_FB_LOGIN_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: {},
      },
    );
  }, [token, t]);

  return (
    <div className="flex flex-col gap-9 justify-center items-center bg-background text-foreground h-dvh w-screen">
      <div className="text-primary tracking-tighter font-bold text-[36px]">
        OpenBSP
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
              {t("Conectá tu número de WhatsApp a")}{" "}
              <strong>{state.organization_name}</strong>
            </p>

            <div className="instructions text-left text-[14px] text-muted-foreground">
              <p>{t("Iniciá sesión en tu cuenta de Meta y seguí el proceso de registro.")}</p>
              <p><strong>{t("Requisitos importantes")}</strong></p>
              <ul>
                <li>{t("Si usás la app WhatsApp Business, podés conectar tu número actual y seguir usando la app.")}</li>
                <li>{t("Si no usás la app, el número a conectar no debe estar activo en otra cuenta de WhatsApp.")}</li>
              </ul>
            </div>

            <Button
              loading={loading}
              className="primary bg-[#4267b2] hover:bg-[#4267b2]/90 text-white w-full"
              onClick={handleSignup}
            >
              {t("Continuar con Facebook")}
            </Button>
          </div>
        )}

        {state.status === "success" && (
          <div className="flex flex-col gap-2">
            <p className="text-primary font-medium text-[18px]">
              {t("Tu número de WhatsApp fue conectado exitosamente.")}
            </p>
            <p className="text-muted-foreground text-[14px]">
              {t("Podés cerrar esta página.")}
            </p>
          </div>
        )}

        {state.status === "error" && (
          <div className="flex flex-col gap-3">
            <p className="text-destructive font-medium">{state.message}</p>
            <Button
              className="primary bg-[#4267b2] hover:bg-[#4267b2]/90 text-white w-full"
              onClick={() => {
                setState({
                  status: "valid",
                  organization_name: "",
                });
                // Re-validate token
                const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-management/onboard?token=${token}`;
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
              }}
            >
              {t("Reintentar")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
