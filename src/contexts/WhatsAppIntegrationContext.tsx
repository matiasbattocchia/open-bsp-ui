import {
  createContext,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useWhatsAppSignup } from "@/queries/useWhatsAppSignup";
import useBoundStore from "@/stores/useBoundStore";

const FB_API_VERSION = "v25.0";

export type SignupPayload = {
  code: string;
  application_id?: string;
  organization_id?: string;
  phone_number_id?: string;
  waba_id?: string;
  business_id?: string;
  flow_type?: "only_waba" | "new_phone_number" | "existing_phone_number";
  callback_url?: string;
  verify_token?: string;
};

export type SignupOptions = {
  callback_url?: string;
  verify_token?: string;
};

// Successful flow data
type SuccessfulFlowData = {
  phone_number_id: string;
  waba_id: string;
  business_id: string;
  ad_account_ids?: string[];
  page_ids?: string[];
  dataset_ids?: string[];
};

// Abandoned flow data
type AbandonedFlowData = {
  current_step: string;
};

// Error flow data
type ErrorFlowData = {
  error_message: string;
  error_id: string;
  session_id: string;
  timestamp: string;
};

// Event listener data type - discriminated union based on event type
type EventListenerData =
  | {
    type: "WA_EMBEDDED_SIGNUP";
    event:
    | "FINISH"
    | "FINISH_ONLY_WABA"
    | "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING";
    data: SuccessfulFlowData;
  }
  | {
    type: "WA_EMBEDDED_SIGNUP";
    event: "CANCEL";
    data: AbandonedFlowData | ErrorFlowData;
  };

type WhatsAppIntegrationContextType = {
  launchWhatsAppSignup: (
    onSuccess: (phone_number_id: string) => void,
    setLoading: (loading: boolean) => void,
    options?: SignupOptions,
  ) => void;
};

export const WhatsAppIntegrationContext = createContext<
  WhatsAppIntegrationContextType | undefined
>(undefined);

