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
          setup: {},
          featureType: "whatsapp_business_app_onboarding", // Coexistence
          sessionInfoVersion: "3", // Required for receiving embedded signup events
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
