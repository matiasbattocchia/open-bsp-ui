import { useEffect } from "react";
import { supabase } from "@/supabase/client";
import { Translate as T } from "react-dialect";

const FB_API_VERSION = "v24.0";

export type SignupPayload = {
  code: string;
  application_id?: string;
  organization_id: string;
  phone_number_id?: string;
  waba_id?: string;
  business_id?: string;
  flow_type?: "only_waba" | "new_phone_number" | "existing_phone_number";
};

export default function WhatsAppIntegration({
  orgId,
  onSuccess,
  setLoading,
}: {
  orgId: string;
  onSuccess: () => void;
  setLoading: (loading: boolean) => void;
}) {
  useEffect(() => {
    let sessionInfoListener: ((event: MessageEvent) => void) | null = null;

    (window as any).fbAsyncInit = function () {
      (window as any).FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: FB_API_VERSION,
      });
    };

    // Session info listener for capturing WhatsApp Business Account details
    sessionInfoListener = function (event: MessageEvent) {
      console.log("event received", event);

      if (!event.origin.endsWith("facebook.com")) return;

      try {
        const data = event.data;

        console.log("event data", data);

        if (data.type === "WA_EMBEDDED_SIGNUP") {
          console.log("WA_EMBEDDED_SIGNUP event:", data); // Remove after testing

          // Determine flow type based on event
          let flow_type: SignupPayload["flow_type"] | undefined;

          if (data.event === "FINISH") {
            flow_type = "new_phone_number";
          } else if (data.event === "FINISH_ONLY_WABA") {
            flow_type = "only_waba";
          } else if (data.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING") {
            flow_type = "existing_phone_number";
          }

          // Store session info for later use in signup
          if (flow_type) {
            const sessionInfo = data.data || {};
            (window as any).__waSessionInfo = {
              phone_number_id: sessionInfo.phone_number_id,
              waba_id: sessionInfo.waba_id,
              business_id: sessionInfo.business_id,
              flow_type: flow_type,
            };
          }
        }
      } catch {
        console.error("could not JSON parse event data");
        // Not a JSON message or not a WA event, ignore
      }
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

  // Facebook Login with JavaScript SDK
  function launchWhatsAppSignup() {
    // Launch Facebook login
    (window as any).FB.login(
      function (response: any) {
        if (response.authResponse) {
          // Exchange this code for a business integration system user access token
          const code = response.authResponse.code;

          if (!code) {
            console.log("User cancelled login or did not fully authorize.");
            return;
          }

          setLoading(true);

          // Retrieve session info captured from message events
          const sessionInfo = (window as any).__waSessionInfo || {};

          // Construct payload according to SignupPayload type
          const payload: SignupPayload = {
            code,
            organization_id: orgId,
            application_id: process.env.NEXT_PUBLIC_META_APP_ID,
            phone_number_id: sessionInfo.phone_number_id,
            waba_id: sessionInfo.waba_id,
            business_id: sessionInfo.business_id,
            flow_type: sessionInfo.flow_type,
          };

          console.log("Sending signup payload:", payload); // Remove after testing

          supabase.functions
            .invoke("whatsapp-management/signup", {
              method: "POST",
              body: payload,
            })
            .then(onSuccess)
            .finally(() => setLoading(false));
        } else {
          console.log("User cancelled login or did not fully authorize.");
        }
      },
      {
        config_id: process.env.NEXT_PUBLIC_FB_LOGIN_CONFIG_ID, // Configuration ID obtained in https://developers.facebook.com/apps/629323992623834/business-login/configurations/?business_id=153181867762503
        response_type: "code", // Must be set to 'code' for System User access token
        override_default_response_type: true,
        extras: {
          featureType: "whatsapp_business_app_onboarding", // Coexistence
          setup: {
            // Prefilled data can go here
          },
        },
      },
    );
  }

  return (
    <div>
      <T
        as="button"
        style={{
          background: "#4267b2",
          borderRadius: "7.5px",
          color: "white",
          height: "40px",
          textAlign: "center",
          width: "250px",
        }}
        onClick={launchWhatsAppSignup}
      >
        Continuar con Facebook
      </T>
    </div>
  );
}