export function WhatsAppIntegrationProvider({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    let sessionInfoListener: ((event: MessageEvent) => void) | null = null;

    (window as any).fbAsyncInit = function () {
      (window as any).FB.init({
        appId: import.meta.env.VITE_META_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: FB_API_VERSION,
      });
    };

    // Session info listener for capturing WhatsApp Business Account details
    sessionInfoListener = function (event: MessageEvent) {
      // Verify message is from Facebook
      if (!event.origin.endsWith("facebook.com")) {
        return;
      }

      // Filter out messages that are not valid JSON or not from Embedded Signup
      if (
        typeof event.data !== "string" ||
        !event.data.includes("WA_EMBEDDED_SIGNUP")
      ) {
        return;
      }

      let data: EventListenerData;

      try {
        data = JSON.parse(event.data);
      } catch (error) {
        console.error("Could not JSON parse event data", error);
        return;
      }

      if (data.type !== "WA_EMBEDDED_SIGNUP") {
        return;
      }

      // Handle cancel events (abandoned or error flows)
      if (data.event === "CANCEL") {
        // TypeScript now knows data.data is AbandonedFlowData | ErrorFlowData
        if ("error_message" in data.data) {
          // ErrorFlowData
          console.warn("Embedded signup error:", data.data);
        } else {
          // AbandonedFlowData
          console.log("User abandoned flow at step:", data.data.current_step);
        }
        return;
      }

      let flow_type: SignupPayload["flow_type"];

      if (data.event === "FINISH") {
        flow_type = "new_phone_number";
      } else if (data.event === "FINISH_ONLY_WABA") {
        flow_type = "only_waba";
      } else if (data.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING") {
        flow_type = "existing_phone_number";
      } else {
        console.warn("Unhandled event", data);
        return;
      }

      // No type assertion needed - TypeScript knows data.data is SuccessfulFlowData
      (window as any).__waSessionInfo = {
        phone_number_id: data.data.phone_number_id,
        waba_id: data.data.waba_id,
        business_id: data.data.business_id,
        flow_type: flow_type,
      };
    };

    window.addEventListener("message", sessionInfoListener);

    // Copy-pasted from the Embedded Signup integration helper
    (function (d, s, id) {
      var js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s) as any;
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode?.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");

    return () => {
      (window as any).fbAsyncInit = undefined;
      if (sessionInfoListener) {
        window.removeEventListener("message", sessionInfoListener);
      }
    };
  }, []);

  const { mutateAsync: signup } = useWhatsAppSignup();
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  const launchWhatsAppSignup = useCallback(
    (
      onSuccess: (phone_number_id: string) => void,
      setLoading: (loading: boolean) => void,
      options?: SignupOptions,
    ) => {
      // Launch Facebook login
      (window as any).FB.login(
        function (response: any) {
          if (response.authResponse) {
            const code = response.authResponse.code;

            console.log("🚀 TARGET META AUTH CODE:", code);
            
            if (!code) {
              console.log("User cancelled login or did not fully authorize.");
              return;
            }

            const doSignup = (sessionInfo: Record<string, unknown>) => {
              setLoading(true);

              const payload: SignupPayload = {
                code,
                application_id: import.meta.env.VITE_META_APP_ID,
                organization_id: activeOrgId || undefined,
                phone_number_id: sessionInfo.phone_number_id as string | undefined,
                waba_id: sessionInfo.waba_id as string | undefined,
                business_id: sessionInfo.business_id as string | undefined,
                flow_type: sessionInfo.flow_type as SignupPayload["flow_type"],
                callback_url: options?.callback_url || undefined,
                verify_token: options?.verify_token || undefined,
              };

              signup(payload)
                .then((data) => {
                  onSuccess(
                    (data as Record<string, unknown>)?.phone_number_id as string ||
                      (sessionInfo.phone_number_id as string) ||
                      "",
                  );
                })
                .catch((error: Error) => {
                  console.error("Signup failed:", error);
                })
                .finally(() => {
                  setLoading(false);
                });
            };

            const sessionInfo =
              (window as any).__waSessionInfo || {};

            if (sessionInfo.phone_number_id && sessionInfo.waba_id) {
              doSignup(sessionInfo);
              return;
            }

            // Race: FB.login fired before the postMessage with WABA details arrived.
            // Set up a one-shot listener to capture it.
            let timedOut = false;
            const timeout = setTimeout(() => {
              timedOut = true;
              window.removeEventListener("message", onMessage);
              console.error(
                "Timed out waiting for WhatsApp Embedded Signup session info postMessage",
              );
            }, 30_000);

            const onMessage = (event: MessageEvent) => {
              if (timedOut) return;

              if (!event.origin.endsWith("facebook.com")) return;
              if (
                typeof event.data !== "string" ||
                !event.data.includes("WA_EMBEDDED_SIGNUP")
              ) return;

              let data: EventListenerData;
              try {
                data = JSON.parse(event.data);
              } catch {
                return;
              }

              if (
                data.type !== "WA_EMBEDDED_SIGNUP" ||
                data.event === "CANCEL"
              ) return;

              const info = data.data as SuccessfulFlowData;

              let flow_type: SignupPayload["flow_type"];
              if (data.event === "FINISH") {
                flow_type = "new_phone_number";
              } else if (data.event === "FINISH_ONLY_WABA") {
                flow_type = "only_waba";
              } else if (data.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING") {
                flow_type = "existing_phone_number";
              } else return;

              window.removeEventListener("message", onMessage);
              clearTimeout(timeout);

              doSignup({
                phone_number_id: info.phone_number_id,
                waba_id: info.waba_id,
                business_id: info.business_id,
                flow_type,
              });
            };

            window.addEventListener("message", onMessage);
          } else {
            console.log("User cancelled login or did not fully authorize.");
          }
        },
        {
          config_id: import.meta.env.VITE_FB_LOGIN_CONFIG_ID, // Configuration ID obtained in https://developers.facebook.com/apps/629323992623834/business-login/configurations/?business_id=153181867762503
          response_type: "code", // Must be set to 'code' for System User access token
          override_default_response_type: true,
          // Permission scopes requested by the Embedded Signup config_id:
          // - whatsapp_business_management — manage WhatsApp Business Accounts
          // - whatsapp_business_messaging  — send and receive messages
          scope: "whatsapp_business_management,whatsapp_business_messaging",
          extras: {
            setup: {},
            featureType: "whatsapp_business_app_onboarding",
            sessionInfoVersion: "3",
          },
        },
      );
    },
    [activeOrgId],
  );

  return (
    <WhatsAppIntegrationContext.Provider value={{ launchWhatsAppSignup }}>
      {children}
    </WhatsAppIntegrationContext.Provider>
  );
}
